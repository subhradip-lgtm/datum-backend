const router = require('express').Router({ mergeParams: true });
const { requireAuth, requireProjectAccess } = require('../middleware/auth');
const ctrl = require('../controllers/boq.controller');

// Mounted at /api/projects/:projectId/boq — see server.js
router.use(requireAuth, requireProjectAccess);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:itemId', ctrl.update);
router.delete('/:itemId', ctrl.remove);

module.exports = router;

/* Vendors, QuantityEntry and ProcurementItem follow the exact same shape:
 *   routes/vendor.routes.js, routes/quantity.routes.js, routes/procurement.routes.js
 *   controllers/vendor.controller.js, etc.
 * each mirroring boq.controller.js (list/create/update/remove scoped to
 * :projectId, gated by requireProjectAccess + a WRITE_ROLES check). They're
 * omitted here to avoid pasting near-identical boilerplate four times —
 * copy boq.controller.js + boq.routes.js as the template for each. */
