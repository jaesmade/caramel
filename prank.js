const SW = screen.availWidth;
const SH = screen.availHeight;
const WW = 480;
const WH = 300;
const V = 15;
const MG = 10;
const TICK = 50;

const MAX_POPUPS = 8; // how many popups at once
const SPAWN_EVERY_MS = 2000; // a new popup every 3 seconds until MAX_POPUPS
const RESPAWN_ON_CLOSE = true; // a closed popup gets replaced
const RESPAWN_CHECK_MS = 500; // how fast the replacement comes
const SHOW_EXIT = false; // true = show a "Let me out" button after 15s
const SONG_HOP_MS = 2000; // the song jumps to another popup this often

const G = "assets/";
const SONG = "assets/caramel.m4a";
const SALT = "assets/notavirus.jpg";
// Each new popup chooses independently from the GIFs in assets/.
const POPUP_ASSETS = [
  "epsdancing.gif",
  "h1.gif",
  "h2.gif",
  "h3.gif",
  "h4.gif",
  "h5.gif",
  "rickroll.gif",
];

const PHRASES = ["nigga", "nigga", "nigga", "nigga", "nigga", "nigga", "nigga"];

const $ = (id) => document.getElementById(id);
const R = (n) => Math.random() * n;
const pick = (a) => a[Math.floor(R(a.length))];

const sameOrigin = () => {
  try {
    return window.opener.location.origin === location.origin;
  } catch {
    return false;
  }
};

const isChild =
  (window.opener && sameOrigin()) ||
  new URLSearchParams(location.search).has("child");

let on = true;
let count = 0;
let wins = [];
let fake = [];
let timers = [];
let audio = null;
let lj = 0;
let mx = -1;
let my = -1;
let th = 0;
let audioContext = null;
let peak = 0;
let saltDone = false;

const myId = Math.random().toString(36).slice(2);
const bc = new BroadcastChannel("cgs");
const kids = new Set(); // ids of open popups (main page keeps this list)
let holder = null; // which popup is currently playing the song

if (!localStorage.getItem("cgs_session") && !isChild) {
  location.replace("login.html");
}

/* ---------- audio ---------- */

function startAudio() {
  if (audio || (!isChild && holder)) return;

  const a = new Audio(SONG);
  a.loop = true;
  a.volume = 0.5;
  audio = a;

  a.play()
    .then(() => {
      if (isChild) bc.postMessage({ t: "playing", id: myId });
    })
    .catch(() => {
      audio = null;
      if (isChild) bc.postMessage({ t: "blocked", id: myId });
    });
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}

function pickHolder() {
  if (isChild) return;

  const ids = [...kids];
  if (!ids.length) {
    // no popups open: the main page plays
    holder = null;
    startAudio();
    return;
  }

  holder = pick(ids);
  bc.postMessage({ t: "play", id: holder }); // main keeps playing until the popup confirms
}

bc.onmessage = (e) => {
  const d = e.data;

  if (d === "stop") return stop();

  if (isChild) {
    if (d.t === "play") {
      if (d.id === myId) startAudio();
      else stopAudio();
    }
  } else {
    if (d.t === "hello") {
      kids.add(d.id);
      if (!holder) pickHolder();
    }
    if (d.t === "bye") {
      kids.delete(d.id);
      if (d.id === holder) pickHolder();
    }
    if (d.t === "playing" && d.id === holder) {
      stopAudio(); // popup confirmed, main goes quiet
    }
    if (d.t === "blocked" && d.id === holder) {
      kids.delete(d.id); // popup not allowed to play, main keeps the song
      holder = null;
      startAudio();
    }
  }
};

/* ---------- memes ---------- */

function meme() {
  const f = pick(POPUP_ASSETS);
  const t = "RIPBOZO";
  const d = document.createElement("div");
  d.className = "meme";

  const i = new Image();
  i.src = G + f;
  i.alt = t;

  i.onerror = () => {
    i.remove();
    const b = document.createElement("b");
    b.textContent = "[" + f + "]";
    d.prepend(b);
  };

  d.append(i);

  const s = document.createElement("span");
  s.textContent = t;
  d.append(s);

  return d;
}

let tt;

function toast() {
  const t = $("toast");
  if (!t) return;

  t.replaceChildren(meme());
  t.style.display = "grid";

  clearTimeout(tt);
  tt = setTimeout(() => {
    t.style.display = "none";
  }, 1500);
}

function speak(p) {
  try {
    const u = new SpeechSynthesisUtterance(p || pick(PHRASES));
    u.rate = 1.1;
    speechSynthesis.speak(u);
  } catch {}
}

function theremin() {
  if (th) return;
  th = 1;

  try {
    audioContext = new AudioContext();

    const o = audioContext.createOscillator();
    const g = audioContext.createGain();

    g.gain.value = 0.025;
    o.connect(g);
    g.connect(audioContext.destination);
    o.start();

    addEventListener("mousemove", (e) => {
      if (!on || !audioContext) return;
      o.frequency.value = 200 + (e.clientX / innerWidth) * 900;
    });
  } catch {}
}

/* ---------- download ---------- */

async function salt() {
  let url;

  try {
    const r = await fetch(SALT);
    if (!r.ok) throw new Error("Image unavailable");
    url = URL.createObjectURL(await r.blob());
  } catch {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 500;

    const x = c.getContext("2d");
    x.fillStyle = "#8b917f";
    x.fillRect(0, 0, 800, 500);
    x.fillStyle = "#23261f";
    x.textAlign = "center";
    x.font = "700 56px sans-serif";
    x.fillText("RIPBOZO", 400, 250);

    url = await new Promise((resolve) => {
      c.toBlob(
        (blob) => {
          resolve(blob ? URL.createObjectURL(blob) : "");
        },
        "image/jpeg",
        0.9,
      );
    });
  }

  if (!url) return;

  const a = document.createElement("a");
  a.href = url;
  a.download = "ripbozo.jpg";
  document.body.append(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saltOnce() {
  if (saltDone) return;
  saltDone = true;
  salt();
}

/* ---------- windows ---------- */

function coords() {
  return {
    x: MG + Math.floor(R(Math.max(1, SW - WW - MG))),
    y: MG + Math.floor(R(Math.max(1, SH - WH - MG))),
  };
}

function bounce() {
  let vx = V * (Math.random() > 0.5 ? 1 : -1);
  let vy = V * (Math.random() > 0.5 ? 1 : -1);

  timers.push(
    setInterval(() => {
      if (!on) return;

      const x = screenX;
      const y = screenY;
      const w = outerWidth;
      const h = outerHeight;

      if (x < MG) vx = Math.abs(vx);
      if (x + w > SW - MG) vx = -Math.abs(vx);
      if (y < MG + 20) vy = Math.abs(vy);
      if (y + h > SH - MG) vy = -Math.abs(vy);

      try {
        if (isChild) moveBy(vx, vy);
      } catch {}
    }, TICK),
  );
}

function jump() {
  const n = Date.now();
  if (n - lj < 250) return;
  lj = n;

  const w = Math.max(240, outerWidth * 0.85);
  const h = Math.max(200, outerHeight * 0.85);

  try {
    if (isChild) {
      resizeTo(w, h);
      moveTo(R(Math.max(1, SW - w)), R(Math.max(1, SH - h)));
    }
  } catch {}
}

addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;

  if (on && isChild && e.clientY < 110 && e.clientX > innerWidth - 330) {
    jump();
  }
});

function openWindow() {
  wins = wins.filter((w) => !w.closed);
  if (wins.length >= MAX_POPUPS) return false;

  const { x, y } = coords();
  const w = window.open(
    location.pathname + "?child=true",
    "",
    `width=${WW},height=${WH},left=${x},top=${y}`,
  );
  if (!w) return false;

  wins.push(w);
  peak = Math.max(peak, wins.length);
  return true;
}

function fakeWin() {
  if (fake.length >= 8) return;

  const w = document.createElement("div");
  w.className = "win";

  const b = document.createElement("div");
  b.className = "bar";

  const title = document.createElement("span");
  title.textContent = "RIPBOZO.exe";

  const x = document.createElement("button");
  x.className = "x";
  x.textContent = "X";
  x.setAttribute("aria-label", "Close meme");

  b.append(title, x);
  w.append(b, meme());
  document.body.append(w);

  const obj = {
    w,
    x: R(Math.max(1, innerWidth - 200)),
    y: R(Math.max(1, innerHeight - 200)),
    vx: (R(6) + 3) * (Math.random() < 0.5 ? -1 : 1),
    vy: (R(6) + 3) * (Math.random() < 0.5 ? -1 : 1),
  };

  x.addEventListener("click", () => {
    w.remove();
    fake = fake.filter((o) => o !== obj);
  });

  fake.push(obj);
}

(function loop() {
  for (const o of fake) {
    o.x += o.vx;
    o.y += o.vy;

    if (o.x < 0 || o.x > innerWidth - 200) o.vx *= -1;
    if (o.y < 0 || o.y > innerHeight - 150) o.vy *= -1;

    o.w.style.left = o.x + "px";
    o.w.style.top = o.y + "px";
  }

  if (on) requestAnimationFrame(loop);
})();

function stage() {
  const s = $("stage");
  if (!s) return;

  s.replaceChildren();
  s.style.display = "block";

  const c = document.createElement("div");
  c.className = "cap";

  const el = new Image();
  el.src = G + pick(POPUP_ASSETS);
  el.alt = "RIPBOZO";

  el.onerror = () => {
    el.style.display = "none";
    c.textContent = "RIPBOZO (image not found)";
  };

  c.textContent = "RIPBOZO";
  s.append(el, c);
}

/* ---------- input ---------- */

function intercept(fn) {
  ["mousedown", "mouseup", "click", "keydown"].forEach((t) => {
    document.body.addEventListener(t, fn);
  });
}

const KEYS = (e) => {
  const k = e.key.toLowerCase();

  if (e.altKey && k === "f4") return "chad";
  if (e.ctrlKey && k === "w") return "bonk";
  if (e.key === "Escape") return "troll";
  if (e.key === "F5" || (e.ctrlKey && k === "r")) return "rick";
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && k === "i"))
    return "sponge";
  if (e.ctrlKey && k === "s") return "stonks";

  return null;
};

function init(e) {
  if (!on) return;

  if (e.target.closest?.("#out")) return;
  if (e.target.closest?.(".win .x")) return;

  if (e.type === "keydown") {
    const m = KEYS(e);
    if (m) toast();
  }

  // only the main page opens popups; if they are blocked, use in-page windows
  if (!isChild) {
    if (!openWindow()) fakeWin();
  }

  count++;

  if (!isChild || audio) {
    // popups only make noise if they hold the song
    speak();
    theremin();
  }

  if (count === 1 && !isChild) {
    startAudio();
    saltOnce();

    // ramp up: a new popup every SPAWN_EVERY_MS
    timers.push(
      setInterval(() => {
        if (on) openWindow();
      }, SPAWN_EVERY_MS),
    );

    // if one gets closed, replace it
    if (RESPAWN_ON_CLOSE) {
      timers.push(
        setInterval(() => {
          if (!on) return;
          wins = wins.filter((w) => !w.closed);
          if (wins.length < peak) openWindow();
        }, RESPAWN_CHECK_MS),
      );
    }

    // the song hops to a different popup
    timers.push(
      setInterval(() => {
        if (on && kids.size > 1) pickHolder();
      }, SONG_HOP_MS),
    );
  }
}

/* ---------- stop ---------- */

function stop() {
  if (!on) return;
  on = false;

  timers.forEach(clearInterval);
  timers = [];
  clearTimeout(tt);

  stopAudio();

  try {
    speechSynthesis.cancel();
  } catch {}
  try {
    if (audioContext) audioContext.close();
  } catch {}

  wins.forEach((w) => {
    try {
      w.close();
    } catch {}
  });
  wins = [];

  fake.forEach((o) => o.w.remove());
  fake = [];

  try {
    bc.postMessage("stop");
    bc.close();
  } catch {}

  if (isChild) {
    window.close();
    return;
  }

  const toastEl = $("toast");
  const stageEl = $("stage");
  const outEl = $("out");
  const revealEl = $("reveal");

  if (toastEl) toastEl.style.display = "none";
  if (stageEl) stageEl.style.display = "none";
  if (outEl) outEl.style.display = "none";
  if (revealEl) revealEl.style.display = "grid";

  document.title = "RIPBOZO - Chilled Guy Studio";
}

if ($("out")) {
  $("out").addEventListener("click", stop);
  if (SHOW_EXIT) {
    setTimeout(() => {
      $("out").style.display = "block";
    }, 15000);
  }
}

/* ---------- start ---------- */

if (isChild) {
  if ($("start")) $("start").style.display = "none";

  stage();
  bounce();

  bc.postMessage({ t: "hello", id: myId });
  addEventListener("pagehide", () => {
    try {
      bc.postMessage({ t: "bye", id: myId });
    } catch {}
  });

  intercept(init);
} else {
  if ($("go")) {
    $("go").addEventListener("click", () => {
      startAudio(); // the song starts on the Continue click
      saltOnce(); // and so does the download

      if ($("start")) $("start").style.display = "none";

      document.body.classList.add("shake");
      setTimeout(() => {
        if (on) document.body.classList.add("spin");
      }, 12000);

      toast();
    });
  }

  intercept(init);
}
