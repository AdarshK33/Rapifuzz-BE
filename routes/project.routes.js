const express = require('express')
const router = express.Router();

const { authorizeRoles } = require('../middlewares/auth');
const {create, all, update, deleteProject, getAllDeadlines, getProject, allStatusWise} = require('../controllers/project.controller');

router.route('/new').post(authorizeRoles('admin'),create)
router.route('/project-data/:project_id').get(authorizeRoles('admin', 'manager'),getProject)
router.route('/all').get(authorizeRoles('admin', 'manager', 'user'),all)
router.route('/all-status-wise').get(authorizeRoles('admin', 'manager', 'user'), allStatusWise)
router.route('/update/:project_id').put(authorizeRoles('admin', 'manager'),update)
router.route('/delete/:project_id').delete(authorizeRoles('admin'),deleteProject)
router.route('/deadlines').get(authorizeRoles('admin', 'manager'),getAllDeadlines)

module.exports = router;

