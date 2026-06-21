// backend/src/jobs/subscriptionExpiryJob.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Lab = require('../models/Lab');
const Plan = require('../models/Plan');
const { calculateEndDate } = require('../controllers/subscriptionController'); // Reuse helper

const handleExpiredSubscriptions = async () => {
    const now = new Date();

    try {
        // Find subscriptions that are active or trial and whose end date is in the past
        const expiredSubscriptions = await Subscription.find({
            status: { $in: ['active', 'trial'] },
            endDate: { $lt: now }
        }).populate('labId').populate('planId'); // Populate needed refs

        if (expiredSubscriptions.length === 0) {
            return;
        }


        // Fetch the Basic plan once
        const basicPlan = await Plan.findOne({ planName: 'Basic' });
        if (!basicPlan) {
            // Continue processing other expirations but log this critical issue
        }

        for (const sub of expiredSubscriptions) {
            const wasTrial = sub.status === 'trial';
            const lab = sub.labId; // Populated lab document


            // 1. Mark the subscription as expired
            sub.status = 'expired';
            await sub.save();

            // 2. Handle Lab's currentSubscription link
            // Only update lab if the *currently active* subscription is the one that just expired
            if (lab && lab.currentSubscription && lab.currentSubscription.toString() === sub._id.toString()) {

                if (wasTrial && basicPlan) {
                    // 3a. If it was a trial and Basic plan exists, create a new Basic subscription
                    const startDate = new Date(); // Start Basic plan now
                    const endDate = calculateEndDate(startDate, basicPlan.durationInDays);

                    try {
                        const newBasicSubscription = new Subscription({
                            labId: lab._id,
                            planId: basicPlan._id,
                            startDate: startDate,
                            endDate: endDate,
                            status: 'active', // Start as active
                            paymentProvider: 'None',
                            paymentId: 'auto_downgrade_from_trial',
                            autoRenew: false, // Default auto-renew off for basic? Decide policy.
                        });
                        await newBasicSubscription.save();

                        // Update lab's current subscription to the new Basic one
                        lab.currentSubscription = newBasicSubscription._id;
                        await lab.save();

                    } catch (downgradeError) {
                        // If downgrade fails, lab is left without an active subscription
                        lab.currentSubscription = null;
                        lab.status = 'inactive'; // Mark lab inactive if downgrade fails? Decide policy.
                        await lab.save();
                    }
                } else {
                    // 3b. If it was not a trial, or Basic plan doesn't exist, just remove the link
                    lab.currentSubscription = null;
                    lab.status = 'inactive'; // Mark lab inactive? Decide policy.
                    await lab.save();
                }
            } else if (lab && !lab.currentSubscription) {
            } else if (lab && lab.currentSubscription) {
            } else {
            }
        }


    } catch (error) {
    }
};

// Schedule the job to run once daily at midnight
// Adjust the cron schedule as needed (e.g., '0 1 * * *' for 1 AM)
const scheduleSubscriptionJob = () => {
    // Run daily at 00:00 (midnight) server time
    cron.schedule('0 0 * * *', handleExpiredSubscriptions, {
        scheduled: true,
        timezone: "Asia/Calcutta" // Optional: Set timezone if server time differs from desired run time zone
    });


    // Optional: Run once immediately on startup for testing or catching up
    // handleExpiredSubscriptions();
};

module.exports = { scheduleSubscriptionJob, handleExpiredSubscriptions }; // Export function to start scheduling
