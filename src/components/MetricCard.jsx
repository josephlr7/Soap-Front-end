export default function MetricCard({ label, value, helper, icon }) {
  return <article className="metric"><span className="metric-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}
