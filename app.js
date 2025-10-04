/**
 * The Richest - Application de classement des plus riches
 * 
 * Cette application permet de suivre les montants payés par différents utilisateurs
 * et affiche un classement des 3 premiers, ainsi que la position de l'utilisateur courant.
 */

// Module principal pour la gestion du classement
const Leaderboard = (function() {
  const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

  // Charge les paiements depuis Supabase
  async function loadPayments() {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard_payments?select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des paiements');
      }

      const payments = await response.json();

      // Agréger les paiements par utilisateur
      const usersMap = {};

      payments.forEach(payment => {
        if (!usersMap[payment.user_id]) {
          usersMap[payment.user_id] = {
            id: payment.user_id,
            pseudo: payment.pseudo,
            avatar: payment.avatar,
            phrase: payment.phrase,
            totalCents: 0,
            firstPaymentAt: payment.created_at,
            payments: []
          };
        }

        usersMap[payment.user_id].totalCents += payment.amount_cents;
        usersMap[payment.user_id].payments.push({
          amountCents: payment.amount_cents,
          createdAt: payment.created_at
        });

        // Garder la date du premier paiement
        if (new Date(payment.created_at) < new Date(usersMap[payment.user_id].firstPaymentAt)) {
          usersMap[payment.user_id].firstPaymentAt = payment.created_at;
        }
      });

      return { users: usersMap };
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
      return { users: {} };
    }
  }

  // Récupère le top 3 des utilisateurs
  async function getTop3() {
    const state = await loadPayments();
    return getSortedUsers(state).slice(0, 3);
  }

  // Récupère le classement d'un utilisateur
  async function getRank(userId) {
    const state = await loadPayments();
    const sortedUsers = getSortedUsers(state);
    const index = sortedUsers.findIndex(user => user.id === userId);
    return index !== -1 ? index + 1 : sortedUsers.length + 1;
  }

  // Trie les utilisateurs par montant total puis par ancienneté
  function getSortedUsers(state) {
    return Object.values(state.users)
      .sort((a, b) => {
        // D'abord par montant total (décroissant)
        if (b.totalCents !== a.totalCents) {
          return b.totalCents - a.totalCents;
        }
        // En cas d'égalité, par date du premier paiement (croissant)
        return new Date(a.firstPaymentAt) - new Date(b.firstPaymentAt);
      });
  }

  // API publique
  return {
    loadPayments,
    getTop3,
    getRank,
    getSortedUsers
  };
})();

// Module pour la gestion de l'utilisateur courant
const CurrentUser = (function() {
  const defaultUser = {
    id: 'me',
    pseudo: 'Moi',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    phrase: ''
  };

  // Charge les informations de l'utilisateur
  function loadUser() {
    try {
      // Vérifier les paramètres d'URL
      const urlParams = new URLSearchParams(window.location.search);
      const pseudoParam = urlParams.get('pseudo');
      const avatarParam = urlParams.get('avatar');
      const phraseParam = urlParams.get('phrase');
      
      // Récupérer les données stockées
      const storedUser = JSON.parse(localStorage.getItem('richest:v1:currentUser') || '{}');
      
      // Fusionner les données
      const user = {
        ...defaultUser,
        ...storedUser
      };
      
      // Priorité aux paramètres d'URL
      if (pseudoParam) user.pseudo = pseudoParam;
      if (avatarParam) user.avatar = avatarParam;
      if (phraseParam) user.phrase = phraseParam;
      
      // Sauvegarder les modifications
      saveUser(user);
      
      return user;
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      return defaultUser;
    }
  }

  // Sauvegarde les informations de l'utilisateur
  function saveUser(user) {
    localStorage.setItem('richest:v1:currentUser', JSON.stringify(user));
  }

  return {
    loadUser,
    saveUser
  };
})();

// Utilitaires
function euro(amountCents) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amountCents / 100);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toast.className = 'toast show';
  if (type === 'error') {
    toast.style.backgroundColor = '#ef4444';
  } else {
    toast.style.backgroundColor = '#10B981';
  }
  
  toastMessage.textContent = message;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Rendu de l'interface
async function renderLeaderboard() {
  const leaderboardEl = document.getElementById('leaderboard');
  const myCardContainer = document.getElementById('my-card-container');

  // Vider les conteneurs
  leaderboardEl.innerHTML = '';
  myCardContainer.innerHTML = '';

  // Récupérer les données
  const top3 = await Leaderboard.getTop3();
  const currentUser = CurrentUser.loadUser();
  const myRank = await Leaderboard.getRank(currentUser.id);

  // Récupérer les données de l'utilisateur courant
  const state = await Leaderboard.loadPayments();
  const myData = state.users[currentUser.id] || { totalCents: 0, phrase: currentUser.phrase };

  // Générer les cartes du top 3
  top3.forEach((user, index) => {
    const isCurrentUser = user.id === currentUser.id;
    const card = createUserCard(user, index + 1, isCurrentUser);
    leaderboardEl.appendChild(card);
  });

  // Générer la carte de l'utilisateur courant si pas dans le top 3
  const isInTop3 = top3.some(user => user.id === currentUser.id);
  if (!isInTop3) {
    const myCard = createUserCard({
      id: currentUser.id,
      pseudo: currentUser.pseudo,
      avatar: currentUser.avatar,
      totalCents: myData.totalCents || 0,
      phrase: currentUser.phrase
    }, myRank, true);
    myCardContainer.appendChild(myCard);
  }

  // Ajouter le bouton de paiement
  const payButtonContainer = document.createElement('div');
  payButtonContainer.className = 'pay-button-container';

  const payButton = document.createElement('button');
  payButton.className = 'btn btn-primary pay-button';
  payButton.textContent = 'Payer';
  payButton.addEventListener('click', openPaymentModal);

  payButtonContainer.appendChild(payButton);
  myCardContainer.appendChild(payButtonContainer);
}

function createUserCard(user, rank, isCurrentUser) {
  const card = document.createElement('div');
  card.className = `card ${isCurrentUser ? 'card-me' : ''}`;

  // Avatar
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = user.avatar || 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150';
  avatar.alt = user.pseudo || 'Utilisateur';
  card.appendChild(avatar);

  // Informations utilisateur
  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';

  const username = document.createElement('div');
  username.className = 'username';
  username.textContent = user.pseudo || 'Utilisateur';
  userInfo.appendChild(username);

  // Phrase personnelle
  if (user.phrase) {
    const phrase = document.createElement('div');
    phrase.className = 'personal-phrase';
    phrase.textContent = user.phrase;
    userInfo.appendChild(phrase);
  }

  card.appendChild(userInfo);

  // Montant
  const amount = document.createElement('div');
  amount.className = 'amount';
  amount.textContent = euro(user.totalCents || 0);
  card.appendChild(amount);

  // Badge de rang
  const rankBadge = document.createElement('div');
  rankBadge.className = 'card-rank';
  rankBadge.textContent = rank <= 3 ? `${rank}${getRankSuffix(rank)}` : `${rank}e`;
  card.appendChild(rankBadge);

  return card;
}

function getRankSuffix(rank) {
  if (rank === 1) return 'er';
  return 'e';
}

// Gestion du modal de paiement
function openPaymentModal() {
  const modal = document.getElementById('payment-modal');
  const amountInput = document.getElementById('payment-amount');
  
  modal.style.display = 'flex';
  amountInput.value = '';
  amountInput.focus();
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  modal.style.display = 'none';
}

async function handlePayment() {
  const amountInput = document.getElementById('payment-amount');
  const amountValue = parseFloat(amountInput.value);

  if (isNaN(amountValue) || amountValue <= 0) {
    showToast('Veuillez entrer un montant valide', 'error');
    return;
  }

  try {
    const amountCents = Math.round(amountValue * 100);
    const currentUser = CurrentUser.loadUser();

    closePaymentModal();
    showToast('Redirection vers le paiement...');

    const supabaseUrl = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/richest-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountCents,
        user_id: currentUser.id,
        pseudo: currentUser.pseudo,
        avatar: currentUser.avatar,
        phrase: currentUser.phrase,
        success_url: window.location.origin + '/',
        cancel_url: window.location.origin + '/',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la session de paiement');
    }

    const { url } = await response.json();

    if (url) {
      window.location.href = url;
    } else {
      throw new Error('URL de paiement non reçue');
    }
  } catch (error) {
    console.error('Payment error:', error);
    showToast(error.message, 'error');
  }
}

// Vérifier l'authentification
function checkAuth() {
  const session = JSON.parse(localStorage.getItem('richest:session') || '{}');

  if (!session.token || !session.expires_at) {
    window.location.href = '/login.html';
    return false;
  }

  const expiresAt = new Date(session.expires_at);
  if (expiresAt < new Date()) {
    localStorage.removeItem('richest:session');
    localStorage.removeItem('richest:v1:currentUser');
    window.location.href = '/login.html';
    return false;
  }

  return true;
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
  if (!checkAuth()) {
    return;
  }

  // Charger l'utilisateur courant
  CurrentUser.loadUser();

  // Afficher le classement
  await renderLeaderboard();

  // Événements du modal de paiement
  document.getElementById('confirm-payment').addEventListener('click', handlePayment);
  document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
  document.getElementById('payment-amount').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handlePayment();
  });
});

// Exporter les fonctions pour les rendre accessibles aux autres modules
export { Leaderboard, CurrentUser, showToast, euro, openPaymentModal, closePaymentModal };
