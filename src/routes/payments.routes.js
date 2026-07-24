const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/payments.controller');

router.post('/create-order', requireAuth, ctrl.createOrder);
router.get('/history/:organisationId', requireAuth, ctrl.history);

// NOTE: webhook is mounted separately in server.js with express.raw()
// middleware (Razorpay signature verification needs the untouched raw body).
module.exports = router;
