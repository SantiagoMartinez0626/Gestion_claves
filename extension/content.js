// Función para detectar campos de formulario
function detectLoginForm() {
  console.log('[VaultX] Buscando campos de formulario...');
  
  // Buscar campos de usuario y contraseña
  const inputs = document.getElementsByTagName('input');
  let usernameField = null;
  let passwordField = null;

  for (const input of inputs) {
    console.log('[VaultX] Analizando input:', {
      type: input.type,
      id: input.id,
      name: input.name,
      placeholder: input.placeholder
    });

    // Detectar campo de usuario
    if (input.type === 'text' || input.type === 'email' || input.type === 'tel') {
      const isUsernameField = [
        'user', 'username', 'email', 'login', 'account', 'correo'
      ].some(term => {
        const matches = (
          (input.id && input.id.toLowerCase().includes(term)) ||
          (input.name && input.name.toLowerCase().includes(term)) ||
          (input.placeholder && input.placeholder.toLowerCase().includes(term)) ||
          (input.getAttribute('aria-label') && input.getAttribute('aria-label').toLowerCase().includes(term))
        );
        if (matches) console.log('[VaultX] Campo de usuario encontrado con término:', term);
        return matches;
      });
      
      if (isUsernameField) {
        usernameField = input;
        console.log('[VaultX] Campo de usuario asignado');
      }
    }
    
    // Detectar campo de contraseña
    if (input.type === 'password') {
      passwordField = input;
      console.log('[VaultX] Campo de contraseña encontrado');
    }

    // Si encontramos ambos campos, terminamos la búsqueda
    if (usernameField && passwordField) break;
  }

  // Si no encontramos el campo de usuario por los métodos anteriores, buscar por otros atributos
  if (!usernameField) {
    console.log('[VaultX] Buscando campo de usuario por métodos alternativos...');
    const possibleUserFields = Array.from(inputs).filter(input => 
      input.type === 'email' || 
      input.type === 'tel' || 
      (input.getAttribute('autocomplete') && input.getAttribute('autocomplete').includes('email'))
    );
    
    if (possibleUserFields.length > 0) {
      usernameField = possibleUserFields[0];
      console.log('[VaultX] Campo de usuario encontrado por método alternativo');
    }
  }

  console.log('[VaultX] Resultado de la búsqueda:', {
    usernameFound: !!usernameField,
    passwordFound: !!passwordField
  });

  return { usernameField, passwordField };
}

// Función para autocompletar el formulario
function autofillCredentials(credentials) {
  console.log('[VaultX] Intentando autocompletar con credenciales:', credentials);
  
  if (!credentials) {
    console.log('[VaultX] No hay credenciales disponibles');
    return;
  }

  const { usernameField, passwordField } = detectLoginForm();
  
  if (usernameField && credentials.username) {
    console.log('[VaultX] Autocompletando campo de usuario');
    usernameField.value = credentials.username;
    // Disparar eventos para simular entrada de usuario
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
    usernameField.dispatchEvent(new Event('blur', { bubbles: true }));
  }
  
  if (passwordField && credentials.password) {
    console.log('[VaultX] Autocompletando campo de contraseña');
    passwordField.value = credentials.password;
    // Disparar eventos para simular entrada de usuario
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
    passwordField.dispatchEvent(new Event('blur', { bubbles: true }));
  }
}

// Función principal que se ejecuta cuando la página se carga
function init() {
  // Verificar si hay un formulario de login
  const { usernameField, passwordField } = detectLoginForm();
  
  if (usernameField || passwordField) {
    // Solicitar credenciales al background script
    chrome.runtime.sendMessage(
      { 
        type: 'GET_CREDENTIALS_FOR_URL',
        url: window.location.href
      },
      response => {
        if (response && response.credentials) {
          autofillCredentials(response.credentials);
        }
      }
    );
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// También escuchar cambios dinámicos en el DOM
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      init();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
