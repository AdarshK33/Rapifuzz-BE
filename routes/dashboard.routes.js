const express = require('express');
const { getInfo } = require('../controllers/dashboard.controller');
const router = express.Router();

const { authorizeRoles } = require('../middlewares/auth');

router.route('/get').get(authorizeRoles('admin', 'manager', 'user'),getInfo)


module.exports = router;

