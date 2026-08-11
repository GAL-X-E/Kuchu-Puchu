const express = require('express');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create an HTTP server
const server = app.listen(port, () => {
    console.log(`==================================================`);
    console.log(` 💖 Kuchu-Muchu Video Calling Server Running! 💖`);
    console.log(` Access locally at: http://localhost:${port}`);
    console.log(`==================================================`);
});

// Attach PeerJS server on path /peerjs
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);

peerServer.on('connection', (client) => {
    console.log(`[PeerJS] Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
    console.log(`[PeerJS] Client disconnected: ${client.getId()}`);
});
