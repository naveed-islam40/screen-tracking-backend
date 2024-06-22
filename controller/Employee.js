const Employee = require("../models/employee");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../middleware/transporter");
const path = require("path");
const fs = require("fs");

exports.registerEmployee = async (req, res) => {
  const { employeeName, email, password } = req.body;
  const { adminId } = req.params;

  try {
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const employee = new Employee({
      employeeName,
      email,
      password: hashPassword,
      admin: adminId,
    });

    await employee.save();

    const mailOptions = {
      from: process.env.HOST_MAIL,
      to: email,
      subject: "Login your account",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
        <h2 style="font-size: 24px; font-weight: bold; color: #4A5568;">Welcome to Employee Management System</h2>
        <p>Please use the following credentials to log in:</p>
        <div style="background-color: #F7FAFC; padding: 10px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; padding: 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 0; padding: 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <a href="${process.env.FRONTEND_URL}/login/employee" style="display: inline-block; padding: 10px 20px; background-color: #4299E1; color: #FFF; text-decoration: none; border-radius: 8px;">Login</a>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({ employee, message: "Employee registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.EmployeeLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await Employee.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const tokenPayload = {
      userId: user._id,
      email: user.email,
      userType: user.userType,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: `${
        user.userType.charAt(0).toUpperCase() + user.userType.slice(1)
      } login successful`,
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAdminEmployees = async (req, res) => {
  const { adminId } = req.params;

  try {
    const employees = await Employee.find({ admin: adminId });
    if (!employees) {
      return res
        .status(404)
        .json({ message: "No employees found for this admin" });
    }

    return res.status(200).json({ employees });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.sendEmployeeReport = async (req, res) => {
  const { report, employeeId } = req.body;
  try {
    const employee = await Employee.findById(employeeId).populate('admin');
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

    const { admin } = employee;

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    const fileName = `${employee.employeeName}_inactivity_report.txt`;
    const filePath = path.join(reportsDir, fileName);

    // Write the report to a file
    fs.writeFileSync(filePath, report);

    const mailOptions = {
      from: process.env.HOST_MAIL,
      to: admin.email,
      subject: 'Employee Report',
      text: `Please find the attached inactivity report for employee ${employeeId}.`,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: error.toString() });
      }

      fs.unlinkSync(filePath);
      res.status(200).json({ message: 'Inactivity report sent successfully' });
    });
  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({ error: error.toString() });
  }
};
