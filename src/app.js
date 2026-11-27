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

// One row per spot in the game: who has joined, who is still missing, and computers.
function drawSlots(box, seats, size, cpus) {
  box.textContent = '';
  box.className = 'slots';
  const spots = Math.max(size, seats.length + cpus);
  for (let i = 0; i < spots; i++) {
    const p = seats[i], bot = !p && i >= spots - cpus;
    const chip = el('div', 'chip' + (p || bot ? '' : ' empty'), p ? `${p.emoji} ${p.name}` : bot ? '🤖 Computer' : 'Waiting…');
    if (p) chip.style.borderBottom = '6px solid ' + p.color;
    box.appendChild(chip);
  }
  box.appendChild(el('div', 'count', `${Math.min(seats.length + cpus, spots)} of ${size} ready`));
}
const waitingText = (seats, size, cpus) => {
  const n = size - cpus - seats;
  return n > 0 ? `Waiting for ${n} more player${n > 1 ? 's' : ''}` : `Too many players for ${size} spots`;
};

/* ---------------- Music (YouTube player on the TV and watch screens) ---------------- */
function parseMusic(text) {
  try {
    const u = new URL(String(text).trim()), host = u.hostname.replace(/^(www|m|music)\./, '');
    if (host !== 'youtube.com' && host !== 'youtu.be') return null;
    const list = u.searchParams.get('list');
    const video = host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.match(/\/(?:shorts|live)\/([\w-]+)/)?.[1];
    if (list && /^[\w-]{10,}$/.test(list)) return { list };
    return /^[\w-]{11}$/.test(video || '') ? { video } : null;
  } catch { return null; }
}
function setupMusic(report = () => {}) {
  let player = null, wanted = null, ready = false, sent = '', app = { title: '', playing: false };
  // Tells phones what this screen is playing, only when something changed.
  function tellPhones() {
    const source = $('source').value, link = source === 'link';
    const now = { on: link ? !!wanted : source !== '' && /BoxtileApp/.test(navigator.userAgent),
      title: link ? $('song').textContent : app.title, playing: link ? $('pp').textContent === '⏸' : app.playing };
    const key = JSON.stringify(now);
    if (key === sent || (!now.on && !sent)) return;
    sent = key; report(now);
  }
  const title = t => { $('song').textContent = t; setTimeout(tellPhones); };
  const buttons = () => ['prev', 'pp', 'next'].forEach(id => $(id).disabled = !ready || (id !== 'pp' && !wanted?.list));
  function start(autoplay) {
    if (!ready) return;
    const what = wanted.list ? { listType: 'playlist', list: wanted.list } : { videoId: wanted.video };
    const verb = autoplay ? 'load' : 'cue';
    wanted.list ? player[verb + 'Playlist'](what) : player[verb + 'VideoById'](what);
    buttons();
  }
  function create() {
    player = new YT.Player('yt', {
      width: '100%', height: 200, playerVars: { playsinline: 1, rel: 0 },
      events: {
        onReady: () => { ready = true; start(wanted.autoplay); },
        onStateChange: e => {
          const v = player.getVideoData?.();
          if (v?.title) title(v.author ? `${v.title} · ${v.author}` : v.title);
          $('pp').textContent = e.data === 1 ? '⏸' : '▶';
          tellPhones();
        },
        onError: () => { title("That one can't play here"); if (wanted.list) setTimeout(() => player.nextVideo(), 1500); },
      },
    });
  }
  function load(url, autoplay = true) {
    const found = parseMusic(url);
    if (!found) { title('Paste a YouTube or YouTube Music link'); return false; }
    wanted = { ...found, autoplay };
    store.set('bx-music', url);
    $('playerbox').hidden = false; $('musicform').hidden = true; $('music').classList.add('on');
    document.body.classList.add('has-music');
    title('Loading music…');
    if (player) start(autoplay);
    else if (window.YT?.Player) create();
    else {
      window.onYouTubeIframeAPIReady = create;
      const tag = el('script'); tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => { title("Couldn't reach YouTube"); $('musicform').hidden = false; tag.remove(); };
      document.head.appendChild(tag);
    }
    buttons();
    return true;
  }
  $('musicform').onsubmit = e => { e.preventDefault(); if (load($('murl').value)) $('murl').value = ''; };
  $('prev').onclick = () => player?.previousVideo();
  $('next').onclick = () => player?.nextVideo();
  $('pp').onclick = () => player && (player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo());
  $('change').onclick = () => { $('musicform').hidden = !$('musicform').hidden; };
  // Picker: music apps on the Shield, or a YouTube link played right here.
  const inApp = /BoxtileApp/.test(navigator.userAgent), pick = $('source');
  const names = { spotify: 'Spotify', tidal: 'TIDAL', ytmusic: 'YouTube Music', apple: 'Apple Music' };
  const tell = action => { location.href = 'boxtile:' + action; };
  function show(source) {
    pick.value = source;
    store.set('bx-source', source);
    const link = source === 'link', other = !!names[source];
    if (!link) player?.pauseVideo?.();
    $('playerbox').hidden = !link || !wanted;
    $('musicform').hidden = !link || !!wanted;
    $('remote').hidden = !other || !inApp;
    $('elsewhere').hidden = !other || inApp;
    $('elsewhere').textContent = other ? `Start ${names[source]} on the device playing sound. Controls for it work in the Shield app.` : '';
    $('openapp').textContent = other ? `Open ${names[source]}` : '';
    $('music').classList.toggle('on', source !== '');
    document.body.classList.toggle('has-music', other ? inApp : link && !!wanted);
    if (other && inApp) tell('use/' + source);
    tellPhones();
  }
  pick.onchange = () => show(pick.value);
  $('openapp').onclick = () => tell('open/' + pick.value);
  $('rprev').onclick = () => tell('prev');
  $('rpp').onclick = () => tell('playpause');
  $('rnext').onclick = () => tell('next');
  $('access').onclick = () => tell('access');
  window.boxtileNow = now => {
    $('access').hidden = now.access;
    $('rsong').textContent = !now.access ? 'Allow access to see song names' : now.title ? `${now.title}${now.artist ? ' · ' + now.artist : ''}` : 'Nothing playing yet';
    $('rpp').textContent = now.access && now.playing ? '⏸' : '⏯';
    app = { title: now.access && now.title ? `${now.title}${now.artist ? ' · ' + now.artist : ''}` : '', playing: !!now.playing };
    tellPhones();
  };
  buttons();
  const last = store.get('bx-music'), source = store.get('bx-source') || '';
  if (last && (source === 'link' || !source)) load(last, false);
  show(source || (last ? 'link' : ''));
  const play = url => { show('link'); const ok = load(url); if (ok) show('link'); return ok; };
  play.control = action => {
    const id = { prev: ['prev', 'rprev'], playpause: ['pp', 'rpp'], next: ['next', 'rnext'] }[action];
    if (id) $(id[$('source').value === 'link' ? 0 : 1]).click();
  };
  // The YouTube video keeps the panel tall, so the scoreboard needs to know its height.
  if (window.ResizeObserver) new ResizeObserver(() => document.body.style.setProperty('--mh', $('music').offsetHeight + 'px')).observe($('music'));
  return play;
}
// TV remote: arrow keys move between the visible controls.
function remoteArrows() {
  document.addEventListener('keydown', e => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    const list = [...$('tv').querySelectorAll('button, select, input')].filter(x => !x.disabled && x.offsetParent);
    if (!list.length) return;
    e.preventDefault();
    const at = list.indexOf(document.activeElement);
    list[at < 0 ? 0 : (at + step + list.length) % list.length].focus();
  });
}

/* ---------------- TV (spectator and host) ---------------- */
function startTV(duo = false) {
  if (!duo) { document.body.className = 'tv'; $('tv').hidden = false; }
  const key = duo ? 'bx-duo' : 'bx-host', saved = store.get(key);
  const room = saved && Date.now() - saved.at < 6*3600e3 ? saved
    : { code: randomId(4), seats: [], game: null, board: '9', layout: 'spread', cpus: 0 };
  const conns = new Map();
  let playMusic = null, heard = 0, now = null;
  function share(info) {
    now = { on: !!info?.on, title: String(info?.title || '').slice(0, 200), playing: !!info?.playing };
    conns.forEach(c => c.open && c.send({ type: 'now', now }));
  }
  let preview = null, peer, botTimer, celebrated = room.game?.win != null;

  // Keeps the player count and computers valid for the chosen board and who has joined.
  function tidy() {
    const allowed = Rules.counts(room.board);
    if (!allowed.includes(room.size)) room.size = allowed.filter(n => n <= (room.size || 2)).pop() || allowed[0];
    room.cpus = Math.max(0, Math.min(room.cpus, room.size - Math.max(1, room.seats.length)));
  }
  function fill(size, cpus) {
    for (const o of $(size).options) o.disabled = !Rules.counts(room.board).includes(+o.value) || +o.value < room.seats.length;
    for (const o of $(cpus).options) o.disabled = +o.value > room.size - Math.max(1, room.seats.length);
    $(size).value = room.size; $(cpus).value = room.cpus;
  }
  tidy();
  const ready = () => room.seats.length >= 1 && room.seats.length + room.cpus === room.size;
  function broadcast() {
    tidy();
    room.at = Date.now(); store.set(key, room);
    conns.forEach((conn, token) => {
      if (!conn.open) return;
      const g = room.game;
      conn.send({ type: 'state', duo, preview, music: room.music, now, you: g ? g.players.findIndex(p => p.id === token) : room.seats.findIndex(p => p.id === token),
        seats: room.seats.map(p => ({ name: p.name, emoji: p.emoji, color: p.color })), ready: ready(), size: room.size, cpus: room.cpus,
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
    if (duo) return invite();
    $('lobby').hidden = !!g; $('play').hidden = !g;
    if (!g) {
      const url = location.href.split(/[?#]/)[0] + '?room=' + room.code;
      const q = qrcode(0, 'M'); q.addData(url); q.make();
      $('qr').innerHTML = q.createSvgTag({ scalable: true, margin: 2 });
      $('code').textContent = room.code;
      $('board').value = room.board; $('layout').value = room.layout; fill('size', 'cpus');
      $('layout').hidden = room.board !== '9';
      drawSlots($('joined'), room.seats, room.size, room.cpus);
      $('start').disabled = !ready();
      $('start').textContent = ready() ? `Show board (${room.size} players)` : waitingText(room.seats.length, room.size, room.cpus);
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
  const link = () => location.href.split(/[?#]/)[0] + '?room=' + room.code + '&duo=1';
  function invite() {
    $('invite').hidden = !!room.game;
    fill('dsize', 'dcpus');
    drawSlots($('dlist'), room.seats, room.size, room.cpus);
    const q = qrcode(0, 'M'); q.addData(link()); q.make();
    $('dqr').innerHTML = q.createSvgTag({ scalable: true, margin: 2 });
    $('dcode').textContent = room.code;
    $('dboard').value = room.board; $('dlayout').value = room.layout; $('dlayout').hidden = room.board !== '9';
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
    if (conn.watch) { if (m.type === 'np') share(m.now); return; }
    if (m.type === 'hello' && typeof m.token === 'string') { conn.watch = !!m.watch; conn.token = m.token; conns.set(m.token, conn); return broadcast(); }
    if (!conn.token) return;
    const i = room.seats.findIndex(p => p.id === conn.token);
    const g = room.game, gi = g ? g.players.findIndex(p => p.id === conn.token) : -1;
    const fail = text => conn.send({ type: 'error', text });
    if (m.type === 'join') {
      const name = String(m.name || '').trim().slice(0,12);
      if (g) return fail('A game is already running');
      if (!name || !EMOJIS.includes(m.emoji)) return fail('Enter a name and pick an emoji');
      if (room.seats.some((p,j) => j !== i && p.emoji === m.emoji)) return fail('Someone already has that emoji');
      if (i < 0 && room.seats.length >= room.size - room.cpus) return fail('The game is full. Ask the host to add a spot.');
      if (!COL.includes(m.color)) return fail('Pick a color');
      if (room.seats.some((p,j) => j !== i && p.color === m.color)) return fail('Someone already has that color');
      const seat = { id: conn.token, name, emoji: m.emoji, color: m.color };
      if (i < 0) room.seats.push(seat); else room.seats[i] = seat;
    } else if (m.type === 'leave' && !g && i >= 0) room.seats.splice(i,1);
    else if (m.type === 'start' && !g && i >= 0) return begin();
    else if (m.type === 'mc' && (i >= 0 || gi >= 0)) {
      if (!['prev', 'playpause', 'next'].includes(m.action)) return;
      if (playMusic) return playMusic.control(m.action);
      return conns.forEach(c => c.watch && c.open && c.send({ type: 'mc', action: m.action }));
    }
    else if (m.type === 'music' && (i >= 0 || gi >= 0)) {
      if (!parseMusic(m.url)) return fail('Paste a YouTube or YouTube Music link');
      room.music = { url: String(m.url).trim(), n: (room.music?.n || 0) + 1 };
      if (playMusic) { heard = room.music.n; playMusic(room.music.url); }
      conn.send({ type: 'error', text: 'Music sent to the screen' });
    }
    else if (gi < 0) return;
    else if (m.type === 'go') return go();
    else if (m.type === 'end' && duo && conn.local) { room.game = null; preview = null; }
    else if (m.type === 'again') return again();
    else if (m.type === 'preview' && gi === g.turn && g.live && g.win === null) {
      preview = m.wall && Rules.wallError(g, m.wall) !== 'Off the board' ? m.wall : null;
      conns.forEach(c => c.watch && c.open && c.send({ type: 'preview', wall: preview }));
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
    peer.on('open', () => { $(duo ? 'status2' : 'status').textContent = ''; broadcast(); });
    peer.on('connection', conn => { conn.on('data', m => handle(conn, m)); conn.on('close', () => render()); });
    peer.on('disconnected', () => setTimeout(() => !peer.destroyed && peer.reconnect(), 2000));
    peer.on('error', e => {
      $(duo ? 'status2' : 'status').textContent = 'Connection problem: ' + e.type + '. Retrying…';
      if (peer.destroyed || e.type === 'unavailable-id') { peer.destroy(); setTimeout(connect, 3000); }
    });
  }
  if (duo) {
    $('dboard').onchange = () => { room.board = $('dboard').value; broadcast(); };
    $('dlayout').onchange = () => { room.layout = $('dlayout').value; broadcast(); };
    const share = async url => {
      try {
        if (navigator.share) await navigator.share({ title: 'Boxtile', url });
        else { await navigator.clipboard.writeText(url); $('status2').textContent = 'Link copied'; }
      } catch {}
    };
    $('copy').onclick = () => share(link());
    $('copywatch').onclick = () => share(location.href.split(/[?#]/)[0] + '?watch=' + room.code);
    $('dcpus').innerHTML = $('cpus').innerHTML;
    $('dsize').innerHTML = $('size').innerHTML;
    $('dsize').onchange = () => { room.size = +$('dsize').value; broadcast(); };
    $('dcpus').onchange = () => { room.cpus = +$('dcpus').value; broadcast(); };
    $('quit').onclick = () => { if (!confirm('Leave this game? It ends it for everyone.')) return; store.set(key, null); location.href = location.href.split(/[?#]/)[0]; };
    document.addEventListener('visibilitychange', () => { if (!document.hidden && peer?.disconnected && !peer.destroyed) peer.reconnect(); });
    navigator.wakeLock?.request('screen').catch(() => {});
    connect();
    // This phone's own controller talks to the host directly.
    startPhone(room.code, receive => {
      const later = (fn, m) => { const copy = JSON.parse(JSON.stringify(m)); setTimeout(() => fn(copy)); };
      const hostSide = { open: true, local: true, send: m => later(receive, m) };
      return { open: true, send: m => later(x => handle(hostSide, x), m) };
    }, true);
    render();
    return;
  }
  $('board').onchange = () => { room.board = $('board').value; broadcast(); };
  $('layout').onchange = () => { room.layout = $('layout').value; broadcast(); };
  $('size').onchange = () => { room.size = +$('size').value; broadcast(); };
  $('cpus').onchange = () => { room.cpus = +$('cpus').value; broadcast(); };
  $('start').onclick = begin;
  remoteArrows();
  playMusic = setupMusic(share);
  if (room.music) heard = room.music.n;
  $('go').onclick = go;
  $('again').onclick = again;
  $('reset').onclick = () => { if (!confirm('End this game and return to the lobby?')) return; room.game = null; preview = null; broadcast(); };
  $('clear').onclick = () => { room.seats = []; broadcast(); };
  render(); connect();
}

/* ---------------- Spectator (watch only) ---------------- */
const goWatch = c => location.href = location.href.split(/[?#]/)[0] + '?watch=' + encodeURIComponent(c.trim().toUpperCase());
function startWatch(code) {
  document.body.className = 'tv watch';
  $('tv').hidden = false; $('lobby').hidden = true; $('play').hidden = false;
  const token = 'watch-' + randomId(12);
  let peer, conn, retry, data = null, celebrated = false, heard = 0;
  remoteArrows();
  let latest = null;
  const playMusic = setupMusic(now => { latest = now; if (conn?.open) conn.send({ type: 'np', now }); });
  const status = t => $('banner').textContent = t;
  function render() {
    const g = data.game;
    $('list').textContent = ''; $('list').className = ''; $('go').hidden = $('again').hidden = $('reset').hidden = true;
    $('rejoin').textContent = `Watching game ${code}`;
    $('banner').style.color = '';
    if (!g) {
      $('tvboard').textContent = ''; celebrated = false;
      drawSlots($('list'), data.seats, data.size, data.cpus);
      return status('Waiting for the game to start');
    }
    drawBoard($('tvboard'), g, { preview: data.preview });
    const who = g.players[g.win ?? g.turn];
    status(g.win !== null ? `🏆 ${who.emoji} ${who.name} wins!` : `${who.emoji} ${who.name}${g.live ? "'s turn" : ' goes first'}`);
    $('banner').style.color = who.color;
    g.players.forEach((p,i) => {
      const row = el('div', 'row' + (i === g.turn && g.win === null ? ' now' : ''));
      row.style.borderColor = p.color;
      row.append(el('span', '', `${p.emoji} ${p.name}`), el('span', '', `${Rules.away(g,i)} away · 🧱 ${p.left}`));
      $('list').appendChild(row);
    });
    if (g.win !== null && !celebrated) fireworks($('tvboard'));
    celebrated = g.win !== null;
  }
  function connect() {
    clearTimeout(retry); peer?.destroy();
    status('Connecting to the game…');
    const mine = peer = new Peer();
    const lost = () => { if (mine !== peer) return; status('Lost the game. Reconnecting…'); clearTimeout(retry); retry = setTimeout(connect, 2500); };
    mine.on('open', () => {
      conn = mine.connect(PREFIX + code, { reliable: true });
      conn.on('open', () => { conn.send({ type: 'hello', token, watch: true }); if (latest) conn.send({ type: 'np', now: latest }); });
      conn.on('data', m => {
        if (m.type === 'mc') return playMusic.control(m.action);
        if (m.type === 'state') data = m;
        else if (m.type === 'preview' && data) data.preview = m.wall;
        else return;
        if (data.music && data.music.n !== heard) { heard = data.music.n; playMusic(data.music.url); }
        render();
      });
      conn.on('close', lost);
    });
    mine.on('error', lost);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !conn?.open) connect(); });
  navigator.wakeLock?.request('screen').catch(() => {});
  connect();
}

/* ---------------- Phone (controller) ---------------- */
function startPhone(code, local = null, duo = !!local || new URLSearchParams(location.search).has('duo')) {
  document.body.className = 'phone';
  $('phone').hidden = false;
  let token = store.get('tr-token');
  if (!token) store.set('tr-token', token = randomId(16));
  let peer, conn, data = null, retry, pick = null, tint = null, ori = null, wall = null, hd = 0, angle = 0, toBoard, celebrated = false;
  const send = m => conn?.open && conn.send(m);
  const note = t => $('note').textContent = t;
  function showNow(now) {
    $('pmusic').hidden = !(now?.on && data?.you >= 0);
    $('psong').textContent = now?.title || 'Music';
    $('ppp').textContent = now?.playing ? '⏸' : '⏯';
  }
  function receive(m) {
    if (m.type === 'now') return showNow(m.now);
    if (m.type === 'error') return note(m.text);
    const g = m.game, old = data?.game;
    if (!g || !old || g.turn !== old.turn || g.walls.length !== old.walls.length) { ori = null; wall = null; }
    data = m; duo = m.duo; note(''); $('tunes').hidden = !(m.you >= 0); showNow(m.now); render();
  }
  function connect() {
    if (local) { conn = local(receive); return send({ type: 'hello', token }); }
    clearTimeout(retry);
    peer?.destroy();
    note(duo ? 'Connecting to the host phone…' : 'Connecting to the TV…');
    const mine = peer = new Peer();
    const lost = () => { if (mine !== peer) return; note(duo ? 'Lost the host phone. Reconnecting…' : 'Lost the TV. Reconnecting…'); clearTimeout(retry); retry = setTimeout(connect, 2500); };
    mine.on('open', () => {
      conn = mine.connect(PREFIX + code, { reliable: true });
      conn.on('open', () => { note(''); send({ type: 'hello', token }); });
      conn.on('data', receive);
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
    if (g && you < 0) return note(duo ? 'Game in progress. Join the next one.' : 'Game in progress. Watch the TV and join the next one.');
    if (!g && you < 0) return drawEmojis();
    if (!g) {
      $('me').textContent = `${seats[you].emoji} ${seats[you].name}, you're in!`;
      $('pstart').disabled = !data.ready;
      if (local) $('wslots').textContent = ''; else drawSlots($('wslots'), seats, data.size, data.cpus);
      $('pstart').textContent = data.ready ? `Show board (${data.size} players)` : waitingText(seats.length, data.size, data.cpus);
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
      : !mine ? (duo ? 'Waiting for your turn' : 'Watch the TV') : problem || (wall ? 'Tap Place wall, or tap another spot' : ori ? 'Tap the board where the wall goes' : 'Tap a purple tile, or pick a wall');
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
    if (duo) g.players.forEach((o,i) => { if (i !== you) $('walls').appendChild(el('div', '', `${o.emoji} ${o.name}: ${Rules.away(g,i)} away · 🧱 ${o.left} left`)); });
    $('pend').hidden = !local;
    $('pcode').textContent = duo ? `Game code ${code}` : '';
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
  for (const [id, action] of [['pprev','prev'], ['ppp','playpause'], ['pnext','next']]) $(id).onclick = () => send({ type: 'mc', action });
  $('tuneform').onsubmit = e => { e.preventDefault(); send({ type: 'music', url: $('tune').value }); };
  $('join').onsubmit = e => { e.preventDefault(); if (!pick) return note('Pick an emoji'); if (!tint) return note('Pick a color'); send({ type: 'join', name: $('name').value, emoji: pick, color: tint }); };
  $('pstart').onclick = () => send({ type: 'start' });
  $('leave').onclick = () => send({ type: 'leave' });
  $('pgo').onclick = () => send({ type: 'go' });
  $('pagain').onclick = () => send({ type: 'again' });
  $('pend').onclick = () => confirm('End this game?') && send({ type: 'end' });
  $('place').onclick = () => wall && send({ type: 'act', action: { kind: 'wall', ...wall } });
  $('cancel').onclick = () => { ori = null; setWall(null); };
  connect();
}

const query = new URLSearchParams(location.search);
const code = query.get('room');
const clean = c => c.toUpperCase().replace(/[^A-Z0-9]/g,'');
if (query.get('watch')) startWatch(clean(query.get('watch')));
else if (code) startPhone(clean(code));
else if (query.get('duo') === 'host') startTV(true);
else if (/Mobi|iPhone|iPod/.test(navigator.userAgent)) { // phones choose how to play
  document.body.className = 'phone';
  $('menu').hidden = false;
  $('mduo').onclick = () => { location.href = location.href.split(/[?#]/)[0] + '?duo=host'; };
  $('mtv').onclick = () => { $('menu').hidden = true; startTV(); };
  $('mwatch').onclick = () => $('mcode').value.trim() ? goWatch($('mcode').value) : $('mcode').focus();
  $('mjoin').onsubmit = e => { e.preventDefault(); location.href = location.href.split(/[?#]/)[0] + '?room=' + encodeURIComponent($('mcode').value.trim().toUpperCase()); };
} else startTV();
