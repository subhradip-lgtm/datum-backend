const crypto = require('crypto');
const Razorpay = require('razorpay');
const prisma = require('../config/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_PRICES_PAISE = {
  Studio: 4900 * 100,   // ₹4,900 / month — single active project
  Practice: 14900 * 100, // ₹14,900 / month — up to 10 projects, multi-user roles
  Enterprise: null,      // custom — sales-assisted
};

/** Creates a Razorpay order for a subscription plan. The frontend opens
 *  Razorpay Checkout with the returned order_id; on success Razorpay calls
 *  our webhook (below) to confirm payment server-side — never trust the
 *  client-side "success" callback alone for activating a subscription. */
async function createOrder(req, res) {
  const { organisationId, plan } = req.body;
  const amount = PLAN_PRICES_PAISE[plan];
  if (!amount) return res.status(400).json({ error: `Unknown or non-self-serve plan: ${plan}` });

  const subscription = await prisma.subscription.upsert({
    where: { organisationId },
    update: { plan, status: 'PAST_DUE' },
    create: { organisationId, plan, status: 'TRIAL' },
  });

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `sub_${subscription.id}_${Date.now()}`,
    notes: { organisationId, plan },
  });

  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      razorpayOrderId: order.id,
      amountPaise: amount,
      status: 'created',
    },
  });

  res.json({ orderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
}

/** Razorpay webhook — verify the signature before trusting the payload.
 *  Register this URL (…/api/payments/webhook) in the Razorpay dashboard. */
async function webhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody) // requires the raw body — see server.js body-parser config
    .digest('hex');

  if (signature !== expected) return res.status(400).json({ error: 'Invalid webhook signature' });

  const event = req.body;
  if (event.event === 'payment.captured') {
    const { order_id, id: paymentId } = event.payload.payment.entity;
    const payment = await prisma.payment.update({
      where: { razorpayOrderId: order_id },
      data: { status: 'paid', razorpayPaymentId: paymentId },
    });
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'ACTIVE' },
    });
  }
  res.status(200).json({ received: true });
}

async function history(req, res) {
  const sub = await prisma.subscription.findUnique({
    where: { organisationId: req.params.organisationId },
    include: { payments: { orderBy: { createdAt: 'desc' } } },
  });
  res.json(sub || { plan: null, status: 'TRIAL', payments: [] });
}

module.exports = { createOrder, webhook, history };
