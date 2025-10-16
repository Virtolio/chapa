const express = require('express');
const Despacho = require('../models/Despacho');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Obtener todos los despachos
router.get('/', auth, async (req, res) => {
  try {
    const despachos = await Despacho.find().sort({ createdAt: -1 });
    res.json(despachos);
  } catch (error) {
    console.error('Error obteniendo despachos:', error);
    res.status(500).json({ message: 'Error obteniendo despachos' });
  }
});

// Obtener un despacho por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const despacho = await Despacho.findById(req.params.id);
    if (!despacho) {
      return res.status(404).json({ message: 'Despacho no encontrado' });
    }
    res.json(despacho);
  } catch (error) {
    console.error('Error obteniendo despacho:', error);
    res.status(500).json({ message: 'Error obteniendo despacho' });
  }
});

// Crear nuevo despacho
router.post('/', auth, async (req, res) => {
    try {
        console.log('📦 Creando nuevo despacho:', req.body);
        
        const nuevoDespacho = new Despacho(req.body);
        await nuevoDespacho.save();
        
        console.log('✅ Despacho creado exitosamente:', nuevoDespacho);
        res.status(201).json(nuevoDespacho);
        
    } catch (error) {
        console.error('❌ Error creando despacho:', error);
        res.status(400).json({ 
            message: 'Error creando despacho: ' + error.message 
        });
    }
});

// Actualizar despacho
router.put('/:id', auth, async (req, res) => {
  try {
    const despacho = await Despacho.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!despacho) {
      return res.status(404).json({ message: 'Despacho no encontrado' });
    }
    
    res.json(despacho);
  } catch (error) {
    console.error('Error actualizando despacho:', error);
    res.status(400).json({ message: 'Error actualizando despacho' });
  }
});

// Eliminar despacho
router.delete('/:id', auth, async (req, res) => {
  try {
    const despacho = await Despacho.findByIdAndDelete(req.params.id);
    
    if (!despacho) {
      return res.status(404).json({ message: 'Despacho no encontrado' });
    }
    
    res.json({ message: 'Despacho eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando despacho:', error);
    res.status(500).json({ message: 'Error eliminando despacho' });
  }
});

module.exports = router;