const http = require('http');
const redis = require('redis');
const path = require('path');
const fs = require('fs');

const client = redis.createClient({
    url: 'redis://redis:6379'
});

// Handle Redis connection errors
client.on('error', (err) => {
    console.log('Redis Client Error:', err);
});

client.on('connect', () => {
    console.log('Connected to Redis successfully');
});

// Connect to Redis with error handling
client.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
});

const server = http.createServer(async (req, res) => {
    // Serve HTML page for root path
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'public', 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Page not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
        return;
    }

    // API endpoint for visits
    if (req.url === '/api/visits') {
        try {
            // Check if Redis is connected
            if (!client.isOpen) {
                throw new Error('Redis not connected');
            }
            
            let visits = await client.get('visits');

            if (!visits) {
                visits = 1;
            } else {
                visits = parseInt(visits) + 1;
            }

            await client.set('visits', visits);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ visits }));
        } catch (error) {
            console.error('Error in /api/visits:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Redis error', message: error.message }));
        }
        return;
    }

    // Default response for other paths
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Server is running</h1><p>Go to <a href="/">home page</a> or <a href="/api/visits">visits API</a></p>');
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});