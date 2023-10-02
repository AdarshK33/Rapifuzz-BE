const express = require('express');
const { create, getAssignProjectToUser, getProjectsbyClientIdList, update } = require('../controllers/userproject.controller');
const router = express.Router();

const { authorizeRoles } = require('../middlewares/auth');

router.route('/new').post(authorizeRoles('admin', 'manager'), create)
router.route('/user-data/:user_id').get(authorizeRoles('admin', 'manager', 'user'), getAssignProjectToUser)
router.route('/client-project/:client_id').get(authorizeRoles('admin', 'manager', 'user'), getProjectsbyClientIdList)
router.route('/update').put(authorizeRoles('admin', 'manager'), update)

module.exports = router;

