/* ========================================
   NAME DISPLAY EFFECT
   "Chúc Mừng Năm Mới" + Recipient Name
   ======================================== */

const NameDisplay = {
    group: null,
    greetingMesh: null,
    nameMesh: null,
    recipientName: '',
    isActive: false,
    targetScale: 0,
    currentScale: 0,
    sparkles: [],

    // Configuration
    config: {
        greeting: 'Chúc Mừng Năm Mới',
        greetingSize: 0.3,
        nameSize: 0.5,
        color: 0xffd700,
        sparkleCount: 30,
        position: { x: 0, y: 0.5, z: 0 }
    },

    /**
     * Initialize name display
     * @param {THREE.Scene} scene
     */
    init(scene) {
        this.group = new THREE.Group();
        this.group.name = 'nameDisplay';
        this.group.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        scene.add(this.group);
    },

    /**
     * Set recipient name
     * @param {string} name
     */
    setName(name) {
        this.recipientName = name || 'Bạn';
        this.createTextMeshes();
    },

    /**
     * Create text meshes using canvas
     */
    createTextMeshes() {
        // Clear existing meshes
        this.clearMeshes();

        // Create greeting text
        this.greetingMesh = this.createTextPlane(
            this.config.greeting,
            this.config.greetingSize,
            '#ff6b6b',
            0.8
        );
        this.greetingMesh.position.y = 0.5;
        this.group.add(this.greetingMesh);

        // Create name text
        this.nameMesh = this.createTextPlane(
            this.recipientName,
            this.config.nameSize,
            '#ffd700',
            1.2
        );
        this.nameMesh.position.y = -0.1;
        this.group.add(this.nameMesh);

        // Create decorative line
        this.createDecoLine();

        // Create sparkles
        this.createSparkles();
    },

    /**
     * Create a text plane mesh
     */
    createTextPlane(text, fontSize, color, width) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Text style
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(fontSize * 200)}px "Be Vietnam Pro", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.shadowColor = color;
        ctx.shadowBlur = 30;

        ctx.fillText(text, 512, 128);

        // Create texture and mesh
        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(width, width * 0.25);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(0, 0, 0);
        return mesh;
    },

    /**
     * Create decorative line between texts
     */
    createDecoLine() {
        const geometry = new THREE.PlaneGeometry(0.8, 0.01);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.8
        });

        this.decoLine = new THREE.Mesh(geometry, material);
        this.decoLine.position.y = 0.2;
        this.decoLine.scale.set(0, 1, 1);
        this.group.add(this.decoLine);
    },

    /**
     * Create sparkle particles
     */
    createSparkles() {
        const sparkleGeometry = new THREE.SphereGeometry(0.02, 8, 8);

        for (let i = 0; i < this.config.sparkleCount; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xffd700 : 0xff6b6b,
                transparent: true,
                opacity: 0
            });

            const sparkle = new THREE.Mesh(sparkleGeometry, material);

            // Random position around text
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.5 + Math.random() * 0.5;

            sparkle.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 1,
                Math.sin(angle) * 0.3
            );

            sparkle.userData = {
                originalPos: sparkle.position.clone(),
                phase: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 2
            };

            this.sparkles.push(sparkle);
            this.group.add(sparkle);
        }
    },

    /**
     * Clear existing meshes
     */
    clearMeshes() {
        if (this.greetingMesh) {
            this.group.remove(this.greetingMesh);
            this.greetingMesh.geometry.dispose();
            this.greetingMesh.material.dispose();
        }
        if (this.nameMesh) {
            this.group.remove(this.nameMesh);
            this.nameMesh.geometry.dispose();
            this.nameMesh.material.dispose();
        }
        if (this.decoLine) {
            this.group.remove(this.decoLine);
            this.decoLine.geometry.dispose();
            this.decoLine.material.dispose();
        }
        for (const sparkle of this.sparkles) {
            this.group.remove(sparkle);
            sparkle.geometry.dispose();
            sparkle.material.dispose();
        }
        this.sparkles = [];
    },

    /**
     * Activate display
     * @param {boolean} active
     */
    setActive(active) {
        this.targetScale = active ? 1 : 0;
        this.isActive = active;
    },

    /**
     * Update animation
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    update(deltaTime, elapsedTime) {
        // Scale animation
        this.currentScale += (this.targetScale - this.currentScale) * 0.06;

        if (this.greetingMesh && this.nameMesh) {
            const scale = this.currentScale;

            // Staggered appearance
            const greetingScale = Math.min(1, scale * 1.5);
            const nameScale = Math.max(0, (scale - 0.3) * 1.5);
            const lineScale = Math.max(0, (scale - 0.2) * 1.5);

            this.greetingMesh.scale.set(greetingScale, greetingScale, greetingScale);
            this.nameMesh.scale.set(nameScale, nameScale, nameScale);

            if (this.decoLine) {
                this.decoLine.scale.x = lineScale;
            }
        }

        if (this.isActive && this.currentScale > 0.1) {
            // Floating animation
            this.group.position.y = this.config.position.y +
                Math.sin(elapsedTime * 1.2) * 0.05;

            // Update sparkles
            for (const sparkle of this.sparkles) {
                const data = sparkle.userData;

                // Twinkling
                sparkle.material.opacity =
                    (Math.sin(elapsedTime * data.speed + data.phase) + 1) * 0.4 * this.currentScale;

                // Subtle movement
                sparkle.position.y = data.originalPos.y +
                    Math.sin(elapsedTime * data.speed + data.phase) * 0.05;
            }
        } else {
            // Hide sparkles
            for (const sparkle of this.sparkles) {
                sparkle.material.opacity = 0;
            }
        }
    },

    /**
     * Reset display
     */
    reset() {
        this.targetScale = 0;
        this.currentScale = 0;
        this.isActive = false;
        if (this.greetingMesh) {
            this.greetingMesh.scale.set(0, 0, 0);
        }
        if (this.nameMesh) {
            this.nameMesh.scale.set(0, 0, 0);
        }
    }
};
