const AuditLog = require("../models/AuditLog");

/**
 * Creates an audit log entry. Intended to be called asynchronously (fire-and-forget)
 * so it never blocks the main operation.
 *
 * @param {Object} params
 * @param {Object|string} params.user - User._id or user object
 * @param {string} params.role - User role
 * @param {string} params.module - Module name (USERS, PATIENTS, REPORTS, etc.)
 * @param {string} params.action - Action performed
 * @param {string} [params.entityId] - The entity's _id
 * @param {string} [params.entityType] - The entity type name
 * @param {string} params.description - Human-readable description
 * @param {Object} [params.oldData] - State before the change
 * @param {Object} [params.newData] - State after the change
 * @param {Object} [params.req] - Express request object (for IP, userAgent, lab)
 */
async function createAuditLog({
  user,
  role,
  module: auditModule,
  action,
  entityId,
  entityType,
  description,
  oldData,
  newData,
  req,
}) {
  try {
    // Resolve user ID and name
    const userId = typeof user === "object" ? user?._id || user?.id : user;
    const userName =
      typeof user === "object" ? user?.name : "Unknown";

    // Resolve lab from req
    let labId = null;
    let labName = null;

    if (req) {
      // If req.user has a lab
      if (req.user?.lab) {
        labId = req.user.lab;
      }
      // If a labName is attached to req via populate or otherwise
      if (req.labName) {
        labName = req.labName;
      }
    }

    await AuditLog.create({
      user: userId || null,
      userName: userName || "System",
      role: role || "system",
      lab: labId || null,
      labName: labName || null,
      module: auditModule,
      action,
      entityId: entityId ? String(entityId) : undefined,
      entityType,
      description,
      oldData: oldData || undefined,
      newData: newData || undefined,
      ipAddress: req?.ip || req?.connection?.remoteAddress || undefined,
      userAgent: req?.headers?.["user-agent"] || undefined,
    });
  } catch (error) {
    // Audit logging should NEVER break the application.
    // Log to console in development but swallow in production.
    if (process.env.NODE_ENV === "development") {
      console.error("[AuditService] Failed to create audit log:", error.message);
    }
  }
}

module.exports = { createAuditLog };