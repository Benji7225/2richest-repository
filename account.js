/**
 * The Richest - Page de compte utilisateur
 * 
 * Cette page permet à l'utilisateur de personnaliser son profil :
 * - Changer son nom d'utilisateur
 * - Télécharger une photo de profil
 * - Ajouter une phrase personnelle
 */

// Module pour la gestion de l'utilisateur courant
const CurrentUser = (function() {
  const defaultUser = {
    id: 'me',
    pseudo: 'Moi',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
    phrase: ''
  };

      };
      
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

  // Met à jour les informations de l'utilisateur
  function updateUser(updates) {
    const currentUser = loadUser();
    const updatedUser = {
      ...currentUser,
      ...updates
    };
    saveUser(updatedUser);
    return updatedUser;
  }

  return {
    loadUser,
    saveUser,
    updateUser
  };
})();

// Affiche un message toast
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

// Initialise le formulaire avec les données de l'utilisateur
function initForm() {
  const currentUser = CurrentUser.loadUser();
  
  // Remplir les champs
  document.getElementById('username').value = currentUser.pseudo || '';
  document.getElementById('personal-phrase').value = currentUser.phrase || '';
  document.getElementById('current-photo').src = currentUser.avatar;
  
  // Mettre à jour le compteur de caractères
  updateCharCount();
}

// Met à jour le compteur de caractères pour la phrase personnelle
function updateCharCount() {
  const textarea = document.getElementById('personal-phrase');
  const charCount = document.getElementById('phrase-char-count');
  
  charCount.textContent = `${textarea.value.length}/50`;
}

// Gère le téléchargement de la photo de profil
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Vérifier le type de fichier
  if (!file.type.match('image.*')) {
    showToast('Veuillez sélectionner une image', 'error');
    return;
  }
  
  // Vérifier la taille du fichier (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('L\'image est trop volumineuse (max 5MB)', 'error');
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // Mettre à jour l'aperçu
    document.getElementById('current-photo').src = e.target.result;
  };
  
  reader.onerror = function() {
    showToast('Erreur lors de la lecture du fichier', 'error');
  };
  
  reader.readAsDataURL(file);
}

// Sauvegarde les modifications du profil
function saveProfile() {
  const username = document.getElementById('username').value.trim();
  const phrase = document.getElementById('personal-phrase').value.trim();
  const photoSrc = document.getElementById('current-photo').src;
  
  // Validation
  if (!username) {
    showToast('Le nom d\'utilisateur ne peut pas être vide', 'error');
    return;
  }
  
  // Mettre à jour l'utilisateur
  const updates = {
    pseudo: username,
    phrase: phrase,
    avatar: photoSrc
  };
  
  CurrentUser.updateUser(updates);
  showToast('Profil mis à jour avec succès');
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser le formulaire
  initForm();
  
  // Événement pour le compteur de caractères
  document.getElementById('personal-phrase').addEventListener('input', updateCharCount);
  
  // Événement pour le téléchargement de photo
  document.getElementById('photo-upload').addEventListener('change', handlePhotoUpload);
  
  // Événement pour la sauvegarde
  document.getElementById('save-account').addEventListener('click', saveProfile);
});
