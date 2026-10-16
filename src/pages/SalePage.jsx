import { useMemo, useState } from 'react';
import { BadgeCheck, Building2, Minus, Plus, Search, ShoppingBasket, Trash2, UserRound } from 'lucide-react';
import { novaApi } from '../api/novaApi';
import InvoiceDocument from '../components/InvoiceDocument';
import StatusBanner from '../components/StatusBanner';
import { money } from '../utils/format';

export default function SalePage({ products, employee, onCreated }) {
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('TODOS');
  const [type, setType] = useState('BOLETA');
  const [dni, setDni] = useState('');
  const [ruc, setRuc] = useState('');
  const [payment, setPayment] = useState('TARJETA');
  const [identity, setIdentity] = useState(null);
  const [lastDocument, setLastDocument] = useState(null);
  const [status, setStatus] = useState({ type: 'info', text: 'Caja lista para registrar una venta.' });
  const [busy, setBusy] = useState(false);
  const categories = ['TODOS', ...new Set(products.map((p) => p.categoria).filter(Boolean))];
  const filtered = products.filter((p) => (category === 'TODOS' || p.categoria === category) && `${p.nombre} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));
  const totals = useMemo(() => { const total = cart.reduce((sum, item) => sum + Number(item.producto.precio) * item.cantidad, 0); return { total, subtotal: total / 1.18, igv: total - total / 1.18, units: cart.reduce((sum, item) => sum + item.cantidad, 0) }; }, [cart]);

  function add(product) { setCart((current) => { const found = current.find((item) => item.producto.id === product.id); if (!found) return [...current, { producto: product, cantidad: 1 }]; if (found.cantidad >= product.stock) return current; return current.map((item) => item.producto.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item); }); }
  function quantity(id, delta) { setCart((current) => current.map((item) => item.producto.id === id ? { ...item, cantidad: Math.max(1, Math.min(item.producto.stock, item.cantidad + delta)) } : item)); }
  async function validateIdentity() {
    const number = type === 'FACTURA' ? ruc : dni; const length = type === 'FACTURA' ? 11 : 8;
    if (number.length !== length) return setStatus({ type: 'error', text: `Completa los ${length} dígitos del ${type === 'FACTURA' ? 'RUC' : 'DNI'}.` });
    setBusy(true);
    try { const data = type === 'FACTURA' ? await novaApi.lookupRuc(ruc) : await novaApi.lookupDni(dni); setIdentity(data); setStatus({ type: data.valido ? 'success' : 'error', text: data.mensaje }); }
    catch (error) { setStatus({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  }
  async function issue() {
    if (!cart.length) return setStatus({ type: 'error', text: 'Agrega productos a la venta.' });
    if (!identity?.valido) return setStatus({ type: 'error', text: 'Valida primero el documento del cliente.' });
    setBusy(true);
    try {
      const result = await novaApi.createSale({ tipoComprobante: type, dniCliente: dni, rucEmpresa: type === 'FACTURA' ? ruc : '', metodoPago: payment, codigoCajero: employee.codigoEmpleado, items: cart.map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad })) });
      setLastDocument(result); setCart([]); setIdentity(null); setStatus({ type: 'success', text: `${result.numero} emitido correctamente.` }); await onCreated();
    } catch (error) { setStatus({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  }
  return <section className="page-stack"><StatusBanner status={status} /><div className="sale-layout"><section className="panel catalog"><div className="section-heading"><div><p className="overline">CATÁLOGO</p><h2>Productos disponibles</h2></div><ShoppingBasket /></div><label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto o SKU" /></label><div className="chips">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="product-grid">{filtered.map((product) => <button key={product.id} className="product-card" onClick={() => add(product)} disabled={product.stock <= 0}><span>{product.categoria}</span><strong>{product.nombre}</strong><small>{product.sku}</small><div><b>{money(product.precio)}</b><em>{product.stock} disponibles</em></div></button>)}</div></section><section className="panel checkout"><div className="section-heading"><div><p className="overline">VENTA EN CURSO</p><h2>{totals.units} unidades</h2></div><strong className="amount">{money(totals.total)}</strong></div><div className="segmented"><button className={type === 'BOLETA' ? 'active' : ''} onClick={() => { setType('BOLETA'); setIdentity(null); }}>Boleta</button><button className={type === 'FACTURA' ? 'active' : ''} onClick={() => { setType('FACTURA'); setIdentity(null); }}>Factura</button></div><div className="customer-form"><label><span>{type === 'FACTURA' ? <Building2 size={15} /> : <UserRound size={15} />}{type === 'FACTURA' ? 'RUC empresa' : 'DNI cliente'}</span><div className="inline-input"><input value={type === 'FACTURA' ? ruc : dni} maxLength={type === 'FACTURA' ? 11 : 8} onChange={(e) => type === 'FACTURA' ? setRuc(e.target.value.replace(/\D/g, '')) : setDni(e.target.value.replace(/\D/g, ''))} /><button onClick={validateIdentity}>Validar</button></div></label>{identity && <div className="identity-inline"><strong>{identity.nombreCompleto || identity.razonSocial}</strong><span>{identity.direccion || 'Sin dirección registrada'}</span>{type === 'FACTURA' && <small>{identity.estado} · {identity.condicion}</small>}</div>}<label><span>Medio de pago</span><select value={payment} onChange={(e) => setPayment(e.target.value)}><option>TARJETA</option><option>EFECTIVO</option><option>YAPE</option><option>PLIN</option></select></label></div><div className="cart">{cart.map((item) => <div className="cart-item" key={item.producto.id}><div><strong>{item.producto.nombre}</strong><span>{money(item.producto.precio)} c/u</span></div><div className="quantity"><button onClick={() => quantity(item.producto.id, -1)}><Minus size={13} /></button><b>{item.cantidad}</b><button onClick={() => quantity(item.producto.id, 1)}><Plus size={13} /></button><button className="remove" onClick={() => setCart((current) => current.filter((row) => row.producto.id !== item.producto.id))}><Trash2 size={14} /></button></div></div>)}{!cart.length && <div className="empty">El carrito está vacío.</div>}</div><div className="totals"><span>Subtotal <b>{money(totals.subtotal)}</b></span><span>IGV (18%) <b>{money(totals.igv)}</b></span><strong>Total <b>{money(totals.total)}</b></strong></div><button className="button primary issue" onClick={issue} disabled={busy}><BadgeCheck size={18} />Emitir {type.toLowerCase()}</button></section></div>{lastDocument && <section className="last-document"><div className="section-heading"><div><p className="overline">ÚLTIMA EMISIÓN</p><h2>Comprobante generado</h2></div></div><InvoiceDocument document={lastDocument} /></section>}</section>;
}
