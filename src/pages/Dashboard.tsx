import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { Crown, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { activeProductName, isActive, loading } = useSubscription();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to access the dashboard
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">The Richest</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!loading && activeProductName && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {activeProductName} Active
                </div>
              )}
              <span className="text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isActive ? (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to The Richest Premium
              </h2>
              <p className="text-gray-600">
                You have access to exclusive wealth insights and financial strategies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Market Insights</h3>
                    <p className="text-gray-600">Latest market trends and analysis</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Investment Strategies</h3>
                    <p className="text-gray-600">Proven wealth building methods</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portfolio Analysis</h3>
                    <p className="text-gray-600">Advanced portfolio optimization</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Premium Content</h3>
              <p className="text-gray-600 mb-4">
                As a premium member, you have access to exclusive content including:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Weekly market analysis reports</li>
                <li>Investment strategy guides</li>
                <li>Portfolio optimization tools</li>
                <li>Expert financial advice</li>
                <li>Exclusive webinars and events</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upgrade to Access Premium Content
            </h2>
            <p className="text-gray-600 mb-6">
              Get access to exclusive wealth insights and financial strategies.
            </p>
            <a
              href="/pricing"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              View Pricing Plans
            </a>
          </div>
        )}
      </main>
    </div>
  );
};