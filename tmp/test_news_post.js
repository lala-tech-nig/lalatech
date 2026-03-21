async function testPost() {
    try {
        const res = await fetch('http://localhost:5000/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Test Article ' + Date.now(),
                content: '<p>This is a test article content.</p>',
                excerpt: 'Test excerpt',
                category: 'Technology'
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (err) {
        console.error('Error:', err);
    }
}

testPost();
