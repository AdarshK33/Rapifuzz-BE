const express = require('express')
const router = express.Router();

const { authorizeRoles } = require('../middlewares/auth');
const {create, all, update, deleteClient, sendMailToClient, getInbox, getClient} = require('../controllers/client.controller');
const attachFile = require('../middlewares/attachFile');

router.route('/new').post(authorizeRoles('admin'),create)
router.route('/client-data/:client_id').get(authorizeRoles('admin'),getClient)
router.route('/all').get(authorizeRoles('admin', 'manager'),all)
router.route('/update/:client_id').put(authorizeRoles('admin'),update)
router.route('/delete/:client_id').delete(authorizeRoles('admin'), deleteClient)
router.route('/send-mail').post(authorizeRoles('admin', 'manager'),attachFile.single("attach_file"), sendMailToClient)
router.route('/inbox').get(authorizeRoles('admin', 'manager', 'user'), getInbox)


module.exports = router;

