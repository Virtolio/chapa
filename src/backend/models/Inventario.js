const mongoose = require('mongoose');

if (mongoose.models.Inventario) {
  module.exports = mongoose.models.Inventario;
} else {
  const InventarioSchema = new mongoose.Schema({
    medida: {
      type: String,
      required: true,
      enum: ['25mm', '37mm', '56mm', '58mm', '75mm']
    },
    tipoChapa: {
      type: String,
      required: true,
      enum: ['Alfiler', 'Imán', 'Espejo', 'Imán Destapador', 'Llavero destapador', 'Llavero']
    },
    materialChapa: {
      type: String,
      required: true,
      enum: ['Metalizada', 'Plástica']
    },
    cantidadDisponible: {
      type: Number,
      required: true,
      min: 0
    },
    comentarios: {
      type: String,
      default: ''
    }
  }, {
    timestamps: true
  });

  module.exports = mongoose.model('Inventario', InventarioSchema);
}