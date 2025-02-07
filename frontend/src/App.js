import React, { useState, useEffect } from 'react';
import './App.css';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import Dashboard from './components/Dashboard';
import axios from 'axios';

function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (isAuthenticated && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="App">
      <header className="hero">
        <div className="hero-content">
          <h1 className="title">VaultX</h1>
          <div className="auth-buttons">
            <button 
              className="auth-button login"
              onClick={() => setShowLoginModal(true)}
            >
              Iniciar Sesión
            </button>
            <button 
              className="auth-button register"
              onClick={() => setShowRegisterModal(true)}
            >
              Registrarse
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="features">
          <h2 className="features-title">¿Por qué elegir VaultX?</h2>
          <div className="features-grid-centered">
            <div className="feature-card">
              <i className="fas fa-lock"></i>
              <h3>Seguridad Avanzada</h3>
              <p>Tus contraseñas están protegidas con encriptación</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-sync"></i>
              <h3>Sincronización</h3>
              <p>Accede a tus contraseñas desde cualquier lugar</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-shield-alt"></i>
              <h3>Generador de Contraseñas</h3>
              <p>Crea contraseñas fuertes y únicas con un solo clic</p>
            </div>
          </div>
        </section>
      </main>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={(userData) => {
          setUser(userData);
          setIsAuthenticated(true);
        }}
      />
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
      />
    </div>
  );
}

export default App;
