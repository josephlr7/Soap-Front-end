export const money = (value) => new Intl.NumberFormat('es-PE', {
  style: 'currency', currency: 'PEN', minimumFractionDigits: 2
}).format(Number(value || 0));

export const dateTime = (value) => value
  ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Sin fecha';
