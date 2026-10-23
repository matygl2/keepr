import { KeeprUser, Product, WarrantyStatus } from '../types';

export const currentUser: KeeprUser = {
  name: 'Lucía Morales',
  email: 'lucia@email.com',
  initial: 'L',
  plan: 'Keepr Pro',
};

export const initialProducts: Product[] = [
  {
    id: '1',
    name: 'HP Victus 16',
    brand: 'HP',
    model: 'Victus 16-d0xxx',
    category: 'Tech',
    subCategory: 'Laptop',
    icon: '💻',
    store: 'Frávega',
    purchaseDate: '2026-08-13',
    price: 1850000,
    warrantyExpiryDate: '2027-08-13',
    serialNumber: '5CDXXXXXXX',
    documentation: [
      { name: 'Receipt', uploaded: true },
      { name: 'Warranty document', uploaded: true },
      { name: 'Manual', uploaded: true },
    ],
    maintenanceHistory: [
      {
        id: 'm1',
        date: '2026-08-13',
        title: 'Product purchased',
        provider: 'Frávega',
        cost: 1850000,
        type: 'purchase',
      },
      {
        id: 'm2',
        date: '2026-12-20',
        title: 'Fan cleaning',
        provider: 'TechCare',
        cost: 25000,
        type: 'maintenance',
      },
      {
        id: 'm3',
        date: '2027-03-14',
        title: 'Battery replacement',
        provider: 'iService',
        cost: 85000,
        type: 'maintenance',
      },
    ],
  },
  {
    id: '2',
    name: 'Sony WH-1000XM5',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Tech',
    subCategory: 'Headphones',
    icon: '🎧',
    store: 'Sony Store',
    purchaseDate: '2026-02-03',
    price: 420000,
    warrantyExpiryDate: '2026-10-14',
    serialNumber: '9SNXXXXXXX',
    documentation: [
      { name: 'Receipt', uploaded: true },
      { name: 'Warranty document', uploaded: true },
      { name: 'Manual', uploaded: false },
    ],
    maintenanceHistory: [
      {
        id: 'm1',
        date: '2026-02-03',
        title: 'Product purchased',
        provider: 'Sony Store',
        cost: 420000,
        type: 'purchase',
      },
    ],
  },
  {
    id: '3',
    name: 'Samsung QLED 55"',
    brand: 'Samsung',
    model: 'QN55Qxxx',
    category: 'Home',
    subCategory: 'TV',
    icon: '📺',
    store: 'Garbarino',
    purchaseDate: '2025-01-10',
    price: 1200000,
    warrantyExpiryDate: '2028-01-10',
    serialNumber: '2SQXXXXXXX',
    documentation: [
      { name: 'Receipt', uploaded: true },
      { name: 'Warranty document', uploaded: true },
      { name: 'Manual', uploaded: true },
    ],
    maintenanceHistory: [
      {
        id: 'm1',
        date: '2025-01-10',
        title: 'Product purchased',
        provider: 'Garbarino',
        cost: 1200000,
        type: 'purchase',
      },
    ],
  },
  {
    id: '4',
    name: 'Apple AirPods Pro',
    brand: 'Apple',
    model: 'AirPods Pro (2nd gen)',
    category: 'Tech',
    subCategory: 'Earbuds',
    icon: '🎵',
    store: 'Apple Store',
    purchaseDate: '2025-01-20',
    price: 380000,
    warrantyExpiryDate: '2026-05-20',
    serialNumber: '7APXXXXXXX',
    documentation: [
      { name: 'Receipt', uploaded: true },
      { name: 'Warranty document', uploaded: false },
      { name: 'Manual', uploaded: false },
    ],
    maintenanceHistory: [
      {
        id: 'm1',
        date: '2025-01-20',
        title: 'Product purchased',
        provider: 'Apple Store',
        cost: 380000,
        type: 'purchase',
      },
    ],
  },
  {
    id: '5',
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    model: 'SM-S921B',
    category: 'Tech',
    subCategory: 'Phone',
    icon: '📱',
    store: 'Movistar',
    purchaseDate: '2026-04-02',
    price: 1450000,
    warrantyExpiryDate: '2027-04-02',
    serialNumber: '4GSXXXXXXX',
    documentation: [
      { name: 'Receipt', uploaded: true },
      { name: 'Warranty document', uploaded: true },
      { name: 'Manual', uploaded: false },
    ],
    maintenanceHistory: [
      {
        id: 'm1',
        date: '2026-04-02',
        title: 'Product purchased',
        provider: 'Movistar',
        cost: 1450000,
        type: 'purchase',
      },
    ],
  },
  {
    id: '6',
    name: 'Canon EOS R50',
    brand: 'Canon',
    model: 'EOS R50',
    category: 'Other',
    subCategory: 'Camera',
    icon: '📷',
    store: 'MacOnline',
    purchaseDate: '2025-11-05',
    price: 980000,
    warrantyExpiryDate: '2026-11-05',
    serialNumber: '1CNXXXXXXX',
    documentation: [
      { name: 'Receipt', uploaded: true },
      { name: 'Warranty document', uploaded: true },
      { name: 'Manual', uploaded: true },
    ],
    maintenanceHistory: [
      {
        id: 'm1',
        date: '2025-11-05',
        title: 'Product purchased',
        provider: 'MacOnline',
        cost: 980000,
        type: 'purchase',
      },
    ],
  },
];

const DAY_MS = 1000 * 60 * 60 * 24;

export function getDaysRemaining(warrantyExpiryDate: string): number {
  const now = new Date();
  const expiry = new Date(warrantyExpiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / DAY_MS);
}

export function getWarrantyStatus(warrantyExpiryDate: string): WarrantyStatus {
  const days = getDaysRemaining(warrantyExpiryDate);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatRemaining(warrantyExpiryDate: string): string {
  const days = getDaysRemaining(warrantyExpiryDate);
  if (days < 0) {
    const monthsAgo = Math.round(Math.abs(days) / 30);
    return monthsAgo <= 0 ? 'Expired' : `Expired ${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ago`;
  }
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} left`;
  const months = Math.round(days / 30);
  return `${months} month${months !== 1 ? 's' : ''} left`;
}

export function getProductById(
  products: Product[],
  id: string | undefined
): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getTotalRegisteredValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.price, 0);
}

export function getStats(products: Product[]) {
  const total = products.length;
  const active = products.filter((p) => getWarrantyStatus(p.warrantyExpiryDate) === 'active').length;
  const expiring = products.filter((p) => getWarrantyStatus(p.warrantyExpiryDate) === 'expiring').length;
  return { total, active, expiring };
}

export function getExpiringSoonProducts(products: Product[]): Product[] {
  return products.filter((p) => getWarrantyStatus(p.warrantyExpiryDate) === 'expiring');
}

export function generateProductId(): string {
  return `p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function addYears(dateString: string, years: number): string {
  const date = new Date(dateString);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
