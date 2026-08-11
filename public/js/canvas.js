/* ==========================================================================
   💖 KUCHU-MUCHU COLLABORATIVE DRAWING CANVAS 💖
   ========================================================================== */

export class CanvasController {
    constructor(peerManager, app) {
        this.peerManager = peerManager;
        this.app = app;
        
        this.canvas = document.getElementById('shared-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Drawing State
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#e91e63'; // Love pink default
        this.currentSize = 4;           // Medium stroke size default
        this.sizes = { 'S': 2, 'M': 4, 'L': 8 };
        this.sizeLabels = ['S', 'M', 'L'];
        this.currentSizeIdx = 1; // 'M'
        
        this.initDOM();
        this.resizeCanvas();
        this.bindEvents();
        
        // Listen for window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    initDOM() {
        this.colorButtons = document.querySelectorAll('.color-btn');
        this.brushSizeBtn = document.getElementById('brush-size-btn');
        this.brushSizeVal = document.getElementById('brush-size-val');
        this.clearCanvasBtn = document.getElementById('clear-canvas-btn');
    }

    bindEvents() {
        // Color Selection
        this.colorButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.colorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentColor = btn.getAttribute('data-color');
            });
        });

        // Brush Size Toggle
        this.brushSizeBtn.addEventListener('click', () => {
            this.currentSizeIdx = (this.currentSizeIdx + 1) % this.sizeLabels.length;
            const label = this.sizeLabels[this.currentSizeIdx];
            this.brushSizeVal.textContent = label;
            this.currentSize = this.sizes[label];
        });

        // Clear Canvas
        this.clearCanvasBtn.addEventListener('click', () => {
            this.clearLocalCanvas();
            this.peerManager.sendData({ type: 'doodle', action: 'clear' });
        });

        // Desktop Mouse Events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e.offsetX, e.offsetY));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e.offsetX, e.offsetY));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Mobile Touch Events (with event prevention to avoid scrolling while drawing)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const pos = this.getTouchPos(e);
            this.startDrawing(pos.x, pos.y);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const pos = this.getTouchPos(e);
            this.draw(pos.x, pos.y);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
    }

    /**
     * Resizes canvas buffer size to match bounding box CSS client size,
     * maintaining drawn paths by caching them temporarily.
     */
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        
        // Cache existing content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Resize
        const size = Math.min(rect.width, rect.height, 400);
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Restore styling variables
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Redraw cached content scaled to fit the new size
        this.ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, this.canvas.width, this.canvas.height);
    }

    getTouchPos(touchEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = touchEvent.touches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    startDrawing(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
    }

    draw(x, y) {
        if (!this.isDrawing) return;

        // Draw locally
        this.drawLine(this.lastX, this.lastY, x, y, this.currentColor, this.currentSize);

        // Normalize coordinates relative to width/height to support different partner screen dimensions
        const normalized = {
            type: 'doodle',
            action: 'draw',
            x: x / this.canvas.width,
            y: y / this.canvas.height,
            lastX: this.lastX / this.canvas.width,
            lastY: this.lastY / this.canvas.height,
            color: this.currentColor,
            size: this.currentSize
        };

        // Broadcast to partner
        this.peerManager.sendData(normalized);

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    drawLine(x1, y1, x2, y2, color, size) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    clearLocalCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Network sync receiver
     */
    handleIncomingDoodle(packet) {
        if (packet.action === 'clear') {
            this.clearLocalCanvas();
            this.app.showToast("Partner cleared the canvas.", "info");
        } else if (packet.action === 'draw') {
            // De-normalize coordinates
            const x1 = packet.lastX * this.canvas.width;
            const y1 = packet.lastY * this.canvas.height;
            const x2 = packet.x * this.canvas.width;
            const y2 = packet.y * this.canvas.height;

            this.drawLine(x1, y1, x2, y2, packet.color, packet.size);
        }
    }
}
