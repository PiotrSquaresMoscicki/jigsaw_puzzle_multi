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

### 5. Puzzle Display and Interaction

**Description:** Users can view puzzle pieces and interact with them using drag and drop functionality.

**User Experience:**
- 3x3 jigsaw puzzle (9 pieces total) displaying a gradient circle image
- Puzzle pieces are displayed in a horizontally scrollable tray below the game board
- Pieces are randomly shuffled at game start
- Drag and drop functionality for both desktop (mouse) and mobile (touch) devices
- Pieces can only be placed in their correct positions on the puzzle board
- Incorrect placements return pieces to the tray
- Visual feedback: pieces show transform and shadow effects while being dragged
- Completion message displays when all pieces are correctly placed
- Responsive layout adapts to both desktop and mobile viewports

**Technical Details:**
- SVG-based circle image with radial gradient (300x300px total, split into 9 pieces)
- Each piece is 100x100px with `overflow: hidden` to clip content properly
- Image uses CSS `object-fit: none` and `object-position` to display correct portions
- Mouse events (mousedown, mousemove, mouseup) for desktop interaction
- Touch events (touchstart, touchmove, touchend) with `passive: false` for mobile
- Pieces moved to `document.body` with `position: fixed` during drag for smooth movement
- Validation logic ensures pieces snap only to correct grid positions
- Fisher-Yates shuffle algorithm for randomizing piece order
- Local game state - each client has independent puzzle instance

## Planned Features

### 6. Collaborative Puzzle Solving (Not Yet Implemented)

**Future Description:** Multiple players can work on the same puzzle simultaneously.

**Planned User Experience:**
- All players see the same puzzle state
- Real-time updates when any player moves a piece
- Visual indicators showing which pieces are being manipulated by which player
- Completion celebration when puzzle is solved

**Technical Details (Planned):**
- WebSocket message broadcasting for piece movements
- Server-side puzzle state synchronization
- Lock mechanism to prevent multiple players from moving the same piece
- Player cursor indicators on the puzzle board

### 7. Puzzle Selection (Not Yet Implemented)

**Future Description:** Users can choose from available puzzles or upload their own images.

**Planned User Experience:**
- Gallery of pre-loaded puzzle images
- Difficulty selection (number of pieces: 3x3, 4x4, 5x5)
- Option to upload custom images
- Puzzle preview before starting
- Save/resume puzzle progress

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
- 3x3 puzzle board grid (300x300px total)
- Each grid slot is 100x100px with light border
- Puzzle board has dashed border and light gray background
- Below the board: horizontally scrollable pieces tray
- Pieces tray displays all unplaced puzzle pieces
- Visual completion message overlay when puzzle is solved

**Styling:**
- Purple gradient background
- White card-based UI elements
- Clean, modern design with rounded corners and shadows
- Responsive layout (adapts to mobile screens)
- Puzzle pieces have rounded corners and shadow effects during drag
- Smooth transitions for piece movements and interactions

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
- Touch support for mobile devices (iOS Safari, Android Chrome)
- Mouse support for desktop devices
- No authentication required (for development phase)

### Accessibility
- Semantic HTML structure
- Readable fonts and color contrast
- Clear visual feedback for interactive elements
- Touch-friendly UI elements (100x100px minimum touch targets)
- Keyboard navigation support (planned)

---

**Note:** This specification should be updated whenever new features are added or existing features are modified. Always keep this document synchronized with the actual implementation.
