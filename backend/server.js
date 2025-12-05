const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const EMAILS_FILE = path.join(__dirname, 'emails.json');
const EBOOK_FILE = path.join(__dirname, 'romantik_serseri.pdf');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Read emails from file
async function readEmails() {
    try {
        const data = await fs.readFile(EMAILS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, return empty array
        return [];
    }
}

// Write emails to file
async function writeEmails(emails) {
    await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2), 'utf8');
}

// Generate JWT token
function generateToken(email) {
    return jwt.sign(
        { email, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '7d' } // Token valid for 7 days
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { email, build } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'E-posta adresi gereklidir.'
            });
        }

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz e-posta adresi.'
            });
        }

        // Read existing emails
        const emails = await readEmails();

        // Check if email already exists
        const existingEmail = emails.find(entry => entry.email === email);

        if (existingEmail) {
            // Email already exists, generate new token
            console.log(`Email already registered: ${email}`);
        } else {
            // Add new email
            emails.push({
                email,
                registeredAt: new Date().toISOString(),
                build: build || 'unknown'
            });
            await writeEmails(emails);
            console.log(`New email registered: ${email}`);
        }

        // Generate access token
        const token = generateToken(email);

        res.json({
            success: true,
            message: 'Kayıt başarılı!',
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
        });
    }
});

// Ebook download endpoint
app.get('/api/ebook/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz veya süresi dolmuş erişim kodu.'
            });
        }

        console.log(`Ebook download requested by: ${decoded.email}`);

        // Check if file exists
        try {
            await fs.access(EBOOK_FILE);
        } catch (error) {
            console.error('Ebook file not found:', EBOOK_FILE);
            return res.status(404).json({
                success: false,
                message: 'E-kitap dosyası bulunamadı.'
            });
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="romantik_serseri.pdf"');

        // Send file
        res.sendFile(EBOOK_FILE);

    } catch (error) {
        console.error('Ebook download error:', error);
        res.status(500).json({
            success: false,
            message: 'E-kitap indirme hatası.'
        });
    }
});

// Get registered emails (for admin purposes)
app.get('/api/emails', async (req, res) => {
    try {
        const emails = await readEmails();
        res.json({
            success: true,
            count: emails.length,
            emails: emails.map(e => ({
                email: e.email,
                registeredAt: e.registeredAt
            }))
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({
            success: false,
            message: 'E-postaları getirme hatası.'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı.'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası.'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   Email Collector Server                 ║
║   Port: ${PORT}                           ║
║   Status: Running ✓                       ║
╚═══════════════════════════════════════════╝

API Endpoints:
  GET  /api/health       - Health check
  POST /api/signup       - Email signup
  GET  /api/ebook/:token - Download ebook
  GET  /api/emails       - List registered emails

Ready to accept connections...
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});
