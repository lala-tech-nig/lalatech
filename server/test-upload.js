const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
    try {
        const form = new FormData();
        form.append('tool', 'pdf-to-word');
        // No file needed for this dummy test since we just want to see if it reaches the server
        
        console.log('Sending request to http://localhost:5000/api/tools/process...');
        const res = await fetch('http://localhost:5000/api/tools/process', {
            method: 'POST',
            body: form
        });
        
        const data = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testUpload();
