(() => {
const fontStyles = document.getElementById('google-fonts');
if (fontStyles) fontStyles.media = 'all';
document.body.classList.add('js');
const BASE = document.body.dataset.base || '';
const V = document.body.dataset.v || '';
const SLUG = document.body.dataset.slug || 'zuun-jil';
const asset = (p) => `${BASE}/${p}?v=${V}`;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let gateOpen = !!document.getElementById('gate');
let bflyRelease = null;
let rollOdo = null;
let unlockNarration = null;
let startAutoScroll = null, armAutoScroll = null, autoScrollHold = null, autoScrollRelease = null;
let narrationBusy = () => false, stopNarration = null;
let startBed = null, sealPressed = false;
const MSG = {
tooMany: 'Хэт олон удаа илгээгдлээ. Дараа дахин оролдоно уу.',
serverErr: 'Алдаа гарлаа. Дахин оролдоно уу.',
networkErr: 'Сервертэй холбогдсонгүй. Дахин оролдоно уу.',
musicPlay: 'Хөгжим тоглуулах',
musicPause: 'Хөгжмийг зогсоох',
wishNeed: 'Нэр болон сэтгэлийн үгээ бичнэ үү',
wishOk: 'Баярлалаа! Сэтгэлийн үг хүлээн авлаа',
badPhoto: 'Зураг тохирохгүй байна. Өөр зураг сонгоно уу.',
photoBig: 'Зураг хэт том байна. Багасгаж үзнэ үү.',
};
const musicBtn = document.getElementById('music-btn');
const bgMusic = document.getElementById('bg-music');
let bedHeld = false;
const bedWanted = () => musicBtn?.getAttribute('aria-pressed') === 'true';
if (musicBtn && bgMusic) {
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown'];
const onGesture = (e) => {
if (e.target instanceof Element && e.target.closest('#music-btn')) return;
bgMusic.play().then(disarm).catch(() => {});
};
const arm = () => GESTURES.forEach((n) => document.addEventListener(n, onGesture, { capture: true, passive: true }));
const disarm = () => GESTURES.forEach((n) => document.removeEventListener(n, onGesture, { capture: true }));
startBed = () => {
if (!bgMusic.getAttribute('src')) return;
bgMusic.play().then(disarm).catch(arm);
};
fetch(asset('assets/music-ganzam.mp3'), { method: 'HEAD' })
.then((r) => {
if (!r.ok) return;
bgMusic.setAttribute('src', asset('assets/music-ganzam.mp3'));
musicBtn.hidden = false;
if (sealPressed) startBed();
})
.catch(() => {  });
const setMusicState = (on) => {
musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
musicBtn.setAttribute('aria-label', on ? MSG.musicPause : MSG.musicPlay);
};
musicBtn.addEventListener('click', () => {
disarm();
if (bedWanted()) { bgMusic.pause(); setMusicState(false); }
else { setMusicState(true); bgMusic.play().catch(() => setMusicState(false)); }
});
bgMusic.addEventListener('pause', () => { if (!bedHeld) setMusicState(false); });
bgMusic.addEventListener('play', () => setMusicState(true));
}
const worldsEl = document.getElementById('worlds');
const THEME_KEY = `shakyru.theme.${SLUG}`;
const WORLD_BG = { night: '#07122A', day: '#F4EEE3', snow: '#F2F6FA' };
let snowing = null;
const savedWorld = (() => {
try { const w = localStorage.getItem(THEME_KEY); return w in WORLD_BG ? w : 'night'; } catch { return 'night'; }
})();
const setWorld = (w, turn) => {
const apply = () => {
const root = document.documentElement;
if (w === 'night') delete root.dataset.theme; else root.dataset.theme = w;
root.style.background = WORLD_BG[w];
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', WORLD_BG[w]);
worldsEl?.querySelectorAll('.world').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.world === w)));
if (snowing) snowing(w === 'snow');
};
const page = document.querySelector('.page');
if (!turn || reduceMotion || !page) { apply(); return; }
page.classList.add('is-turning');
setTimeout(() => { apply(); page.classList.remove('is-turning'); }, 240);
};
worldsEl?.addEventListener('click', (e) => {
const b = e.target instanceof Element ? e.target.closest('.world') : null;
if (!b || b.getAttribute('aria-pressed') === 'true') return;
setWorld(b.dataset.world, true);
try { localStorage.setItem(THEME_KEY, b.dataset.world); } catch {  }
});
const snowCv = document.getElementById('snowfall');
if (snowCv && !reduceMotion) {
const ctx = snowCv.getContext('2d');
let flakes = [], raf = 0, on = false, w = 0, h = 0, last = 0;
const size = () => {
const dpr = Math.min(2, window.devicePixelRatio || 1);
w = window.innerWidth; h = window.innerHeight;
snowCv.width = Math.round(w * dpr); snowCv.height = Math.round(h * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
const n = Math.round(Math.min(90, Math.max(36, (w * h) / 9000)));
flakes = Array.from({ length: n }, () => ({
x: Math.random() * w, y: Math.random() * h, r: 0.9 + Math.random() * 1.9,
v: 18 + Math.random() * 36, p: Math.random() * 6.28, a: 0.45 + Math.random() * 0.4,
}));
};
const tick = (now) => {
raf = 0;
if (!on) return;
const dt = Math.min(now - last, 64) / 1000;
last = now;
ctx.clearRect(0, 0, w, h);
ctx.fillStyle = '#FFFFFF';
ctx.strokeStyle = 'rgba(61, 108, 158, .3)';
ctx.lineWidth = 0.7;
for (const f of flakes) {
f.y += f.v * dt;
f.p += dt;
f.x += Math.sin(f.p) * 12 * dt;
if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
ctx.globalAlpha = f.a;
ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill(); ctx.stroke();
}
raf = requestAnimationFrame(tick);
};
const run = () => { if (on && !raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
snowing = (want) => {
on = want;
if (on) { if (!flakes.length) size(); run(); } else { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, w, h); }
};
window.addEventListener('resize', () => { if (on) size(); });
document.addEventListener('visibilitychange', run);
}
const FILM_MS = 3600;
const STALL_MS = 2500;
const HOLD_MS = 200;
const SKIP_AFTER_MS = 2200;
const HARD_MS = 9000;
const gate = document.getElementById('gate');
const showChrome = () => { if (worldsEl) worldsEl.hidden = false; };
const platePainted = () => {
const plate = document.querySelector('.hero-plate');
const r = plate && plate.getBoundingClientRect();
if (!r || r.width < 50) return null;
const w = Math.max(r.width, r.height * 9 / 16), h = Math.max(r.height, r.width * 16 / 9);
return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
};
if (gate) {
const stage = document.getElementById('g-stage');
const vid = document.getElementById('g-vid');
const skip = document.getElementById('g-skip');
let opened = false, finished = false, pressedAt = 0, watchdog = 0, skipTimer = 0, hardTimer = 0;
const startMusic = () => {
sealPressed = true;
if (startBed) startBed();
};
const enter = () => {
if (!gateOpen) return;
gateOpen = false;
document.body.classList.add('is-open');
startMusic();
gate.classList.add('is-going');
document.querySelector('.sec--cover')?.classList.add('is-active');
if (rollOdo) setTimeout(rollOdo, reduceMotion ? 0 : 1000);
showChrome();
if (bflyRelease) {
const p = platePainted();
if (p) bflyRelease(p.left + p.width * 0.512, p.top + p.height * 0.73); else bflyRelease(window.innerWidth * 0.5, -40);
}
const bird = musicBtn?.querySelector('.music-bird');
if (bird) {
musicBtn.classList.add('is-greeting');
bird.addEventListener('animationend', () => musicBtn.classList.remove('is-greeting'), { once: true });
}
if (armAutoScroll) armAutoScroll();
setTimeout(() => { if (startAutoScroll) startAutoScroll(); window.dispatchEvent(new Event('scroll')); }, 1000);
if (savedWorld !== 'night') setTimeout(() => setWorld(savedWorld, true), 1500);
const drop = () => gate.remove();
gate.addEventListener('transitionend', (e) => { if (e.target === gate) drop(); });
setTimeout(drop, 1000);
};
const land = () => {
window.scrollTo(0, 0);
const st = stage.getBoundingClientRect(), p = platePainted();
if (!p || p.top >= window.innerHeight) { enter(); return; }
const s = p.height / st.height;
const dx = p.left - st.left, dy = p.top - st.top;
if (Math.abs(s - 1) < 0.01 && Math.abs(dx) < 2 && Math.abs(dy) < 2) { enter(); return; }
gate.classList.add('is-landing');
stage.style.transform = `translate(${(p.left - window.innerWidth / 2).toFixed(2)}px, ${(p.top - window.innerHeight / 2).toFixed(2)}px) scale(${s.toFixed(5)})`;
setTimeout(enter, 780);
};
const finish = () => {
if (finished) return;
finished = true;
clearTimeout(watchdog); clearTimeout(skipTimer); clearTimeout(hardTimer);
const atEnd = !!vid && (vid.ended || (vid.duration > 0 && vid.currentTime >= vid.duration - 0.15));
try { vid.pause(); } catch {  }
if (atEnd && !reduceMotion) land(); else { window.scrollTo(0, 0); enter(); }
};
const open = () => {
if (finished) return;
if (opened) { if (Date.now() - pressedAt > 600) finish(); return; }
opened = true;
pressedAt = Date.now();
startMusic();
if (unlockNarration) unlockNarration();
if (reduceMotion || !vid) { setTimeout(finish, 500); return; }
gate.classList.add('is-playing');
vid.addEventListener('ended', () => setTimeout(finish, HOLD_MS), { once: true });
vid.addEventListener('error', finish, { once: true });
const src = vid.querySelector('source');
if (src) src.addEventListener('error', finish, { once: true });
const arm = (ms) => { clearTimeout(watchdog); watchdog = setTimeout(finish, ms); };
let lastT = 0;
arm(FILM_MS + STALL_MS);
hardTimer = setTimeout(finish, HARD_MS);
vid.addEventListener('timeupdate', () => { if (vid.currentTime > lastT) { lastT = vid.currentTime; arm(STALL_MS); } });
const p = vid.play();
if (p && typeof p.catch === 'function') p.catch(finish);
skipTimer = setTimeout(() => gate.classList.add('can-skip'), SKIP_AFTER_MS);
};
gate.addEventListener('click', open);
gate.addEventListener('keydown', (e) => {
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
});
if (skip) skip.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
for (const type of ['wheel', 'touchmove']) gate.addEventListener(type, (e) => e.preventDefault(), { passive: false });
} else {
showChrome();
document.querySelector('.sec--cover')?.classList.add('is-active');
if (savedWorld !== 'night') setWorld(savedWorld, false);
}
(() => {
const hosts = [...document.querySelectorAll('[data-narration]')];
if (!hosts.length || !bgMusic) return;
const MUSIC_DUCK = 0.1;
const canDuck = (() => {
const v = bgMusic.volume;
bgMusic.volume = 0.5;
const ok = Math.abs(bgMusic.volume - 0.5) < 0.02;
bgMusic.volume = v;
return ok;
})();
let duckTimer = null;
const rampMusic = (to) => {
if (duckTimer) clearInterval(duckTimer);
const from = bgMusic.volume;
let i = 0;
duckTimer = setInterval(() => {
i += 1;
bgMusic.volume = Math.min(1, Math.max(0, from + (to - from) * (i / 12)));
if (i >= 12) { clearInterval(duckTimer); duckTimer = null; }
}, 40);
};
const quietBed = () => { if (canDuck) rampMusic(MUSIC_DUCK); else if (!bgMusic.paused) bgMusic.pause(); };
const loudBed = () => {
bedHeld = false;
if (canDuck) rampMusic(1); else bgMusic.volume = 1;
if (bgMusic.paused && bedWanted()) {
bgMusic.play().catch(() => {
musicBtn?.setAttribute('aria-pressed', 'false');
musicBtn?.setAttribute('aria-label', MSG.musicPlay);
});
}
};
const readers = [];
const releaseBed = () => { if (!readers.some((r) => r.busy())) loudBed(); };
let speaking = null;
const narrate = (host) => {
const voice = new Audio();
voice.preload = 'none';
voice.muted = true;
let loaded = false, unlocked = false, unlocking = false, heard = false, wanted = false, starting = false, reading = false, done = false;
const load = () => {
if (loaded) return;
loaded = true;
voice.src = host.dataset.narration;
try { voice.load(); } catch {  }
};
const unlock = () => {
if (unlocked) return;
unlocked = true;
load();
voice.muted = true;
unlocking = true;
const back = () => { unlocking = false; if (!reading && !starting) { voice.pause(); try { voice.currentTime = 0; } catch {  } } };
try { const p = voice.play(); if (p && typeof p.then === 'function') p.then(back, back); else back(); } catch { unlocking = false; }
};
const times = (host.dataset.times || '').split(',').filter(Boolean).map(Number).filter((n) => !Number.isNaN(n));
const kws = [], clauses = [];
if (times.length && !reduceMotion) {
for (const el of host.querySelectorAll('[data-karaoke]')) {
const from = kws.length;
const frag = document.createDocumentFragment();
for (const tok of (el.textContent || '').split(/(\s+)/)) {
if (!tok) continue;
if (/^\s+$/.test(tok)) { frag.append(tok); continue; }
const span = document.createElement('span');
span.className = 'kw';
span.textContent = tok;
frag.append(span);
kws.push(span);
}
el.textContent = '';
el.append(frag);
clauses.push({ from, to: kws.length - 1 });
}
}
const synced = kws.length > 0 && kws.length === times.length;
if (kws.length && !synced) console.warn(`narration: ${kws.length} words vs ${times.length} timings`);
let painting = false, lastIdx = -1;
const paint = () => {
if (!painting) return;
const t = voice.currentTime;
let i = lastIdx;
while (i + 1 < times.length && times[i + 1] <= t) i++;
while (i >= 0 && times[i] > t) i--;
if (i !== lastIdx) {
if (lastIdx >= 0) kws[lastIdx].classList.remove('is-now');
for (let k = Math.max(0, lastIdx); k <= i; k++) kws[k].classList.add('is-said');
for (let k = i + 1; k < kws.length; k++) kws[k].classList.remove('is-said');
if (i >= 0) kws[i].classList.add('is-now');
lastIdx = i;
}
requestAnimationFrame(paint);
};
const startPaint = () => {
if (!synced || painting) return;
painting = true;
host.classList.add('is-karaoke');
requestAnimationFrame(paint);
};
const stopPaint = () => {
if (!painting) return;
painting = false;
host.classList.remove('is-karaoke');
kws.forEach((w) => w.classList.remove('is-said', 'is-now'));
lastIdx = -1;
};
let watch = 0, stalled = false;
const watchClock = () => {
clearInterval(watch);
let clock = voice.currentTime, moved = performance.now(), limit = 6000;
watch = setInterval(() => {
if (!wanted || done) { clearInterval(watch); return; }
if (voice.currentTime !== clock) { clock = voice.currentTime; moved = performance.now(); limit = 3000; return; }
if (performance.now() - moved <= limit) return;
clearInterval(watch);
if (voice.duration > 0 && voice.currentTime >= voice.duration - 0.35) { done = true; wanted = false; finish(); }
else { stalled = true; stop(); }
}, 500);
};
const finish = () => {
reading = false;
voice.muted = true;
if (speaking === stop) speaking = null;
clearInterval(watch);
stopPaint();
releaseBed();
if (autoScrollRelease) autoScrollRelease();
};
const holdMs = () => ((voice.duration > 0 ? voice.duration : 20) - voice.currentTime) * 1000 + 4000;
const start = () => {
if (bgMusic.getAttribute('src') && !bedWanted()) return;
if (speaking && speaking !== stop) speaking();
load();
wanted = true;
starting = true;
speaking = stop;
bedHeld = true;
if (!heard) { heard = true; try { voice.currentTime = 0; } catch {  } }
voice.muted = false;
watchClock();
const p = voice.play();
const go = () => {
starting = false;
if (!wanted) { voice.pause(); voice.muted = true; if (speaking === stop) speaking = null; releaseBed(); return; }
reading = true;
quietBed();
startPaint();
if (autoScrollHold) autoScrollHold(host, holdMs());
};
const refused = () => {
if (!voice.paused) { go(); return; }
starting = false; wanted = false; voice.muted = true;
if (speaking === stop) speaking = null;
clearInterval(watch);
releaseBed();
};
if (p && typeof p.then === 'function') p.then(go, refused);
else go();
};
const stop = () => {
wanted = false;
if (!reading && !starting) return;
voice.pause();
if (synced && lastIdx >= 0) {
const c = clauses.find((k) => lastIdx >= k.from && lastIdx <= k.to);
if (c) voice.currentTime = Math.max(0, times[c.from] - 0.15);
}
starting = false;
finish();
};
voice.addEventListener('ended', () => { if (reading) { done = true; wanted = false; finish(); } try { voice.currentTime = 0; } catch {  } });
voice.addEventListener('error', () => { if (!loaded) return; done = true; wanted = false; finish(); });
voice.addEventListener('pause', () => {
if (!reading || !wanted || voice.ended) return;
done = true;
wanted = false;
finish();
});
voice.addEventListener('timeupdate', () => { if (!reading && !starting && !unlocking && !voice.paused) voice.pause(); });
musicBtn?.addEventListener('click', () => { if (!bedWanted()) stop(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
const lead = host.querySelector('.lead') || host;
const head = host.querySelector('h2') || host;
const scan = () => {
if (done || gateOpen || document.hidden) return;
const vh = window.innerHeight;
const r = host.getBoundingClientRect(), l = lead.getBoundingClientRect(), h = head.getBoundingClientRect();
if (!loaded && r.top < vh * 2) load();
if (reading || starting) { if (r.top >= vh * 0.6 || l.bottom <= 0) stop(); return; }
const inZone = h.top + h.height / 2 <= vh * 0.15 && l.top >= 0;
if (!inZone) { stalled = false; return; }
if (!stalled) start();
};
let pending = false;
window.addEventListener('scroll', () => {
if (pending) return;
pending = true;
requestAnimationFrame(() => { pending = false; scan(); });
}, { passive: true });
return { unlock, busy: () => reading || starting, stop };
};
for (const host of hosts) readers.push(narrate(host));
unlockNarration = () => readers.forEach((r) => r.unlock());
narrationBusy = () => readers.some((r) => r.busy());
stopNarration = () => readers.forEach((r) => r.stop());
})();
{
const SPEED = 42, RESUME_MS = 2500;
let running = false, started = false, finished = false, previous = 0, position = 0, wrote = -1;
let resumeTimer = 0, lastNudge = 0;
let holdEl = null, holdTimer = 0;
const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
const busy = () => {
const a = document.activeElement;
return !!(a && a.matches && a.matches('input, textarea, select')) || !!document.querySelector('dialog[open]');
};
const stop = () => { running = false; };
const resumeLater = () => {
clearTimeout(resumeTimer);
resumeTimer = setTimeout(function again() {
if (finished || document.hidden) return;
if (busy()) { resumeTimer = setTimeout(again, RESUME_MS); return; }
go();
}, RESUME_MS);
};
const tick = (now) => {
if (!running) return;
if (busy()) { stop(); resumeLater(); return; }
if (wrote >= 0 && Math.abs(window.scrollY - wrote) > 3) { stop(); resumeLater(); return; }
const elapsed = Math.min(now - previous, 64) / 1000;
previous = now;
let step = SPEED * elapsed;
if (holdEl) {
const top = holdEl.getBoundingClientRect().top;
step = top <= 0.5 ? 0 : Math.min(step, top);
}
if (step > 0) {
position = Math.min(maxY(), position + step);
window.scrollTo({ top: position, behavior: 'instant' });
wrote = window.scrollY;
if (position >= maxY() - 0.5) { stop(); finished = true; return; }
}
requestAnimationFrame(tick);
};
const go = () => {
started = true;
if (running || finished) return;
if (performance.now() - lastNudge < RESUME_MS) { resumeLater(); return; }
position = window.scrollY;
wrote = window.scrollY;
if (position >= maxY() - 1) { finished = true; return; }
running = true;
previous = performance.now();
requestAnimationFrame(tick);
};
const nudge = () => {
if (gateOpen || finished) return;
lastNudge = performance.now();
if (!started) return;
stop();
resumeLater();
};
for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(type, nudge, { passive: true });
armAutoScroll = () => { lastNudge = 0; };
startAutoScroll = go;
autoScrollHold = (el, ms = 20000) => {
holdEl = el;
clearTimeout(holdTimer);
holdTimer = setTimeout(() => { if (autoScrollRelease) autoScrollRelease(); }, ms);
};
autoScrollRelease = () => { holdEl = null; clearTimeout(holdTimer); };
document.addEventListener('visibilitychange', () => {
if (document.hidden) { stop(); clearTimeout(resumeTimer); }
else if (started && !finished) resumeLater();
});
}
const cdEl = document.querySelector('.countdown[data-target]');
if (cdEl) {
const target = new Date(cdEl.dataset.target).getTime();
const dEl = cdEl.querySelector('[data-d]');
const hEl = cdEl.querySelector('[data-h]');
const mEl = cdEl.querySelector('[data-m]');
const sEl = cdEl.querySelector('[data-s]');
let timer = null;
const tick = () => {
const diff = Math.max(0, target - Date.now());
dEl.textContent = Math.floor(diff / 86400000);
hEl.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
mEl.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
sEl.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
if (diff === 0 && timer) { clearInterval(timer); timer = null; }
};
if (!Number.isNaN(target)) { tick(); timer = setInterval(tick, 1000); }
}
const unitSel = document.getElementById('rsvp-unit');
document.addEventListener('DOMContentLoaded', () => {
const rform = document.querySelector('form[data-rsvp="v1"]');
const rcard = document.querySelector('[data-rsvp-done]');
if (!rform || !rcard || !unitSel) return;
const counts = rform.querySelector('[data-rsvp-counts]');
const openCounts = () => {
if (!counts || rform.querySelector('input[name="attendance"]:checked')) return;
counts.hidden = false;
counts.style.display = '';
};
const clearErr = () => rform.querySelectorAll('[data-rsvp-err]').forEach((e) => { e.hidden = true; e.style.display = 'none'; });
rform.addEventListener('input', clearErr);
rform.addEventListener('change', () => { clearErr(); openCounts(); });
openCounts();
new MutationObserver(openCounts).observe(rcard, { attributes: true, attributeFilter: ['hidden', 'style'] });
const GKEY = `rsvp-group:${BASE || '/' + SLUG}`;
let group = '';
try { group = localStorage.getItem(GKEY) || ''; } catch {  }
const label = (v) => [...unitSel.options].find((o) => o.value === v)?.textContent || '';
const showGroup = () => {
const t = group ? label(group) : '';
rcard.querySelectorAll('[data-group-row]').forEach((e) => { e.hidden = !t; e.style.display = t ? '' : 'none'; });
const out = rcard.querySelector('[data-group-out]');
if (out) out.textContent = t;
};
showGroup();
rcard.querySelector('[data-rsvp-edit]')?.addEventListener('click', () => { if (group) unitSel.value = group; });
document.addEventListener('submit', (ev) => {
if (ev.target !== rform || unitSel.value) return;
ev.preventDefault();
ev.stopImmediatePropagation();
clearErr();
const e = rform.querySelector('[data-rsvp-err="group"]');
e.hidden = false;
e.style.display = '';
unitSel.focus();
}, true);
const nativeFetch = window.fetch;
window.fetch = (url, opts) => {
const v = unitSel.value;
if (!v || typeof url !== 'string' || !/\/api\/rsvp$/.test(url) || typeof (opts && opts.body) !== 'string') return nativeFetch(url, opts);
return nativeFetch(url, { ...opts, body: JSON.stringify({ ...JSON.parse(opts.body), link: v }) }).then((res) => {
if (res.ok) {
group = v;
try { localStorage.setItem(GKEY, group); } catch {  }
showGroup();
}
return res;
});
};
});
(() => {
const carousel = document.getElementById('wishes-carousel');
if (!carousel) return;
const wishStage = document.getElementById('wishes-stage');
const wishPrev = document.getElementById('wish-prev');
const wishNext = document.getElementById('wish-next');
const wishDots = document.getElementById('wishes-dots');
const dialog = document.getElementById('wish-dialog');
const openBtn = document.getElementById('wish-open');
const wishForm = document.getElementById('wish-form');
if (!carousel || !wishStage || !dialog || !openBtn || !wishForm) return;
const closeBtn = document.getElementById('wish-close');
const fileInput = document.getElementById('wish-file');
const photoAdd = document.getElementById('wish-photo-add');
const photoPrev = document.getElementById('wish-photo-prev');
const photoImg = document.getElementById('wish-photo-img');
const photoDel = document.getElementById('wish-photo-del');
const sendBtn = document.getElementById('wish-send');
const msg = document.getElementById('wish-msg');
let photoData = null;
const esc = (t) => { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
const cardHTML = (w) => {
const src = w.has_photo ? `${BASE}/api/wish/${w.id}/photo` : (w._localPhoto || '');
const fig = src ? `<img class="wish-card-img" src="${src}" alt="">` : '';
return `<figure class="wish-card">${fig}<blockquote class="wish-card-msg">${esc(w.message)}</blockquote><figcaption class="wish-card-name">${esc(w.name)}</figcaption></figure>`;
};
let wishes = [], slides = [], cur = 0, timer = null;
const setH = () => {
if (!slides.length) return;
let h = 0;
slides.forEach((sl) => {
const c = sl.firstElementChild;
if (!c) return;
const m = getComputedStyle(c);
h = Math.max(h, c.offsetHeight + parseFloat(m.marginTop) + parseFloat(m.marginBottom));
});
if (h) wishStage.style.height = `${h}px`;
};
const show = (i) => {
if (!slides.length) return;
cur = ((i % slides.length) + slides.length) % slides.length;
slides.forEach((sl, idx) => sl.classList.toggle('is-active', idx === cur));
if (wishDots) [...wishDots.children].forEach((d, idx) => d.classList.toggle('is-active', idx === cur));
setH();
};
const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
const start = () => { stop(); if (reduceMotion || slides.length < 2) return; timer = setInterval(() => show(cur + 1), 4200); };
const buildDots = () => {
if (!wishDots) return;
wishDots.replaceChildren();
if (wishes.length < 2) return;
wishes.forEach((_, i) => {
const b = document.createElement('button');
b.type = 'button';
b.className = 'wishes-dot';
b.setAttribute('aria-label', `Сэтгэлийн үг ${i + 1}`);
b.addEventListener('click', () => { show(i); start(); });
wishDots.appendChild(b);
});
};
const renderRail = () => {
stop();
if (!wishes.length) {
wishStage.innerHTML = '<p class="wishes-empty"><svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M31 5l12 12-17 17c-2 2-5 2.6-7.6 1.6L13 40l-5-5 4.4-5.4C11.4 27 12 24 14 22z"/><path d="M8 35l-3 8 8-3"/><circle cx="24.5" cy="23.5" r="3"/><path d="M26.6 21.4L37 11"/></svg><span>Хамгийн түрүүнд сэтгэлийн үгээ үлдээгээрэй</span></p>';
wishStage.style.height = '';
slides = [];
wishPrev.hidden = true;
wishNext.hidden = true;
if (wishDots) wishDots.replaceChildren();
return;
}
wishStage.innerHTML = wishes.map((w) => `<div class="wish-slide">${cardHTML(w)}</div>`).join('');
slides = [...wishStage.querySelectorAll('.wish-slide')];
wishStage.querySelectorAll('img').forEach((img) => img.addEventListener('load', setH, { once: true }));
wishPrev.hidden = wishes.length < 2;
wishNext.hidden = wishes.length < 2;
buildDots();
cur = 0;
show(0);
requestAnimationFrame(setH);
start();
};
fetch(`${BASE}/api/wishes`)
.then((r) => r.json())
.then((d) => { wishes = Array.isArray(d.wishes) ? d.wishes : []; renderRail(); })
.catch(() => { wishes = []; renderRail(); });
wishPrev.addEventListener('click', () => { show(cur - 1); start(); });
wishNext.addEventListener('click', () => { show(cur + 1); start(); });
carousel.addEventListener('pointerenter', stop);
carousel.addEventListener('pointerleave', start);
window.addEventListener('resize', setH);
const viewer = document.getElementById('wish-viewer');
const vStage = document.getElementById('wish-viewer-stage');
const vPrev = document.getElementById('wish-viewer-prev');
const vNext = document.getElementById('wish-viewer-next');
const vClose = document.getElementById('wish-viewer-close');
const vCount = document.getElementById('wish-viewer-count');
if (viewer && vStage) {
let vCur = 0;
const renderViewer = () => {
if (!wishes.length) return;
vCur = ((vCur % wishes.length) + wishes.length) % wishes.length;
vStage.innerHTML = cardHTML(wishes[vCur]);
if (vCount) vCount.textContent = `${vCur + 1} / ${wishes.length}`;
const multi = wishes.length > 1;
vPrev.hidden = !multi;
vNext.hidden = !multi;
};
const openViewer = (i) => {
if (!wishes.length) return;
stop(); vCur = i; renderViewer();
if (viewer.showModal) viewer.showModal(); else viewer.setAttribute('open', '');
};
const closeViewer = () => { if (viewer.close) viewer.close(); else viewer.removeAttribute('open'); };
vPrev.addEventListener('click', () => { vCur -= 1; renderViewer(); });
vNext.addEventListener('click', () => { vCur += 1; renderViewer(); });
vClose.addEventListener('click', closeViewer);
viewer.addEventListener('click', (e) => { if (e.target === viewer) closeViewer(); });
viewer.addEventListener('close', () => start());
viewer.addEventListener('keydown', (e) => {
if (e.key === 'ArrowLeft') { vCur -= 1; renderViewer(); }
else if (e.key === 'ArrowRight') { vCur += 1; renderViewer(); }
});
wishStage.style.cursor = 'pointer';
wishStage.setAttribute('role', 'button');
wishStage.setAttribute('tabindex', '0');
wishStage.setAttribute('aria-label', 'Сэтгэлийн үгийг нээж унших');
wishStage.addEventListener('click', () => { if (wishes.length) openViewer(cur); });
wishStage.addEventListener('keydown', (e) => {
if ((e.key === 'Enter' || e.key === ' ') && wishes.length) { e.preventDefault(); openViewer(cur); }
});
}
const open = () => {
msg.textContent = ''; msg.className = 'form-msg'; stop();
if (dialog.showModal) dialog.showModal(); else dialog.setAttribute('open', '');
};
const close = () => { if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); };
openBtn.addEventListener('click', open);
closeBtn.addEventListener('click', close);
dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
const clearPhoto = () => {
photoData = null; fileInput.value = ''; photoImg.src = '';
photoPrev.hidden = true; photoAdd.hidden = false;
};
photoAdd.addEventListener('click', () => fileInput.click());
photoDel.addEventListener('click', clearPhoto);
fileInput.addEventListener('change', () => {
const file = fileInput.files && fileInput.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
const img = new Image();
img.onload = () => {
const MAX = 1280;
let w = img.naturalWidth, h = img.naturalHeight;
if (!w || !h) { msg.className = 'form-msg is-err'; msg.textContent = MSG.badPhoto; return; }
if (w > MAX || h > MAX) { const sc = MAX / Math.max(w, h); w = Math.round(w * sc); h = Math.round(h * sc); }
const c = document.createElement('canvas');
c.width = w; c.height = h;
c.getContext('2d').drawImage(img, 0, 0, w, h);
let q = 0.82, data = c.toDataURL('image/jpeg', q);
while (data.length > 1000000 && q > 0.4) { q -= 0.12; data = c.toDataURL('image/jpeg', q); }
if (data.length > 1150000) { msg.className = 'form-msg is-err'; msg.textContent = MSG.photoBig; return; }
photoData = data;
photoImg.src = data; photoPrev.hidden = false; photoAdd.hidden = true;
msg.textContent = ''; msg.className = 'form-msg';
};
img.onerror = () => { msg.className = 'form-msg is-err'; msg.textContent = MSG.badPhoto; };
img.src = reader.result;
};
reader.onerror = () => { msg.className = 'form-msg is-err'; msg.textContent = MSG.badPhoto; };
reader.readAsDataURL(file);
});
wishForm.addEventListener('submit', async (e) => {
e.preventDefault();
msg.textContent = ''; msg.className = 'form-msg';
const fd = new FormData(wishForm);
const name = String(fd.get('name') || '').trim();
const message = String(fd.get('message') || '').trim();
if (!name || !message) { msg.className = 'form-msg is-err'; msg.textContent = MSG.wishNeed; return; }
sendBtn.disabled = true;
sendBtn.classList.add('is-loading');
try {
const body = { name, message };
if (photoData) body.photo = photoData;
const r = await fetch(`${BASE}/api/wish`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body),
});
if (r.ok) {
const d = await r.json().catch(() => ({}));
const cardData = { name, message, photoDataUrl: photoData };
if (!d.pending) {
wishes.unshift({ id: 0, name, message, has_photo: false, _localPhoto: photoData });
renderRail();
}
wishForm.reset();
clearPhoto();
const shown = await showResult(cardData);
if (!shown) { msg.className = 'form-msg is-ok'; msg.textContent = MSG.wishOk; setTimeout(close, 1400); }
} else if (r.status === 429) { msg.className = 'form-msg is-err'; msg.textContent = MSG.tooMany; }
else if (r.status === 400) { msg.className = 'form-msg is-err'; msg.textContent = MSG.badPhoto; }
else { msg.className = 'form-msg is-err'; msg.textContent = MSG.serverErr; }
} catch {
msg.className = 'form-msg is-err';
msg.textContent = MSG.networkErr;
} finally {
sendBtn.disabled = false;
sendBtn.classList.remove('is-loading');
}
});
const result = document.getElementById('wish-result');
const cardMount = document.getElementById('wish-card-mount');
const dlBtn = document.getElementById('wish-download');
const shareBtn = document.getElementById('wish-share');
const resultClose = document.getElementById('wish-result-close');
let lastCanvas = null;
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
let artCache = null;
const loadArt = async () => {
if (artCache) return artCache;
const got = await Promise.allSettled([loadImg(asset('assets/art/logo70.png?v=2'))]);
artCache = { logo: got[0].status === 'fulfilled' ? got[0].value : null };
return artCache;
};
const ensureFonts = async () => {
try {
await Promise.all([
document.fonts.load('500 58px "Noto Serif Display"', 'УБТЗ Сайншанд Худалдаа Төв'),
document.fonts.load('400 40px Montserrat', 'Сэтгэлийн үг өөрийн үүрэг'),
document.fonts.load('600 30px Montserrat', '2026.12.04 ТҮҮХТ 70 ЖИЛИЙН ОЙ'),
]);
await document.fonts.ready;
} catch {  }
};
const wrap = (ctx, text, maxW) => {
const out = [];
for (const para of String(text).split('\n')) {
let line = '';
for (const word of para.split(/\s+/)) {
const t2 = line ? `${line} ${word}` : word;
if (ctx.measureText(t2).width > maxW && line) { out.push(line); line = word; } else line = t2;
}
out.push(line);
}
return out;
};
const roundRect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
const tabPath = (ctx, x, y, w, h, n) => {
ctx.beginPath();
ctx.moveTo(x + n, y);
ctx.lineTo(x + w - n, y);
ctx.arc(x + w, y, n, Math.PI, Math.PI / 2, true);
ctx.lineTo(x + w, y + h - n);
ctx.arc(x + w, y + h, n, -Math.PI / 2, Math.PI, true);
ctx.lineTo(x + n, y + h);
ctx.arc(x, y + h, n, 0, -Math.PI / 2, true);
ctx.lineTo(x, y + n);
ctx.arc(x, y, n, Math.PI / 2, 0, true);
ctx.closePath();
};
const spacing = (ctx, px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`; };
const CARD_DATE = (() => {
const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(document.body.dataset.dateIso || '');
return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
})();
const buildWishCard = async ({ name, message, photoDataUrl }) => {
await ensureFonts();
const art = await loadArt();
const W = 1080, H = 1920, PAD = 96, CX = W / 2, K = W / 390;
const c = document.createElement('canvas'); c.width = W; c.height = H;
const ctx = c.getContext('2d');
const g = ctx.createLinearGradient(0, 0, 0, H);
[[0, '#050E22'], [0.35, '#07122A'], [0.72, '#0B1C40'], [1, '#12285A']].forEach(([o, col]) => g.addColorStop(o, col));
ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
ctx.strokeStyle = 'rgba(233,196,106,0.05)'; ctx.lineWidth = 2;
for (let d = -H; d < W + H; d += 9 * K) {
ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + H, H); ctx.stroke();
ctx.beginPath(); ctx.moveTo(d, H); ctx.lineTo(d + H, 0); ctx.stroke();
}
ctx.textAlign = 'center';
let y = 130;
if (art.logo) { const lw = 400, lh = lw * art.logo.height / art.logo.width; ctx.drawImage(art.logo, CX - lw / 2, y, lw, lh); y += lh + 44; }
ctx.fillStyle = '#FBF3E2'; ctx.font = '500 58px "Noto Serif Display", Georgia, serif'; spacing(ctx, 1);
ctx.fillText('УБТЗ Сайншанд Худалдаа Төв', CX, y + 52); spacing(ctx, 0);
y += 92;
if (CARD_DATE) {
ctx.fillStyle = '#F6C003'; ctx.font = '600 32px Montserrat, sans-serif'; spacing(ctx, 6);
ctx.fillText(CARD_DATE, CX, y + 26); spacing(ctx, 0);
y += 62;
}
ctx.font = '600 32px Montserrat, sans-serif'; spacing(ctx, 1.5);
const TAB = 'ТҮҮХТ 70 ЖИЛИЙН ОЙ';
const tw = ctx.measureText(TAB).width + 112, th = 68;
const tg = ctx.createLinearGradient(CX - tw / 2, 0, CX + tw / 2, 0);
[[0, '#D9A437'], [0.16, '#F4D06E'], [0.5, '#FBE796'], [0.84, '#F4D06E'], [1, '#D9A437']].forEach(([o, col]) => tg.addColorStop(o, col));
tabPath(ctx, CX - tw / 2, y, tw, th, 16); ctx.fillStyle = tg; ctx.fill();
ctx.fillStyle = '#14130A'; ctx.fillText(TAB, CX, y + 45); spacing(ctx, 0);
y += th + 40;
const rw = 640, ry = y + 12;
ctx.fillStyle = '#F6C003';
ctx.fillRect(CX - rw / 2, ry - 15, 5, 30); ctx.fillRect(CX + rw / 2 - 5, ry - 15, 5, 30);
ctx.fillRect(CX - rw / 2 + 22, ry - 1.5, rw / 2 - 52, 3); ctx.fillRect(CX + 30, ry - 1.5, rw / 2 - 52, 3);
ctx.save(); ctx.translate(CX, ry); ctx.rotate(Math.PI / 4);
ctx.strokeStyle = '#F6C003'; ctx.lineWidth = 3.5; ctx.strokeRect(-10, -10, 20, 20); ctx.restore();
y += 54;
const headerBottom = y, footerTop = H - 200;
ctx.font = '400 40px Montserrat, sans-serif';
const lines = wrap(ctx, `“${message}”`, W - 2 * PAD - 20).slice(0, 7);
const lineH = 58, wishH = lines.length * lineH, nameH = 50, dateH = 44, gap = 44;
let photo = null;
if (photoDataUrl) { try { photo = await loadImg(photoDataUrl); } catch { photo = null; } }
let photoH = 0; const photoW = W - 2 * PAD;
if (photo) { const maxH = footerTop - headerBottom - wishH - nameH - dateH - gap * 2 - 16; photoH = Math.max(220, Math.min(maxH, 860, photoW * 1.12)); }
const totalH = (photo ? photoH + gap : 0) + wishH + gap * 0.55 + nameH + dateH;
let my = headerBottom + Math.max(0, (footerTop - headerBottom - totalH) / 2);
if (photo) {
const px = CX - photoW / 2;
ctx.save(); roundRect(ctx, px, my, photoW, photoH, 22); ctx.clip();
const s = Math.max(photoW / photo.width, photoH / photo.height);
ctx.drawImage(photo, CX - photo.width * s / 2, my + photoH / 2 - photo.height * s / 2, photo.width * s, photo.height * s);
ctx.restore();
ctx.strokeStyle = 'rgba(246,192,3,0.6)'; ctx.lineWidth = 3; roundRect(ctx, px, my, photoW, photoH, 22); ctx.stroke();
my += photoH + gap;
}
ctx.fillStyle = '#FFFFFF'; ctx.font = '400 40px Montserrat, sans-serif';
for (const ln of lines) { ctx.fillText(ln, CX, my + 42); my += lineH; }
my += gap * 0.55;
ctx.fillStyle = '#F6C003'; ctx.font = '600 30px Montserrat, sans-serif'; spacing(ctx, 4);
ctx.fillText(`— ${name.toUpperCase()} —`, CX, my + 24); spacing(ctx, 0);
my += nameH;
const now = new Date();
ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = '400 26px Montserrat, sans-serif';
ctx.fillText(`${now.getFullYear()} оны ${now.getMonth() + 1}-р сарын ${now.getDate()}`, CX, my + 22);
ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '400 30px Montserrat, sans-serif';
ctx.fillText('made with ♡ for УБТЗ Сайншанд Худалдаа Төв', CX, footerTop + 58);
const fbLabel = 'urilga.online';
ctx.font = '600 26px Montserrat, sans-serif';
const lw = ctx.measureText(fbLabel).width, chip = 32, fgap = 12;
const sx = CX - (chip + fgap + lw) / 2, cy = footerTop + 86;
ctx.fillStyle = '#F6C003'; roundRect(ctx, sx, cy, chip, chip, 8); ctx.fill();
ctx.fillStyle = '#14130A'; ctx.textAlign = 'center'; ctx.font = '700 22px Georgia, serif';
ctx.fillText('♡', sx + chip / 2, cy + chip - 8);
ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF'; ctx.font = '600 26px Montserrat, sans-serif';
ctx.fillText(fbLabel, sx + chip + fgap, cy + chip - 8);
ctx.textAlign = 'center';
return c;
};
const canSharePng = !!(navigator.canShare && (() => { try { return navigator.canShare({ files: [new File([new Blob([''])], 'a.png', { type: 'image/png' })] }); } catch { return false; } })());
const showResult = async (data) => {
let canvas;
try { canvas = await buildWishCard(data); } catch { return false; }
lastCanvas = canvas;
cardMount.replaceChildren(canvas);
shareBtn.hidden = !canSharePng;
wishForm.hidden = true;
result.hidden = false;
return true;
};
const resetView = () => {
result.hidden = true; wishForm.hidden = false;
cardMount.replaceChildren(); lastCanvas = null;
msg.textContent = ''; msg.className = 'form-msg';
};
const toBlob = (canvas) => new Promise((res) => canvas.toBlob(res, 'image/png'));
dlBtn.addEventListener('click', async () => {
if (!lastCanvas) return;
const blob = await toBlob(lastCanvas); if (!blob) return;
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href = url; a.download = 'zuun-jil-setgeliin-ug.png';
document.body.appendChild(a); a.click(); a.remove();
setTimeout(() => URL.revokeObjectURL(url), 4000);
});
shareBtn.addEventListener('click', async () => {
if (!lastCanvas) return;
const blob = await toBlob(lastCanvas); if (!blob) return;
const file = new File([blob], 'zuun-jil-setgeliin-ug.png', { type: 'image/png' });
try {
await navigator.share({
files: [file],
title: 'УБТЗ Сайншанд Худалдаа Төв — түүхт 70 жилийн ой',
text: 'Хамт олондоо өргөх сэтгэлийн үг',
});
} catch {  }
});
resultClose.addEventListener('click', close);
dialog.addEventListener('close', () => { resetView(); start(); });
})();
const scenes = document.querySelectorAll('.scene');
scenes.forEach((scene) => {
scene.querySelectorAll('.rv').forEach((el, i) => {
el.style.setProperty('--d', `${Math.min(i * 0.07, 0.6).toFixed(2)}s`);
});
});
if (reduceMotion || !('IntersectionObserver' in window)) {
scenes.forEach((el) => el.classList.add('is-active'));
} else {
const io = new IntersectionObserver((entries) => {
entries.forEach((entry) => {
if (!entry.isIntersecting) return;
if (gateOpen && entry.target.classList.contains('sec--cover')) return;
entry.target.classList.add('is-active');
io.unobserve(entry.target);
});
}, { threshold: 0.12 });
scenes.forEach((el) => io.observe(el));
}
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
(() => {
const odo = document.getElementById('odo');
if (!odo) return;
const FROM = 1956, TO = 2026, N = TO - FROM;
const digit = (y, place) => Math.floor(y / place) % 10;
const cols = [1000, 100, 10, 1].map((place) => {
const seq = [digit(FROM, place)];
for (let y = FROM + 1; y <= TO; y++) { const d = digit(y, place); if (d !== seq[seq.length - 1]) seq.push(d); }
const flips = [];
for (let y = FROM + 1; y <= TO; y++) if (digit(y, place) !== digit(y - 1, place)) flips.push(y - FROM);
return { place, seq, flips };
});
odo.textContent = '';
for (const c of cols) {
const box = document.createElement('span');
box.className = 'od';
const strip = document.createElement('span');
for (const d of c.seq) { const cell = document.createElement('span'); cell.className = 'odc'; cell.textContent = d; strip.append(cell); }
box.append(strip);
odo.append(box);
c.strip = strip;
}
const offset = (c, n) => {
let k = 0;
while (k < c.flips.length && c.flips[k] <= n) k++;
if (k >= c.flips.length) return k;
const next = c.flips[k], prev = k ? c.flips[k - 1] : 0;
const span = Math.min(0.6, next - prev);
const t = Math.max(0, Math.min(1, (n - (next - span)) / span));
return k + easeInOut(t);
};
const set = (n) => { for (const c of cols) c.strip.style.transform = `translateY(${(-offset(c, n)).toFixed(3)}em)`; };
set(0);
rollOdo = () => {
rollOdo = null;
const settle = () => { odo.textContent = String(TO); odo.classList.add('is-done'); };
if (reduceMotion) { settle(); return; }
const DUR = 2200, t0 = performance.now();
const tick = (now) => {
const p = Math.min(1, (now - t0) / DUR);
set(N * (1 - Math.pow(1 - p, 3)));
if (p < 1) requestAnimationFrame(tick); else settle();
};
requestAnimationFrame(tick);
};
if (!document.getElementById('gate')) rollOdo();
})();
(() => {
const tl = document.getElementById('tl');
if (!tl) return;
const fill = tl.querySelector('.tl-spine i');
const spine = tl.querySelector('.tl-spine');
const items = [...tl.querySelectorAll('.tl-item')];
const years = items.map((li) => +li.dataset.year);
const tick = (li, i) => {
const num = li.querySelector('.tl-num');
const to = years[i], from = i ? years[i - 1] : to - 26;
if (reduceMotion || !num) { if (num) num.textContent = String(to); return; }
const t0 = performance.now(), DUR = 900;
const step = (now) => {
const p = Math.min(1, (now - t0) / DUR);
num.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
if (p < 1) requestAnimationFrame(step);
};
requestAnimationFrame(step);
};
if (reduceMotion) { items.forEach((li) => li.classList.add('is-lit')); return; }
let pending = false;
const update = () => {
pending = false;
const vh = window.innerHeight;
const r = spine.getBoundingClientRect();
const line = vh * 0.62;
const p = Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height)));
fill.style.transform = `scaleY(${p.toFixed(4)})`;
const reach = r.top + r.height * p;
items.forEach((li, i) => {
if (li.classList.contains('is-lit')) return;
const node = li.querySelector('.tl-node').getBoundingClientRect();
if (node.top + node.height / 2 <= reach + 1) { li.classList.add('is-lit'); tick(li, i); }
});
};
const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
update();
})();
(() => {
const figs = [...document.querySelectorAll('.stats b[data-count]')];
if (!figs.length || reduceMotion || !('IntersectionObserver' in window)) return;
const fmt = (b, n) => `${Math.round(n)}${b.dataset.suffix || ''}`;
figs.forEach((b) => { b.textContent = fmt(b, 0); });
const io = new IntersectionObserver((es) => {
es.forEach((e) => {
if (!e.isIntersecting) return;
io.disconnect();
const t0 = performance.now(), DUR = 1600;
const step = (now) => {
const p = Math.min(1, (now - t0) / DUR), k = 1 - Math.pow(1 - p, 3);
figs.forEach((b) => { b.textContent = fmt(b, +b.dataset.count * k); });
if (p < 1) requestAnimationFrame(step);
};
setTimeout(() => requestAnimationFrame(step), 700);
});
}, { threshold: 0.6 });
io.observe(figs[0].closest('.stats'));
})();
(() => {
const seal = document.querySelector('.seal');
if (!seal) return;
if (reduceMotion || !('IntersectionObserver' in window)) { seal.classList.add('is-stamped'); return; }
const io = new IntersectionObserver((es) => {
es.forEach((e) => { if (e.isIntersecting) { setTimeout(() => seal.classList.add('is-stamped'), 350); io.disconnect(); } });
}, { rootMargin: '0px 0px -25% 0px', threshold: 0.9 });
io.observe(seal.closest('.greet-sign') || seal);
})();
const bfly = document.getElementById('bfly-c');
if (bfly && !reduceMotion) {
const RULE_R = (r) => [r.right - 30, r.top + r.height / 2 - 14];
const RULE_L = (r) => [r.left + 30, r.top + r.height / 2 - 14];
const WAYPOINTS = [
{ sel: '.cover-years', at: (r) => [r.left - 44, r.top + r.height / 2 - 6] },
{ sel: '.sec--invite .rule', at: RULE_R },
{ sel: '.sec--history .rule', at: RULE_L },
{ sel: '.sec--company .microrule', at: (r) => [r.right - 30, r.top - 26] },
{ sel: '.sec--greet .rule', at: RULE_L },
{ sel: '.sec--await .rule', at: RULE_R },
{ sel: '.sec--prog .rule', at: RULE_L },
{ sel: '.sec--wish .rule', at: RULE_R },
{ sel: '.sec--rsvp .rule', at: RULE_L },
{ sel: '.band--close', at: (r) => [r.left + r.width * 0.8, r.top + r.height * 0.34] },
].map((w) => ({ ...w, el: document.querySelector(w.sel) })).filter((w) => w.el);
const underButton = (x, y) => {
if (!musicBtn || musicBtn.hidden) return false;
const b = musicBtn.getBoundingClientRect();
return x + 36 > b.left && x - 36 < b.right && y + 28 > b.top && y - 28 < b.bottom;
};
let x = -120, y = -120, started = false, flying = false, side = 1;
const target = () => {
const vh = window.innerHeight || 1;
const vw = window.innerWidth || 1;
let best = null, bestD = Infinity;
for (const w of WAYPOINTS) {
const [lx, ly] = w.at(w.el.getBoundingClientRect());
if (ly < 44 || ly > vh - 44) continue;
if (underButton(lx, ly)) continue;
const d = Math.abs(ly - vh * 0.48);
if (d < bestD) { bestD = d; best = [lx, ly, w]; }
}
if (!best) return [side > 0 ? vw + 90 : -90, vh * 0.3, null];
const out = [Math.max(36, Math.min(vw - 36, best[0])), Math.max(26, Math.min(vh - 26, best[1])), best[2]];
return underButton(out[0], out[1]) ? [vw + 90, out[1], null] : out;
};
const grain = (px, py, big) => {
const i = document.createElement('i');
i.className = 'bgrain';
const life = 800 + Math.random() * 700;
i.style.left = px.toFixed(0) + 'px';
i.style.top = py.toFixed(0) + 'px';
i.style.setProperty('--gs', ((big ? 6 : 4.5) + Math.random() * (big ? 6 : 4)).toFixed(1) + 'px');
i.style.setProperty('--tx', (Math.random() * 16 - 8).toFixed(0) + 'px');
i.style.setProperty('--ty', (8 + Math.random() * 20).toFixed(0) + 'px');
i.style.setProperty('--d', life.toFixed(0) + 'ms');
document.body.appendChild(i);
setTimeout(() => i.remove(), life + 80);
};
const SPIN_MS = 1150;
const easeSpin = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
let spinUntil = 0, nextSpin = 0, nextGrain = 0;
let lastX = 0, lastY = 0, sinceGrain = 0;
let lastW = null, lastTx = 0, lastTy = 0;
let t0 = performance.now();
const step = (now) => {
const t = (now - t0) / 1000;
const [tx, ty, w] = target();
if (w && w === lastW) { x += tx - lastTx; y += ty - lastTy; }
lastW = w; lastTx = tx; lastTy = ty;
const dx = tx - x;
const dy = ty - y;
const dist = Math.hypot(dx, dy);
if (Math.abs(dx) > 30) side = dx > 0 ? 1 : -1;
x += dx * 0.045;
y += dy * 0.045;
const wob = Math.min(1, dist / 120);
const wx = Math.sin(t * 2.6) * 13 * wob;
const wy = Math.sin(t * 1.9 + 1.3) * 9 * wob + Math.sin(t * 1.1) * 2.5;
const tilt = Math.max(-26, Math.min(26, dx * 0.07 + Math.sin(t * 2.2) * 4 * wob));
const nowFlying = dist > 30;
if (nowFlying !== flying) {
flying = nowFlying;
bfly.classList.toggle('is-flying', flying);
}
if (now > nextSpin && now > spinUntil) {
spinUntil = now + SPIN_MS;
nextSpin = now + 5000 + Math.random() * 4000;
}
const spinning = now < spinUntil;
const spinDeg = spinning ? 360 * easeSpin(1 - (spinUntil - now) / SPIN_MS) : 0;
const cx = x + wx, cy = y + wy;
const mx = cx - lastX, my = cy - lastY;
const moved = Math.hypot(mx, my);
const GRAIN_PX = spinning ? 5 : 10;
sinceGrain += moved;
while (sinceGrain >= GRAIN_PX) {
sinceGrain -= GRAIN_PX;
const back = moved > 0.01 ? sinceGrain / moved : 0;
grain(cx - mx * back + (Math.random() * 10 - 5), cy - my * back + (Math.random() * 8 - 4), spinning);
}
if (now > nextGrain) {
nextGrain = now + (spinning ? 60 : 150 + Math.random() * 120);
grain(cx + (Math.random() * 14 - 7), cy + (Math.random() * 12 - 6), spinning);
}
lastX = cx; lastY = cy;
bfly.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) rotate(${(tilt + spinDeg).toFixed(1)}deg)`;
requestAnimationFrame(step);
};
bflyRelease = (sx, sy) => {
if (started) return;
started = true;
x = sx; y = sy;
bfly.classList.add('is-on', 'is-flying');
t0 = performance.now();
lastX = x; lastY = y;
nextSpin = t0 + 5000 + Math.random() * 4000;
requestAnimationFrame(step);
};
if (!document.getElementById('gate')) bflyRelease(window.innerWidth * 0.5, -40);
}
})();

;document.documentElement.dataset.fiber='76c4785c';
