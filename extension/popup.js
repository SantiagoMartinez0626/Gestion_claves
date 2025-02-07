document.addEventListener('DOMContentLoaded', init);

async function init() {
  updateConnectionStatus();
  setupEventListeners();
  const token = await getStoredToken();
  
  if (token) {
    showMainSection();
    loadCredentials();
  } else {
    showLoginSection();
  }
}

function setupEventListeners() {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
  }
}

async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Error en el inicio de sesión');
    
    const data = await response.json();
    await chrome.storage.local.set({ authToken: data.token });
    
    showMainSection();
    loadCredentials();
  } catch (error) {
    updateConnectionStatus('Error en el inicio de sesión', false);
  }
}

async function loadCredentials() {
  try {
    const token = await getStoredToken();
    const response = await fetch('http://localhost:5000/api/passwords', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al cargar credenciales');
    
    const credentials = await response.json();
    displayCredentials(credentials);
  } catch (error) {
    updateConnectionStatus('Error al cargar credenciales', false);
  }
}

function displayCredentials(credentials) {
  const list = document.getElementById('credentialsList');
  list.innerHTML = '';
  
  credentials.forEach(cred => {
    const item = document.createElement('div');
    item.className = 'credential-item';
    item.innerHTML = `
      <strong>${cred.name}</strong><br>
      URL: ${cred.url}<br>
      Usuario: ${cred.username}
    `;
    list.appendChild(item);
  });
}

async function getStoredToken() {
  const result = await chrome.storage.local.get(['authToken']);
  return result.authToken;
}

function updateConnectionStatus(message = 'Conectado', isConnected = true) {
  const status = document.getElementById('connectionStatus');
  status.className = `status ${isConnected ? 'connected' : 'disconnected'}`;
  status.textContent = message;
}

function showLoginSection() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('mainSection').style.display = 'none';
}

function showMainSection() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('mainSection').style.display = 'block';
}
