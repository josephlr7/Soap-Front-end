import { useState } from 'react';
import { LockKeyhole, Store } from 'lucide-react';
import StatusBanner from './StatusBanner';

export default function LoginScreen({ onLogin, busy, status }) {
  const [usuario, setUsuario] = useState('cajero');
  const [password, setPassword] = useState('');
  return <main className="login-shell"><section className="login-card">
    <div className="login-copy"><span className="logo"><Store size={25} /></span><div><p className="overline">NOVA SUITE</p><h1>Control de caja y facturación</h1><p>Acceso seguro al entorno operativo de NovaMarket.</p></div></div>
    <form onSubmit={(event) => { event.preventDefault(); onLogin({ usuario, password }); }}>
      <label>Usuario<input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" /></label>
      <label>Contraseña<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" /></label>
      <button className="button primary" disabled={busy || !usuario || !password}><LockKeyhole size={17} />Ingresar</button>
    </form>
    <StatusBanner status={status} />
  </section></main>;
}
