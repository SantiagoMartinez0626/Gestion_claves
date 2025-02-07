const express = require('express');
const router = express.Router();
const Password = require('../models/Password');
const jwt = require('jsonwebtoken');
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const passwords = await Password.find({ user: req.userId });
    const passwordsWithDecrypted = passwords.map(password => {
      const plainPassword = password.getDecryptedPassword();
      return {
        ...password.toObject(),
        decryptedPassword: plainPassword
      };
    });
    res.json(passwordsWithDecrypted);
  } catch (error) {
    console.error('Error al obtener contraseñas:', error);
    res.status(500).json({ message: 'Error al obtener las contraseñas' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, username, password, url } = req.body;
    const newPassword = new Password({
      name,
      username,
      password,
      url,
      user: req.userId
    });
    await newPassword.save();
    res.status(201).json(newPassword);
  } catch (error) {
    console.error('Error al crear contraseña:', error);
    res.status(500).json({ message: 'Error al crear la contraseña' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const password = await Password.findOne({ _id: req.params.id, user: req.userId });
    if (!password) {
      return res.status(404).json({ message: 'Contraseña no encontrada' });
    }

    const updatedPassword = await Password.findByIdAndUpdate(
      req.params.id,
      { 
        name: req.body.name,
        username: req.body.username,
        password: req.body.password, 
        url: req.body.url,
        user: req.userId
      },
      { new: true }
    );

    const plainPassword = updatedPassword.getDecryptedPassword();
    res.json({
      ...updatedPassword.toObject(),
      decryptedPassword: plainPassword
    });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
});

router.patch('/:id/toggle-favorite', verifyToken, async (req, res) => {
  try {
    const password = await Password.findOne({ _id: req.params.id, user: req.userId });
    if (!password) {
      return res.status(404).json({ message: 'Contraseña no encontrada' });
    }

    password.favorite = !password.favorite;
    await password.save();
    res.json(password);
  } catch (error) {
    console.error('Error al actualizar favorito:', error);
    res.status(500).json({ message: 'Error al actualizar favorito' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedPassword = await Password.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    if (!deletedPassword) {
      return res.status(404).json({ message: 'Contraseña no encontrada' });
    }
    res.json({ message: 'Contraseña eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar contraseña:', error);
    res.status(500).json({ message: 'Error al eliminar la contraseña' });
  }
});

module.exports = router;
