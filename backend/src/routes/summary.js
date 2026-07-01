import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const householdId = req.user.householdId;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: startDate, lt: endDate },
      },
      include: { category: true },
    });
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthTransactions = transactions.filter(
        (t) => new Date(t.date).getMonth() === i
      );
      const categories = {};
      for (const t of monthTransactions) {
        const catName = t.category.name;
        categories[catName] = (categories[catName] || 0) + t.amount;
      }
      return {
        month: i + 1,
        total: monthTransactions.reduce((s, t) => s + t.amount, 0),
        categories,
      };
    });
    res.json({ year, months });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const householdId = req.user.householdId;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const categories = await prisma.category.findMany({
      where: { householdId },
    });
    const transactions = await prisma.transaction.findMany({
      where: {
        householdId,
        date: { gte: startDate, lt: endDate },
      },
    });
    const totalBudget = categories.reduce((s, c) => s + c.monthlyBudget * 100, 0);
    const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
    const budgetVsActual = categories.map((cat) => {
      const spent = transactions
        .filter((t) => t.categoryId === cat.id)
        .reduce((s, t) => s + t.amount, 0);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        budget: cat.monthlyBudget * 100,
        spent,
        remaining: cat.monthlyBudget * 100 - spent,
        percentUsed: cat.monthlyBudget > 0 ? (spent / (cat.monthlyBudget * 100)) * 100 : 0,
      };
    });
    res.json({
      year,
      month,
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      budgetVsActual,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
