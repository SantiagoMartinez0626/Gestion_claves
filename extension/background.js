// Almacena las credenciales en caché
let credentialsCache = null;

// Función para obtener las credenciales del backend
async function fetchCredentials() {
  console.log('[VaultX] Obteniendo credenciales del backend...');
  try {
    const response = await fetch('http://localhost:5000/api/passwords', {
      headers: {
        'Authorization': `Bearer ${await getToken()}`
      }
    });
    if (!response.ok) throw new Error('Error al obtener credenciales');
    credentialsCache = await response.json();
    console.log('[VaultX] Credenciales obtenidas:', credentialsCache);
    return credentialsCache;
  } catch (error) {
    console.error('[VaultX] Error:', error);
    return null;
  }
}

// Obtener el token de autenticación del storage
async function getToken() {
  const result = await chrome.storage.local.get(['authToken']);
  return result.authToken;
}

// Función para normalizar URLs
function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString);
    // Eliminar www. si existe
    const hostname = url.hostname.replace(/^www\./, '');
    console.log('[VaultX] URL normalizada:', {
      original: urlString,
      normalized: hostname
    });
    return hostname;
  } catch (e) {
    console.error('[VaultX] Error al normalizar URL:', e);
    return urlString;
  }
}

// Escuchar mensajes del content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CREDENTIALS_FOR_URL') {
    console.log('[VaultX] Solicitud de credenciales para URL:', request.url);
    const normalizedRequestUrl = normalizeUrl(request.url);
    
    // Si no hay caché o necesitamos actualizar
    if (!credentialsCache) {
      console.log('[VaultX] No hay caché, obteniendo credenciales...');
      fetchCredentials().then(credentials => {
        const matchingCred = findMatchingCredentials(credentials, normalizedRequestUrl);
        console.log('[VaultX] Credenciales encontradas:', matchingCred);
        sendResponse({ credentials: matchingCred });
      });
      return true; // Indicar que la respuesta será asíncrona
    }
    
    // Si ya tenemos caché
    const matchingCred = findMatchingCredentials(credentialsCache, normalizedRequestUrl);
    console.log('[VaultX] Credenciales encontradas en caché:', matchingCred);
    sendResponse({ credentials: matchingCred });
  }
  return true;
});

// Función para encontrar credenciales que coincidan con el dominio
function findMatchingCredentials(credentials, targetDomain) {
  console.log('[VaultX] Buscando credenciales para dominio:', targetDomain);
  if (!credentials) return null;
  
  const matchingCred = credentials.find(cred => {
    try {
      const credDomain = normalizeUrl(cred.url);
      const matches = credDomain === targetDomain;
      console.log('[VaultX] Comparando dominios:', {
        credDomain,
        targetDomain,
        matches
      });
      return matches;
    } catch (e) {
      console.error('[VaultX] Error al comparar dominios:', e);
      return false;
    }
  });

  return matchingCred;
}
