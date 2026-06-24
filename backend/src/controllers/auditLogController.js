const AuditLog = require("../models/AuditLog");
const Lab = require("../models/Lab");

// @desc    Get all audit logs (Super Admin only)
// @route   GET /api/audit-logs
// @access  Private/Super Admin
exports.getAuditLogs = async (req, res, next) => {
  try {
    const query = {};

    // --- Filters ---

    // Module filter
    if (req.query.module) {
      query.module = req.query.module;
    }

    // Lab filter
    if (req.query.lab) {
      query.lab = req.query.lab;
    }

    // Action filter
    if (req.query.action) {
      query.action = req.query.action;
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.range) {
      const now = new Date();
      let startDate;
      switch (req.query.range) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }
      if (startDate) {
        query.createdAt = { $gte: startDate, $lte: now };
      }
    }

    // Search filter (searches userName, entityId, description)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { userName: searchRegex },
        { entityId: searchRegex },
        { description: searchRegex },
        { entityType: searchRegex },
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    const pagination = {};
    if (skip + limit < total) pagination.next = { page: page + 1, limit };
    if (page > 1) pagination.prev = { page: page - 1, limit };

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single audit log detail (Super Admin only)
// @route   GET /api/audit-logs/:id
// @access  Private/Super Admin
exports.getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export audit logs as CSV or Excel (Super Admin only)
// @route   GET /api/audit-logs/export
// @access  Private/Super Admin
exports.exportAuditLogs = async (req, res, next) => {
  try {
    const query = {};

    // Apply same filters as getAuditLogs
    if (req.query.module) query.module = req.query.module;
    if (req.query.lab) query.lab = req.query.lab;
    if (req.query.action) query.action = req.query.action;
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.range) {
      const now = new Date();
      let startDate;
      switch (req.query.range) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "7days":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30days":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      if (startDate) query.createdAt = { $gte: startDate, $lte: now };
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { userName: searchRegex },
        { entityId: searchRegex },
        { description: searchRegex },
      ];
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).lean();

    const format = req.query.format || "csv";

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date & Time",
        "User",
        "Role",
        "Lab",
        "Module",
        "Action",
        "Description",
        "Entity ID",
        "Entity Type",
      ];

      const csvRows = [headers.join(",")];

      for (const log of logs) {
        const row = [
          `"${new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}"`,
          `"${(log.userName || "System").replace(/"/g, '""')}"`,
          `"${log.role || ""}"`,
          `"${(log.labName || "").replace(/"/g, '""')}"`,
          `"${log.module}"`,
          `"${log.action}"`,
          `"${(log.description || "").replace(/"/g, '""')}"`,
          `"${log.entityId || ""}"`,
          `"${log.entityType || ""}"`,
        ];
        csvRows.push(row.join(","));
      }

      const csv = csvRows.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      );
      return res.status(200).send(csv);
    }

    // Default: JSON export
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get labs list for filter dropdown (Super Admin only)
// @route   GET /api/audit-logs/labs
// @access  Private/Super Admin
exports.getAuditLogLabs = async (req, res, next) => {
  try {
    const labs = await AuditLog.distinct("labName", { labName: { $ne: null } });
    res.status(200).json({
      success: true,
      data: labs.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};