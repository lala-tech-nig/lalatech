const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function createDummyPdf() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    page.drawText('This is a dummy PDF for testing.', { x: 50, y: 350, size: 30, color: rgb(0, 0, 0) });
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('test.pdf', pdfBytes);
    console.log('test.pdf created');
}

createDummyPdf();
