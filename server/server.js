const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
  let filePath = './client' + req.url;
  if (req.url === '/') {
    filePath = './client/index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Map();
let clientIdCounter = 1;

// Broadcast to all connected clients
function broadcast(message) {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Get list of all connected clients
function getClientsList() {
  return Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name,
    connectedAt: client.connectedAt
  }));
}

// Handle new client connections
wss.on('connection', (ws) => {
  const clientId = clientIdCounter++;
  const clientInfo = {
    id: clientId,
    name: `Player ${clientId}`,
    connectedAt: new Date().toISOString(),
    ws: ws
  };
  
  clients.set(ws, clientInfo);
  
  console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);
  
  // Send welcome message to the new client
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId: clientId,
    message: `Welcome, ${clientInfo.name}!`
  }));
  
  // Broadcast updated client list to all clients
  broadcast({
    type: 'clientsUpdate',
    clients: getClientsList()
  });
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received from client ${clientId}:`, data);
      
      // Handle different message types
      switch (data.type) {
        case 'updateName':
          if (clients.has(ws)) {
            clients.get(ws).name = data.name;
            broadcast({
              type: 'clientsUpdate',
              clients: getClientsList()
            });
          }
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.size}`);
    
    // Broadcast updated client list
    broadcast({
      type: 'clientsUpdate',
      clients: getClientsList()
    });
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});
