# Jigsaw Puzzle Multi - Architecture

## Overview

This document describes the architectural decisions, technical standards, and design patterns used in the Jigsaw Puzzle Multi project. It serves as a reference for maintaining consistency and understanding the technical context.

## Technology Stack

### Runtime Environment
- **Node.js** (v18 or higher) - Server-side JavaScript runtime
- **Modern Web Browsers** - Client-side environment (Chrome, Firefox, Safari, Edge)

### Core Dependencies
- **ws** (^8.14.2) - WebSocket library for real-time communication
- **http** (Node.js built-in) - HTTP server for serving static files

### Development Dependencies
- **Mocha** (^10.2.0) - Test framework
- **Chai** (^4.3.10) - Assertion library for tests

### Language
- **JavaScript** (ES6+) - No TypeScript, no build process required
- Vanilla JavaScript on the client-side (no frameworks)
- Node.js with CommonJS modules on the server-side

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │◄──────────────────────────►│                 │
│  Web Browser    │         (ws://)            │  Node.js Server │
│  (Client)       │                            │                 │
│                 │         HTTP GET           │                 │
│  - index.html   │◄──────────────────────────►│  - server.js    │
│  - client.js    │      (static files)        │  - HTTP Server  │
│                 │                            │  - WS Server    │
└─────────────────┘                            └─────────────────┘
```

### Communication Pattern

**Client-Server Model:**
- Single server hosts both HTTP and WebSocket endpoints
- Multiple clients connect via WebSocket for real-time communication
- Server broadcasts state updates to all connected clients
- No peer-to-peer communication between clients

## Project Structure

```
.
├── server/                 # Server-side code
│   └── server.js          # Main server file (HTTP + WebSocket)
├── client/                # Client-side code
│   ├── index.html         # Main HTML page
│   └── client.js          # Client-side WebSocket logic
├── test/                  # Test suite
│   └── integration.test.js # Integration tests
├── .github/               # GitHub configuration
│   └── agents/           # Copilot agent instructions
│       └── instructions.md
├── specification.md       # User-facing functionality documentation
├── architecture.md        # This file - technical documentation
├── README.md             # Project overview and setup
├── package.json          # Dependencies and scripts
└── LICENSE               # MIT License
```

## Design Decisions

### 1. No Build Process

**Decision:** Use vanilla JavaScript without transpilation or bundling.

**Rationale:**
- Simplifies development workflow
- Reduces complexity and dependencies
- Appropriate for early development phase
- Easy to understand and debug

**Trade-offs:**
- Cannot use JSX, TypeScript, or advanced ES features not supported by target browsers
- No code splitting or optimization
- Manual dependency management

### 2. Single Server Process

**Decision:** Combine HTTP server and WebSocket server in a single Node.js process.

**Rationale:**
- Simplifies deployment and development
- Reduces infrastructure complexity
- Sufficient for initial prototype and testing
- Easy to scale later by separating concerns

**Trade-offs:**
- Scaling requires careful consideration
- Single point of failure
- May need to split into microservices for production

### 3. In-Memory State Management

**Decision:** Store client state in memory using a JavaScript Map.

**Rationale:**
- Fast access and updates
- Simple implementation
- Appropriate for prototype phase
- No database overhead

**Trade-offs:**
- State is lost on server restart
- No persistence across deployments
- Memory usage grows with client count
- Not suitable for production scale

**Future Consideration:** Will need to implement persistent storage (Redis, PostgreSQL) for production.

### 4. Automatic Client IDs

**Decision:** Server assigns sequential IDs to clients upon connection.

**Rationale:**
- Simple and predictable
- No need for UUID generation
- Easy to debug and test
- Sufficient for current scope

**Trade-offs:**
- IDs are not globally unique across restarts
- No authentication or session management
- May need to implement proper user accounts later

### 5. Broadcast Pattern for Updates

**Decision:** Server broadcasts all state changes to all connected clients.

**Rationale:**
- Ensures all clients have consistent state
- Simple to implement
- Works well for small player counts
- Real-time synchronization

**Trade-offs:**
- Not scalable to large player counts
- Bandwidth usage increases with client count
- May need event filtering for production

## Technical Standards

### Code Style

**JavaScript:**
- Use ES6+ features where supported
- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- 2-space indentation
- Semicolons required

**Naming Conventions:**
- `camelCase` for variables and functions
- `PascalCase` for classes (when used)
- UPPERCASE for constants
- Descriptive names over abbreviations

### Error Handling

**Server-Side:**
- Log errors to console with context
- Catch JSON parsing errors in message handlers
- Handle WebSocket errors and disconnections gracefully
- Return appropriate HTTP status codes

**Client-Side:**
- Log errors to browser console
- Handle WebSocket connection failures
- Implement automatic reconnection
- Display user-friendly error messages

### Testing Strategy

**Integration Tests:**
- Test WebSocket connection and message flow
- Verify multi-client scenarios (currently testing 4 clients)
- Use Mocha test framework with Chai assertions
- Run tests on different port (8081) to avoid conflicts

**Test Structure:**
```javascript
describe('Feature Name', function() {
  before(function(done) {
    // Setup
  });
  
  after(function(done) {
    // Cleanup
  });
  
  it('should do something', function(done) {
    // Test logic
  });
});
```

**Future Testing:**
- Add unit tests for individual functions
- Test puzzle logic when implemented
- Add client-side tests (e.g., using Playwright or Puppeteer)
- Test error conditions and edge cases

### Security Considerations

**Current Status:**
- No authentication or authorization
- No input validation beyond JSON parsing
- No rate limiting
- No CSRF protection

**Note:** These are acceptable for development but must be addressed before production deployment.

## WebSocket Protocol Design

### Connection Flow

1. Client opens WebSocket connection to server
2. Server assigns client ID and creates client record
3. Server sends `welcome` message to new client
4. Server broadcasts `clientsUpdate` to all clients
5. Clients can send messages to server
6. On disconnect, server removes client and broadcasts update

### Message Format

All messages are JSON-encoded strings with a `type` field:

```javascript
{
  "type": "messageType",
  // Additional fields specific to message type
}
```

### Current Message Types

See `specification.md` for complete protocol documentation.

### Extensibility

The message handling uses a switch statement on `data.type`, making it easy to add new message types:

```javascript
switch (data.type) {
  case 'newMessageType':
    // Handle new message
    break;
  default:
    console.log('Unknown message type:', data.type);
}
```

## Deployment Architecture

### Development

```bash
npm install    # Install dependencies
npm start      # Start server on port 8080
npm test       # Run integration tests
```

### Environment Variables

- `PORT` - Server port (default: 8080)

### Production Considerations (Not Yet Implemented)

- Use process manager (PM2, systemd)
- Implement proper logging (Winston, Bunyan)
- Add monitoring and metrics
- Use reverse proxy (nginx) for SSL termination
- Implement session management
- Add database for persistent storage
- Configure CORS properly
- Implement rate limiting
- Add authentication

## Performance Characteristics

### Current Performance

- Supports at least 4 simultaneous clients (tested)
- Low latency for local connections
- Minimal memory footprint
- No significant CPU usage

### Known Limitations

- No load testing performed yet
- Unknown maximum client capacity
- No message queuing or buffering
- Broadcast can become bottleneck with many clients

### Scaling Strategy (Future)

- Horizontal scaling with load balancer
- Redis for shared state
- WebSocket sticky sessions
- Database replication
- CDN for static assets

## Dependencies Management

### Update Policy

- Keep dependencies up to date for security patches
- Test thoroughly before updating major versions
- Document breaking changes in package.json

### Current Dependencies

```json
{
  "dependencies": {
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "mocha": "^10.2.0",
    "chai": "^4.3.10"
  }
}
```

## Future Architectural Decisions

These items need to be decided as the project evolves:

1. **State Management:** Transition from in-memory to persistent storage
2. **Authentication:** Implement user accounts and sessions
3. **Puzzle Storage:** How to store and retrieve puzzle images
4. **Game Rooms:** Support multiple simultaneous games
5. **Real-time Optimization:** Optimize broadcast patterns for scale
6. **Frontend Framework:** Consider React/Vue if complexity grows
7. **API Design:** RESTful API for game management
8. **Monitoring:** Application performance monitoring (APM)

---

**Note:** This architecture document should be updated whenever significant technical decisions are made or the system design changes. Keep it synchronized with the actual implementation.
