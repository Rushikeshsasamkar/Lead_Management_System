const Notification = require('../models/Notification');
const User = require('../models/User');

// helper to save + emit notification
async function sendNotification(io, userId, message, type, leadId) {
  const notif = await Notification.create({ userId, message, type, leadId });
  io.to(userId.toString()).emit('notification', notif);
  return notif;
}

exports.notifyLeadCreated = async (io, lead, creator) => {
  // notify all managers and admins
  const managers = await User.find({ role: { $in: ['admin', 'manager'] } }, '_id');
  for (const mgr of managers) {
    if (mgr._id.toString() !== creator.id) {
      await sendNotification(io, mgr._id, `New lead "${lead.name}" created by ${creator.name}`, 'lead_created', lead._id);
    }
  }
  // notify assigned user if different from creator
  if (lead.assignedTo && lead.assignedTo.toString() !== creator.id) {
    await sendNotification(io, lead.assignedTo, `Lead "${lead.name}" was assigned to you`, 'lead_assigned', lead._id);
  }
};

exports.notifyLeadAssigned = async (io, lead, actor) => {
  if (lead.assignedTo) {
    await sendNotification(io, lead.assignedTo, `Lead "${lead.name}" has been assigned to you`, 'lead_assigned', lead._id);
  }
};

exports.notifyLeadStatusChanged = async (io, lead, actor, oldStatus) => {
  const msg = `Lead "${lead.name}" status changed: ${oldStatus} -> ${lead.status}`;

  if (lead.assignedTo && lead.assignedTo.toString() !== actor.id) {
    await sendNotification(io, lead.assignedTo, msg, 'lead_status_changed', lead._id);
  }

  const managers = await User.find({ role: { $in: ['admin', 'manager'] } }, '_id');
  for (const mgr of managers) {
    if (mgr._id.toString() !== actor.id) {
      await sendNotification(io, mgr._id, msg, 'lead_status_changed', lead._id);
    }
  }
};

exports.notifyLeadDeleted = async (io, lead, actor) => {
  const managers = await User.find({ role: { $in: ['admin', 'manager'] } }, '_id');
  for (const mgr of managers) {
    if (mgr._id.toString() !== actor.id) {
      await sendNotification(io, mgr._id, `Lead "${lead.name}" was deleted by ${actor.name}`, 'lead_deleted', lead._id);
    }
  }
};
