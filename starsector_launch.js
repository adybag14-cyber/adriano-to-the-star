// Official CheerpJ 4.2 Launcher for Starsector
(async function () {
    try {
        console.log("[Launcher] 1. Init Start");
        
        window.cjModule = await cheerpjInit({
            version: 17,
            enableInput: true,
            clipboardMode: "permission",
            mounts: [
                { type: "memory", mountPoint: "/home/user" },
                { type: "linked", mountPoint: "/app", mountPath: "/" },
                { type: "linked", mountPoint: "/data", mountPath: "Starsector/starsector-core/data" },
                { type: "linked", mountPoint: "/graphics", mountPath: "Starsector/starsector-core/graphics" },
                { type: "linked", mountPoint: "/sounds", mountPath: "Starsector/starsector-core/sounds" },
                { type: "memory", mountPoint: "/app/Starsector/saves" },
                { type: "memory", mountPoint: "/app/Starsector/screenshots" },
                { type: "memory", mountPoint: "/app/Starsector/mods_memory" },
                { type: "memory", mountPoint: "/app/Starsector/starfarer.log" }
            ],
            javaProperties: [
                "os.name=Linux",
                "java.version=1.8.0_202",
                "java.awt.headless=false",
                "user.dir=/app/Starsector/starsector-core",
                "user.home=/app/Starsector",
                "fs.game.dir=/app/Starsector",
                "fs.mod.dir=/app/Starsector/mods_clean",
                "starsector.mods.dir=/app/Starsector/mods_clean",
                "com.fs.starfarer.settings.paths.mods=/app/Starsector/mods_clean",
                "com.fs.starfarer.settings.paths.saves=/app/Starsector/saves",
                "com.fs.starfarer.settings.paths.screenshots=/app/Starsector/screenshots",
                "com.fs.starfarer.settings.paths.logs=/app/Starsector",
                "org.lwjgl.util.Debug=true",
                "log4j.configuration=file:/app/Starsector/starsector-core/log4j.properties",
                "java.util.Arrays.useLegacyMergeSort=true",
                "com.fs.starfarer.settings.linux=true",
                "launchDirect=true"
            ],
            arguments: [
                "--add-opens=java.base/java.nio=ALL-UNNAMED",
                "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED",
                "--add-opens=java.base/java.lang=ALL-UNNAMED",
                "--add-opens=java.base/jdk.internal.ref=ALL-UNNAMED",
                "--add-opens=java.base/sun.misc=ALL-UNNAMED",
                "--add-opens=java.base/java.util=ALL-UNNAMED",
                "--add-opens=java.base/sun.security.action=ALL-UNNAMED",
                "-Djava.util.concurrent.ForkJoinPool.common.parallelism=1",
                "-Xmx1536m"
            ],
            natives: {
                "Java_java_lang_System_currentTimeMillis": function(lib) {
                    if (!window.settingsInitialized) {
                        window.settingsInitialized = true;
                        console.log("[Time Shim] First call, initializing settings...");
                        try {
                            // öÔ0000 is \xf6\xd40000
                            const StarfarerSettings = lib.com.fs.starfarer.settings.StarfarerSettings;
                            if (StarfarerSettings && StarfarerSettings["\xf6\xd40000"]) {
                                StarfarerSettings["\xf6\xd40000"]();
                                console.log("[Time Shim] StarfarerSettings initialized!");
                            } else {
                                console.warn("[Time Shim] StarfarerSettings or init method not found");
                            }
                        } catch (e) {
                            console.error("[Time Shim] Interop settings init failed:", e);
                        }
                    }
                    return BigInt(Date.now());
                },
                ...(window.CheerpJ_LWJGL_Natives || {})
            }
        });
        console.log("[Launcher] 2. Init Done");

        const container = document.getElementById('game-container');
        const lwjglCanvas = document.createElement('canvas');
        lwjglCanvas.id = 'lwjgl';
        lwjglCanvas.width = 1280;
        lwjglCanvas.height = 768;
        lwjglCanvas.style.width = '1280px';
        lwjglCanvas.style.height = '768px';
        lwjglCanvas.tabIndex = 0;
        
        if (container) {
            container.appendChild(lwjglCanvas);
            cheerpjCreateDisplay(1280, 768, container);
        }

        const jars_core = [
            "merged_game.jar",
            "cheerpj-natives/lwjgl-fixed.jar",
            "Starsector/starsector-core/fs.sound_obf.jar",
            "Starsector/starsector-core/xstream-1.4.10.jar",
            "Starsector/starsector-core/janino.jar",
            "Starsector/starsector-core/commons-compiler.jar",
            "Starsector/starsector-core/commons-compiler-jdk.jar",
            "Starsector/starsector-core/jogg-0.0.7.jar",
            "Starsector/starsector-core/jorbis-0.0.15.jar",
            "Starsector/starsector-core/lwjgl_renamed.jar",
            "Starsector/starsector-core/lwjgl_util.jar",
            "Starsector/starsector-core/log4j-1.2.9.jar",
            "Starsector/starsector-core/jinput.jar",
            "Starsector/starsector-core/txw2-3.0.2.jar",
            "Starsector/starsector-core/jaxb-api-2.4.0-b180830.0359.jar",
            "Starsector/starsector-core/webp-imageio-0.1.6.jar",
            "Starsector/",
            "Starsector/starsector-core/"
        ];

        const classpath = jars_core.map(j => "/app/" + j).join(':');

        console.log("[Launcher] 3. Starting Starfarer (CombatMain)...");
        document.getElementById('loading-screen').classList.add('hidden');

        cheerpjRunMain("com.fs.starfarer.combat.CombatMain", classpath)

        // Attempt to click Play button via interop
        async function runAutoClicker() {
            try {
                const Window = await cjModule.cjResolveClass("java.awt.Window");
                const windows = await Window.getWindows();
                for(let win of windows) {
                    await scanComponents(win);
                }
            } catch(e) {}
            setTimeout(runAutoClicker, 1000);
        }

        async function scanComponents(comp) {
            try {
                const className = await (await comp.getClass()).getName();
                if (className.includes("Button")) {
                    const text = await comp.getText();
                    if (text && (text.includes("Play") || text.includes("Launch"))) {
                        console.log("[AutoClicker] CLICKING:", text);
                        await comp.doClick();
                    }
                }
                if (comp.getComponents) {
                    const children = await comp.getComponents();
                    for(let child of children) await scanComponents(child);
                }
            } catch(e) {}
        }

        runAutoClicker();

    } catch (err) {
        console.error("[Launcher] CRITICAL ERROR:", err);
    }
})();
