const router = require('express').Router();
const { requireAuth, requirePlatformAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/directoryCategory.controller');

router.use(requireAuth);

router.get('/', ctrl.list);                            // any authenticated user
router.post('/', requirePlatformAdmin, ctrl.create);    // platform owner only

module.exports = router;
