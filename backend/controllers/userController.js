const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'manager', 'sales'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-password' }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
