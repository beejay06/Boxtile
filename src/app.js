const CATS = {
  'Animals':'🐝 🦊 🐶 🐱 🐸 🐼 🐙 🦄 🐵 🦁 🐯 🐻 🐨 🐰 🐭 🐮 🐷 🐔 🐧 🦉 🦅 🐺 🐴 🐢 🐍 🦖 🐬 🐳 🦈 🦋 🐞 🐘 🦒',
  'People':'👶 👦 👧 👨 👩 👴 👵 👮 👷 💂 🤴 👸 🧑‍🚀 🧑‍🚒 🧑‍🍳 🧑‍⚕️ 🧑‍🌾 🧑‍🔧 🦸 🦹 🧙 🧛 🧜 🥷 🤠 🎅',
  'Faces and characters':'😀 😂 😎 🤓 🥳 😜 🤩 😇 🤖 👽 👻 💀 🤡 👾 🎃',
  'Cars and vehicles':'🚗 🚕 🚙 🏎️ 🚓 🚑 🚒 🚚 🚜 🚌 🏍️ 🛵 🚲 🛴 ✈️ 🚁 🚀 🛸 ⛵ 🚤 🚂',
  'Fruit':'🍎 🍏 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒 🍑 🥭 🍍 🥝 🥥',
  'Food':'🍕 🌮 🍩 🍔 🍟 🌭 🍦 🍪 🧁 🍫 🥑 🌽 🥕 🥨 🧀 🍿',
  'Sports':'⚽ 🏀 🏈 ⚾ 🎾 🏐 🎱 🏓 🥊 ⛳ 🎳 🛹',
  'Objects':'👑 💎 🎸 🎺 🎮 🎲 🎯 🎈 🎁 💡 🔑 🔨 🔧 📷 📱 ⌚ 👟 🎩 🕶️ 🧸',
  'Nature and weather':'🔥 ⭐ 🌈 ⚡ ❄️ 🌙 ☀️ 🌵 🌻 🍀 🍄 🌊' };
const EMOJIS = Object.values(CATS).flatMap(s => s.split(' '));
const COLORS = { Red:'#E53935', Orange:'#FB8C00', Yellow:'#FDD835', Green:'#43A047', Teal:'#00ACC1',
  Blue:'#1E88E5', Purple:'#AB47BC', Pink:'#F06292', Brown:'#A1664A', White:'#F5F5F5' };
const COL = Object.values(COLORS);
const PREFIX = 'boxtile-v1-';
const $ = id => document.getElementById(id);
const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const randomId = n => [...crypto.getRandomValues(new Uint8Array(n))].map(x => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[x % 31]).join('');
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function svg(tag, attrs, parent) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e); return e;
}
const xy = (G,a,b) => G.hex ? [Math.sqrt(3)*60*(a+b/2), 90*b] : [b*120+50, a*120+50];
const polar = (x,y,deg,len) => [x + len*Math.cos(deg*Math.PI/180), y + len*Math.sin(deg*Math.PI/180)];
const middle = G => G.hex ? [0,0] : [G.N*60-10, G.N*60-10];
// Turn (in degrees) that puts a given square nearest the bottom of a phone.
function angleFor(G, home) {
  const [cx,cy] = middle(G), [x,y] = xy(G,...home), step = G.hex ? 60 : 90;
  let best = 0, low = -Infinity;
  for (let a = 0; a < 360; a += step) {
    const t = a*Math.PI/180, v = (x-cx)*Math.sin(t) + (y-cy)*Math.cos(t);
    if (v > low + 1) { low = v; best = a; }
  }
  return best;
}
// Draws into host; returns a function converting screen points to board coordinates.
function drawBoard(host, s, { targets = [], preview = null, angle = 0 } = {}) {
  const G = Rules.geo(s.board);
  let root = host.firstElementChild;
  if (!root) root = svg('svg', { class: 'board' }, host);
  root.textContent = '';
  root.setAttribute('viewBox', G.hex ? '-580 -520 1160 1040' : `-8 -8 ${G.N*120-4} ${G.N*120-4}`);
  if (G.hex && angle) root.setAttribute('viewBox', '-580 -580 1160 1160');
  const [cx,cy] = middle(G), b = svg('g', { transform: `rotate(${angle} ${cx} ${cy})` }, root);
  const text = (pos, str) => { const [x,y] = xy(G,...pos);
    svg('text', { x, y: y+4, class: 'emoji', 'font-size': G.hex ? 76 : 86, transform: `rotate(${-angle} ${x} ${y})` }, b).textContent = str; };
  for (const [r,c] of Rules.cells(G)) {
    const [x,y] = xy(G,r,c);
    const cls = targets.some(t => t[0] === r && t[1] === c) ? 'cell hot' : Rules.goal(G,r,c) ? 'cell cup' : 'cell';
    if (G.hex) svg('polygon', { points: [0,1,2,3,4,5].map(k => polar(x,y,60*k-30,56).join()).join(' '), class: cls }, b);
    else svg('rect', { x: x-50, y: y-50, width: 100, height: 100, rx: 12, class: cls }, b);
  }
  const wall = (w, color, opacity) => {
    if (G.hex) return Rules.edges(G,w).forEach(e => {
      const [x,y] = xy(G,w.r,w.c), u = polar(x,y,60*e[2]-30,60), v = polar(x,y,60*e[2]+30,60);
      svg('line', { x1: u[0], y1: u[1], x2: v[0], y2: v[1], stroke: color, 'stroke-width': 17, 'stroke-linecap': 'round', opacity }, b);
    });
    svg('rect', { ...(w.o === 'h' ? { x: w.c*120, y: w.r*120+98, width: 220, height: 24 }
      : { x: w.c*120+98, y: w.r*120, width: 24, height: 220 }), rx: 10, fill: color, opacity }, b);
  };
  if (s.win === null) text(G.C, '🏆');
  s.walls.forEach(w => wall(w, s.players[w.by].color, 1));
  s.players.forEach(p => text(p.pos, p.emoji));
  if (s.win !== null) s.players.forEach((p,i) => {
    if (i === s.win) return;
    const [x,y] = xy(G,...p.pos);
    for (const d of [1,-1]) svg('line', { x1: x-40, y1: y-40*d, x2: x+40, y2: y+40*d, class: 'lost' }, b);
  });
  if (preview) wall(preview, s.players[s.turn].color, Rules.wallError(s,preview) ? .3 : 1);
  return (x,y) => new DOMPoint(x,y).matrixTransform(b.getScreenCTM().inverse());
}
function fireworks(host) {
  const root = host.firstElementChild, v = root.viewBox.baseVal, d = v.width*.15;
  for (let k = 0; k < 7; k++) {
    const x = v.x + v.width*(.15+Math.random()*.7), y = v.y + v.height*(.15+Math.random()*.6);
    for (let i = 0; i < 18; i++) {
      const a = i*Math.PI/9, e = svg('circle', { cx: x, cy: y, r: v.width*.01, fill: COL[(k+i%2)%COL.length], opacity: 0 }, root);
      e.animate([{ transform: 'translate(0px,0px)', opacity: 1 }, { transform: `translate(${Math.cos(a)*d}px,${Math.sin(a)*d+d*.3}px)`, opacity: 0 }],
        { duration: 900, delay: k*220, easing: 'ease-out' }).onfinish = () => e.remove();
    }
  }
}

/* ---------------- TV (spectator and host) ---------------- */
function startTV() {
  document.body.className = 'tv';
  $('tv').hidden = false;
  const saved = store.get('bx-host');
  const room = saved && Date.now() - saved.at < 6*3600e3 ? saved
    : { code: randomId(4), seats: [], game: null, board: '9', layout: 'spread', cpus: 0 };
  const conns = new Map();
  let preview = null, peer, botTimer, celebrated = room.game?.win != null;

  const total = () => room.seats.length + room.cpus;
  const ready = () => room.seats.length >= 1 && Rules.counts(room.board).includes(total());
  function broadcast() {
    room.at = Date.now(); store.set('bx-host', room);
    conns.forEach((conn, token) => {
      if (!conn.open) return;
      const g = room.game;
      conn.send({ type: 'state', you: g ? g.players.findIndex(p => p.id === token) : room.seats.findIndex(p => p.id === token),
        seats: room.seats.map(p => ({ name: p.name, emoji: p.emoji, color: p.color })), ready: ready(), total: total(),
        game: g && { ...g, players: g.players.map(({ id, ...p }) => p) } });
    });
    render(); schedule();
  }
  function schedule() {
    clearTimeout(botTimer);
    const g = room.game;
    if (g && g.live && g.win === null && g.players[g.turn].cpu)
      botTimer = setTimeout(() => { Rules.act(g, g.turn, Rules.bot(g)); broadcast(); }, 900);
  }
  function render() {
    const g = room.game;
    $('lobby').hidden = !!g; $('play').hidden = !g;
    if (!g) {
      const url = location.href.split(/[?#]/)[0] + '?room=' + room.code;
      const q = qrcode(0, 'M'); q.addData(url); q.make();
      $('qr').innerHTML = q.createSvgTag({ scalable: true, margin: 2 });
      $('code').textContent = room.code;
      $('board').value = room.board; $('layout').value = room.layout; $('cpus').value = room.cpus;
      $('layout').hidden = room.board !== '9';
      $('joined').textContent = '';
      room.seats.forEach(p => { const chip = el('div', 'chip', p.emoji + ' ' + p.name); chip.style.borderBottom = '6px solid ' + p.color; $('joined').appendChild(chip); });
      $('start').disabled = !ready();
      $('start').textContent = ready() ? `Show board (${total()} players)`
        : !room.seats.length ? 'Waiting for a phone to join'
        : `${total()} players. Need ${Rules.counts(room.board).join(', ')}`;
      return;
    }
    drawBoard($('tvboard'), g, { preview });
    const who = g.players[g.win ?? g.turn];
    $('banner').textContent = g.win !== null ? `🏆 ${who.emoji} ${who.name} wins!` : `${who.emoji} ${who.name}${g.live ? "'s turn" : ' goes first'}`;
    $('banner').style.color = who.color;
    $('list').textContent = '';
    g.players.forEach((p,i) => {
      const row = el('div', 'row' + (i === g.turn && g.win === null ? ' now' : ''));
      row.style.borderColor = p.color;
      const gone = !p.cpu && !conns.get(p.id)?.open;
      row.append(el('span', '', `${p.emoji} ${p.name}${gone ? ' 📵' : ''}`), el('span', '', `${Rules.away(g,i)} away · 🧱 ${p.left}`));
      $('list').appendChild(row);
    });
    $('go').hidden = g.live; $('again').hidden = g.win === null;
    $('rejoin').textContent = `Dropped? Rejoin with code ${room.code}`;
    if (g.win !== null && !celebrated) fireworks($('tvboard'));
    celebrated = g.win !== null;
  }
  function begin() {
    if (!ready()) return;
    const list = room.seats.map(p => ({ ...p, cpu: false }));
    for (let k = 1; k <= room.cpus; k++)
      list.push({ id: 'cpu'+k, name: 'CPU '+k, emoji: EMOJIS.find(e => !list.some(p => p.emoji === e)), color: COL.find(c => !list.some(p => p.color === c)), cpu: true });
    room.game = Rules.newGame(list, room.board, room.layout); preview = null; broadcast();
  }
  const go = () => { if (room.game && !room.game.live) { room.game.live = true; broadcast(); } };
  const again = () => { if (room.game && room.game.win !== null) { Rules.restart(room.game); preview = null; broadcast(); } };
  function handle(conn, m) {
    if (!m || typeof m !== 'object') return;
    if (m.type === 'hello' && typeof m.token === 'string') { conn.token = m.token; conns.set(m.token, conn); return broadcast(); }
    if (!conn.token) return;
    const i = room.seats.findIndex(p => p.id === conn.token);
    const g = room.game, gi = g ? g.players.findIndex(p => p.id === conn.token) : -1;
    const fail = text => conn.send({ type: 'error', text });
    if (m.type === 'join') {
      const name = String(m.name || '').trim().slice(0,12);
      if (g) return fail('A game is already running');
      if (!name || !EMOJIS.includes(m.emoji)) return fail('Enter a name and pick an emoji');
      if (room.seats.some((p,j) => j !== i && p.emoji === m.emoji)) return fail('Someone already has that emoji');
      if (i < 0 && room.seats.length >= 8) return fail('The game is full');
      if (!COL.includes(m.color)) return fail('Pick a color');
      if (room.seats.some((p,j) => j !== i && p.color === m.color)) return fail('Someone already has that color');
      const seat = { id: conn.token, name, emoji: m.emoji, color: m.color };
      if (i < 0) room.seats.push(seat); else room.seats[i] = seat;
    } else if (m.type === 'leave' && !g && i >= 0) room.seats.splice(i,1);
    else if (m.type === 'start' && !g && i >= 0) return begin();
    else if (gi < 0) return;
    else if (m.type === 'go') return go();
    else if (m.type === 'again') return again();
    else if (m.type === 'preview' && gi === g.turn && g.live && g.win === null) {
      preview = m.wall && Rules.wallError(g, m.wall) !== 'Off the board' ? m.wall : null;
      return render();
    } else if (m.type === 'act') {
      const e = Rules.act(g, gi, m.action);
      if (e) return fail(e);
      preview = null;
    } else return;
    broadcast();
  }
  function connect() {
    peer = new Peer(PREFIX + room.code);
    peer.on('open', () => { $('status').textContent = ''; broadcast(); });
    peer.on('connection', conn => { conn.on('data', m => handle(conn, m)); conn.on('close', () => render()); });
    peer.on('disconnected', () => setTimeout(() => !peer.destroyed && peer.reconnect(), 2000));
    peer.on('error', e => {
      $('status').textContent = 'Connection problem: ' + e.type + '. Retrying…';
      if (peer.destroyed || e.type === 'unavailable-id') { peer.destroy(); setTimeout(connect, 3000); }
    });
  }
  $('board').onchange = () => { room.board = $('board').value; broadcast(); };
  $('layout').onchange = () => { room.layout = $('layout').value; broadcast(); };
  $('cpus').onchange = () => { room.cpus = +$('cpus').value; broadcast(); };
  $('start').onclick = begin;
  // TV remote: arrow keys move between the visible controls.
  document.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const list = [...$('tv').querySelectorAll('button, select')].filter(x => !x.disabled && x.offsetParent);
    if (!list.length) return;
    e.preventDefault();
    const at = list.indexOf(document.activeElement);
    list[at < 0 ? 0 : (at + step + list.length) % list.length].focus();
  });
  $('go').onclick = go;
  $('again').onclick = again;
  $('reset').onclick = () => { if (!confirm('End this game and return to the lobby?')) return; room.game = null; preview = null; broadcast(); };
  $('clear').onclick = () => { room.seats = []; broadcast(); };
  render(); connect();
}

/* ---------------- Phone (controller) ---------------- */
function startPhone(code) {
  document.body.className = 'phone';
  $('phone').hidden = false;
  let token = store.get('tr-token');
  if (!token) store.set('tr-token', token = randomId(16));
  let peer, conn, data = null, retry, pick = null, tint = null, ori = null, wall = null, hd = 0, angle = 0, toBoard, celebrated = false;
  const send = m => conn?.open && conn.send(m);
  const note = t => $('note').textContent = t;
  function connect() {
    clearTimeout(retry);
    peer?.destroy();
    note('Connecting to the TV…');
    const mine = peer = new Peer();
    const lost = () => { if (mine !== peer) return; note('Lost the TV. Reconnecting…'); clearTimeout(retry); retry = setTimeout(connect, 2500); };
    mine.on('open', () => {
      conn = mine.connect(PREFIX + code, { reliable: true });
      conn.on('open', () => { note(''); send({ type: 'hello', token }); });
      conn.on('data', m => {
        if (m.type === 'error') return note(m.text);
        const g = m.game, old = data?.game;
        if (!g || !old || g.turn !== old.turn || g.walls.length !== old.walls.length) { ori = null; wall = null; }
        data = m; note(''); render();
      });
      conn.on('close', lost);
    });
    mine.on('error', lost);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !conn?.open) connect(); });
  const turnNow = () => { const g = data?.game; return g && g.live && g.win === null && g.turn === data.you; };
  function drawEmojis() {
    const taken = data.seats.map(p => p.emoji);
    $('emojis').textContent = '';
    CATS[$('cat').value].split(' ').forEach(e => {
      const b = el('button', 'pick' + (pick === e ? ' on' : ''), e);
      b.type = 'button'; b.disabled = taken.includes(e);
      b.onclick = () => { pick = e; drawEmojis(); };
      $('emojis').appendChild(b);
    });
    $('chosen').textContent = pick ? 'You picked ' + pick : 'Pick your emoji';
    const used = data.seats.map(p => p.color);
    if (used.includes(tint)) tint = null;
    $('colors').textContent = '';
    for (const [label, hex] of Object.entries(COLORS)) {
      const b = el('button', 'swatch' + (tint === hex ? ' on' : ''), tint === hex ? '✓' : '');
      b.type = 'button'; b.style.background = hex; b.disabled = used.includes(hex);
      b.setAttribute('aria-label', label); b.title = label;
      b.onclick = () => { tint = hex; drawEmojis(); };
      $('colors').appendChild(b);
    }
  }
  function setWall(w) { wall = w; send({ type: 'preview', wall }); render(); }
  function render() {
    const { game: g, you, seats } = data;
    $('join').hidden = !!g || you >= 0;
    $('wait').hidden = !!g || you < 0;
    $('ctrl').hidden = !g || you < 0;
    if (g && you < 0) return note('Game in progress. Watch the TV and join the next one.');
    if (!g && you < 0) return drawEmojis();
    if (!g) {
      $('me').textContent = `${seats[you].emoji} ${seats[you].name}, you're in!`;
      $('pstart').disabled = !data.ready;
      $('pstart').textContent = data.ready ? `Show board (${data.total} players)` : `${data.total} players. Check the TV`;
      return;
    }
    const G = Rules.geo(g.board), p = g.players[you], mine = turnNow(), who = g.players[g.win ?? g.turn];
    angle = angleFor(G, p.home);
    $('turn').textContent = g.win !== null ? `🏆 ${who.emoji} ${who.name} wins!` : !g.live ? `${who.emoji} ${who.name} goes first`
      : mine ? `Your turn ${p.emoji}` : `${who.emoji} ${who.name}'s turn`;
    $('turn').style.color = who.color;
    toBoard = drawBoard($('pboard'), g, { angle, targets: mine && !ori ? Rules.moves(g, you) : [], preview: mine ? wall : null });
    $('pboard').style.touchAction = ori ? 'none' : 'manipulation';
    const problem = wall && Rules.wallError(g, wall);
    $('hint').textContent = g.win !== null ? 'Tap Rematch to play again' : !g.live ? 'Find your piece, then tap Start game'
      : !mine ? 'Watch the TV' : problem || (wall ? 'Tap Place wall, or tap another spot' : ori ? 'Tap the board where the wall goes' : 'Tap a purple tile, or pick a wall');
    $('pgo').hidden = g.live; $('pagain').hidden = g.win === null;
    $('tools').hidden = !mine;
    for (const id of ['wh','wv']) {
      const b = $(id); b.textContent = '';
      if (G.hex && id === 'wv') { b.textContent = 'Rotate'; b.className = ''; continue; }
      const bar = el('i', G.hex || id === 'wh' ? 'bar-h' : 'bar-v'); bar.style.background = p.color;
      b.append(bar, G.hex ? 'Wall' : id === 'wh' ? 'Horizontal' : 'Vertical');
      b.className = ori === (id === 'wh' ? 'h' : 'v') ? 'on' : '';
      b.disabled = p.left < 1;
    }
    $('place').disabled = !wall || !!problem; $('cancel').disabled = !ori;
    $('walls').textContent = `${p.emoji} ${Rules.away(g,you)} away · 🧱 ${p.left} left`;
    if (g.win !== null && !celebrated) fireworks($('pboard'));
    celebrated = g.win !== null;
  }
  // Wall direction as seen on this phone, converted to the board's own direction.
  const boardOri = o => angle % 180 ? (o === 'h' ? 'v' : 'h') : o;
  function aim(ev, lift) {
    const G = Rules.geo(data.game.board), q = toBoard(ev.clientX, ev.clientY - lift);
    if (G.hex) {
      let best = null, near = 62;
      for (const c of Rules.cells(G)) { const [x,y] = xy(G,...c), d = Math.hypot(q.x-x, q.y-y); if (d < near) { near = d; best = c; } }
      if (!best) return false;
      setWall({ r: best[0], c: best[1], d: hd });
    } else {
      const end = G.N*120-20;
      if (q.x < -8 || q.y < -8 || q.x > end+8 || q.y > end+8) return false;
      const snap = v => Math.max(0, Math.min(G.N-2, Math.round((v-110)/120)));
      setWall({ r: snap(q.y), c: snap(q.x), o: boardOri(ori) });
    }
    return true;
  }
  let drag = null, onBoard = false;
  for (const [id,o] of [['wh','h'],['wv','v']]) {
    const b = $(id), hexNow = () => data.game.board === 'hex';
    b.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    b.onpointerdown = ev => {
      if (!turnNow() || (hexNow() && o === 'v')) return;
      drag = { x: ev.clientX, y: ev.clientY, was: ori === o, moved: false, over: false };
      ori = o; try { b.setPointerCapture(ev.pointerId); } catch {}
      setWall(null);
    };
    b.onpointermove = ev => {
      if (!drag) return;
      if (Math.hypot(ev.clientX-drag.x, ev.clientY-drag.y) > 10) drag.moved = true;
      if (drag.moved) drag.over = aim(ev, ev.pointerType === 'touch' ? 55 : 0);
    };
    b.onpointerup = () => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.moved && d.over && wall && !Rules.wallError(data.game, wall)) return send({ type: 'act', action: { kind: 'wall', ...wall } });
      if (!d.moved && d.was) { ori = null; return setWall(null); }
      render();
    };
    b.onpointercancel = () => { drag = null; render(); };
    b.onclick = () => { if (turnNow() && hexNow() && o === 'v') { hd = (hd+1)%6; wall ? setWall({ ...wall, d: hd }) : render(); } };
  }
  const board = $('pboard');
  board.onpointerdown = ev => { if (!turnNow() || !ori) return; onBoard = true; try { board.setPointerCapture(ev.pointerId); } catch {} aim(ev,0); };
  board.onpointermove = ev => { if (onBoard && ori) aim(ev,0); };
  board.onpointerup = board.onpointercancel = () => { onBoard = false; };
  board.onclick = ev => {
    if (!turnNow() || ori) return;
    const G = Rules.geo(data.game.board), q = toBoard(ev.clientX, ev.clientY);
    const m = Rules.moves(data.game, data.you).find(c => { const [x,y] = xy(G,...c); return Math.hypot(q.x-x, q.y-y) < 62; });
    if (m) send({ type: 'act', action: { kind: 'move', r: m[0], c: m[1] } });
  };
  Object.keys(CATS).forEach(k => $('cat').add(new Option(k,k)));
  $('cat').onchange = () => data && drawEmojis();
  $('join').onsubmit = e => { e.preventDefault(); if (!pick) return note('Pick an emoji'); if (!tint) return note('Pick a color'); send({ type: 'join', name: $('name').value, emoji: pick, color: tint }); };
  $('pstart').onclick = () => send({ type: 'start' });
  $('leave').onclick = () => send({ type: 'leave' });
  $('pgo').onclick = () => send({ type: 'go' });
  $('pagain').onclick = () => send({ type: 'again' });
  $('place').onclick = () => wall && send({ type: 'act', action: { kind: 'wall', ...wall } });
  $('cancel').onclick = () => { ori = null; setWall(null); };
  connect();
}

const code = new URLSearchParams(location.search).get('room');
code ? startPhone(code.toUpperCase().replace(/[^A-Z0-9]/g,'')) : startTV();
