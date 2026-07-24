const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/** Verifies the bearer JWT and attaches { id, email } to req.user. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Loads the caller's ProjectMember row for :projectId and attaches req.projectRole.
 * Must run after requireAuth. This is what makes multi-project switching safe —
 * a user's role (and access) is scoped per project, not global.
 */
async function requireProjectAccess(req, res, next) {
  const { projectId } = req.params;
  if (!projectId) return res.status(400).json({ error: 'projectId is required in the route' });

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ error: 'You are not a member of this project' });

  req.projectRole = membership.role;
  next();
}

/** Restricts a route to a set of ProjectRole values. Use after requireProjectAccess. */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.projectRole)) {
      return res.status(403).json({ error: `Role ${req.projectRole} cannot perform this action` });
    }
    next();
  };
}

module.exports = { requireAuth, requireProjectAccess, requireRole };
