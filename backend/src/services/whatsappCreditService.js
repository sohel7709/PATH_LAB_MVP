const Lab = require('../models/Lab');
const WhatsAppCreditTransaction = require('../models/WhatsAppCreditTransaction');

/**
 * Atomically consume one WhatsApp credit from a lab's balance.
 *
 * Uses a conditional $inc so concurrent sends can never push the balance
 * below zero or double-spend the last credit. Returns { ok: false } when the
 * lab has no credits left — the caller must then skip the send.
 *
 * Ledger writes are fire-and-forget: a logging failure must never break the
 * (already best-effort) WhatsApp notification flow.
 *
 * @returns {Promise<{ ok: boolean, balanceAfter?: number }>}
 */
async function tryConsumeCredit({ labId, relatedReport = null, recipientType = null }) {
  if (!labId) return { ok: false };

  const updated = await Lab.findOneAndUpdate(
    { _id: labId, whatsappCredits: { $gte: 1 } },
    { $inc: { whatsappCredits: -1 } },
    { new: true }
  ).select('whatsappCredits');

  if (!updated) {
    return { ok: false };
  }

  WhatsAppCreditTransaction.create({
    lab: labId,
    type: 'deduction',
    amount: 1,
    balanceAfter: updated.whatsappCredits,
    relatedReport: relatedReport || undefined,
    recipientType: recipientType || undefined,
  }).catch((err) => {
    console.error('Failed to record WhatsApp credit deduction:', err.message);
  });

  return { ok: true, balanceAfter: updated.whatsappCredits };
}

/**
 * Refund one previously-consumed credit (e.g. the WhatsApp send failed after
 * the credit was deducted). Atomic $inc and a ledger entry. Fire-and-forget
 * safe: never throws into the notification flow.
 */
async function refundCredit({ labId, relatedReport = null, recipientType = null, reason = 'send_failed' }) {
  if (!labId) return;
  try {
    const updated = await Lab.findByIdAndUpdate(
      labId,
      { $inc: { whatsappCredits: 1 } },
      { new: true }
    ).select('whatsappCredits');

    if (!updated) return;

    await WhatsAppCreditTransaction.create({
      lab: labId,
      type: 'refund',
      amount: 1,
      balanceAfter: updated.whatsappCredits,
      relatedReport: relatedReport || undefined,
      recipientType: recipientType || undefined,
      reason,
    });
  } catch (err) {
    console.error('Failed to refund WhatsApp credit:', err.message);
  }
}

/**
 * Add credits to a lab's balance (super-admin top-up). Atomic $inc.
 *
 * @returns {Promise<{ lab: object, balanceAfter: number }>}
 */
async function addCredits({ labId, amount, performedBy = null, reason = '' }) {
  const credits = Math.floor(Number(amount));
  if (!labId || !Number.isFinite(credits) || credits <= 0) {
    throw new Error('A positive credit amount is required');
  }

  const updated = await Lab.findByIdAndUpdate(
    labId,
    { $inc: { whatsappCredits: credits } },
    { new: true }
  );

  if (!updated) {
    throw new Error('Lab not found');
  }

  await WhatsAppCreditTransaction.create({
    lab: labId,
    type: 'topup',
    amount: credits,
    balanceAfter: updated.whatsappCredits,
    performedBy,
    reason,
  });

  return { lab: updated, balanceAfter: updated.whatsappCredits };
}

module.exports = { tryConsumeCredit, refundCredit, addCredits };
