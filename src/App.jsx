import { useEffect, useState } from 'react';
import { AlertTriangle, Banknote, FileCheck2, PackageSearch } from 'lucide-react';
import { novaApi } from './api/novaApi';
import AppShell from './components/AppShell';
import LoginScreen from './components/LoginScreen';
import MetricCard from './components/MetricCard';
import StatusBanner from './components/StatusBanner';
import DocumentsPage from './pages/DocumentsPage';
import LookupPage from './pages/LookupPage';
import SalePage from './pages/SalePage';
import { money } from './utils/format';

const SESSION_KEY = 'novamarket.empleado';

export default function App() {
  const [employee, setEmployee] = useState(() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } });
  const [view, setView] = useState('caja');
  const [products, setProducts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({});
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({});

  async function refresh(showMessage = true) {
    if (!employee) return;
    setBusy(true);
    try {
      const [productData, documentData, summaryData] = await Promise.all([novaApi.products(), novaApi.documents(), novaApi.summary()]);
      setProducts(productData); setDocuments(documentData); setSummary(summaryData);
      if (showMessage) setStatus({ type: 'success', text: 'Información sincronizada con el backend.' });
    } catch (error) { setStatus({ type: 'error', text: error.message || 'No fue posible conectar con el backend.' }); }
    finally { setBusy(false); }
  }

  useEffect(() => { if (employee) refresh(false); }, [employee]);

  async function login(credentials) {
    setBusy(true);
    try { const data = await novaApi.login(credentials); localStorage.setItem(SESSION_KEY, JSON.stringify(data)); setEmployee(data); setStatus({ type: 'success', text: `Bienvenido, ${data.nombres}.` }); }
    catch (error) { setStatus({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  }
  function logout() { localStorage.removeItem(SESSION_KEY); setEmployee(null); setProducts([]); setDocuments([]); setSummary({}); setStatus({ type: 'info', text: 'Sesión cerrada correctamente.' }); }

  if (!employee) return <LoginScreen onLogin={login} busy={busy} status={status} />;
  return <AppShell employee={employee} view={view} setView={setView} onRefresh={refresh} onLogout={logout} busy={busy}>
    <section className="metrics-grid">
      <MetricCard label="Ventas vigentes" value={money(summary.ventasAcumuladas)} helper={`${summary.comprobantesEmitidos || 0} comprobantes emitidos`} icon={<Banknote />} />
      <MetricCard label="Documentos" value={summary.comprobantes || 0} helper={`${summary.comprobantesAnulados || 0} anulados`} icon={<FileCheck2 />} />
      <MetricCard label="Catálogo" value={summary.productos || products.length} helper={`${summary.productosStockBajo || 0} con stock bajo`} icon={<PackageSearch />} />
      <MetricCard label="Terceros" value={(summary.clientes || 0) + (summary.empresas || 0)} helper="clientes y empresas identificados" icon={<AlertTriangle />} />
    </section>
    <StatusBanner status={status} />
    {view === 'caja' && <SalePage products={products} employee={employee} onCreated={() => refresh(false)} />}
    {view === 'comprobantes' && <DocumentsPage documents={documents} onChanged={() => refresh(false)} />}
    {view === 'consultas' && <LookupPage />}
  </AppShell>;
}
