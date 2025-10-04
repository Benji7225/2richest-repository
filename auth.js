const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

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

document.addEventListener('DOMContentLoaded', function() {
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  loginTab.addEventListener('click', function() {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
  });

  signupTab.addEventListener('click', function() {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
  });

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      localStorage.setItem('richest:session', JSON.stringify(data.session));
      localStorage.setItem('richest:v1:currentUser', JSON.stringify({
        id: data.user.id,
        pseudo: data.user.pseudo,
        avatar: data.user.avatar,
        phrase: data.user.phrase,
      }));

      showToast('Connexion réussie');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message, 'error');
    }
  });

  signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const pseudo = document.getElementById('signup-pseudo').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const avatar = document.getElementById('signup-avatar').value || 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150';
    const phrase = document.getElementById('signup-phrase').value || '';

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, pseudo, avatar, phrase }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      localStorage.setItem('richest:session', JSON.stringify(data.session));
      localStorage.setItem('richest:v1:currentUser', JSON.stringify({
        id: data.user.id,
        pseudo: data.user.pseudo,
        avatar: data.user.avatar,
        phrase: data.user.phrase,
      }));

      showToast('Inscription réussie');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Signup error:', error);
      showToast(error.message, 'error');
    }
  });
});
