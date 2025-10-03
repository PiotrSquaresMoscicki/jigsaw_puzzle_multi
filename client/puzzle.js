// Puzzle Game Logic
class PuzzleGame {
    constructor() {
        this.gridSize = 3; // 3x3 puzzle
        this.pieceSize = 100; // pixels
        this.pieces = [];
        this.slots = [];
        this.draggedPiece = null;
        this.touchOffsetX = 0;
        this.touchOffsetY = 0;
        
        this.init();
    }

    init() {
        // Generate the circle image as SVG
        this.generateCircleImage();
        
        // Create puzzle slots
        this.createPuzzleSlots();
        
        // Create puzzle pieces
        this.createPuzzlePieces();
        
        // Shuffle pieces
        this.shufflePieces();
    }

    generateCircleImage() {
        // Create an SVG circle image divided into a 3x3 grid
        const totalSize = this.pieceSize * this.gridSize;
        const svg = `
            <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="circleGradient">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </radialGradient>
                </defs>
                <circle cx="${totalSize/2}" cy="${totalSize/2}" r="${totalSize/2 - 10}" 
                        fill="url(#circleGradient)" stroke="#333" stroke-width="3"/>
            </svg>
        `;
        this.imageDataUrl = 'data:image/svg+xml;base64,' + btoa(svg);
    }

    createPuzzleSlots() {
        const grid = document.getElementById('puzzle-grid');
        grid.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const slot = document.createElement('div');
                slot.className = 'puzzle-slot';
                slot.dataset.row = row;
                slot.dataset.col = col;
                slot.dataset.filled = 'false';
                grid.appendChild(slot);
                this.slots.push(slot);
            }
        }
    }

    createPuzzlePieces() {
        const container = document.getElementById('pieces-container');
        container.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.dataset.correctRow = row;
                piece.dataset.correctCol = col;
                piece.dataset.placed = 'false';
                
                const img = document.createElement('img');
                img.src = this.imageDataUrl;
                img.style.objectFit = 'none';
                img.style.objectPosition = `-${col * this.pieceSize}px -${row * this.pieceSize}px`;
                img.style.width = `${this.pieceSize * this.gridSize}px`;
                img.style.height = `${this.pieceSize * this.gridSize}px`;
                
                piece.appendChild(img);
                
                // Add event listeners for drag and drop (desktop)
                piece.addEventListener('mousedown', (e) => this.onDragStart(e, piece));
                
                // Add event listeners for touch (mobile)
                piece.addEventListener('touchstart', (e) => this.onTouchStart(e, piece), { passive: false });
                
                container.appendChild(piece);
                this.pieces.push(piece);
            }
        }
    }

    shufflePieces() {
        const container = document.getElementById('pieces-container');
        const pieces = Array.from(container.children);
        
        // Fisher-Yates shuffle
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            container.appendChild(pieces[j]);
        }
    }

    // Mouse drag handlers (desktop)
    onDragStart(e, piece) {
        if (piece.dataset.placed === 'true') return;
        
        e.preventDefault();
        this.draggedPiece = piece;
        piece.classList.add('dragging');
        
        // Calculate offset
        const rect = piece.getBoundingClientRect();
        this.touchOffsetX = e.clientX - rect.left;
        this.touchOffsetY = e.clientY - rect.top;
        
        // Store original parent
        this.originalParent = piece.parentElement;
        
        // Move to body for absolute positioning
        document.body.appendChild(piece);
        piece.style.position = 'fixed';
        piece.style.zIndex = '1000';
        this.movePiece(e.clientX, e.clientY);
        
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseMove = (e) => {
        if (!this.draggedPiece) return;
        this.movePiece(e.clientX, e.clientY);
    }

    onMouseUp = (e) => {
        if (!this.draggedPiece) return;
        
        this.handleDrop(e.clientX, e.clientY);
        
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    // Touch handlers (mobile)
    onTouchStart(e, piece) {
        if (piece.dataset.placed === 'true') return;
        
        e.preventDefault();
        this.draggedPiece = piece;
        piece.classList.add('dragging');
        
        const touch = e.touches[0];
        const rect = piece.getBoundingClientRect();
        this.touchOffsetX = touch.clientX - rect.left;
        this.touchOffsetY = touch.clientY - rect.top;
        
        // Store original parent
        this.originalParent = piece.parentElement;
        
        // Move to body for absolute positioning
        document.body.appendChild(piece);
        piece.style.position = 'fixed';
        piece.style.zIndex = '1000';
        this.movePiece(touch.clientX, touch.clientY);
        
        piece.addEventListener('touchmove', this.onTouchMove, { passive: false });
        piece.addEventListener('touchend', this.onTouchEnd, { passive: false });
    }

    onTouchMove = (e) => {
        if (!this.draggedPiece) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.movePiece(touch.clientX, touch.clientY);
    }

    onTouchEnd = (e) => {
        if (!this.draggedPiece) return;
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        this.handleDrop(touch.clientX, touch.clientY);
        
        this.draggedPiece.removeEventListener('touchmove', this.onTouchMove);
        this.draggedPiece.removeEventListener('touchend', this.onTouchEnd);
    }

    movePiece(clientX, clientY) {
        if (!this.draggedPiece) return;
        
        this.draggedPiece.style.left = (clientX - this.touchOffsetX) + 'px';
        this.draggedPiece.style.top = (clientY - this.touchOffsetY) + 'px';
    }

    handleDrop(clientX, clientY) {
        if (!this.draggedPiece) return;
        
        const piece = this.draggedPiece;
        piece.classList.remove('dragging');
        
        // Find the slot under the cursor
        const slot = this.findSlotAtPosition(clientX, clientY);
        
        if (slot && slot.dataset.filled === 'false') {
            // Check if this is the correct position
            const correctRow = parseInt(piece.dataset.correctRow);
            const correctCol = parseInt(piece.dataset.correctCol);
            const slotRow = parseInt(slot.dataset.row);
            const slotCol = parseInt(slot.dataset.col);
            
            if (correctRow === slotRow && correctCol === slotCol) {
                // Correct placement
                this.placePieceInSlot(piece, slot);
                this.checkCompletion();
            } else {
                // Wrong placement - return to tray
                this.returnPieceToTray(piece);
            }
        } else {
            // No valid slot - return to tray
            this.returnPieceToTray(piece);
        }
        
        this.draggedPiece = null;
    }

    findSlotAtPosition(x, y) {
        for (const slot of this.slots) {
            const rect = slot.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return slot;
            }
        }
        return null;
    }

    placePieceInSlot(piece, slot) {
        // Reset piece styling
        piece.style.position = 'relative';
        piece.style.left = '0';
        piece.style.top = '0';
        piece.style.zIndex = 'auto';
        
        // Mark as placed
        piece.dataset.placed = 'true';
        piece.classList.add('placed');
        slot.dataset.filled = 'true';
        
        // Move piece to slot
        slot.appendChild(piece);
    }

    returnPieceToTray(piece) {
        // Reset piece styling
        piece.style.position = 'relative';
        piece.style.left = '0';
        piece.style.top = '0';
        piece.style.zIndex = 'auto';
        
        // Return to original parent or pieces container
        if (this.originalParent && this.originalParent.id === 'pieces-container') {
            this.originalParent.appendChild(piece);
        } else {
            document.getElementById('pieces-container').appendChild(piece);
        }
    }

    checkCompletion() {
        // Check if all pieces are placed
        const allPlaced = this.pieces.every(piece => piece.dataset.placed === 'true');
        
        if (allPlaced) {
            this.showCompletionMessage();
        }
    }

    showCompletionMessage() {
        const board = document.getElementById('puzzle-board');
        const message = document.createElement('div');
        message.className = 'completion-message';
        message.textContent = '🎉 Puzzle Complete! 🎉';
        board.appendChild(message);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Initialize the puzzle game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PuzzleGame();
});
