const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const contentRoutes = require('./routes/contentRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const productRoutes = require('./routes/productRoutes');
const postRoutes = require('./routes/postRoutes');
const analyticRoutes = require('./routes/analyticRoutes');
const adminConfigRoutes = require('./routes/adminConfigRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const courseRoutes = require('./routes/courseRoutes');
const toolRoutes = require('./routes/toolRoutes');
const commentRoutes = require('./routes/commentRoutes');
const newsRoutes = require('./routes/newsRoutes');
const threeDRoutes = require('./routes/threeDRoutes');
const authRoutes = require('./routes/authRoutes');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const jwt = require('jsonwebtoken');

// Global Auth Middleware for admin requests
app.use((req, res, next) => {
    const publicMutableRoutes = [
        '/api/auth/login',         // Admin login
        '/api/contacts',           // Contact form
        '/api/applications',       // Job app form
        '/api/comments',           // Public comments
        '/api/service-requests'    // Service requests
    ];

    // If it's a mutation request (POST/PUT/DELETE) and not in the public list -> verify token
    if (req.method !== 'GET' && !publicMutableRoutes.some(p => req.path.startsWith(p))) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        try {
            const secret = process.env.JWT_SECRET || 'lalatech_super_secret_key_2026';
            const decoded = jwt.verify(token, secret);
            if (!decoded.admin) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            req.admin = decoded;
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    } else {
        next();
    }
});

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticRoutes);
app.use('/api/stats', visitorRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/config', adminConfigRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/3d', threeDRoutes);


// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/test', (req, res) => {
    res.json({ message: 'Lala Tech API is running' });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
