import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { householdId: req.user.householdId },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, monthlyBudget } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const category = await prisma.category.create({
      data: {
        householdId: req.user.householdId,
        name,
        monthlyBudget: monthlyBudget || 0,
        isDefault: false,
      },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, monthlyBudget } = req.body;
    const existing = await prisma.category.findFirst({
      where: { id: parseInt(req.params.id), householdId: req.user.householdId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const category = await prisma.category.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined && { name }),
        ...(monthlyBudget !== undefined && { monthlyBudget: parseFloat(monthlyBudget.toFixed(2)) }),
      },
    });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.category.findFirst({
      where: { id: parseInt(req.params.id), householdId: req.user.householdId, isDefault: false },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found or cannot delete default' });
    }
    await prisma.category.delete({ where: { id: existing.id } });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
