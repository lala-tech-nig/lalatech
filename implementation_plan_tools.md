# Implementation Plan - Internal Tool Services

The goal is to implement internal logic for all file processing tools listed on the website, removing dependency on external APIs and providing a seamless "service" for each tool.

## Proposed Changes

### [Component] Backend - Tool Processing Logic

#### [MODIFY] [toolRoutes.js](file:///c:/Users/LALA/TECH/Desktop/lalatech/server/routes/toolRoutes.js)
- Implement full logic for the following tools using `pdf-lib`, `jszip`, `mammoth`, and `docx`:
    - **Merge PDF**: (Existing) Combines multiple PDFs.
    - **Watermark PDF**: (Existing) Adds text overlay.
    - **Protect PDF**: (Existing) Adds password.
    - **Unlock PDF**: (Existing) Removes password.
    - **JPG/PNG to PDF [NEW]**: Converts images to a single PDF document.
    - **Split PDF [NEW]**: Extracts each page into a separate PDF (returned as a ZIP).
    - **Extract Images [NEW]**: Pulls all embedded images from a PDF (returned as a ZIP).
    - **Sign PDF [NEW]**: Overlays a signature image onto a PDF.
    - **Compress PDF [NEW]**: Re-saves PDF with object stream optimization.
    - **PDF to Word [NEW]**: Simple text extraction from PDF into a `.docx` file.
    - **Word to PDF [NEW]**: Basic conversion of Word text/formatting to PDF.

#### Dependencies to Install
- `jszip`: To bundle multiple output files (for Split/Extract).
- `mammoth`: To read Word documents.
- `docx`: To create Word documents.
- `pdf-parse`: For text extraction from PDFs.

### [Component] Frontend - Tool UI Adjustments
- Ensure the [ToolServicePage](file:///c:/Users/LALA%20TECH/Desktop/lalatech/client/app/%28public%29/tools/%5Bslug%5D/page.jsx#25-287) correctly handles ZIP responses for Multi-file output tools.

## Verification Plan

### Automated Tests
- I will create a test script `testTools.js` in the server to verify each tool's logic with sample files.

### Manual Verification
1. **JPG to PDF**: Upload 2 images, verify the resulting PDF has 2 pages.
2. **Split PDF**: Upload a 3-page PDF, verify a ZIP is returned with 3 separate PDFs.
3. **PDF to Word**: Upload a text-heavy PDF, verify a readable `.docx` is returned.
4. **Sign PDF**: Upload a PDF and an image, verify the image appears on the result.
