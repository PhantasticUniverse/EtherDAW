# /build - Build the project

Compile TypeScript and build browser bundle.

## Commands

```bash
# Build TypeScript for Node.js
npm run build

# Build browser bundle
npm run build:browser

# Build both
npm run build && npm run build:browser
```

## What Gets Built

### TypeScript Build (`npm run build`)
- Compiles `src/**/*.ts` to `dist/**/*.js`
- Generates type declarations (`.d.ts` files)
- Copies JSON schema to dist

### Browser Build (`npm run build:browser`)
- Bundles `src/browser/index.ts` using esbuild
- Creates `dist/etherdaw-browser.js` (~78KB)
- Excludes Tone.js (loaded externally in browser)

## Expected Output

```
# TypeScript build
(no errors = success)

# Browser build
dist/etherdaw-browser.js  78.0kb
```

## After Building

1. Verify no TypeScript errors
2. Test in player.html: `open player.html`
3. Check browser console for load errors
