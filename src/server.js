require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const boqRoutes = require('./routes/boq.routes');
const filesRoutes = require('./routes/files.routes');
const paymentsRoutes = require('./routes/payments.routes');
const paymentsController = require('./controllers/payments.controller');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Razorpay webhook needs the raw request body for signature verification —
// mount it BEFORE the global express.json() parser below.
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => { req.rawBody = req.body; req.body = JSON.parse(req.body); next(); },
  paymentsController.webhook
);

app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'datum-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/boq', boqRoutes);
app.use('/api/projects/:projectId/files', filesRoutes);
app.use('/api/payments', paymentsRoutes);

/* Same mounting pattern to add once vendor/quantity/procurement routes exist:
 *   app.use('/api/projects/:projectId/vendors', vendorRoutes);
 *   app.use('/api/projects/:projectId/quantity', quantityRoutes);
 *   app.use('/api/projects/:projectId/procurement', procurementRoutes);
 */

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Datum backend listening on :${PORT}`));
