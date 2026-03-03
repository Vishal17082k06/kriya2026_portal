import { useEffect, useRef } from "react";
import "../styles/island.css";

// ── Pixel size (tile dimension in screen px)
const PX = 8;

// ── Rich blue palette combos for ocean tiles
const DEEP = ["#03045e", "#023e8a", "#0353a4", "#0077b6"];
const MID = ["#0096c7", "#00b4d8", "#0077b6", "#0096c7"];
const SHALLOW = ["#48cae4", "#90e0ef", "#00b4d8", "#48cae4"];
const BRIGHT = ["#90e0ef", "#ade8f4", "#caf0f8", "#48cae4"];
const FOAM = ["#ffffff", "#caf0f8", "#e0f7ff", "#ade8f4"];
const SPARKLE = ["#ffffff", "#ade8f4", "#90e0ef"];

// ── Seeded random (deterministic per tile so no flicker on non-animated tiles)
function seededRand(seed) {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

// ── Pick a colour from a palette using a deterministic seed
function pick(palette, seed) {
  return palette[Math.floor(seededRand(seed) * palette.length)];
}

export default function Ocean() {
  const ref = useRef();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    let animId;

    function resize() {
      canvas.width = Math.ceil(window.innerWidth / PX);
      canvas.height = Math.ceil(window.innerHeight / PX);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    // Pre-build a noise map for organic variation
    const NOISE_SIZE = 128;
    const noise = new Float32Array(NOISE_SIZE * NOISE_SIZE);
    for (let i = 0; i < noise.length; i++) noise[i] = seededRand(i * 7919);

    function sampleNoise(gx, gy) {
      const nx = ((gx % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE;
      const ny = ((gy % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE;
      return noise[ny * NOISE_SIZE + nx];
    }

    function draw(ms) {
      const t = ms * 0.001;
      const cols = canvas.width;
      const rows = canvas.height;

      for (let gy = 0; gy < rows; gy++) {
        const depthFrac = gy / rows;

        for (let gx = 0; gx < cols; gx++) {
          const seed = gy * 2000 + gx;

          // ── Wavy depth offset: gives horizontal stripe warping
          const waveOffset =
            Math.sin(gx * 0.15 + t * 1.2) * 0.06 +
            Math.sin(gx * 0.07 - t * 0.8) * 0.04;
          const noiseVal = sampleNoise(gx, gy) * 0.06;
          const d = Math.min(1, Math.max(0, depthFrac + waveOffset + noiseVal));

          // ── Choose palette band
          let color;
          if (d < 0.20) color = pick(DEEP, seed);
          else if (d < 0.42) color = pick(MID, seed);
          else if (d < 0.66) color = pick(SHALLOW, seed);
          else color = pick(BRIGHT, seed);

          // ── Animated wave crests (bright horizontal ribbons)
          const crest1 = Math.sin(gx * 0.18 + t * 2.0 + gy * 0.05);
          const crest2 = Math.sin(gx * 0.09 - t * 1.5 + gy * 0.03);
          const crest = (crest1 + crest2) * 0.5;
          if (crest > 0.82 && seededRand(seed + Math.floor(t * 3)) > 0.35) {
            color = pick(SHALLOW, seed + 1);
          }

          // ── Foam dots scattered along mid-wave band
          const foamBand = Math.sin(gx * 0.12 + t * 1.8 - gy * 0.08);
          if (
            foamBand > 0.78 &&
            d > 0.25 && d < 0.72 &&
            seededRand(seed + Math.floor(t * 4)) > 0.55
          ) {
            color = pick(FOAM, seed + 3);
          }

          // ── Sun sparkles (tiny bright flashes near surface)
          const sparkleX = Math.sin(gx * 0.35 + t * 3.5);
          const sparkleY = Math.cos(gy * 0.25 - t * 2.8);
          if (
            sparkleX * sparkleY > 0.80 &&
            d < 0.55 &&
            seededRand(seed + Math.floor(t * 6)) > 0.70
          ) {
            color = pick(SPARKLE, seed + 5);
          }

          ctx.fillStyle = color;
          ctx.fillRect(gx, gy, 1, 1);
        }
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="ocean-canvas" />;
}