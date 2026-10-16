import { BarChart3, FileText, LogOut, RefreshCw, ScanSearch, ShoppingCart, Store } from 'lucide-react';

const NAV = [
  { id: 'caja', label: 'Punto de venta', icon: ShoppingCart },
  { id: 'comprobantes', label: 'Comprobantes', icon: FileText },
  { id: 'consultas', label: 'RENIEC / SUNAT', icon: ScanSearch }
];

export default function AppShell({ employee, view, setView, onRefresh, onLogout, busy, children }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="logo"><Store size={23} /></span><div><strong>NovaMarket</strong><small>Facturación & caja</small></div></div>
      <nav>{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={18} />{label}</button>)}</nav>
      <div className="sidebar-note"><BarChart3 size={18} /><div><span>Sesión activa</span><strong>{employee.nombres}</strong><small>{employee.codigoEmpleado} · {employee.rol}</small></div></div>
      <button className="nav-logout" onClick={onLogout}><LogOut size={17} />Cerrar sesión</button>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><p className="overline">OPERACIÓN COMERCIAL</p><h1>{NAV.find((item) => item.id === view)?.label}</h1></div><button className="button ghost" onClick={onRefresh} disabled={busy}><RefreshCw size={17} className={busy ? 'spin' : ''} />Sincronizar</button></header>
      {children}
    </main>
  </div>;
}
