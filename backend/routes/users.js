const router = require('express').Router();
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { getUsers, updateRole } = require('../controllers/userController');

router.use(auth);

router.get('/', rbac('user:read'), getUsers);
router.patch('/:id/role', rbac('user:write'), updateRole);

module.exports = router;
