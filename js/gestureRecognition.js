/* ========================================
   GESTURE RECOGNITION
   Classify hand gestures from MediaPipe landmarks
   ======================================== */

const GestureRecognition = {
    // Gesture types
    GESTURES: {
        NONE: 'none',
        OPEN_HAND: 'open_hand',      // ✋ 5 fingers extended
        PEACE_SIGN: 'peace_sign',    // ✌️ Index + Middle extended
        ILY_SIGN: 'ily_sign'         // 🤟 Thumb + Index + Pinky extended
    },

    // Finger tip and pip (proximal interphalangeal) landmark indices
    FINGER_TIPS: [4, 8, 12, 16, 20],  // Thumb, Index, Middle, Ring, Pinky
    FINGER_PIPS: [3, 6, 10, 14, 18],

    // Current gesture state
    currentGesture: 'none',
    gestureStartTime: 0,
    gestureConfirmTime: 300, // ms to confirm gesture

    /**
     * Check if a finger is extended
     * @param {Array} landmarks - Hand landmarks from MediaPipe
     * @param {number} fingerIndex - 0=Thumb, 1=Index, 2=Middle, 3=Ring, 4=Pinky
     * @returns {boolean}
     */
    isFingerExtended(landmarks, fingerIndex) {
        const tipIndex = this.FINGER_TIPS[fingerIndex];
        const pipIndex = this.FINGER_PIPS[fingerIndex];

        if (fingerIndex === 0) {
            // Thumb - check x distance from palm (landmark 2)
            const thumbTip = landmarks[4];
            const thumbBase = landmarks[2];
            const palmCenter = landmarks[0];

            // Check if thumb is extended outward
            const thumbExtension = Math.abs(thumbTip.x - palmCenter.x);
            return thumbExtension > 0.1;
        } else {
            // Other fingers - tip should be above pip (lower y value)
            const tip = landmarks[tipIndex];
            const pip = landmarks[pipIndex];
            return tip.y < pip.y - 0.02;
        }
    },

    /**
     * Get array of extended fingers
     * @param {Array} landmarks
     * @returns {boolean[]} - [thumb, index, middle, ring, pinky]
     */
    getExtendedFingers(landmarks) {
        return [0, 1, 2, 3, 4].map(i => this.isFingerExtended(landmarks, i));
    },

    /**
     * Check for open hand gesture (all 5 fingers extended)
     */
    isOpenHand(landmarks) {
        const extended = this.getExtendedFingers(landmarks);
        // At least 4 fingers extended (thumb detection can be tricky)
        const count = extended.filter(e => e).length;
        return count >= 4;
    },

    /**
     * Check for peace sign (index + middle extended, others closed)
     */
    isPeaceSign(landmarks) {
        const extended = this.getExtendedFingers(landmarks);
        // Index and middle extended, ring and pinky closed
        return extended[1] && extended[2] && !extended[3] && !extended[4];
    },

    /**
     * Check for ILY sign (thumb + index + pinky extended)
     */
    isILYSign(landmarks) {
        const extended = this.getExtendedFingers(landmarks);
        // Thumb, index, pinky extended; middle and ring closed
        return extended[0] && extended[1] && !extended[2] && !extended[3] && extended[4];
    },

    /**
     * Classify the current gesture
     * @param {Array} landmarks
     * @returns {string} - Gesture type
     */
    classifyGesture(landmarks) {
        if (!landmarks || landmarks.length < 21) {
            return this.GESTURES.NONE;
        }

        // Priority order: ILY > Peace > Open Hand
        if (this.isILYSign(landmarks)) {
            return this.GESTURES.ILY_SIGN;
        }
        if (this.isPeaceSign(landmarks)) {
            return this.GESTURES.PEACE_SIGN;
        }
        if (this.isOpenHand(landmarks)) {
            return this.GESTURES.OPEN_HAND;
        }

        return this.GESTURES.NONE;
    },

    /**
     * Process gesture with debouncing
     * @param {Array} landmarks
     * @returns {object} - { gesture, isNew, isConfirmed }
     */
    processGesture(landmarks) {
        const detectedGesture = this.classifyGesture(landmarks);
        const now = Date.now();

        if (detectedGesture !== this.currentGesture) {
            // New gesture detected
            this.currentGesture = detectedGesture;
            this.gestureStartTime = now;
            return {
                gesture: detectedGesture,
                isNew: true,
                isConfirmed: false
            };
        }

        // Same gesture - check if confirmed
        const duration = now - this.gestureStartTime;
        const isConfirmed = duration >= this.gestureConfirmTime;

        return {
            gesture: detectedGesture,
            isNew: false,
            isConfirmed
        };
    },

    /**
     * Reset gesture state
     */
    reset() {
        this.currentGesture = this.GESTURES.NONE;
        this.gestureStartTime = 0;
    }
};
