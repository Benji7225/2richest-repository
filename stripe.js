/**
 * The Richest - Intégration Stripe
 * 
 * Ce module gère l'intégration avec Stripe pour les paiements.
 */

import { Leaderboard, CurrentUser, showToast, euro, closePaymentModal } from './app.js';

// Configuration Stripe
const StripeService = (function() {
  // Clé publique Stripe (utilisable côté client)
  const stripePublicKey = 'pk_test_51SERyMIrnYOBteMY24eGr6eDx9ZNn7nk4ov53CrKbZQRCbthFgTezA3vz8ZyZZw6G8spjlueNAIqyxnMDlb9E4kV00i8UP11Oe';
  
  // ID du prix fixe
  const fixedPriceId = 'price_1SES1cIrnYOBteMYLqFd2Qx3';
  
  // Initialiser Stripe
  const stripe = Stripe(stripePublicKey);

  // Créer une session de paiement pour un montant fixe
  async function createFixedPaymentSession() {
    try {
      // Dans un environnement réel, cette partie serait gérée par un backend
      // Ici, nous simulons la création d'une session côté client
      
      const currentUser = CurrentUser.loadUser();
      
      // Simuler une réponse de session
      const sessionId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Rediriger vers Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{
          price: fixedPriceId,
          quantity: 1
        }],
        mode: 'payment',
        successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}&amount=1000`,
        cancelUrl: `${window.location.origin}/index.html?canceled=true`,
        customerEmail: `${currentUser.pseudo.toLowerCase().replace(/\s+/g, '')}@example.com`
      });
      
      if (error) {
        console.error('Erreur lors de la redirection vers Stripe:', error);
        showToast('Erreur lors de la redirection vers Stripe', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      showToast('Erreur lors de la création de la session de paiement', 'error');
    }
  }

  // Créer un bouton de paiement Stripe
  function createPaymentButton() {
    const container = document.getElementById('stripe-button-container');
    if (!container) return;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer le bouton
    const button = document.createElement('button');
    button.className = 'stripe-button btn btn-primary';
    button.textContent = 'Payer 10€ avec Stripe';
    button.addEventListener('click', createFixedPaymentSession);
    
    container.appendChild(button);
  }

  // Vérifier si nous revenons d'une session Stripe
  function checkStripeRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const amount = urlParams.get('amount');
    const canceled = urlParams.get('canceled');
    
    if (sessionId && amount) {
      // Paiement réussi
      const amountCents = parseInt(amount, 10);
      const currentUser = CurrentUser.loadUser();
      
      // Ajouter le paiement au classement
      Leaderboard.addPayment(currentUser.id, amountCents);
      
      // Afficher un message de succès
      showToast(`Paiement de ${euro(amountCents)} effectué avec succès`);
      
      // Mettre à jour le classement
      if (typeof renderLeaderboard === 'function') {
        renderLeaderboard();
      }
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled) {
      // Paiement annulé
      showToast('Paiement annulé', 'error');
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  return {
    createFixedPaymentSession,
    createPaymentButton,
    checkStripeRedirect
  };
})();

// Gestion des options de paiement
function initPaymentOptions() {
  const paymentOptions = document.querySelectorAll('.payment-option');
  const customPanel = document.getElementById('custom-payment');
  const fixedPanel = document.getElementById('fixed-payment');
  
  paymentOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Retirer la classe active de toutes les options
      paymentOptions.forEach(opt => opt.classList.remove('active'));
      
      // Ajouter la classe active à l'option cliquée
      this.classList.add('active');
      
      // Afficher le panneau correspondant
      const optionType = this.getAttribute('data-option');
      if (optionType === 'custom') {
        customPanel.classList.add('active');
        fixedPanel.classList.remove('active');
      } else {
        fixedPanel.classList.add('active');
        customPanel.classList.remove('active');
      }
    });
  });
  
  // Initialiser le bouton de paiement Stripe
  StripeService.createPaymentButton();
  
  // Ajouter l'événement pour le bouton d'annulation du paiement fixe
  document.getElementById('cancel-fixed-payment').addEventListener('click', closePaymentModal);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier si nous revenons d'une session Stripe
  StripeService.checkStripeRedirect();
  
  // Initialiser les options de paiement
  initPaymentOptions();
});
