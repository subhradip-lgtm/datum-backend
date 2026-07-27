const { z } = require('zod');
const prisma = require('../config/db');

const categorySchema = z.object({
  type: z.enum(['CONSULTANT', 'CONTRACTOR', 'SUPPLIER']),
  name: z.string().min(2),
});

/** Every category in the shared taxonomy, grouped for the dropdown UI.
 *  Open to any authenticated user — everyone needs to read this list to
 *  add a vendor, only the platform owner can change it. */
async function list(req, res) {
  const categories = await prisma.directoryCategory.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] });
  res.json(categories);
}

/** Adds a new category to the shared taxonomy. Deliberately platform-wide,
 *  not per-organisation — the whole point is a consistent, curated list
 *  every firm on the platform sees the same way, not everyone inventing
 *  their own. Gated to the platform owner via requirePlatformAdmin. */
async function create(req, res) {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const category = await prisma.directoryCategory.create({ data: parsed.data });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `"${parsed.data.name}" already exists under ${parsed.data.type}` });
    }
    throw err;
  }
}

module.exports = { list, create };
