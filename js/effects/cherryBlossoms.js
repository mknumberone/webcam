/* ========================================
   CHERRY BLOSSOMS EFFECT
   Particle system for hoa đào
   ======================================== */

const CherryBlossoms = {
    particles: [],
    group: null,
    isActive: false,
    bloomIntensity: 0,
    targetIntensity: 0,

    // Configuration
    config: {
        maxParticles: 500,
        spawnRate: 10,
        colors: [0xffb3c6, 0xffe5ec, 0xff8fab, 0xffc2d1],
        petalSize: { min: 0.03, max: 0.08 },
        fallSpeed: { min: 0.002, max: 0.005 },
        windStrength: 0.003,
        rotationSpeed: 0.02,
        spreadRadius: 5
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

        // Random starting position (above camera view)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.config.spreadRadius;

        petal.position.set(
            Math.cos(angle) * radius,
            3 + Math.random() * 3,
            Math.sin(angle) * radius
        );

        // Random rotation
        petal.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Custom properties for animation
        petal.userData = {
            velocity: {
                x: THREE.MathUtils.randFloatSpread(0.01),
                y: -THREE.MathUtils.randFloat(
                    this.config.fallSpeed.min,
                    this.config.fallSpeed.max
                ),
                z: THREE.MathUtils.randFloatSpread(0.01)
            },
            rotSpeed: {
                x: THREE.MathUtils.randFloatSpread(this.config.rotationSpeed),
                y: THREE.MathUtils.randFloatSpread(this.config.rotationSpeed),
                z: THREE.MathUtils.randFloatSpread(this.config.rotationSpeed)
            },
            windPhase: Math.random() * Math.PI * 2,
            life: 1.0
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
    },

    /**
     * Trigger instant bloom burst
     */
    burst() {
        // Spawn many petals at once
        for (let i = 0; i < 50; i++) {
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

        // Spawn new petals based on intensity
        if (this.bloomIntensity > 0.1) {
            const spawnCount = Math.floor(this.config.spawnRate * this.bloomIntensity);
            for (let i = 0; i < spawnCount; i++) {
                if (Math.random() < 0.3) {
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

            // Apply velocity
            petal.position.x += data.velocity.x + windOffset;
            petal.position.y += data.velocity.y;
            petal.position.z += data.velocity.z;

            // Apply rotation
            petal.rotation.x += data.rotSpeed.x;
            petal.rotation.y += data.rotSpeed.y;
            petal.rotation.z += data.rotSpeed.z;

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
