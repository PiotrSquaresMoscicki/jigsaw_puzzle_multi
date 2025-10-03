// Puzzle Game Logic
class PuzzleGame {
    constructor(config = {}) {
        this.complexityLevel = config.complexityLevel || 3;
        this.customImageUrl = config.customImageUrl || null;
        this.customImageWidth = config.customImageWidth || 300;
        this.customImageHeight = config.customImageHeight || 300;
        
        // Calculate grid dimensions based on complexity and aspect ratio
        this.calculateGridDimensions();
        
        this.pieceSize = 100; // pixels
        this.pieces = [];
        this.slots = [];
        this.draggedPiece = null;
        this.touchOffsetX = 0;
        this.touchOffsetY = 0;
        
        this.init();
    }

    calculateGridDimensions() {
        // If we have a custom image, use its dimensions
        if (this.customImageUrl) {
            const aspectRatio = this.customImageWidth / this.customImageHeight;
            
            if (aspectRatio >= 1) {
                // Landscape or square: shorter edge is height
                this.gridRows = this.complexityLevel;
                this.gridCols = Math.round(this.complexityLevel * aspectRatio);
            } else {
                // Portrait: shorter edge is width
                this.gridCols = this.complexityLevel;
                this.gridRows = Math.round(this.complexityLevel / aspectRatio);
            }
        } else {
            // Default SVG is square
            this.gridRows = this.complexityLevel;
            this.gridCols = this.complexityLevel;
        }
        
        this.gridSize = this.gridRows; // Keep for backward compatibility
    }

    init() {
        // Generate the image (either default circle or custom)
        if (this.customImageUrl) {
            this.imageDataUrl = this.customImageUrl;
        } else {
            this.generateCircleImage();
        }
        
        // Update puzzle grid CSS
        this.updatePuzzleGridCSS();
        
        // Create puzzle slots
        this.createPuzzleSlots();
        
        // Create puzzle pieces
        this.createPuzzlePieces();
        
        // Shuffle pieces
        this.shufflePieces();
    }

    updatePuzzleGridCSS() {
        const grid = document.getElementById('puzzle-grid');
        grid.style.gridTemplateColumns = `repeat(${this.gridCols}, ${this.pieceSize}px)`;
        grid.style.gridTemplateRows = `repeat(${this.gridRows}, ${this.pieceSize}px)`;
    }

    generateCircleImage() {
        // Create an SVG circle image divided into the grid
        const totalWidth = this.pieceSize * this.gridCols;
        const totalHeight = this.pieceSize * this.gridRows;
        const svg = `
            <svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="circleGradient">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </radialGradient>
                </defs>
                <circle cx="${totalWidth/2}" cy="${totalHeight/2}" r="${Math.min(totalWidth, totalHeight)/2 - 10}" 
                        fill="url(#circleGradient)" stroke="#333" stroke-width="3"/>
            </svg>
        `;
        this.imageDataUrl = 'data:image/svg+xml;base64,' + btoa(svg);
    }

    createPuzzleSlots() {
        const grid = document.getElementById('puzzle-grid');
        grid.innerHTML = '';
        this.slots = [];
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
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
        this.pieces = [];
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.dataset.correctRow = row;
                piece.dataset.correctCol = col;
                piece.dataset.placed = 'false';
                
                const img = document.createElement('img');
                img.src = this.imageDataUrl;
                img.style.objectFit = 'none';
                img.style.objectPosition = `-${col * this.pieceSize}px -${row * this.pieceSize}px`;
                img.style.width = `${this.pieceSize * this.gridCols}px`;
                img.style.height = `${this.pieceSize * this.gridRows}px`;
                
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
        piece.style.width = this.pieceSize + 'px';
        piece.style.height = this.pieceSize + 'px';
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
        piece.style.width = this.pieceSize + 'px';
        piece.style.height = this.pieceSize + 'px';
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
        piece.style.width = '';
        piece.style.height = '';
        
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
        piece.style.width = '';
        piece.style.height = '';
        
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

// Global game instance
let currentGame = null;

// Initialize the puzzle game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    currentGame = new PuzzleGame();
    
    // Set up new game modal controls
    const newGameBtn = document.getElementById('new-game-btn');
    const settingsModal = document.getElementById('settings-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const complexitySlider = document.getElementById('complexity-slider');
    const complexityValue = document.getElementById('complexity-value');
    
    let selectedImageUrl = null;
    let selectedImageWidth = 300;
    let selectedImageHeight = 300;
    
    // Update complexity display
    complexitySlider.addEventListener('input', (e) => {
        complexityValue.textContent = e.target.value;
    });
    
    // Handle image upload
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    selectedImageUrl = event.target.result;
                    selectedImageWidth = img.width;
                    selectedImageHeight = img.height;
                    imagePreview.src = event.target.result;
                    imagePreview.classList.add('visible');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            selectedImageUrl = null;
            imagePreview.classList.remove('visible');
        }
    });
    
    // Show modal
    newGameBtn.addEventListener('click', () => {
        // Reset form to defaults
        imageUpload.value = '';
        imagePreview.classList.remove('visible');
        complexitySlider.value = 3;
        complexityValue.textContent = '3';
        selectedImageUrl = null;
        selectedImageWidth = 300;
        selectedImageHeight = 300;
        
        settingsModal.classList.add('active');
    });
    
    // Hide modal
    cancelBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    
    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
    
    // Start new game
    startGameBtn.addEventListener('click', () => {
        const complexity = parseInt(complexitySlider.value);
        
        const config = {
            complexityLevel: complexity,
            customImageUrl: selectedImageUrl,
            customImageWidth: selectedImageWidth,
            customImageHeight: selectedImageHeight
        };
        
        // Create new game instance
        currentGame = new PuzzleGame(config);
        
        // Hide modal
        settingsModal.classList.remove('active');
    });
});
