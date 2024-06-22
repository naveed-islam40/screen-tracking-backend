const mongoose  = require("mongoose")

const employeeSchema = new mongoose.Schema({
    employeeName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type:String,
        default: "employee" 
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    }
}, {timestamps: true})

const Employee = mongoose.model("Employee", employeeSchema)

module.exports = Employee