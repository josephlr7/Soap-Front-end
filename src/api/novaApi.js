const BACKEND_HOST = window.location.hostname || 'localhost';
const BASE_URL = import.meta.env.VITE_API_URL || `http://${BACKEND_HOST}:8085/api`;

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(data?.message || data?.error || data || `Error HTTP ${response.status}`);
  return data;
}

export const novaApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  products: () => request('/caja/productos'),
  documents: () => request('/caja/comprobantes'),
  summary: () => request('/caja/resumen'),
  lookupDni: (dni) => request(`/caja/consultas/dni/${dni}`),
  lookupRuc: (ruc) => request(`/caja/consultas/ruc/${ruc}`),
  createSale: (sale) => request('/caja/ventas', { method: 'POST', body: JSON.stringify(sale) }),
  cancelDocument: (number) => request(`/caja/comprobantes/${encodeURIComponent(number)}/anular`, { method: 'PUT' })
};
