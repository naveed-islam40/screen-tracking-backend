const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");
const transporter = require("../middleware/transporter")

exports.registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;
// const data = req.body;
console.log(username, email, password);
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      email,
      password: hashPassword,
    });

    await admin.save();

    return res.status(201).json({ admin, message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await Admin.findOne({ email });
    
    if (!user) {
      user = await Employee.findOne({ email });
      
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const tokenPayload = {
      userId: user._id,
      email: user.email,
      userType: user.userType 
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ 
      message: `${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} login successful`, 
      token, 
      user 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.notifyAdmin = async (req, res) => {
  const { adminId, message } = req.body;

  try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
          return res.status(404).send('Admin not found');
      }

      const mailOptions = {
          from: process.env.HOST_MAIL,
          to: admin.email,
          subject: 'Employee Inactivity Alert',
          text: message
      };

      await transporter.sendMail(mailOptions);
      res.status(200).send('Notification sent successfully');
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Failed to send notification');
  }
};