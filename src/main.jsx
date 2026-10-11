import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  BadgeCheck,
  Barcode,
  Building2,
  CheckCircle2,
  CreditCard,
  FileSearch,
  FileText,
  Minus,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Trash2,
  UserRound
} from 'lucide-react';
import './styles.css';

const BACKEND_HOST = window.location.hostname || 'localhost';
const API = `http://${BACKEND_HOST}:8085/api/caja`;
const AUTH_API = `http://${BACKEND_HOST}:8085/api/auth`;
const SESSION_KEY = 'novamarket.empleado';

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

function App() {
  const [empleado, setEmpleado] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  });
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [comprobante, setComprobante] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('TODOS');
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA');
  const [dniCliente, setDniCliente] = useState('60142383');
  const [rucEmpresa, setRucEmpresa] = useState('20100070970');
  const [metodoPago, setMetodoPago] = useState('TARJETA');
  const [estado, setEstado] = useState({ tipo: 'info', texto: 'Caja lista para iniciar una venta.' });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (empleado) cargarDatosIniciales();
  }, [empleado]);

  async function requestJson(path, options) {
    const response = await fetch(`${API}${path}`, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Error HTTP ${response.status}`);
    }
    return response.json();
  }

  async function login(credenciales) {
    setCargando(true);
    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Usuario o password incorrectos.');
      }
      const data = await response.json();
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
      setEmpleado(data);
      setEstado({ tipo: 'ok', texto: `Sesion iniciada como ${data.nombres}.` });
    } catch (error) {
      setEstado({ tipo: 'error', texto: error.message || 'No se pudo iniciar sesion.' });
    } finally {
      setCargando(false);
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setEmpleado(null);
    setCarrito([]);
    setComprobante(null);
    setProductos([]);
    setHistorial([]);
    setEstado({ tipo: 'info', texto: 'Sesion cerrada.' });
  }

  async function cargarDatosIniciales() {
    setCargando(true);
    try {
      const [productosData, historialData] = await Promise.all([
        requestJson('/productos'),
        requestJson('/comprobantes')
      ]);
      setProductos(productosData);
      setHistorial(historialData);
      setEstado({ tipo: 'ok', texto: 'Productos e historial sincronizados con NovaMarket.' });
    } catch (error) {
      setEstado({ tipo: 'error', texto: 'No se pudo conectar con el backend. Verifica Spring Boot en el puerto 8085.' });
    } finally {
      setCargando(false);
    }
  }

  const categorias = useMemo(() => ['TODOS', ...new Set(productos.map((p) => p.categoria).filter(Boolean))], [productos]);

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideCategoria = categoria === 'TODOS' || producto.categoria === categoria;
      const coincideBusqueda = !query
        || producto.nombre?.toLowerCase().includes(query)
        || producto.sku?.toLowerCase().includes(query)
        || producto.categoria?.toLowerCase().includes(query);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, busqueda, categoria]);

  const resumen = useMemo(() => {
    const total = carrito.reduce((sum, item) => sum + Number(item.producto.precio) * item.cantidad, 0);
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    const unidades = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    return { subtotal, igv, total, unidades };
  }, [carrito]);

  function agregarProducto(producto) {
    if (Number(producto.stock) <= 0) {
      setEstado({ tipo: 'error', texto: `${producto.nombre} no tiene stock disponible.` });
      return;
    }
    setCarrito((actual) => {
      const existe = actual.find((item) => item.producto.id === producto.id);
      if (!existe) return [...actual, { producto, cantidad: 1 }];
      if (existe.cantidad >= Number(producto.stock)) {
        setEstado({ tipo: 'error', texto: `Stock maximo alcanzado para ${producto.nombre}.` });
        return actual;
      }
      return actual.map((item) => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
    });
  }

  function cambiarCantidad(productoId, delta) {
    setCarrito((actual) => actual.map((item) => {
      if (item.producto.id !== productoId) return item;
      const nuevaCantidad = Math.min(Number(item.producto.stock), Math.max(1, item.cantidad + delta));
      return { ...item, cantidad: nuevaCantidad };
    }));
  }

  function quitarProducto(productoId) {
    setCarrito((actual) => actual.filter((item) => item.producto.id !== productoId));
  }

  function validarVenta() {
    if (!carrito.length) return 'Agrega al menos un producto al carrito.';
    if (!/^\d{8}$/.test(dniCliente)) return 'El DNI debe tener 8 digitos.';
    if (tipoComprobante === 'FACTURA' && !/^\d{11}$/.test(rucEmpresa)) return 'Para factura, el RUC debe tener 11 digitos.';
    return null;
  }

  async function emitirComprobante() {
    const error = validarVenta();
    if (error) {
      setEstado({ tipo: 'error', texto: error });
      return;
    }

    setCargando(true);
    setEstado({ tipo: 'info', texto: 'Consultando ApiPeruDev, registrando venta y emitiendo comprobante SOAP...' });

    const body = {
      tipoComprobante,
      dniCliente,
      rucEmpresa: tipoComprobante === 'FACTURA' ? rucEmpresa : '',
      metodoPago,
      codigoCajero: empleado.codigoEmpleado,
      items: carrito.map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad }))
    };

    try {
      const data = await requestJson('/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setComprobante(data);
      setCarrito([]);
      setEstado({ tipo: 'ok', texto: 'Comprobante emitido correctamente y guardado en MySQL.' });
      await cargarDatosIniciales();
    } catch (error) {
      setEstado({ tipo: 'error', texto: error.message || 'No se pudo emitir el comprobante.' });
    } finally {
      setCargando(false);
    }
  }

  if (!empleado) {
    return <LoginScreen onLogin={login} estado={estado} cargando={cargando} />;
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand-block"><div className="brand-mark">N</div><div><strong>NovaMarket</strong><span>POS de facturacion electronica</span></div></div>
        <div className="cashier-card"><span>Cajero activo</span><strong>{empleado.codigoEmpleado}</strong><small>{empleado.nombres}</small></div>
        <div className="side-stat"><ShoppingCart size={18} /><div><span>Carrito</span><strong>{resumen.unidades} unidades</strong></div></div>
        <div className="side-stat"><ReceiptText size={18} /><div><span>Total actual</span><strong>{money(resumen.total)}</strong></div></div>
        <StatusBox estado={estado} />
      </aside>

      <section className="content">
        <header className="topbar"><div><p className="eyebrow">Caja de supermercado</p><h1>Venta rapida con comprobante digital</h1></div><div className="top-actions"><button className="secondary-action" onClick={cargarDatosIniciales} disabled={cargando}><RefreshCcw size={17} />Sincronizar</button><button className="secondary-action" onClick={logout}><ShieldCheck size={17} />Salir</button></div></header>
        <section className="summary-grid"><Metric title="Productos" value={productos.length} helper="catalogo activo" icon={<ShoppingBasket size={20} />} /><Metric title="Comprobantes" value={historial.length} helper="emitidos" icon={<FileText size={20} />} /><Metric title="Importe" value={money(resumen.total)} helper="venta actual" icon={<CreditCard size={20} />} /></section>
        <section className="work-grid">
          <section className="panel catalog-panel">
            <div className="panel-header"><div><h2>Catalogo</h2><span>Selecciona productos para el carrito de caja.</span></div><Barcode size={22} /></div>
            <div className="filters"><label className="search-box"><Search size={18} /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, SKU o categoria" /></label><div className="chips" role="list" aria-label="Categorias">{categorias.map((item) => <button key={item} className={categoria === item ? 'chip active' : 'chip'} onClick={() => setCategoria(item)}>{item}</button>)}</div></div>
            <div className="product-grid">{productosFiltrados.map((producto) => <button className="product-card" key={producto.id} onClick={() => agregarProducto(producto)}><span>{producto.categoria || 'General'}</span><strong>{producto.nombre}</strong><small>SKU {producto.sku}</small><div><b>{money(producto.precio)}</b><em>Stock {producto.stock}</em></div></button>)}{!productosFiltrados.length && <EmptyState text="No hay productos que coincidan con la busqueda." />}</div>
          </section>
          <section className="panel checkout-panel">
            <div className="panel-header compact"><div><h2>Venta actual</h2><span>Datos del cliente y pago.</span></div><CreditCard size={22} /></div>
            <div className="segmented">{['FACTURA', 'BOLETA'].map((tipo) => <button key={tipo} className={tipoComprobante === tipo ? 'active' : ''} onClick={() => setTipoComprobante(tipo)}>{tipo}</button>)}</div>
            <div className="form-grid"><label><span><UserRound size={15} /> DNI cliente</span><input value={dniCliente} maxLength="8" onChange={(e) => setDniCliente(e.target.value.replace(/\D/g, ''))} /></label>{tipoComprobante === 'FACTURA' && <label><span><Building2 size={15} /> RUC empresa</span><input value={rucEmpresa} maxLength="11" onChange={(e) => setRucEmpresa(e.target.value.replace(/\D/g, ''))} /></label>}<label className="full"><span><CreditCard size={15} /> Metodo de pago</span><select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}><option value="TARJETA">Tarjeta</option><option value="EFECTIVO">Efectivo</option><option value="YAPE">Yape</option><option value="PLIN">Plin</option></select></label></div>
            <div className="cart-list">{carrito.map((item) => <article className="cart-row" key={item.producto.id}><div><strong>{item.producto.nombre}</strong><span>{money(item.producto.precio)} c/u</span></div><div className="qty-control"><button onClick={() => cambiarCantidad(item.producto.id, -1)}><Minus size={14} /></button><b>{item.cantidad}</b><button onClick={() => cambiarCantidad(item.producto.id, 1)}><Plus size={14} /></button><button className="danger" onClick={() => quitarProducto(item.producto.id)}><Trash2 size={14} /></button></div></article>)}{!carrito.length && <EmptyState text="El carrito esta vacio." />}</div>
            <div className="totals"><span>Subtotal <b>{money(resumen.subtotal)}</b></span><span>IGV 18% <b>{money(resumen.igv)}</b></span><strong>Total <b>{money(resumen.total)}</b></strong></div><button className="primary-action" onClick={emitirComprobante} disabled={cargando}><BadgeCheck size={19} />Emitir comprobante</button>
          </section>
        </section>
        <section className="lower-grid"><section className="panel receipt-panel"><div className="panel-header compact"><div><h2>Ultimo comprobante</h2><span>Respuesta de facturacion.</span></div><ReceiptText size={22} /></div>{comprobante ? <Receipt data={comprobante} /> : <EmptyState text="Aun no se emitio ningun comprobante en esta sesion." />}</section><section className="panel history-panel"><div className="panel-header compact"><div><h2>Historial reciente</h2><span>Comprobantes guardados en base de datos.</span></div><FileSearch size={22} /></div><div className="history-list">{historial.slice(-8).reverse().map((item) => <article className="history-row" key={item.numero || item.codigoOperacionInterna}><strong>{item.numero}</strong><span>{item.cliente || 'Cliente registrado'}</span><b>{money(item.total)}</b></article>)}{!historial.length && <EmptyState text="Todavia no hay comprobantes emitidos." />}</div></section></section>
      </section>
    </main>
  );
}

function LoginScreen({ onLogin, estado, cargando }) {
  const [usuario, setUsuario] = useState('cajero');
  const [password, setPassword] = useState('');

  function submit(event) {
    event.preventDefault();
    onLogin({ usuario, password });
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-block login-brand"><div className="brand-mark">N</div><div><strong>NovaMarket</strong><span>Acceso de empleados</span></div></div>
        <form className="login-form" onSubmit={submit}>
          <label><span>Usuario</span><input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" /></label>
          <label><span>Password</span><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" /></label>
          <button className="primary-action" disabled={cargando || !usuario || !password}><ShieldCheck size={19} />Ingresar a caja</button>
        </form>
        <StatusBox estado={estado} />
      </section>
    </main>
  );
}

function Metric({ title, value, helper, icon }) { return <article className="metric-card"><div>{icon}</div><span>{title}</span><strong>{value}</strong><small>{helper}</small></article>; }
function StatusBox({ estado }) { const Icon = estado.tipo === 'ok' ? CheckCircle2 : estado.tipo === 'error' ? AlertCircle : RefreshCcw; return <div className={`status-box ${estado.tipo}`}><Icon size={18} /><span>{estado.texto}</span></div>; }
function EmptyState({ text }) { return <p className="empty-state">{text}</p>; }
function Receipt({ data }) { return <article className="receipt-card"><div className="receipt-title"><span>{data.tipoComprobante || 'COMPROBANTE'}</span><strong>{data.numero}</strong></div><p>{data.mensaje || 'Aceptado por el simulador SOAP.'}</p><dl><div><dt>Cliente</dt><dd>{data.cliente || 'Sin nombre'}</dd></div><div><dt>Empresa</dt><dd>{data.empresa || 'Consumidor final'}</dd></div><div><dt>Total</dt><dd>{money(data.total)}</dd></div><div><dt>Operacion</dt><dd>{data.codigoOperacionInterna || 'Registrada'}</dd></div></dl><small>{data.hashFirma}</small></article>; }
createRoot(document.getElementById('root')).render(<App />);
