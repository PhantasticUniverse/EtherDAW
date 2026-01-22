# /play - Open the player in browser

Open player.html in the default browser for testing compositions.

## Usage

Simply run this command to open the player:

```bash
open player.html
```

## Notes

- On macOS: Uses `open` command
- On Windows: Would use `start` command
- On Linux: Would use `xdg-open` command

## Before Playing

If you've made changes to the TypeScript source:

```bash
npm run build:browser
```

This rebuilds the browser bundle that player.html imports.

## Testing Workflow

1. Run `/play` to open the player
2. Select a composition from the dropdown
3. Click Play to start playback
4. Use browser console (F12) to check for errors
5. Test MIDI and WAV export buttons

## Troubleshooting

- **No sound**: Click anywhere on the page first (browser audio policy)
- **Old code**: Run `npm run build:browser` to update
- **Console errors**: Check that all patterns and instruments exist
