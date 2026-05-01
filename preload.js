// ── Load settings ─────────────────────────────────────────────────────────────

const _settingsArg = process.argv.find(a => a.startsWith('--hw-settings='))
const HW = _settingsArg ? JSON.parse(_settingsArg.slice(14)) : {}

const DEADZONE    = (HW.deadzone != null ? HW.deadzone : 15) / 100
const PWM_PERIOD  = 80
const HOLD_THRESH = 0.90
const SWAP_AB     = !!HW.swapAB

window.HW_LAUNCH = HW

// ── Keyboard remapping ────────────────────────────────────────────────────────

const keyMap = {
  Escape: { key: 'Tab',        code: 'Tab',        keyCode: 9  },
  w:      { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
  W:      { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
  a:      { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
  A:      { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
  s:      { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
  S:      { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
  d:      { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  D:      { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
}

window.addEventListener('keydown', (e) => {
  const mapped = keyMap[e.key]
  if (!mapped) return
  e.preventDefault(); e.stopPropagation()
  ;(e.target || document).dispatchEvent(new KeyboardEvent('keydown', {
    key: mapped.key, code: mapped.code, keyCode: mapped.keyCode,
    which: mapped.keyCode, bubbles: true, cancelable: true,
  }))
}, true)

window.addEventListener('keyup', (e) => {
  const mapped = keyMap[e.key]
  if (!mapped) return
  e.preventDefault(); e.stopPropagation()
  ;(e.target || document).dispatchEvent(new KeyboardEvent('keyup', {
    key: mapped.key, code: mapped.code, keyCode: mapped.keyCode,
    which: mapped.keyCode, bubbles: true, cancelable: true,
  }))
}, true)

// ── Gamepad ───────────────────────────────────────────────────────────────────

const BTN_A = SWAP_AB ? 1 : 0
const BTN_B = SWAP_AB ? 0 : 1

// Face / shoulder / system buttons → key info
const buttonKeys = {
  [BTN_A]: { key: ' ',       code: 'Space',      keyCode: 32 }, // A      → Space
  [BTN_B]: { key: 'z',       code: 'KeyZ',       keyCode: 90 }, // B      → eject
  2:       { key: 'Control', code: 'ControlLeft', keyCode: 17 }, // X      → Ctrl
  3:       { key: 'Shift',   code: 'ShiftLeft',   keyCode: 16 }, // Y      → Shift
  4:       { key: 'q',       code: 'KeyQ',        keyCode: 81 }, // LB     → Q
  5:       { key: 'e',       code: 'KeyE',        keyCode: 69 }, // RB     → E
  8:       { key: 'Escape',  code: 'Escape',      keyCode: 27 }, // Select → Esc
  9:       { key: 'Tab',     code: 'Tab',         keyCode:  9 }, // Start  → Tab (menu)
  12:      { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
  13:      { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
  14:      { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
  15:      { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
}

// Left stick axes → arrow keys (PWM)
const axisKeys = [
  { axis: 0, sign: -1, key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
  { axis: 0, sign:  1, key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  { axis: 1, sign: -1, key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
  { axis: 1, sign:  1, key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
]

// ── Virtual mouse cursor (right stick) ───────────────────────────────────────

const CURSOR_SPEED = 12 // px per frame at full deflection

let curX = window.innerWidth  / 2
let curY = window.innerHeight / 2

// Visible cursor dot
const cursorEl = document.createElement('div')
Object.assign(cursorEl.style, {
  position:     'fixed',
  width:        '14px',
  height:       '14px',
  borderRadius: '50%',
  background:   'rgba(255,255,255,0.85)',
  border:       '2px solid rgba(0,0,0,0.5)',
  pointerEvents: 'none',
  zIndex:       '99999',
  transform:    'translate(-50%,-50%)',
  display:      'none',
  transition:   'opacity 0.3s',
})
document.documentElement.appendChild(cursorEl)

function moveCursor(dx, dy) {
  curX = Math.max(0, Math.min(window.innerWidth,  curX + dx))
  curY = Math.max(0, Math.min(window.innerHeight, curY + dy))
  cursorEl.style.left = curX + 'px'
  cursorEl.style.top  = curY + 'px'
}

function dispatchPointer(type, button = 0) {
  const el = document.elementFromPoint(curX, curY) || document.body
  el.dispatchEvent(new PointerEvent(type, {
    clientX: curX, clientY: curY,
    screenX: curX, screenY: curY,
    button, buttons: button === 0 ? 1 : 2,
    bubbles: true, cancelable: true, isPrimary: true,
  }))
  // Also fire MouseEvent for compatibility
  el.dispatchEvent(new MouseEvent(
    type.replace('pointer', 'mouse'),
    { clientX: curX, clientY: curY, button, buttons: button === 0 ? 1 : 2, bubbles: true }
  ))
}

// Track trigger click state
const triggerHeld = { left: false, right: false }

// ── Shared key state ──────────────────────────────────────────────────────────

const heldKeys   = new Set()
const buttonHeld = new Set()
const pwmPhase   = {}

function fireKey(type, info) {
  window.dispatchEvent(new KeyboardEvent(type, {
    key: info.key, code: info.code, keyCode: info.keyCode,
    which: info.keyCode, bubbles: true, cancelable: true,
  }))
}

function setKey(info, pressed) {
  const k = info.key
  if (pressed && !heldKeys.has(k)) { heldKeys.add(k);    fireKey('keydown', info) }
  else if (!pressed && heldKeys.has(k)) { heldKeys.delete(k); fireKey('keyup',   info) }
}

function normalize(raw) {
  const abs = Math.abs(raw)
  if (abs < DEADZONE) return 0
  return (abs - DEADZONE) / (1 - DEADZONE)
}

// ── Poll loop ─────────────────────────────────────────────────────────────────

let cursorVisible = false

function pollGamepad(now) {
  let anyStick = false

  for (const gp of navigator.getGamepads()) {
    if (!gp || !gp.connected) continue

    // Left stick → PWM arrow keys
    for (const dir of axisKeys) {
      const raw = gp.axes[dir.axis] * dir.sign
      const mag = raw > 0 ? normalize(raw) : 0
      const k   = dir.key
      if (!pwmPhase[k]) pwmPhase[k] = now
      let pressed
      if (mag <= 0)            { pressed = false; pwmPhase[k] = now }
      else if (mag >= HOLD_THRESH) { pressed = true }
      else { pressed = ((now - pwmPhase[k]) % PWM_PERIOD) < mag * PWM_PERIOD }
      if (!buttonHeld.has(k)) setKey(dir, pressed)
    }

    // D-pad + face/shoulder/system buttons
    for (const [idx, info] of Object.entries(buttonKeys)) {
      const btn = gp.buttons[idx]
      if (!btn) continue
      const pressed = btn.pressed || btn.value > 0.5
      buttonHeld[pressed ? 'add' : 'delete'](info.key)
      setKey(info, pressed)
    }

    // Right stick → virtual mouse
    const rx = normalize(gp.axes[2] || 0) * Math.sign(gp.axes[2] || 0)
    const ry = normalize(gp.axes[3] || 0) * Math.sign(gp.axes[3] || 0)
    if (Math.abs(rx) > 0 || Math.abs(ry) > 0) {
      anyStick = true
      moveCursor(rx * CURSOR_SPEED, ry * CURSOR_SPEED)
      dispatchPointer('pointermove')
    }

    // Left trigger (button 6) → left click
    const lt = gp.buttons[6] ? (gp.buttons[6].pressed || gp.buttons[6].value > 0.5) : false
    if (lt && !triggerHeld.left) {
      triggerHeld.left = true
      dispatchPointer('pointerdown', 0)
    } else if (!lt && triggerHeld.left) {
      triggerHeld.left = false
      dispatchPointer('pointerup', 0)
      dispatchPointer('click', 0)
    }

    // Right trigger (button 7) → right click
    const rt = gp.buttons[7] ? (gp.buttons[7].pressed || gp.buttons[7].value > 0.5) : false
    if (rt && !triggerHeld.right) {
      triggerHeld.right = true
      dispatchPointer('pointerdown', 2)
    } else if (!rt && triggerHeld.right) {
      triggerHeld.right = false
      dispatchPointer('pointerup', 2)
    }
  }

  // Show/hide cursor dot based on right stick activity
  if (anyStick !== cursorVisible) {
    cursorVisible = anyStick
    cursorEl.style.display = anyStick ? 'block' : 'none'
  }

  requestAnimationFrame(pollGamepad)
}

window.addEventListener('gamepadconnected',    (e) => {
  console.log(`[gamepad] connected: ${e.gamepad.id}`)
  cursorEl.style.display = 'none'
  requestAnimationFrame(pollGamepad)
})
window.addEventListener('gamepaddisconnected', (e) => console.log(`[gamepad] disconnected: ${e.gamepad.id}`))
