/* ========================================
   CALLIGRAPHY EFFECT
   3D Chinese character "Phúc" (福)
   ======================================== */

const Calligraphy = {
    mesh: null,
    group: null,
    isActive: false,
    targetScale: 0,
    currentScale: 0,
    rotationY: 0,

    // Configuration
    config: {
        text: '福',  // Phúc character
        size: 1.5,
        depth: 0.15,
        color: 0xffd700,
        emissive: 0xf4a300,
        position: { x: 0, y: 0.5, z: 0 },
        floatAmplitude: 0.1,
        floatSpeed: 1.5
    },

    /**
     * Initialize calligraphy
     * @param {THREE.Scene} scene
     */
    init(scene) {
        this.group = new THREE.Group();
        this.group.name = 'calligraphy';
        this.group.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        scene.add(this.group);

        // Create the character using canvas texture
        this.createCharacter();
    },

    /**
     * Create 3D character mesh
     */
    createCharacter() {
        // Create canvas for text texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Background (transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw character
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 400px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add shadow for depth
        ctx.shadowColor = '#f4a300';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillText(this.config.text, 256, 270);

        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create geometry (plane)
        const geometry = new THREE.PlaneGeometry(this.config.size, this.config.size);

        // Create material with transparency
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            metalness: 0.8,
            roughness: 0.2,
            emissive: new THREE.Color(this.config.emissive),
            emissiveIntensity: 0.3
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.set(0, 0, 0);

        // Add glow ring
        this.createGlowRing();

        this.group.add(this.mesh);
    },

    /**
     * Create glowing ring around character
     */
    createGlowRing() {
        const ringGeometry = new THREE.RingGeometry(0.9, 1.0, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.position.z = -0.01;
        this.group.add(this.ring);

        // Outer glow
        const glowGeometry = new THREE.RingGeometry(0.95, 1.2, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.position.z = -0.02;
        this.group.add(this.glow);
    },

    /**
     * Show the calligraphy
     * @param {boolean} show
     */
    setActive(show) {
        this.targetScale = show ? 1 : 0;
        this.isActive = show;
    },

    /**
     * Update animation
     * @param {number} deltaTime
     * @param {number} elapsedTime
     */
    update(deltaTime, elapsedTime) {
        // Scale animation
        this.currentScale += (this.targetScale - this.currentScale) * 0.08;

        if (this.mesh) {
            // Apply scale with elastic effect
            const elasticScale = this.currentScale * (1 + Math.sin(elapsedTime * 5) * 0.02);
            this.mesh.scale.set(elasticScale, elasticScale, elasticScale);
            this.ring.scale.set(elasticScale, elasticScale, 1);
            this.glow.scale.set(elasticScale, elasticScale, 1);
        }

        if (this.isActive && this.currentScale > 0.1) {
            // Floating animation
            this.group.position.y = this.config.position.y +
                Math.sin(elapsedTime * this.config.floatSpeed) * this.config.floatAmplitude;


            // Slow rotation
            this.rotationY += deltaTime * 0.3;
            this.group.rotation.y = Math.sin(this.rotationY) * 0.2;

            // Pulsing glow
            if (this.glow) {
                this.glow.material.opacity = 0.2 + Math.sin(elapsedTime * 3) * 0.1;
            }
            if (this.ring) {
                this.ring.rotation.z = elapsedTime * 0.5;
            }
        }
    },

    /**
     * Reset to initial state
     */
    reset() {
        this.targetScale = 0;
        this.currentScale = 0;
        this.isActive = false;
        if (this.mesh) {
            this.mesh.scale.set(0, 0, 0);
        }
    }
};
