const fs = require('fs');

// Read the previously generated toolsList.js file using require or parsing
// Since it's an export we can't easily require it if it's ES module, let's just parse the JSON out of it.
const fileContent = fs.readFileSync('C:\\Users\\LALA TECH\\Desktop\\lalatech\\client\\lib\\toolsList.js', 'utf8');
const jsonMatch = fileContent.match(/export const toolsList = (\[[\s\S]*\]);/);
if (!jsonMatch) {
    console.error("Could not parse JSON from file.");
    process.exit(1);
}

const tools = JSON.parse(jsonMatch[1]);

// Criteria for removal:
const removeCategories = ['AI Write', 'Video Tools'];
const removeComplexImageTools = [
    'ai-image-generator', 'remove-background-from-image', 'upscale-image', 'remove-watermark', 'image-to-text',
    'change-background-of-photo', 'remove-objects-photo', 'remove-text-photo', 'heic-to-jpg', 'blur-background-tools',
    'unblur-img', 'remove-person-from-photo', 'cleanup-picture', 'webp-to-jpg', 'colorize-photo', 'make-background-transparent',
    'repair-defects', 'tiff-to-text', 'translate-image'
];

// Complex PDF tools that need intense OCR or binary
const removeComplexPdfTools = ['pdf-to-excel', 'pdf-to-powerpoint', 'pdf-translator', 'pdf-to-epub', 'powerpoint-to-pdf'];

const filteredTools = tools.filter(tool => {
    if (removeCategories.includes(tool.category)) return false;
    if (tool.category === 'Image Tools' && removeComplexImageTools.includes(tool.slug)) return false;
    if (tool.category === 'Pdf Tools' && removeComplexPdfTools.includes(tool.slug)) return false;
    // Also remove any tool that has 'ai' or 'generator' in name unless it's basic
    if ((tool.name.toLowerCase().includes('ai') || tool.name.toLowerCase().includes('generator')) 
        && !['qr-code-generator', 'lorem-ipsum-generator'].includes(tool.slug)) {
        return false;
    }
    return true;
});

const newContent = `export const toolsList = ${JSON.stringify(filteredTools, null, 2)};\n`;
fs.writeFileSync('C:\\Users\\LALA TECH\\Desktop\\lalatech\\client\\lib\\toolsList.js', newContent);
console.log('Successfully filtered down to', filteredTools.length, 'tools');
