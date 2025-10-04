/**
 * The Richest - Application de classement des plus riches
 * 
 * Cette application permet de suivre les montants payés par différents utilisateurs
 * et affiche un classement des 3 premiers, ainsi que la position de l'utilisateur courant.
 */

// Module principal pour la gestion du classement
const Leaderboard = (function() {
  // Clé de stockage dans localStorage
  const getStorageKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `richest:v1:season:${year}-${month}`;
  };

  // Utilisateurs initiaux pour le top 3
  const initialUsers = {
    'user1': {
      id: 'user1',
      pseudo: 'Sophie',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
      totalCents: 15000,
      payments: [
        { amountCents: 15000, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() }
      ],
      firstPaymentAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      phrase: 'Toujours plus haut, toujours plus fort !'
    },
    'user2': {
      id: 'user2',
      pseudo: 'Thomas',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
      totalCents: 12500,
      payments: [
        { amountCents: 12500, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() }
      ],
      firstPaymentAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      phrase: 'La fortune sourit aux audacieux'
    },
    'user3': {
      id: 'user3',
      pseudo: 'Emma',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
      totalCents: 10000,
      payments: [
        { amountCents: 10000, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() }
      ],
      firstPaymentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      phrase: 'Économiser pour mieux dépenser'
    }
  };

  // Structure de données par défaut
  const defaultState = {
    users: initialUsers,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Charge l'état depuis localStorage
  function loadState() {
    try {
      const currentKey = getStorageKey();
      const storedData = localStorage.getItem(currentKey);
      
      if (storedData) {
        return JSON.parse(storedData);
      }
      
      // Vérifier si nous devons réinitialiser pour un nouveau mois
      resetIfMonthChanged();
      
      return defaultState;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      return defaultState;
    }
  }

  // Sauvegarde l'état dans localStorage
  function saveState(state) {
    try {
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(getStorageKey(), JSON.stringify(state));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
      showToast('Erreur lors de la sauvegarde des données', 'error');
    }
  }

  // Ajoute un paiement pour un utilisateur
  function addPayment(userId, amountCents) {
    if (amountCents <= 0) {
      throw new Error('Le montant doit être positif');
    }

    const state = loadState();
    
    // Si l'utilisateur n'existe pas, le créer
    if (!state.users[userId]) {
      const currentUser = CurrentUser.loadUser();
      state.users[userId] = {
        id: userId,
        pseudo: currentUser.pseudo,
        avatar: currentUser.avatar,
        phrase: currentUser.phrase,
        totalCents: 0,
        payments: [],
        firstPaymentAt: new Date().toISOString()
      };
    }
    
    // Ajouter le paiement
    state.users[userId].payments.push({
      amountCents,
      createdAt: new Date().toISOString()
    });
    
    // Mettre à jour le total
    state.users[userId].totalCents += amountCents;
    
    saveState(state);
    return state;
  }

  // Récupère le top 3 des utilisateurs
  function getTop3() {
    const state = loadState();
    return getSortedUsers(state).slice(0, 3);
  }

  // Récupère le classement d'un utilisateur
  function getRank(userId) {
    const state = loadState();
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

  // Réinitialise si le mois a changé
  function resetIfMonthChanged() {
    const currentKey = getStorageKey();
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith('richest:v1:season:'))
      .sort();
    
    // S'il y a des saisons précédentes et que la clé actuelle n'existe pas
    if (keys.length > 0 && !keys.includes(currentKey)) {
      // Créer une nouvelle saison
      saveState(defaultState);
      return true;
    }
    
    return false;
  }

  // Met à jour les informations d'un utilisateur
  function updateUserInfo(userId) {
    const state = loadState();
    if (state.users[userId]) {
      const currentUser = CurrentUser.loadUser();
      state.users[userId].pseudo = currentUser.pseudo;
      state.users[userId].avatar = currentUser.avatar;
      state.users[userId].phrase = currentUser.phrase;
      saveState(state);
    }
  }

  // API publique
  return {
    loadState,
    saveState,
    addPayment,
    getTop3,
    getRank,
    resetIfMonthChanged,
    getSortedUsers,
    updateUserInfo
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
function renderLeaderboard() {
  const leaderboardEl = document.getElementById('leaderboard');
  const myCardContainer = document.getElementById('my-card-container');
  
  // Vider les conteneurs
  leaderboardEl.innerHTML = '';
  myCardContainer.innerHTML = '';
  
  // Récupérer les données
  const top3 = Leaderboard.getTop3();
  const currentUser = CurrentUser.loadUser();
  const myRank = Leaderboard.getRank(currentUser.id);
  
  // Récupérer les données de l'utilisateur courant
  const state = Leaderboard.loadState();
  const myData = state.users[currentUser.id] || { totalCents: 0, phrase: currentUser.phrase };
  
  // Mettre à jour les informations de l'utilisateur dans le classement
  Leaderboard.updateUserInfo(currentUser.id);
  
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
  
  // Badge de rang
  const rankBadge = document.createElement('div');
  rankBadge.className = 'card-rank';
  rankBadge.textContent = rank <= 3 ? `${rank}${getRankSuffix(rank)}` : `${rank}e`;
  card.appendChild(rankBadge);
  
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
  
  const subtitle = document.createElement('div');
  subtitle.className = 'subtitle';
  subtitle.textContent = isCurrentUser ? 'Vous' : 'Participant';
  userInfo.appendChild(subtitle);
  
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

function handlePayment() {
  const amountInput = document.getElementById('payment-amount');
  const amountValue = parseFloat(amountInput.value);
  
  if (isNaN(amountValue) || amountValue <= 0) {
    showToast('Veuillez entrer un montant valide', 'error');
    return;
  }
  
  try {
    const amountCents = Math.round(amountValue * 100);
    const currentUser = CurrentUser.loadUser();
    
    Leaderboard.addPayment(currentUser.id, amountCents);
    closePaymentModal();
    renderLeaderboard();
    
    showToast(`Paiement de ${euro(amountCents)} ajouté avec succès`);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier si un nouveau mois a commencé
  if (Leaderboard.resetIfMonthChanged()) {
    showToast('Nouvelle saison commencée ! Les compteurs ont été réinitialisés.');
  }
  
  // Charger l'utilisateur courant
  CurrentUser.loadUser();
  
  // Afficher le classement
  renderLeaderboard();
  
  // Événements du modal de paiement
  document.getElementById('confirm-payment').addEventListener('click', handlePayment);
  document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
  document.getElementById('payment-amount').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handlePayment();
  });
});

// Fonction utilitaire pour obtenir la clé de stockage actuelle
function getStorageKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `richest:v1:season:${year}-${month}`;
}

// Exporter les fonctions pour les rendre accessibles aux autres modules
export { Leaderboard, CurrentUser, showToast, euro, getStorageKey, openPaymentModal, closePaymentModal };
