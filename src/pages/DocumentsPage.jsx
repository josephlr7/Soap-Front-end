import { useMemo, useState } from 'react';
import { Ban, FileSearch, Search } from 'lucide-react';
import { novaApi } from '../api/novaApi';
import InvoiceDocument from '../components/InvoiceDocument';
import StatusBanner from '../components/StatusBanner';
import { dateTime, money } from '../utils/format';

export default function DocumentsPage({ documents, onChanged }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('TODOS');
  const [selected, setSelected] = useState(documents[0] || null);
  const [status, setStatus] = useState({});
  const filtered = useMemo(() => documents.filter((item) => {
    const text = `${item.numero} ${item.cliente} ${item.empresa} ${item.dniCliente} ${item.rucEmpresa}`.toLowerCase();
    return (state === 'TODOS' || item.estado === state) && text.includes(query.toLowerCase());
  }), [documents, query, state]);

  async function cancel() {
    if (!selected || selected.estado === 'ANULADO') return;
    if (!window.confirm(`¿Anular ${selected.numero}? Se repondrá el stock de todos sus productos.`)) return;
    try {
      const updated = await novaApi.cancelDocument(selected.numero);
      setSelected(updated); setStatus({ type: 'success', text: updated.mensaje }); await onChanged();
    } catch (error) { setStatus({ type: 'error', text: error.message }); }
  }

  return <section className="documents-layout"><section className="panel document-list"><div className="section-heading"><div><p className="overline">GESTIÓN DOCUMENTARIA</p><h2>Facturas y boletas</h2><p>Busca, revisa, imprime o anula comprobantes.</p></div><FileSearch /></div><div className="list-filters"><label className="search-field"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Número, cliente, DNI o RUC" /></label><select value={state} onChange={(e) => setState(e.target.value)}><option>TODOS</option><option>EMITIDO</option><option>ANULADO</option></select></div><div className="document-rows">{filtered.map((item) => <button key={item.numero} className={selected?.numero === item.numero ? 'document-row active' : 'document-row'} onClick={() => setSelected(item)}><div><strong>{item.numero}</strong><span>{dateTime(item.fechaEmision)}</span></div><div><b>{item.empresa || item.cliente}</b><span>{item.tipoComprobante} · {item.metodoPago}</span></div><div className="row-total"><strong>{money(item.total)}</strong><span className={`badge ${item.estado === 'ANULADO' ? 'danger' : 'success'}`}>{item.estado}</span></div></button>)}{!filtered.length && <div className="empty">No hay comprobantes para estos filtros.</div>}</div></section><section className="document-preview"><StatusBanner status={status} />{selected && <div className="preview-toolbar no-print"><button className="button danger" onClick={cancel} disabled={selected.estado === 'ANULADO'}><Ban size={16} />Anular y reponer stock</button></div>}<InvoiceDocument document={selected} /></section></section>;
}
