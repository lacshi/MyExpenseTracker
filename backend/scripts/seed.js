/**
 * SEED SCRIPT
 * ===========
 * Run ONLY against an empty database to create demo data.
 *   node scripts/seed.js
 *
 * This creates: a demo household, one user, 22 default categories,
 * and several weeks of sample transactions for development/testing.
 *
 * WARNING: This will fail if the database already has data (unique
 * constraint on email). That's intentional — run against a fresh DB.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const UK_CATEGORIES = [
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

const PAYMENT_METHODS = ['Cash', 'DebitCard', 'CreditCard', 'DirectDebit', 'StandingOrder', 'BankTransfer'];

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const household = await prisma.household.create({
    data: { name: 'Demo Family' },
  });

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      passwordHash,
      householdId: household.id,
    },
  });

  console.log(`Created household: ${household.name} (id: ${household.id})`);
  console.log(`Created user: ${user.email} / password: password123`);

  const categories = [];
  for (const name of UK_CATEGORIES) {
    const cat = await prisma.category.create({
      data: { householdId: household.id, name, monthlyBudget: 0, isDefault: true },
    });
    categories.push(cat);
  }
  console.log(`Created ${categories.length} default categories`);

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = now;

  const sampleTransactions = [
    { categoryName: 'Housing (Rent/Mortgage)', min: 950, max: 1050, count: 1 },
    { categoryName: 'Council Tax', min: 150, max: 200, count: 1 },
    { categoryName: 'Gas & Electricity', min: 80, max: 180, count: 2 },
    { categoryName: 'Water', min: 30, max: 50, count: 1 },
    { categoryName: 'TV Licence', min: 13, max: 14, count: 1 },
    { categoryName: 'Broadband & Mobile', min: 40, max: 80, count: 1 },
    { categoryName: 'Groceries', min: 30, max: 120, count: 8 },
    { categoryName: 'Eating Out & Takeaway', min: 10, max: 60, count: 6 },
    { categoryName: 'Transport & Fuel', min: 20, max: 80, count: 6 },
    { categoryName: 'Car Insurance & Maintenance', min: 30, max: 300, count: 1 },
    { categoryName: 'Health & Personal Care', min: 5, max: 40, count: 3 },
    { categoryName: 'Insurance (Home/Life/Contents)', min: 20, max: 60, count: 1 },
    { categoryName: 'Clothing', min: 15, max: 80, count: 2 },
    { categoryName: 'Entertainment & Subscriptions', min: 5, max: 25, count: 4 },
    { categoryName: 'Miscellaneous', min: 5, max: 30, count: 3 },
  ];

  let transactionCount = 0;
  for (const sample of sampleTransactions) {
    const cat = categories.find((c) => c.name === sample.categoryName);
    if (!cat) continue;
    for (let i = 0; i < sample.count; i++) {
      const amount = randomAmount(sample.min, sample.max);
      const date = randomDate(startDate, endDate);
      const method = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)];
      await prisma.transaction.create({
        data: {
          householdId: household.id,
          categoryId: cat.id,
          date,
          description: `Sample ${cat.name}`,
          amount,
          paymentMethod: method,
          createdBy: user.id,
        },
      });
      transactionCount++;
    }
  }

  console.log(`Created ${transactionCount} sample transactions`);
  console.log('\nSeed complete!');
  console.log('Login with: demo@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
