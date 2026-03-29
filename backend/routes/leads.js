const router = require('express').Router();
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const {
  createLead, getLeads, getLead, updateLead, deleteLead, getStats
} = require('../controllers/leadController');

router.use(auth);

// stats must come before /:id to avoid conflict
router.get('/stats/summary', rbac('dashboard:read'), getStats);
router.get('/', rbac('lead:read'), getLeads);
router.post('/', rbac('lead:write'), createLead);
router.get('/:id', rbac('lead:read'), getLead);
router.patch('/:id', rbac('lead:write'), updateLead);
router.delete('/:id', rbac('lead:delete'), deleteLead);

module.exports = router;
