import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8095';
const ORIGIN = new URL(BASE_URL).origin;

const CRITICAL_ENDPOINTS = [
    '/public/index.html',
    '/public/manifest.json',
    '/public/sw.js',
    '/public/offline.html'
];

const PAGES = [
    {
        name: 'database',
        path: '/public/database.html',
        required: ['body.database-page', '.ita-db-header', '#nasa-data-container', '[data-atlas-trigger]']
    },
    {
        name: 'dashboard',
        path: '/public/dashboard.html',
        required: ['.page-title', '#logged-out-view', '.cta-button']
    },
    {
        name: 'stellar-ai',
        path: '/public/stellar-ai.html',
        required: ['.page-title', '#message-input', '#send-btn', '#new-chat-btn']
    },
    {
        name: 'forum',
        path: '/public/forum.html',
        required: ['.page-title', '.forum-categories', '.forum-category', '.forum-post']
    }
];

function isSameOrigin(urlString) {
    try {
        return new URL(urlString).origin === ORIGIN;
    } catch {
        return false;
    }
}

test.describe('Production Pages artifact smoke', () => {
    test('loads core built pages, exposes controls, and avoids same-origin/runtime failures', async ({ page, request }, testInfo) => {
        test.setTimeout(8 * 60 * 1000);
        page.setDefaultTimeout(12_000);
        page.setDefaultNavigationTimeout(45_000);

        const endpointProblems = [];
        for (const path of CRITICAL_ENDPOINTS) {
            const url = new URL(path, BASE_URL).toString();
            const response = await request.get(url, { timeout: 15_000 });
            if (!response.ok()) {
                endpointProblems.push({ path, status: response.status() });
            }
        }
        expect(endpointProblems, `Critical built endpoints failed: ${JSON.stringify(endpointProblems, null, 2)}`).toEqual([]);

        const pageResults = [];

        for (const entry of PAGES) {
            const errors = {
                pageErrors: [],
                sameOriginBadResponses: [],
                sameOriginRequestFailures: []
            };

            const onPageError = (error) => errors.pageErrors.push(String(error));
            const onResponse = (response) => {
                if (isSameOrigin(response.url()) && response.status() >= 400) {
                    errors.sameOriginBadResponses.push({ url: response.url(), status: response.status() });
                }
            };
            const onRequestFailed = (request) => {
                if (!isSameOrigin(request.url())) return;
                const failure = request.failure();
                errors.sameOriginRequestFailures.push({
                    url: request.url(),
                    method: request.method(),
                    resourceType: request.resourceType(),
                    errorText: failure ? failure.errorText : 'unknown'
                });
            };

            page.on('pageerror', onPageError);
            page.on('response', onResponse);
            page.on('requestfailed', onRequestFailed);

            const url = new URL(entry.path, BASE_URL).toString();
            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            expect(response, `${entry.name} did not produce a navigation response`).not.toBeNull();
            expect(response.status(), `${entry.name} returned HTTP ${response.status()}`).toBeLessThan(400);

            await expect(page.locator('body'), `${entry.name} body was not visible`).toBeVisible({ timeout: 10_000 });
            for (const selector of entry.required) {
                await expect(page.locator(selector).first(), `${entry.name} missing ${selector}`).toBeAttached({ timeout: 12_000 });
            }

            // Exercise stable local interactions without calling optional external AI/auth services.
            if (entry.name === 'stellar-ai') {
                const input = page.locator('#message-input');
                await input.fill('CI artifact smoke');
                await expect(input).toHaveValue('CI artifact smoke');
                await input.fill('');
            } else if (entry.name === 'forum') {
                await page.locator('.forum-category').first().hover();
            } else if (entry.name === 'dashboard') {
                await expect(page.locator('#logged-out-view')).toBeAttached();
            } else if (entry.name === 'database') {
                await expect(page.locator('#nasa-data-container')).toBeAttached();
            }

            // Give deferred same-origin resources a bounded opportunity to surface failures.
            await page.waitForTimeout(750);

            page.off('pageerror', onPageError);
            page.off('response', onResponse);
            page.off('requestfailed', onRequestFailed);

            pageResults.push({ name: entry.name, url, errors });
        }

        await testInfo.attach('production-artifact-smoke.json', {
            body: JSON.stringify(pageResults, null, 2),
            contentType: 'application/json'
        });

        const problems = [];
        for (const result of pageResults) {
            for (const error of result.errors.pageErrors) {
                problems.push({ type: 'pageerror', page: result.name, error });
            }
            for (const response of result.errors.sameOriginBadResponses) {
                problems.push({ type: 'same-origin-response', page: result.name, ...response });
            }
            for (const requestFailure of result.errors.sameOriginRequestFailures) {
                problems.push({ type: 'same-origin-request-failure', page: result.name, ...requestFailure });
            }
        }

        expect(problems, `Production artifact smoke problems: ${JSON.stringify(problems, null, 2)}`).toEqual([]);
    });
});
