/**
 * CLEAR-TRANSACTIONS SCRIPT
 * =========================
 * Safely deletes ALL rows from the Transaction table only.
 * Never touches Category, User, or Household tables.
 *
 *   node scripts/clear-transactions.js
 *
 * Use this to wipe dummy transactions during development
 * WITHOUT losing your category setup, user accounts, or
 * household configuration.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all transactions...');

  const count = await prisma.transaction.count();
  console.log(`Current transaction count: ${count}`);

  await prisma.transaction.deleteMany();

  const remaining = await prisma.transaction.count();
  console.log(`After deletion: ${remaining} transactions`);
  console.log('Done. Categories, Users, and Households were NOT touched.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
