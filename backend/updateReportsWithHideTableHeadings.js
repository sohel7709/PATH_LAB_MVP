require('dotenv').config(); // Load .env variables

const mongoose = require('mongoose');
const Report = require('./src/models/Report');
const TestTemplate = require('./src/models/TestTemplate');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathology-lab-saas'; // Use actual DB name from .env

const testsToHideTableHeadingAndReference = [
  'blood group',
  'serum for hiv i & ii test',
  'c-reactive protein (crp)',
  'rapid malaria test',
  'urine examination report',
  'dengue test report',
  'rheumatoid arthritis factor test',
  'typhi dot test',
  'troponin-i test',
  'vdrl test',
  'widal test'
];

async function updateReports() {
  try {
    console.log('Using MongoDB URI:', mongoUri); // Log the URI being used
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const reports = await Report.find({});
    console.log(`Found ${reports.length} reports`);

    for (const report of reports) {
      const results = report.results || [];
      const templateIds = [...new Set(results.map(r => r.templateId).filter(id => id))];

      let templateMap = {};
      if (templateIds.length > 0) {
        const templates = await TestTemplate.find({ '_id': { $in: templateIds } }).select('templateName name');
        templateMap = templates.reduce((map, t) => {
          map[t._id.toString()] = t.templateName || t.name;
          return map;
        }, {});
      }

      const templateNamesLower = results.map(r => {
        const templateName = r.templateId ? (templateMap[r.templateId.toString()] || '') : '';
        return templateName.toLowerCase();
      });

      const hideFlag = templateNamesLower.some(name => testsToHideTableHeadingAndReference.includes(name));

      if (report.hideTableHeadingAndReference !== hideFlag) {
        report.hideTableHeadingAndReference = hideFlag;
        await report.save();
        console.log(`Updated report ${report._id} hideTableHeadingAndReference to ${hideFlag}`);
      } else {
        console.log(`Report ${report._id} already has correct hideTableHeadingAndReference: ${hideFlag}`);
      }
    }

    console.log('All reports processed');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating reports:', error);
    process.exit(1);
  }
}

updateReports();

