/* ========================================
   HAND TRACKING
   MediaPipe Hands integration
   ======================================== */

const HandTracking = {
    hands: null,
    camera: null,
    videoElement: null,
    canvasElement: null,
    canvasCtx: null,
    isRunning: false,

    // Callbacks
    onGestureDetected: null,
    onHandsDetected: null,

    /**
     * Get available cameras (including mobile)
     * @returns {Promise<MediaDeviceInfo[]>}
     */
    async getAvailableCameras() {
        try {
            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('MediaDevices API not available');
                alert('Trình duyệt không hỗ trợ camera. Vui lòng dùng Chrome hoặc Safari phiên bản mới nhất.');
                return [];
            }

            // On mobile, we can enumerate devices without permission first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');

            // If labels are empty, we'll just return generic options
            if (cameras.length > 0 && !cameras[0].label) {
                return [
                    { deviceId: 'user', label: 'Camera trước (Front)' },
                    { deviceId: 'environment', label: 'Camera sau (Back)' }
                ];
            }

            return cameras;
        } catch (error) {
            console.error('Error getting cameras:', error);
            return [
                { deviceId: 'user', label: 'Camera trước (Front)' },
                { deviceId: 'environment', label: 'Camera sau (Back)' }
            ];
        }
    },

    /**
     * Initialize MediaPipe Hands
     * @param {HTMLVideoElement} videoElement
     * @param {HTMLCanvasElement} canvasElement
     * @param {string} deviceId - Optional camera device ID
     */
    async init(videoElement, canvasElement, deviceId = null) {
        this.videoElement = videoElement;
        this.canvasElement = canvasElement;
        this.canvasCtx = canvasElement.getContext('2d');

        // Initialize MediaPipe Hands
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults.bind(this));

        // Setup camera with device selection
        let constraints;

        if (deviceId === 'user' || deviceId === 'environment') {
            // Mobile facing mode
            constraints = {
                video: {
                    facingMode: deviceId,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
        } else if (deviceId) {
            // Specific device ID
            constraints = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
        } else {
            // Default to front camera
            constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            };
        }

        console.log('Requesting camera with constraints:', constraints);

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera access granted!');
            this.videoElement.srcObject = stream;
            await this.videoElement.play();

            // Set canvas size
            this.canvasElement.width = this.videoElement.videoWidth || 640;
            this.canvasElement.height = this.videoElement.videoHeight || 480;

            return true;
        } catch (error) {
            console.error('Camera access error:', error);
            return false;
        }
    },

    /**
     * Handle MediaPipe results
     */
    onResults(results) {
        // Clear and draw video frame
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(
            results.image,
            0, 0,
            this.canvasElement.width,
            this.canvasElement.height
        );

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Draw hand landmarks
            this.drawLandmarks(landmarks);

            // Callback with hand data
            if (this.onHandsDetected) {
                this.onHandsDetected(landmarks);
            }

            // Process gesture
            const gestureResult = GestureRecognition.processGesture(landmarks);
            if (this.onGestureDetected && gestureResult.isConfirmed) {
                this.onGestureDetected(gestureResult.gesture);
            }
        } else {
            // No hands detected
            GestureRecognition.reset();
            if (this.onGestureDetected) {
                this.onGestureDetected(GestureRecognition.GESTURES.NONE);
            }
        }

        this.canvasCtx.restore();
    },

    /**
     * Draw hand landmarks on canvas
     */
    drawLandmarks(landmarks) {
        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],       // Index
            [5, 9], [9, 10], [10, 11], [11, 12], // Middle
            [9, 13], [13, 14], [14, 15], [15, 16], // Ring
            [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [0, 17]                                // Palm
        ];

        this.canvasCtx.strokeStyle = 'rgba(255, 179, 198, 0.8)';
        this.canvasCtx.lineWidth = 2;

        for (const [start, end] of connections) {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];

            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(
                startPoint.x * this.canvasElement.width,
                startPoint.y * this.canvasElement.height
            );
            this.canvasCtx.lineTo(
                endPoint.x * this.canvasElement.width,
                endPoint.y * this.canvasElement.height
            );
            this.canvasCtx.stroke();
        }

        // Draw landmark points
        for (const landmark of landmarks) {
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(
                landmark.x * this.canvasElement.width,
                landmark.y * this.canvasElement.height,
                4, 0, 2 * Math.PI
            );
            this.canvasCtx.fillStyle = '#ffd700';
            this.canvasCtx.fill();
        }
    },

    /**
     * Start processing frames
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.processFrame();
    },

    /**
     * Process video frame
     */
    async processFrame() {
        if (!this.isRunning) return;

        if (this.videoElement.readyState >= 2) {
            await this.hands.send({ image: this.videoElement });
        }

        requestAnimationFrame(() => this.processFrame());
    },

    /**
     * Stop processing
     */
    stop() {
        this.isRunning = false;
        if (this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(track => track.stop());
        }
    }
};
