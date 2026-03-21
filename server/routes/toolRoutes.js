const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

// Use memory storage to process files directly without saving to disk first
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', upload.array('files', 10), async (req, res) => {
    try {
        const tool = req.body.tool;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files provided for processing.' });
        }

        let outputPdfBytes = null;
        let outputFileName = 'output.pdf';

        if (tool === 'merge-pdf') {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const pdfBytes = file.buffer;
                const srcDoc = await PDFDocument.load(pdfBytes);
                const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            outputPdfBytes = await mergedPdf.save();
            outputFileName = 'merged-document.pdf';
        } 
        
        else if (tool === 'watermark-pdf') {
            const textToStamp = req.body.text || 'CONFIDENTIAL';
            const srcDoc = await PDFDocument.load(files[0].buffer);
            const pages = srcDoc.getPages();
            
            for (const page of pages) {
                const { width, height } = page.getSize();
                page.drawText(textToStamp, {
                    x: width / 2 - 100,
                    y: height / 2,
                    size: 50,
                    color: rgb(0.95, 0.1, 0.1),
                    opacity: 0.5,
                });
            }
            outputPdfBytes = await srcDoc.save();
            outputFileName = 'watermarked-document.pdf';
        }

        else if (tool === 'protect-pdf') {
            const password = req.body.password || '1234';
            const srcDoc = await PDFDocument.load(files[0].buffer);
            outputPdfBytes = await srcDoc.save({ userPassword: password, ownerPassword: password });
            outputFileName = 'protected-document.pdf';
        }

        else if (tool === 'unlock-pdf') {
            const password = req.body.password || '';
            let srcDoc;
            try {
                 srcDoc = await PDFDocument.load(files[0].buffer, { password });
            } catch (err) {
                 return res.status(400).json({ message: 'Incorrect password or PDF is not encrypted.' });
            }
            outputPdfBytes = await srcDoc.save(); // saving without specifying password strips it
            outputFileName = 'unlocked-document.pdf';
        }

        // Add stubs for formats requiring 3rd party APIs (Ghostscript / CloudConvert)
        else if (['pdf-to-word', 'word-to-pdf', 'compress-pdf', 'jpg-to-pdf', 'pdf-to-jpg', 'split-pdf', 'extract-images', 'sign-pdf'].includes(tool)) {
            return res.status(400).json({ 
                message: `The ${tool} tool relies on external format conversion APIs or binary dependencies (like Ghostscript/LibreOffice) which are currently disabled in this demo environment.`
            });
        }

        else {
            return res.status(400).json({ message: 'Unknown tool requested.' });
        }

        // Send back the modified file as a downloadable binary blob
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
        res.send(Buffer.from(outputPdfBytes));

    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ message: 'Failed to process file. Ensure it is a valid PDF.' });
    }
});

module.exports = router;
