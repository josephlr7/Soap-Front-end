import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function StatusBanner({ status }) {
  if (!status?.text) return null;
  const Icon = status.type === 'error' ? AlertCircle : status.type === 'success' ? CheckCircle2 : Info;
  return <div className={`status-banner ${status.type || 'info'}`}><Icon size={18} /><span>{status.text}</span></div>;
}
