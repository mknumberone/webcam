/* ========================================
   FIREWORKS EFFECT
   Particle burst for celebrations
   ======================================== */

const Fireworks = {
    group: null,
    bursts: [],
    isActive: false,

    // Configuration
    config: {
        particleCount: 100,
        burstRadius: 0.8,
        colors: [0xffd700, 0xff6b6b, 0xff8fab, 0xffb3c6, 0xf4a300],
        gravity: 0.001,
        fadeSpeed: 0.015,
        trailLength: 5
    },

    /**
     * Initialize fireworks
     * @param {THREE.Scene} scene
     */
    init(scene) {
        this.group = new THREE.Group();
        this.group.name = 'fireworks';
        scene.add(this.group);
    },

    /**
     * Create a firework burst
     * @param {THREE.Vector3} position
     */
    createBurst(position = new THREE.Vector3(0, 1, 0)) {
        const burst = {
            particles: [],
            age: 0
        };

        const particleGeometry = new THREE.SphereGeometry(0.02, 6, 6);

        for (let i = 0; i < this.config.particleCount; i++) {
            const color = this.config.colors[
                Math.floor(Math.random() * this.config.colors.length)
            ];

            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            });

            const particle = new THREE.Mesh(particleGeometry, material);
            particle.position.copy(position);

            // Random velocity in sphere
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const speed = 0.02 + Math.random() * 0.03;

            particle.userData = {
                velocity: new THREE.Vector3(
                    Math.sin(theta) * Math.cos(phi) * speed,
                    Math.sin(theta) * Math.sin(phi) * speed,
                    Math.cos(theta) * speed
                ),
                originalColor: color
            };

            this.group.add(particle);
            burst.particles.push(particle);
        }

        this.bursts.push(burst);
    },

    /**
     * Trigger multiple bursts
     */
    celebrate() {
        // Create multiple bursts at different positions
        const positions = [
            new THREE.Vector3(-1, 1.5, 0),
            new THREE.Vector3(1, 1.5, 0),
            new THREE.Vector3(0, 2, 0),
            new THREE.Vector3(-0.5, 1, -0.5),
            new THREE.Vector3(0.5, 1, -0.5)
        ];

        positions.forEach((pos, i) => {
            setTimeout(() => this.createBurst(pos), i * 150);
        });

        this.isActive = true;
    },

    /**
     * Create a big burst explosion (for fist gesture)
     */
    bigBurst() {
        // Many more bursts at varied positions
        const positions = [];
        for (let i = 0; i < 15; i++) {
            positions.push(new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(3),
                1 + Math.random() * 2,
                THREE.MathUtils.randFloatSpread(2)
            ));
        }

        // Store original config
        const originalCount = this.config.particleCount;
        this.config.particleCount = 150; // More particles per burst

        positions.forEach((pos, i) => {
            setTimeout(() => this.createBurst(pos), i * 100);
        });

        // Restore after spawning
        setTimeout(() => {
            this.config.particleCount = originalCount;
        }, positions.length * 100 + 50);

        this.isActive = true;
    },

    /**
     * Multi-color confetti effect (for OK gesture)
     */
    multiColor() {
        // Neon rainbow colors
        const neonColors = [
            0x00ffff, // Cyan
            0xff00ff, // Magenta
            0xffff00, // Yellow
            0x00ff88, // Green
            0xff6600, // Orange
            0xbf00ff, // Purple
            0xff1744  // Red
        ];

        // Store original colors
        const originalColors = [...this.config.colors];
        this.config.colors = neonColors;

        // Create spiral pattern
        const positions = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 4;
            const radius = 0.3 + (i / 20) * 1.5;
            positions.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0.5 + (i / 20) * 2,
                Math.sin(angle) * radius
            ));
        }

        positions.forEach((pos, i) => {
            setTimeout(() => this.createBurst(pos), i * 80);
        });

        // Restore original colors after spawning
        setTimeout(() => {
            this.config.colors = originalColors;
        }, positions.length * 80 + 50);

        this.isActive = true;
    },

    /**
     * Update fireworks
     * @param {number} deltaTime
     */
    update(deltaTime) {
        const toRemove = [];

        for (let b = 0; b < this.bursts.length; b++) {
            const burst = this.bursts[b];
            burst.age += deltaTime;

            let allDead = true;

            for (const particle of burst.particles) {
                const data = particle.userData;

                // Apply velocity
                particle.position.add(data.velocity);

                // Apply gravity
                data.velocity.y -= this.config.gravity;

                // Fade out
                particle.material.opacity -= this.config.fadeSpeed;

                // Scale down
                const scale = Math.max(0, particle.material.opacity);
                particle.scale.set(scale, scale, scale);

                if (particle.material.opacity > 0) {
                    allDead = false;
                }
            }

            if (allDead) {
                toRemove.push(b);
            }
        }

        // Remove dead bursts
        for (let i = toRemove.length - 1; i >= 0; i--) {
            const burst = this.bursts[toRemove[i]];
            for (const particle of burst.particles) {
                this.group.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            }
            this.bursts.splice(toRemove[i], 1);
        }

        if (this.bursts.length === 0) {
            this.isActive = false;
        }
    },

    /**
     * Clear all fireworks
     */
    clear() {
        for (const burst of this.bursts) {
            for (const particle of burst.particles) {
                this.group.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            }
        }
        this.bursts = [];
        this.isActive = false;
    }
};
