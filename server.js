require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    consent: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// API Endpoint to save user data
app.post('/api/submit', async (req, res) => {
    const { firstName, lastName, email, consent } = req.body;

    if (!firstName || !lastName || !email || !consent) {
        return res.status(400).json({ success: false, message: 'Tüm alanlar ve onay zorunludur.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Geçersiz e-posta formatı.' });
    }

    try {
        // Check for duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(200).json({ success: true, message: 'Tekrar hoşgeldiniz!', redirect: '/view_pdf.html' });
        }

        const newUser = new User({
            firstName,
            lastName,
            email,
            consent
        });

        await newUser.save();
        res.json({ success: true, message: 'Başarılı!', redirect: '/view_pdf.html' });
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Admin endpoint to get users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ timestamp: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
