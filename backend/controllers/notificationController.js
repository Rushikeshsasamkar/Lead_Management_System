const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = Math.max(1, parseInt(page) || 1);
    limit = Math.min(50, Math.max(1, parseInt(limit) || 10));

    // sales and manager both see only their own notifications
    const filter = { userId: req.user.id };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.read = true;
    await notification.save();

    res.json({ message: 'Marked as read', notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
