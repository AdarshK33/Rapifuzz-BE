const express = require('express');
const { create, update, all, deleteTask, getTask, allStatusWise } = require('../controllers/task.controller');
const router = express.Router();

const { authorizeRoles } = require('../middlewares/auth');

router.route('/new').post(authorizeRoles('admin', 'manager', 'user'),create)
router.route('/task-data/:task_id').get(authorizeRoles('admin', 'manager', 'user'),getTask)
router.route('/all').get(authorizeRoles('admin', 'manager', 'user'), all)
router.route('/all-status-wise').get(authorizeRoles('admin', 'manager', 'user'), allStatusWise)
router.route('/update/:task_id').put(authorizeRoles('admin', 'manager', 'user'),update)
router.route('/delete/:task_id').delete(authorizeRoles('admin', 'manager'),deleteTask)


module.exports = router;

