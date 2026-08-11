# Games Directory

This directory contains Flash game files (.swf) that can be played through the games page using the Ruffle Flash emulator.

## Files

- `games-manifest.json` - Auto-generated manifest file listing all available games
- `games-list.txt` - Simple text file listing all game filenames
- `*.swf` - Flash game files (1244+ games)

## Regenerating the Manifest

If you add or remove games, regenerate the manifest:

```bash
node generate-games-manifest.js
```

This will update `games-manifest.json` with the current list of games.

## How It Works

1. The games page (`games.html`) loads the manifest file
2. Games are displayed in a searchable grid
3. When a user clicks "Play", the game is loaded using Ruffle (Flash emulator)
4. Games run in a modal overlay with fullscreen support

## Notes

- Modern browsers don't support Flash natively
- Ruffle is used to emulate Flash games in the browser
- Games are loaded on-demand (only when selected)
- All games are stored locally in this directory

