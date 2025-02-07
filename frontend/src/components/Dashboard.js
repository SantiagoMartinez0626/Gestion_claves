import React, { useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import PasswordManager from './PasswordManager';
import PasswordGenerator from './PasswordGenerator';

const Dashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('welcome');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/users/change-password',
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la contraseña');
    }
  };

  const renderWelcome = () => (
    <div className="welcome-container">
      <div className="welcome-header">
        <h1 className="welcome-title">BIENVENIDO</h1>
        <h2 className="user-name">{user.fullName}</h2>
      </div>
      <p className="welcome-message">
        Estamos profundamente agradecidos por elegirnos como tu gestor de contraseñas de confianza. 
        Nuestro compromiso es proteger tu información digital con los más altos estándares de seguridad 
        y brindarte una experiencia excepcional. Tu confianza es el motor que nos impulsa a seguir 
        innovando y mejorando cada día.
      </p>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'welcome':
        return renderWelcome();
      case 'profile':
        return (
          <div className="profile-section">
            <h2>Mi Perfil</h2>
            <div className="user-info">
              <p><strong>Nombre:</strong> {user.fullName}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
            <div className="password-change-section">
              <h3>Cambiar Contraseña</h3>
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Contraseña actual"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nueva contraseña"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirmar nueva contraseña"
                    required
                  />
                </div>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}
                <button type="submit" className="update-password-button">
                  Actualizar Contraseña
                </button>
              </form>
            </div>
          </div>
        );
      case 'favorites':
        return <PasswordManager showOnlyFavorites={true} />;
      case 'generator':
        return <PasswordGenerator />;
      default:
        return <PasswordManager />;
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="app-title" onClick={() => setCurrentView('welcome')}>
          <h1>VAULTX</h1>
        </div>
        <nav>
          <button 
            className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentView('profile')}
          >
            <i className="fas fa-user"></i>
            Mi Perfil
          </button>
          <button 
            className={`nav-item ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={() => setCurrentView('favorites')}
          >
            <i className="fas fa-star"></i>
            Favoritos
          </button>
          <button 
            className={`nav-item ${currentView === 'passwords' ? 'active' : ''}`}
            onClick={() => setCurrentView('passwords')}
          >
            <i className="fas fa-key"></i>
            Contraseñas
          </button>
          <button 
            className={`nav-item ${currentView === 'generator' ? 'active' : ''}`}
            onClick={() => setCurrentView('generator')}
          >
            <i className="fas fa-magic"></i>
            Generar Contraseña
          </button>
          <button className="nav-item logout" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i>
            Cerrar Sesión
          </button>
        </nav>
      </aside>
      <main className="main-content">
        <div className="content-section">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
