# Jigsaw Puzzle Multi

A multiplayer jigsaw puzzle game where multiple players can collaborate to solve puzzles together in real-time.

## Features

- Real-time multiplayer gameplay using WebSockets
- Web-based client interface
- Live display of connected players
- Support for multiple clients in the same game

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open the client:
Open `client/index.html` in your web browser, or navigate to `http://localhost:8080` if running the server.

Multiple tabs can be opened to simulate multiple players.

## Testing

Run the integration tests to verify that multiple clients can connect simultaneously:

```bash
npm test
```

The test suite includes:
- Integration test for four simultaneous client connections
- Verification of server-side client tracking
- Verification that all clients receive proper updates

## Development

The project can be opened in GitHub Codespaces with the devcontainer configuration included.

## Project Structure

```
.
├── server/         # WebSocket server
│   └── server.js   # Main server file
├── client/         # Web client
│   ├── index.html  # Client UI
│   └── client.js   # Client-side logic
├── test/           # Integration tests
│   └── integration.test.js
└── package.json    # Project dependencies
```

## License

MIT License - see LICENSE file for details