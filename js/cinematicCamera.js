/* ========================================
   CINEMATIC CAMERA
   Orbiting and dynamic camera effects
   ======================================== */

const CinematicCamera = {
    camera: null,
    controls: null,
    isOrbiting: false,
    orbitAngle: 0,
    targetPosition: new THREE.Vector3(0, 0, 5),
    targetLookAt: new THREE.Vector3(0, 0.5, 0),
    currentLookAt: new THREE.Vector3(0, 0.5, 0),

    // Configuration
    config: {
        defaultPosition: new THREE.Vector3(0, 0.5, 4),
        orbitRadius: 4,
        orbitHeight: 1,
        orbitSpeed: 0.3,
        lerpSpeed: 0.03,
        shakeDuration: 500,
        shakeIntensity: 0.05
    },

    // Shake state
    shakeState: {
        active: false,
        startTime: 0,
        intensity: 0
    },

    /**
     * Initialize camera
     * @param {THREE.PerspectiveCamera} camera
     */
    init(camera) {
        this.camera = camera;
        this.camera.position.copy(this.config.defaultPosition);
        this.camera.lookAt(this.targetLookAt);
    },

    /**
     * Set orbit mode
     * @param {boolean} enable
     */
    setOrbit(enable) {
        this.isOrbiting = enable;
    },

    /**
     * Trigger camera shake
     * @param {number} intensity
     */
    shake(intensity = 1) {
        this.shakeState = {
            active: true,
            startTime: Date.now(),
            intensity: intensity * this.config.shakeIntensity
        };
    },

    /**
     * Focus on a specific point
     * @param {THREE.Vector3} point
     * @param {number} distance
     */
    focusOn(point, distance = 3) {
        this.targetLookAt.copy(point);
        this.targetPosition.set(
            point.x,
            point.y + 0.3,
            point.z + distance
        );
    },

    /**
     * Return to default position
     */
    resetPosition() {
        this.targetPosition.copy(this.config.defaultPosition);
        this.targetLookAt.set(0, 0.5, 0);
        this.isOrbiting = false;
    },

    /**
     * Update camera each frame
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    update(deltaTime, elapsedTime) {
        if (!this.camera) return;

        // Orbit animation
        if (this.isOrbiting) {
            this.orbitAngle += this.config.orbitSpeed * deltaTime;

            this.targetPosition.x = Math.sin(this.orbitAngle) * this.config.orbitRadius;
            this.targetPosition.y = this.config.orbitHeight + Math.sin(elapsedTime * 0.5) * 0.2;
            this.targetPosition.z = Math.cos(this.orbitAngle) * this.config.orbitRadius;
        }

        // Smooth position interpolation
        this.camera.position.lerp(this.targetPosition, this.config.lerpSpeed);

        // Smooth look-at interpolation
        this.currentLookAt.lerp(this.targetLookAt, this.config.lerpSpeed);
        this.camera.lookAt(this.currentLookAt);

        // Camera shake
        if (this.shakeState.active) {
            const elapsed = Date.now() - this.shakeState.startTime;

            if (elapsed < this.config.shakeDuration) {
                const decay = 1 - elapsed / this.config.shakeDuration;
                const intensity = this.shakeState.intensity * decay;

                this.camera.position.x += (Math.random() - 0.5) * intensity;
                this.camera.position.y += (Math.random() - 0.5) * intensity;
            } else {
                this.shakeState.active = false;
            }
        }
    },

    /**
     * Handle window resize
     * @param {number} width
     * @param {number} height
     */
    onResize(width, height) {
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }
};
