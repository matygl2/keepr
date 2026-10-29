// Arma el HTML del PDF de garantía y el texto para vender un producto.
import {
  formatDate,
  formatMoney,
  formatRemaining,
  getDaysRemaining,
  getWarrantyStatus,
} from '../data/mockData';
import type { Product } from '../types';
import { parseISODate, toLocalISODate } from './dateUtils';

const STATUS_LABEL = {
  active: 'Active',
  expiring: 'Expiring soon',
  expired: 'Expired',
};

/** Los datos los escribe el usuario: se escapan antes de meterlos en el HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasValue(value: string | undefined): value is string {
  return Boolean(value && value.trim() && value.trim() !== 'N/A');
}

function productTitle(product: Product): string {
  const brandModel = [product.brand, product.model].filter(hasValue).join(' ');
  return brandModel && !product.name.includes(brandModel) ? `${product.name} (${brandModel})` : product.name;
}

export function buildWarrantyHtml(product: Product, generatedOn: Date = new Date()): string {
  const status = getWarrantyStatus(product.warrantyExpiryDate);
  const rows: [string, string][] = [
    ['Product', product.name],
    ['Brand', product.brand],
    ['Model', product.model],
    ['Category', product.subCategory || product.category],
    ['Serial number', product.serialNumber],
    ['Store', product.store],
    ['Purchase date', formatDate(product.purchaseDate)],
    ['Price', `${formatMoney(product.price)} ARS`],
    ['Warranty expires', formatDate(product.warrantyExpiryDate)],
    ['Warranty status', `${STATUS_LABEL[status]} · ${formatRemaining(product.warrantyExpiryDate)}`],
    ['Receipt on file', product.receiptPhotoId ? 'Yes' : 'No'],
  ];

  const tableRows = rows
    .filter(([, value]) => hasValue(value))
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  const maintenance = product.maintenanceHistory
    .map(
      (entry) =>
        `<tr><td>${escapeHtml(formatDate(entry.date))}</td><td>${escapeHtml(entry.title)}</td>` +
        `<td>${escapeHtml(entry.provider)}</td><td>${entry.cost ? escapeHtml(formatMoney(entry.cost)) : '—'}</td></tr>`
    )
    .join('');

  // Colores de theme.ts copiados a mano: el HTML del PDF no puede usar el StyleSheet.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #3A2A1A; margin: 32px; }
  .brand { color: #7A1F28; font-size: 13px; letter-spacing: 2px; font-weight: bold; }
  h1 { font-family: Georgia, serif; font-size: 26px; margin: 6px 0 4px; }
  .sub { color: #6E8B93; font-size: 13px; margin-bottom: 24px; }
  h2 { font-size: 13px; letter-spacing: 1px; color: #9A8F7A; margin: 28px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #EDE0C4; vertical-align: top; }
  th { width: 38%; color: #6E8B93; font-weight: normal; }
  .footer { margin-top: 32px; font-size: 11px; color: #9A8F7A; }
</style>
</head>
<body>
  <div class="brand">KEEPR</div>
  <h1>Warranty summary</h1>
  <div class="sub">${escapeHtml(productTitle(product))}</div>

  <h2>PRODUCT AND WARRANTY</h2>
  <table>${tableRows}</table>

  ${
    maintenance
      ? `<h2>MAINTENANCE HISTORY</h2>
  <table><tr><th>Date</th><th>Service</th><th>Provider</th><th>Cost</th></tr>${maintenance}</table>`
      : ''
  }

  <div class="footer">Generated with Keepr on ${escapeHtml(formatDate(toLocalISODate(generatedOn)))}.
  This summary is based on the data entered by the owner; keep the original receipt for warranty claims.</div>
</body>
</html>`;
}

export type ListingLanguage = 'en' | 'es';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "13 de agosto de 2026", sin depender del idioma del teléfono. */
function formatDateEs(dateString: string): string {
  const date = parseISODate(dateString);
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
}

function remainingEs(warrantyExpiryDate: string): string {
  const days = getDaysRemaining(warrantyExpiryDate);
  if (days < 30) return `${days} día${days !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  return `${months} mes${months !== 1 ? 'es' : ''}`;
}

const LISTING_TEXTS = {
  en: {
    title: (name: string) => `FOR SALE: ${name}`,
    bought: (store: string, date: string) => `• Bought new at ${store} on ${formatDate(date)}.`,
    expired: '• Manufacturer warranty already expired.',
    valid: (date: string) =>
      `• Warranty still valid until ${formatDate(date)} (${formatRemaining(date).toLowerCase()}).`,
    receipt: '• Original receipt available.',
    serviced: (count: number, title: string, date: string) =>
      `• Serviced ${count} time${count > 1 ? 's' : ''}; last service: ${title} (${formatDate(date)}).`,
    noService: '• No repairs or service needed so far.',
    closing: 'Full purchase and maintenance history available on request.',
  },
  es: {
    title: (name: string) => `VENDO: ${name}`,
    bought: (store: string, date: string) =>
      `• Comprado nuevo en ${store} el ${formatDateEs(date)}.`,
    expired: '• La garantía de fábrica ya venció.',
    valid: (date: string) =>
      `• Garantía vigente hasta el ${formatDateEs(date)} (le quedan ${remainingEs(date)}).`,
    receipt: '• Tengo la factura original.',
    serviced: (count: number, title: string, date: string) =>
      `• Tuvo ${count} service${count > 1 ? 's' : ''}; el último: ${title} (${formatDateEs(date)}).`,
    noService: '• Nunca necesitó reparaciones ni service.',
    closing: 'Te paso el historial completo de compra y mantenimiento si lo necesitás.',
  },
};

/** Texto para publicar el producto a la venta. No incluye el número de serie a propósito. */
export function buildSaleListingText(product: Product, language: ListingLanguage = 'en'): string {
  const t = LISTING_TEXTS[language];
  const status = getWarrantyStatus(product.warrantyExpiryDate);
  const services = product.maintenanceHistory.filter((m) => m.type === 'maintenance');
  const lastService = services[services.length - 1];

  const lines: string[] = [t.title(productTitle(product)), ''];
  lines.push(t.bought(product.store, product.purchaseDate));
  lines.push(status === 'expired' ? t.expired : t.valid(product.warrantyExpiryDate));
  if (product.receiptPhotoId) lines.push(t.receipt);
  lines.push(
    lastService ? t.serviced(services.length, lastService.title, lastService.date) : t.noService
  );
  lines.push('', t.closing);
  return lines.join('\n');
}
