const Lead = require('../models/Lead');
const notificationService = require('../services/notificationService');

const ALLOWED_SORT_FIELDS = ['name', 'createdAt', 'status', 'source'];

exports.createLead = async (req, res) => {
  try {
    const { name, phone, email, source, status, notes, assignedTo } = req.body;

    // validation
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ message: 'Name must be 2-100 characters' });
    }
    if (!phone || !/^[+]?[\d\s\-()\\.]{7,15}$/.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const lead = await Lead.create({
      name, phone, email, source, status, notes,
      createdBy: req.user.id,
      assignedTo: assignedTo || null
    });

    const io = req.app.get('io');
    await notificationService.notifyLeadCreated(io, lead, req.user);

    res.status(201).json({ message: 'Lead created successfully', lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    let { q, status, source, assignedTo, createdFrom, createdTo, sort, page, limit } = req.query;

    // sanitize pagination
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const filter = {};

    // sales only see their own leads
    if (req.user.role === 'sales') {
      filter.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }

    // search across name, email, phone
    if (q) {
      const regex = new RegExp(q, 'i');
      const searchCond = [{ name: regex }, { email: regex }, { phone: regex }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    if (status) filter.status = status;
    if (source) filter.source = source;

    // only manager/admin can filter by assignedTo
    if (assignedTo && req.user.role !== 'sales') {
      filter.assignedTo = assignedTo;
    }

    // date range filter
    if (createdFrom || createdTo) {
      filter.createdAt = {};
      if (createdFrom) {
        const from = new Date(createdFrom);
        if (isNaN(from)) return res.status(400).json({ message: 'Invalid createdFrom date' });
        filter.createdAt.$gte = from;
      }
      if (createdTo) {
        const to = new Date(createdTo);
        if (isNaN(to)) return res.status(400).json({ message: 'Invalid createdTo date' });
        filter.createdAt.$lte = to;
      }
    }

    // sort
    let sortObj = { createdAt: -1, _id: -1 };
    if (sort) {
      const [field, order] = sort.split(':');
      if (!ALLOWED_SORT_FIELDS.includes(field)) {
        return res.status(400).json({ message: 'Invalid sort field' });
      }
      if (!['asc', 'desc'].includes(order)) {
        return res.status(400).json({ message: 'Sort order must be asc or desc' });
      }
      sortObj = { [field]: order === 'asc' ? 1 : -1, _id: -1 };
    }

    // use $facet to get data + total in one query
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          data: [
            { $sort: sortObj },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $lookup: {
                from: 'users', localField: 'createdBy',
                foreignField: '_id', as: 'createdByArr'
              }
            },
            {
              $lookup: {
                from: 'users', localField: 'assignedTo',
                foreignField: '_id', as: 'assignedToArr'
              }
            },
            {
              $addFields: {
                createdBy: { $arrayElemAt: ['$createdByArr', 0] },
                assignedTo: { $arrayElemAt: ['$assignedToArr', 0] }
              }
            },
            {
              $project: {
                createdByArr: 0, assignedToArr: 0,
                'createdBy.password': 0, 'assignedTo.password': 0
              }
            }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ];

    const result = await Lead.aggregate(pipeline);
    const data = result[0].data;
    const total = result[0].total[0]?.count || 0;

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // sales access check
    if (req.user.role === 'sales') {
      const createdById = lead.createdBy?._id?.toString() || lead.createdBy?.toString();
      const assignedToId = lead.assignedTo?._id?.toString() || lead.assignedTo?.toString();
      if (createdById !== req.user.id && assignedToId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // sales access check
    if (req.user.role === 'sales') {
      if (lead.createdBy.toString() !== req.user.id &&
          lead.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const oldStatus = lead.status;
    const oldAssignedTo = lead.assignedTo?.toString();

    const { name, phone, email, source, status, notes, assignedTo } = req.body;

    if (name !== undefined) lead.name = name;
    if (phone !== undefined) lead.phone = phone;
    if (email !== undefined) lead.email = email;
    if (source !== undefined) lead.source = source;
    if (status !== undefined) lead.status = status;
    if (notes !== undefined) lead.notes = notes;
    if (assignedTo !== undefined) lead.assignedTo = assignedTo || null;

    await lead.save();

    const io = req.app.get('io');

    // notify on assignment change
    if (assignedTo !== undefined && assignedTo !== oldAssignedTo && assignedTo) {
      await notificationService.notifyLeadAssigned(io, lead, req.user);
    }

    // notify on status change
    if (status && status !== oldStatus) {
      await notificationService.notifyLeadStatusChanged(io, lead, req.user, oldStatus);
    }

    const updated = await Lead.findById(lead._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({ message: 'Lead updated', lead: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // sales can only delete leads they created
    if (req.user.role === 'sales') {
      if (lead.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await lead.deleteOne();

    const io = req.app.get('io');
    await notificationService.notifyLeadDeleted(io, lead, req.user);

    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { createdFrom, createdTo } = req.query;

    const matchFilter = {};
    if (createdFrom || createdTo) {
      matchFilter.createdAt = {};
      if (createdFrom) matchFilter.createdAt.$gte = new Date(createdFrom);
      if (createdTo) matchFilter.createdAt.$lte = new Date(createdTo);
    }

    const result = await Lead.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }]
        }
      }
    ]);

    const totalLeads = result[0].total[0]?.count || 0;

    // normalize - return 0 for missing statuses
    const byStatus = { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 };
    result[0].byStatus.forEach(item => {
      if (item._id && byStatus.hasOwnProperty(item._id)) {
        byStatus[item._id] = item.count;
      }
    });

    const bySource = { website: 0, referral: 0, cold: 0, social: 0, other: 0 };
    result[0].bySource.forEach(item => {
      if (item._id && bySource.hasOwnProperty(item._id)) {
        bySource[item._id] = item.count;
      }
    });

    res.json({ totalLeads, byStatus, bySource });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
