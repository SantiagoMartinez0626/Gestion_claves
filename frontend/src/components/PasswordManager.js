import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PasswordModal from './PasswordModal';
import './PasswordManager.css';

const PasswordManager = ({ showOnlyFavorites = false }) => {
  const [passwords, setPasswords] = useState([]);
  const [filteredPasswords, setFilteredPasswords] = useState([]);
  const [selectedPassword, setSelectedPassword] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedField, setCopiedField] = useState(null);

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

  useEffect(() => {
    filterPasswords();
  }, [passwords, searchTerm]);

  const filterPasswords = () => {
    let filtered = [...passwords];
    
    if (searchTerm) {
      filtered = filtered.filter(password => 
        password.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPasswords(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const fetchPasswords = async (isAutoUpdate = false) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/passwords', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Respuesta del servidor:', response.data);
      const allPasswords = response.data;
      const filteredPasswords = showOnlyFavorites ? allPasswords.filter(p => p.favorite) : allPasswords;
      
      if (isAutoUpdate && selectedPassword) {
        const updatedSelection = filteredPasswords.find(p => p._id === selectedPassword._id);
        setSelectedPassword(updatedSelection || null);
      }
      
      setPasswords(filteredPasswords);
    } catch (err) {
      console.error('Error al obtener contraseñas:', err);
      setError('Error al cargar las contraseñas');
    }
  };

  const handleCreate = () => {
    setModalData(null); 
    setShowModal(true);
  };

  const handleEdit = () => {
    if (!selectedPassword) {
      setError('Por favor, selecciona una contraseña para editar');
      return;
    }
    const passwordToEdit = {
      ...selectedPassword,
      password: selectedPassword.decryptedPassword
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
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      if (modalData) {
        await axios.put(`http://localhost:5000/api/passwords/${modalData._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Contraseña actualizada exitosamente');
      } else {
        await axios.post('http://localhost:5000/api/passwords', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Contraseña creada exitosamente');
      }

      setShowModal(false);
      setModalData(null);
      await fetchPasswords();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al procesar la contraseña');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalData(null); 
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

  const togglePasswordVisibility = (passwordId, e) => {
    e.stopPropagation();
    console.log('Toggle password visibility para ID:', passwordId);
    console.log('Estado actual:', visiblePasswords[passwordId]);
    console.log('Contraseña actual:', passwords.find(p => p._id === passwordId));
    setVisiblePasswords(prev => {
      const newState = {
        ...prev,
        [passwordId]: !prev[passwordId]
      };
      console.log('Nuevo estado:', newState);
      return newState;
    });
  };

  const handleCopyClick = async (text, fieldName, e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${fieldName} ha sido copiado al portapapeles`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al copiar:', err);
      setError('Error al copiar al portapapeles');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="password-manager">
      <div className="actions-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por URL, nombre o usuario..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
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

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

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
            {filteredPasswords.map(password => (
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
                <td 
                  className="copyable-cell"
                  onClick={(e) => handleCopyClick(password.username, "El nombre de usuario", e)}
                  title="Haz clic para copiar"
                >
                  {password.username}
                </td>
                <td className="password-cell">
                  <span 
                    className="copyable-cell"
                    onClick={(e) => handleCopyClick(
                      visiblePasswords[password._id] ? password.decryptedPassword : password.decryptedPassword,
                      "La contraseña",
                      e
                    )}
                    title="Haz clic para copiar"
                  >
                    {visiblePasswords[password._id] ? password.decryptedPassword : '••••••••'}
                  </span>
                  <button 
                    className="toggle-visibility-button"
                    onClick={(e) => togglePasswordVisibility(password._id, e)}
                    title={visiblePasswords[password._id] ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <i className={`fas ${visiblePasswords[password._id] ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </td>
                <td 
                  className="copyable-cell"
                  onClick={(e) => handleCopyClick(password.url, "La URL", e)}
                  title="Haz clic para copiar"
                >
                  {password.url}
                </td>
                <td>{formatTimeAgo(password.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PasswordModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={modalData}
      />
    </div>
  );
};

export default PasswordManager;
