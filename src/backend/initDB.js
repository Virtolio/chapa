const mongoose = require('mongoose');
require('dotenv').config();

async function inicializarBaseDeDatos() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-chapitas', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB');

    // Limpiar TODAS las colecciones primero
    console.log('🗑️ Limpiando base de datos...');
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }

    // SOLO trabajar con User e Inventario explícitamente
    const User = mongoose.model('User', new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['lectura', 'administrador'], default: 'lectura' }
    }, { timestamps: true }));

    const Inventario = mongoose.model('Inventario', new mongoose.Schema({
      medida: { type: String, required: true },
      tipoChapa: { type: String, required: true },
      materialChapa: { type: String, required: true },
      cantidadDisponible: { type: Number, required: true, min: 0 },
      comentarios: { type: String, default: '' }
    }, { timestamps: true }));

    // Crear usuarios NUEVOS
    console.log('👤 Creando usuarios...');
    
    await User.create({
      username: 'gvenegas',
      password: '@$anta171Paula#',
      role: 'administrador'
    });

    await User.create({
      username: 'jvenegas',
      password: '@JavieR2002#',
      role: 'administrador'
    });

    await User.create({
      username: 'mrivera',
      password: '@Mabe09Rive#',
      role: 'administrador'
    });

    await User.create({
      username: 'LecturaChapitas',
      password: '@Lectura171Chapitas#',
      role: 'lectura'
    });

    // Datos de ejemplo para inventario
    console.log('📦 Creando datos de ejemplo...');
    

    console.log('\n🎉 BASE DE DATOS INICIALIZADA EXITOSAMENTE!');
    console.log('\n📋 DATOS CREADOS:');
    console.log('   👤 Usuarios:');
    console.log('      - gvenegas / @$anta171Paula# (Administrador)');
    console.log('      - jvenegas / @JavieR2002# (Administrador)');
    console.log('      - mrivera / @Mabe09Rive# (Administrador)');
    console.log('      - LecturaChapitas / @Lectura171Chapitas# (Solo lectura)');
    console.log('   📦 Inventario: 3 items de ejemplo');
    console.log('\n🚀 Ahora puedes iniciar el servidor con: npm run dev');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('💡 Intentemos con un enfoque más simple...');
    
    // Enfoque de emergencia - crear solo usuarios
    try {
      const User = mongoose.model('User');
      await User.create([
        { username: 'gvenegas', password: '@$anta171Paula#', role: 'administrador' },
        { username: 'jvenegas', password: '@JavieR2002#', role: 'administrador' },
        { username: 'mrivera', password: '@Mabe09Rive#', role: 'administrador' },
        { username: 'LecturaChapitas', password: '@Lectura171Chapitas#', role: 'lectura' }
      ]);
      console.log('✅ Usuarios creados exitosamente');
    } catch (simpleError) {
      console.error('❌ Error incluso con enfoque simple:', simpleError.message);
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada.');
  }
}

inicializarBaseDeDatos();