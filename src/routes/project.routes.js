const router = require('express').Router();
const { requireAuth, requireProjectAccess } = require('../middleware/auth');
const ctrl = require('../controllers/project.controller');

router.use(requireAuth);

router.get('/', ctrl.listMyProjects);        // GET  /api/projects
router.post('/', ctrl.createProject);        // POST /api/projects

router.get('/:projectId', requireProjectAccess, ctrl.getProject);              // GET  /api/projects/:id
router.post('/:projectId/members', requireProjectAccess, ctrl.addMember);      // POST /api/projects/:id/members

module.exports = router;
