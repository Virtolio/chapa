const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    
    // Probar modelos individualmente
    try {
      require('./models/User');
      console.log('✅ Modelo User cargado');
      
      require('./models/Inventario');
      console.log('✅ Modelo Inventario cargado');
      
      require('./models/Pedido');
      console.log('✅ Modelo Pedido cargado');
      
      require('./models/Despacho');
      console.log('✅ Modelo Despacho cargado');
      
      console.log('🎉 Todos los modelos cargados correctamente!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error cargando modelos:', error.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
    process.exit(1);
  });