const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-chapitas', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.log('❌ Error conectando a MongoDB:', err));

// Ruta principal - servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rutas API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/despachos', require('./routes/despachos'));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de Sistema Chapitas funcionando',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'
  });
});

// Manejo de rutas no encontradas para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`👤 Usuarios de prueba:`);
  console.log(`   Administrador: usuario "admin", contraseña "admin123"`);
  console.log(`   Solo lectura: usuario "lectura", contraseña "lectura123"`);
});