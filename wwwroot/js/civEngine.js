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

    init: function (containerId, dotNetRef) {
        console.log("Initializing CivEngine (High Brightness)...");
        this.dotNetRef = dotNetRef;
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

        // CLICK LISTENER
        container.addEventListener('click', (e) => {
            // Re-check raycast for click
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObject(this.hexMesh);

            if (intersects.length > 0) {
                const instanceId = intersects[0].instanceId;
                const data = this.hexMesh.userData[instanceId];
                console.log("Clicked Hex: " + data.q + ", " + data.r);

                // Call C# 
                if (this.dotNetRef) {
                    this.dotNetRef.invokeMethodAsync('OnHexClicked', data.q, data.r);
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

    // ASSET DATA
    VILLAGE_JSON: {
        "Name": "CivFirstVillage",
        "Type": "Procedural",
        "Parts": [
            { "Id": "ground_base", "ParentId": null, "Shape": "Box", "Position": [0.0, 0.0, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [5.0, 0.05, 5.0], "ColorHex": "#2D3A1F", "Material": "Plastic", "Operation": "Union" },
            { "Id": "main_hut_body", "ParentId": null, "Shape": "Box", "Position": [1.2, 0.6, 0.8], "Rotation": [0.0, 15.0, 0.0], "Scale": [1.2, 1.2, 1.2], "ColorHex": "#5C4033", "Material": "Leather", "Operation": "Union" },
            { "Id": "main_hut_roof", "ParentId": null, "Shape": "Cone", "Position": [1.2, 1.7, 0.8], "Rotation": [0.0, 15.0, 0.0], "Scale": [1.6, 1.0, 1.6], "ColorHex": "#EAB308", "Material": "Leather", "Operation": "Union" },
            { "Id": "small_hut_body", "ParentId": null, "Shape": "Box", "Position": [-1.0, 0.45, -0.5], "Rotation": [0.0, -20.0, 0.0], "Scale": [0.9, 0.9, 0.9], "ColorHex": "#5C4033", "Material": "Leather", "Operation": "Union" },
            { "Id": "small_hut_roof", "ParentId": null, "Shape": "Cone", "Position": [-1.0, 1.3, -0.5], "Rotation": [0.0, -20.0, 0.0], "Scale": [1.2, 0.8, 1.2], "ColorHex": "#EAB308", "Material": "Leather", "Operation": "Union" },
            { "Id": "village_well_base", "ParentId": null, "Shape": "Cylinder", "Position": [-0.5, 0.25, 1.5], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.5, 0.5, 0.5], "ColorHex": "#71717A", "Material": "Metal", "Operation": "Union" },
            { "Id": "village_well_rim", "ParentId": null, "Shape": "Torus", "Position": [-0.5, 0.5, 1.5], "Rotation": [90.0, 0.0, 0.0], "Scale": [0.5, 0.5, 0.1], "ColorHex": "#52525B", "Material": "Metal", "Operation": "Union" },
            { "Id": "campfire_logs", "ParentId": null, "Shape": "Cylinder", "Position": [0.0, 0.1, 0.0], "Rotation": [0.0, 45.0, 90.0], "Scale": [0.05, 0.4, 0.05], "ColorHex": "#451A03", "Material": "Leather", "Operation": "Union" },
            { "Id": "campfire_flame", "ParentId": null, "Shape": "Sphere", "Position": [0.0, 0.25, 0.0], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.2, 0.3, 0.2], "ColorHex": "#F97316", "Material": "Glow", "Operation": "Union" },
            { "Id": "village_banner_pole", "ParentId": null, "Shape": "Cylinder", "Position": [2.0, 1.0, -1.5], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.06, 2.0, 0.06], "ColorHex": "#3F2E3E", "Material": "Leather", "Operation": "Union" },
            { "Id": "village_banner_flag", "ParentId": null, "Shape": "Box", "Position": [2.25, 1.7, -1.5], "Rotation": [0.0, 0.0, 0.0], "Scale": [0.5, 0.4, 0.05], "ColorHex": "#3B82F6", "Material": "Leather", "Operation": "Union" }
        ]
    },

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

    renderMap: function (mapData) {
        if (this.hexMesh) this.scene.remove(this.hexMesh);
        this.campMeshes.forEach(m => this.scene.remove(m));
        this.campMeshes = [];

        console.log("Rendering Map from C# Data: " + mapData.length + " tiles.");

        const geometry = new THREE.CylinderGeometry(this.hexRadius, this.hexRadius, 1, 6);
        const material = new THREE.MeshPhongMaterial({ flatShading: true });

        this.hexMesh = new THREE.InstancedMesh(geometry, material, mapData.length);
        this.scene.add(this.hexMesh);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();

        for (let i = 0; i < mapData.length; i++) {
            const tile = mapData[i];
            const pos = this.hexToPixel(tile.q, tile.r);

            // Visuals
            let h = 1;
            let c = 0x4caf50; // Grass default

            if (tile.type === "Ocean") { c = 0x2196f3; h = 0.5; }
            if (tile.type === "Coast") { c = 0x4fc3f7; h = 0.5; }
            if (tile.type === "Hill") { c = 0x8bc34a; h = 2; }
            if (tile.type === "Mountain") { c = 0x8d6e63; h = 6; }
            if (tile.type === "Snow") { c = 0xffffff; h = 3; }

            // Barbarian Camp
            if (tile.hasCamp) {
                const camp = this.buildAsset(this.BARBARIAN_CAMP_JSON, 1.0);
                camp.position.set(pos.x, h, pos.z); // Sit on top of tile
                this.scene.add(camp);
                this.campMeshes.push(camp);
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

    // BARBARIAN ASSET
    BARBARIAN_JSON: {
        "Name": "CivBarbarian", "Type": "Procedural",
        "Parts": [
            { "Id": "barb_torso", "Shape": "Box", "Position": [0.0, 1.0, 0.0], "Rotation": [5.0, 0.0, 0.0], "Scale": [0.45, 0.55, 0.3], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "barb_head", "Shape": "Sphere", "Position": [0.0, 1.45, 0.05], "Scale": [0.22, 0.22, 0.22], "ColorHex": "#D2B48C", "Material": "Plastic" },
            { "Id": "barb_helmet", "Shape": "Sphere", "Position": [0.0, 1.55, 0.05], "Scale": [0.24, 0.12, 0.24], "ColorHex": "#3F3F46", "Material": "Metal" },
            { "Id": "horn_l", "Shape": "Cone", "Position": [0.18, 1.62, 0.05], "Rotation": [0.0, 0.0, -35.0], "Scale": [0.06, 0.25, 0.06], "ColorHex": "#F5F5DC", "Material": "Plastic" },
            { "Id": "horn_r", "Shape": "Cone", "Position": [-0.18, 1.62, 0.05], "Rotation": [0.0, 0.0, 35.0], "Scale": [0.06, 0.25, 0.06], "ColorHex": "#F5F5DC", "Material": "Plastic" },
            { "Id": "axe_arm", "Shape": "Capsule", "Position": [-0.35, 1.2, 0.2], "Rotation": [-110.0, 0.0, 0.0], "Scale": [0.14, 0.5, 0.14], "ColorHex": "#D2B48C", "Material": "Plastic" },
            { "Id": "axe_head", "Shape": "Box", "Position": [-0.35, 1.4, 0.85], "Scale": [0.35, 0.4, 0.06], "ColorHex": "#71717A", "Material": "Metal" }
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
            if (u.type === "Warrior") assetJson = this.WARRIOR_JSON;
            else if (u.type === "Settler") assetJson = this.SETTLER_JSON;
            else if (u.type === "Barbarian") assetJson = this.BARBARIAN_JSON;

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

            // Random Rotation
            group.rotation.y = Math.random() * Math.PI * 2;

            this.scene.add(group);
            this.unitMeshes.push(group);
        });
    },

    // BUILDING ASSETS
    GRANARY_JSON: {
        "Name": "CivGranary", "Type": "Procedural",
        "Parts": [
            { "Id": "stone_foundation", "Shape": "Box", "Position": [0.0, 0.1, 0.0], "Scale": [2.2, 0.2, 2.2], "ColorHex": "#71717A", "Material": "Metal" },
            { "Id": "main_silo", "Shape": "Cylinder", "Position": [0.0, 1.2, 0.0], "Scale": [1.8, 1.4, 1.8], "ColorHex": "#92400E", "Material": "Leather" },
            { "Id": "conical_roof", "Shape": "Cone", "Position": [0.0, 2.3, 0.0], "Scale": [2.1, 0.8, 2.1], "ColorHex": "#FDE047", "Material": "Leather" },
            { "Id": "loading_door", "Shape": "Box", "Position": [0.0, 1.0, 0.85], "Scale": [0.5, 0.7, 0.1], "ColorHex": "#451A03", "Material": "Leather" }
        ]
    },
    BARRACKS_JSON: {
        "Name": "CivBarracks", "Type": "Procedural",
        "Parts": [
            { "Id": "foundation", "Shape": "Box", "Position": [0.0, 0.025, 0.0], "Scale": [4.5, 0.05, 4.5], "ColorHex": "#3F2E3E", "Material": "Plastic" },
            { "Id": "main_quarters", "Shape": "Box", "Position": [0.5, 0.6, 0.0], "Scale": [2.5, 1.2, 1.8], "ColorHex": "#78350F", "Material": "Leather" },
            { "Id": "roof_l", "Shape": "Box", "Position": [0.5, 1.5, 0.5], "Rotation": [35.0, 0.0, 0.0], "Scale": [2.6, 0.1, 1.2], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "roof_r", "Shape": "Box", "Position": [0.5, 1.5, -0.5], "Rotation": [-35.0, 0.0, 0.0], "Scale": [2.6, 0.1, 1.2], "ColorHex": "#451A03", "Material": "Leather" },
            { "Id": "dummy", "Shape": "Capsule", "Position": [-1.2, 0.8, 1.0], "Scale": [0.3, 0.6, 0.3], "ColorHex": "#D6D3D1", "Material": "Leather" },
            { "Id": "banner", "Shape": "Box", "Position": [1.8, 2.0, 1.5], "Scale": [0.02, 0.8, 0.6], "ColorHex": "#DC2626", "Material": "Leather" }
        ]
    },
    MONUMENT_JSON: {
        "Name": "CivMonument", "Type": "Procedural",
        "Parts": [
            { "Id": "base", "Shape": "Box", "Position": [0.0, 0.1, 0.0], "Scale": [2.5, 0.2, 2.5], "ColorHex": "#4B5563", "Material": "Metal" },
            { "Id": "pedestal", "Shape": "Box", "Position": [0.0, 0.5, 0.0], "Scale": [1.2, 0.6, 1.2], "ColorHex": "#374151", "Material": "Metal" },
            { "Id": "obelisk", "Shape": "Box", "Position": [0.0, 2.0, 0.0], "Scale": [0.6, 2.5, 0.6], "ColorHex": "#9CA3AF", "Material": "Metal" },
            { "Id": "tip", "Shape": "Cone", "Position": [0.0, 3.5, 0.0], "Scale": [0.6, 0.5, 0.6], "ColorHex": "#FDE047", "Material": "Metal" },
            { "Id": "flame", "Shape": "Sphere", "Position": [0.5, 1.15, 0.5], "Scale": [0.15, 0.2, 0.15], "ColorHex": "#F97316", "Material": "Glow" }
        ]
    },

    cityMeshes: [],

    renderCities: function (cityData) {
        // Clear Old Cities
        this.cityMeshes.forEach(m => this.scene.remove(m));
        this.cityMeshes = [];

        console.log("Rendering " + cityData.length + " cities using Asset JSON.");

        cityData.forEach(c => {
            const cityGroup = new THREE.Group();

            // 1. Main Village (Always Center)
            const village = this.buildAsset(this.VILLAGE_JSON);
            village.scale.set(1.0, 1.0, 1.0);
            cityGroup.add(village);

            // 2. Extensions (Civ 4 Style Clutter)

            // Granary (Back Left)
            if (c.hasGranary) {
                const granary = this.buildAsset(this.GRANARY_JSON, 0.4); // Smaller scale
                granary.position.set(-1.5, 0, -1.5);
                granary.rotation.y = Math.PI / 4;
                cityGroup.add(granary);
            }

            // Barracks (Back Right)
            if (c.hasBarracks) {
                const barracks = this.buildAsset(this.BARRACKS_JSON, 0.4);
                barracks.position.set(1.5, 0, -1.5);
                barracks.rotation.y = -Math.PI / 4;
                cityGroup.add(barracks);
            }

            // Monument (Front)
            if (c.hasMonument) {
                const monument = this.buildAsset(this.MONUMENT_JSON, 0.5);
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
