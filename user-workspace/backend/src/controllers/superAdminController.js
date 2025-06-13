const Lab = require('../models/Lab');
const Patient = require('../models/Patient');
const Report = require('../models/Report');

const getIntelligenceData = async (req, res) => {
  try {
    // Get all labs and count
    const labs = await Lab.find({}, 'name');
    const labCount = labs.length;

    // Get total patients count
    const patientCount = await Patient.countDocuments();

    // Get total reports count
    const reportCount = await Report.countDocuments();

    // Approximate storage usage (example values, can be refined)
    // Assuming average sizes in MB
    const avgReportSizeMB = 1; // average size per report
    const avgPatientSizeMB = 0.1; // average size per patient
    const avgLabSizeMB = 0.5; // average size per lab

    const storageUsage = {
      reports: {
        count: reportCount,
        storageMB: reportCount * avgReportSizeMB,
      },
      patients: {
        count: patientCount,
        storageMB: patientCount * avgPatientSizeMB,
      },
      labs: {
        count: labCount,
        storageMB: labCount * avgLabSizeMB,
      },
    };

    // Additional intelligence info
    // Most active lab by number of reports
    const mostActiveLabAggregation = await Report.aggregate([
      { $group: { _id: "$lab", reportCount: { $sum: 1 } } },
      { $sort: { reportCount: -1 } },
      { $limit: 1 }
    ]);

    let mostActiveLab = null;
    if (mostActiveLabAggregation.length > 0) {
      const labId = mostActiveLabAggregation[0]._id;
      const lab = await Lab.findById(labId, 'name');
      mostActiveLab = {
        labId,
        name: lab ? lab.name : 'Unknown',
        reportCount: mostActiveLabAggregation[0].reportCount,
      };
    }

    res.json({
      success: true,
      data: {
        labs,
        labCount,
        patientCount,
        reportCount,
        storageUsage,
        mostActiveLab,
      }
    });
  } catch (error) {
    console.error('Error fetching intelligence data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch intelligence data',
      error: error.message,
    });
  }
};

module.exports = {
  getIntelligenceData,
};
