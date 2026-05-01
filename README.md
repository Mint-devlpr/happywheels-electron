# Happy Wheels

A desktop wrapper for the Happy Wheels HTML5 edition, built with Electron. Play the classic browser game natively on Windows, Mac, and Linux — no browser required, no Flash, no browser extensions.

> Original game by Jim Bonacci / [Total Jerk Face](https://totaljerkface.com). This project is an unofficial desktop port of the HTML5 version.

---

## Downloads

Grab the latest build from the [Releases](../../releases) page:

| Platform | File | Notes |
|---|---|---|
| Windows | `Happy Wheels-x.x.x.exe` | Portable — just run it, no install needed |
| Linux (Debian/Ubuntu) | `happy-wheels-electron_x.x.x_amd64.deb` | Install via `dpkg -i` or your package manager |
| Linux (Arch/universal) | `Happy Wheels-x.x.x.AppImage` | `chmod +x` then run — works on any distro |
| macOS | `Happy Wheels-x.x.x.dmg` | Mount and drag to Applications |

---

## Controls

### Keyboard

| Key | Action |
|---|---|
| Arrow keys or WASD | Move |
| Space | Jump / action (character-dependent) |
| Shift | Boost (character-dependent) |
| Ctrl | Character-specific action |
| Z | Eject from vehicle |
| Q / E | Character-specific actions |
| Tab or Escape | Open / close menu |

### Gamepad / Controller

Any standard XInput or DirectInput controller works — no extra software needed.

| Input | Action |
|---|---|
| Left stick | Move (analog PWM — light touch = tap, full push = hold) |
| D-pad | Move (digital) |
| A | Jump / action (Space) |
| B | Eject (Z) |
| X | Ctrl |
| Y | Shift |
| LB | Q |
| RB | E |
| Select | Escape |
| Start | Open menu (Tab) |
| Right stick | Move mouse cursor |
| Left trigger | Left click |
| Right trigger | Right click |

> Nintendo layout (B=confirm, A=back) can be enabled in Settings → Swap A/B.

---

## Settings

A settings window opens before the game on each launch. All settings are saved between sessions.

| Setting | Default | Description |
|---|---|---|
| Resolution | 1280×800 | Sets the game window size |
| Fullscreen | Off | Runs the game fullscreen |
| Always on Top | Off | Keeps the window above other apps |
| FPS Cap | 60 fps | 60 = normal speed. 30 = slow motion |
| GPU Acceleration | On | Disable if the game crashes on launch |
| Gamepad Deadzone | 15% | Filters out stick drift |
| Swap A / B | Off | Nintendo button layout |
| Skip this screen | Off | Goes straight to game on next launch |

---

## Running from Source

### Prerequisites

- [Node.js](https://nodejs.org) 18 or later
- npm (comes with Node.js)
- Git

### Steps

```bash
# Clone the repo
git clone https://github.com/speedybebop1/happy-wheels-electron
cd happy-wheels-electron

# Install dependencies
npm install

# Launch the app
npm start
```

The settings window will appear first. Configure as needed and click Launch.

---

## Building Your Own Release

### Linux (native)

Linux builds work directly on any Linux machine with Node.js installed:

```bash
npm run dist:linux
```

This produces two files in `dist/`:
- `happy-wheels-electron_x.x.x_amd64.deb` — for Debian/Ubuntu-based distros, install with `sudo dpkg -i filename.deb`
- `Happy Wheels-x.x.x.AppImage` — portable, runs on any distro. Make it executable first: `chmod +x "Happy Wheels-x.x.x.AppImage"`

### Windows

Windows builds can be produced on Linux using Wine, or natively on a Windows machine.

**On Linux with Wine:**
```bash
# Install Wine (Arch)
sudo pacman -S wine

# Install wine-gecko and wine-mono if prompted
npm run dist:win
```

**On Windows natively:**
```bash
npm run dist:win
```

Output: `dist/Happy Wheels-x.x.x.exe` — a single portable executable, no installer needed.

### macOS

macOS builds must be produced on a Mac (code signing and `.dmg` packaging require macOS tooling):

```bash
npm run dist:mac
```

Output: `dist/Happy Wheels-x.x.x.dmg` — mount and drag to Applications.

---

## Publishing a Release (GitHub)

### Using the release script

The included `release.sh` script builds Linux and Windows locally, commits, tags, pushes, and creates a GitHub release in one step:

```bash
./release.sh 2.0.0
```

Requirements:
- [`gh`](https://cli.github.com) installed and authenticated (`gh auth login`)
- Git remote set to your fork
- Wine installed (for the Windows build on Linux)

The macOS build is handled automatically by GitHub Actions after the tag is pushed — it will appear on the release once the Actions run finishes.

### Manual release via GitHub Actions

If you don't want to build locally, you can trigger a full cross-platform build just by pushing a version tag:

```bash
git add -A
git commit -m "Release v2.0.0"
git tag v2.0.0
git push origin main
git push origin v2.0.0
```

GitHub Actions will build on native Ubuntu, Windows, and macOS runners and upload all artifacts to the release automatically. See [`.github/workflows/release.yml`](.github/workflows/release.yml) for the workflow definition.

### Updating the version number

Before tagging a release, update the version in `package.json`:

```json
{
  "version": "2.0.0"
}
```

The auto-update checker uses this value to compare against the latest GitHub release tag.

---

## Project Structure

```
happy-wheels-electron/
├── main.js               # Electron main process — settings window, game window, update check
├── preload.js            # Runs in the game renderer: key remapping, gamepad polling, virtual mouse
├── hwjs.html             # Game entry point — loads PIXI.js scripts, loading screen, HW_SETTINGS
├── settings.html         # Settings launcher UI
├── holder.html           # Required stub for the game's internal asset loader
├── package.json          # Project metadata and electron-builder config
├── CHANGELOG.md          # Full version history
├── build/
│   ├── icon.png          # App icon — Linux (512×512)
│   ├── icon.ico          # App icon — Windows (multi-size)
│   └── icon.icns         # App icon — macOS
├── js/
│   ├── dependencies.*.js # Minified PIXI.js and game dependencies
│   └── index.*.js        # Minified game logic
├── assets/               # Game assets (sprites, audio, animations, fonts)
│   └── freeze frame.png  # Loading screen background image
└── .github/
    └── workflows/
        └── release.yml   # CI/CD — builds and publishes on version tags
```

### Key files explained

**`main.js`** — The Electron main process. Reads saved settings from `userData/hw_settings.json`, opens the settings window or jumps straight to the game if skipSettings is enabled. Passes settings to the game window via `additionalArguments`. Checks GitHub for updates after the settings window loads.

**`preload.js`** — Injected into the game renderer before the page loads. Handles all input translation: remaps WASD/ESC keyboard events, polls the Gamepad API every frame for stick/button/trigger input, and manages the virtual mouse cursor overlay. Reads settings from the `--hw-settings=` command-line argument.

**`hwjs.html`** — The game page. Builds the `HW_SETTINGS` object from `window.HW_LAUNCH` (set by preload.js), loads the game scripts dynamically, and shows the loading overlay until the PIXI stage is ready.

**`settings.html`** — Pure HTML/CSS/JS settings UI using Electron IPC. Receives saved settings via `ipcRenderer.on('load-settings')` and sends the collected values back via `ipcRenderer.send('launch', settings)` when the Launch button is clicked.

---

## Troubleshooting

**Game crashes immediately on launch**
Turn off GPU Acceleration in Settings. On Linux with Wayland this is the most common cause.

**Game is running at half speed**
Make sure FPS is set to 60. The game engine runs natively at 60fps — 30fps runs physics at half speed intentionally.

**Controller not working**
Plug in the controller before launching the app. The Gamepad API only detects controllers that were connected when a button is first pressed — press any button after launching and it should activate.

**Settings window doesn't open / game goes straight to black screen**
Your saved settings have `skipSettings: true`. Delete `hw_settings.json` from your app data folder to reset:
- Windows: `%APPDATA%\happy-wheels-electron\`
- Linux: `~/.config/happy-wheels-electron/`
- macOS: `~/Library/Application Support/happy-wheels-electron/`

---

## Credits

Based on the Happy Wheels HTML5 source by [MrSnailman](https://github.com/MrSnailman/Happy-Wheels-Source-Code). Original game by Jim Bonacci / [Total Jerk Face](https://totaljerkface.com).
