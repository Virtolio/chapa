const mongoose = require('mongoose');

if (mongoose.models.Despacho) {
  module.exports = mongoose.models.Despacho;
} else {
  const DespachoSchema = new mongoose.Schema({
    idPedido: {
      type: String,
      required: true
    },
    clienteDiseno: {
      type: String,
      required: true
    },
    cantidadChapas: {
      type: Number,
      required: true,
      min: 1
    },
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
    tipoActividad: {
      type: String,
      enum: ['Imprimir', 'Comprar Insumo', 'Entrega de Pedido', 'Fabricando Pedido', 'Ida por Materiales'],
      required: true
    },
    costeAbono: {
      type: Number,
      required: true,
      min: 0
    },
    estadoAbono: {
      type: String,
      enum: ['Pagado', 'No Pagado', 'Cancelado'],
      default: 'No Pagado'
    },
    comentarios: {
      type: String,
      default: ''
    }
  }, {
    timestamps: true
  });

  module.exports = mongoose.model('Despacho', DespachoSchema);
}