// permissions for each role
const permissions = {
  admin: [
    'lead:read', 
    'lead:write', 
    'lead:delete',
    'user:read', 
    'user:write',
    'dashboard:read',
    'notification:read'
  ],
  manager: [
    'lead:read', 
    'lead:write',
    'user:read',
    'dashboard:read',
    'notification:read'
  ],
  sales: [
    'lead:read', 
    'lead:write',
    'notification:read'
  ]
};

module.exports = permissions;
