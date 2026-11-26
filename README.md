# Boxtile

A wall-placing race to the trophy. The TV shows the board; players move from their phones.

## Play
1. Open `index.html` from a web host (such as GitHub Pages) on a laptop connected to the TV.
2. On the TV page, pick the board, starting layout and number of computer players.
3. Each player scans the QR code, enters a screen name, picks an emoji and joins.
4. Tap **Show board**, then **Start game**.

## Rules
- First to reach the trophy wins.
- On your turn, move one tile or place one wall.
- Jump over a neighbouring player; step around them if the jump is blocked.
- A wall can never cut a player off from the trophy.
- Boards: 9x9, 13x13 (2, 4, 5, 6 or 8 players) and honeycomb (2, 4, 5 or 6).

## Notes
- Needs internet. Devices connect through the free public PeerJS service.
- Keep the TV tab open and the computer awake; it runs the game.
- Bundles PeerJS and qrcode-generator (both MIT licensed).
- Source is in `src/`; `index.html` is the built single-file game.
