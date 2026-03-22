const fs = require('fs');

const fileContent = fs.readFileSync('C:\\Users\\LALA TECH\\Desktop\\lalatech\\client\\lib\\toolsList.js', 'utf8');
const jsonMatch = fileContent.match(/export const toolsList = (\[[\s\S]*\]);/);
const tools = JSON.parse(jsonMatch[1]);

// We want to keep ONLY these slugs that we are explicitly building backend support for.
const supportedSlugs = [
    // PDF
    'merge-pdf', 'split-pdf', 'compress-pdf', 'protect-pdf', 'unlock-pdf',
    'watermark-pdf', 'rotate-pdf', 'rearrange-pdf', 'pdf-page-deleter',
    'add-numbers-to-pdf', 'pdf-to-jpg', 'pdf-to-png', 'jpg-to-pdf', 'png-to-pdf',
    'pdf-to-word', 'word-to-pdf', 'extract-images-pdf',

    // Image Format Conversion
    'png-to-jpg', 'jpg-to-png', 'webp-to-png', 'png-to-webp',
    'jpg-to-webp', 'webp-to-jpg', 'gif-to-png', 'gif-to-jpg',

    // Image Manipulation
    'compress-image-size', 'resize-image-dimensions', 'crop-image',
    'flip-image', 'black-white', 'make-round-image',

    // Data / Text Converters
    'csv-to-json', 'json-to-xml', 'xml-to-json', 'csv-to-xml', 'xml-to-csv',
    
    // Utilities
    'lorem-ipsum-generator', 'word-counter', 'epoch-converter', 'qr-code-generator'
];

const finalTools = tools.filter(t => supportedSlugs.includes(t.slug));

const newContent = `export const toolsList = ${JSON.stringify(finalTools, null, 2)};\n`;
fs.writeFileSync('C:\\Users\\LALA TECH\\Desktop\\lalatech\\client\\lib\\toolsList.js', newContent);
console.log('Final tools list generated with', finalTools.length, 'reliable local tools!');
