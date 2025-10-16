// recrearUsuarios.js
const mongoose = require('mongoose');
require('dotenv').config();

async function recrearUsuarios() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-chapitas');
    
    // Cargar el modelo User actualizado
    const User = require('./models/User');
    
    // Eliminar usuarios existentes
    console.log('🗑️ Eliminando usuarios existentes...');
    await User.deleteMany({});
    
    // Crear nuevos usuarios (se hashearán automáticamente)
    console.log('👤 Creando nuevos usuarios...');
    
    const usuarios = [
      {
        username: 'gvenegas',
        password: '@$anta171Paula#',
        role: 'administrador'
      },
      {
        username: 'jvenegas',
        password: '@JavieR2002#',
        role: 'administrador'
      },
      {
        username: 'mrivera',
        password: '@Mabe09Rive#',
        role: 'administrador'
      },
      {
        username: 'LecturaChapitas',
        password: '@Lectura171Chapitas#',
        role: 'lectura'
      }
    ];
    
    for (let usuario of usuarios) {
      const newUser = new User(usuario);
      await newUser.save();
      console.log(`✅ ${usuario.username} creado con hash`);
    }
    
    console.log('\n🎉 USUARIOS CREADOS EXITOSAMENTE!');
    
    // Verificar
    const usuariosCreados = await User.find({});
    console.log('\n📋 USUARIOS EN BD:');
    usuariosCreados.forEach(user => {
      console.log(`   👤 ${user.username} - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada.');
  }
}

recrearUsuarios();