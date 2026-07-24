const { z } = require('zod');
const prisma = require('../config/db');

const createProjectSchema = z.object({
  organisationId: z.string(),
  refCode: z.string(),
  name: z.string().min(2),
  client: z.string().min(1),
  location: z.string().optional(),
  stage: z.string().optional(),
});

/** All projects the logged-in user belongs to — this list is what powers
 *  the project switcher in the UI. */
async function listMyProjects(req, res) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.user.id },
    include: { project: true },
    orderBy: { project: { createdAt: 'desc' } },
  });
  res.json(memberships.map((m) => ({ ...m.project, role: m.role })));
}

async function createProject(req, res) {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const project = await prisma.project.create({ data: parsed.data });
  // creator becomes Project Director on their new project by default
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: req.user.id, role: 'PROJECT_DIRECTOR' },
  });
  res.status(201).json(project);
}

async function getProject(req, res) {
  const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ ...project, role: req.projectRole });
}

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    'CHAIRMAN_DIRECTOR', 'PROJECT_DIRECTOR', 'ARCHITECT_CONSULTANT', 'QS_COST_MANAGER',
    'PROCUREMENT_MANAGER', 'SITE_ENGINEER', 'VENDOR_SUPPLIER', 'FACILITY_MANAGER',
  ]),
});

/** Assigns (or re-assigns) a teammate's role on this project. Only a
 *  Project Director or Chairman/Director may change access. */
async function addMember(req, res) {
  if (!['PROJECT_DIRECTOR', 'CHAIRMAN_DIRECTOR'].includes(req.projectRole)) {
    return res.status(403).json({ error: 'Only a Project Director can manage project access' });
  }
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return res.status(404).json({ error: 'No account found for that email — ask them to register first' });

  const membership = await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: req.params.projectId, userId: user.id } },
    update: { role: parsed.data.role },
    create: { projectId: req.params.projectId, userId: user.id, role: parsed.data.role },
  });
  res.status(201).json(membership);
}

module.exports = { listMyProjects, createProject, getProject, addMember };
