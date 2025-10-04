export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SEUDNIkgwY2m6hZBgrQNWT8',
    name: 'The Richest',
    description: 'Premium access to exclusive content and features',
    mode: 'payment'
  }
];