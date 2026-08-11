import { EmailMessage } from 'cloudflare:email';

const DEFAULT_RECIPIENT = 'adybag14@gmail.com';
const DEFAULT_SENDER = 'forms@adrianotothestar.com';
const MAX_BODY_BYTES = 16 * 1024;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsHeaders = buildCorsHeaders(request, env);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (url.pathname === '/health') {
            return json({ ok: true, service: 'form-mailer' }, 200, corsHeaders);
        }

        if (url.pathname !== '/api/test-form') {
            return json({ success: false, error: 'Not found' }, 404, corsHeaders);
        }

        if (request.method !== 'POST') {
            return json({ success: false, error: 'Method not allowed' }, 405, {
                ...corsHeaders,
                Allow: 'POST, OPTIONS',
            });
        }

        try {
            const contentLength = Number(request.headers.get('content-length') || '0');
            if (contentLength > MAX_BODY_BYTES) {
                return json({ success: false, error: 'Form payload is too large.' }, 413, corsHeaders);
            }

            const payload = await readPayload(request);
            const form = validatePayload(payload);

            if (form.company) {
                return json({ success: true, skipped: true }, 200, corsHeaders);
            }

            if (!env.EMAIL || typeof env.EMAIL.send !== 'function') {
                return json({ success: false, error: 'Email binding is not configured.' }, 500, corsHeaders);
            }

            const recipient = env.RECIPIENT_EMAIL || DEFAULT_RECIPIENT;
            const sender = env.SENDER_EMAIL || DEFAULT_SENDER;
            const senderName = env.SENDER_NAME || 'Adriano To The Star Forms';
            const subject = `Website test form: ${form.topic}`;
            const text = buildTextEmail(form, request);
            const html = buildHtmlEmail(form, request);
            const raw = buildRawEmail({
                sender,
                senderName,
                recipient,
                replyTo: form.email,
                subject,
                text,
                html,
            });
            const message = new EmailMessage(sender, recipient, raw);

            const response = await env.EMAIL.send(message);

            return json(
                {
                    success: true,
                    messageId: response?.messageId || null,
                },
                200,
                corsHeaders
            );
        } catch (error) {
            const status = error.status || 500;
            const message = status >= 500 ? 'Form email failed. Check Wrangler logs.' : error.message;
            console.error('Form mailer error:', error);
            return json({ success: false, error: message }, status, corsHeaders);
        }
    },
};

function buildCorsHeaders(request, env) {
    const requestOrigin = request.headers.get('Origin') || '';
    const configured = env.ALLOWED_ORIGINS || [
        'https://adrianotothestar.com',
        'https://www.adrianotothestar.com',
        'http://localhost:8787',
        'http://127.0.0.1:8787',
        'null',
    ].join(',');
    const allowed = configured
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const allowOrigin = allowed.includes(requestOrigin) ? requestOrigin : allowed[0];

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json; charset=utf-8',
        Vary: 'Origin',
    };
}

async function readPayload(request) {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return request.json();
    }

    if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')
    ) {
        const formData = await request.formData();
        const payload = Object.fromEntries(formData.entries());
        payload.consent = payload.consent === 'on' || payload.consent === 'true';
        return payload;
    }

    const error = new Error('Unsupported content type.');
    error.status = 415;
    throw error;
}

function validatePayload(payload) {
    const form = {
        name: clean(payload.name, 120),
        email: clean(payload.email, 254),
        topic: clean(payload.topic || 'General test', 120),
        message: clean(payload.message, 4000),
        page: clean(payload.page || '', 500),
        submittedAt: clean(payload.submittedAt || '', 80),
        company: clean(payload.company || '', 120),
        consent: payload.consent === true || payload.consent === 'true' || payload.consent === 'on',
    };

    if (form.company) {
        return form;
    }

    if (form.name.length < 2) {
        throw badRequest('Name is required.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        throw badRequest('A valid email is required.');
    }

    if (form.message.length < 10) {
        throw badRequest('Message must be at least 10 characters.');
    }

    if (!form.consent) {
        throw badRequest('Consent is required.');
    }

    return form;
}

function clean(value, maxLength) {
    return String(value || '')
        .replace(/\u0000/g, '')
        .trim()
        .slice(0, maxLength);
}

function badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

function buildTextEmail(form, request) {
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    return [
        'New Adriano To The Star test form submission',
        '',
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Topic: ${form.topic}`,
        `Page: ${form.page || 'Unknown'}`,
        `Submitted: ${form.submittedAt || new Date().toISOString()}`,
        `User-Agent: ${userAgent}`,
        '',
        'Message:',
        form.message,
    ].join('\n');
}

function buildHtmlEmail(form, request) {
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const rows = [
        ['Name', form.name],
        ['Email', form.email],
        ['Topic', form.topic],
        ['Page', form.page || 'Unknown'],
        ['Submitted', form.submittedAt || new Date().toISOString()],
        ['User-Agent', userAgent],
    ];
    const details = rows
        .map(
            ([label, value]) =>
                `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
        )
        .join('');

    return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
    <h1 style="font-size:20px">New Adriano To The Star test form submission</h1>
    <table>${details}</table>
    <h2 style="font-size:16px;margin-top:20px">Message</h2>
    <p style="white-space:pre-wrap">${escapeHtml(form.message)}</p>
  </body>
</html>`;
}

function buildRawEmail({ sender, senderName, recipient, replyTo, subject, text, html }) {
    const boundary = `----adrianotothestar-${crypto.randomUUID()}`;
    const headers = [
        `From: ${formatAddress(senderName, sender)}`,
        `To: ${safeHeader(recipient)}`,
        `Reply-To: ${safeHeader(replyTo)}`,
        `Subject: ${safeHeader(subject)}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: <${crypto.randomUUID()}@adrianotothestar.com>`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];

    const parts = [
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        text,
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        html,
        `--${boundary}--`,
        '',
    ];

    return [...headers, '', ...parts].join('\r\n');
}

function formatAddress(name, email) {
    const safeName = safeHeader(name).replace(/"/g, '\\"');
    return `"${safeName}" <${safeHeader(email)}>`;
}

function safeHeader(value) {
    return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function json(payload, status, headers) {
    return new Response(JSON.stringify(payload), {
        status,
        headers,
    });
}
