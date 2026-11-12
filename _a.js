(function () {
'use strict';
try {
var slug = location.pathname.split('/')[1] || (document.body.dataset.base || '').slice(1) || 'urilga-home';
if (slug.charAt(0) === '_') return;
var api = '/' + slug + '/api/e';
var sent = {};
function post(url) {
if (navigator.sendBeacon) { navigator.sendBeacon(url); return; }
try { fetch(url, { method: 'POST', keepalive: true }); } catch (e) {}
}
function send(n, v) {
var k = n + '|' + (v == null ? '' : v);
if (sent[k]) return;
sent[k] = 1;
post(api + '?n=' + n + (v == null ? '' : '&v=' + encodeURIComponent(v)));
}
send('js');
var visible = document.visibilityState === 'visible';
var active = 0, last = Date.now(), maxScroll = 0;
function tick() {
var now = Date.now();
if (visible) active += now - last;
last = now;
visible = document.visibilityState === 'visible';
}
setInterval(tick, 1000);
function depth() {
var h = document.documentElement.scrollHeight - window.innerHeight;
var p = h > 0 ? Math.round(window.scrollY * 100 / h) : 100;
if (p > maxScroll) maxScroll = p > 100 ? 100 : p;
}
addEventListener('scroll', depth, { passive: true });
var lastExit = '';
function report() {
tick();
depth();
var v = Math.round(active / 1000) + ':' + maxScroll;
if (v === lastExit) return;
lastExit = v;
post(api + '?n=exit&v=' + v);
}
addEventListener('pagehide', report);
document.addEventListener('visibilitychange', function () {
if (document.visibilityState === 'hidden') report();
else tick();
});
document.addEventListener('play', function (e) {
var t = e.target || {};
if (t.tagName === 'AUDIO') send('music');
else if (t.tagName === 'VIDEO' && !t.muted) send('video');
}, true);
document.addEventListener('click', function (e) {
var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
if (!a) return;
if (/maps|2gis|goo\.gl/i.test(a.href)) send('map');
else if (a.protocol === 'tel:') send('tel', a.href.replace(/\D/g, '').slice(-8));
else if (a.host && a.host !== location.host) send('out', a.host.slice(0, 40));
}, true);
document.addEventListener('focusin', function (e) {
var t = e.target || {};
if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '')) send('form');
}, true);
if (document.body) {
new MutationObserver(function () {
var l = document.body.getAttribute('data-lang');
if (l) send('lang', l);
}).observe(document.body, { attributes: true, attributeFilter: ['data-lang'] });
}
} catch (e) {}
})();
