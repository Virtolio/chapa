const express = require('express');
const Inventario = require('../models/Inventario');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Obtener todo el inventario
router.get('/', auth, async (req, res) => {
  try {
    const inventario = await Inventario.find().sort({ createdAt: -1 });
    res.json(inventario);
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({ message: 'Error obteniendo inventario' });
  }
});

// Crear nuevo item en inventario (solo admin)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const nuevoItem = new Inventario(req.body);
    await nuevoItem.save();
    res.status(201).json(nuevoItem);
  } catch (error) {
    console.error('Error creando item:', error);
    res.status(400).json({ message: 'Error creando item' });
  }
});

// Actualizar item (solo admin)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const item = await Inventario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(400).json({ message: 'Error actualizando item' });
  }
});

// Obtener un item específico por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Inventario.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error obteniendo item:', error);
    res.status(500).json({ message: 'Error obteniendo item' });
  }
});

// Eliminar item (solo admin)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const item = await Inventario.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    res.json({ message: 'Item eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({ message: 'Error eliminando item' });
  }
});

module.exports = router;