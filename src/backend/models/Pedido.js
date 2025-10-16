const mongoose = require('mongoose');

if (mongoose.models.Pedido) {
  module.exports = mongoose.models.Pedido;
} else {
  const PedidoSchema = new mongoose.Schema({
    idPedido: {
      type: String,
      unique: true
    },
    cantidadChapitas: {
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
    materialChapa: {
      type: String,
      required: true,
      enum: ['Metalizada', 'Plástica']
    },
    clienteDiseno: {
      type: String,
      required: true
    },
    estadoPedido: {
      type: String,
      enum: ['No Comenzadas', 'En Producción', 'Entregadas', 'Canceladas'],
      default: 'No Comenzadas'
    },
    comentarios: {
      type: String,
      default: ''
    },
    // Nueva referencia al item de inventario utilizado
    inventarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventario'
    }
  }, {
    timestamps: true
  });

  PedidoSchema.pre('save', async function(next) {
    if (this.isNew && !this.idPedido) {
      try {
        const PedidoModel = mongoose.models.Pedido;
        const count = await PedidoModel.countDocuments();
        this.idPedido = `PED${String(count + 1).padStart(4, '0')}`;
      } catch (error) {
        this.idPedido = `PED${Date.now()}`;
      }
    }
    next();
  });

  module.exports = mongoose.model('Pedido', PedidoSchema);
}