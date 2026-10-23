export type ServiceCategory = 'retailer' | 'repair' | 'carrier';

export interface ServiceLocation {
  id: string;
  name: string;
  category: ServiceCategory;
  address: string;
  latitude: number;
  longitude: number;
  relatedStore?: string; // matches Product.store, for "find service for X" flows
}

export const serviceLocations: ServiceLocation[] = [
  {
    id: 's1',
    name: 'Frávega Microcentro',
    category: 'retailer',
    address: 'Av. Corrientes 450, CABA',
    latitude: -34.6083,
    longitude: -58.3712,
    relatedStore: 'Frávega',
  },
  {
    id: 's2',
    name: 'Garbarino Palermo',
    category: 'retailer',
    address: 'Av. Santa Fe 3253, CABA',
    latitude: -34.5885,
    longitude: -58.4106,
    relatedStore: 'Garbarino',
  },
  {
    id: 's3',
    name: 'Sony Authorized Service',
    category: 'repair',
    address: 'Av. Callao 1120, CABA',
    latitude: -34.595,
    longitude: -58.3927,
    relatedStore: 'Sony Store',
  },
  {
    id: 's4',
    name: 'iStore Las Cañitas (Apple)',
    category: 'retailer',
    address: 'Av. Luis María Campos 1250, CABA',
    latitude: -34.5755,
    longitude: -58.4338,
    relatedStore: 'Apple Store',
  },
  {
    id: 's5',
    name: 'TechCare Repair Shop',
    category: 'repair',
    address: 'Av. Rivadavia 5200, Caballito, CABA',
    latitude: -34.6158,
    longitude: -58.4333,
  },
  {
    id: 's6',
    name: 'iService Center',
    category: 'repair',
    address: 'Av. Santa Fe 1850, CABA',
    latitude: -34.5958,
    longitude: -58.3955,
  },
  {
    id: 's7',
    name: 'Movistar Store Centro',
    category: 'carrier',
    address: 'Florida 537, CABA',
    latitude: -34.6037,
    longitude: -58.3756,
    relatedStore: 'Movistar',
  },
  {
    id: 's8',
    name: 'MacOnline Palermo',
    category: 'retailer',
    address: 'Av. Córdoba 5900, CABA',
    latitude: -34.5889,
    longitude: -58.4358,
    relatedStore: 'MacOnline',
  },
];

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  retailer: 'Store',
  repair: 'Repair / Service',
  carrier: 'Carrier',
};

export const CATEGORY_COLOR: Record<ServiceCategory, string> = {
  retailer: '#2C4F56',
  repair: '#A8323A',
  carrier: '#B8863A',
};

// Default map center: Buenos Aires, CABA
export const DEFAULT_REGION = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};
