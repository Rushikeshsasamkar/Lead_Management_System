const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  phone: { type: String, required: true },
  email: { type: String },
  source: {
    type: String,
    enum: ['website', 'referral', 'cold', 'social', 'other'],
    default: 'website'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'won', 'lost'],
    default: 'new'
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// indexes for performance
leadSchema.index({ createdBy: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, source: 1, createdAt: -1 }); // compound index

module.exports = mongoose.model('Lead', leadSchema);
