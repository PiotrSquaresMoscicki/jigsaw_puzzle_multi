// WebSocket connection
let ws;
let myClientId = null;
let clients = [];
let playersListExpanded = false;

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const clientCount = document.getElementById('client-count');
const playersToggle = document.getElementById('players-toggle');
const playersList = document.getElementById('players-list');
const expandIcon = document.getElementById('expand-icon');

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
function updateClientsList(clientsData) {
    clients = clientsData;
    clientCount.textContent = clients.length;
    renderPlayersList();
}

// Render the players list
function renderPlayersList() {
    if (clients.length === 0) {
        playersList.innerHTML = '<div style="padding: 6px 8px; color: #999; font-size: 12px; font-style: italic;">No players</div>';
        return;
    }

    playersList.innerHTML = '';
    
    clients.forEach(client => {
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        
        // Highlight the current client
        if (client.id === myClientId) {
            playerItem.classList.add('current');
        }

        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = client.name;

        const playerId = document.createElement('div');
        playerId.className = 'player-id';
        playerId.textContent = `ID: ${client.id}`;

        playerItem.appendChild(playerName);
        playerItem.appendChild(playerId);
        playersList.appendChild(playerItem);
    });
}

// Toggle players list expansion
function togglePlayersList() {
    playersListExpanded = !playersListExpanded;
    
    if (playersListExpanded) {
        playersList.classList.add('expanded');
        expandIcon.classList.add('expanded');
    } else {
        playersList.classList.remove('expanded');
        expandIcon.classList.remove('expanded');
    }
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

// Add click handler for players list toggle
playersToggle.addEventListener('click', togglePlayersList);
