import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, errorMessage } from '../api/client';
import { toPatchBody } from '../api/productPayload';
import { removeDocument as removeDocumentRequest, uploadDocument } from '../api/documents';
import { uploadReceipt } from '../api/receipt';
import { DocumentType, MaintenanceEntry, NewProductInput, Product } from '../types';

type ProductsStatus = 'loading' | 'ready' | 'error';

interface ProductsContextValue {
  products: Product[];
  status: ProductsStatus;
  /** Texto del último error al cargar los productos. */
  errorMessage: string;
  /** Vuelve a pedir los productos al servidor. */
  reload: () => Promise<void>;
  /** Crea el producto en el servidor y devuelve el producto guardado (con su id). */
  addProduct: (input: NewProductInput) => Promise<Product>;
  /** Edita campos del producto. `calendarEventId: undefined` lo borra. */
  updateProduct: (id: string, patch: Partial<Product>) => Promise<Product>;
  removeProduct: (id: string) => Promise<void>;
  /** Sube (o reemplaza) la foto del recibo de un producto ya guardado, a partir de su ubicación. */
  attachReceipt: (id: string, photoUri: string) => Promise<Product>;
  /** Sube (o reemplaza) la foto de un documento. `image` es un JPEG en base64. */
  attachDocument: (id: string, type: DocumentType, image: string) => Promise<Product>;
  /** Quita la foto de un documento. */
  removeDocument: (id: string, type: DocumentType) => Promise<Product>;
  addMaintenance: (id: string, entry: Omit<MaintenanceEntry, 'id'>) => Promise<Product>;
}

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

/**
 * Productos del usuario logueado, guardados en el servidor. Montalo con
 * `key={userId}` para descartar el estado al cambiar de cuenta.
 */
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<ProductsStatus>('loading');
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await api.get<{ products: Product[] }>('/products');
      setProducts(res.products);
      setStatus('ready');
    } catch (err) {
      setLoadError(errorMessage(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const replaceProduct = useCallback((updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const addProduct = useCallback(async (input: NewProductInput) => {
    const { product } = await api.post<{ product: Product }>('/products', input);
    setProducts((prev) => [product, ...prev]);
    return product;
  }, []);

  const updateProduct = useCallback(
    async (id: string, patch: Partial<Product>) => {
      const { product } = await api.patch<{ product: Product }>(`/products/${id}`, toPatchBody(patch));
      replaceProduct(product);
      return product;
    },
    [replaceProduct]
  );

  const removeProduct = useCallback(async (id: string) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const attachReceipt = useCallback(
    async (id: string, photoUri: string) => {
      const product = await uploadReceipt(id, photoUri);
      replaceProduct(product);
      return product;
    },
    [replaceProduct]
  );

  const attachDocument = useCallback(
    async (id: string, type: DocumentType, image: string) => {
      const product = await uploadDocument(id, type, image);
      replaceProduct(product);
      return product;
    },
    [replaceProduct]
  );

  const removeDocument = useCallback(
    async (id: string, type: DocumentType) => {
      const product = await removeDocumentRequest(id, type);
      replaceProduct(product);
      return product;
    },
    [replaceProduct]
  );

  const addMaintenance = useCallback(
    async (id: string, entry: Omit<MaintenanceEntry, 'id'>) => {
      const { product } = await api.post<{ product: Product }>(`/products/${id}/maintenance`, entry);
      replaceProduct(product);
      return product;
    },
    [replaceProduct]
  );

  const value = useMemo(
    () => ({
      products,
      status,
      errorMessage: loadError,
      reload,
      addProduct,
      updateProduct,
      removeProduct,
      attachReceipt,
      attachDocument,
      removeDocument,
      addMaintenance,
    }),
    [
      products,
      status,
      loadError,
      reload,
      addProduct,
      updateProduct,
      removeProduct,
      attachReceipt,
      attachDocument,
      removeDocument,
      addMaintenance,
    ]
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
