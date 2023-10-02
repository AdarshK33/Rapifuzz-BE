const express = require('express')
const router = express.Router();

const {all, update, checkActiveNotification, seenNotification, allTypeWise} = require('../controllers/appnotification.controller');
const { authorizeRoles } = require('../middlewares/auth');

router.route('/all').get(authorizeRoles('admin', 'manager', 'user'),all)
router.route('/all-type-wise').get(authorizeRoles('admin', 'manager', 'user'),allTypeWise)
router.route('/update/:notif_id').put(authorizeRoles('admin', 'manager', 'user'),update)
router.route('/seen-notification').get(authorizeRoles('admin', 'manager', 'user'),seenNotification)
router.route('/check-active-notification').get(authorizeRoles('admin', 'manager', 'user'),checkActiveNotification)


module.exports = router;

