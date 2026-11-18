// Draws welcome/goodbye banner images. @napi-rs/canvas is optional: if it is not installed
// (or fails to load on this platform) renderBanner() returns null and callers fall back to text.
let canvas;
try {
    canvas = require('@napi-rs/canvas');
} catch (e) {
    console.warn('[banner] @napi-rs/canvas is not installed; welcome/goodbye banners are disabled. Install it with `npm install @napi-rs/canvas`.');
}

const WIDTH = 1024;
const HEIGHT = 450;
const FONT = '"DejaVu Sans", "Liberation Sans", Arial, Helvetica, sans-serif';

const available = () => Boolean(canvas);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Downloads an image with a timeout, an image/* content-type check and a 5 MB cap, because
// background URLs are admin-supplied and fetched on every join.
async function fetchImage(url) {
    if (!url) return null;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok || !res.body) return null;
        if (!(res.headers.get('content-type') || '').toLowerCase().startsWith('image/')) return null;
        if (Number(res.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) return null;

        const chunks = [];
        let size = 0;
        const reader = res.body.getReader();
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_IMAGE_BYTES) {
                await reader.cancel().catch(() => { });
                return null;
            }
            chunks.push(value);
        }
        return await canvas.loadImage(Buffer.concat(chunks));
    } catch (e) {
        return null;
    }
}

// Shrinks the font until `text` fits within `maxWidth`.
function fitText(ctx, text, maxSize, maxWidth, weight = 'bold') {
    let size = maxSize;
    do {
        ctx.font = `${weight} ${size}px ${FONT}`;
        size -= 2;
    } while (ctx.measureText(text).width > maxWidth && size > 12);
}

function drawCover(ctx, image) {
    const scale = Math.max(WIDTH / image.width, HEIGHT / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
}

/**
 * @param {object} opts
 * @param {'welcome'|'goodbye'} opts.kind
 * @param {string} opts.avatarURL   PNG avatar URL
 * @param {string} opts.username
 * @param {string} opts.subtitle    e.g. "Member #42" or the server name
 * @param {string} [opts.background] optional background image URL
 * @returns {Promise<Buffer|null>}
 */
async function renderBanner({ kind, avatarURL, username, subtitle, background }) {
    if (!canvas) return null;

    try {
        const surface = canvas.createCanvas(WIDTH, HEIGHT);
        const ctx = surface.getContext('2d');
        const accent = kind === 'goodbye' ? '#EF6C00' : '#F9A825';

        // Background: custom image if it loads, otherwise a gradient.
        const bg = await fetchImage(background);
        if (bg) {
            drawCover(ctx, bg);
        } else {
            const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
            gradient.addColorStop(0, '#1A1C23');
            gradient.addColorStop(1, kind === 'goodbye' ? '#3E2723' : '#263238');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        // Dark overlay keeps text readable on any background.
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(20, 20, WIDTH - 40, HEIGHT - 40);

        // Avatar with accent ring.
        const cx = WIDTH / 2, cy = 150, r = 95;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.fill();

        const avatar = await fetchImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (avatar) {
            ctx.drawImage(avatar, cx - r, cy - r, r * 2, r * 2);
        } else {
            ctx.fillStyle = '#37474F';
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
        ctx.restore();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = accent;
        ctx.font = `bold 56px ${FONT}`;
        ctx.fillText(kind === 'goodbye' ? 'GOODBYE' : 'WELCOME', cx, 300);

        ctx.fillStyle = '#FFFFFF';
        fitText(ctx, username, 40, WIDTH - 120);
        ctx.fillText(username, cx, 355);

        ctx.fillStyle = '#CFD8DC';
        fitText(ctx, subtitle, 28, WIDTH - 120, 'normal');
        ctx.fillText(subtitle, cx, 400);

        return await surface.encode('png');
    } catch (e) {
        console.log('[banner] failed to render banner:', e);
        return null;
    }
}

module.exports = { available, renderBanner };
