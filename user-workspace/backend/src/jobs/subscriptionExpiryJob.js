// backend/src/jobs/subscriptionExpiryJob.js
const cron = require('node-cron');
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Lab = require('../models/Lab');
const Plan = require('../models/Plan');
const { calculateEndDate } = require('../controllers/subscriptionController'); // Reuse helper

const handleExpiredSubscriptions = async () => {
    console.log('Running subscription expiry check job...');
    const now = new Date();

    try {
        // Find subscriptions that are active or trial and whose end date is in the past
        const expiredSubscriptions = await Subscription.find({
            status: { $in: ['active', 'trial'] },
            endDate: { $lt: now }
        }).populate('labId').populate('planId'); // Populate needed refs

        if (expiredSubscriptions.length === 0) {
            console.log('Subscription Expiry Job: No expired subscriptions found.');
            return;
        }

        console.log(`Subscription Expiry Job: Found ${expiredSubscriptions.length} expired subscription(s).`);

        // Fetch the Basic plan once
        const basicPlan = await Plan.findOne({ planName: 'Basic' });
        if (!basicPlan) {
            console.error('Subscription Expiry Job: Basic plan not found. Cannot downgrade expired trials automatically.');
            // Continue processing other expirations but log this critical issue
        }

        for (const sub of expiredSubscriptions) {
            const wasTrial = sub.status === 'trial';
            const lab = sub.labId; // Populated lab document

            console.log(`Processing expired subscription ${sub._id} for Lab ${lab?._id} (Plan: ${sub.planId?.planName}, EndDate: ${sub.endDate})`);

            // 1. Mark the subscription as expired
            sub.status = 'expired';
            await sub.save();
            console.log(`  - Subscription ${sub._id} status updated to expired.`);

            // 2. Handle Lab's currentSubscription link
            // Only update lab if the *currently active* subscription is the one that just expired
            if (lab && lab.currentSubscription && lab.currentSubscription.toString() === sub._id.toString()) {
                console.log(`  - This was the active subscription for Lab ${lab._id}.`);

                if (wasTrial && basicPlan) {
                    // 3a. If it was a trial and Basic plan exists, create a new Basic subscription
                    console.log(`  - Expired trial. Attempting to downgrade Lab ${lab._id} to Basic plan.`);
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
                        console.log(`    - New Basic subscription ${newBasicSubscription._id} created.`);

                        // Update lab's current subscription to the new Basic one
                        lab.currentSubscription = newBasicSubscription._id;
                        await lab.save();
                        console.log(`    - Lab ${lab._id} currentSubscription updated to Basic plan subscription ${newBasicSubscription._id}.`);

                    } catch (downgradeError) {
                        console.error(`    - Error creating Basic subscription for Lab ${lab._id}:`, downgradeError);
                        // If downgrade fails, lab is left without an active subscription
                        lab.currentSubscription = null;
                        lab.status = 'inactive'; // Mark lab inactive if downgrade fails? Decide policy.
                        await lab.save();
                        console.log(`    - Lab ${lab._id} currentSubscription set to null due to downgrade error.`);
                    }
                } else {
                    // 3b. If it was not a trial, or Basic plan doesn't exist, just remove the link
                    console.log(`  - Expired active plan or Basic plan not found. Setting Lab ${lab._id} currentSubscription to null.`);
                    lab.currentSubscription = null;
                    lab.status = 'inactive'; // Mark lab inactive? Decide policy.
                    await lab.save();
                }
            } else if (lab && !lab.currentSubscription) {
                 console.log(`  - Lab ${lab._id} already had no active subscription set. No lab update needed.`);
            } else if (lab && lab.currentSubscription) {
                 console.log(`  - Lab ${lab._id}'s active subscription (${lab.currentSubscription}) is different. No lab update needed.`);
            } else {
                 console.warn(`  - Could not find associated Lab document for subscription ${sub._id}. Cannot update lab status.`);
            }
        }

        console.log('Subscription expiry check job finished.');

    } catch (error) {
        console.error('Error during subscription expiry check job:', error);
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

    console.log('Subscription expiry check job scheduled to run daily at midnight (Asia/Calcutta).');

    // Optional: Run once immediately on startup for testing or catching up
    // handleExpiredSubscriptions();
};

module.exports = { scheduleSubscriptionJob, handleExpiredSubscriptions }; // Export function to start scheduling
