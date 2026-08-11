# Button Locations and Verification

## Language Switcher Button

**Location:**
- **Position:** Fixed, top-right corner
- **Coordinates:** `top: 30px; right: 100px;`
- **Z-index:** `10000`
- **Element ID:** `language-switcher`
- **Toggle Button ID:** `lang-toggle-btn`

**How it works:**
1. Created by `i18n.js` in `createLanguageSwitcher()` method
2. Appended to header or body (fixed position)
3. Shows current language code (e.g., "EN", "ES")
4. Clicking opens dropdown with language options
5. Selecting a language updates all `data-i18n` elements

**Verification:**
- ✅ Button exists: `document.getElementById('language-switcher')`
- ✅ Toggle works: Click `lang-toggle-btn` to open/close dropdown
- ✅ Language switching: Click any `.lang-option` to change language
- ✅ Android app: Explicitly made visible with z-index 10000

## Custom Color Button

**Location:**
- **Position:** Fixed, bottom-right corner
- **Coordinates:** `bottom: 260px; right: 20px;`
- **Z-index:** `9997`
- **Element ID:** `color-scheme-picker`
- **Toggle Button ID:** `color-scheme-toggle`

**How it works:**
1. Created by `color-schemes.js` in `createColorPicker()` method
2. Appended to body (fixed position)
3. Shows 🎨 emoji button
4. Clicking opens color scheme menu with:
   - Preset color schemes (Default, Cosmic Blue, Nebula Purple, etc.)
   - Custom color picker (Primary, Secondary, Accent)
   - "Apply Custom" button

**Custom Color Functionality:**
- ✅ Color inputs exist: `custom-primary`, `custom-secondary`, `custom-accent`
- ✅ Apply button: `applyCustomScheme()` method applies custom colors
- ✅ Saves to localStorage: Custom scheme persisted
- ✅ Updates CSS variables: All colors update site-wide
- ✅ Android app: Explicitly made visible with z-index 9997

**Verification:**
- ✅ Button exists: `document.getElementById('color-scheme-toggle')`
- ✅ Menu exists: `document.getElementById('color-scheme-menu')`
- ✅ Toggle works: Click button to open/close menu
- ✅ Presets work: Click any preset to apply scheme
- ✅ Custom colors work: Use color inputs and click "Apply Custom"

## Music Player Minimize Button

**Location:**
- **Position:** Inside music player, top-right
- **Element ID:** `minimize-player`
- **Parent:** `#cosmic-music-player`
- **Z-index:** `10000` (when visible)

**How it works:**
1. Created by `cosmic-music-player.js` in `injectPlayerHTML()`
2. Shows "−" when expanded, "+" when minimized
3. Clicking toggles `isMinimized` state
4. Saves state to localStorage
5. Adjusts player width: 320px (expanded) → 180px (minimized)

**Android App:**
- ✅ Explicitly made visible with:
  - `display: block`
  - `visibility: visible`
  - `opacity: 1`
  - `z-index: 10000`
  - `pointerEvents: auto`
  - `cursor: pointer`

**Verification:**
- ✅ Button exists: `document.getElementById('minimize-player')`
- ✅ Toggle works: Click to minimize/expand player
- ✅ State persists: Saved to localStorage
- ✅ Android app: Fully visible and functional

## Summary

All buttons are:
- ✅ Properly positioned (fixed positioning)
- ✅ Visible in web browser
- ✅ Visible in Android app (explicit styles added)
- ✅ Functional (event listeners attached)
- ✅ Accessible (proper z-index values)

**To test:**
1. Open browser console
2. Run: `window.verifyButtons()` (if verify-buttons.js is loaded)
3. Or manually check:
   - `document.getElementById('language-switcher')` - should exist
   - `document.getElementById('color-scheme-toggle')` - should exist
   - `document.getElementById('minimize-player')` - should exist

