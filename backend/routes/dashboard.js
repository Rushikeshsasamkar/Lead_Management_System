const router = require('express').Router();
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { getStats } = require('../controllers/leadController');

router.use(auth);
router.get('/summary', rbac('dashboard:read'), getStats);

module.exports = router;
