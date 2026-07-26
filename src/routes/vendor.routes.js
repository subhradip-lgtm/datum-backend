const router = require('express').Router();
const { requireAuth, requireProjectAccess, requireOrgAccess } = require('../middleware/auth');
const ctrl = require('../controllers/vendor.controller');

router.use(requireAuth);

// Organisation-scoped directory — mounted at /api/organisations/:organisationId/vendors
router.get('/organisations/:organisationId/vendors', requireOrgAccess, ctrl.listForOrganisation);
router.post('/organisations/:organisationId/vendors', requireOrgAccess, ctrl.create);
router.post('/vendors/:vendorId/notes', requireAuth, ctrl.addNote); // any authenticated teammate can add a note

// Project-scoped linking — mounted at /api/projects/:projectId/vendors
router.get('/projects/:projectId/vendors', requireProjectAccess, ctrl.listForProject);
router.post('/projects/:projectId/vendors/link', requireProjectAccess, ctrl.linkToProject);
router.delete('/projects/:projectId/vendors/:vendorId', requireProjectAccess, ctrl.unlinkFromProject);

module.exports = router;
