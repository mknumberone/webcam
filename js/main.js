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
        isReady: false,
        handPosition: { x: 0.5, y: 0.5 }, // Normalized hand position
        greetingTimer: null // Timer for auto-hiding greeting
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
        startBtn: null,
        greetingDisplay: null,
        greetingText: null,
        greetingSub: null
    },

    // Gesture greetings - Main text and subtitle
    gestureGreetings: {
        'none': { main: '', sub: '' },
        'open_hand': {
            main: 'Chúc Mừng Năm Mới',
            sub: '🌸 Xuân về trên khắp nẻo đường 🌸'
        },
        'peace_sign': {
            main: 'An Khang Thịnh Vượng',
            sub: '✨ Bình an - Hạnh phúc - Thành công ✨'
        },
        'ily_sign': {
            main: 'Vạn Sự Như Ý',
            sub: '🎊 Mọi điều tốt đẹp nhất đến với bạn 🎊'
        },
        'pointing': {
            main: 'Phúc Lộc Thọ',
            sub: '🏮 Tam đa - Phúc lộc tràn đầy 🏮'
        },
        'fist': {
            main: 'Tấn Tài Tấn Lộc',
            sub: '💰 Năm mới phát tài phát lộc 💰'
        },
        'thumbs_up': {
            main: 'Niên Niên Như Ý',
            sub: '🎋 Năm năm đều được như ý nguyện 🎋'
        },
        'ok_sign': {
            main: 'Tuế Tuế Bình An',
            sub: '🌺 Mỗi năm đều bình an vui vẻ 🌺'
        }
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
            startBtn: document.getElementById('start-btn'),
            greetingDisplay: document.getElementById('greeting-display'),
            greetingText: document.querySelector('.greeting-text'),
            greetingSub: document.querySelector('.greeting-sub')
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

        // Setup hand position callback
        HandTracking.onHandPosition = (position) => {
            this.updateHandPosition(position);
        };

        // Start hand tracking
        HandTracking.start();

        // Show UI
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.cameraPreview.classList.add('visible');
        this.elements.gestureGuide.classList.remove('hidden');

        // Activate cherry blossoms - always on
        CherryBlossoms.setActive(true);

        this.state.isReady = true;
        console.log('🎉 Experience started for:', this.state.recipientName);
    },

    /**
     * Update hand position for cherry blossoms to follow
     * @param {object} position - {x, y} normalized 0-1
     */
    updateHandPosition(position) {
        if (!this.state.isReady) return;

        this.state.handPosition = position;

        // Update cherry blossoms to spawn around hand position
        CherryBlossoms.setHandPosition(position.x, position.y);
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

        // Update guide highlighting
        this.updateGuideHighlight(gesture);

        // Show greeting based on gesture
        this.showGreeting(gesture);

        // Burst cherry blossoms on any gesture change
        if (gesture !== 'none') {
            CherryBlossoms.burst();
        }
    },

    /**
     * Show greeting message
     * @param {string} gesture
     */
    showGreeting(gesture) {
        const greeting = this.gestureGreetings[gesture];

        // Clear any existing timer
        if (this.state.greetingTimer) {
            clearTimeout(this.state.greetingTimer);
            this.state.greetingTimer = null;
        }

        if (greeting && greeting.main) {
            // Update greeting text
            this.elements.greetingText.textContent = greeting.main;

            // Add recipient name to subtitle
            let subText = greeting.sub;
            if (this.state.recipientName && this.state.recipientName !== 'Bạn') {
                subText = `Gửi đến ${this.state.recipientName} - ${greeting.sub}`;
            }
            this.elements.greetingSub.textContent = subText;

            // Show greeting display
            this.elements.greetingDisplay.classList.remove('hidden');
            this.elements.greetingDisplay.classList.add('visible');

            // Hide gesture indicator
            this.elements.gestureIndicator.classList.add('hidden');

            // Auto-hide after 5 seconds
            this.state.greetingTimer = setTimeout(() => {
                this.hideGreeting();
            }, 5000);
        } else {
            this.hideGreeting();
        }
    },

    /**
     * Hide greeting message
     */
    hideGreeting() {
        this.elements.greetingDisplay.classList.remove('visible');
        this.elements.greetingDisplay.classList.add('hidden');

        // Clear timer if exists
        if (this.state.greetingTimer) {
            clearTimeout(this.state.greetingTimer);
            this.state.greetingTimer = null;
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
            if (gesture === 'pointing' && index === 3) item.classList.add('active');
            if (gesture === 'fist' && index === 4) item.classList.add('active');
            if (gesture === 'thumbs_up' && index === 5) item.classList.add('active');
            if (gesture === 'ok_sign' && index === 6) item.classList.add('active');
        });
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
