const CONFIG = {
  titleName: "My Love",
  from: "— From Me 😂",
  slideMs: 3500,
  imagesDir: "images/",
};

const WISH = [
  "Happy Birthday, my love.",
  "You make my life softer, brighter, and happier.",
  "",
  "I’m grateful for you, proud of you, and I’m always on your side.",
  "Today I just want you to feel loved — because you are.",
  "",
  "I love you. ❤️",
].join("\n");

const el = {
  canvas: document.getElementById("confetti"),
  openBtn: document.getElementById("openBtn"),
  envelope: document.getElementById("envelope"),
  content: document.getElementById("content"),
  subtitle: document.getElementById("subtitle"),
  title: document.getElementById("title"),
  msg: document.getElementById("msg"),
  fromLine: document.getElementById("fromLine"),
  photo: document.getElementById("photo"),
  thumbs: document.getElementById("thumbs"),
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadImagesFromManifest() {
  const node = document.getElementById("imagesManifest");
  if (!node) throw new Error("Missing #imagesManifest in index.html");
  const names = JSON.parse(node.textContent || "[]");
  if (!Array.isArray(names)) throw new Error("images.json must be an array of filenames");
  return names.map((n) => `${CONFIG.imagesDir}${n}`);
}

function setActiveThumb(idx) {
  const items = Array.from(el.thumbs.querySelectorAll(".thumb"));
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("active", i === idx);
  }
}

function renderThumbs(urls, onPick) {
  el.thumbs.innerHTML = "";
  urls.forEach((url, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb";
    btn.setAttribute("aria-label", `Open photo ${idx + 1}`);
    const img = document.createElement("img");
    img.alt = `Photo ${idx + 1}`;
    img.src = url;
    btn.appendChild(img);
    btn.addEventListener("click", () => onPick(idx));
    el.thumbs.appendChild(btn);
  });
}

function setPhoto(url) {
  el.photo.classList.remove("show");
  Promise.resolve().then(() => {
    el.photo.src = url;
    el.photo.onload = () => el.photo.classList.add("show");
  });
}

function typeIn(element, text, cps = 28) {
  element.textContent = "";
  let i = 0;
  const stepMs = Math.max(10, Math.floor(1000 / cps));
  const timer = window.setInterval(() => {
    i++;
    element.textContent = text.slice(0, i);
    if (i >= text.length) window.clearInterval(timer);
  }, stepMs);
  return () => window.clearInterval(timer);
}

function createConfetti(canvas) {
  const ctx = canvas.getContext("2d", { alpha: true });
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const colors = ["#ff4da6", "#7c4dff", "#ffd166", "#4dd7ff", "#c7ff4d"];
  let w = 0;
  let h = 0;
  let raf = 0;
  let particles = [];
  let running = false;

  function resize() {
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBurst(count = 170) {
    for (let i = 0; i < count; i++) {
      const size = 4 + Math.random() * 6;
      particles.push({
        x: w * (0.12 + Math.random() * 0.76),
        y: -20 - Math.random() * 80,
        vx: -2.5 + Math.random() * 5,
        vy: 2.2 + Math.random() * 3.8,
        g: 0.045 + Math.random() * 0.06,
        r: Math.random() * Math.PI,
        vr: -0.18 + Math.random() * 0.36,
        s: size,
        a: 1,
        c: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    particles = particles.filter((p) => p.a > 0.02 && p.y < h + 80);
    for (const p of particles) {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.a *= 0.992;

      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.72);
      ctx.restore();
    }

    if (running) raf = window.requestAnimationFrame(tick);
  }

  function start(durationMs = 3000) {
    if (running) return;
    running = true;
    resize();
    spawnBurst(190);
    tick();
    window.setTimeout(() => {
      running = false;
      window.cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      particles = [];
    }, durationMs);
  }

  window.addEventListener("resize", resize);
  resize();
  return { start };
}

async function main() {
  el.title.textContent = CONFIG.titleName;
  el.msg.textContent = "";
  el.fromLine.textContent = "";

  const confetti = createConfetti(el.canvas);

  let urls = [];
  try {
    urls = await loadImagesFromManifest();
  } catch (e) {
    el.subtitle.textContent = "Couldn’t load photos.";
    // eslint-disable-next-line no-console
    console.error(e);
  }

  let idx = 0;
  let timer = 0;

  function setIndex(next) {
    if (urls.length === 0) return;
    idx = (next + urls.length) % urls.length;
    setPhoto(urls[idx]);
    setActiveThumb(idx);
  }

  function startSlideshow() {
    if (timer) window.clearInterval(timer);
    if (urls.length === 0) return;
    timer = window.setInterval(() => setIndex(idx + 1), CONFIG.slideMs);
  }

  if (urls.length > 0) {
    renderThumbs(urls, (picked) => {
      setIndex(picked);
      startSlideshow();
    });
    setIndex(0);
    startSlideshow();
  } else {
    el.photo.alt = "No photos found in site/images";
  }

  let opened = false;
  let cancelTyping = null;
  async function openSurprise() {
    if (opened) return;
    opened = true;
    el.subtitle.textContent = "Opening…";
    el.envelope.classList.add("opening");
    el.openBtn.disabled = true;

    await sleep(900);
    document.body.classList.add("opened");
    el.content.classList.add("show");
    confetti.start(3200);

    el.subtitle.textContent = "Happy Birthday ❤️";
    if (cancelTyping) cancelTyping();
    cancelTyping = typeIn(el.msg, WISH, 34);
    el.fromLine.textContent = CONFIG.from;
  }

  el.openBtn.addEventListener("click", openSurprise);
  el.envelope.addEventListener("click", openSurprise);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});

