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
    if (!token) {
      updateConnectionStatus('No has iniciado sesión', false);
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab.url;

    const response = await fetch('http://localhost:5000/api/passwords', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al cargar credenciales');
    
    const credentials = await response.json();
    
    const matchingCredentials = credentials.filter(cred => 
      currentUrl.includes(cred.url) || cred.url.includes(new URL(currentUrl).hostname)
    ).map(cred => ({
      title: cred.name,
      username: cred.username,
      password: cred.decryptedPassword,
      url: cred.url
    }));

    if (matchingCredentials.length > 0) {
      displayCredentials(matchingCredentials);
      updateConnectionStatus('¡Se encontraron credenciales para este sitio!', true);
    } else {
      updateConnectionStatus('No hay credenciales guardadas para este sitio', false);
    }
  } catch (error) {
    console.error('Error:', error);
    updateConnectionStatus('Error al cargar credenciales', false);
  }
}

function displayCredentials(credentials) {
  const container = document.getElementById('credentialsContainer');
  container.innerHTML = '';

  credentials.forEach(cred => {
    const credDiv = document.createElement('div');
    credDiv.className = 'credential-item';
    credDiv.innerHTML = `
      <h3>${cred.title || 'Credencial'}</h3>
      <div class="credential-field">
        <label>Usuario:</label>
        <div class="copy-field">
          <input type="text" value="${cred.username}" readonly>
          <button class="copy-btn" data-value="${cred.username}">Copiar</button>
        </div>
      </div>
      <div class="credential-field">
        <label>Contraseña:</label>
        <div class="copy-field">
          <input type="password" value="${cred.password}" readonly>
          <button class="copy-btn" data-value="${cred.password}">Copiar</button>
        </div>
      </div>
    `;

    credDiv.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const textToCopy = btn.dataset.value;
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.textContent;
        btn.textContent = '¡Copiado!';
        btn.style.background = '#00ffff';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '#00bfff';
        }, 1500);
      });
    });

    container.appendChild(credDiv);
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
