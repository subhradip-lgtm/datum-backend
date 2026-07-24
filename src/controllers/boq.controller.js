const { z } = require('zod');
const prisma = require('../config/db');

const boqSchema = z.object({
  dsrRef: z.string().default('R.O.'),
  discipline: z.string(),
  description: z.string().min(1),
  unit: z.string(),
  qty: z.number().default(0),
  rate: z.number().default(0),
  status: z.enum(['CONFIRMED', 'PENDING_INPUT', 'RATE_ONLY']).default('PENDING_INPUT'),
});

const WRITE_ROLES = ['PROJECT_DIRECTOR', 'QS_COST_MANAGER', 'ARCHITECT_CONSULTANT'];

async function list(req, res) {
  const items = await prisma.boqItem.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'asc' },
  });
  // R.O. and Pending items are returned but flagged — the client is expected
  // to exclude them from totals, matching AUR's "R.O. = zero to totals" rule.
  const confirmedTotal = items
    .filter((i) => i.status === 'CONFIRMED')
    .reduce((sum, i) => sum + i.qty * i.rate, 0);
  res.json({ items, confirmedTotal });
}

async function create(req, res) {
  if (!WRITE_ROLES.includes(req.projectRole)) {
    return res.status(403).json({ error: `${req.projectRole} cannot add BOQ items` });
  }
  const parsed = boqSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await prisma.boqItem.create({
    data: { ...parsed.data, projectId: req.params.projectId },
  });
  res.status(201).json(item);
}

async function update(req, res) {
  if (!WRITE_ROLES.includes(req.projectRole)) {
    return res.status(403).json({ error: `${req.projectRole} cannot edit BOQ items` });
  }
  const parsed = boqSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await prisma.boqItem.update({
    where: { id: req.params.itemId },
    data: parsed.data,
  });
  res.json(item);
}

async function remove(req, res) {
  if (!WRITE_ROLES.includes(req.projectRole)) {
    return res.status(403).json({ error: `${req.projectRole} cannot delete BOQ items` });
  }
  await prisma.boqItem.delete({ where: { id: req.params.itemId } });
  res.status(204).send();
}

module.exports = { list, create, update, remove };
