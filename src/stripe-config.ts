export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price_per_unit: number;
  currency_symbol: string;
  mode: 'payment' | 'subscription';
}

export const products: Product[] = [
  {
    id: 'prod_TApttu2aKr6QZq',
    priceId: 'price_1SEUDNIkgwY2m6hZBgrQNWT8',
    name: 'The Richest',
    description: 'Premium access to exclusive wealth insights and financial strategies',
    price_per_unit: 99,
    currency_symbol: '$',
    mode: 'payment'
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};