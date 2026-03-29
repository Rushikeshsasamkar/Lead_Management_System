const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['lead_created', 'lead_assigned', 'lead_status_changed', 'lead_deleted'],
    default: 'lead_created'
  },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
