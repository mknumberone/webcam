/* ========================================
   THREE.JS SCENE
   Main 3D scene setup and management
   ======================================== */

const Scene3D = {
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    isInitialized: false,

    // Background particles
    backgroundParticles: null,

    /**
     * Initialize the 3D scene
     * @param {HTMLCanvasElement} canvas
     */
    init(canvas) {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a0a0a);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0.5, 4);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Create clock
        this.clock = new THREE.Clock();

        // Setup lighting
        this.setupLighting();

        // Setup background
        this.setupBackground();

        // Initialize effects
        CherryBlossoms.init(this.scene);
        Calligraphy.init(this.scene);
        NameDisplay.init(this.scene);
        Fireworks.init(this.scene);
        CinematicCamera.init(this.camera);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());

        this.isInitialized = true;
    },

    /**
     * Setup scene lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xfff0e0, 1);
        mainLight.position.set(5, 10, 5);
        this.scene.add(mainLight);

        // Accent light (red/warm)
        const accentLight = new THREE.PointLight(0xff6b6b, 0.5, 10);
        accentLight.position.set(-3, 2, 2);
        this.scene.add(accentLight);

        // Gold rim light
        const rimLight = new THREE.PointLight(0xffd700, 0.3, 10);
        rimLight.position.set(3, 0, -2);
        this.scene.add(rimLight);
    },

    /**
     * Setup background with floating particles
     */
    setupBackground() {
        // Create starfield/bokeh background
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const colorOptions = [
            new THREE.Color(0xffd700),
            new THREE.Color(0xff6b6b),
            new THREE.Color(0xffb3c6),
            new THREE.Color(0xffffff)
        ];

        for (let i = 0; i < particleCount; i++) {
            // Position in a sphere around the scene
            const radius = 5 + Math.random() * 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Random color
            const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Random size
            sizes[i] = 0.02 + Math.random() * 0.05;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        this.backgroundParticles = new THREE.Points(geometry, material);
        this.scene.add(this.backgroundParticles);
    },

    /**
     * Animation loop
     */
    animate() {
        if (!this.isInitialized) return;

        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        // Update background particles
        if (this.backgroundParticles) {
            this.backgroundParticles.rotation.y += 0.0002;
        }

        // Update effects
        CherryBlossoms.update(deltaTime, elapsedTime);
        Calligraphy.update(deltaTime, elapsedTime);
        NameDisplay.update(deltaTime, elapsedTime);
        Fireworks.update(deltaTime);
        CinematicCamera.update(deltaTime, elapsedTime);

        // Render
        this.renderer.render(this.scene, this.camera);

        // Continue loop
        requestAnimationFrame(() => this.animate());
    },

    /**
     * Handle window resize
     */
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        CinematicCamera.onResize(width, height);
    },

    /**
     * Start animation loop
     */
    start() {
        this.animate();
    }
};
