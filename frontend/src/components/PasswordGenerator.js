import React, { useState } from 'react';
import './PasswordGenerator.css';

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(12);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = '';
    let newPassword = '';
    
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      setPassword('Seleccione al menos una opción');
      return;
    }

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }

    setPassword(newPassword);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (password && password !== 'Seleccione al menos una opción') {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="password-generator">
      <h2>Generador de Contraseñas</h2>
      
      <div className="options-container">
        <div className="length-control">
          <label>Longitud: {length}</label>
          <input
            type="range"
            min="6"
            max="32"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
          />
        </div>

        <div className="checkbox-options">
          <label>
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => handleOptionChange('uppercase')}
            />
            Mayúsculas (A-Z)
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => handleOptionChange('lowercase')}
            />
            Minúsculas (a-z)
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => handleOptionChange('numbers')}
            />
            Números (0-9)
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => handleOptionChange('symbols')}
            />
            Símbolos (!@#$%^&*...)
          </label>
        </div>
      </div>

      <button className="generate-button" onClick={generatePassword}>
        GENERAR CONTRASEÑA
      </button>

      {password && (
        <div className="password-display">
          <input
            type="text"
            value={password}
            readOnly
            onClick={copyToClipboard}
          />
          <button className="copy-button" onClick={copyToClipboard}>
            {copied ? (
              <i className="fas fa-check"></i>
            ) : (
              <i className="fas fa-copy"></i>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;
