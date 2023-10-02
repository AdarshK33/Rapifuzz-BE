const express = require('express');
const { create, all, downloadExcel } = require('../controllers/dailyworks.controller');
const router = express.Router();

const { authorizeRoles } = require('../middlewares/auth');

router.route('/new').post(authorizeRoles('admin', 'manager', 'user'),create)
// router.route('/client-data/:client_id').get(authorizeRoles('admin'),getClient)
 router.route('/all').get(authorizeRoles('admin', 'manager', 'user'),all)
 router.route('/download').get(authorizeRoles('admin', 'manager'),downloadExcel)
// router.route('/update/:client_id').put(authorizeRoles('admin'),update)
// router.route('/delete/:client_id').delete(authorizeRoles('admin'), deleteClient)
// router.route('/send-mail').post(authorizeRoles('admin', 'manager'), sendMailToClient)
// router.route('/inbox').get(authorizeRoles('admin', 'manager', 'user'), getInbox)


module.exports = router;

