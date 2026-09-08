const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, isPrivate, emergencyContact } = req.body;

  // Required from the start: if something goes wrong on a trip, the
  // organizer needs someone to call.
  const contactName = emergencyContact?.name?.trim();
  const contactPhone = emergencyContact?.phone?.trim();
  if (!contactName || !contactPhone) {
    return res
      .status(400)
      .json({ message: "An emergency contact name and phone are required" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ message: "User exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isPrivate: Boolean(isPrivate),
    emergencyContact: { name: contactName, phone: contactPhone },
  });

  res.json({ message: "User created" });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};