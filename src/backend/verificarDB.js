const mongoose = require('mongoose');
require('dotenv').config();

async function verificarDB() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-chapitas');
    
    console.log('✅ Conectado a MongoDB');
    
    // Verificar todas las colecciones
    const collections = await mongoose.connection.db.collections();
    console.log('\n📋 COLECCIONES EN LA BASE DE DATOS:');
    
    for (let collection of collections) {
      const collectionName = collection.collectionName;
      const count = await collection.countDocuments();
      console.log(`   📁 ${collectionName}: ${count} documentos`);
      
      // Mostrar los documentos de la colección users
      if (collectionName === 'users') {
        const users = await collection.find({}).toArray();
        console.log('\n👤 USUARIOS ENCONTRADOS:');
        if (users.length === 0) {
          console.log('   ❌ No hay usuarios en la base de datos');
        } else {
          users.forEach(user => {
            console.log(`   ✅ ${user.username} - ${user.role}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada.');
  }
}

verificarDB();