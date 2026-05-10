import { Router } from 'express';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';

const router = Router();

router.get("/finances", authenticateToken, async (req, res) => {
  const { month } = req.query; // YYYY-MM
  if (!month) return res.status(400).json({ error: "Mes requerido" });

  const finances = db.prepare(`
    SELECT * FROM finances 
    WHERE strftime('%Y-%m', timestamp) = ?
  `).all(month) as any[];

  const workbook = new ExcelJS.Workbook();
  const incomeSheet = workbook.addWorksheet('Ingresos');
  const expenseSheet = workbook.addWorksheet('Egresos');

  const columns = [
    { header: 'Fecha', key: 'timestamp', width: 25 },
    { header: 'Categoría', key: 'category', width: 20 },
    { header: 'Descripción', key: 'description', width: 40 },
    { header: 'Monto', key: 'amount', width: 15 },
  ];

  incomeSheet.columns = columns;
  expenseSheet.columns = columns;

  finances.forEach(f => {
    if (f.type === 'income') incomeSheet.addRow(f);
    else expenseSheet.addRow(f);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="reporte_finanzas_${month}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

router.get("/personnel", authenticateToken, async (req, res) => {
  const personnel = db.prepare("SELECT * FROM firefighters").all() as any[];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Cuerpo Activo');

  sheet.columns = [
    { header: 'Apellido', key: 'lastName', width: 20 },
    { header: 'Nombre', key: 'firstName', width: 20 },
    { header: 'DNI', key: 'dni', width: 15 },
    { header: 'Rango', key: 'rank', width: 15 },
    { header: 'Grupo Sanguíneo', key: 'bloodType', width: 10 },
    { header: 'Teléfono', key: 'phone', width: 15 },
    { header: 'Estado', key: 'status', width: 10 },
    { header: 'Ingreso', key: 'joinDate', width: 15 },
  ];

  sheet.addRows(personnel);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="legajo_personal.xlsx"');

  await workbook.xlsx.write(res);
  res.end();
});

router.get("/finances/pdf", authenticateToken, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: "Mes requerido" });

  const finances = db.prepare(`
    SELECT * FROM finances 
    WHERE strftime('%Y-%m', timestamp) = ?
  `).all(month) as any[];

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="balance_${month}.pdf"`);

  doc.pipe(res);

  doc.fontSize(20).text(`Balance Mensual - ${month}`, { align: 'center' });
  doc.moveDown();

  let totalIncome = 0;
  let totalExpense = 0;

  finances.forEach(f => {
    if (f.type === 'income') totalIncome += f.amount;
    else totalExpense += f.amount;
  });

  doc.fontSize(12).text(`Total Ingresos: $${totalIncome.toLocaleString()}`);
  doc.text(`Total Egresos: $${totalExpense.toLocaleString()}`);
  doc.text(`Balance Neto: $${(totalIncome - totalExpense).toLocaleString()}`, { underline: true });
  
  doc.moveDown();
  doc.text('Detalle de movimientos:');
  doc.moveDown();

  finances.forEach(f => {
    doc.fontSize(10).text(`${f.timestamp.split(' ')[0]} | ${f.type === 'income' ? '+' : '-'} $${f.amount} | ${f.category} - ${f.description}`);
  });

  doc.end();
});

export default router;
