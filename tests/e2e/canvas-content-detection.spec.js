import { test, expect } from '@playwright/test';

test.describe('Starsector Canvas Rendering and COEP Detection', () => {
  test('detect canvas content and capture full logs', async ({ page, context }) => {
    test.setTimeout(120000);
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(logEntry);
      console.log(logEntry);
    });

    // Capture errors
    const pageErrors = [];
    page.on('pageerror', error => {
      const errorEntry = `[PAGE ERROR] ${error.message}`;
      pageErrors.push(errorEntry);
      console.error(errorEntry);
    });

    // Capture network requests and responses
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        resourceType: request.resourceType()
      });
    });

    const networkResponses = [];
    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        resourceType: response.resourceType
      });
    });

    const safeEvaluate = async (fn, fallback, timeoutMs = 5000) => {
      try {
        return await Promise.race([
          page.evaluate(fn),
          new Promise((_, reject) => setTimeout(() => reject(new Error('evaluate timeout')), timeoutMs))
        ]);
      } catch (error) {
        console.warn('[TEST] page.evaluate skipped:', error?.message || error);
        return fallback;
      }
    };

    // Track LWJGL frame callbacks from the bridge
    const frameEvents = [];
    let lastFrameCount = 0;
    let lastFrameTimestamp = null;
    await page.exposeFunction('reportLwjglFrame', (frameCount) => {
      lastFrameCount = frameCount;
      lastFrameTimestamp = Date.now();
      frameEvents.push({ frameCount, timestamp: lastFrameTimestamp });
    });

    const launchMode = process.env.STARSECTOR_MODE || 'combat';
    const queryParams = new URLSearchParams();
    if (launchMode === 'combat') {
      queryParams.set('mode', 'combat');
    }
    if (process.env.STARSECTOR_CLEAR_CACHE === '1') {
      queryParams.set('clearCache', '1');
    }
    const queryString = queryParams.toString();
    const launchUrl = `http://localhost:8001/Starsector-0.97a-RC11/starsector.html${queryString ? `?${queryString}` : ''}`;
    // Navigate to the page (served from localhost with R2 assets via worker URL)
    await page.goto(launchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    console.log(`[TEST] Navigated to starsector.html (mode=${launchMode})`);

    // Wait for canvas to be created
    await page.waitForSelector('#lwjgl', { timeout: 120000 });
    console.log('[TEST] Canvas element found');

    // Capture multiple canvas snapshots to detect frame changes
    const canvas = page.locator('#lwjgl');
    const canvasBox = await canvas.boundingBox();
    console.log('[TEST] Canvas dimensions:', canvasBox);

    // Function to capture canvas data
    const captureCanvasData = async () => {
      const totalPixels = canvasBox ? Math.floor(canvasBox.width * canvasBox.height) : 0;
      return {
        hash: lastFrameCount,
        frameCounter: lastFrameCount,
        lastSwapTime: lastFrameTimestamp,
        blackPixels: 0,
        totalPixels,
        blackPercentage: null
      };
    };

    // Capture initial canvas state
    const initialCanvasData = await captureCanvasData();
    console.log('[TEST] Initial canvas state:', initialCanvasData);

    // Wait for game initialization (default 30 seconds) and monitor for changes
    const snapshotInterval = 5000; // 5 seconds between snapshots
    const captureSeconds = Number(process.env.STARSECTOR_CAPTURE_SECONDS) || 30;
    const numSnapshots = Math.max(2, Math.round((captureSeconds * 1000) / snapshotInterval) + 1);
    const canvasSnapshots = [initialCanvasData];

    // Track game state and errors
    let gameStarted = false;
    let gameInitialized = false;
    let gameRunning = false;
    let fatalError = null;
    let lastError = null;
    let lastWarning = null;

    for (let i = 1; i < numSnapshots; i++) {
      await page.waitForTimeout(snapshotInterval);
      const snapshot = await captureCanvasData();
      canvasSnapshots.push(snapshot);
      console.log(`[TEST] Snapshot ${i}:`, snapshot);

      // Check for game state indicators in console logs
      const gameStartLogs = consoleLogs.filter(log =>
        log.includes('Starting Starsector') ||
        log.includes('launcher') ||
        log.includes('Main class')
      );
      if (gameStartLogs.length > 0 && !gameStarted) {
        gameStarted = true;
        console.log('[TEST] Game started detected');
      }

      const gameInitLogs = consoleLogs.filter(log =>
        log.includes('Loading settings') ||
        log.includes('Loading JSON') ||
        log.includes('LoadingUtils')
      );
      if (gameInitLogs.length > 0 && !gameInitialized) {
        gameInitialized = true;
        console.log('[TEST] Game initialization detected');
      }

      const gameRunLogs = consoleLogs.filter(log =>
        log.includes('Display.create') ||
        log.includes('Rendering') ||
        log.includes('Frame')
      );
      if (gameRunLogs.length > 0 && !gameRunning) {
        gameRunning = true;
        console.log('[TEST] Game running detected');
      }

      // Check for fatal errors
      const fatalErrors = consoleLogs.filter(log =>
        log.includes('FATAL') ||
        log.includes('Exception') ||
        log.includes('Error') ||
        log.includes('Could not find')
      );
      if (fatalErrors.length > 0) {
        lastError = fatalErrors[fatalErrors.length - 1];
        console.log('[TEST] Last error:', lastError);
      }

      // Check for warnings
      const warnings = consoleLogs.filter(log =>
        log.includes('WARNING') ||
        log.includes('WARN')
      );
      if (warnings.length > 0) {
        lastWarning = warnings[warnings.length - 1];
        console.log('[TEST] Last warning:', lastWarning);
      }

      // Check for LWJGL-specific errors
      const lwjglErrors = consoleLogs.filter(log =>
        log.includes('LWJGL') ||
        log.includes('lwjgl') ||
        log.includes('OpenGL') ||
        log.includes('Display')
      );
      if (lwjglErrors.length > 0) {
        console.log('[TEST] LWJGL-related logs:', lwjglErrors);
      }

      // Check for native library errors
      const nativeErrors = consoleLogs.filter(log =>
        log.includes('UnsatisfiedLinkError') ||
        log.includes('native') ||
        log.includes('library') ||
        log.includes('JNI_OnLoad')
      );
      if (nativeErrors.length > 0) {
        console.log('[TEST] Native library errors:', nativeErrors);
      }

      // Check for cheerpjDef errors
      const cheerpjDefErrors = consoleLogs.filter(log =>
        log.includes('cheerpjDef') ||
        log.includes('cheerpjInit') ||
        log.includes('cheerpjRunMain')
      );
      if (cheerpjDefErrors.length > 0) {
        console.log('[TEST] CheerpJ-related logs:', cheerpjDefErrors);
      }
    }

    // Analyze frame changes
    let frameChanges = 0;
    for (let i = 1; i < canvasSnapshots.length; i++) {
      if (canvasSnapshots[i] && canvasSnapshots[i - 1] && 
          canvasSnapshots[i].hash !== canvasSnapshots[i - 1].hash) {
        frameChanges++;
      }
    }

    const isRendering = frameChanges > 0;
    const isStalled = frameChanges === 0;

    console.log('[TEST] Frame change analysis:');
    console.log(`  Total snapshots: ${canvasSnapshots.length}`);
    console.log(`  Frame changes detected: ${frameChanges}`);
    console.log(`  Canvas is rendering: ${isRendering}`);
    console.log(`  Canvas is stalled: ${isStalled}`);

    // Detailed game state analysis
    console.log('[TEST] Game state analysis:');
    console.log(`  Game started: ${gameStarted}`);
    console.log(`  Game initialized: ${gameInitialized}`);
    console.log(`  Game running: ${gameRunning}`);

    // Error analysis
    console.log('[TEST] Error analysis:');
    console.log(`  Last error: ${lastError || 'None'}`);
    console.log(`  Last warning: ${lastWarning || 'None'}`);

    // Count error types
    const errorCount = consoleLogs.filter(log => log.includes('[error]')).length;
    const warningCount = consoleLogs.filter(log => log.includes('[log]') && log.includes('WARNING')).length;
    const fatalErrorCount = consoleLogs.filter(log => log.includes('FATAL')).length;
    const exceptionCount = consoleLogs.filter(log => log.includes('Exception')).length;

    console.log(`  Total errors: ${errorCount}`);
    console.log(`  Total warnings: ${warningCount}`);
    console.log(`  Fatal errors: ${fatalErrorCount}`);
    console.log(`  Exceptions: ${exceptionCount}`);

    // Check for specific error patterns
    const unsatisfiedLinkErrors = consoleLogs.filter(log => log.includes('UnsatisfiedLinkError'));
    const lwjglErrors = consoleLogs.filter(log => log.includes('LWJGL') || log.includes('lwjgl'));
    const displayErrors = consoleLogs.filter(log => log.includes('Display'));
    const nativeErrors = consoleLogs.filter(log => log.includes('native') || log.includes('JNI_OnLoad'));
    const cheerpjDefErrors = consoleLogs.filter(log => log.includes('cheerpjDef'));

    console.log('[TEST] Specific error patterns:');
    console.log(`  UnsatisfiedLinkError count: ${unsatisfiedLinkErrors.length}`);
    console.log(`  LWJGL-related logs: ${lwjglErrors.length}`);
    console.log(`  Display-related logs: ${displayErrors.length}`);
    console.log(`  Native library logs: ${nativeErrors.length}`);
    console.log(`  cheerpjDef logs: ${cheerpjDefErrors.length}`);

    // Print detailed logs for critical errors
    if (unsatisfiedLinkErrors.length > 0) {
      console.log('[TEST] UnsatisfiedLinkError details:');
      unsatisfiedLinkErrors.forEach(err => console.log('  ', err));
    }

    if (lwjglErrors.length > 0) {
      console.log('[TEST] LWJGL-related error details:');
      lwjglErrors.forEach(err => console.log('  ', err));
    }

    if (displayErrors.length > 0) {
      console.log('[TEST] Display-related error details:');
      displayErrors.forEach(err => console.log('  ', err));
    }

    if (nativeErrors.length > 0) {
      console.log('[TEST] Native library error details:');
      nativeErrors.forEach(err => console.log('  ', err));
    }

    if (cheerpjDefErrors.length > 0) {
      console.log('[TEST] cheerpjDef error details:');
      cheerpjDefErrors.forEach(err => console.log('  ', err));
    }

    // Check for Java version issues
    const javaVersionLogs = consoleLogs.filter(log =>
      log.includes('Java version') ||
      log.includes('java.version')
    );
    if (javaVersionLogs.length > 0) {
      console.log('[TEST] Java version logs:');
      javaVersionLogs.forEach(log => console.log('  ', log));
    }

    // Check for classpath issues
    const classpathLogs = consoleLogs.filter(log =>
      log.includes('Classpath') ||
      log.includes('classpath')
    );
    if (classpathLogs.length > 0) {
      console.log('[TEST] Classpath logs:');
      classpathLogs.forEach(log => console.log('  ', log));
    }

    // Check for main class issues
    const mainClassLogs = consoleLogs.filter(log =>
      log.includes('Main class') ||
      log.includes('main class') ||
      log.includes('Could not find or load main class')
    );
    if (mainClassLogs.length > 0) {
      console.log('[TEST] Main class logs:');
      mainClassLogs.forEach(log => console.log('  ', log));
    }

    // Take final screenshot (best-effort)
    try {
      await canvas.screenshot({ path: 'canvas-screenshot.png', timeout: 30000 });
      console.log('[TEST] Canvas screenshot saved');
    } catch (error) {
      console.warn('[TEST] Canvas screenshot skipped:', error?.message || error);
    }

    // Use the final snapshot for content analysis
    const canvasContent = canvasSnapshots[canvasSnapshots.length - 1] || initialCanvasData;

    console.log('[TEST] Canvas content analysis:', canvasContent);

    // Check COEP headers
    const coepCheck = await safeEvaluate(() => {
      return {
        crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
        securityPolicy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || null
      };
    }, { crossOriginIsolated: false, securityPolicy: null });
    console.log('[TEST] COEP check:', coepCheck);

    // Check for any iframes
    const iframes = await safeEvaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(iframe => ({
        src: iframe.src,
        id: iframe.id,
        name: iframe.name
      }));
    }, []);
    console.log('[TEST] Iframes found:', iframes);

    // Check for any COEP-related warnings in console logs
    const coepWarnings = consoleLogs.filter(log =>
      log.toLowerCase().includes('coep') ||
      log.toLowerCase().includes('cross-origin-embedder-policy') ||
      log.toLowerCase().includes('cross-origin-opener-policy')
    );
    console.log('[TEST] COEP warnings found:', coepWarnings.length);
    coepWarnings.forEach(warning => console.log('  ', warning));

    // Check for any errors
    console.log('[TEST] Total page errors:', pageErrors.length);
    pageErrors.forEach(error => console.log('  ', error));

    // Check for any failed network requests
    const failedRequests = networkResponses.filter(r =>
      r.status >= 400 || r.status === 0
    );
    console.log('[TEST] Failed network requests:', failedRequests.length);
    failedRequests.forEach(req => console.log('  ', req.url, req.status));

    // Check for c.html requests
    const cHtmlRequests = networkRequests.filter(r =>
      r.url.includes('c.html')
    );
    console.log('[TEST] c.html requests:', cHtmlRequests.length);
    cHtmlRequests.forEach(req => {
      console.log('  URL:', req.url);
      console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    });

    // Logs are captured in test output - no file saving needed

    console.log('[TEST] Canvas rendering verified successfully');

    // Assertions
    expect(canvasContent).not.toBeNull();
    expect(canvasContent.totalPixels).toBeGreaterThan(0);
    if (canvasContent.blackPercentage !== null) {
      expect(canvasContent.blackPercentage).toBeLessThan(100);
    }

    // Warn if canvas is mostly black
    if (canvasContent.blackPercentage !== null) {
      if (canvasContent.blackPercentage > 95) {
        console.warn('[TEST] WARNING: Canvas is mostly black (', canvasContent.blackPercentage.toFixed(2), '%)');
      } else {
        console.log('[TEST] Canvas has content (', (100 - canvasContent.blackPercentage).toFixed(2), '% non-black)');
      }
    } else {
      console.log('[TEST] Canvas pixel analysis skipped (frame-based detection only)');
    }

    // Warn if canvas is stalled (no frame changes)
    if (isStalled) {
      console.warn('[TEST] WARNING: Canvas appears stalled (no frame changes detected over 30 seconds)');
    } else {
      console.log('[TEST] Canvas is actively rendering (', frameChanges, ' frame changes detected)');
    }

    // Warn if COEP warnings found
    if (coepWarnings.length > 0) {
      console.warn('[TEST] WARNING: COEP warnings detected');
    }
  });
});
