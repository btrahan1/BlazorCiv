window.CivEngine = {
    scene: null,
    camera: null,
    renderer: null,
    hexRadius: 5,
    hexMesh: null,

    // Config
    width: 0,
    height: 0,

    // Interaction
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    highlightMesh: null,
    assets: {},

    init: async function (containerId, dotNetRef) {
        console.log("Initializing CivEngine...");
        this.dotNetRef = dotNetRef;

        await this.loadAssets();

        const container = document.getElementById(containerId);
        if (!container) return;

        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 1000);
        this.camera.position.set(0, 50, 40);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        container.appendChild(this.renderer.domElement);

        // Lights
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(50, 100, 50);
        this.scene.add(dirLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

        // Controls
        const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;

        // Interaction Inputs
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / this.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / this.height) * 2 + 1;
        });

        // CLICK LISTENER (Left Click)
        container.addEventListener('click', (e) => {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.hexMesh);

            if (intersects.length > 0) {
                const instanceId = intersects[0].instanceId;
                const data = this.hexMesh.userData[instanceId];
                if (this.dotNetRef) {
                    this.dotNetRef.invokeMethodAsync('OnHexClicked', data.q, data.r);
                }
            }
        });

        // RIGHT CLICK LISTENER
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Prevent browser menu

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.hexMesh);

            if (intersects.length > 0) {
                const instanceId = intersects[0].instanceId;
                const data = this.hexMesh.userData[instanceId];
                if (this.dotNetRef) {
                    this.dotNetRef.invokeMethodAsync('OnHexRightClicked', data.q, data.r);
                }
            }
        });

        // Highlight marker
        const hlGeo = new THREE.CylinderGeometry(this.hexRadius * 0.9, this.hexRadius * 0.9, 1.2, 6);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });
        this.highlightMesh = new THREE.Mesh(hlGeo, hlMat);
        this.highlightMesh.visible = false;
        this.scene.add(this.highlightMesh);

        // Loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            this.raycast();
            this.renderer.render(this.scene, this.camera);
        };
        animate();

        window.addEventListener('resize', () => {
            this.width = container.clientWidth;
            this.height = container.clientHeight;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        });
    },

    loadAssets: async function () {
        const files = [
            "CivVillage", "CivSettler", "CivWarrior", "CivArcher", "CivBarbarian",
            "CivGranary", "CivBarracks", "CivMonument", "CivWheat", "CivIron", "CivBarbCamp",
            "CivHorseChariot", "CivSwordsman",
            "CivGrass", "CivHill", "CivMountain", "CivSnow", "CivCoast",
            "CivWorker"
        ];

        console.log("Loading " + files.length + " assets...");

        for (const file of files) {
            try {
                const res = await fetch(`assets/${file}.json`);
                const json = await res.json();
                this.assets[file] = json;
            } catch (e) {
                console.error(`Failed to load asset: ${file}`, e);
            }
        }
        console.log("Assets loaded:", Object.keys(this.assets));
    },

    // ASSET RENDERER

    // ASSET RENDERER
    buildAsset: function (json, scale = 1.0) {
        const root = new THREE.Group();
        if (!json || !json.Parts) return root;

        json.Parts.forEach(part => {
            let geometry;
            switch (part.Shape) {
                case "Box": geometry = new THREE.BoxGeometry(1, 1, 1); break;
                case "Sphere": geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
                case "Cylinder": geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
                case "Cone": geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
                case "Torus": geometry = new THREE.TorusGeometry(0.4, 0.1, 8, 16); break;
                default: geometry = new THREE.BoxGeometry(1, 1, 1); break;
            }

            const color = parseInt(part.ColorHex.replace("#", "0x"));
            // Glow logic
            let material;
            if (part.Material === "Glow") {
                material = new THREE.MeshBasicMaterial({ color: color });
            } else {
                material = new THREE.MeshPhongMaterial({ color: color });
            }

            const mesh = new THREE.Mesh(geometry, material);

            // Transforms (Safe Defaults)
            const p = part.Position || [0, 0, 0];
            const r = part.Rotation || [0, 0, 0];
            const s = part.Scale || [1, 1, 1];

            mesh.position.set(p[0], p[1], p[2]);
            mesh.rotation.set(
                r[0] * Math.PI / 180,
                r[1] * Math.PI / 180,
                r[2] * Math.PI / 180
            );
            mesh.scale.set(s[0], s[1], s[2]);

            root.add(mesh);
        });

        // Normalize Scale
        // Village used 1.0. Units need 2.5 to look like game pieces.
        root.scale.set(scale, scale, scale);
        return root;
    },

    // BARBARIAN CAMP ASSET
    BARBARIAN_CAMP_JSON: {
        "Name": "BarbCamp", "Type": "Procedural",
        "Parts": [
            { "Id": "spike_1", "Shape": "Cone", "Position": [1.2, 0.5, 0.0], "Scale": [0.2, 1.0, 0.2], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "spike_2", "Shape": "Cone", "Position": [-1.2, 0.5, 0.0], "Scale": [0.2, 1.0, 0.2], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "spike_3", "Shape": "Cone", "Position": [0.0, 0.5, 1.2], "Scale": [0.2, 1.0, 0.2], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "spike_4", "Shape": "Cone", "Position": [0.0, 0.5, -1.2], "Scale": [0.2, 1.0, 0.2], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "skull_pole", "Shape": "Cylinder", "Position": [0.0, 0.8, 0.0], "Scale": [0.1, 1.5, 0.1], "ColorHex": "#A8A29E", "Material": "Leather" },
            { "Id": "skull", "Shape": "Sphere", "Position": [0.0, 1.6, 0.0], "Scale": [0.3, 0.3, 0.3], "ColorHex": "#F5F5F5", "Material": "Plastic" },
            { "Id": "fire", "Shape": "Sphere", "Position": [0.0, 0.2, 0.0], "Scale": [0.5, 0.5, 0.5], "ColorHex": "#EF4444", "Material": "Glow" }
        ]
    },

    hexMesh: null,
    campMeshes: [],
    resourceMeshes: [],

    renderMap: function (mapData) {
        if (this.hexMesh) this.scene.remove(this.hexMesh);
        this.campMeshes.forEach(m => this.scene.remove(m));
        this.campMeshes = [];
        this.resourceMeshes.forEach(m => this.scene.remove(m));
        this.resourceMeshes = [];

        console.log("Rendering Map from C# Data: " + mapData.length + " tiles.");

        const geometry = new THREE.CylinderGeometry(this.hexRadius, this.hexRadius, 1, 6);
        const material = new THREE.MeshPhongMaterial({ flatShading: true });

        this.hexMesh = new THREE.InstancedMesh(geometry, material, mapData.length);
        this.scene.add(this.hexMesh);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        // 1. Index Map for Neighbor Lookup
        // Key: "q,r", Value: Tile
        const tileMap = {};
        for (let i = 0; i < mapData.length; i++) {
            const t = mapData[i];
            tileMap[t.q + "," + t.r] = t;
        }

        // 2. Render Loop

        for (let i = 0; i < mapData.length; i++) {
            const tile = mapData[i];
            const pos = this.hexToPixel(tile.q, tile.r);

            // Visuals
            let terrainJson = null;
            let h = 0.5; // Base height
            let c = 0x4caf50; // Default color (Grass)

            if (tile.type === "Ocean") { terrainJson = this.assets["CivCoast"]; h = 0.5; c = 0x2196f3; }
            else if (tile.type === "Coast") { terrainJson = this.assets["CivCoast"]; h = 0.5; c = 0x4fc3f7; }
            else if (tile.type === "Hill") { terrainJson = this.assets["CivHill"]; h = 1.0; c = 0x8bc34a; }
            else if (tile.type === "Mountain") { terrainJson = this.assets["CivMountain"]; h = 2.0; c = 0x8d6e63; }
            else if (tile.type === "Snow") { terrainJson = this.assets["CivSnow"]; h = 1.0; c = 0xffffff; }
            else { terrainJson = this.assets["CivGrass"]; h = 0.5; c = 0x4caf50; }

            // Render Terrain Mesh
            if (terrainJson) {
                // Scaling factor to fill the hex
                // User validated 9.5 as the preferred scale for full coverage.
                const terrainScale = 9.5;

                const terrain = this.buildAsset(terrainJson, terrainScale);
                terrain.position.set(pos.x, 0, pos.z);
                terrain.rotation.y = Math.PI / 6;
                this.scene.add(terrain);
                // We aren't tracking terrain meshes for removal yet because we assume map is static or fully redrawn
                // But for now, let's just add to scene. Ideally we'd have a this.terrainMeshes array.
                this.hexMesh.visible = false; // Hide the base hex mesh since we are using models
            } else {
                // Fallback to Colored Hexes if no asset (shouldn't happen)
                dummy.position.set(pos.x, h / 2, pos.z);
                dummy.scale.set(1.0, h, 1.0); // Full size, no gaps
                dummy.rotation.set(0, Math.PI / 6, 0);
                dummy.updateMatrix();
                this.hexMesh.setMatrixAt(i, dummy.matrix);
                this.hexMesh.setColorAt(i, color.setHex(c));
            }

            // Re-calc height for props on top
            // Note: Our assets might have height built-in. 
            // We need to know "top" of asset.
            let propH = h;
            if (tile.type === "Hill") propH = 1.5;
            if (tile.type === "Mountain") propH = 3.0;

            // Barbarian Camp
            if (tile.hasCamp) {
                const camp = this.buildAsset(this.assets["CivBarbCamp"], 1.0);
                camp.position.set(pos.x, h, pos.z); // Sit on top of tile
                this.scene.add(camp);
                this.campMeshes.push(camp);
            }

            // Resources
            if (tile.resource === "Wheat") {
                const res = this.buildAsset(this.assets["CivWheat"], 0.8);
                res.position.set(pos.x, h, pos.z);
                this.scene.add(res);
                this.resourceMeshes.push(res);
            }
            if (tile.resource === "Iron") {
                const res = this.buildAsset(this.assets["CivIron"], 0.8);
                res.position.set(pos.x, h, pos.z);
                this.scene.add(res);
                this.resourceMeshes.push(res);
            }

            // Road Logic (Connected)
            if (tile.hasRoad) {
                // 1. Center Hub
                const roadMat = new THREE.MeshPhongMaterial({ color: 0x808080 });
                const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8), roadMat);
                hub.position.set(pos.x, h, pos.z);
                this.scene.add(hub);
                this.resourceMeshes.push(hub);

                // 2. Spokes to Neighbors
                const neighbors = [
                    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
                    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
                ];

                neighbors.forEach(n => {
                    const nQ = tile.q + n.q;
                    const nR = tile.r + n.r;
                    const neighbor = tileMap[nQ + "," + nR];

                    // Connect if neighbor has road OR is a City (Roads connect to cities)
                    if (neighbor && neighbor.hasRoad) {
                        const nPos = this.hexToPixel(nQ, nR);
                        const dx = nPos.x - pos.x;
                        const dz = nPos.z - pos.z;

                        const dist = Math.sqrt(dx * dx + dz * dz);
                        const angle = Math.atan2(dz, dx);

                        // Length = Half Distance + 20% Overlap
                        // This ensures segments meet in the middle regardless of hexRadius or scaling
                        const spokeLen = (dist / 2) * 1.2;

                        // Geometry: Thin box length = spokeLen
                        const poke = new THREE.Mesh(new THREE.BoxGeometry(spokeLen, 0.1, 0.6), roadMat); // Wider road

                        poke.position.set(pos.x, h, pos.z);
                        poke.rotation.y = -angle;
                        poke.translateX(spokeLen / 2);

                        this.scene.add(poke);
                        this.resourceMeshes.push(poke);
                    }
                });
            }

            // Height scaling
            dummy.position.set(pos.x, h / 2, pos.z);
            dummy.scale.set(0.95, h, 0.95);
            dummy.updateMatrix();

            this.hexMesh.setMatrixAt(i, dummy.matrix);

            // Set Color
            color.setHex(c);
            this.hexMesh.setColorAt(i, color);

            // Store User Data
            this.hexMesh.userData[i] = { q: tile.q, r: tile.r, type: tile.type };
        }

        this.hexMesh.instanceMatrix.needsUpdate = true;
        if (this.hexMesh.instanceColor) this.hexMesh.instanceColor.needsUpdate = true;
    },

    // UNIT ASSETS
    SETTLER_JSON: {
        "Name": "CivSettler", "Type": "Procedural",
        "Parts": [
            { "Id": "human_torso", "ParentId": null, "Shape": "Box", "Position": [0.0, 1.0, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.4, 0.5, 0.25], "ColorHex": "#7C2D12", "Material": "Leather", "Operation": "Union" },
            { "Id": "human_head", "ParentId": null, "Shape": "Sphere", "Position": [0.0, 1.4, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.22, 0.22, 0.22], "ColorHex": "#FFDBAC", "Material": "Plastic", "Operation": "Union" },
            { "Id": "hat_brim", "ParentId": null, "Shape": "Cylinder", "Position": [0.0, 1.45, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.35, 0.02, 0.35], "ColorHex": "#452719", "Material": "Leather", "Operation": "Union" },
            { "Id": "backpack", "ParentId": null, "Shape": "Box", "Position": [0.0, 1.1, -0.22], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.45, 0.6, 0.25], "ColorHex": "#5C4033", "Material": "Leather", "Operation": "Union" },
            { "Id": "bedroll", "ParentId": null, "Shape": "Cylinder", "Position": [0.0, 1.45, -0.22], "Rotation": [0.0, 0.0, 90.0], "Scale": [0.15, 0.5, 0.15], "ColorHex": "#A8A29E", "Material": "Leather", "Operation": "Union" },
            { "Id": "walking_stick", "ParentId": null, "Shape": "Cylinder", "Position": [-0.3, 0.8, 0.4], "Rotation": [10.0, 0.0, 0.0], "Scale": [0.04, 1.4, 0.04], "ColorHex": "#451A03", "Material": "Leather", "Operation": "Union" },
            { "Id": "wagon_bed", "ParentId": null, "Shape": "Box", "Position": [0.0, 0.4, -1.2], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.7, 0.1, 1.2], "ColorHex": "#78350F", "Material": "Leather", "Operation": "Union" },
            { "Id": "wagon_cover", "ParentId": null, "Shape": "Capsule", "Position": [0.0, 0.75, -1.2], "Rotation": [90.0, 0.0, 0.0], "Scale": [0.75, 1.3, 0.75], "ColorHex": "#F5F5DC", "Material": "Leather", "Operation": "Union" },
            { "Id": "wagon_wheel_fl", "ParentId": null, "Shape": "Cylinder", "Position": [0.4, 0.35, -0.7], "Rotation": [0.0, 0.0, 90.0], "Scale": [0.5, 0.1, 0.5], "ColorHex": "#3F2E3E", "Material": "Leather", "Operation": "Union" },
            { "Id": "wagon_wheel_fr", "ParentId": null, "Shape": "Cylinder", "Position": [-0.4, 0.35, -0.7], "Rotation": [0.0, 0.0, 90.0], "Scale": [0.5, 0.1, 0.5], "ColorHex": "#3F2E3E", "Material": "Leather", "Operation": "Union" },
            { "Id": "wagon_wheel_bl", "ParentId": null, "Shape": "Cylinder", "Position": [0.4, 0.35, -1.7], "Rotation": [0.0, 0.0, 90.0], "Scale": [0.5, 0.1, 0.5], "ColorHex": "#3F2E3E", "Material": "Leather", "Operation": "Union" },
            { "Id": "wagon_wheel_br", "ParentId": null, "Shape": "Cylinder", "Position": [-0.4, 0.35, -1.7], "Rotation": [0.0, 0.0, 90.0], "Scale": [0.5, 0.1, 0.5], "ColorHex": "#3F2E3E", "Material": "Leather", "Operation": "Union" }
        ]
    },

    ARCHER_JSON: {
        "Name": "CivArcher", "Type": "Procedural",
        "Parts": [
            { "Id": "torso", "Shape": "Box", "Position": [0.0, 1.0, 0.0], "Scale": [0.4, 0.5, 0.25], "ColorHex": "#166534", "Material": "Leather" },
            { "Id": "head", "Shape": "Sphere", "Position": [0.0, 1.4, 0.0], "Scale": [0.22, 0.22, 0.22], "ColorHex": "#FFDBAC", "Material": "Plastic" },
            { "Id": "hood", "Shape": "Cone", "Position": [0.0, 1.52, 0.0], "Rotation": [10.0, 0.0, 0.0], "Scale": [0.25, 0.2, 0.25], "ColorHex": "#14532D", "Material": "Leather" },
            { "Id": "leg_right", "Shape": "Capsule", "Position": [-0.12, 0.4, 0.0], "Scale": [0.15, 0.8, 0.15], "ColorHex": "#3F2E3E", "Material": "Leather" },
            { "Id": "leg_left", "Shape": "Capsule", "Position": [0.12, 0.4, 0.0], "Scale": [0.15, 0.8, 0.15], "ColorHex": "#3F2E3E", "Material": "Leather" },
            { "Id": "arm_holding_bow", "Shape": "Capsule", "Position": [-0.35, 1.2, 0.2], "Rotation": [-80.0, 0.0, 0.0], "Scale": [0.1, 0.5, 0.1], "ColorHex": "#FFDBAC", "Material": "Plastic" },
            { "Id": "arm_drawing_string", "Shape": "Capsule", "Position": [0.25, 1.2, 0.05], "Rotation": [-30.0, 45.0, 0.0], "Scale": [0.1, 0.45, 0.1], "ColorHex": "#FFDBAC", "Material": "Plastic" },
            { "Id": "bow_upper", "Shape": "Cylinder", "Position": [-0.4, 1.45, 0.4], "Rotation": [25.0, 0.0, 0.0], "Scale": [0.03, 0.6, 0.03], "ColorHex": "#78350F", "Material": "Leather" },
            { "Id": "bow_lower", "Shape": "Cylinder", "Position": [-0.4, 0.85, 0.4], "Rotation": [-25.0, 0.0, 0.0], "Scale": [0.03, 0.6, 0.03], "ColorHex": "#78350F", "Material": "Leather" },
            { "Id": "bow_string", "Shape": "Cylinder", "Position": [-0.2, 1.15, 0.2], "Scale": [0.005, 1.1, 0.005], "ColorHex": "#F3F4F6", "Material": "Plastic" },
            { "Id": "quiver", "Shape": "Cylinder", "Position": [0.15, 1.0, -0.18], "Rotation": [20.0, 0.0, 15.0], "Scale": [0.12, 0.5, 0.12], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "fletching", "Shape": "Box", "Position": [0.2, 1.3, -0.22], "Rotation": [20.0, 0.0, 15.0], "Scale": [0.08, 0.15, 0.08], "ColorHex": "#F9FAFB", "Material": "Plastic" }
        ]
    },

    WARRIOR_JSON: {
        "Name": "CivWarrior", "Type": "Procedural",
        "Parts": [
            { "Id": "torso", "ParentId": null, "Shape": "Box", "Position": [0.0, 1.0, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.4, 0.5, 0.25], "ColorHex": "#3B82F6", "Material": "Leather", "Operation": "Union" },
            { "Id": "head", "ParentId": null, "Shape": "Sphere", "Position": [0.0, 1.4, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.22, 0.22, 0.22], "ColorHex": "#FFDBAC", "Material": "Plastic", "Operation": "Union" },
            { "Id": "helmet", "ParentId": null, "Shape": "Cone", "Position": [0.0, 1.55, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.25, 0.2, 0.25], "ColorHex": "#71717A", "Material": "Metal", "Operation": "Union" },
            { "Id": "leg_right", "ParentId": null, "Shape": "Capsule", "Position": [-0.12, 0.4, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.15, 0.8, 0.15], "ColorHex": "#452719", "Material": "Leather", "Operation": "Union" },
            { "Id": "leg_left", "ParentId": null, "Shape": "Capsule", "Position": [0.12, 0.4, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.15, 0.8, 0.15], "ColorHex": "#452719", "Material": "Leather", "Operation": "Union" },
            { "Id": "arm_right", "ParentId": null, "Shape": "Capsule", "Position": [-0.28, 1.1, 0.1], "Rotation": [-45.0, 0.0, 0.0], "Scale": [0.12, 0.5, 0.12], "ColorHex": "#FFDBAC", "Material": "Plastic", "Operation": "Union" },
            { "Id": "arm_left", "ParentId": null, "Shape": "Capsule", "Position": [0.28, 1.1, 0.1], "Rotation": [-20.0, 0.0, 0.0], "Scale": [0.12, 0.5, 0.12], "ColorHex": "#FFDBAC", "Material": "Plastic", "Operation": "Union" },
            { "Id": "sword_hilt", "ParentId": null, "Shape": "Cylinder", "Position": [-0.35, 0.85, 0.35], "Rotation": [90.0, 0.0, 0.0], "Scale": [0.03, 0.15, 0.03], "ColorHex": "#452719", "Material": "Leather", "Operation": "Union" },
            { "Id": "sword_blade", "ParentId": null, "Shape": "Box", "Position": [-0.35, 1.1, 0.35], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.07, 0.6, 0.015], "ColorHex": "#D4D4D8", "Material": "Metal", "Operation": "Union" },
            { "Id": "shield_main", "ParentId": null, "Shape": "Box", "Position": [0.45, 1.0, 0.25], "Rotation": [0.0, 20.0, 0.0], "Scale": [0.45, 0.6, 0.06], "ColorHex": "#5C4033", "Material": "Leather", "Operation": "Union" },
            { "Id": "shield_boss", "ParentId": null, "Shape": "Sphere", "Position": [0.48, 1.0, 0.28], "Rotation": [0.0, 20.0, 0.0], "Scale": [0.15, 0.15, 0.05], "ColorHex": "#A1A1AA", "Material": "Metal", "Operation": "Union" }
        ]
    },



    unitMeshes: [],

    renderUnits: function (unitData) {
        // Clear Old Units
        this.unitMeshes.forEach(m => this.scene.remove(m));
        this.unitMeshes = [];

        console.log("Rendering " + unitData.length + " units.");

        unitData.forEach(u => {
            let assetJson = null;
            if (u.type === "Warrior") assetJson = this.assets["CivWarrior"];
            else if (u.type === "Settler") assetJson = this.assets["CivSettler"];
            else if (u.type === "Archer") assetJson = this.assets["CivArcher"];
            else if (u.type === "Barbarian") assetJson = this.assets["CivBarbarian"];
            else if (u.type === "Chariot") assetJson = this.assets["CivHorseChariot"];
            else if (u.type === "Swordsman") assetJson = this.assets["CivSwordsman"];
            else if (u.type === "Worker") assetJson = this.assets["CivWorker"];

            // Build or Default
            const group = assetJson ? this.buildAsset(assetJson, 2.5) : new THREE.Group();

            // Fallback
            if (!assetJson && group.children.length === 0) {
                const geo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8);
                const mat = new THREE.MeshPhongMaterial({ color: u.owner === "Barbarian" ? 0xff0000 : 0x0000ff });
                group.add(new THREE.Mesh(geo, mat));
            }

            // Position
            const pos = this.hexToPixel(u.q, u.r);
            group.position.set(pos.x, u.height, pos.z);

            // Deterministic Rotation (Pseudo-Random based on Unit attributes)
            // This prevents "twitching" when re-rendering
            const seed = (u.q * 100 + u.r) + u.type.length;
            const pseudoRandom = Math.sin(seed) * 10000;
            const rotation = (pseudoRandom - Math.floor(pseudoRandom)) * Math.PI * 2;

            group.rotation.y = rotation;

            this.scene.add(group);
            this.unitMeshes.push(group);
        });
    },

    // BUILDING ASSETS
    cityMeshes: [],

    renderCities: function (cityData) {
        // Clear Old Cities
        this.cityMeshes.forEach(m => this.scene.remove(m));
        this.cityMeshes = [];

        console.log("Rendering " + cityData.length + " cities using Asset JSON.");

        cityData.forEach(c => {
            const cityGroup = new THREE.Group();

            // 1. Main Village (Always Center)
            const village = this.buildAsset(this.assets["CivVillage"]);
            village.scale.set(1.0, 1.0, 1.0);
            cityGroup.add(village);

            // 2. Extensions (Civ 4 Style Clutter)

            // Granary (Back Left)
            if (c.hasGranary) {
                const granary = this.buildAsset(this.assets["CivGranary"], 0.4); // Smaller scale
                granary.position.set(-1.5, 0, -1.5);
                granary.rotation.y = Math.PI / 4;
                cityGroup.add(granary);
            }

            // Barracks (Back Right)
            if (c.hasBarracks) {
                const barracks = this.buildAsset(this.assets["CivBarracks"], 0.4);
                barracks.position.set(1.5, 0, -1.5);
                barracks.rotation.y = -Math.PI / 4;
                cityGroup.add(barracks);
            }

            // Monument (Front)
            if (c.hasMonument) {
                const monument = this.buildAsset(this.assets["CivMonument"], 0.5);
                monument.position.set(0, 0, 1.8);
                cityGroup.add(monument);
            }

            // Position entire group on tile
            const pos = this.hexToPixel(c.q, c.r);
            cityGroup.position.set(pos.x, c.height, pos.z);

            this.scene.add(cityGroup);
            this.cityMeshes.push(cityGroup); // Tracking for cleanup
        });
    },

    raycast: function () {
        if (!this.hexMesh) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.hexMesh);

        if (intersects.length > 0) {
            const instanceId = intersects[0].instanceId;

            // Get position of that instance
            const mat = new THREE.Matrix4();
            this.hexMesh.getMatrixAt(instanceId, mat);
            const pos = new THREE.Vector3();
            pos.setFromMatrixPosition(mat);

            this.highlightMesh.position.set(pos.x, pos.y + 0.6, pos.z);
            this.highlightMesh.visible = true;
        } else {
            this.highlightMesh.visible = false;
        }
    },

    hexToPixel: function (q, r) {
        const size = this.hexRadius;
        const spacingX = size * 1.5;
        const spacingZ = size * Math.sqrt(3);
        return { x: spacingX * q, z: spacingZ * (r + q / 2) };
    }
};
