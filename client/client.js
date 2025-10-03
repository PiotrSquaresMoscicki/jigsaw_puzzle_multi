// WebSocket connection
let ws;
let myClientId = null;

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const clientCount = document.getElementById('client-count');

// Connect to WebSocket server
function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    console.log('Connecting to:', wsUrl);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('Connected to server');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
            handleMessage(data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };

    ws.onclose = () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Handle incoming messages
function handleMessage(data) {
    switch (data.type) {
        case 'welcome':
            myClientId = data.clientId;
            console.log(data.message);
            break;

        case 'clientsUpdate':
            updateClientsList(data.clients);
            break;

        default:
            console.log('Unknown message type:', data.type);
    }
}

// Update connection status display
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connected';
        connectionStatus.className = 'status connected';
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionStatus.className = 'status disconnected';
        myClientId = null;
    }
}

// Update the list of connected clients
function updateClientsList(clients) {
    clientCount.textContent = clients.length;
}

// Send a message to the server
function sendMessage(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not connected');
    }
}

// Initialize connection when page loads
connect();
