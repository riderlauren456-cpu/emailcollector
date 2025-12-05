const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// API Endpoint to save user data
app.post('/api/submit', (req, res) => {
    const { firstName, lastName, email, consent } = req.body;

    if (!firstName || !lastName || !email || !consent) {
        return res.status(400).json({ success: false, message: 'Tüm alanlar ve onay zorunludur.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Geçersiz e-posta formatı.' });
    }

    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const users = JSON.parse(data);

        // Check for duplicates
        const exists = users.find(u => u.email === email);
        if (exists) {
            return res.status(200).json({ success: true, message: 'Tekrar hoşgeldiniz!', redirect: '/view_pdf.html' });
        }

        users.push({
            firstName,
            lastName,
            email,
            consent,
            timestamp: new Date().toISOString()
        });

        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
        res.json({ success: true, message: 'Başarılı!', redirect: '/view_pdf.html' });
    } catch (err) {
        console.error('Error processing data:', err);
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Admin endpoint to get users
app.get('/api/users', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const users = JSON.parse(data);
        res.json(users);
    } catch (err) {
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
