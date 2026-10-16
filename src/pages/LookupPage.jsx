import { useState } from 'react';
import { Building2, MapPin, Search, UserRound } from 'lucide-react';
import { novaApi } from '../api/novaApi';
import StatusBanner from '../components/StatusBanner';

export default function LookupPage() {
  const [type, setType] = useState('DNI');
  const [number, setNumber] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({});
  const [busy, setBusy] = useState(false);
  const max = type === 'DNI' ? 8 : 11;
  async function lookup() {
    if (number.length !== max) return setStatus({ type: 'error', text: `El ${type} debe tener ${max} dígitos.` });
    setBusy(true); setResult(null); setStatus({ type: 'info', text: 'Consultando el proveedor y validando datos…' });
    try {
      const data = type === 'DNI' ? await novaApi.lookupDni(number) : await novaApi.lookupRuc(number);
      setResult(data); setStatus({ type: data.valido ? 'success' : 'error', text: data.mensaje });
    } catch (error) { setStatus({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  }
  return <section className="page-stack"><div className="panel lookup-panel"><div className="section-heading"><div><p className="overline">VALIDACIÓN DE IDENTIDAD</p><h2>Consulta de personas y empresas</h2><p>Revisa los datos antes de emitir un comprobante.</p></div></div>
    <div className="segmented"><button className={type === 'DNI' ? 'active' : ''} onClick={() => { setType('DNI'); setNumber(''); setResult(null); }}>DNI · Persona</button><button className={type === 'RUC' ? 'active' : ''} onClick={() => { setType('RUC'); setNumber(''); setResult(null); }}>RUC · Empresa</button></div>
    <div className="lookup-form"><label>Número de {type}<input value={number} maxLength={max} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))} placeholder={`${max} dígitos`} /></label><button className="button primary" onClick={lookup} disabled={busy}><Search size={17} />Consultar</button></div><StatusBanner status={status} />
  </div>{result && <article className="panel identity-card"><div className="identity-title"><span className="identity-icon">{type === 'DNI' ? <UserRound /> : <Building2 />}</span><div><small>{result.tipoDocumento} {result.numeroDocumento}</small><h3>{result.nombreCompleto || result.razonSocial}</h3><p>{result.nombreComercial}</p></div><span className={`badge ${result.valido ? 'success' : 'danger'}`}>{result.valido ? 'VALIDADO' : 'OBSERVADO'}</span></div><div className="detail-grid">{type === 'DNI' && <><div><span>Nombres</span><strong>{result.nombres || '—'}</strong></div><div><span>Apellidos</span><strong>{result.apellidos || '—'}</strong></div></>}{type === 'RUC' && <><div><span>Estado SUNAT</span><strong>{result.estado || '—'}</strong></div><div><span>Condición</span><strong>{result.condicion || '—'}</strong></div></>}<div className="wide"><span><MapPin size={14} /> Dirección registrada</span><strong>{result.direccion || 'No informada'}</strong></div><div><span>Ubigeo</span><strong>{result.ubigeo || '—'}</strong></div><div><span>Localidad</span><strong>{[result.distrito, result.provincia, result.departamento].filter(Boolean).join(', ') || '—'}</strong></div></div></article>}</section>;
}
