const crypto = require('crypto');
const path = require('path');
const QRCode = require('qrcode');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { TRACKS, EVENT_DATES, EVENT_VENUE } = require('./config');

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  const fs = require('fs');
  GlobalFonts.registerFromPath(path.join(FONT_DIR, 'AbrilFatface-Regular.ttf'), 'Abril');
  GlobalFonts.registerFromPath(path.join(FONT_DIR, 'Poppins-Regular.ttf'), 'Poppins');
  GlobalFonts.registerFromPath(path.join(FONT_DIR, 'Poppins-SemiBold.ttf'), 'PoppinsSemi');
  const winEmoji = 'C:/Windows/Fonts/seguiemj.ttf';
  if (fs.existsSync(winEmoji)) {
    try { GlobalFonts.registerFromPath(winEmoji, 'SegoeEmoji'); } catch {}
  }
  fontsReady = true;
}

/* ---------- QR payload: HE26.<regCode>.<signature> ----------
   The scanner site recomputes the signature with the same QR_SECRET,
   so a hand-made QR for a made-up code is rejected before any DB lookup. */
function sign(code) {
  return crypto.createHmac('sha256', process.env.QR_SECRET || 'dev-secret').update(code).digest('base64url').slice(0, 12);
}
const makePayload = (code) => `HE26.${code}.${sign(code)}`;
function parsePayload(text) {
  const m = /^HE26\.(HE26-[A-Z0-9]{6})\.([A-Za-z0-9_-]{12})$/.exec(String(text).trim());
  if (!m) return null;
  const a = Buffer.from(m[2]);
  const b = Buffer.from(sign(m[1]));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? { code: m[1] } : null;
}

/* ---------- Theme (taken from the event poster) ---------- */
const C = {
  cream: '#fcf7eb',
  magenta: '#b8337f',
  brush: '#c0568f',
  indigo: '#33266b',
  lavender: '#e6dcf3',
  pinkWash: '#f7d6e8',
  leaf: '#1f7a3a',
  leafDark: '#175c2c',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLeaf(ctx, x, y, s, rot, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(30, -30, 80, -40, 120, -120);
  ctx.bezierCurveTo(40, -110, -10, -70, 0, 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function fitTeamName(ctx, text) {
  for (const size of [88, 76, 66]) {
    ctx.font = `${size}px Abril`;
    if (ctx.measureText(text).width <= 840) return { size, lines: [text] };
  }
  const words = text.split(' ');
  for (const size of [66, 58, 50, 44]) {
    ctx.font = `${size}px Abril`;
    let best = null;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (!best || w < best.w) best = { w, lines: [a, b] };
    }
    if (best && best.w <= 840) return { size, lines: best.lines };
  }
  // one very long word: shrink and trim
  ctx.font = '44px Abril';
  let t = text;
  while (t.length > 3 && ctx.measureText(t + '…').width > 840) t = t.slice(0, -1);
  return { size: 44, lines: [t + '…'] };
}

async function buildCard({ teamName, regCode, trackId, isAllFemale = false, needStay = false, stayCount = 0, teamId = '001' }) {
  ensureFonts();
  const W = 1000, H = 1530;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // background + soft shapes
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.lavender;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(950, 40, 250, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.pinkWash;
  ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.arc(30, H - 40, 330, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // header
  ctx.fillStyle = C.indigo;
  ctx.font = '26px Poppins';
  ctx.fillText('IEEE Women in Engineering  ·  Galgotias University', W / 2, 72);

  // title: "WIE" magenta + "HackEarth" indigo
  ctx.font = '104px Abril';
  const wie = 'WIE ', hack = 'HackEarth';
  const wW = ctx.measureText(wie).width, hW = ctx.measureText(hack).width;
  const startX = (W - (wW + hW)) / 2 - 20;
  ctx.textAlign = 'left';
  ctx.fillStyle = C.magenta; ctx.fillText(wie, startX, 192);
  ctx.fillStyle = C.indigo; ctx.fillText(hack, startX + wW, 192);
  ctx.textAlign = 'center';
  // leaf sprig after the title
  const leafX = startX + wW + hW + 8;
  drawLeaf(ctx, leafX, 150, 0.45, -0.35, C.leaf);
  drawLeaf(ctx, leafX + 6, 158, 0.32, 0.25, C.leafDark);

  // "2.0 · 2026" brush pill
  ctx.fillStyle = C.brush;
  roundRect(ctx, W / 2 - 170, 224, 340, 72, 20); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '44px Abril';
  ctx.fillText('2.0  ·  2026', W / 2, 277);

  // team name
  ctx.fillStyle = C.magenta;
  ctx.font = '26px PoppinsSemi';
  ctx.fillText('Team', W / 2, 348);
  const fit = fitTeamName(ctx, teamName);
  ctx.fillStyle = C.indigo;
  ctx.font = `${fit.size}px Abril`;
  const lh = Math.round(fit.size * 1.12);
  const blockTop = fit.lines.length === 1 ? 420 : 392;
  fit.lines.forEach((line, i) => ctx.fillText(line, W / 2, blockTop + i * lh));

  // Prominent Badge Section
  if (needStay) {
    const badgeW = 790;
    const badgeH = 58;
    const badgeX = (W - badgeW) / 2;
    const badgeY = 478;

    // Glowing dark violet pill (matches the brochure colors)
    ctx.fillStyle = '#1e1435';
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
    ctx.fill();

    // Mint-teal border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2dd4bf';
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
    ctx.stroke();

    // Text inside pill
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 23px PoppinsSemi, SegoeEmoji, sans-serif';
    ctx.textAlign = 'center';
    const guestLabel = stayCount ? `${stayCount} GUEST${stayCount > 1 ? 'S' : ''}` : 'TEAM';
    ctx.fillText(`🏨  ACCOMMODATION & SHUTTLE CONFIRMED (${guestLabel})`, W / 2, badgeY + 38);
  } else if (isAllFemale) {
    const badgeW = 580;
    const badgeH = 52;
    const badgeX = (W - badgeW) / 2;
    const badgeY = 482;
    ctx.fillStyle = '#b8337f';
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f7d6e8';
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 18);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 22px PoppinsSemi';
    ctx.textAlign = 'center';
    ctx.fillText('★  ALL-WOMEN TEAM PASS (₹200 OFF)  ★', W / 2, badgeY + 35);
  }

  // QR panel
  const panel = 640, panelX = (W - panel) / 2, panelY = 560;
  ctx.fillStyle = 'rgba(51,38,107,0.10)';
  roundRect(ctx, panelX + 6, panelY + 10, panel, panel, 40); ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, panelX, panelY, panel, panel, 40); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = C.lavender;
  roundRect(ctx, panelX, panelY, panel, panel, 40); ctx.stroke();

  const qr = QRCode.create(makePayload(regCode), { errorCorrectionLevel: 'Q' });
  const n = qr.modules.size;
  const area = panel - 76;
  const cell = Math.floor(area / n);
  const qrSize = cell * n;
  const ox = panelX + (panel - qrSize) / 2;
  const oy = panelY + (panel - qrSize) / 2;
  ctx.fillStyle = C.indigo;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) {
        // finder squares stay sharp (scanners lock on to them); data dots get soft corners
        const inFinder = (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
        if (inFinder) ctx.fillRect(ox + c * cell, oy + r * cell, cell + 0.5, cell + 0.5);
        else { roundRect(ctx, ox + c * cell, oy + r * cell, cell + 0.5, cell + 0.5, cell * 0.16); ctx.fill(); }
      }
    }
  }

  // footer
  ctx.fillStyle = C.indigo;
  ctx.font = '26px Poppins';
  ctx.fillText(needStay ? 'Show this QR at Entry Desk, Shuttle Bus & Hotel Check-in' : 'RSVP pass · show this QR at the entry desk', W / 2, 1265);
  ctx.fillStyle = C.magenta;
  ctx.font = '42px PoppinsSemi';
  const displayCode = teamId ? `TEAM #${teamId}  ·  ${regCode}` : regCode;
  ctx.fillText(displayCode, W / 2, 1325);

  const trackLabel = (TRACKS.find((t) => t.id === trackId) || {}).label || '';
  ctx.fillStyle = C.indigo;
  ctx.font = '23px Poppins';
  const subtitle = isAllFemale
    ? `${trackLabel}  ·  ★ All-Women Team  ·  ${EVENT_DATES}`
    : `${trackLabel}  ·  ${EVENT_DATES}  ·  ${EVENT_VENUE}`;
  ctx.fillText(subtitle, W / 2, 1380);

  if (needStay) {
    ctx.fillStyle = '#175c2c';
    ctx.font = '600 21px PoppinsSemi';
    const guestWord = stayCount ? `${stayCount} Guest${stayCount > 1 ? 's' : ''}` : 'Team';
    ctx.fillText(`✓ Accommodation & Galgotias University Shuttle Included (${guestWord})`, W / 2, 1435);
  }

  return canvas.toBuffer('image/png');
}

module.exports = { buildCard, makePayload, parsePayload, sign };
