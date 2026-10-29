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
  warrantyImage?: string | null;
  manualImage?: string | null;
  maintenanceHistory: {
    id: string;
    date: string;
    title: string;
    provider: string;
    cost: number;
    type: string;
  }[];
}

function photoId(fileName: string | null | undefined): string | undefined {
  return fileName ? fileName.replace(/\.jpg$/, '') : undefined;
}

/** Misma forma que el tipo `Product` de la app (sin userId ni createdAt). */
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
    // Si hay foto, la app la pide en GET /products/:id/documents/:tipo. El id de
    // cada foto cambia cuando se reemplaza, así la app no muestra una imagen vieja.
    documents: {
      receipt: photoId(p.receiptImage),
      warranty: photoId(p.warrantyImage),
      manual: photoId(p.manualImage),
    },
    // Anterior a `documents`: lo mismo que documents.receipt.
    receiptPhotoId: photoId(p.receiptImage),
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
