const express = require("express")
const router = express.Router()
const {registerAdmin, adminLogin, notifyAdmin} = require("../controller/Admin")

router.post("/register/admin", registerAdmin)
router.post("/login", adminLogin)
router.post('/notify-admin', notifyAdmin);

module.exports = router