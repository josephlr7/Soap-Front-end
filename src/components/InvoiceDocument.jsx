import { Printer, ShieldCheck } from 'lucide-react';
import { dateTime, money } from '../utils/format';

export default function InvoiceDocument({ document, onPrint = () => window.print() }) {
  if (!document) return <div className="empty">Selecciona un comprobante para revisar todos sus datos.</div>;
  const receiver = document.tipoComprobante === 'FACTURA' ? document.empresa : document.cliente;
  const receiverDocument = document.tipoComprobante === 'FACTURA' ? document.rucEmpresa : document.dniCliente;
  return <article className="invoice" id="invoice-print">
    <div className="invoice-actions no-print"><span className={`badge ${document.estado === 'ANULADO' ? 'danger' : 'success'}`}>{document.estado}</span><button className="button ghost" onClick={onPrint}><Printer size={16} />Imprimir / PDF</button></div>
    <header className="invoice-header">
      <div><p className="overline">NOVA SUITE</p><h2>NovaMarket S.A.C.</h2><p>Representación interna del comprobante electrónico</p><small>Entorno académico · No sustituye el envío real a SUNAT</small></div>
      <div className="document-box"><span>RUC DEL EMISOR</span><strong>20600000001</strong><b>{document.tipoComprobante} ELECTRÓNICA</b><strong>{document.numero}</strong></div>
    </header>
    <section className="invoice-meta">
      <div><span>Fecha de emisión</span><strong>{dateTime(document.fechaEmision)}</strong></div><div><span>Forma de pago</span><strong>{document.metodoPago || 'No indicada'}</strong></div><div><span>Cajero</span><strong>{document.nombreCajero || document.codigoCajero}</strong></div>
    </section>
    <section className="receiver"><div><span>Adquirente</span><strong>{receiver || 'Consumidor final'}</strong></div><div><span>{document.tipoComprobante === 'FACTURA' ? 'RUC' : 'DNI'}</span><strong>{receiverDocument || '—'}</strong></div><div className="wide"><span>Dirección</span><strong>{document.tipoComprobante === 'FACTURA' ? document.direccionEmpresa : document.direccionCliente || 'No registrada'}</strong></div></section>
    <div className="table-wrap"><table><thead><tr><th>Código</th><th>Descripción</th><th>Und.</th><th className="right">Cant.</th><th className="right">P. unitario</th><th className="right">Importe</th></tr></thead><tbody>{document.items?.map((item) => <tr key={`${item.productoId}-${item.sku}`}><td>{item.sku}</td><td>{item.descripcion}</td><td>{item.unidad || 'UND'}</td><td className="right">{item.cantidad}</td><td className="right">{money(item.precioUnitario)}</td><td className="right">{money(item.importe)}</td></tr>)}{!document.items?.length && <tr><td colSpan="6" className="empty-cell">Sin detalle disponible</td></tr>}</tbody></table></div>
    <section className="invoice-bottom"><div className="verification"><ShieldCheck size={22} /><div><strong>Integridad del documento</strong><span>Operación: {document.codigoOperacionInterna}</span><small>{document.hashFirma}</small></div></div><div className="invoice-totals"><span>Op. gravada <b>{money(document.subtotal)}</b></span><span>IGV (18%) <b>{money(document.igv)}</b></span><strong>Importe total <b>{money(document.total)}</b></strong></div></section>
  </article>;
}
