import { useEffect, useRef } from "react";
import "../styles/realisticOcean.css";
//import asset1 from "../assets/ChatGPT Image Feb 19, 2026, 10_26_57 PM.png";
//import asset2 from "../assets/ChatGPT Image Feb 19, 2026, 10_30_40 PM.png";
//import asset3 from "../assets/ChatGPT Image Feb 19, 2026, 10_30_55 PM.png";

// ─── Smooth noise (value noise via bilinear interpolation) ───────────────────
const _noiseTable = (() => {
    const arr = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
        const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
        arr[i] = x - Math.floor(x);
    }
    return arr;
})();

function smoothNoise(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const u = fade(xf);
    const v = fade(yf);
    const n00 = _noiseTable[((xi + yi * 57) & 511)];
    const n10 = _noiseTable[((xi + 1 + yi * 57) & 511)];
    const n01 = _noiseTable[((xi + (yi + 1) * 57) & 511)];
    const n11 = _noiseTable[((xi + 1 + (yi + 1) * 57) & 511)];
    return (
        n00 * (1 - u) * (1 - v) +
        n10 * u * (1 - v) +
        n01 * (1 - u) * v +
        n11 * u * v
    );
}

function fbm(x, y, octaves = 4) {
    let val = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
        val += smoothNoise(x * freq, y * freq) * amp;
        max += amp;
        amp *= 0.5;
        freq *= 2.1;
    }
    return val / max;
}

// ─── Wave layers configuration ───────────────────────────────────────────────
const WAVE_LAYERS = [
    { amp: 0.022, freq: 0.6, speed: 0.40, phase: 0.0 },
    { amp: 0.014, freq: 1.1, speed: 0.65, phase: 1.3 },
    { amp: 0.009, freq: 2.3, speed: 0.90, phase: 2.7 },
    { amp: 0.006, freq: 3.8, speed: 1.20, phase: 0.8 },
    { amp: 0.018, freq: 0.38, speed: 0.28, phase: 4.1 },
];

const BUBBLES = Array.from({ length: 30 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.5 + Math.random() * 2,
    speed: 0.02 + Math.random() * 0.03,
    phase: Math.random() * Math.PI * 2,
}));

const FISH = Array.from({ length: 4 }, (_, i) => ({
    y: 0.4 + Math.random() * 0.4,
    speed: 0.05 + Math.random() * 0.1,
    scale: 0.3 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
}));

//const ASSET_IMAGES = [asset1, asset2, asset3];
// const STATIC_ASSETS = [
//     { src: asset1, x: 0.20, y: 0.30, size: 250 },
//     { src: asset2, x: 0.70, y: 0.50, size: 280 },
//     { src: asset3, x: 0.40, y: 0.75, size: 220 },
// ].map(a => ({ ...a, img: null }));
const STATIC_ASSETS = [];

function waveHeight(nx, t) {
    let h = 0;
    for (const w of WAVE_LAYERS) {
        h += Math.sin(nx * w.freq * Math.PI * 2 + t * w.speed + w.phase) * w.amp;
    }
    return h;
}

// ─── Colour helpers ──────────────────────────────────────────────────────────
function lerpColor(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    return [
        c1[0] + (c2[0] - c1[0]) * t,
        c1[1] + (c2[1] - c1[1]) * t,
        c1[2] + (c2[2] - c1[2]) * t,
    ];
}
function rgba(c, a = 1) {
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
}

// Colour stops
const COL_DEEP = [1, 11, 40];
const COL_MID = [0, 50, 110];
const COL_SHALLOW = [0, 90, 160];
const COL_SURF = [0, 140, 200];

export default function RealisticOcean() {
    const ref = useRef();

    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas.getContext("2d");

        let offscreen, offCtx;
        let W, H, animId;
        let startTime = null;

        function resize() {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            offscreen = document.createElement("canvas");
            offscreen.width = W;
            offscreen.height = H;
            offCtx = offscreen.getContext("2d");
        }
        resize();
        window.addEventListener("resize", resize);

        function makeDepthGradient(y0, y1) {
            const g = ctx.createLinearGradient(0, y0, 0, y1);
            g.addColorStop(0.00, rgba(COL_DEEP, 1));
            g.addColorStop(0.35, rgba(COL_MID, 1));
            g.addColorStop(0.70, rgba(COL_SHALLOW, 1));
            g.addColorStop(1.00, rgba(COL_SURF, 1));
            return g;
        }

        function drawGodRays(t) {
            const rayCount = 6;
            for (let i = 0; i < rayCount; i++) {
                const seed = i * 1.5;
                const x = ((t * 0.05 + seed) % 2 - 0.5) * W;
                const width = 100 + Math.sin(t * 0.5 + seed) * 40;
                const alpha = 0.02 + Math.sin(t * 0.8 + seed) * 0.01;

                const grd = ctx.createLinearGradient(x, 0, x + 200, H);
                grd.addColorStop(0, `rgba(200, 240, 255, ${alpha})`);
                grd.addColorStop(1, "rgba(0, 0, 0, 0)");

                ctx.save();
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + width, 0);
                ctx.lineTo(x + width + 300, H);
                ctx.lineTo(x + 300, H);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        function drawBubbles(t) {
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            for (const b of BUBBLES) {
                const bx = ((b.x * W + Math.sin(t * 0.5 + b.phase) * 20) % W + W) % W;
                const by = ((b.y * H - t * b.speed * H) % H + H) % H;
                ctx.beginPath();
                ctx.arc(bx, by, b.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        function drawFish(t) {
            for (let i = 0; i < FISH.length; i++) {
                const f = FISH[i];
                const fx = ((t * f.speed * W + f.phase * W) % (W + 200)) - 100;
                const fy = f.y * H + Math.sin(t * 1.2 + f.phase) * 15;

                ctx.save();
                ctx.translate(fx, fy);
                ctx.scale(f.scale, f.scale);
                ctx.fillStyle = "rgba(0, 20, 50, 0.15)";

                // Simple fish body
                ctx.beginPath();
                ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
                // Tail
                ctx.moveTo(-15, 0);
                ctx.lineTo(-25, -10);
                ctx.lineTo(-25, 10);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        const loadedAssets = [];
        STATIC_ASSETS.forEach(a => {
            const img = new Image();
            img.src = a.src;
            img.onload = () => { a.img = img; };
            loadedAssets.push(a);
        });

        function drawAssets(t) {
            for (const a of loadedAssets) {
                if (!a.img) continue;
                const ax = a.x * W;
                const ay = a.y * H;

                ctx.save();
                ctx.globalAlpha = 1.0; // Fully opaque as requested
                ctx.drawImage(a.img, ax - a.size / 2, ay - a.size / 2, a.size, a.size);
                ctx.restore();
            }
        }

        function drawCaustics(t) {
            offCtx.clearRect(0, 0, W, H);
            const count = 40 + Math.floor(W / 30);
            for (let i = 0; i < count; i++) {
                const seed = i * 1.618;
                const bx = ((Math.sin(seed * 17.3) * 0.5 + 0.5) * W);
                const by = ((Math.sin(seed * 11.7) * 0.5 + 0.5) * H);
                const phase = seed * 2.31;
                const rx = (20 + Math.abs(Math.sin(seed * 5.1)) * 60) * (0.8 + 0.4 * Math.sin(t * 0.9 + phase));
                const ry = rx * (0.3 + 0.2 * Math.cos(t * 1.1 + phase * 1.3));
                const alpha = 0.03 + 0.04 * Math.abs(Math.sin(t * 1.3 + phase));

                const grd = offCtx.createRadialGradient(bx, by, 0, bx, by, rx);
                grd.addColorStop(0, `rgba(180,230,255,${alpha})`);
                grd.addColorStop(0.5, `rgba(100,190,240,${alpha * 0.4})`);
                grd.addColorStop(1, "rgba(0,0,0,0)");

                offCtx.save();
                offCtx.translate(bx, by);
                offCtx.scale(1, ry / Math.max(rx, 1));
                offCtx.translate(-bx, -by);
                offCtx.fillStyle = grd;
                offCtx.beginPath();
                offCtx.arc(bx, by, rx, 0, Math.PI * 2);
                offCtx.fill();
                offCtx.restore();
            }
        }

        function drawFoam(t) {
            const streakCount = 24;
            for (let i = 0; i < streakCount; i++) {
                const seed = i * 2.4;
                const frac = (Math.sin(seed * 13.1) * 0.5 + 0.5);
                const screenY = frac * H;
                const phase = seed * 3.7;
                const speed = 0.22 + frac * 0.18;
                const xOff = ((t * speed + phase) % 1.5) * W;

                const len = 40 + frac * 120;
                const alpha = 0.10 + 0.15 * frac;
                const thick = 1 + frac * 2.5;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = "rgba(255,255,255,0.9)";
                ctx.lineWidth = thick;
                ctx.beginPath();
                for (let s = 0; s <= 20; s++) {
                    const sx = ((xOff + s * (len / 20)) % W);
                    const wh = waveHeight(sx / W * 4 + frac * 2, t) * H * 0.06;
                    const sy = screenY + wh;
                    if (s === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.stroke();
                ctx.restore();
            }
        }

        function draw(ms) {
            if (startTime === null) startTime = ms;
            const t = (ms - startTime) * 0.001;

            ctx.clearRect(0, 0, W, H);

            // 1. Background
            ctx.fillStyle = makeDepthGradient(0, H);
            ctx.fillRect(0, 0, W, H);

            // 1.5 God Rays
            drawGodRays(t);

            // 1.6 Fish
            drawFish(t);

            // 1.65 PNG Assets
            drawAssets(t);

            // 1.7 Bubbles
            drawBubbles(t);

            // 2. Caustics
            drawCaustics(t);
            ctx.globalCompositeOperation = "screen";
            ctx.drawImage(offscreen, 0, 0);
            ctx.globalCompositeOperation = "source-over";

            // 3. Wave lines
            const ROWS = 100;
            for (let row = 0; row < ROWS; row++) {
                const frac = row / ROWS;
                const screenY = frac * H;
                const perspScale = 0.3 + frac * 0.7;

                ctx.beginPath();
                const steps = Math.ceil(W / 4);
                for (let s = 0; s <= steps; s++) {
                    const nx = s / steps;
                    const h = waveHeight(nx * perspScale * 4 + frac * 2.1, t);
                    const turb = fbm(nx * 6 + t * 0.12, frac * 3 + t * 0.08) * 0.06 - 0.03;
                    const py = screenY + (h + turb) * H * 0.09 * (1 - frac * 0.5);
                    if (s === 0) ctx.moveTo(0, py);
                    else ctx.lineTo(s * (W / steps), py);
                }

                let rowCol;
                if (frac < 0.35) rowCol = lerpColor(COL_DEEP, COL_MID, frac / 0.35);
                else if (frac < 0.70) rowCol = lerpColor(COL_MID, COL_SHALLOW, (frac - 0.35) / 0.35);
                else rowCol = lerpColor(COL_SHALLOW, COL_SURF, (frac - 0.70) / 0.30);

                const crestVal = waveHeight((row * 0.37 + t * 0.5) % 4, t);
                const crestAlpha = Math.max(0, crestVal * 10);
                const crestWidth = 0.5 + frac * 1.5;

                ctx.strokeStyle = rgba(rowCol, 0.2 + frac * 0.3);
                ctx.lineWidth = crestWidth;
                ctx.stroke();

                if (crestAlpha > 0.4) {
                    ctx.strokeStyle = `rgba(200,240,255,${(crestAlpha * 0.15).toFixed(3)})`;
                    ctx.lineWidth = crestWidth * 1.4;
                    ctx.stroke();
                }
            }

            // 4. Foam
            drawFoam(t);

            // 5. Vignette
            const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9);
            vig.addColorStop(0, "rgba(0,0,0,0)");
            vig.addColorStop(1, "rgba(0,5,25,0.4)");
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            animId = requestAnimationFrame(draw);
        }

        animId = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={ref} className="realistic-ocean-canvas" />;
}
