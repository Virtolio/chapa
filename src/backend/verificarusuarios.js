const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function crearUsuariosConHash() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-chapitas');
    
    console.log('✅ Conectado a MongoDB');
    
    // Definir esquema con mongoose
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['lectura', 'administrador'], default: 'lectura' }
    });
    
    const User = mongoose.model('User', userSchema, 'users');
    
    // Eliminar usuarios existentes
    console.log('🗑️ Eliminando usuarios existentes...');
    await User.deleteMany({});
    
    // Crear nuevos usuarios con contraseñas HASHEADAS
    console.log('👤 Creando usuarios con contraseñas hasheadas...');
    
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
      // Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(usuario.password, saltRounds);
      
      await User.create({
        username: usuario.username,
        password: hashedPassword,
        role: usuario.role
      });
      
      console.log(`✅ ${usuario.username} creado con hash`);
    }
    
    console.log('\n🎉 USUARIOS CREADOS CON CONTRASEÑAS HASHEADAS!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada.');
  }
}

// Verificar si bcrypt está instalado
try {
  require('bcryptjs');
  crearUsuariosConHash();
} catch (error) {
  console.log('❌ bcryptjs no está instalado. Instálalo con:');
  console.log('   npm install bcryptjs');
}