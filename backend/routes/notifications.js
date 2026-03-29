const router = require('express').Router();
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

router.use(auth);
router.use(rbac('notification:read'));

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
