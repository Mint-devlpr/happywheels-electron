const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path  = require('path')
const fs    = require('fs')
const https = require('https')

const SETTINGS_FILE = path.join(app.getPath('userData'), 'hw_settings.json')
const CURRENT_VERSION = require('./package.json').version
const REPO = 'speedybebop1/happy-wheels-electron'

const DEFAULTS = {
  resolution: '1280x800', width: 1280, height: 800,
  fullscreen: false, alwaysOnTop: false,
  fps: 60, gpu: true,
  deadzone: 15, swapAB: false,
  skipSettings: false,
}

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) } }
  catch(e) { return { ...DEFAULTS } }
}

function saveSettings(s) {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)) } catch(e) {}
}

function checkForUpdates(win) {
  const url = `https://api.github.com/repos/${REPO}/releases/latest`
  const req = https.get(url, { headers: { 'User-Agent': 'happy-wheels-electron' } }, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
      try {
        const release = JSON.parse(data)
        const latest = release.tag_name.replace(/^v/, '')
        if (latest && latest !== CURRENT_VERSION) {
          dialog.showMessageBox(win, {
            type: 'question',
            title: 'Update Available',
            message: `Happy Wheels ${release.tag_name} is available`,
            detail: `You have v${CURRENT_VERSION}. Would you like to open the download page?`,
            buttons: ['Download', 'Later'],
            defaultId: 0,
          }).then(({ response }) => {
            if (response === 0) shell.openExternal(release.html_url)
          })
        }
      } catch(e) {}
    })
  })
  req.on('error', () => {}) // silently ignore network errors
}

let settingsWin = null
let gameWin     = null

function openSettings(saved) {
  settingsWin = new BrowserWindow({
    width: 360,
    height: 530,
    title: 'Happy Wheels',
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  settingsWin.loadFile('settings.html')
  settingsWin.setMenuBarVisibility(false)
  settingsWin.webContents.once('did-finish-load', () => {
    settingsWin.webContents.send('load-settings', saved)
    checkForUpdates(settingsWin)
  })
}

function openGame(settings) {
  if (settings.gpu && process.env.WAYLAND_DISPLAY) {
    app.commandLine.appendSwitch('ozone-platform', 'x11')
  } else if (!settings.gpu) {
    app.commandLine.appendSwitch('disable-gpu')
  }

  gameWin = new BrowserWindow({
    width:       settings.width  || 1280,
    height:      settings.height || 800,
    title:       'Happy Wheels',
    fullscreen:  !!settings.fullscreen,
    alwaysOnTop: !!settings.alwaysOnTop,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [`--hw-settings=${JSON.stringify(settings)}`],
    },
  })

  gameWin.loadFile('hwjs.html')
  gameWin.setMenuBarVisibility(false)
}

ipcMain.on('launch', (event, settings) => {
  saveSettings(settings)
  settingsWin.close()
  settingsWin = null
  openGame(settings)
})

app.whenReady().then(() => {
  const saved = loadSettings()
  if (saved.skipSettings) {
    openGame(saved)
  } else {
    openSettings(saved)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
