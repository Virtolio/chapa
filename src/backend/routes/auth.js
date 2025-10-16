const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Intento de login: ${username}`);
    
    // Buscar usuario en la base de datos
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ Usuario no encontrado: ${username}`);
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    console.log(`✅ Usuario encontrado: ${user.username}, role: ${user.role}`);

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Contraseña incorrecta para: ${username}`);
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    console.log(`✅ Contraseña correcta para: ${username}`);

    // Generar token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

    console.log(`✅ Login exitoso: ${username}`);

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});


module.exports = router;