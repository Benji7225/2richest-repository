import React, { useState } from 'react';
import { Product } from '../stripe-config';
import { createCheckoutSession } from '../lib/stripe';
import { useAuth } from '../hooks/useAuth';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePurchase = async () => {
    if (!user) {
      alert('Please sign in to make a purchase');
      return;
    }

    setLoading(true);
    try {
      await createCheckoutSession(product.priceId);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h3>
      <p className="text-gray-600 mb-6">{product.description}</p>
      
      <div className="mb-6">
        <span className="text-3xl font-bold text-gray-900">
          {product.currency_symbol}{product.price_per_unit}
        </span>
        <span className="text-gray-500 ml-2">
          {product.mode === 'subscription' ? '/month' : 'one-time'}
        </span>
      </div>

      <button
        onClick={handlePurchase}
        disabled={loading || !user}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Purchase ${product.name}`
        )}
      </button>
    </div>
  );
};