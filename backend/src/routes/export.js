import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const router = Router();
const prisma = new PrismaClient();

router.get('/monthly', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const format = req.query.format || 'csv';
    const householdId = req.user.householdId;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const transactions = await prisma.transaction.findMany({
      where: { householdId, date: { gte: startDate, lt: endDate } },
      include: { category: true },
      orderBy: { date: 'asc' },
    });
    const rows = transactions.map((t) => ({
      Date: new Date(t.date).toISOString().split('T')[0],
      Category: t.category.name,
      Description: t.description,
      Amount: (t.amount / 100).toFixed(2),
      'Payment Method': t.paymentMethod,
      Notes: t.notes || '',
    }));
    const categoryTotals = {};
    for (const t of transactions) {
      const name = t.category.name;
      categoryTotals[name] = (categoryTotals[name] || 0) + t.amount;
    }
    const grandTotal = transactions.reduce((s, t) => s + t.amount, 0);
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`${month}-${year}`);
      sheet.columns = [
        { header: 'Date', key: 'Date', width: 12 },
        { header: 'Category', key: 'Category', width: 30 },
        { header: 'Description', key: 'Description', width: 40 },
        { header: 'Amount (£)', key: 'Amount', width: 14 },
        { header: 'Payment Method', key: 'Payment Method', width: 18 },
        { header: 'Notes', key: 'Notes', width: 30 },
      ];
      sheet.getRow(1).font = { bold: true };
      rows.forEach((r) => sheet.addRow(r));
      sheet.addRow({});
      sheet.addRow({ Category: 'SUMMARY', Description: '', Amount: '', 'Payment Method': '', Notes: '' });
      sheet.getRow(sheet.rowCount).font = { bold: true };
      for (const [cat, total] of Object.entries(categoryTotals)) {
        sheet.addRow({ Category: cat, Amount: `£${(total / 100).toFixed(2)}` });
      }
      sheet.addRow({});
      const totalRow = sheet.addRow({ Category: 'GRAND TOTAL', Amount: `£${(grandTotal / 100).toFixed(2)}` });
      totalRow.font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="expenses-${month}-${year}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      let csv = 'Date,Category,Description,Amount (£),Payment Method,Notes\n';
      for (const r of rows) {
        const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
        csv += `${esc(r.Date)},${esc(r.Category)},${esc(r.Description)},${esc(r.Amount)},${esc(r['Payment Method'])},${esc(r.Notes)}\n`;
      }
      csv += '\nSUMMARY\n';
      for (const [cat, total] of Object.entries(categoryTotals)) {
        csv += `${cat},£${(total / 100).toFixed(2)}\n`;
      }
      csv += `\nGRAND TOTAL,£${(grandTotal / 100).toFixed(2)}\n`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses-${month}-${year}.csv"`);
      res.send(csv);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
