const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
    const { password } = req.body;
    
    const validPassword = process.env.ADMIN_PASSWORD || 'LalatechAdmin2026';
    
    if (password === validPassword) {
        const secret = process.env.JWT_SECRET || 'lalatech_super_secret_key_2026';
        const token = jwt.sign({ admin: true }, secret, { expiresIn: '1d' });
        
        return res.json({ success: true, token });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
});

module.exports = router;
