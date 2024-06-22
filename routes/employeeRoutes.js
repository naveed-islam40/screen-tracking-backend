const express = require("express")
const router = express.Router()
const {registerEmployee, getAdminEmployees, getEmployeeById, EmployeeLogin, sendEmployeeReport} = require("../controller/Employee")

router.post("/register/employee/:adminId", registerEmployee)
router.post("/login/employee", EmployeeLogin)
router.get('/employees/:adminId', getAdminEmployees);
router.get('/employee/:id', getEmployeeById);
router.post('/send-report', sendEmployeeReport);



module.exports = router