import React, { useState, useEffect } from 'react';
import './Modal.css';

const PasswordModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    url: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        username: initialData.username || '',
        password: initialData.password || '',
        url: initialData.url || ''
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        url: ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password || !formData.url) {
      setError('Por favor complete todos los campos');
      return;
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{initialData ? 'Editar Contraseña' : 'Crear Contraseña'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nombre"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nombre de usuario"
              required
            />
          </div>
          
          <div className="form-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Contraseña"
              required
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          
          <div className="form-group">
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="URL"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          
          <button type="submit" className="submit-button">
            {initialData ? 'Guardar Cambios' : 'Crear Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
