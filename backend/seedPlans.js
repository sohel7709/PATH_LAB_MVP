require('dotenv').config({ path: 'backend/.env' }); // Load environment variables relative to execution path
const mongoose = require('mongoose');
const Plan = require('./src/models/Plan'); // Adjust path as needed

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

const plans = [
  {
    planName: 'Trial',
    description: 'Full access to Premium features for a limited time.',
    features: [
      'Up to 5 Admins',
      'Up to 8 Technicians',
      'Unlimited Patients & Reports',
      'Finance Management',
      'Custom Branding (Header/Footer)',
      'WhatsApp Report Sending',
      'Doctor Patient Count Tracking',
      'Personal Lab Website',
      'Export Reports (PDF, Excel)',
    ],
    price: 0,
    currency: 'INR',
    durationInDays: 14, // Default trial duration
    maxAdmins: 5,
    maxTechnicians: 8,
    allowCustomBranding: true,
    allowReportExport: true,
    allowWhatsappSending: true,
    allowDoctorPatientCount: true,
    allowPersonalWebsite: true,
    isPublic: false, // Not shown on pricing page directly
  },
  {
    planName: 'Basic',
    description: 'Essential features for small labs.',
    features: [
      '1 Admin',
      '1 Technician',
      'Unlimited Patients & Reports',
      'Finance Management',
    ],
    price: 0, // Or a specific price, e.g., 499
    currency: 'INR',
    durationInDays: 30, // Assuming monthly billing cycle
    maxAdmins: 1,
    maxTechnicians: 1,
    allowCustomBranding: false,
    allowReportExport: false,
    allowWhatsappSending: false,
    allowDoctorPatientCount: false,
    allowPersonalWebsite: false,
    isPublic: true,
  },
  {
    planName: 'Premium',
    description: 'Advanced features for growing labs.',
    features: [
      'Up to 5 Admins',
      'Up to 8 Technicians',
      'Unlimited Patients & Reports',
      'Finance Management',
      'Custom Branding (Header/Footer)',
      'WhatsApp Report Sending',
      'Doctor Patient Count Tracking',
      'Personal Lab Website',
      'Export Reports (PDF, Excel)',
    ],
    price: 999, // Example price
    currency: 'INR',
    durationInDays: 30, // Assuming monthly billing cycle
    maxAdmins: 5,
    maxTechnicians: 8,
    allowCustomBranding: true,
    allowReportExport: true,
    allowWhatsappSending: true,
    allowDoctorPatientCount: true,
    allowPersonalWebsite: true,
    isPublic: true,
  },
   // Enterprise plan is custom, not seeded here
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // Not needed in Mongoose 6+
      // useFindAndModify: false // Not needed in Mongoose 6+
    });
    console.log('MongoDB Connected for seeding...');

    // Clear existing plans to avoid duplicates if run multiple times
    await Plan.deleteMany({});
    console.log('Existing plans cleared.');

    // Insert new plans
    await Plan.insertMany(plans);
    console.log('Default plans seeded successfully!');

  } catch (err) {
    console.error('Error seeding plans:', err.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDB();
