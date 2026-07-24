const router = require('express').Router({ mergeParams: true });
const { requireAuth, requireProjectAccess } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/files.controller');

// Mounted at /api/projects/:projectId/files — see server.js
router.use(requireAuth, requireProjectAccess);

router.post('/', upload.single('file'), ctrl.upload);
router.get('/', ctrl.list);
router.get('/:fileId/preview/:page', ctrl.previewPage);
router.get('/:fileId/download', ctrl.download);

module.exports = router;
