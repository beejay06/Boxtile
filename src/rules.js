// Trophy-race rules shared by the TV and the phones.
const Rules = (() => {
  const SQD = [[-1,0],[0,1],[1,0],[0,-1]], HXD = [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
  const SPREAD = [[2,8],[4,10],[8,10],[10,8],[10,4],[8,2],[4,2],[2,4]];           // 13x13 coordinates
  const STARS = [[0,5],[3,8],[5,8],[8,5],[8,3],[5,0],[3,0],[0,3]];                // 9x9
  const HEX6 = [[3,2],[-2,5],[-5,3],[-3,-2],[2,-5],[5,-3]], HEX4 = [[5,-2],[3,2],[-5,2],[-3,-2]];
  const geo = board => board === 'hex' ? { hex: true, D: HXD, C: [0,0] }
    : { hex: false, N: +board, D: SQD, C: [(+board-1)/2, (+board-1)/2] };
  const inb = (G,a,b) => G.hex ? Math.max(Math.abs(a),Math.abs(b),Math.abs(a+b)) <= 5 : a >= 0 && a < G.N && b >= 0 && b < G.N;
  function cells(G) {
    const out = [], lo = G.hex ? -5 : 0, hi = G.hex ? 5 : G.N-1;
    for (let a = lo; a <= hi; a++) for (let b = lo; b <= hi; b++) if (inb(G,a,b)) out.push([a,b]);
    return out;
  }
  const goal = (G,a,b) => a === G.C[0] && b === G.C[1];
  const ek = (a,b) => [a+'', b+''].sort().join('|');
  function edges(G,x) {
    const { r, c } = x;
    if (G.hex) return [x.d, (x.d+1)%6].map(d => [[r,c], [r+G.D[d][0], c+G.D[d][1]], d]);
    return x.o === 'h' ? [[[r,c],[r+1,c]], [[r,c+1],[r+1,c+1]]] : [[[r,c],[r,c+1]], [[r+1,c],[r+1,c+1]]];
  }
  const blocked = (G,walls) => new Set(walls.flatMap(x => edges(G,x).map(e => ek(e[0],e[1]))));
  const open = (G,B,a,b,d) => { const x = a+G.D[d][0], y = b+G.D[d][1]; return inb(G,x,y) && !B.has(ek([a,b],[x,y])); };
  function dist(G,B,pos) {
    const q = [[...pos,0]], seen = new Set([pos+'']);
    while (q.length) {
      const [a,b,n] = q.shift();
      if (goal(G,a,b)) return n;
      for (let d = 0; d < G.D.length; d++) {
        const x = a+G.D[d][0], y = b+G.D[d][1];
        if (!seen.has([x,y]+'') && open(G,B,a,b,d)) { seen.add([x,y]+''); q.push([x,y,n+1]); }
      }
    }
    return -1;
  }
  function moves(s,i) {
    const G = geo(s.board), B = blocked(G,s.walls), [r,c] = s.players[i].pos, L = G.D.length, out = [];
    const taken = (a,b) => s.players.some(p => p.pos[0] === a && p.pos[1] === b);
    const add = (a,b) => { if (!taken(a,b) && !out.some(m => m[0] === a && m[1] === b)) out.push([a,b]); };
    for (let d = 0; d < L; d++) {
      if (!open(G,B,r,c,d)) continue;
      const a = r+G.D[d][0], b = c+G.D[d][1];
      if (!taken(a,b)) { add(a,b); continue; }
      const x = a+G.D[d][0], y = b+G.D[d][1];
      if (open(G,B,a,b,d) && !taken(x,y)) { add(x,y); continue; }
      for (const e of [(d+1)%L, (d+L-1)%L]) if (open(G,B,a,b,e)) add(a+G.D[e][0], b+G.D[e][1]);
    }
    return out;
  }
  function wallError(s,x) {
    const G = geo(s.board);
    if (!x || !Number.isInteger(x.r) || !Number.isInteger(x.c)) return 'Off the board';
    if (G.hex ? !(Number.isInteger(x.d) && x.d >= 0 && x.d < 6 && inb(G,x.r,x.c))
      : !((x.o === 'h' || x.o === 'v') && x.r >= 0 && x.c >= 0 && x.r < G.N-1 && x.c < G.N-1)) return 'Off the board';
    const es = edges(G,x), B = blocked(G,s.walls);
    if (es.some(e => !inb(G,...e[0]) || !inb(G,...e[1]))) return "A wall can't go on the outer edge";
    if (es.some(e => B.has(ek(e[0],e[1]))) || (!G.hex && s.walls.some(o => o.r === x.r && o.c === x.c))) return 'Overlaps another wall';
    const n = blocked(G,[...s.walls,x]);
    return s.players.some(p => dist(G,n,p.pos) < 0) ? 'That would cut a player off from the trophy' : null;
  }
  function allWalls(s) {
    const G = geo(s.board);
    if (G.hex) return cells(G).flatMap(([r,c]) => [0,1,2,3,4,5].map(d => ({ r, c, d })));
    const out = [];
    for (let r = 0; r < G.N-1; r++) for (let c = 0; c < G.N-1; c++) out.push({ r,c,o:'h' }, { r,c,o:'v' });
    return out;
  }
  const counts = board => board === 'hex' ? [2,4,5,6] : [2,4,5,6,8];
  const shuffle = a => { for (let i = a.length-1; i > 0; i--) { const j = Math.random()*(i+1)|0; [a[i],a[j]] = [a[j],a[i]]; } return a; };
  function spots(board, layout, n) {
    const star = board === '9' && layout === 'star', hex = board === 'hex';
    if (!star && n === 2) return hex ? [[2,-4],[-2,4]] : [[0,(+board-1)/2],[+board-1,(+board-1)/2]];
    if (hex && n === 4) return HEX4;
    const table = hex ? HEX6 : star ? STARS : SPREAD.map(p => p.map(z => z - (13 - +board)/2));
    const L = table.length, k = Math.random()*L|0;
    const seats = n === 2 ? [0,4] : n === 4 ? [0,2,4,6].map(i => i + k%2) : shuffle([...Array(L).keys()]).slice(0,n);
    return seats.sort((a,b) => a-b).map(i => table[i]);
  }
  function newGame(list, board, layout) { // list: [{name, emoji, cpu, id}] in joining order
    const n = list.length;
    if (!['9','13','hex'].includes(board) || !counts(board).includes(n)) return null;
    const walls = n === 2 ? 10 : n === 4 ? 5 : board === '9' ? 3 : 4;
    const places = spots(board, layout, n), order = shuffle([...list]);
    const s = { board, stock: walls, players: order.map((p,i) => ({ ...p, home: [...places[i]] })) };
    return restart(s);
  }
  function restart(s) {
    s.players.forEach(p => { p.pos = [...p.home]; p.left = s.stock; });
    Object.assign(s, { walls: [], turn: Math.random()*s.players.length|0, win: null, live: false });
    return s;
  }
  function advance(s) {
    for (let k = 0; k < s.players.length; k++) {
      s.turn = (s.turn+1) % s.players.length;
      if (moves(s,s.turn).length || (s.players[s.turn].left && allWalls(s).some(w => !wallError(s,w)))) return;
    }
  }
  function act(s,i,a) { // error text, or null when applied
    if (!s.live || s.win !== null || i !== s.turn || !a) return 'Not your turn';
    const p = s.players[i], G = geo(s.board);
    if (a.kind === 'move') {
      if (!moves(s,i).some(m => m[0] === a.r && m[1] === a.c)) return 'Illegal move';
      p.pos = [a.r,a.c];
      if (goal(G,a.r,a.c)) { s.win = i; return null; }
    } else if (a.kind === 'wall') {
      if (p.left < 1) return 'No walls left';
      const w = G.hex ? { r: a.r, c: a.c, d: a.d } : { r: a.r, c: a.c, o: a.o }, e = wallError(s,w);
      if (e) return e;
      s.walls.push({ ...w, by: i }); p.left--;
    } else return 'Unknown action';
    advance(s);
    return null;
  }
  function bot(s) {
    const i = s.turn, me = s.players[i], G = geo(s.board), B = blocked(G,s.walls), m = moves(s,i);
    const mv = p => ({ kind: 'move', r: p[0], c: p[1] });
    const top = m.find(p => goal(G,...p));
    if (top) return mv(top);
    const lead = s.players.filter(p => p !== me).sort((a,b) => dist(G,B,a.pos) - dist(G,B,b.pos))[0], ld = dist(G,B,lead.pos);
    if (me.left && (ld <= 3 || !m.length)) {
      let best = null, gain = 0;
      for (const x of allWalls(s)) {
        if (Math.abs(x.r-lead.pos[0]) > 3 || Math.abs(x.c-lead.pos[1]) > 3 || wallError(s,x)) continue;
        const n = blocked(G,[...s.walls,x]), v = dist(G,n,lead.pos) - ld - (dist(G,n,me.pos) - dist(G,B,me.pos))*.5;
        if (v > gain) { gain = v; best = x; }
      }
      if (best) return { kind: 'wall', ...best };
    }
    if (!m.length) return { kind: 'wall', ...allWalls(s).find(x => !wallError(s,x)) };
    return mv(m.map(p => [dist(G,B,p) + Math.random()*.5, p]).sort((a,b) => a[0]-b[0])[0][1]);
  }
  return { geo, cells, goal, edges, moves, wallError, counts, newGame, restart, act, bot,
    away: (s,i) => dist(geo(s.board), blocked(geo(s.board),s.walls), s.players[i].pos) };
})();
if (typeof module !== 'undefined') module.exports = Rules;
