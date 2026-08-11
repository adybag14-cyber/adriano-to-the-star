import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const PAGE_PATH = process.env.PAGE_PATH || '/starsector.html';
const CAPTURE_MS = Number(process.env.CAPTURE_MS || '60000');
const ECHO_LOGS = process.env.ECHO_LOGS === '1';
const EXPECTED_ORIGIN = new URL(BASE_URL).origin;

function isoNow() {
    return new Date().toISOString();
}

function formatLocation(loc) {
    if (!loc) return '';
    const url = loc.url || '';
    if (!url) return '';

    const line = (typeof loc.lineNumber === 'number') ? loc.lineNumber : null;
    const column = (typeof loc.columnNumber === 'number') ? loc.columnNumber : null;

    if (line == null) return ` @ ${url}`;
    if (column == null) return ` @ ${url}:${line}`;
    return ` @ ${url}:${line}:${column}`;
}

test.describe('Starsector console capture', () => {
    test('captures console logs to a file', async ({ page }, testInfo) => {
        test.setTimeout(Math.max(2 * 60 * 1000, CAPTURE_MS + 60 * 1000));

        const url = new URL(PAGE_PATH, BASE_URL).toString();
        const lines = [];
        let requestsTo8100 = 0;

        const stableDir = path.resolve(process.cwd(), process.env.ARTIFACT_DIR || 'playwright-artifacts');
        try {
            fs.mkdirSync(stableDir, { recursive: true });
        } catch {
            // ignore
        }

        const push = (line) => {
            lines.push(line);
            if (ECHO_LOGS) {
                console.log(line);
            }
        };

        const record = (kind, text, locationSuffix = '') => {
            push(`[${isoNow()}] ${kind}: ${text}${locationSuffix}`);
        };

        record('config', `BASE_URL=${BASE_URL} PAGE_PATH=${PAGE_PATH} CAPTURE_MS=${CAPTURE_MS} url=${url} expected_origin=${EXPECTED_ORIGIN}`);

        page.on('console', (msg) => {
            const loc = typeof msg.location === 'function' ? msg.location() : null;
            record(`console.${msg.type()}`, msg.text(), formatLocation(loc));
        });

        page.on('pageerror', (err) => {
            record('pageerror', String(err));
        });

        page.on('requestfailed', (req) => {
            const failure = req.failure();
            const errorText = failure ? failure.errorText : 'unknown';
            record('requestfailed', `${req.method()} ${req.url()} ${errorText}`);
        });

        page.on('response', (res) => {
            try {
                const status = res.status();
                if (status >= 400) {
                    record('response', `${status} ${res.url()}`);
                }
            } catch {
                // ignore
            }
        });

        page.on('request', (req) => {
            const reqUrl = req.url();
            if (reqUrl.startsWith('http://localhost:8100') || reqUrl.startsWith('http://127.0.0.1:8100')) {
                requestsTo8100 += 1;
                if (requestsTo8100 <= 25) {
                    record('request.8100', `${req.method()} ${reqUrl}`);
                }
            }
        });

        page.on('framenavigated', (frame) => {
            try {
                if (frame === page.mainFrame()) {
                    record('framenavigated', frame.url());
                }
            } catch {
                // ignore
            }
        });

        page.on('worker', (worker) => {
            record('worker', `created ${worker.url()}`);

            worker.on('console', (msg) => {
                const loc = typeof msg.location === 'function' ? msg.location() : null;
                record(`worker.console.${msg.type()}`, msg.text(), formatLocation(loc));
            });

            worker.on('close', () => {
                record('worker', `closed ${worker.url()}`);
            });
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
        record('page', `after_goto url=${page.url()} origin=${new URL(page.url()).origin}`);
        try {
            const baseInfo = await page.evaluate(() => ({
                href: location.href,
                origin: location.origin,
                baseURI: document.baseURI
            }));
            record('page', `location.href=${baseInfo.href} origin=${baseInfo.origin} baseURI=${baseInfo.baseURI}`);
        } catch (e) {
            record('page', `evaluate_location_failed ${String(e)}`);
        }
        await page.waitForTimeout(CAPTURE_MS);

        try {
            const uiState = await page.evaluate(() => {
                const loading = document.getElementById('loading-screen');
                const loadingStatus = document.getElementById('loading-status');
                const loadingSubstatus = document.getElementById('loading-substatus');
                const topBar = document.getElementById('top-bar');
                const error = document.getElementById('error-display');
                const errorMsg = document.getElementById('error-message');
                const errorDetails = document.getElementById('error-details');

                return {
                    loading_hidden: !!(loading && loading.classList.contains('hidden')),
                    loading_status: loadingStatus ? (loadingStatus.textContent || '').trim() : '',
                    loading_substatus: loadingSubstatus ? (loadingSubstatus.textContent || '').trim() : '',
                    top_bar_visible: !!(topBar && topBar.classList.contains('visible')),
                    error_visible: !!(error && error.classList.contains('visible')),
                    error_message: errorMsg ? (errorMsg.textContent || '').trim() : '',
                    error_details: errorDetails ? (errorDetails.textContent || '').trim() : ''
                };
            });
            record('ui', JSON.stringify(uiState));
        } catch (e) {
            record('ui', `evaluate_ui_state_failed ${String(e)}`);
        }

        try {
            const domState = await page.evaluate(() => {
                function rectToObj(r) {
                    if (!r) return null;
                    return {
                        x: Math.round(r.x),
                        y: Math.round(r.y),
                        width: Math.round(r.width),
                        height: Math.round(r.height)
                    };
                }

                const canvases = Array.from(document.querySelectorAll('canvas')).map((c) => {
                    let glInfo = null;
                    try {
                        const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
                        if (gl) {
                            glInfo = {
                                isContextLost: typeof gl.isContextLost === 'function' ? gl.isContextLost() : null,
                                version: gl.getParameter(gl.VERSION),
                                renderer: gl.getParameter(gl.RENDERER),
                                vendor: gl.getParameter(gl.VENDOR)
                            };
                        }
                    } catch (e) {
                        glInfo = { error: String(e) };
                    }

                    return {
                        tag: c.tagName,
                        id: c.id || '',
                        className: typeof c.className === 'string' ? c.className : (c.className && c.className.baseVal) ? c.className.baseVal : '',
                        width: c.width,
                        height: c.height,
                        clientWidth: c.clientWidth,
                        clientHeight: c.clientHeight,
                        styleWidth: c.style && c.style.width ? c.style.width : '',
                        styleHeight: c.style && c.style.height ? c.style.height : '',
                        rect: rectToObj(c.getBoundingClientRect()),
                        gl: glInfo
                    };
                });

                const gameContainer = document.getElementById('game-container');
                return {
                    canvasCount: canvases.length,
                    canvases,
                    gameContainerRect: gameContainer ? rectToObj(gameContainer.getBoundingClientRect()) : null,
                    lwjglCanvasElementPresent: !!window.lwjglCanvasElement,
                    lwjglCanvasElementRect: window.lwjglCanvasElement ? rectToObj(window.lwjglCanvasElement.getBoundingClientRect()) : null,
                    lwjglFrameCount: (typeof window.frameCount === 'number') ? window.frameCount : null,
                    lwjglFrameLimit: (typeof window.frameLimit === 'number') ? window.frameLimit : null,
                    lwjglFbWidth: (typeof window.fbWidth === 'number') ? window.fbWidth : null,
                    lwjglFbHeight: (typeof window.fbHeight === 'number') ? window.fbHeight : null
                };
            });
            record('dom', JSON.stringify(domState));
        } catch (e) {
            record('dom', `evaluate_dom_state_failed ${String(e)}`);
        }

        try {
            const lwjglDebug = await page.evaluate(() => {
                const dbg = window.__lwjglDebug;
                const counts = dbg && dbg.counts ? dbg.counts : null;
                if (!counts) {
                    return { present: false };
                }

                const entries = Object.keys(counts).map((name) => ({
                    name,
                    count: Number(counts[name] || 0)
                }));
                entries.sort((a, b) => b.count - a.count);

                const importantNames = [
                    'Java_org_lwjgl_opengl_Display_create',
                    'Java_org_lwjgl_opengl_LinuxDisplay_openDisplay',
                    'Java_org_lwjgl_opengl_LinuxContextImplementation_nCreate',
                    'Java_org_lwjgl_opengl_LinuxContextImplementation_nMakeCurrent',
                    'Java_org_lwjgl_opengl_LinuxContextImplementation_nSwapBuffers',
                    'Java_org_lwjgl_opengl_LinuxEvent_getPending',
                    'Java_org_lwjgl_opengl_LinuxEvent_nNextEvent'
                ];
                const important = Object.create(null);
                for (const name of importantNames) {
                    if (Object.prototype.hasOwnProperty.call(counts, name)) {
                        important[name] = Number(counts[name] || 0);
                    }
                }

                let totalCalls = 0;
                for (const e of entries) totalCalls += e.count;

                return {
                    present: true,
                    totalUnique: entries.length,
                    totalCalls,
                    top: entries.slice(0, 40),
                    important
                };
            });
            record('lwjgl', JSON.stringify(lwjglDebug));
        } catch (e) {
            record('lwjgl', `evaluate_lwjgl_debug_failed ${String(e)}`);
        }

        try {
            const screenshotPath = testInfo.outputPath('starsector-final.png');
            await page.screenshot({ path: screenshotPath, fullPage: true });

            try {
                const stableScreenshotPath = path.join(stableDir, 'starsector-final.png');
                fs.copyFileSync(screenshotPath, stableScreenshotPath);
                record('page', `screenshot_copied ${stableScreenshotPath}`);
            } catch (e) {
                record('page', `screenshot_copy_failed ${String(e)}`);
            }

            await testInfo.attach('starsector-final.png', {
                path: screenshotPath,
                contentType: 'image/png'
            });
            record('page', `screenshot_saved ${screenshotPath}`);
        } catch (e) {
            record('page', `screenshot_failed ${String(e)}`);
        }

        const sawMissing = lines.some((l) => l.includes('Missing import: __syscall_pipe2'));
        const sawShim = lines.some((l) => l.includes('[cj3.js] shim __syscall_pipe2'));
        record('summary', `saw_missing_import_pipe2=${sawMissing} saw_cj3_shim_pipe2=${sawShim} requests_to_8100=${requestsTo8100} final_url=${page.url()} final_origin=${new URL(page.url()).origin} expected_origin=${EXPECTED_ORIGIN}`);

        const outPath = testInfo.outputPath('starsector-console.log');
        fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf-8');

        try {
            const stableLogPath = path.join(stableDir, 'starsector-console.log');
            fs.writeFileSync(stableLogPath, lines.join('\n') + '\n', 'utf-8');
            record('page', `log_copied ${stableLogPath}`);
        } catch (e) {
            record('page', `log_copy_failed ${String(e)}`);
        }

        await testInfo.attach('starsector-console.log', {
            path: outPath,
            contentType: 'text/plain'
        });

        console.log(`Saved Starsector Playwright console log to: ${outPath}`);
    });
});
