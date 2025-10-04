import './style.css'
import { createClient } from '@supabase/supabase-js'
import { loadStripe } from '@stripe/stripe-js'
import { stripeProducts } from './stripe-config.js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialize Stripe
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripe = await loadStripe(stripePublishableKey)

// App state
let currentUser = null
let currentSubscription = null

// DOM elements
const app = document.querySelector('#app')

// Initialize app
async function init() {
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  currentUser = user
  
  if (currentUser) {
    await loadUserSubscription()
  }
  
  render()
  
  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null
    if (currentUser) {
      await loadUserSubscription()
    } else {
      currentSubscription = null
    }
    render()
  })
}

// Load user subscription data
async function loadUserSubscription() {
  if (!currentUser) return
  
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle()
    
    if (error) {
      console.error('Error loading subscription:', error)
      return
    }
    
    currentSubscription = data
  } catch (error) {
    console.error('Error loading subscription:', error)
  }
}

// Render the app
function render() {
  if (!currentUser) {
    renderAuthPage()
  } else {
    renderMainApp()
  }
}

// Render authentication page
function renderAuthPage() {
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">The Richest</h1>
            <p class="text-gray-600">Premium access to exclusive content</p>
          </div>
          
          <div class="space-y-4">
            <div id="auth-tabs" class="flex bg-gray-100 rounded-lg p-1">
              <button id="login-tab" class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors bg-white text-indigo-600 shadow-sm">
                Sign In
              </button>
              <button id="signup-tab" class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900">
                Sign Up
              </button>
            </div>
            
            <form id="auth-form" class="space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" id="email" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
              </div>
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" id="password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors">
              </div>
              <button type="submit" id="auth-submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium">
                Sign In
              </button>
            </form>
            
            <div id="auth-message" class="hidden p-3 rounded-lg text-sm"></div>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Add event listeners
  const loginTab = document.getElementById('login-tab')
  const signupTab = document.getElementById('signup-tab')
  const authForm = document.getElementById('auth-form')
  const authSubmit = document.getElementById('auth-submit')
  const authMessage = document.getElementById('auth-message')
  
  let isLogin = true
  
  loginTab.addEventListener('click', () => {
    isLogin = true
    loginTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors bg-white text-indigo-600 shadow-sm'
    signupTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900'
    authSubmit.textContent = 'Sign In'
  })
  
  signupTab.addEventListener('click', () => {
    isLogin = false
    signupTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors bg-white text-indigo-600 shadow-sm'
    loginTab.className = 'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900'
    authSubmit.textContent = 'Sign Up'
  })
  
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    authSubmit.disabled = true
    authSubmit.textContent = isLogin ? 'Signing In...' : 'Signing Up...'
    
    try {
      let result
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: undefined
          }
        })
      }
      
      if (result.error) {
        showMessage(result.error.message, 'error')
      } else if (!isLogin && !result.data.user?.email_confirmed_at) {
        showMessage('Account created successfully! You can now sign in.', 'success')
        // Switch to login tab
        loginTab.click()
      }
    } catch (error) {
      showMessage('An unexpected error occurred', 'error')
    } finally {
      authSubmit.disabled = false
      authSubmit.textContent = isLogin ? 'Sign In' : 'Sign Up'
    }
  })
  
  function showMessage(message, type) {
    authMessage.textContent = message
    authMessage.className = `p-3 rounded-lg text-sm ${
      type === 'error' 
        ? 'bg-red-50 text-red-700 border border-red-200' 
        : 'bg-green-50 text-green-700 border border-green-200'
    }`
    authMessage.classList.remove('hidden')
    
    setTimeout(() => {
      authMessage.classList.add('hidden')
    }, 5000)
  }
}

// Render main application
function renderMainApp() {
  const urlParams = new URLSearchParams(window.location.search)
  const success = urlParams.get('success')
  const canceled = urlParams.get('canceled')
  
  if (success === 'true') {
    renderSuccessPage()
    return
  }
  
  if (canceled === 'true') {
    // Clear the URL parameter and show main app
    window.history.replaceState({}, document.title, window.location.pathname)
  }
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-gray-900">The Richest</h1>
            </div>
            <div class="flex items-center space-x-4">
              ${currentSubscription ? `
                <div class="text-sm text-gray-600">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ${getSubscriptionStatusText()}
                  </span>
                </div>
              ` : ''}
              <div class="text-sm text-gray-600">
                ${currentUser.email}
              </div>
              <button id="logout-btn" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Premium Products</h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock exclusive content and features with our premium offerings
          </p>
        </div>
        
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          ${stripeProducts.map(product => `
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div class="p-8">
                <div class="text-center">
                  <h3 class="text-2xl font-bold text-gray-900 mb-4">${product.name}</h3>
                  <p class="text-gray-600 mb-6">${product.description}</p>
                  
                  <div class="mb-6">
                    <div class="text-sm text-gray-500 mb-2">
                      ${product.mode === 'subscription' ? 'Monthly Subscription' : 'One-time Payment'}
                    </div>
                  </div>
                  
                  <button 
                    class="purchase-btn w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium"
                    data-price-id="${product.priceId}"
                    data-mode="${product.mode}"
                  >
                    ${product.mode === 'subscription' ? 'Subscribe Now' : 'Purchase Now'}
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  `
  
  // Add event listeners
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut()
  })
  
  document.querySelectorAll('.purchase-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const priceId = e.target.dataset.priceId
      const mode = e.target.dataset.mode
      
      btn.disabled = true
      btn.textContent = 'Processing...'
      
      try {
        await handlePurchase(priceId, mode)
      } catch (error) {
        console.error('Purchase error:', error)
        alert('Purchase failed. Please try again.')
      } finally {
        btn.disabled = false
        btn.textContent = mode === 'subscription' ? 'Subscribe Now' : 'Purchase Now'
      }
    })
  })
}

// Render success page
function renderSuccessPage() {
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 class="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p class="text-gray-600 mb-8">
            Thank you for your purchase. You now have access to premium features.
          </p>
          
          <button id="continue-btn" class="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium">
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  `
  
  document.getElementById('continue-btn').addEventListener('click', () => {
    window.history.replaceState({}, document.title, window.location.pathname)
    render()
  })
}

// Handle purchase
async function handlePurchase(priceId, mode) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No active session')
  }
  
  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_id: priceId,
      mode: mode,
      success_url: `${window.location.origin}?success=true`,
      cancel_url: `${window.location.origin}?canceled=true`,
    }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }
  
  const { sessionId } = await response.json()
  
  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    throw error
  }
}

// Get subscription status text
function getSubscriptionStatusText() {
  if (!currentSubscription) return 'No Active Plan'
  
  const status = currentSubscription.subscription_status
  
  switch (status) {
    case 'active':
      return 'Active Subscription'
    case 'trialing':
      return 'Trial Period'
    case 'past_due':
      return 'Payment Due'
    case 'canceled':
      return 'Canceled'
    case 'incomplete':
      return 'Setup Required'
    default:
      return 'No Active Plan'
  }
}

// Initialize the app
init()