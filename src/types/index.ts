export type Category = 'Tech' | 'Home' | 'Fashion' | 'Other';

export type WarrantyStatus = 'active' | 'expiring' | 'expired';

export interface MaintenanceEntry {
  id: string;
  date: string; // ISO date
  title: string;
  provider: string;
  cost: number;
  type: 'purchase' | 'maintenance';
}

export interface DocumentationItem {
  name: string;
  uploaded: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: Category;
  subCategory: string; // e.g. "Laptop", "Headphones"
  icon: string; // emoji used as pictogram
  store: string;
  purchaseDate: string; // ISO date
  price: number;
  warrantyExpiryDate: string; // ISO date
  serialNumber: string;
  documentation: DocumentationItem[];
  maintenanceHistory: MaintenanceEntry[];
  /** Set once the warranty expiry has been synced to the device's native calendar. */
  calendarEventId?: string;
}

export interface KeeprUser {
  name: string;
  email: string;
  initial: string;
  plan: string;
}

/** The signed-in user, as exposed to the UI (never includes password data). */
export interface AuthUser extends KeeprUser {
  id: string;
}

/** What actually gets saved in AsyncStorage for each registered account. */
export interface StoredAccount extends AuthUser {
  passwordHash: string;
  salt: string;
  createdAt: string; // ISO timestamp
}
