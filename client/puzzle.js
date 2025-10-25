// Puzzle Game Logic with Snapping
class PuzzleGame {
    constructor(config = {}) {
        this.complexityLevel = config.complexityLevel || 3;
        this.customImageUrl = config.customImageUrl || null;
        this.customImageWidth = config.customImageWidth || 300;
        this.customImageHeight = config.customImageHeight || 300;
        
        // Calculate grid dimensions based on complexity and aspect ratio
        this.calculateGridDimensions();
        
        this.pieceSize = 100; // pixels
        this.snapThreshold = 20; // Distance threshold for snapping in pixels
        this.pieces = [];
        this.pieceGroups = []; // Array of piece groups (snapped together pieces)
        this.draggedGroup = null; // The group being dragged
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
        
        // Clear the puzzle grid (no slots needed)
        const grid = document.getElementById('puzzle-grid');
        grid.innerHTML = '';
        
        // Create puzzle pieces
        this.createPuzzlePieces();
        
        // Shuffle pieces in tray
        this.shufflePieces();
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

    createPuzzlePieces() {
        const container = document.getElementById('pieces-container');
        container.innerHTML = '';
        this.pieces = [];
        this.pieceGroups = [];
        
        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const piece = document.createElement('div');
                piece.className = 'puzzle-piece in-tray';
                piece.dataset.correctRow = row;
                piece.dataset.correctCol = col;
                piece.dataset.inTray = 'true';
                
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
                
                // Each piece starts in its own group
                this.pieceGroups.push({
                    pieces: [piece],
                    x: 0, // Will be set when placed on board
                    y: 0
                });
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

    // Find the group containing a piece
    findGroupForPiece(piece) {
        return this.pieceGroups.find(group => group.pieces.includes(piece));
    }

    // Mouse drag handlers (desktop)
    onDragStart(e, piece) {
        e.preventDefault();
        
        // Find the group this piece belongs to
        this.draggedGroup = this.findGroupForPiece(piece);
        if (!this.draggedGroup) return;
        
        // If piece is in tray, get it from tray first
        if (piece.dataset.inTray === 'true') {
            const grid = document.getElementById('puzzle-grid');
            const gridRect = grid.getBoundingClientRect();
            
            // Place piece in center of grid initially
            piece.dataset.inTray = 'false';
            piece.classList.remove('in-tray');
            grid.appendChild(piece);
            
            // Set initial position (center of grid)
            this.draggedGroup.x = gridRect.width / 2 - this.pieceSize / 2;
            this.draggedGroup.y = gridRect.height / 2 - this.pieceSize / 2;
            
            // Apply the position immediately
            this.updateGroupPositions(this.draggedGroup);
        }
        
        // Add dragging class to all pieces in group
        this.draggedGroup.pieces.forEach(p => p.classList.add('dragging'));
        
        // Calculate offset from first piece in group
        const firstPiece = this.draggedGroup.pieces[0];
        const rect = firstPiece.getBoundingClientRect();
        this.touchOffsetX = e.clientX - rect.left;
        this.touchOffsetY = e.clientY - rect.top;
        
        this.movePieceGroup(e.clientX, e.clientY);
        
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    onMouseMove = (e) => {
        if (!this.draggedGroup) return;
        this.movePieceGroup(e.clientX, e.clientY);
    }

    onMouseUp = (e) => {
        if (!this.draggedGroup) return;
        
        this.handleDrop(e.clientX, e.clientY);
        
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    // Touch handlers (mobile)
    onTouchStart(e, piece) {
        e.preventDefault();
        
        // Find the group this piece belongs to
        this.draggedGroup = this.findGroupForPiece(piece);
        if (!this.draggedGroup) return;
        
        const touch = e.touches[0];
        
        // If piece is in tray, get it from tray first
        if (piece.dataset.inTray === 'true') {
            const grid = document.getElementById('puzzle-grid');
            const gridRect = grid.getBoundingClientRect();
            
            // Place piece in center of grid initially
            piece.dataset.inTray = 'false';
            piece.classList.remove('in-tray');
            grid.appendChild(piece);
            
            // Set initial position (center of grid)
            this.draggedGroup.x = gridRect.width / 2 - this.pieceSize / 2;
            this.draggedGroup.y = gridRect.height / 2 - this.pieceSize / 2;
            
            // Apply the position immediately
            this.updateGroupPositions(this.draggedGroup);
        }
        
        // Add dragging class to all pieces in group
        this.draggedGroup.pieces.forEach(p => p.classList.add('dragging'));
        
        // Calculate offset from first piece in group
        const firstPiece = this.draggedGroup.pieces[0];
        const rect = firstPiece.getBoundingClientRect();
        this.touchOffsetX = touch.clientX - rect.left;
        this.touchOffsetY = touch.clientY - rect.top;
        
        this.movePieceGroup(touch.clientX, touch.clientY);
        
        // Attach to first piece only
        firstPiece.addEventListener('touchmove', this.onTouchMove, { passive: false });
        firstPiece.addEventListener('touchend', this.onTouchEnd, { passive: false });
    }

    onTouchMove = (e) => {
        if (!this.draggedGroup) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.movePieceGroup(touch.clientX, touch.clientY);
    }

    onTouchEnd = (e) => {
        if (!this.draggedGroup) return;
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        this.handleDrop(touch.clientX, touch.clientY);
        
        const firstPiece = this.draggedGroup.pieces[0];
        firstPiece.removeEventListener('touchmove', this.onTouchMove);
        firstPiece.removeEventListener('touchend', this.onTouchEnd);
    }

    movePieceGroup(clientX, clientY) {
        if (!this.draggedGroup) return;
        
        const grid = document.getElementById('puzzle-grid');
        const gridRect = grid.getBoundingClientRect();
        
        // Calculate new position relative to grid
        const newX = clientX - gridRect.left - this.touchOffsetX;
        const newY = clientY - gridRect.top - this.touchOffsetY;
        
        this.draggedGroup.x = newX;
        this.draggedGroup.y = newY;
        
        // Update position of all pieces in group
        this.updateGroupPositions(this.draggedGroup);
    }

    updateGroupPositions(group) {
        // Calculate the offset from the first piece's correct position
        const firstPiece = group.pieces[0];
        const firstRow = parseInt(firstPiece.dataset.correctRow);
        const firstCol = parseInt(firstPiece.dataset.correctCol);
        
        // Position each piece in the group relative to the group's position
        group.pieces.forEach(piece => {
            const row = parseInt(piece.dataset.correctRow);
            const col = parseInt(piece.dataset.correctCol);
            
            // Calculate offset from first piece
            const offsetX = (col - firstCol) * this.pieceSize;
            const offsetY = (row - firstRow) * this.pieceSize;
            
            piece.style.left = (group.x + offsetX) + 'px';
            piece.style.top = (group.y + offsetY) + 'px';
        });
    }

    handleDrop(clientX, clientY) {
        if (!this.draggedGroup) return;
        
        // Remove dragging class from all pieces
        this.draggedGroup.pieces.forEach(p => p.classList.remove('dragging'));
        
        // Check if we can snap to any adjacent piece
        const snappedGroup = this.checkForSnapping(this.draggedGroup);
        
        if (snappedGroup) {
            // Merged into another group
            this.draggedGroup = null;
            this.checkCompletion();
            return;
        }
        
        this.draggedGroup = null;
        this.checkCompletion();
    }

    checkForSnapping(draggedGroup) {
        const snapThreshold = this.snapThreshold;
        
        // For each piece in the dragged group
        for (const draggedPiece of draggedGroup.pieces) {
            const draggedRow = parseInt(draggedPiece.dataset.correctRow);
            const draggedCol = parseInt(draggedPiece.dataset.correctCol);
            
            // Check all adjacent positions (up, down, left, right)
            const adjacentPositions = [
                { row: draggedRow - 1, col: draggedCol, direction: 'top' },
                { row: draggedRow + 1, col: draggedCol, direction: 'bottom' },
                { row: draggedRow, col: draggedCol - 1, direction: 'left' },
                { row: draggedRow, col: draggedCol + 1, direction: 'right' }
            ];
            
            for (const adjPos of adjacentPositions) {
                // Find piece at this adjacent position
                const adjacentPiece = this.pieces.find(p => 
                    parseInt(p.dataset.correctRow) === adjPos.row &&
                    parseInt(p.dataset.correctCol) === adjPos.col
                );
                
                if (!adjacentPiece || adjacentPiece.dataset.inTray === 'true') continue;
                
                // Find the group of the adjacent piece
                const adjacentGroup = this.findGroupForPiece(adjacentPiece);
                if (!adjacentGroup || adjacentGroup === draggedGroup) continue;
                
                // Calculate expected position if snapped
                const expectedOffset = this.getExpectedOffset(adjPos.direction);
                const draggedRect = draggedPiece.getBoundingClientRect();
                const adjacentRect = adjacentPiece.getBoundingClientRect();
                
                // Calculate actual offset
                const actualOffsetX = draggedRect.left - adjacentRect.left;
                const actualOffsetY = draggedRect.top - adjacentRect.top;
                
                // Check if within snap threshold
                const distX = Math.abs(actualOffsetX - expectedOffset.x);
                const distY = Math.abs(actualOffsetY - expectedOffset.y);
                
                if (distX < snapThreshold && distY < snapThreshold) {
                    // Snap! Merge the groups
                    this.mergeGroups(draggedGroup, adjacentGroup, draggedPiece, adjacentPiece, adjPos.direction);
                    return adjacentGroup; // Return the merged group
                }
            }
        }
        
        return null; // No snap occurred
    }

    getExpectedOffset(direction) {
        switch (direction) {
            case 'top':
                return { x: 0, y: -this.pieceSize };
            case 'bottom':
                return { x: 0, y: this.pieceSize };
            case 'left':
                return { x: -this.pieceSize, y: 0 };
            case 'right':
                return { x: this.pieceSize, y: 0 };
            default:
                return { x: 0, y: 0 };
        }
    }

    mergeGroups(draggedGroup, targetGroup, draggedPiece, targetPiece, direction) {
        // Calculate the offset needed to align the pieces
        const draggedRow = parseInt(draggedPiece.dataset.correctRow);
        const draggedCol = parseInt(draggedPiece.dataset.correctCol);
        const targetRow = parseInt(targetPiece.dataset.correctRow);
        const targetCol = parseInt(targetPiece.dataset.correctCol);
        
        // Calculate the offset from targetGroup's anchor to draggedGroup's anchor
        const rowDiff = draggedRow - targetRow;
        const colDiff = draggedCol - targetCol;
        
        // The draggedGroup needs to be positioned relative to targetGroup
        // such that draggedPiece aligns with targetPiece
        const targetFirstRow = parseInt(targetGroup.pieces[0].dataset.correctRow);
        const targetFirstCol = parseInt(targetGroup.pieces[0].dataset.correctCol);
        const draggedFirstRow = parseInt(draggedGroup.pieces[0].dataset.correctRow);
        const draggedFirstCol = parseInt(draggedGroup.pieces[0].dataset.correctCol);
        
        // Offset of the dragged group relative to target group
        const mergeOffsetX = (targetFirstCol - draggedFirstCol + colDiff) * this.pieceSize;
        const mergeOffsetY = (targetFirstRow - draggedFirstRow + rowDiff) * this.pieceSize;
        
        // Merge pieces into target group
        draggedGroup.pieces.forEach(piece => {
            targetGroup.pieces.push(piece);
        });
        
        // Update target group's position to accommodate all pieces
        // The anchor remains the first piece, so we adjust draggedGroup pieces to align
        targetGroup.x = targetGroup.x;
        targetGroup.y = targetGroup.y;
        
        // Recalculate to use target group's first piece as anchor
        const newAnchorRow = targetFirstRow;
        const newAnchorCol = targetFirstCol;
        
        // Update positions of all pieces
        targetGroup.pieces.forEach(piece => {
            const row = parseInt(piece.dataset.correctRow);
            const col = parseInt(piece.dataset.correctCol);
            
            const offsetX = (col - newAnchorCol) * this.pieceSize;
            const offsetY = (row - newAnchorRow) * this.pieceSize;
            
            piece.style.left = (targetGroup.x + offsetX) + 'px';
            piece.style.top = (targetGroup.y + offsetY) + 'px';
        });
        
        // Remove the dragged group from pieceGroups
        const index = this.pieceGroups.indexOf(draggedGroup);
        if (index > -1) {
            this.pieceGroups.splice(index, 1);
        }
    }

    checkCompletion() {
        // Check if all pieces are in one group
        if (this.pieceGroups.length === 1) {
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
