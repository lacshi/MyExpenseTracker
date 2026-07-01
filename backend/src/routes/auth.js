import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, householdName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const household = await prisma.household.create({
      data: { name: householdName || `${name}'s Household` },
    });
    const user = await prisma.user.create({
      data: { name, email, passwordHash, householdId: household.id },
    });
    await seedCategories(household.id);
    const token = jwt.sign(
      { id: user.id, email: user.email, householdId: user.householdId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user.id, name, email, householdId: user.householdId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, householdId: user.householdId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, householdId: user.householdId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

async function seedCategories(householdId) {
  const categories = [
    'Housing (Rent/Mortgage)',
    'Council Tax',
    'Gas & Electricity',
    'Water',
    'TV Licence',
    'Broadband & Mobile',
    'Groceries',
    'Eating Out & Takeaway',
    'Transport & Fuel',
    'Car Insurance & Maintenance',
    'Health & Personal Care',
    'Insurance (Home/Life/Contents)',
    'Childcare & Education',
    'Clothing',
    'Fitness & Wellbeing',
    'Entertainment & Subscriptions',
    'Holidays & Days Out',
    'Gifts & Donations',
    'Savings & Investments',
    'Household & Furnishing',
    'Debt Repayments',
    'Miscellaneous',
  ];
  await prisma.category.createMany({
    data: categories.map((name) => ({
      householdId,
      name,
      monthlyBudget: 0,
      isDefault: true,
    })),
  });
}

export default router;
