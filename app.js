/* ==========================================================================
   💖 KUCHU-MUCHU MAIN APPLICATION ORCHESTRATOR 💖
   ========================================================================== */

import { PeerManager } from './peer-manager.js';
import { GameController } from './game.js';
import { CanvasController } from './canvas.js';

class App {
    constructor() {
        this.peerManager = new PeerManager();
        this.gameController = null;
        this.canvasController = null;

        // UI State
        this.isHost = false;
        this.roomCode = null;
        this.timerInterval = null;
        this.secondsTogether = 0;
        
        // Media state
        this.micEnabled = true;
        this.camEnabled = true;

        this.initDOM();
        this.bindEvents();
        this.setupPreflightPreview();
        this.startFloatingHearts();
    }

    initDOM() {
        // Screens
        this.landingScreen = document.getElementById('landing-screen');
        this.callScreen = document.getElementById('call-screen');
        this.appControls = document.getElementById('app-controls');
        
        // Buttons & Inputs
        this.createRoomBtn = document.getElementById('create-room-btn');
        this.roomCodeDisplayContainer = document.getElementById('room-code-display-container');
        this.generatedCodeSpan = document.getElementById('generated-code');
        this.copyCodeBtn = document.getElementById('copy-code-btn');
        
        this.joinRoomInput = document.getElementById('join-room-input');
        this.joinRoomBtn = document.getElementById('join-room-btn');
        
        // Preflight Controls
        this.previewVideo = document.getElementById('preview-video');
        this.previewMicBtn = document.getElementById('preview-mic-btn');
        this.previewCamBtn = document.getElementById('preview-cam-btn');
        this.previewStatus = document.getElementById('preview-status');
        
        // Active Call Video Grid
        this.videoGrid = document.getElementById('video-grid');
        this.localVideo = document.getElementById('local-video');
        this.remoteVideo = document.getElementById('remote-video');
        this.localVideoWrapper = document.getElementById('local-video-wrapper');
        this.partnerVideoWrapper = document.getElementById('partner-video-wrapper');
        
        // Call Controls
        this.micToggleBtn = document.getElementById('mic-toggle-btn');
        this.camToggleBtn = document.getElementById('cam-toggle-btn');
        this.hangupBtn = document.getElementById('hangup-btn');
        this.layoutToggleBtn = document.getElementById('layout-toggle-btn');
        this.framePickerBtn = document.getElementById('frame-picker-btn');
        this.frameMenu = document.getElementById('frame-menu');
        this.drawerToggleBtn = document.getElementById('drawer-toggle-btn');
        
        // Status Indicators
        this.localMicStatus = document.getElementById('local-mic-status');
        this.localCamStatus = document.getElementById('local-cam-status');
        this.remoteMicStatus = document.getElementById('remote-mic-status');
        this.remoteCamStatus = document.getElementById('remote-cam-status');
        
        // Timer elements
        this.togetherTimerContainer = document.getElementById('together-timer-container');
        this.timerDisplay = document.getElementById('timer-display');
        this.milestoneBadge = document.getElementById('milestone-badge');
        
        // Panels / Tabs / Drawers
        this.featuresDrawer = document.getElementById('features-drawer');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Toast
        this.toastContainer = document.getElementById('toast-container');
        
        // Theme Toggle
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');

        // Overlay Space for Heartbeat Flash / Floating Emojis
        this.interactionOverlay = document.getElementById('interaction-overlay');
        this.giftOverlay = document.getElementById('gift-overlay');
        
        // Feature Elements
        this.sendHeartbeatBtn = document.getElementById('send-heartbeat-btn');
        this.giftButtons = document.querySelectorAll('.gift-btn-item');
        this.loveLetterInput = document.getElementById('love-letter-input');
        this.sendLetterBtn = document.getElementById('send-letter-btn');
        this.lettersList = document.getElementById('letters-list');
        this.letterCountSpan = document.getElementById('letter-count');
        this.soundEffectButtons = document.querySelectorAll('.sound-effect-btn');
        this.playAmbienceButtons = document.querySelectorAll('.play-ambience-btn');
    }

    bindEvents() {
        // Theme Switcher
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Preflight preview controls
        this.previewMicBtn.addEventListener('click', () => this.togglePreflightMic());
        this.previewCamBtn.addEventListener('click', () => this.togglePreflightCam());

        // Host a room
        this.createRoomBtn.addEventListener('click', () => this.handleHostNest());
        this.copyCodeBtn.addEventListener('click', () => this.copyNestCodeToClipboard());

        // Join a room
        this.joinRoomBtn.addEventListener('click', () => this.handleJoinNest());
        this.joinRoomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoinNest();
        });

        // Call Screen buttons
        this.micToggleBtn.addEventListener('click', () => this.toggleMic());
        this.camToggleBtn.addEventListener('click', () => this.toggleCam());
        this.hangupBtn.addEventListener('click', () => this.confirmHangup());
        this.drawerToggleBtn.addEventListener('click', () => this.toggleFeaturesDrawer());

        // Layout settings
        this.layoutToggleBtn.addEventListener('click', () => this.toggleVideoLayout());

        // Frames picker menu toggle
        this.framePickerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.frameMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => this.frameMenu.classList.remove('show'));

        // Frames selection click
        const frameOptions = document.querySelectorAll('.frame-option');
        frameOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                const frameClass = opt.getAttribute('data-frame');
                this.applyVideoFrame(frameClass);
            });
        });

        // Tab Switching in Drawer
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Heartbeat Trigger
        this.sendHeartbeatBtn.addEventListener('click', () => this.sendHeartbeatPulse());

        // Emoji Floating Reaction Click
        const reactionButtons = document.querySelectorAll('.reaction-btn');
        reactionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                this.sendReaction(emoji);
            });
        });

        // Gift triggers
        this.giftButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const giftType = btn.getAttribute('data-gift');
                this.sendGift(giftType);
            });
        });

        // Love letters trigger
        this.sendLetterBtn.addEventListener('click', () => this.sendLoveLetter());

        // Soundboard triggers
        this.soundEffectButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const soundId = btn.getAttribute('data-sound');
                this.sendSoundboardEffect(soundId);
            });
        });

        // Cozy ambient loopers
        this.playAmbienceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const track = btn.getAttribute('data-track');
                this.toggleAmbienceTrack(track, btn);
            });
        });

        // Wire PeerManager callbacks
        this.peerManager.onIncomingCall = (call) => this.handleIncomingMediaCall(call);
        this.peerManager.onConnected = () => this.handleConnectedState();
        this.peerManager.onDisconnected = () => this.handleDisconnectedState();
        this.peerManager.onRemoteStream = (stream) => this.handleRemoteStream(stream);
        this.peerManager.onDataReceived = (data) => this.handleNetworkPacket(data);
    }

    // ==========================================================================
    // PRE-FLIGHT & MEDIA UTILITIES
    // ==========================================================================
    async setupPreflightPreview() {
        try {
            const stream = await this.peerManager.getLocalMedia(this.camEnabled, this.micEnabled);
            this.previewVideo.srcObject = stream;
            this.previewStatus.textContent = "Camera and microphone ready!";
        } catch (err) {
            console.error("Preflight setup failed:", err);
            this.previewStatus.textContent = "Permission denied. Please grant camera/mic access.";
            this.previewStatus.style.color = "#f44336";
        }
    }

    startFloatingHearts() {
        const bg = document.getElementById('hearts-bg');
        if (!bg) return;

        const heartEmojis = ['💖', '❤️', '💕', '💗', '💘', '🌸', '✨'];
        
        setInterval(() => {
            if (bg.children.length > 30) {
                bg.removeChild(bg.firstChild);
            }

            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
            
            const left = Math.random() * 100;
            const size = Math.random() * 20 + 15;
            const duration = Math.random() * 5 + 6;
            const opacity = Math.random() * 0.4 + 0.4;
            
            heart.style.left = `${left}%`;
            heart.style.fontSize = `${size}px`;
            heart.style.animationDuration = `${duration}s`;
            heart.style.opacity = opacity;
            
            bg.appendChild(heart);
            
            setTimeout(() => {
                heart.remove();
            }, duration * 1000);
        }, 1200);
    }

    togglePreflightMic() {
        this.micEnabled = !this.micEnabled;
        this.previewMicBtn.classList.toggle('muted', !this.micEnabled);
        this.previewMicBtn.querySelector('i').className = this.micEnabled ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
        
        // Update active stream if exists
        if (this.peerManager.localStream) {
            const audioTrack = this.peerManager.localStream.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = this.micEnabled;
        }
    }

    togglePreflightCam() {
        this.camEnabled = !this.camEnabled;
        this.previewCamBtn.classList.toggle('muted', !this.camEnabled);
        this.previewCamBtn.querySelector('i').className = this.camEnabled ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
        
        if (this.peerManager.localStream) {
            const videoTrack = this.peerManager.localStream.getVideoTracks()[0];
            if (videoTrack) videoTrack.enabled = this.camEnabled;
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', nextTheme);
        this.themeToggleBtn.querySelector('i').className = nextTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        this.showToast(`Switched to ${nextTheme === 'dark' ? 'Candlelight' : 'Rose Petal'} theme!`, "info");
    }

    // ==========================================================================
    // ROOM LIFE CYCLE (HOST / JOIN)
    // ==========================================================================
    async handleHostNest() {
        this.createRoomBtn.disabled = true;
        this.createRoomBtn.innerHTML = `<i class="fa-solid fa-heart-pulse pulsing"></i> Creating...`;
        
        try {
            // Generate a cute room ID code
            this.roomCode = this.peerManager.generateLoveNestCode();
            this.isHost = true;

            // Open PeerJS signaling using the code as peer ID
            await this.peerManager.init(this.roomCode);

            // Render code display to host
            this.generatedCodeSpan.textContent = this.roomCode;
            this.roomCodeDisplayContainer.style.display = 'flex';
            this.createRoomBtn.style.display = 'none';
            this.joinRoomBtn.disabled = true;
            this.joinRoomInput.disabled = true;

            this.showToast("Love Nest generated! Share the code with your partner.", "love");
        } catch (err) {
            console.error("Failed to host room:", err);
            this.showToast("Could not host room. Peer ID might be taken, try again.", "error");
            this.createRoomBtn.disabled = false;
            this.createRoomBtn.innerHTML = `<i class="fa-solid fa-feather-pointed"></i> Create Nest Code`;
        }
    }

    copyNestCodeToClipboard() {
        if (!this.roomCode) return;
        navigator.clipboard.writeText(this.roomCode).then(() => {
            this.showToast("Nest code copied to clipboard! 📋", "love");
        }).catch(err => {
            console.error("Clipboard copy failed:", err);
        });
    }

    async handleJoinNest() {
        const code = this.joinRoomInput.value.trim().toLowerCase();
        if (!code) {
            this.showToast("Please enter a valid nest code first.", "info");
            return;
        }

        this.joinRoomBtn.disabled = true;
        this.joinRoomBtn.innerHTML = `<i class="fa-solid fa-heart-pulse pulsing"></i> Connecting...`;
        this.createRoomBtn.disabled = true;

        try {
            this.roomCode = code;
            this.isHost = false;

            // User B initializes with a random ID
            await this.peerManager.init();

            // Connects to the host using the host code as peer ID
            await this.peerManager.connectToPartner(code);
        } catch (err) {
            console.error("Connection failed:", err);
            this.showToast("Could not connect to nest. Verify the code is correct.", "error");
            this.joinRoomBtn.disabled = false;
            this.joinRoomBtn.innerHTML = `<i class="fa-solid fa-heart-circle-bolt"></i> Fly In`;
            this.createRoomBtn.disabled = false;
        }
    }

    handleIncomingMediaCall(call) {
        console.log("Receiving incoming call, auto answering...");
        this.peerManager.answerCall(call);
    }

    handleConnectedState() {
        console.log("Both media and data connection established!");
        this.showToast("Joined the love nest! 💖 Connected.", "love");
        
        // Initialize other components now that connection is active
        this.gameController = new GameController(this.peerManager, this);
        this.canvasController = new CanvasController(this.peerManager, this);
        
        // Sync media toggles initially
        this.peerManager.sendData({
            type: 'media-status',
            micMuted: !this.micEnabled,
            camOff: !this.camEnabled
        });

        // Switch to calling view
        this.landingScreen.style.display = 'none';
        this.callScreen.style.display = 'flex';
        this.appControls.style.display = 'flex';
        this.togetherTimerContainer.style.display = 'flex';

        // Bind streams to DOM video tags
        if (this.peerManager.localStream) {
            this.localVideo.srcObject = this.peerManager.localStream;
        }

        // Start Together Clock
        this.startTimer();
    }

    handleRemoteStream(stream) {
        console.log("Binding remote stream to video element.");
        this.remoteVideo.srcObject = stream;
    }

    handleDisconnectedState() {
        this.showToast("Partner left the nest.", "info");
        this.resetToLanding();
    }

    confirmHangup() {
        if (confirm("Are you sure you want to leave the love nest?")) {
            this.peerManager.disconnect();
            this.resetToLanding();
        }
    }

    resetToLanding() {
        this.stopTimer();
        
        // Reset state
        this.isHost = false;
        this.roomCode = null;
        this.secondsTogether = 0;
        
        // Restore controls
        this.createRoomBtn.disabled = false;
        this.createRoomBtn.style.display = 'inline-flex';
        this.createRoomBtn.innerHTML = `<i class="fa-solid fa-feather-pointed"></i> Create Nest Code`;
        this.roomCodeDisplayContainer.style.display = 'none';
        this.generatedCodeSpan.textContent = '';
        this.joinRoomBtn.disabled = false;
        this.joinRoomBtn.innerHTML = `<i class="fa-solid fa-heart-circle-bolt"></i> Fly In`;
        this.joinRoomInput.disabled = false;
        this.joinRoomInput.value = '';

        // Switch screen
        this.callScreen.style.display = 'none';
        this.appControls.style.display = 'none';
        this.togetherTimerContainer.style.display = 'none';
        this.landingScreen.style.display = 'flex';

        // Clear canvas cached drawing
        if (this.canvasController) {
            this.canvasController.clearLocalCanvas();
        }
        
        // Empty notes chest
        this.lettersList.innerHTML = `<p class="empty-journal-msg">No love notes in the journal yet. Write one above!</p>`;
        this.letterCountSpan.textContent = '0';

        // Reset preflight review
        this.setupPreflightPreview();
    }

    // ==========================================================================
    // VIDEO CALL LAYOUTS & STYLES (FRAMES)
    // ==========================================================================
    toggleMic() {
        this.micEnabled = !this.micEnabled;
        this.micToggleBtn.classList.toggle('muted', !this.micEnabled);
        this.micToggleBtn.querySelector('i').className = this.micEnabled ? 'fa-solid fa-microphone' : 'fa-solid fa-microphone-slash';
        
        if (this.peerManager.localStream) {
            const track = this.peerManager.localStream.getAudioTracks()[0];
            if (track) track.enabled = this.micEnabled;
        }

        this.localMicStatus.style.display = this.micEnabled ? 'none' : 'flex';

        // Broadcast to partner
        this.peerManager.sendData({
            type: 'media-status',
            micMuted: !this.micEnabled,
            camOff: !this.camEnabled
        });
    }

    toggleCam() {
        this.camEnabled = !this.camEnabled;
        this.camToggleBtn.classList.toggle('muted', !this.camEnabled);
        this.camToggleBtn.querySelector('i').className = this.camEnabled ? 'fa-solid fa-video' : 'fa-solid fa-video-slash';
        
        if (this.peerManager.localStream) {
            const track = this.peerManager.localStream.getVideoTracks()[0];
            if (track) track.enabled = this.camEnabled;
        }

        this.localCamStatus.style.display = this.camEnabled ? 'none' : 'flex';

        // Broadcast to partner
        this.peerManager.sendData({
            type: 'media-status',
            micMuted: !this.micEnabled,
            camOff: !this.camEnabled
        });
    }

    toggleVideoLayout() {
        // Layout cycle: standard PiP -> Side-by-Side -> Heart Overlay -> PiP
        if (this.videoGrid.classList.contains('layout-split')) {
            // Move to Heart Layout
            this.videoGrid.classList.remove('layout-split');
            this.videoGrid.classList.add('layout-heart');
            this.showToast("Romantic Heart Overlay mode activated! 💖", "love");
        } else if (this.videoGrid.classList.contains('layout-heart')) {
            // Move back to regular PiP
            this.videoGrid.classList.remove('layout-heart');
            this.showToast("Picture-in-Picture layout activated.", "info");
        } else {
            // Move to split screen layout
            this.videoGrid.classList.add('layout-split');
            this.showToast("Side-by-Side layout activated.", "info");
        }
    }

    applyVideoFrame(frameClass) {
        // Clear previous frame classes
        this.videoGrid.className = 'video-grid';
        
        // Re-inject layout if split/heart are applied
        const hasSplit = this.videoGrid.classList.contains('layout-split');
        const hasHeart = this.videoGrid.classList.contains('layout-heart');
        
        this.videoGrid.classList.add(`frame-${frameClass}`);
        
        if (hasSplit) this.videoGrid.classList.add('layout-split');
        if (hasHeart) this.videoGrid.classList.add('layout-heart');

        this.showToast(`Applied frame: ${frameClass.replace('-', ' ')}`, "love");
    }

    toggleFeaturesDrawer() {
        const isOpen = this.featuresDrawer.style.display !== 'none';
        
        if (isOpen) {
            this.featuresDrawer.style.display = 'none';
            this.drawerToggleBtn.classList.remove('active');
            this.drawerToggleBtn.querySelector('i').className = 'fa-solid fa-heart-circle-plus';
        } else {
            this.featuresDrawer.style.display = 'flex';
            this.drawerToggleBtn.classList.add('active');
            this.drawerToggleBtn.querySelector('i').className = 'fa-solid fa-heart-circle-minus';
            
            // Resize canvas to fit inside the freshly visible drawer container
            if (this.canvasController) {
                this.canvasController.resizeCanvas();
            }
        }
    }

    switchTab(tabName) {
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        if (tabName === 'canvas' && this.canvasController) {
            // Re-render whiteboard coordinates layout to prevent scaling issues
            this.canvasController.resizeCanvas();
        }
    }

    // ==========================================================================
    // TOGETHER TIMER WIDGET
    // ==========================================================================
    startTimer() {
        this.secondsTogether = 0;
        this.timerDisplay.textContent = "00:00:00";
        this.milestoneBadge.textContent = "Spark ✨";
        
        this.timerInterval = setInterval(() => {
            this.secondsTogether++;
            
            const hrs = Math.floor(this.secondsTogether / 3600).toString().padStart(2, '0');
            const mins = Math.floor((this.secondsTogether % 3600) / 60).toString().padStart(2, '0');
            const secs = (this.secondsTogether % 60).toString().padStart(2, '0');
            
            this.timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
            
            // Update love milestone status
            this.checkMilestones();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    checkMilestones() {
        // Cute Couple Milestones
        if (this.secondsTogether === 60) {
            this.milestoneBadge.textContent = "Sweethearts 💕";
            this.showToast("1 Minute Together! The chemistry is real. 🧪", "love");
        } else if (this.secondsTogether === 300) {
            this.milestoneBadge.textContent = "Soulmates 💞";
            this.showToast("5 Minutes of endless talk! You two are inseparable.", "love");
        } else if (this.secondsTogether === 600) {
            this.milestoneBadge.textContent = "Inseparable 💖";
            this.showToast("10 Minutes! A true Kuchu-Muchu couple! 👑", "love");
        }
    }

    // ==========================================================================
    // EXCLUSIVE COUPLE FEATURE: HEARTBEAT SYNC
    // ==========================================================================
    sendHeartbeatPulse() {
        // Play local sound & show animation
        this.triggerHeartbeatEffect(true);

        // Send to partner over DataChannel
        this.peerManager.sendData({
            type: 'heartbeat'
        });
    }

    triggerHeartbeatEffect(isLocalInitiated = false) {
        // Play audio element
        const audio = document.getElementById('sound-heartbeat');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Audio autoplay prevented:", e));
        }

        // Render full screen visual pulse
        const pulseDiv = document.createElement('div');
        pulseDiv.className = 'heartbeat-flash';
        
        const innerHeart = document.createElement('div');
        innerHeart.className = 'heartbeat-pulse-center';
        innerHeart.innerHTML = '❤️';
        
        pulseDiv.appendChild(innerHeart);
        this.interactionOverlay.appendChild(pulseDiv);

        // Vibrate partner's phone if mobile and supported
        if (!isLocalInitiated && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        // Remove element after animation completes
        setTimeout(() => {
            pulseDiv.remove();
        }, 1800);
    }

    // ==========================================================================
    // EXCLUSIVE COUPLE FEATURE: FLOATING REACTIONS
    // ==========================================================================
    sendReaction(emoji) {
        // Spawn locally
        this.spawnReactionEmoji(emoji);
        
        // Sync to partner
        this.peerManager.sendData({
            type: 'reaction',
            emoji: emoji
        });
    }

    spawnReactionEmoji(emoji) {
        const floatEmoji = document.createElement('div');
        floatEmoji.className = 'floating-reaction';
        floatEmoji.textContent = emoji;

        // Random horizontal entry position & slight variance
        const randomX = Math.floor(Math.random() * 80) + 10; // Between 10% and 90%
        floatEmoji.style.left = `${randomX}%`;
        
        // Spawn in the grid container overlay
        this.interactionOverlay.appendChild(floatEmoji);
        
        setTimeout(() => {
            floatEmoji.remove();
        }, 3000);
    }

    // ==========================================================================
    // EXCLUSIVE COUPLE FEATURE: VIRTUAL GIFTS
    // ==========================================================================
    sendGift(giftType) {
        const giftsMap = {
            'rose': { emoji: '🌹', name: 'Red Rose' },
            'chocolate': { emoji: '🍫', name: 'Delicious Chocolates' },
            'teddy': { emoji: '🧸', name: 'Warm Teddy Hug' },
            'kiss': { emoji: '😘', name: 'Blowing Kiss' }
        };

        const gift = giftsMap[giftType];
        
        // Spawn local notification
        this.showToast(`Sent a ${gift.name}! 🎁`, "love");
        
        // Play local gift audio
        const audio = document.getElementById('sound-gift');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Gift sound blocked:", e));
        }

        // Send to partner
        this.peerManager.sendData({
            type: 'gift',
            giftType: giftType
        });
    }

    triggerGiftAnimation(giftType) {
        const giftsMap = {
            'rose': { emoji: '🌹', name: 'Red Rose' },
            'chocolate': { emoji: '🍫', name: 'Delicious Chocolates' },
            'teddy': { emoji: '🧸', name: 'Warm Teddy Hug' },
            'kiss': { emoji: '😘', name: 'Blowing Kiss' }
        };

        const gift = giftsMap[giftType];

        // Play incoming gift audio
        const audio = document.getElementById('sound-gift');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Gift sound blocked:", e));
        }

        // Add pop gift overlay
        const deliveryDiv = document.createElement('div');
        deliveryDiv.className = 'gift-delivery';
        
        const emojiNode = document.createElement('div');
        emojiNode.className = 'gift-delivery-emoji';
        emojiNode.textContent = gift.emoji;
        
        const messageNode = document.createElement('div');
        messageNode.className = 'gift-delivery-message';
        messageNode.textContent = `Partner sent you a ${gift.name}!`;

        deliveryDiv.appendChild(emojiNode);
        deliveryDiv.appendChild(messageNode);
        
        // Spawn inside the partner's video panel
        this.giftOverlay.appendChild(deliveryDiv);

        setTimeout(() => {
            deliveryDiv.remove();
        }, 3000);
    }

    // ==========================================================================
    // EXCLUSIVE COUPLE FEATURE: LOVE LETTERS Note
    // ==========================================================================
    sendLoveLetter() {
        const text = this.loveLetterInput.value.trim();
        if (!text) return;

        const date = new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Add note to local journal list
        this.addLoveLetterToJournal("Me", text, timeStr);
        
        // Play local letter sending sound
        const audio = document.getElementById('sound-letter');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Letter sound blocked:", e));
        }

        // Send to partner
        this.peerManager.sendData({
            type: 'love-letter',
            text: text,
            timestamp: timeStr
        });

        // Trigger local flying letter visual
        this.triggerFlyingLetter();

        // Clear input
        this.loveLetterInput.value = '';
    }

    triggerFlyingLetter() {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'flying-letter-node';
        letterDiv.innerHTML = '✉️';
        
        this.interactionOverlay.appendChild(letterDiv);
        
        setTimeout(() => {
            letterDiv.remove();
        }, 2200);
    }

    addLoveLetterToJournal(author, content, timestamp) {
        // Remove empty placeholder message
        const placeholder = this.lettersList.querySelector('.empty-journal-msg');
        if (placeholder) placeholder.remove();

        const card = document.createElement('div');
        card.className = 'journal-card';
        
        const header = document.createElement('div');
        header.className = 'journal-card-header';
        
        const authorNode = document.createElement('span');
        authorNode.textContent = author;
        authorNode.style.color = author === "Me" ? 'var(--color-love)' : 'var(--color-secondary)';
        
        const timeNode = document.createElement('span');
        timeNode.textContent = timestamp;

        header.appendChild(authorNode);
        header.appendChild(timeNode);
        
        const pNode = document.createElement('p');
        pNode.textContent = content;

        card.appendChild(header);
        card.appendChild(pNode);

        // Prepend to top of list
        this.lettersList.insertBefore(card, this.lettersList.firstChild);

        // Update count badge
        const cardsCount = this.lettersList.querySelectorAll('.journal-card').length;
        this.letterCountSpan.textContent = cardsCount;
    }

    // ==========================================================================
    // EXCLUSIVE COUPLE FEATURE: SOUNDBOARD
    // ==========================================================================
    sendSoundboardEffect(soundId) {
        // Play local
        this.playSoundEffect(soundId);

        // Notify partner
        this.peerManager.sendData({
            type: 'sound',
            soundId: soundId
        });
    }

    playSoundEffect(soundId) {
        const audio = document.getElementById(`sound-${soundId}`);
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Soundboard block:", e));
            this.showToast(`Sound effect triggered: ${soundId}! 🔊`, "info");
        }
    }

    toggleAmbienceTrack(track, btn) {
        const audio = document.getElementById(`ambience-${track}`);
        if (!audio) return;

        if (audio.paused) {
            // Pause all others first to keep simple
            this.playAmbienceButtons.forEach(b => {
                const otherTrack = b.getAttribute('data-track');
                const otherAudio = document.getElementById(`ambience-${otherTrack}`);
                if (otherAudio) {
                    otherAudio.pause();
                    b.classList.remove('playing');
                    b.querySelector('i').className = 'fa-solid fa-play';
                }
            });

            audio.volume = 0.4;
            audio.play().catch(e => console.log("Ambience block:", e));
            btn.classList.add('playing');
            btn.querySelector('i').className = 'fa-solid fa-pause';
            this.showToast(`Playing cozy background: ${track} 🕯️`, "love");
        } else {
            audio.pause();
            btn.classList.remove('playing');
            btn.querySelector('i').className = 'fa-solid fa-play';
            this.showToast(`Cozy ambient track paused.`, "info");
        }
    }

    // ==========================================================================
    // NETWORK INPUT RECEIVER / PACKET PROCESSOR
    // ==========================================================================
    handleNetworkPacket(packet) {
        // Divert game/drawing packets to their respective controller objects
        if (packet.type === 'game-start' || packet.type === 'game-exit' || 
            packet.type === 'quiz-answer' || packet.type === 'quiz-next' ||
            packet.type === 'tod-pick' || packet.type === 'tod-done' || 
            packet.type === 'wyr-choice' || packet.type === 'wyr-next') {
            
            if (this.gameController) {
                this.gameController.handleIncomingGamePacket(packet);
            }
            return;
        }

        if (packet.type === 'doodle') {
            if (this.canvasController) {
                this.canvasController.handleIncomingDoodle(packet);
            }
            return;
        }

        // Handle app-level synchronization packets
        switch (packet.type) {
            case 'heartbeat':
                this.triggerHeartbeatEffect(false);
                break;
            
            case 'reaction':
                this.spawnReactionEmoji(packet.emoji);
                break;
            
            case 'gift':
                this.triggerGiftAnimation(packet.giftType);
                this.showToast(`Partner sent you a gift! 🎁`, "love");
                break;
            
            case 'love-letter':
                this.addLoveLetterToJournal("Kuchu-Muchu", packet.text, packet.timestamp);
                
                // Play receipt sound & trigger flying letter
                const letterAudio = document.getElementById('sound-letter');
                if (letterAudio) {
                    letterAudio.currentTime = 0;
                    letterAudio.play().catch(e => console.log("Letter sound blocked:", e));
                }
                this.triggerFlyingLetter();
                this.showToast("You received a new love letter! 💌", "love");
                break;
                
            case 'sound':
                this.playSoundEffect(packet.soundId);
                break;

            case 'media-status':
                this.remoteMicStatus.style.display = packet.micMuted ? 'flex' : 'none';
                this.remoteCamStatus.style.display = packet.camOff ? 'flex' : 'none';
                break;
        }
    }

    // ==========================================================================
    // TOAST NOTIFICATIONS UI
    // ==========================================================================
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        let prefix = '✨';
        if (type === 'love') {
            prefix = '💖';
            toast.style.borderLeftColor = 'var(--color-love)';
        } else if (type === 'error') {
            prefix = '⚠️';
            toast.style.borderLeftColor = '#f44336';
        } else if (type === 'info') {
            prefix = '💡';
            toast.style.borderLeftColor = 'var(--color-secondary)';
        }

        toast.innerHTML = `<span>${prefix}</span> <span>${message}</span>`;
        this.toastContainer.appendChild(toast);
        
        // Remove from DOM after transition matches keyframe delay (3000ms total duration)
        setTimeout(() => {
            toast.remove();
        }, 3200);
    }
}

// Instantiate App on window load
window.addEventListener('DOMContentLoaded', () => {
    window.KuchuMuchuApp = new App();
});
