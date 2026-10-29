/** Forma del usuario que se le devuelve al cliente (nunca incluye passwordHash). */
export function toPublicUser(user: { id: string; name: string; email: string; plan: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    initial: user.name.trim().charAt(0).toUpperCase(),
    plan: user.plan,
  };
}

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  subCategory: string;
  icon: string;
  store: string;
  purchaseDate: string;
  price: number;
  warrantyExpiryDate: string;
  serialNumber: string;
  documentation: unknown;
  calendarEventId: string | null;
  receiptImage?: string | null;
  maintenanceHistory: {
    id: string;
    date: string;
    title: string;
    provider: string;
    cost: number;
    type: string;
  }[];
}

export function toProduct(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    model: p.model,
    category: p.category,
    subCategory: p.subCategory,
    icon: p.icon,
    store: p.store,
    purchaseDate: p.purchaseDate,
    price: p.price,
    warrantyExpiryDate: p.warrantyExpiryDate,
    serialNumber: p.serialNumber,
    documentation: p.documentation,
    calendarEventId: p.calendarEventId ?? undefined,
    // Si hay recibo, la app lo pide en GET /products/:id/receipt. Este id cambia
    // cuando se reemplaza el recibo, así la app no muestra una versión vieja.
    receiptPhotoId: p.receiptImage ? p.receiptImage.replace(/\.(jpg|pdf)$/, '') : undefined,
    receiptType: p.receiptImage ? (p.receiptImage.endsWith('.pdf') ? 'pdf' : 'image') : undefined,
    maintenanceHistory: [...p.maintenanceHistory]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({
        id: m.id,
        date: m.date,
        title: m.title,
        provider: m.provider,
        cost: m.cost,
        type: m.type,
      })),
  };
}
