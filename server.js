require('dotenv').config(); // Ensure dotenv is imported to load .env variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const User = require('./models/User'); // Ensure this path is correct
const supplierRoutes = require('./routes/supplierRoutes'); // Ensure this path is correct
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Debugging logs for .env variables
console.log('Admin Email:', process.env.ADMIN_EMAIL);
console.log('Admin Password:', process.env.ADMIN_PASSWORD);
console.log('JWT Secret:', JWT_SECRET);

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mern-vite-app')
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });

// Routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/employees', employeeRoutes);

// Admin-only login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Debugging logs
  console.log('Request Email:', email);
  console.log('Request Password:', password);
  console.log('Env Admin Email:', process.env.ADMIN_EMAIL);
  console.log('Env Admin Password:', process.env.ADMIN_PASSWORD);

  // Ensure admin credentials are set in .env
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ success: false, message: 'Admin credentials are not set in the environment variables' });
  }

  // Check if the entered credentials match the admin credentials
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    // Generate a token for the admin
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ success: true, message: 'Login successful', token });
  } else {
    // Reject login attempt
    return res.status(401).json({ success: false, message: 'Unauthorized: Only admin can log in' });
  }
});

// Signup route
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => {
  // Clear the token on the server-side (if using server-side sessions)
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Order Schema
const orderSchema = new mongoose.Schema({
  customerName: String,
  productName: String,
  quantity: Number,
  price: Number,
});

const Order = mongoose.model('Order', orderSchema);

// API to handle order creation
app.post('/api/orders', async (req, res) => {
  const { customerName, productName, quantity, price } = req.body;

  try {
    const newOrder = new Order({ customerName, productName, quantity, price });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// API to get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// API to update an order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.customerName = req.body.customerName || order.customerName;
      order.productName = req.body.productName || order.productName;
      order.quantity = req.body.quantity || order.quantity;
      order.price = req.body.price || order.price;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// API to delete an order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});