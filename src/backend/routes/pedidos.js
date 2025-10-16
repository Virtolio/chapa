const express = require('express');
const Pedido = require('../models/Pedido');
const Inventario = require('../models/Inventario');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Obtener todos los pedidos
router.get('/', auth, async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({ message: 'Error obteniendo pedidos' });
  }
});

// Obtener un pedido por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ message: 'Error obteniendo pedido' });
  }
});

// Crear nuevo pedido con validación de inventario
router.post('/', auth, async (req, res) => {
  try {
    const { cantidadChapitas, medida, tipoChapa, materialChapa } = req.body;
    
    console.log('🔍 Verificando inventario para:', { medida, tipoChapa, materialChapa, cantidadChapitas });
    
    // Buscar el item en el inventario
    const itemInventario = await Inventario.findOne({
      medida: medida,
      tipoChapa: tipoChapa,
      materialChapa: materialChapa
    });
    
    if (!itemInventario) {
      return res.status(400).json({ 
        message: `No existe stock para: ${medida} - ${tipoChapa} - ${materialChapa}. Primero debe agregarlo al inventario.` 
      });
    }
    
    if (itemInventario.cantidadDisponible < cantidadChapitas) {
      return res.status(400).json({ 
        message: `Stock insuficiente. Disponible: ${itemInventario.cantidadDisponible}, Solicitado: ${cantidadChapitas}` 
      });
    }
    
    // Descontar del inventario
    itemInventario.cantidadDisponible -= cantidadChapitas;
    await itemInventario.save();
    
    console.log('✅ Stock actualizado. Nuevo stock:', itemInventario.cantidadDisponible);
    
    // Crear el pedido con referencia al inventario
    const nuevoPedido = new Pedido({
      ...req.body,
      inventarioId: itemInventario._id
    });
    
    await nuevoPedido.save();
    
    // Devolver el pedido con información del inventario actualizado
    const pedidoConInfo = await Pedido.findById(nuevoPedido._id);
    
    res.status(201).json({
      pedido: pedidoConInfo,
      inventarioActualizado: {
        id: itemInventario._id,
        cantidadDisponible: itemInventario.cantidadDisponible
      }
    });
    
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(400).json({ message: 'Error creando pedido: ' + error.message });
  }
});

// Actualizar pedido
router.put('/:id', auth, async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(400).json({ message: 'Error actualizando pedido' });
  }
});

// Eliminar pedido (devolver stock al inventario)
router.delete('/:id', auth, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    // Si el pedido tiene inventario asociado, devolver el stock
    if (pedido.inventarioId) {
      const itemInventario = await Inventario.findById(pedido.inventarioId);
      if (itemInventario) {
        itemInventario.cantidadDisponible += pedido.cantidadChapitas;
        await itemInventario.save();
        console.log('✅ Stock devuelto al inventario:', itemInventario.cantidadDisponible);
      }
    }
    
    await Pedido.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Pedido eliminado exitosamente',
      stockDevuelto: pedido.inventarioId ? pedido.cantidadChapitas : 0
    });
    
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({ message: 'Error eliminando pedido' });
  }
});

module.exports = router;