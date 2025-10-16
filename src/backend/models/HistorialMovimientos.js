const mongoose = require('mongoose');

const HistorialMovimientosSchema = new mongoose.Schema({
  tipoMovimiento: {
    type: String,
    enum: ['Reposición', 'Uso en Pedido', 'Ajuste', 'Venta'],
    required: true
  },
  usuario: {
    type: String,
    required: true
  },
  medida: {
    type: String,
    required: true
  },
  tipoChapa: {
    type: String,
    required: true
  },
  materialChapa: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true
  },
  idPedido: {
    type: String,
    default: ''
  },
  comentario: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HistorialMovimientos', HistorialMovimientosSchema);