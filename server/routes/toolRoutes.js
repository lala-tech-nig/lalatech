const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const pdfParse = require('pdf-parse');
const sharp = require('sharp');
const csv = require('csvtojson');
const { parse: json2csv } = require('json2csv');
const QRCode = require('qrcode');
const xmlJs = require('xml-js');

// Use memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/process', upload.array('files', 20), async (req, res) => {
    try {
        const tool = req.body.tool;
        const files = req.files;

        if (!tool) return res.status(400).json({ message: 'Tool undefined.' });
        if ((!files || files.length === 0) && !['lorem-ipsum-generator', 'epoch-converter'].includes(tool)) {
            return res.status(400).json({ message: 'No files provided for processing.' });
        }

        let outputBuffer = null;
        let outputFileName = 'output';
        let contentType = 'application/octet-stream';

        // ------------------------------------------------------------------ //
        // 1. IMAGE FORMAT CONVERSIONS                                        //
        // ------------------------------------------------------------------ //
        const imageConversions = ['png-to-jpg', 'jpg-to-png', 'webp-to-png', 'png-to-webp', 'jpg-to-webp', 'webp-to-jpg', 'gif-to-png', 'gif-to-jpg'];
        if (imageConversions.includes(tool)) {
            const outFormat = tool.split('-to-')[1];
            outputBuffer = await sharp(files[0].buffer).toFormat(outFormat).toBuffer();
            outputFileName = `converted-image.${outFormat}`;
            contentType = `image/${outFormat}`;
        }
        
        // ------------------------------------------------------------------ //
        // 2. IMAGE MANIPULATIONS                                             //
        // ------------------------------------------------------------------ //
        else if (['compress-image-size', 'resize-image-dimensions', 'crop-image', 'flip-image', 'black-white', 'make-round-image'].includes(tool)) {
            let img = sharp(files[0].buffer);
            const metadata = await img.metadata();
            
            if (tool === 'compress-image-size') {
                img = img.jpeg({ quality: 50 });
            } else if (tool === 'resize-image-dimensions') {
                // Resize to 80% if no params passed
                img = img.resize(Math.round(metadata.width * 0.8));
            } else if (tool === 'crop-image') {
                // Crop central 80%
                img = img.extract({ width: Math.round(metadata.width * 0.8), height: Math.round(metadata.height * 0.8), left: Math.round(metadata.width * 0.1), top: Math.round(metadata.height * 0.1) });
            } else if (tool === 'flip-image') {
                img = img.flop();
            } else if (tool === 'black-white') {
                img = img.grayscale();
            } else if (tool === 'make-round-image') {
                const r = Math.min(metadata.width, metadata.height) / 2;
                const circleSvg = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
                img = img.resize(r * 2, r * 2).composite([{ input: circleSvg, blend: 'dest-in' }]).png();
            }

            outputBuffer = await img.toBuffer();
            outputFileName = `manipulated-image.${tool === 'make-round-image' ? 'png' : 'jpg'}`;
            contentType = `image/${tool === 'make-round-image' ? 'png' : 'jpeg'}`;
        }

        // ------------------------------------------------------------------ //
        // 3. DATA / TEXT CONVERTERS                                          //
        // ------------------------------------------------------------------ //
        else if (['csv-to-json', 'json-to-xml', 'xml-to-json', 'csv-to-xml', 'xml-to-csv'].includes(tool)) {
            const dataStr = files[0].buffer.toString('utf8');
            let outputStr = '';

            try {
                if (tool === 'csv-to-json') {
                    const jsonObj = await csv().fromString(dataStr);
                    outputStr = JSON.stringify(jsonObj, null, 2);
                    outputFileName = 'data.json';
                    contentType = 'application/json';
                } else if (tool === 'json-to-xml') {
                    outputStr = xmlJs.json2xml(dataStr, { compact: true, spaces: 4 });
                    outputFileName = 'data.xml';
                    contentType = 'application/xml';
                } else if (tool === 'xml-to-json') {
                    outputStr = xmlJs.xml2json(dataStr, { compact: true, spaces: 4 });
                    outputFileName = 'data.json';
                    contentType = 'application/json';
                } else if (tool === 'csv-to-xml') {
                    const jsonObj = await csv().fromString(dataStr);
                    outputStr = xmlJs.json2xml(JSON.stringify({ root: { item: jsonObj } }), { compact: true, spaces: 4 });
                    outputFileName = 'data.xml';
                    contentType = 'application/xml';
                } else if (tool === 'xml-to-csv') {
                    const jsonObj = JSON.parse(xmlJs.xml2json(dataStr, { compact: true }));
                    // simple heuristic to find array
                    let arr = jsonObj[Object.keys(jsonObj)[0]];
                    if (!Array.isArray(arr)) arr = arr[Object.keys(arr)[0]];
                    outputStr = json2csv(arr);
                    outputFileName = 'data.csv';
                    contentType = 'text/csv';
                }
                outputBuffer = Buffer.from(outputStr);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid file format. Please check the content.' });
            }
        }

        // ------------------------------------------------------------------ //
        // 4. TEXT & UTILITIES                                                //
        // ------------------------------------------------------------------ //
        else if (['lorem-ipsum-generator', 'word-counter', 'epoch-converter', 'qr-code-generator'].includes(tool)) {
            if (tool === 'lorem-ipsum-generator') {
                const text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
                outputBuffer = Buffer.from(text);
                outputFileName = 'lorem-ipsum.txt';
                contentType = 'text/plain';
            } else if (tool === 'word-counter') {
                const text = files[0].buffer.toString('utf8');
                const count = text.trim().split(/\s+/).length;
                outputBuffer = Buffer.from(`Your text contains ${count} words.`);
                outputFileName = 'word-count.txt';
                contentType = 'text/plain';
            } else if (tool === 'epoch-converter') {
                const now = new Date();
                const text = `Current Epoch (Seconds): ${Math.floor(now.getTime() / 1000)}\nCurrent Epoch (Milliseconds): ${now.getTime()}\nHuman Readable: ${now.toUTCString()}`;
                outputBuffer = Buffer.from(text);
                outputFileName = 'epoch-info.txt';
                contentType = 'text/plain';
            } else if (tool === 'qr-code-generator') {
                const text = req.body.text || 'https://lalatech.ng';
                outputBuffer = await QRCode.toBuffer(text);
                outputFileName = 'qrcode.png';
                contentType = 'image/png';
            }
        }

        // ------------------------------------------------------------------ //
        // 5. PDF FORMAT CONVERSIONS                                          //
        // ------------------------------------------------------------------ //
        else if (['pdf-to-jpg', 'pdf-to-png', 'jpg-to-pdf', 'png-to-pdf', 'pdf-to-word', 'word-to-pdf', 'extract-images-pdf'].includes(tool)) {
            if (tool === 'jpg-to-pdf' || tool === 'png-to-pdf') {
                const pdfDoc = await PDFDocument.create();
                for (const file of files) {
                    let image;
                    if (tool === 'jpg-to-pdf') image = await pdfDoc.embedJpg(file.buffer);
                    else image = await pdfDoc.embedPng(file.buffer);
                    const page = pdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
                }
                outputBuffer = await pdfDoc.save();
                outputFileName = 'images.pdf';
                contentType = 'application/pdf';
            } else if (tool === 'pdf-to-word') {
                const data = await pdfParse(files[0].buffer);
                const doc = new Document({
                    sections: [{ children: data.text.split('\n').map(l => new Paragraph({ children: [new TextRun(l)] })) }]
                });
                outputBuffer = await Packer.toBuffer(doc);
                outputFileName = 'converted.docx';
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            } else if (tool === 'word-to-pdf') {
                const result = await mammoth.extractRawText({ buffer: files[0].buffer });
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage();
                page.drawText(result.value.substring(0, 3000), { x: 50, y: 800, size: 12 });
                outputBuffer = await pdfDoc.save();
                outputFileName = 'converted.pdf';
                contentType = 'application/pdf';
            } else if (tool === 'pdf-to-jpg' || tool === 'pdf-to-png') {
                // Without extensive canvas/ghostscript integrations, converting PDF to images in plain JS is very hard.
                // We will send a placeholder text saying "Conversion requires GhostScript" 
                outputBuffer = Buffer.from('To convert PDF directly to image without external API, a server binary like GhostScript is required.');
                outputFileName = 'info.txt';
                contentType = 'text/plain';
            } else if (tool === 'extract-images-pdf') {
                outputBuffer = Buffer.from('Extracting images from PDF reliably requires external API or GhostScript binaries.');
                outputFileName = 'info.txt';
                contentType = 'text/plain';
            }
        }

        // ------------------------------------------------------------------ //
        // 6. NATIVE PDF MANIPULATIONS                                        //
        // ------------------------------------------------------------------ //
        else if (['merge-pdf', 'split-pdf', 'compress-pdf', 'protect-pdf', 'unlock-pdf', 'watermark-pdf', 'rotate-pdf', 'rearrange-pdf', 'pdf-page-deleter', 'add-numbers-to-pdf'].includes(tool)) {
            let outputFileName = `${tool}.pdf`;
            
            if (tool === 'merge-pdf') {
                const mergedPdf = await PDFDocument.create();
                for (const file of files) {
                    const srcDoc = await PDFDocument.load(file.buffer);
                    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                    copiedPages.forEach(p => mergedPdf.addPage(p));
                }
                outputBuffer = await mergedPdf.save();
            } else if (tool === 'split-pdf') {
                const srcDoc = await PDFDocument.load(files[0].buffer);
                const zip = new JSZip();
                for (let i = 0; i < srcDoc.getPageCount(); i++) {
                    const newDoc = await PDFDocument.create();
                    const [page] = await newDoc.copyPages(srcDoc, [i]);
                    newDoc.addPage(page);
                    zip.file(`page-${i + 1}.pdf`, await newDoc.save());
                }
                outputBuffer = await zip.generateAsync({ type: 'nodebuffer' });
                outputFileName = 'split-pages.zip';
                contentType = 'application/zip';
            } else if (tool === 'watermark-pdf') {
                const text = req.body.text || 'LALA TECH';
                const srcDoc = await PDFDocument.load(files[0].buffer);
                srcDoc.getPages().forEach(page => {
                    const { width, height } = page.getSize();
                    page.drawText(text, { x: width / 3, y: height / 2, size: 40, color: rgb(0.8, 0.1, 0.1), opacity: 0.3 });
                });
                outputBuffer = await srcDoc.save();
            } else if (tool === 'protect-pdf') {
                const password = req.body.password || '1234';
                const srcDoc = await PDFDocument.load(files[0].buffer);
                outputBuffer = await srcDoc.save({ userPassword: password, ownerPassword: password });
            } else if (tool === 'unlock-pdf') {
                const password = req.body.password || '';
                try {
                    const srcDoc = await PDFDocument.load(files[0].buffer, { password });
                    outputBuffer = await srcDoc.save();
                } catch (err) {
                    return res.status(400).json({ message: 'Incorrect password.' });
                }
            } else if (tool === 'rotate-pdf') {
                const srcDoc = await PDFDocument.load(files[0].buffer);
                srcDoc.getPages().forEach(p => p.setRotation(p.getRotation().angle + 90));
                outputBuffer = await srcDoc.save();
            } else if (tool === 'pdf-page-deleter') {
                const srcDoc = await PDFDocument.load(files[0].buffer);
                if (srcDoc.getPageCount() > 1) srcDoc.removePage(srcDoc.getPageCount() - 1); // remove last page
                outputBuffer = await srcDoc.save();
            } else if (tool === 'add-numbers-to-pdf') {
                const srcDoc = await PDFDocument.load(files[0].buffer);
                srcDoc.getPages().forEach((page, i) => {
                    page.drawText(`${i + 1}`, { x: page.getSize().width / 2, y: 30, size: 12, color: rgb(0,0,0) });
                });
                outputBuffer = await srcDoc.save();
            } else if (tool === 'compress-pdf' || tool === 'rearrange-pdf') {
                const srcDoc = await PDFDocument.load(files[0].buffer);
                outputBuffer = await srcDoc.save({ useObjectStreams: true }); // Basic compression / no-op for rearrange
            }
            
            if (tool !== 'split-pdf') contentType = 'application/pdf';
        } else {
            return res.status(400).json({ message: 'Unknown tool requested.' });
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
        res.send(Buffer.from(outputBuffer));

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ message: 'Internal server error during processing.' });
    }
});

router.post('/download-video', async (req, res) => {
    try {
        const { url, format = 'mp4', quality = '720' } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'URL is required.' });
        }

        const isYouTube = /(youtube\.com|youtu\.be)/i.test(url);
        const filename = `lalatech-download-${Date.now()}.${format === 'mp3' ? 'mp3' : 'mp4'}`;

        // ── Engine 1: @distube/ytdl-core for YouTube (fastest, no subprocess) ──
        if (isYouTube) {
            try {
                const ytdl = require('@distube/ytdl-core');

                if (!ytdl.validateURL(url)) {
                    return res.status(400).json({ message: 'Invalid YouTube URL provided.' });
                }

                const info = await ytdl.getInfo(url);

                if (format === 'mp3') {
                    // Stream highest quality audio only
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    ytdl(url, { quality: 'highestaudio', filter: 'audioonly' }).pipe(res);
                } else {
                    // Try to get video+audio combined at requested quality
                    const qualityLabel = `${quality}p`;
                    let chosenFormat = null;

                    // Prefer combined video+audio stream
                    const combined = info.formats.filter(f =>
                        f.hasVideo && f.hasAudio && f.qualityLabel &&
                        parseInt(f.qualityLabel) <= parseInt(quality)
                    ).sort((a, b) => parseInt(b.qualityLabel) - parseInt(a.qualityLabel));

                    if (combined.length > 0) {
                        chosenFormat = combined[0];
                    }

                    res.setHeader('Content-Type', 'video/mp4');
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

                    const dlOptions = chosenFormat
                        ? { format: chosenFormat }
                        : { quality: 'highest', filter: 'videoandaudio' };

                    ytdl(url, dlOptions)
                        .on('error', (err) => {
                            console.error('ytdl stream error:', err.message);
                            if (!res.headersSent) res.status(500).json({ message: 'Video stream interrupted.' });
                        })
                        .pipe(res);
                }
                return; // ytdl handled it
            } catch (ytdlErr) {
                console.warn('ytdl-core failed for YouTube, falling back to yt-dlp-exec:', ytdlErr.message);
                // Fall through to yt-dlp-exec engine below
            }
        }

        // ── Engine 2: yt-dlp-exec — handles ALL platforms (TikTok, Instagram, Twitter/X, Facebook, YouTube fallback) ──
        const ytDlpExec = require('yt-dlp-exec');

        const ytdlpArgs = {
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            output: '-', // pipe to stdout
        };

        if (format === 'mp3') {
            ytdlpArgs.extractAudio = true;
            ytdlpArgs.audioFormat = 'mp3';
            ytdlpArgs.audioQuality = 0; // best
        } else {
            // Select best video at or below requested quality, fallback to best available
            ytdlpArgs.format = `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`;
            ytdlpArgs.mergeOutputFormat = 'mp4';
        }

        console.log(`Resolving with yt-dlp-exec: ${url} | format=${format} | quality=${quality}p`);

        res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const subprocess = ytDlpExec.exec(url, ytdlpArgs);

        subprocess.stdout.pipe(res);

        let stderrLog = '';
        subprocess.stderr.on('data', (chunk) => {
            stderrLog += chunk.toString();
        });

        subprocess.on('error', (err) => {
            console.error('yt-dlp-exec process error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Video download engine failed to start. The URL may be unsupported.' });
            }
        });

        subprocess.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp-exec exited with code ${code}. stderr:`, stderrLog.substring(0, 500));
            }
        });

    } catch (error) {
        console.error('Downloader route error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error: ' + (error.message || 'Unknown failure.') });
        }
    }
});

module.exports = router;
