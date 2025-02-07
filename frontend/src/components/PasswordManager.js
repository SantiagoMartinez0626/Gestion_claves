import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PasswordModal from './PasswordModal';
import './PasswordManager.css';

const PasswordManager = ({ showOnlyFavorites = false }) => {
  const [passwords, setPasswords] = useState([]);
  const [selectedPassword, setSelectedPassword] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPasswords();
    
    const intervalId = setInterval(() => {
      fetchPasswords(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [showOnlyFavorites]); 

  useEffect(() => {
    if (success || error) {
      const timeoutId = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [success, error]);

  const fetchPasswords = async (isAutoUpdate = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/passwords', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allPasswords = response.data;
      const filteredPasswords = showOnlyFavorites ? allPasswords.filter(p => p.favorite) : allPasswords;
      
      if (isAutoUpdate && selectedPassword) {
        const updatedSelection = filteredPasswords.find(p => p._id === selectedPassword._id);
        setSelectedPassword(updatedSelection || null);
      }
      
      setPasswords(filteredPasswords);
    } catch (err) {
      setError('Error al cargar las contraseñas');
    }
  };

  const handleCreate = () => {
    setModalData(null);
    setShowModal(true);
  };

  const handleEdit = () => {
    if (!selectedPassword) {
      setError('Por favor seleccione una contraseña para editar');
      return;
    }
    
    const passwordToEdit = {
      ...selectedPassword,
      password: selectedPassword.password
    };
    
    setModalData(passwordToEdit);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!selectedPassword) {
      setError('Por favor seleccione una contraseña para eliminar');
      return;
    }

    if (!window.confirm('¿Está seguro de que desea eliminar esta contraseña?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/passwords/${selectedPassword._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Contraseña eliminada exitosamente');
      setSelectedPassword(null);
      fetchPasswords();
    } catch (err) {
      setError('Error al eliminar la contraseña');
    }
  };

  const handleToggleFavorite = async (password, e) => {
    e.stopPropagation(); 
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:5000/api/passwords/${password._id}/toggle-favorite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPasswords();
    } catch (err) {
      setError('Error al actualizar favorito');
    }
  };

  const handleRowClick = (password) => {
    setSelectedPassword(prevSelected => 
      prevSelected?._id === password._id ? null : password
    );
  };

  const handleSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      if (modalData) {
        await axios.put(
          `http://localhost:5000/api/passwords/${modalData._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Contraseña actualizada exitosamente');
      } else {
        await axios.post(
          'http://localhost:5000/api/passwords',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Contraseña creada exitosamente');
      }
      setShowModal(false);
      fetchPasswords();
    } catch (err) {
      setError('Error al guardar la contraseña');
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'hace un momento';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `hace ${diffInDays} días`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `hace ${diffInMonths} meses`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `hace ${diffInYears} años`;
  };

  return (
    <div className="password-manager">
      <div className="actions-bar">
        {!showOnlyFavorites && (
          <button className="action-button create" onClick={handleCreate}>
            <i className="fas fa-plus"></i> Crear Contraseña
          </button>
        )}
        <button className="action-button edit" onClick={handleEdit}>
          <i className="fas fa-edit"></i> Editar Contraseña
        </button>
        <button className="action-button delete" onClick={handleDelete}>
          <i className="fas fa-trash"></i> Eliminar Contraseña
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="table-container">
        <table className="password-table">
          <thead>
            <tr>
              <th>Selección</th>
              <th>Favorito</th>
              <th>Nombre</th>
              <th>Nombre de usuario</th>
              <th>Contraseña</th>
              <th>URL</th>
              <th>Modificado</th>
            </tr>
          </thead>
          <tbody>
            {passwords.map(password => (
              <tr 
                key={password._id}
                className={selectedPassword?._id === password._id ? 'selected' : ''}
              >
                <td>
                  <button 
                    className={`select-button ${selectedPassword?._id === password._id ? 'active' : ''}`}
                    onClick={() => handleRowClick(password)}
                  >
                    <i className="fas fa-check-circle"></i>
                  </button>
                </td>
                <td>
                  <button 
                    className={`favorite-button ${password.favorite ? 'active' : ''}`}
                    onClick={(e) => handleToggleFavorite(password, e)}
                  >
                    <i className={`fas fa-star`}></i>
                  </button>
                </td>
                <td data-full-text={password.name}>{password.name}</td>
                <td data-full-text={password.username}>{password.username}</td>
                <td>••••••••</td>
                <td data-full-text={password.url}>{password.url}</td>
                <td data-full-text={formatTimeAgo(password.updatedAt)}>{formatTimeAgo(password.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PasswordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        initialData={modalData}
      />
    </div>
  );
};

export default PasswordManager;
