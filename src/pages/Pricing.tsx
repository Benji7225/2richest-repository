import React from 'react';
import { products } from '../stripe-config';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../hooks/useAuth';

export const Pricing: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get access to exclusive wealth insights and financial strategies
          </p>
          {!user && (
            <p className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded-lg inline-block">
              Please sign in to make a purchase
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};