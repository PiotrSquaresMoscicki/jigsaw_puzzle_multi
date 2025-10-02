const { expect } = require('chai');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

describe('Four Clients Integration Test', function() {
  let server;
  let wss;
  let httpServer;
  const PORT = 8081; // Use a different port for testing
  let clients;
  let clientIdCounter;

  // Setup server before tests
  before(function(done) {
    // Create HTTP server to serve static files
    httpServer = http.createServer((req, res) => {
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
    wss = new WebSocket.Server({ server: httpServer });

    // Track connected clients
    clients = new Map();
    clientIdCounter = 1;

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
    httpServer.listen(PORT, () => {
      console.log(`Test server is running on http://localhost:${PORT}`);
      server = httpServer;
      done();
    });
  });

  // Cleanup after tests
  after(function(done) {
    // Close all client connections
    if (wss) {
      wss.clients.forEach((client) => {
        client.close();
      });
    }
    
    // Close server
    if (httpServer) {
      httpServer.close(() => {
        console.log('Test server closed');
        done();
      });
    } else {
      done();
    }
  });

  it('should allow four clients to connect simultaneously', function(done) {
    const clientConnections = [];
    const clientMessages = [[], [], [], []]; // Store messages for each client
    let connectedCount = 0;
    const EXPECTED_CLIENTS = 4;

    // Helper to wait for all clients to receive the expected update
    function checkAllClientsUpdated() {
      // Check if all clients have received a clientsUpdate with 4 clients
      let allUpdated = true;
      for (let i = 0; i < EXPECTED_CLIENTS; i++) {
        const hasUpdateWith4Clients = clientMessages[i].some(msg => 
          msg.type === 'clientsUpdate' && msg.clients.length === EXPECTED_CLIENTS
        );
        if (!hasUpdateWith4Clients) {
          allUpdated = false;
          break;
        }
      }

      if (allUpdated) {
        console.log('All clients received update with 4 connected clients');
        
        // Verify server side has 4 clients
        expect(clients.size).to.equal(EXPECTED_CLIENTS);
        console.log(`Server correctly reports ${clients.size} clients connected`);
        
        // Verify each client received welcome message with unique ID
        for (let i = 0; i < EXPECTED_CLIENTS; i++) {
          const welcomeMsg = clientMessages[i].find(msg => msg.type === 'welcome');
          expect(welcomeMsg).to.exist;
          expect(welcomeMsg.clientId).to.be.a('number');
          expect(welcomeMsg.clientId).to.be.at.least(1);
          expect(welcomeMsg.clientId).to.be.at.most(EXPECTED_CLIENTS);
          console.log(`Client ${i + 1} received welcome with ID: ${welcomeMsg.clientId}`);
        }
        
        // Verify each client received clientsUpdate with all 4 clients
        for (let i = 0; i < EXPECTED_CLIENTS; i++) {
          const updateMsg = clientMessages[i].find(msg => 
            msg.type === 'clientsUpdate' && msg.clients.length === EXPECTED_CLIENTS
          );
          expect(updateMsg).to.exist;
          expect(updateMsg.clients).to.be.an('array').with.lengthOf(EXPECTED_CLIENTS);
          
          // Verify all client IDs are present and unique
          const clientIds = updateMsg.clients.map(c => c.id);
          expect(clientIds.sort()).to.deep.equal([1, 2, 3, 4]);
          console.log(`Client ${i + 1} received clientsUpdate with all 4 clients: ${clientIds.join(', ')}`);
        }
        
        // Close all client connections
        clientConnections.forEach(ws => ws.close());
        
        // Wait a bit for cleanup then complete test
        setTimeout(() => {
          done();
        }, 100);
      }
    }

    // Create 4 WebSocket clients
    for (let i = 0; i < EXPECTED_CLIENTS; i++) {
      const ws = new WebSocket(`ws://localhost:${PORT}`);
      clientConnections.push(ws);
      
      const clientIndex = i;
      
      ws.on('open', () => {
        connectedCount++;
        console.log(`Client ${clientIndex + 1} connected (${connectedCount}/${EXPECTED_CLIENTS})`);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log(`Client ${clientIndex + 1} received:`, message.type);
          clientMessages[clientIndex].push(message);
          
          // Check if all clients are ready after each message
          if (connectedCount === EXPECTED_CLIENTS) {
            checkAllClientsUpdated();
          }
        } catch (error) {
          console.error(`Client ${clientIndex + 1} error parsing message:`, error);
        }
      });
      
      ws.on('error', (error) => {
        console.error(`Client ${clientIndex + 1} WebSocket error:`, error);
        done(error);
      });
    }
    
    // Safety timeout in case something goes wrong
    setTimeout(() => {
      if (connectedCount < EXPECTED_CLIENTS) {
        done(new Error(`Only ${connectedCount} clients connected out of ${EXPECTED_CLIENTS}`));
      }
    }, 5000);
  });
});
