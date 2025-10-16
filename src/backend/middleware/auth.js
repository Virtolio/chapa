const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No hay token, autorización denegada' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

module.exports = { auth, adminAuth };