const { z } = require('zod');
const prisma = require('../config/db');

const WRITE_ROLES = ['PROJECT_DIRECTOR', 'PROCUREMENT_MANAGER'];

const vendorSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string(),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.string().default('Under Review'),
  sponsored: z.boolean().default(false),
});

/** Every vendor AUR has ever added, org-wide — this is the reusable
 *  directory, independent of any single project. */
async function listForOrganisation(req, res) {
  const vendors = await prisma.vendor.findMany({
    where: { organisationId: req.params.organisationId },
    include: {
      category: true,
      notes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(vendors);
}

/** Vendors linked to one specific project — the view a project page shows. */
async function listForProject(req, res) {
  const links = await prisma.projectVendor.findMany({
    where: { projectId: req.params.projectId },
    include: { vendor: { include: { category: true, notes: { include: { author: { select: { name: true } } } } } } },
  });
  res.json(links.map((l) => ({ ...l.vendor, roleOnProject: l.roleOnProject, linkedAt: l.linkedAt })));
}

/** Adds a vendor to AUR's organisation-wide directory. Does NOT attach it
 *  to any project yet — that's a separate, explicit linking step, so the
 *  same vendor can be reused across many projects without duplication. */
async function create(req, res) {
  if (!WRITE_ROLES.includes(req.orgRole)) {
    return res.status(403).json({ error: `${req.orgRole} cannot add vendors for this organisation` });
  }
  const parsed = vendorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const vendor = await prisma.vendor.create({
      data: { ...parsed.data, organisationId: req.params.organisationId },
    });
    res.status(201).json(vendor);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: `A vendor named "${parsed.data.name}" already exists in this organisation` });
    }
    throw err;
  }
}

/** Links an existing directory vendor to a project — the "reuse, don't
 *  duplicate" step. */
async function linkToProject(req, res) {
  const { projectId } = req.params;
  const { vendorId, roleOnProject } = req.body;
  if (!vendorId) return res.status(400).json({ error: 'vendorId is required' });

  const link = await prisma.projectVendor.upsert({
    where: { projectId_vendorId: { projectId, vendorId } },
    update: { roleOnProject },
    create: { projectId, vendorId, roleOnProject },
  });
  res.status(201).json(link);
}

async function unlinkFromProject(req, res) {
  await prisma.projectVendor.delete({
    where: { projectId_vendorId: { projectId: req.params.projectId, vendorId: req.params.vendorId } },
  });
  res.status(204).send();
}

/** Adds an org-wide-visible note/rating on a vendor. Any teammate in the
 *  organisation can read it — this is institutional memory, not a private
 *  diary entry for whoever wrote it. */
async function addNote(req, res) {
  const { note, rating } = req.body;
  if (!note) return res.status(400).json({ error: 'note text is required' });

  const vendor = await prisma.vendor.findUnique({ where: { id: req.params.vendorId } });
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const membership = await prisma.projectMember.findFirst({
    where: { userId: req.user.id, project: { organisationId: vendor.organisationId } },
  });
  if (!membership) return res.status(403).json({ error: 'You are not a member of the organisation that owns this vendor' });

  const created = await prisma.vendorNote.create({
    data: { vendorId: req.params.vendorId, authorUserId: req.user.id, note, rating: rating || null },
    include: { author: { select: { name: true } } },
  });
  res.status(201).json(created);
}

module.exports = { listForOrganisation, listForProject, create, linkToProject, unlinkFromProject, addNote };
