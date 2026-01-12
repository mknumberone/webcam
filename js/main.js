/* ========================================
   MAIN APPLICATION
   Entry point and state management
   ======================================== */

const App = {
    // State
    state: {
        recipientName: '',
        currentGesture: 'none',
        lastGesture: 'none',
        isReady: false
    },

    // DOM Elements
    elements: {
        canvas3d: null,
        webcam: null,
        handCanvas: null,
        loadingScreen: null,
        setupModal: null,
        cameraPreview: null,
        gestureGuide: null,
        gestureIndicator: null,
        currentGestureEl: null,
        recipientInput: null,
        cameraList: null,
        startBtn: null
    },

    // Gesture display names
    gestureNames: {
        'none': '',
        'open_hand': '✋ Hoa Đào Nở',
        'peace_sign': '✌️ Chữ Phúc',
        'ily_sign': '🤟 Chúc Mừng Năm Mới'
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('🌸 Xuân Trong Tầm Tay - Initializing...');

        // Get DOM elements
        this.getElements();

        // Initialize 3D scene
        Scene3D.init(this.elements.canvas3d);
        Scene3D.start();

        // Populate camera list
        await this.populateCameraList();

        // Setup event listeners
        this.setupEventListeners();

        // Show setup modal
        this.showSetupModal();
    },

    /**
     * Get DOM elements
     */
    getElements() {
        this.elements = {
            canvas3d: document.getElementById('canvas3d'),
            webcam: document.getElementById('webcam'),
            handCanvas: document.getElementById('hand-canvas'),
            loadingScreen: document.getElementById('loading-screen'),
            setupModal: document.getElementById('setup-modal'),
            cameraPreview: document.getElementById('camera-preview'),
            gestureGuide: document.getElementById('gesture-guide'),
            gestureIndicator: document.getElementById('gesture-indicator'),
            currentGestureEl: document.getElementById('current-gesture'),
            recipientInput: document.getElementById('recipient-name'),
            cameraList: document.getElementById('camera-list'),
            testCameraBtn: document.getElementById('test-camera-btn'),
            cameraStatus: document.getElementById('camera-status'),
            startBtn: document.getElementById('start-btn')
        };
    },

    /**
     * Populate camera selection dropdown
     */
    async populateCameraList() {
        const cameras = await HandTracking.getAvailableCameras();

        this.elements.cameraList.innerHTML = '';

        if (cameras.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Không tìm thấy camera';
            this.elements.cameraList.appendChild(option);
            return;
        }

        cameras.forEach((camera, index) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label || `Camera ${index + 1}`;
            this.elements.cameraList.appendChild(option);
        });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Test camera button - explicit permission request
        this.elements.testCameraBtn.addEventListener('click', () => {
            this.testCamera();
        });

        // Start button
        this.elements.startBtn.addEventListener('click', () => {
            this.startExperience();
        });

        // Enter key on input
        this.elements.recipientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.startBtn.disabled) {
                this.startExperience();
            }
        });
    },

    /**
     * Test camera access - explicit request for iOS
     */
    async testCamera() {
        const statusEl = this.elements.cameraStatus;
        const testBtn = this.elements.testCameraBtn;
        const startBtn = this.elements.startBtn;

        statusEl.textContent = 'Đang yêu cầu quyền camera...';
        statusEl.className = 'camera-status';
        testBtn.disabled = true;

        try {
            // Get selected camera type
            const selectedCamera = this.elements.cameraList.value;
            let constraints;

            if (selectedCamera === 'environment') {
                constraints = { video: { facingMode: 'environment' } };
            } else {
                constraints = { video: { facingMode: 'user' } };
            }

            console.log('Testing camera with:', constraints);

            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Success! Stop the test stream
            stream.getTracks().forEach(track => track.stop());

            statusEl.textContent = '✅ Camera đã được cấp quyền!';
            statusEl.className = 'camera-status success';
            testBtn.textContent = '✅ Camera OK';
            testBtn.className = 'btn-secondary success';
            startBtn.disabled = false;

            console.log('Camera test successful!');

        } catch (error) {
            console.error('Camera test failed:', error);

            let errorMsg = '❌ Không thể truy cập camera. ';

            if (error.name === 'NotAllowedError') {
                errorMsg += 'Bạn đã từ chối quyền camera. Vào Settings để bật lại.';
            } else if (error.name === 'NotFoundError') {
                errorMsg += 'Không tìm thấy camera.';
            } else if (error.name === 'NotReadableError') {
                errorMsg += 'Camera đang được sử dụng bởi ứng dụng khác.';
            } else {
                errorMsg += error.message;
            }

            statusEl.textContent = errorMsg;
            statusEl.className = 'camera-status error';
            testBtn.disabled = false;
        }
    },

    /**
     * Show setup modal
     */
    showSetupModal() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.setupModal.classList.remove('hidden');
        this.elements.recipientInput.focus();
    },

    /**
     * Start the experience
     */
    async startExperience() {
        // Get recipient name
        this.state.recipientName = this.elements.recipientInput.value.trim() || 'Bạn';

        // Setup name display
        NameDisplay.setName(this.state.recipientName);

        // Get selected camera
        const selectedCamera = this.elements.cameraList.value;

        // Hide setup modal, show loading
        this.elements.setupModal.classList.add('hidden');
        this.elements.loadingScreen.classList.remove('hidden');

        // Initialize hand tracking
        const success = await HandTracking.init(
            this.elements.webcam,
            this.elements.handCanvas,
            selectedCamera || null
        );

        if (!success) {
            alert('Không thể truy cập camera.\\n\\nHướng dẫn:\\n1. Kiểm tra đã cho phép Camera trong Settings > Chrome > Camera\\n2. Reload lại trang và nhấn \"Allow\" khi được hỏi\\n3. Thử dùng camera khác (trước/sau)');
            this.elements.loadingScreen.classList.add('hidden');
            this.elements.setupModal.classList.remove('hidden');
            return;
        }

        // Setup gesture callback
        HandTracking.onGestureDetected = (gesture) => {
            this.handleGesture(gesture);
        };

        // Start hand tracking
        HandTracking.start();

        // Show UI
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.cameraPreview.classList.add('visible');
        this.elements.gestureGuide.classList.remove('hidden');

        this.state.isReady = true;
        console.log('🎉 Experience started for:', this.state.recipientName);
    },

    /**
     * Handle detected gesture
     * @param {string} gesture
     */
    handleGesture(gesture) {
        if (!this.state.isReady) return;
        if (gesture === this.state.currentGesture) return;

        this.state.lastGesture = this.state.currentGesture;
        this.state.currentGesture = gesture;

        console.log('Gesture:', gesture);

        // Update gesture indicator
        this.updateGestureIndicator(gesture);

        // Update guide highlighting
        this.updateGuideHighlight(gesture);

        // Trigger effects based on gesture
        switch (gesture) {
            case GestureRecognition.GESTURES.OPEN_HAND:
                this.triggerOpenHand();
                break;

            case GestureRecognition.GESTURES.PEACE_SIGN:
                this.triggerPeaceSign();
                break;

            case GestureRecognition.GESTURES.ILY_SIGN:
                this.triggerILYSign();
                break;

            case GestureRecognition.GESTURES.NONE:
                this.resetEffects();
                break;
        }
    },

    /**
     * Update gesture indicator UI
     */
    updateGestureIndicator(gesture) {
        const name = this.gestureNames[gesture];

        if (name) {
            this.elements.currentGestureEl.textContent = name;
            this.elements.gestureIndicator.classList.remove('hidden');
            this.elements.gestureIndicator.classList.add('visible');
        } else {
            this.elements.gestureIndicator.classList.remove('visible');
            this.elements.gestureIndicator.classList.add('hidden');
        }
    },

    /**
     * Update guide item highlighting
     */
    updateGuideHighlight(gesture) {
        const items = document.querySelectorAll('.guide-item');
        items.forEach((item, index) => {
            item.classList.remove('active');

            if (gesture === 'open_hand' && index === 0) item.classList.add('active');
            if (gesture === 'peace_sign' && index === 1) item.classList.add('active');
            if (gesture === 'ily_sign' && index === 2) item.classList.add('active');
        });
    },

    /**
     * Trigger open hand effect - Cherry Blossoms
     */
    triggerOpenHand() {
        console.log('🌸 Cherry Blossoms activated!');

        // Deactivate other effects
        Calligraphy.setActive(false);
        NameDisplay.setActive(false);

        // Activate cherry blossoms
        CherryBlossoms.setActive(true);
        CherryBlossoms.burst();

        // Camera effect
        CinematicCamera.setOrbit(true);
        CinematicCamera.shake(0.5);
    },

    /**
     * Trigger peace sign effect - Calligraphy "Phúc"
     */
    triggerPeaceSign() {
        console.log('✌️ Calligraphy Phúc activated!');

        // Deactivate other effects
        CherryBlossoms.setActive(false);
        NameDisplay.setActive(false);

        // Activate calligraphy
        Calligraphy.setActive(true);

        // Camera effect
        CinematicCamera.setOrbit(true);
        CinematicCamera.focusOn(new THREE.Vector3(0, 0.5, 0), 3);
    },

    /**
     * Trigger ILY sign effect - New Year Greeting + Name
     */
    triggerILYSign() {
        console.log('🤟 New Year Greeting activated for:', this.state.recipientName);

        // Deactivate other effects
        CherryBlossoms.setActive(false);
        Calligraphy.setActive(false);

        // Activate name display
        NameDisplay.setActive(true);

        // Trigger fireworks
        Fireworks.celebrate();

        // Camera effect
        CinematicCamera.setOrbit(true);
        CinematicCamera.shake(0.8);
    },

    /**
     * Reset all effects
     */
    resetEffects() {
        CherryBlossoms.setActive(false);
        Calligraphy.setActive(false);
        NameDisplay.setActive(false);
        CinematicCamera.setOrbit(false);
        CinematicCamera.resetPosition();
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
