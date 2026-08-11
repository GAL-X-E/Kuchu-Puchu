/* ==========================================================================
   💖 KUCHU-MUCHU WEBRTC & PEERJS MANAGER 💖
   ========================================================================== */

export class PeerManager {
    constructor() {
        this.peer = null;
        this.dataConnection = null;
        this.mediaCall = null;
        this.localStream = null;
        this.remoteStream = null;
        
        // Callbacks registered by other modules
        this.onIncomingCall = null;
        this.onConnected = null;
        this.onDisconnected = null;
        this.onRemoteStream = null;
        this.onDataReceived = null;
        this.onMediaStatusChanged = null;
    }

    /**
     * Initializes the PeerJS instance.
     * Generates a custom peer ID or connects with a user-provided one.
     */
    init(customId = null) {
        return new Promise(async (resolve, reject) => {
            // Check if running on local node server or fallback to public PeerJS cloud
            let useLocal = false;
            if (window.location.port === '3000' || 
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1') {
                try {
                    // Check if our node PeerServer path actually exists
                    const res = await fetch('/peerjs', { method: 'HEAD' });
                    if (res.status !== 404) {
                        useLocal = true;
                    }
                } catch (e) {
                    useLocal = false;
                }
            }
            
            const config = useLocal ? {
                host: window.location.hostname,
                port: window.location.port,
                path: '/peerjs',
                debug: 1
            } : {
                // Public PeerJS cloud servers configuration
                host: '0.peerjs.com',
                port: 443,
                secure: true,
                path: '/',
                debug: 1
            };

            console.log("[PeerManager] Initializing Peer with config:", config);
            this.peer = customId ? new Peer(customId, config) : new Peer(config);

            this.peer.on('open', (id) => {
                console.log(`[PeerManager] Opened peer connection. My ID: ${id}`);
                resolve(id);
            });

            this.peer.on('error', (err) => {
                console.error("[PeerManager] PeerJS Error:", err);
                reject(err);
            });

            // Handle incoming data connections (e.g. text/draw/reactions)
            this.peer.on('connection', (conn) => {
                console.log(`[PeerManager] Incoming data connection from: ${conn.peer}`);
                this.setupDataConnection(conn);
            });

            // Handle incoming media calls
            this.peer.on('call', (call) => {
                console.log(`[PeerManager] Incoming media call from: ${call.peer}`);
                if (this.onIncomingCall) {
                    this.onIncomingCall(call);
                } else {
                    // Auto-answer if stream is available
                    if (this.localStream) {
                        call.answer(this.localStream);
                        this.setupMediaCall(call);
                    } else {
                        console.warn("[PeerManager] Refusing call: No local media stream.");
                        call.close();
                    }
                }
            });
        });
    }

    /**
     * Generates a cute couple-themed room code
     */
    generateLoveNestCode() {
        const couples = ['sweet-hearts', 'love-birds', 'honey-pies', 'cuddle-bugs', 'kuchu-muchu', 'sugar-plums', 'soul-mates'];
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const randomWord = couples[Math.floor(Math.random() * couples.length)];
        return `${randomWord}-${randomNum}`;
    }

    /**
     * Set up local camera/microphone stream
     */
    async getLocalMedia(video = true, audio = true) {
        try {
            if (this.localStream) {
                // Stop previous tracks if updating
                this.localStream.getTracks().forEach(track => track.stop());
            }
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: video ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
                audio: audio
            });
            console.log("[PeerManager] Successfully captured local media stream.");
            return this.localStream;
        } catch (err) {
            console.error("[PeerManager] Error getting local media:", err);
            throw err;
        }
    }

    /**
     * Initiates both media and data connections to the partner
     */
    async connectToPartner(partnerId) {
        if (!this.peer) throw new Error("Peer is not initialized.");
        
        console.log(`[PeerManager] Connecting to partner: ${partnerId}`);
        
        // 1. Establish Data connection
        const conn = this.peer.connect(partnerId, { reliable: true });
        this.setupDataConnection(conn);

        // 2. Establish Call
        if (this.localStream) {
            const call = this.peer.call(partnerId, this.localStream);
            this.setupMediaCall(call);
        } else {
            console.warn("[PeerManager] Calling partner without camera/mic stream.");
        }
    }

    /**
     * Configures the active media call handlers
     */
    setupMediaCall(call) {
        this.mediaCall = call;

        call.on('stream', (remoteStream) => {
            console.log("[PeerManager] Remote media stream received.");
            this.remoteStream = remoteStream;
            if (this.onRemoteStream) {
                this.onRemoteStream(remoteStream);
            }
        });

        call.on('close', () => {
            console.log("[PeerManager] Media call closed.");
            this.remoteStream = null;
            if (this.onDisconnected) this.onDisconnected();
        });

        call.on('error', (err) => {
            console.error("[PeerManager] Media call error:", err);
        });
    }

    /**
     * Configures the active data connection handlers
     */
    setupDataConnection(conn) {
        this.dataConnection = conn;

        conn.on('open', () => {
            console.log("[PeerManager] Data connection established.");
            if (this.onConnected) this.onConnected();
        });

        conn.on('data', (data) => {
            // Process specialized network packets
            if (this.onDataReceived) {
                this.onDataReceived(data);
            }
        });

        conn.on('close', () => {
            console.log("[PeerManager] Data connection closed.");
            this.dataConnection = null;
            if (this.onDisconnected) this.onDisconnected();
        });

        conn.on('error', (err) => {
            console.error("[PeerManager] Data connection error:", err);
        });
    }

    /**
     * Broadcasts data packets to the connected partner
     */
    sendData(packet) {
        if (this.dataConnection && this.dataConnection.open) {
            this.dataConnection.send(packet);
        } else {
            console.warn("[PeerManager] Data connection is offline. Skipping send:", packet.type);
        }
    }

    /**
     * Answers an incoming media call
     */
    answerCall(call) {
        if (this.localStream) {
            call.answer(this.localStream);
            this.setupMediaCall(call);
        } else {
            console.error("[PeerManager] Cannot answer call: Local media is unavailable.");
        }
    }

    /**
     * Disconnects / Ends the current session cleanly
     */
    disconnect() {
        console.log("[PeerManager] Disconnecting active session.");
        
        if (this.mediaCall) {
            this.mediaCall.close();
            this.mediaCall = null;
        }

        if (this.dataConnection) {
            this.dataConnection.close();
            this.dataConnection = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }
}
