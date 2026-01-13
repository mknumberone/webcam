/* ========================================
   CHERRY BLOSSOMS EFFECT
   Particle system for hoa đào - follows hand
   ======================================== */

const CherryBlossoms = {
    particles: [],
    group: null,
    isActive: false,
    bloomIntensity: 0,
    targetIntensity: 0,

    // Hand position (normalized 0-1)
    handX: 0.5,
    handY: 0.5,

    // Configuration - DENSER particles
    config: {
        maxParticles: 1500,      // Increased from 500
        spawnRate: 30,           // Increased from 10
        colors: [0xffb3c6, 0xffe5ec, 0xff8fab, 0xffc2d1, 0xff69b4, 0xffccd5],
        petalSize: { min: 0.02, max: 0.1 },
        fallSpeed: { min: 0.001, max: 0.004 },
        windStrength: 0.005,
        rotationSpeed: 0.03,
        spreadRadius: 3,
        handInfluence: 0.8      // How much hand affects spawn position
    },

    /**
     * Initialize the particle system
     * @param {THREE.Scene} scene
     */
    init(scene) {
        this.group = new THREE.Group();
        this.group.name = 'cherryBlossoms';
        scene.add(this.group);

        // Create initial batch of petals
        this.createPetalGeometry();
    },

    /**
     * Create petal geometry template
     */
    createPetalGeometry() {
        // Simple petal shape using a small plane
        this.petalGeometry = new THREE.CircleGeometry(1, 5);

        // Create materials for different petal colors
        this.petalMaterials = this.config.colors.map(color =>
            new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            })
        );
    },

    /**
     * Set hand position for petals to follow
     * @param {number} x - normalized 0-1
     * @param {number} y - normalized 0-1
     */
    setHandPosition(x, y) {
        this.handX = x;
        this.handY = y;
    },

    /**
     * Convert normalized hand position to 3D world coordinates
     */
    handTo3D() {
        // Map hand position to 3D space
        // x: -3 to 3, y: -1 to 3
        return {
            x: (this.handX - 0.5) * 6,
            y: (1 - this.handY) * 4 - 1
        };
    },

    /**
     * Spawn a new petal
     */
    spawnPetal() {
        if (this.particles.length >= this.config.maxParticles) return;

        const size = THREE.MathUtils.randFloat(
            this.config.petalSize.min,
            this.config.petalSize.max
        );

        const material = this.petalMaterials[
            Math.floor(Math.random() * this.petalMaterials.length)
        ].clone();

        const petal = new THREE.Mesh(this.petalGeometry.clone(), material);
        petal.scale.set(size, size * 0.7, size);

        // Get hand position in 3D
        const handPos = this.handTo3D();

        // Spawn around hand position with some randomness
        const useHand = Math.random() < this.config.handInfluence;

        if (useHand) {
            // Spawn near hand
            const spreadX = THREE.MathUtils.randFloatSpread(2);
            const spreadY = THREE.MathUtils.randFloat(0, 2);
            const spreadZ = THREE.MathUtils.randFloatSpread(2);

            petal.position.set(
                handPos.x + spreadX,
                handPos.y + spreadY + 1,
                spreadZ
            );
        } else {
            // Random spawn from above
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * this.config.spreadRadius;

            petal.position.set(
                Math.cos(angle) * radius,
                3 + Math.random() * 3,
                Math.sin(angle) * radius
            );
        }

        // Random rotation
        petal.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Custom properties for animation
        petal.userData = {
            velocity: {
                x: THREE.MathUtils.randFloatSpread(0.015),
                y: -THREE.MathUtils.randFloat(
                    this.config.fallSpeed.min,
                    this.config.fallSpeed.max
                ),
                z: THREE.MathUtils.randFloatSpread(0.015)
            },
            rotSpeed: {
                x: THREE.MathUtils.randFloatSpread(this.config.rotationSpeed),
                y: THREE.MathUtils.randFloatSpread(this.config.rotationSpeed),
                z: THREE.MathUtils.randFloatSpread(this.config.rotationSpeed)
            },
            windPhase: Math.random() * Math.PI * 2,
            life: 1.0,
            followHand: useHand
        };

        this.group.add(petal);
        this.particles.push(petal);
    },

    /**
     * Activate bloom effect
     * @param {boolean} active
     */
    setActive(active) {
        this.targetIntensity = active ? 1 : 0;
        if (!active) {
            this.resetColor();
        }
    },

    /**
     * Set custom color for petals
     * @param {number} color - hex color
     */
    setColor(color) {
        // Update existing materials
        this.petalMaterials = [color, color, color, color].map(c =>
            new THREE.MeshBasicMaterial({
                color: c,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            })
        );
    },

    /**
     * Reset to default cherry blossom colors
     */
    resetColor() {
        this.petalMaterials = this.config.colors.map(color =>
            new THREE.MeshBasicMaterial({
                color: color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            })
        );
    },

    /**
     * Trigger instant bloom burst
     */
    burst() {
        // Spawn many petals at once around hand
        for (let i = 0; i < 100; i++) {
            this.spawnPetal();
        }
    },

    /**
     * Update particles each frame
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    update(deltaTime, elapsedTime) {
        // Smooth intensity transition
        this.bloomIntensity += (this.targetIntensity - this.bloomIntensity) * 0.05;

        // Get current hand position
        const handPos = this.handTo3D();

        // Spawn new petals based on intensity - MORE petals
        if (this.bloomIntensity > 0.1) {
            const spawnCount = Math.floor(this.config.spawnRate * this.bloomIntensity);
            for (let i = 0; i < spawnCount; i++) {
                if (Math.random() < 0.5) {  // Increased spawn chance
                    this.spawnPetal();
                }
            }
        }

        // Update existing particles
        const toRemove = [];

        for (let i = 0; i < this.particles.length; i++) {
            const petal = this.particles[i];
            const data = petal.userData;

            // Wind effect
            const windOffset = Math.sin(elapsedTime * 2 + data.windPhase) * this.config.windStrength;

            // If petal follows hand, gently pull towards hand
            if (data.followHand) {
                const pullStrength = 0.002;
                data.velocity.x += (handPos.x - petal.position.x) * pullStrength;
                data.velocity.y += (handPos.y - petal.position.y) * pullStrength * 0.5;
            }

            // Apply velocity
            petal.position.x += data.velocity.x + windOffset;
            petal.position.y += data.velocity.y;
            petal.position.z += data.velocity.z;

            // Apply rotation
            petal.rotation.x += data.rotSpeed.x;
            petal.rotation.y += data.rotSpeed.y;
            petal.rotation.z += data.rotSpeed.z;

            // Add slight drift
            data.velocity.x *= 0.998;
            data.velocity.z *= 0.998;

            // Fade out when below ground
            if (petal.position.y < -2) {
                data.life -= 0.02;
                petal.material.opacity = data.life * 0.9;

                if (data.life <= 0) {
                    toRemove.push(i);
                }
            }
        }

        // Remove dead particles
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const index = toRemove[i];
            const petal = this.particles[index];
            this.group.remove(petal);
            petal.geometry.dispose();
            petal.material.dispose();
            this.particles.splice(index, 1);
        }
    },

    /**
     * Clear all particles
     */
    clear() {
        for (const petal of this.particles) {
            this.group.remove(petal);
            petal.geometry.dispose();
            petal.material.dispose();
        }
        this.particles = [];
        this.bloomIntensity = 0;
        this.targetIntensity = 0;
    }
};
