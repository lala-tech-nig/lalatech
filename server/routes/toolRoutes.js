const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const JSZip = require('jszip');
const mammoth = require('mammoth');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');

// Use memory storage to process files directly
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', upload.array('files', 20), async (req, res) => {
    try {
        const tool = req.body.tool;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files provided for processing.' });
        }

        let outputBuffer = null;
        let outputFileName = 'output.pdf';
        let contentType = 'application/pdf';

        // 1. Merge PDF
        if (tool === 'merge-pdf') {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const srcDoc = await PDFDocument.load(file.buffer);
                const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            outputBuffer = await mergedPdf.save();
            outputFileName = 'merged-document.pdf';
        } 
        
        // 2. Watermark PDF
        else if (tool === 'watermark-pdf') {
            const textToStamp = req.body.text || 'LALA TECH';
            const srcDoc = await PDFDocument.load(files[0].buffer);
            const pages = srcDoc.getPages();
            for (const page of pages) {
                const { width, height } = page.getSize();
                page.drawText(textToStamp, {
                    x: width / 2 - 100,
                    y: height / 2,
                    size: 50,
                    color: rgb(0.9, 0.1, 0.1),
                    opacity: 0.3,
                });
            }
            outputBuffer = await srcDoc.save();
            outputFileName = 'watermarked-document.pdf';
        }

        // 3. Protect PDF
        else if (tool === 'protect-pdf') {
            const password = req.body.password || '1234';
            const srcDoc = await PDFDocument.load(files[0].buffer);
            outputBuffer = await srcDoc.save({ userPassword: password, ownerPassword: password });
            outputFileName = 'protected-document.pdf';
        }

        // 4. Unlock PDF
        else if (tool === 'unlock-pdf') {
            const password = req.body.password || '';
            let srcDoc;
            try {
                srcDoc = await PDFDocument.load(files[0].buffer, { password });
            } catch (err) {
                return res.status(400).json({ message: 'Incorrect password or PDF error.' });
            }
            outputBuffer = await srcDoc.save();
            outputFileName = 'unlocked-document.pdf';
        }

        // 5. JPG/PNG to PDF
        else if (tool === 'jpg-to-pdf') {
            const pdfDoc = await PDFDocument.create();
            for (const file of files) {
                let image;
                if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                    image = await pdfDoc.embedJpg(file.buffer);
                } else if (file.mimetype === 'image/png') {
                    image = await pdfDoc.embedPng(file.buffer);
                } else {
                    continue;
                }
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }
            outputBuffer = await pdfDoc.save();
            outputFileName = 'images-to-pdf.pdf';
        }

        // 6. Split PDF
        else if (tool === 'split-pdf') {
            const srcDoc = await PDFDocument.load(files[0].buffer);
            const pageCount = srcDoc.getPageCount();
            const zip = new JSZip();
            
            for (let i = 0; i < pageCount; i++) {
                const newDoc = await PDFDocument.create();
                const [page] = await newDoc.copyPages(srcDoc, [i]);
                newDoc.addPage(page);
                const pdfBytes = await newDoc.save();
                zip.file(`page-${i + 1}.pdf`, pdfBytes);
            }
            
            outputBuffer = await zip.generateAsync({ type: 'nodebuffer' });
            outputFileName = 'split-pages.zip';
            contentType = 'application/zip';
        }

        // 7. Compress PDF (Basic optimization)
        else if (tool === 'compress-pdf') {
            const srcDoc = await PDFDocument.load(files[0].buffer);
            outputBuffer = await srcDoc.save({ useObjectStreams: true });
            outputFileName = 'compressed-document.pdf';
        }

        // 8. Sign PDF (Adds a signature image on the last page)
        else if (tool === 'sign-pdf') {
            // If multiple files, assume the first is PDF and the second is the signature image
            if (files.length < 2) return res.status(400).json({ message: 'Please upload both a PDF and a signature image.' });
            
            const srcDoc = await PDFDocument.load(files[0].buffer);
            const signatureBuffer = files[1].buffer;
            
            let signature;
            if (files[1].mimetype.includes('png')) signature = await srcDoc.embedPng(signatureBuffer);
            else signature = await srcDoc.embedJpg(signatureBuffer);
            
            const lastPage = srcDoc.getPages()[srcDoc.getPageCount() - 1];
            const { width, height } = lastPage.getSize();
            
            lastPage.drawImage(signature, {
                x: width - 150,
                y: 50,
                width: 100,
                height: 50,
            });
            
            outputBuffer = await srcDoc.save();
            outputFileName = 'signed-document.pdf';
        }

        // 9. PDF to Word (Text Extraction only)
        else if (tool === 'pdf-to-word') {
            const data = await pdfParse(files[0].buffer);
            const textLines = data.text.split('\n');
            
            const doc = new Document({
                sections: [{
                    children: textLines.map(line => new Paragraph({
                        children: [new TextRun(line)],
                    })),
                }],
            });
            
            outputBuffer = await Packer.toBuffer(doc);
            outputFileName = 'converted-document.docx';
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        }

        // 10. Word to PDF (Very basic text-only conversion)
        else if (tool === 'word-to-pdf') {
            const result = await mammoth.extractRawText({ buffer: files[0].buffer });
            const text = result.value;
            
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            
            page.drawText('Note: This is a basic text-only conversion from Word.', { x: 50, y: height - 50, size: 10 });
            page.drawText(text.substring(0, 1000), { // Limited to first 1000 chars for demo
                x: 50,
                y: height - 100,
                size: 12,
                maxWidth: width - 100,
            });
            
            outputBuffer = await pdfDoc.save();
            outputFileName = 'converted-from-word.pdf';
        }

        // 11. Extract Images
        else if (tool === 'extract-images') {
            const zip = new JSZip();
            const srcDoc = await PDFDocument.load(files[0].buffer);
            const enumerateObjects = srcDoc.context.enumerateIndirectObjects();
            
            let imgCount = 0;
            for (const [ref, obj] of enumerateObjects) {
                if (obj.get && obj.get(PDFDocument.create().context.obj('Subtype'))?.toString() === '/Image') {
                    const contents = obj.get(PDFDocument.create().context.obj('Contents'));
                    // Simplifying: This is a complex task to do manually without a decoder. 
                    // For now, we stub this with a message or basic extraction if possible.
                    imgCount++;
                }
            }

            if (imgCount === 0) return res.status(400).json({ message: 'No images found in this PDF.' });
            
            // Dummy implementation for demo stability
            zip.file('info.txt', `Found ${imgCount} image objects in the PDF core. Manual extraction requires pixel decoding.`);
            outputBuffer = await zip.generateAsync({ type: 'nodebuffer' });
            outputFileName = 'extracted-images.zip';
            contentType = 'application/zip';
        }

        else {
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

module.exports = router;
