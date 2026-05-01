# Changelog

## v2.0.0 — 2026-05-01

### Settings Launcher

A settings window now opens before the game, letting you configure everything without editing files. Settings are saved to disk and restored on next launch. A "Skip this screen next time" checkbox lets you go straight into the game once you have everything configured.

**Display**
- Resolution: 1280×720, 1280×800 (default), 1920×1080, 2560×1440, 3840×2160
- Fullscreen toggle
- Always on Top toggle — keeps the window above other apps

**Performance**
- FPS Cap: 30 fps (slow motion) or 60 fps (normal speed). The game engine runs natively at 60fps; 30fps runs physics at half speed.
- GPU Acceleration toggle — disables hardware rendering via `--disable-gpu`. Useful if the game crashes on launch, especially on Linux with Wayland/Vulkan conflicts.

**Controls**
- Gamepad Deadzone slider (0–50%, default 15%) — filters out stick drift
- Swap A / B Buttons — switches A and B to Nintendo layout (B = confirm, A = back)

---

### Keyboard Remapping

Key remapping is now handled in `preload.js` via a capture-phase event listener that intercepts the original keydown/keyup events and re-dispatches translated ones, so the game engine never sees the original key.

| Physical Key | Game Receives | Notes |
|---|---|---|
| W / w | Arrow Up | |
| A / a | Arrow Left | |
| S / s | Arrow Down | |
| D / d | Arrow Right | |
| Escape | Tab | Opens the in-game menu. Escape is intentionally NOT forwarded — sending Escape would toggle the pause state on top of opening the menu, causing the level to stay frozen. |

---

### Gamepad / Controller Support

Controller input is polled via the browser Gamepad API using `requestAnimationFrame`. No additional software or drivers are needed — any standard XInput or DirectInput controller works.

**Left Stick → Arrow Keys (PWM analog simulation)**

The analog stick value is normalized using a configurable deadzone. Instead of a simple on/off, a PWM (pulse-width modulation) approach is used: at low deflection the key rapidly fires and releases each frame at a duty cycle proportional to the stick magnitude. At ≥90% deflection the key is held continuously. This gives the game a sense of analog input without modifying the engine.

| Deflection | Behaviour |
|---|---|
| Below deadzone | No input |
| Deadzone – 90% | Key pulses on/off each frame, duty cycle = magnitude |
| 90% – 100% | Key held continuously |

**D-Pad → Arrow Keys**

D-pad (buttons 12–15) maps directly to arrow keys with no PWM — it's a digital input.

**Face Buttons**

| Button | Key Sent | In-Game Action |
|---|---|---|
| A (button 0, or 1 with swap) | Space | Jump / action (character-dependent) |
| B (button 1, or 0 with swap) | Z | Eject from vehicle |
| X (button 2) | Ctrl | Character-specific action |
| Y (button 3) | Shift | Boost / character-specific action |

**Shoulder Buttons**

| Button | Key Sent | In-Game Action |
|---|---|---|
| LB (button 4) | Q | |
| RB (button 5) | E | |

**System Buttons**

| Button | Key Sent | In-Game Action |
|---|---|---|
| Select (button 8) | Escape | |
| Start (button 9) | Tab | Open/close menu |

**Triggers → Mouse Clicks**

| Trigger | Action |
|---|---|
| Left Trigger (button 6) | Left mouse click (pointerdown → pointerup → click) |
| Right Trigger (button 7) | Right mouse click (pointerdown → pointerup) |

**Right Stick → Virtual Mouse Cursor**

The right stick (axes 2 and 3) moves a virtual mouse cursor overlaid on the game window. Movement speed is 12px per frame at full deflection, scaled by the normalized stick value. The cursor is a white semi-transparent dot (14×14px) that appears when the stick is active and hides when it returns to center. Pointer and mouse events are dispatched to whichever element is under the cursor via `document.elementFromPoint()`.

---

### Loading Screen

The default loading bar has been replaced with a full-screen freeze-frame intro using `assets/freeze frame.png`, displayed in greyscale with a pulsing "please wait while we load..." text. Once the PIXI stage has children (main menu is ready), the overlay waits an additional 5 seconds then fades out over 1 second and removes itself from the DOM. A 10-second fallback clears the overlay regardless.

Random splash text is shown in the title — over 50 lines including puns, commentary, and game references. The list lives in `hwjs.html` inside `getTitleLabel()`.

---

### Auto-Update Check

On launch, the settings window queries the GitHub Releases API (`api.github.com/repos/speedybebop1/happy-wheels-electron/releases/latest`) and compares the latest tag against the current `package.json` version. If a newer version exists, a dialog asks if you want to open the download page. Network errors are silently ignored.

---

### App Icon

All three platform icon formats are generated from `build/logoiwant.jpg` (the official Happy Wheels logo):

| File | Platform |
|---|---|
| `build/icon.ico` | Windows (16, 24, 32, 48, 64, 128, 256px multi-size) |
| `build/icon.icns` | macOS |
| `build/icon.png` | Linux (512×512) |

---

### Bug Fixes

- **Level frozen after loading** — root cause was `fps: 9999` (previously used for "uncapped") which broke the game's physics timestep. Fixed by removing the uncapped option entirely.
- **9fps performance on Linux** — caused by two compounding issues: DevTools being force-opened (stealing rendering budget) and a Wayland/Vulkan conflict when `ozone-platform=x11` was set. Fixed by removing `openDevTools()` and all custom GPU command-line switches.
- **ESC key freezing the level** — sending Escape via the keymap caused the game to toggle its pause state on top of the Tab (menu open), leaving the level in a permanently paused state. Fixed by removing Escape from the dispatch: ESC now only sends Tab.
- **Removed Bitcoin/cryptocurrency references** — `assets/image/perfectCookie.png` (a Bitcoin coin graphic) removed along with all references to it.

---

## v1.0.0 — Initial Release

- Basic Electron wrapper around the Happy Wheels HTML5 port
- Single game window, no settings UI, no controller support
