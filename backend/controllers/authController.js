const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const user = new User({ name, email, password, role: role || 'sales' });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed.' });
  }
};

exports.registerStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Staff registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed.' });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};