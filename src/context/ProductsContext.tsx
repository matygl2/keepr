import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Product } from '../types';
import { KEYS, readJSON, writeJSON } from '../utils/storage';

interface ProductsContextValue {
  products: Product[];
  /** False until the saved products have been read from AsyncStorage. */
  hydrated: boolean;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

/**
 * Keeps one product list per account. Mount it with `key={userId}` so the
 * state is thrown away when the user changes (log out / log in as someone else).
 */
export function ProductsProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load this user's saved products once.
  useEffect(() => {
    let active = true;
    readJSON<Product[]>(KEYS.products(userId), []).then((saved) => {
      if (!active) return;
      setProducts(saved);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Save on every change — but only after the initial load, so we never
  // overwrite saved data with the empty starting list.
  useEffect(() => {
    if (!hydrated) return;
    writeJSON(KEYS.products(userId), products).catch(() => {});
  }, [products, hydrated, userId]);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const value = useMemo(
    () => ({ products, hydrated, addProduct, updateProduct }),
    [products, hydrated, addProduct, updateProduct]
  );

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return ctx;
}
