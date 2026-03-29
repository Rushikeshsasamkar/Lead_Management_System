const allPermissions = require('../config/rbac');

// check if user has the required permission
module.exports = (permission) => {
  return (req, res, next) => {
    const userPerms = allPermissions[req.user.role] || [];
    if (!userPerms.includes(permission)) {
      return res.status(403).json({ message: 'Forbidden: you do not have permission' });
    }
    next();
  };
};
