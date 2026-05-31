const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const ytDlpExec = require('yt-dlp-exec');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Models
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const RepairJob = require('../models/RepairJob');
const StockItem = require('../models/StockItem');
const AccountingEntry = require('../models/AccountingEntry');
const DailyReport = require('../models/DailyReport');
const SocialAccount = require('../models/SocialAccount');
const Feedback = require('../models/Feedback');

// Setup ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
try {
    const ffprobePath = ffmpegInstaller.path.replace('ffmpeg.exe', 'ffprobe.exe').replace('ffmpeg', 'ffprobe');
    ffmpeg.setFfprobePath(ffprobePath);
} catch (probeErr) {
    console.warn('Could not set ffprobe path:', probeErr.message);
}

// Config Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const JWT_SECRET = process.env.JWT_SECRET || 'lalatech_super_secret_key_2026';

// --- Local Auth Middleware for CRM ---
function verifyCrmToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.admin) {
            req.user = { role: 'admin', name: 'Admin', email: 'admin@lalatech.ng' };
        } else if (decoded.staffId) {
            req.user = {
                staffId: decoded.staffId,
                role: decoded.role,
                name: decoded.name,
                email: decoded.email
            };
        } else {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
}

// Admin-only middleware
function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin privilege required' });
    }
}

// --- 1. STAFF AUTH & CRUD ---

// Staff Login
router.post('/staff/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        
        const staff = await Staff.findOne({ email });
        if (!staff || !staff.isActive) {
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }

        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { staffId: staff._id, name: staff.name, role: staff.role, email: staff.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: { id: staff._id, name: staff.name, role: staff.role, email: staff.email }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login: ' + err.message });
    }
});

// Get list of staff (Admin only)
router.get('/staff', verifyCrmToken, requireAdmin, async (req, res) => {
    try {
        const staffList = await Staff.find().select('-password');
        res.json(staffList);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching staff list: ' + err.message });
    }
});

// Create Staff (Admin only)
router.post('/staff', verifyCrmToken, requireAdmin, async (req, res) => {
    const { name, email, password, role, pin } = req.body;
    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const existing = await Staff.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Staff email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = new Staff({
            name,
            email,
            password: hashedPassword,
            role,
            pin,
            isActive: true
        });

        await newStaff.save();
        res.status(201).json({ success: true, message: 'Staff member created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error creating staff: ' + err.message });
    }
});

// Update Staff Status or Role (Admin only)
router.put('/staff/:id', verifyCrmToken, requireAdmin, async (req, res) => {
    const { name, email, role, isActive, pin, password } = req.body;
    try {
        const updateData = { name, email, role, isActive, pin };
        
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const staff = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json({ success: true, message: 'Staff updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating staff: ' + err.message });
    }
});

// Delete Staff (Admin only)
router.delete('/staff/:id', verifyCrmToken, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
        res.json({ success: true, message: 'Staff deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting staff: ' + err.message });
    }
});

// --- 2. CUSTOMERS ---

router.get('/customers', verifyCrmToken, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/customers', verifyCrmToken, async (req, res) => {
    const { name, email, phone, address, notes } = req.body;
    try {
        const customer = new Customer({ name, email, phone, address, notes });
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/customers/:id', verifyCrmToken, async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/customers/:id', verifyCrmToken, async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Customer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 3. REPAIRS & KANBAN ---

router.get('/repairs', verifyCrmToken, async (req, res) => {
    try {
        const repairs = await RepairJob.find()
            .populate('customer')
            .populate('technician', 'name email role')
            .sort({ createdAt: -1 });
        res.json(repairs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Repair Job
router.post('/repairs', verifyCrmToken, async (req, res) => {
    try {
        const count = await RepairJob.countDocuments();
        const jobId = `JOB-${1001 + count}`;
        
        const repairJob = new RepairJob({
            ...req.body,
            jobId
        });
        
        await repairJob.save();
        res.status(201).json(repairJob);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Repair Job & Deduct Stock
router.put('/repairs/:id', verifyCrmToken, async (req, res) => {
    try {
        const oldJob = await RepairJob.findById(req.params.id);
        if (!oldJob) {
            return res.status(404).json({ message: 'Repair job not found' });
        }

        const newJob = await RepairJob.findByIdAndUpdate(
            req.params.id, 
            { ...req.body, updatedAt: Date.now() }, 
            { new: true }
        ).populate('customer');

        // Check if transition to 'ready' or 'delivered' from a non-ready status
        const isCompletedNow = ['ready', 'delivered'].includes(newJob.status);
        const wasCompletedBefore = ['ready', 'delivered'].includes(oldJob.status);

        if (isCompletedNow && !wasCompletedBefore) {
            // Deduct stock for parts used
            if (newJob.partsNeeded && newJob.partsNeeded.length > 0) {
                for (const partName of newJob.partsNeeded) {
                    const item = await StockItem.findOne({ 
                        name: { $regex: new RegExp(`^${partName.trim()}$`, 'i') } 
                    });
                    
                    if (item && item.quantity > 0) {
                        item.quantity -= 1;
                        await item.save();
                        
                        // Add an Accounting outflow for the inventory part cost
                        const entry = new AccountingEntry({
                            type: 'outflow',
                            category: 'Part Purchase',
                            amount: item.unitPrice,
                            description: `Inventory cost: Part "${item.name}" used in Job ${newJob.jobId} for customer ${newJob.customer ? newJob.customer.name : 'Unknown'}`,
                            recordedBy: req.user.name
                        });
                        await entry.save();
                    }
                }
            }

            // Also record the Inflow of money from the customer payment if price > 0
            if (newJob.price > 0) {
                const inflowEntry = new AccountingEntry({
                    type: 'inflow',
                    category: 'Repair Payment',
                    amount: newJob.price,
                    description: `Payment for Repair ${newJob.jobId} (${newJob.device}): ${newJob.issue}`,
                    recordedBy: req.user.name
                });
                await inflowEntry.save();
            }
        }

        res.json(newJob);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update repair notes
router.post('/repairs/:id/notes', verifyCrmToken, async (req, res) => {
    const { content } = req.body;
    try {
        const job = await RepairJob.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Repair job not found' });
        
        job.notes.push({
            content,
            author: req.user.name,
            date: new Date()
        });
        
        await job.save();
        res.json(job);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete Repair Job
router.delete('/repairs/:id', verifyCrmToken, async (req, res) => {
    try {
        await RepairJob.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Repair job deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 4. INVENTORY / STOCK ---

router.get('/stock', verifyCrmToken, async (req, res) => {
    try {
        const stock = await StockItem.find().sort({ name: 1 });
        res.json(stock);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/stock', verifyCrmToken, async (req, res) => {
    const { name, sku, quantity, unitPrice, reorderLevel, category } = req.body;
    try {
        const existing = await StockItem.findOne({ sku });
        if (existing) {
            return res.status(400).json({ message: 'Part with this SKU already exists' });
        }
        
        const item = new StockItem({ name, sku, quantity, unitPrice, reorderLevel, category });
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/stock/:id', verifyCrmToken, async (req, res) => {
    try {
        const item = await StockItem.findByIdAndUpdate(
            req.params.id, 
            { ...req.body, updatedAt: Date.now() }, 
            { new: true }
        );
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/stock/:id', verifyCrmToken, async (req, res) => {
    try {
        await StockItem.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Stock item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 5. ACCOUNTING ---

router.get('/accounting', verifyCrmToken, async (req, res) => {
    try {
        const entries = await AccountingEntry.find().sort({ date: -1 });
        
        // Sum calculations
        let totalInflow = 0;
        let totalOutflow = 0;
        
        entries.forEach(e => {
            if (e.type === 'inflow') totalInflow += e.amount;
            if (e.type === 'outflow') totalOutflow += e.amount;
        });

        const cashRegister = totalInflow - totalOutflow;

        res.json({
            entries,
            totalInflow,
            totalOutflow,
            cashRegister
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/accounting', verifyCrmToken, async (req, res) => {
    const { type, category, amount, description } = req.body;
    try {
        if (!type || !category || !amount) {
            return res.status(400).json({ message: 'Type, category and amount are required' });
        }
        
        const entry = new AccountingEntry({
            type,
            category,
            amount,
            description,
            recordedBy: req.user.name
        });
        
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 6. DAILY REPORTS ---

router.get('/reports', verifyCrmToken, async (req, res) => {
    try {
        let query = {};
        // Technicians/Accountants/Sales can only see their own reports (Admins can see all)
        if (req.user.role !== 'admin') {
            query.staff = req.user.staffId;
        }

        const reports = await DailyReport.find(query)
            .populate('staff', 'name email role')
            .sort({ date: -1, submittedAt: -1 });
            
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Save Morning Todo
router.post('/reports/todo', verifyCrmToken, async (req, res) => {
    const { date, todos } = req.body;
    try {
        const staffId = req.user.staffId || req.body.staffId; // Admin can specify staffId in testing
        if (!staffId) return res.status(400).json({ message: 'Staff ID is required' });

        let report = await DailyReport.findOne({ staff: staffId, date });
        
        if (report) {
            // Update
            report.morningTodos = todos;
        } else {
            // Create new
            report = new DailyReport({
                staff: staffId,
                date,
                morningTodos: todos,
                completedTodos: []
            });
        }
        
        await report.save();
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Submit End of Day Report
router.post('/reports/submit', verifyCrmToken, async (req, res) => {
    const { date, completedTodos, challenges, summary } = req.body;
    try {
        const staffId = req.user.staffId || req.body.staffId;
        if (!staffId) return res.status(400).json({ message: 'Staff ID is required' });

        let report = await DailyReport.findOne({ staff: staffId, date });
        
        if (!report) {
            report = new DailyReport({
                staff: staffId,
                date,
                morningTodos: [],
                completedTodos: completedTodos || [],
                challenges,
                summary,
                submittedAt: Date.now()
            });
        } else {
            report.completedTodos = completedTodos || [];
            report.challenges = challenges;
            report.summary = summary;
            report.submittedAt = Date.now();
        }
        
        await report.save();
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 7. CUSTOMER FEEDBACK & RATING LINKS ---

// Generate Link
router.post('/feedback/generate', verifyCrmToken, async (req, res) => {
    const { jobId, customerId } = req.body;
    try {
        if (!jobId || !customerId) {
            return res.status(400).json({ message: 'Job ID and Customer ID are required' });
        }
        
        // Check if feedback token already generated
        let feedback = await Feedback.findOne({ job: jobId });
        if (!feedback) {
            const token = require('crypto').randomBytes(16).toString('hex');
            feedback = new Feedback({
                token,
                customer: customerId,
                job: jobId
            });
            await feedback.save();
        }
        
        res.json({ token: feedback.token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Public: Get feedback form info by Token (Bypasses auth)
router.get('/feedback/token/:token', async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ token: req.params.token })
            .populate('customer')
            .populate('job');
            
        if (!feedback) {
            return res.status(404).json({ message: 'Invalid feedback token' });
        }
        
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Public: Submit feedback (Bypasses auth)
router.post('/feedback/submit', async (req, res) => {
    const { token, rating, comment } = req.body;
    try {
        const feedback = await Feedback.findOne({ token });
        if (!feedback) {
            return res.status(404).json({ message: 'Invalid feedback token' });
        }

        if (feedback.isSubmitted) {
            return res.status(400).json({ message: 'Feedback already submitted' });
        }

        feedback.rating = rating;
        feedback.comment = comment;
        feedback.isSubmitted = true;
        feedback.submittedAt = Date.now();
        await feedback.save();

        // Also add a log note to the corresponding Repair Job
        const job = await RepairJob.findById(feedback.job);
        if (job) {
            job.notes.push({
                content: `Customer Feedback Received - Rating: ${rating}/5. Comment: "${comment || 'None'}"`,
                author: 'System (Customer Feedback)',
                date: new Date()
            });
            await job.save();
        }

        res.json({ success: true, message: 'Feedback submitted successfully. Thank you!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get all feedback logs
router.get('/feedback/all', verifyCrmToken, async (req, res) => {
    try {
        const feedLogs = await Feedback.find({ isSubmitted: true })
            .populate('customer', 'name email phone')
            .populate('job', 'jobId device issue price')
            .sort({ submittedAt: -1 });
            
        res.json(feedLogs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 8. VIDEO WATERMARK REMIXING TOOL ---

router.post('/video-remix', verifyCrmToken, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'Video URL is required' });

    // Setup server temp folders
    const serverUploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(serverUploadsDir)) {
        fs.mkdirSync(serverUploadsDir, { recursive: true });
    }

    // Sync Logo over from client
    const clientLogoPath = path.join(__dirname, '../../client/public/bglogo.png');
    const localLogoPath = path.join(serverUploadsDir, 'logo.png');
    if (fs.existsSync(clientLogoPath) && !fs.existsSync(localLogoPath)) {
        fs.copyFileSync(clientLogoPath, localLogoPath);
    }

    const stampLogoPath = fs.existsSync(localLogoPath) ? localLogoPath : clientLogoPath;

    const timestamp = Date.now();
    const inputTemp = path.join(serverUploadsDir, `remix_in_${timestamp}.mp4`);
    const outputTemp = path.join(serverUploadsDir, `remix_out_${timestamp}.mp4`);

    try {
        console.log(`Step 1: Downloading video via yt-dlp-exec to ${inputTemp}...`);
        
        const ytdlpArgs = {
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            output: inputTemp,
            format: 'mp4',
        };

        await ytDlpExec(url, ytdlpArgs);

        if (!fs.existsSync(inputTemp) || fs.statSync(inputTemp).size < 1024) {
            throw new Error('Downloaded video file is empty or missing.');
        }

        console.log(`Step 2: Probing video dimensions for dynamic filter calculations...`);
        let width = 720;
        let height = 1280;

        await new Promise((resolve) => {
            ffmpeg.ffprobe(inputTemp, (probeErr, metadata) => {
                if (!probeErr && metadata && metadata.streams) {
                    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                    if (videoStream) {
                        width = videoStream.width || width;
                        height = videoStream.height || height;
                    }
                }
                resolve();
            });
        });

        console.log(`Dimensions resolved: ${width}x${height}`);

        // Calculated watermark blurring areas
        const cw = Math.floor(width * 0.22); // 22% of width
        const ch = Math.floor(height * 0.05); // 5% of height
        const tl_x = Math.floor(width * 0.02);
        const tl_y = Math.floor(height * 0.02);
        const br_x = Math.floor(width * 0.76);
        const br_y = Math.floor(height * 0.88);
        const logo_w = Math.floor(width * 0.25); // 25% of width

        console.log(`Blur regions: TL(${tl_x},${tl_y}) w:${cw} h:${ch} | BR(${br_x},${br_y}) w:${cw} h:${ch}`);

        console.log('Step 3: Processing video with ffmpeg (boxblurring corners & overlaying logo)...');
        
        await new Promise((resolve, reject) => {
            const command = ffmpeg(inputTemp);
            
            if (fs.existsSync(stampLogoPath)) {
                // Logo exists, perform overlay
                command.input(stampLogoPath)
                    .complexFilter([
                        // Split main video to extract corners, blur them, overlay back
                        `[0:v]split=3[v_orig][v_tl][v_br]`,
                        `[v_tl]crop=${cw}:${ch}:${tl_x}:${tl_y},boxblur=10[v_tl_blur]`,
                        `[v_br]crop=${cw}:${ch}:${br_x}:${br_y},boxblur=10[v_br_blur]`,
                        `[v_orig][v_tl_blur]overlay=${tl_x}:${tl_y}[v_tmp]`,
                        `[v_tmp][v_br_blur]overlay=${br_x}:${br_y}[v_blurred]`,
                        `[1:v]scale=${logo_w}:-1[logo_scaled]`,
                        `[v_blurred][logo_scaled]overlay=(main_w-overlay_w)/2:main_h-overlay_h-30[v_out]`
                    ])
                    .map('[v_out]');
            } else {
                // Fallback: just crop and blur corners, no logo overlay
                command.complexFilter([
                    `[0:v]split=3[v_orig][v_tl][v_br]`,
                    `[v_tl]crop=${cw}:${ch}:${tl_x}:${tl_y},boxblur=10[v_tl_blur]`,
                    `[v_br]crop=${cw}:${ch}:${br_x}:${br_y},boxblur=10[v_br_blur]`,
                    `[v_orig][v_tl_blur]overlay=${tl_x}:${tl_y}[v_tmp]`,
                    `[v_tmp][v_br_blur]overlay=${br_x}:${br_y}[v_out]`
                ])
                .map('[v_out]');
            }

            command.outputOptions([
                '-map 0:a?', // copy audio track if exists
                '-c:a aac',
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-preset superfast'
            ])
            .output(outputTemp)
            .on('end', () => {
                console.log('ffmpeg processing successfully completed!');
                resolve();
            })
            .on('error', (ffmpegErr) => {
                console.error('ffmpeg processing failed:', ffmpegErr.message);
                reject(ffmpegErr);
            })
            .run();
        });

        console.log('Step 4: Uploading processed file to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(outputTemp, {
            resource_type: 'video',
            folder: 'lalatech_remix'
        });

        res.json({
            success: true,
            downloadUrl: uploadResult.secure_url,
            previewUrl: uploadResult.secure_url,
            message: 'Video watermark removed and branded with Lala Tech logo successfully!'
        });

    } catch (error) {
        console.error('Remix process error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to remix video: ' + (error.message || 'Unknown processing error.') 
        });
    } finally {
        // Safe unlinking
        try {
            if (fs.existsSync(inputTemp)) fs.unlinkSync(inputTemp);
            if (fs.existsSync(outputTemp)) fs.unlinkSync(outputTemp);
        } catch (unlinkErr) {
            console.error('Failed to clear temp files:', unlinkErr);
        }
    }
});

// --- 9. SOCIAL MEDIA POSTING ---

// List accounts
router.get('/social/accounts', verifyCrmToken, async (req, res) => {
    try {
        const accounts = await SocialAccount.find();
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add account (done directly via Dashboard UI)
router.post('/social/accounts', verifyCrmToken, async (req, res) => {
    const { platform, accountName, accessToken, pageId } = req.body;
    try {
        if (!platform || !accountName) {
            return res.status(400).json({ message: 'Platform and Account Name are required' });
        }

        const account = new SocialAccount({
            platform,
            accountName,
            accessToken,
            pageId,
            isConnected: true
        });

        await account.save();
        res.status(201).json(account);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete connection
router.delete('/social/accounts/:id', verifyCrmToken, async (req, res) => {
    try {
        await SocialAccount.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Social account disconnected successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Post content to connected channels
router.post('/social/post', verifyCrmToken, async (req, res) => {
    const { accountIds, content, mediaUrl } = req.body;
    try {
        if (!accountIds || accountIds.length === 0 || !content) {
            return res.status(400).json({ message: 'Select at least one account and enter post message' });
        }

        const accounts = await SocialAccount.find({ _id: { $in: accountIds } });
        if (accounts.length === 0) {
            return res.status(404).json({ message: 'Selected social accounts not found' });
        }

        const results = [];

        for (const account of accounts) {
            // Check if there are credentials. If empty, run Simulation mode.
            if (!account.accessToken || account.accessToken.trim() === '') {
                results.push({
                    accountId: account._id,
                    platform: account.platform,
                    name: account.accountName,
                    status: 'success',
                    simulated: true,
                    message: 'Simulated post published successfully (Token Empty: Demo Mode).'
                });
                continue;
            }

            // Real API integrations based on platform
            try {
                if (account.platform === 'facebook') {
                    // Meta Graph API Page Feed Post
                    const fbUrl = `https://graph.facebook.com/v19.0/${account.pageId || 'me'}/feed`;
                    const params = {
                        message: content,
                        access_token: account.accessToken
                    };
                    if (mediaUrl) params.link = mediaUrl;

                    const fbRes = await fetch(fbUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(params)
                    });
                    const fbData = await fbRes.json();
                    
                    if (fbData.error) {
                        throw new Error(fbData.error.message || 'Facebook API error');
                    }
                    
                    results.push({
                        accountId: account._id,
                        platform: account.platform,
                        name: account.accountName,
                        status: 'success',
                        postId: fbData.id
                    });

                } else if (account.platform === 'twitter') {
                    // Twitter API v2 Tweet Posting
                    const twUrl = 'https://api.twitter.com/2/tweets';
                    const payload = { text: content };
                    
                    const twRes = await fetch(twUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${account.accessToken}`
                        },
                        body: JSON.stringify(payload)
                    });
                    const twData = await twRes.json();

                    if (twData.errors) {
                        throw new Error(twData.errors[0].message || 'Twitter API error');
                    }

                    results.push({
                        accountId: account._id,
                        platform: account.platform,
                        name: account.accountName,
                        status: 'success',
                        postId: twData.data?.id || 'Success'
                    });

                } else if (account.platform === 'instagram') {
                    // Instagram Graph API Container flow (Requires Image URL)
                    if (!mediaUrl) {
                        throw new Error('Instagram posting requires a media URL (image/video).');
                    }
                    
                    // 1. Create Media Container
                    const containerUrl = `https://graph.facebook.com/v19.0/${account.pageId}/media`;
                    const containerRes = await fetch(containerUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image_url: mediaUrl,
                            caption: content,
                            access_token: account.accessToken
                        })
                    });
                    const containerData = await containerRes.json();

                    if (containerData.error) {
                        throw new Error(containerData.error.message || 'Instagram container creation failed');
                    }

                    const creationId = containerData.id;

                    // 2. Publish Container
                    const publishUrl = `https://graph.facebook.com/v19.0/${account.pageId}/media_publish`;
                    const publishRes = await fetch(publishUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            creation_id: creationId,
                            access_token: account.accessToken
                        })
                    });
                    const publishData = await publishRes.json();

                    if (publishData.error) {
                        throw new Error(publishData.error.message || 'Instagram publishing failed');
                    }

                    results.push({
                        accountId: account._id,
                        platform: account.platform,
                        name: account.accountName,
                        status: 'success',
                        postId: publishData.id
                    });
                }
            } catch (apiErr) {
                console.error(`Error posting to ${account.platform}:`, apiErr);
                results.push({
                    accountId: account._id,
                    platform: account.platform,
                    name: account.accountName,
                    status: 'failed',
                    message: apiErr.message || 'API Dispatch Failed. Please check token permissions.'
                });
            }
        }

        res.json({ success: true, results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
