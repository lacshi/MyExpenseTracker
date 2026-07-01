import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, month, year, categoryId, sortBy = 'date', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { householdId: req.user.householdId };
    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      };
    } else if (year) {
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, 0, 1),
        lt: new Date(y + 1, 0, 1),
      };
    }
    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }
    const orderBy = {};
    const validSortFields = ['date', 'amount', 'description', 'paymentMethod'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'date';
    orderBy[field] = sortOrder === 'asc' ? 'asc' : 'desc';
    const [transactions, total, aggregation] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: { category: true },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({ where, _sum: { amount: true } }),
    ]);
    const totalAmount = aggregation._sum.amount || 0;
    res.json({ transactions, total, totalAmount, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { categoryId, date, description, amount, paymentMethod, notes } = req.body;
    if (!categoryId || !date || !description || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'categoryId, date, description, amount, paymentMethod required' });
    }
    const pence = Math.round(parseFloat(amount) * 100);
    if (pence <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const validMethods = ['Cash', 'DebitCard', 'CreditCard', 'DirectDebit', 'StandingOrder', 'BankTransfer'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    const category = await prisma.category.findFirst({
      where: { id: categoryId, householdId: req.user.householdId },
    });
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    const transaction = await prisma.transaction.create({
      data: {
        householdId: req.user.householdId,
        categoryId,
        date: new Date(date),
        description,
        amount: pence,
        paymentMethod,
        notes: notes || null,
        createdBy: req.user.id,
      },
      include: { category: true },
    });
    res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { categoryId, date, description, amount, paymentMethod, notes } = req.body;
    const existing = await prisma.transaction.findFirst({
      where: { id: parseInt(req.params.id), householdId: req.user.householdId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const data = {};
    if (categoryId !== undefined) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, householdId: req.user.householdId },
      });
      if (!category) return res.status(400).json({ error: 'Invalid category' });
      data.categoryId = categoryId;
    }
    if (date !== undefined) data.date = new Date(date);
    if (description !== undefined) data.description = description;
    if (amount !== undefined) {
      const pence = Math.round(parseFloat(amount) * 100);
      if (pence <= 0) return res.status(400).json({ error: 'Amount must be positive' });
      data.amount = pence;
    }
    if (paymentMethod !== undefined) {
      const validMethods = ['Cash', 'DebitCard', 'CreditCard', 'DirectDebit', 'StandingOrder', 'BankTransfer'];
      if (!validMethods.includes(paymentMethod)) return res.status(400).json({ error: 'Invalid payment method' });
      data.paymentMethod = paymentMethod;
    }
    if (notes !== undefined) data.notes = notes;
    const transaction = await prisma.transaction.update({
      where: { id: existing.id },
      data,
      include: { category: true },
    });
    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: parseInt(req.params.id), householdId: req.user.householdId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    await prisma.transaction.delete({ where: { id: existing.id } });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
