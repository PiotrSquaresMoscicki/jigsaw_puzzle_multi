# Jigsaw Puzzle Multi - Specification

## Overview

Jigsaw Puzzle Multi is a real-time multiplayer jigsaw puzzle game where multiple players can collaborate to solve puzzles together. This document describes all user-facing functionalities and features.

## Current Features

### 1. Real-Time Multiplayer Connection

**Description:** Players can connect to the game server via WebSocket and participate in real-time gameplay.

**User Experience:**
- Players automatically connect when they open the client application
- Connection status is displayed in the UI (Connected/Disconnected)
- Automatic reconnection attempts every 3 seconds if connection is lost

**Technical Details:**
- Uses WebSocket protocol for bi-directional communication
- Server broadcasts updates to all connected clients
- Each client is assigned a unique ID upon connection

### 2. Player List Display

**Description:** Users can see all currently connected players in a sidebar.

**User Experience:**
- Sidebar shows total number of connected players
- Each player entry displays:
  - Player name (e.g., "Player 1", "Player 2")
  - Player ID
  - Connection timestamp (in local time)
- Current user's entry is highlighted in the list
- Empty state message when no clients are connected

**Technical Details:**
- Player list updates in real-time when players join or leave
- Server broadcasts `clientsUpdate` messages to all clients
- Client-side rendering of player information

### 3. Player Identification

**Description:** Each connected player receives a unique identifier and default name.

**User Experience:**
- Upon connection, players receive a welcome message
- Default player names follow pattern: "Player {ID}"
- Player's own ID is displayed in the connection status area

**Technical Details:**
- Server assigns sequential IDs starting from 1
- IDs are included in welcome messages and client lists
- Client stores their own ID for identification

### 4. Multi-Tab/Multi-Browser Support

**Description:** Multiple browser tabs or different browsers can connect as separate players.

**User Experience:**
- Opening multiple tabs creates multiple player instances
- Each tab operates independently as a separate player
- All tabs receive synchronized updates about connected players

**Technical Details:**
- Each WebSocket connection is treated as a unique client
- No session management or user authentication (yet)
- Server tracks connections via WebSocket instances

## Planned Features

### 5. Puzzle Display and Interaction (Not Yet Implemented)

**Future Description:** Users will be able to view puzzle pieces and interact with them.

**Planned User Experience:**
- Visual display of puzzle pieces on the game board
- Drag and drop functionality for moving pieces
- Snap-to-grid or snap-to-connection behavior
- Visual feedback when pieces are correctly placed

### 6. Collaborative Puzzle Solving (Not Yet Implemented)

**Future Description:** Multiple players can work on the same puzzle simultaneously.

**Planned User Experience:**
- All players see the same puzzle state
- Real-time updates when any player moves a piece
- Visual indicators showing which pieces are being manipulated by which player
- Completion celebration when puzzle is solved

### 7. Puzzle Selection (Not Yet Implemented)

**Future Description:** Users can choose from available puzzles or upload their own images.

**Planned User Experience:**
- Gallery of pre-loaded puzzle images
- Difficulty selection (number of pieces)
- Option to upload custom images
- Puzzle preview before starting

## User Interface

### Current Layout

**Header:**
- Application title: "🧩 Jigsaw Puzzle Multi"
- Tagline: "Collaborate with friends to solve puzzles together in real-time"
- Connection status indicator (Connected/Disconnected)

**Sidebar (Left):**
- "Connected Players" section
- Player count
- List of all connected players with details

**Main Area (Center):**
- Placeholder message: "Puzzle board will appear here"
- Currently shows that puzzle functionality is coming soon

**Styling:**
- Purple gradient background
- White card-based UI elements
- Clean, modern design with rounded corners and shadows
- Responsive layout (adapts to mobile screens)

## Message Protocol

### Client → Server Messages

Currently, the following message types are supported:

1. **updateName** (Implemented but not exposed in UI yet)
   ```json
   {
     "type": "updateName",
     "name": "New Player Name"
   }
   ```

### Server → Client Messages

1. **welcome** - Sent to newly connected client
   ```json
   {
     "type": "welcome",
     "clientId": 1,
     "message": "Welcome, Player 1!"
   }
   ```

2. **clientsUpdate** - Sent to all clients when player list changes
   ```json
   {
     "type": "clientsUpdate",
     "clients": [
       {
         "id": 1,
         "name": "Player 1",
         "connectedAt": "2024-01-01T12:00:00.000Z"
       }
     ]
   }
   ```

## Non-Functional Requirements

### Performance
- Support for at least 4 simultaneous players (tested in integration tests)
- Real-time updates with minimal latency
- Stable WebSocket connections with automatic reconnection

### Compatibility
- Works in modern web browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for desktop and mobile devices
- No authentication required (for development phase)

### Accessibility
- Semantic HTML structure
- Readable fonts and color contrast
- Clear visual feedback for interactive elements

---

**Note:** This specification should be updated whenever new features are added or existing features are modified. Always keep this document synchronized with the actual implementation.
