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
  e.preventDefault()
  e.stopPropagation()
  const target = e.target || document
  target.dispatchEvent(new KeyboardEvent('keydown', {
    key: mapped.key, code: mapped.code, keyCode: mapped.keyCode,
    which: mapped.keyCode, bubbles: true, cancelable: true,
  }))
}, true)

window.addEventListener('keyup', (e) => {
  const mapped = keyMap[e.key]
  if (!mapped) return
  e.preventDefault()
  e.stopPropagation()
  const target = e.target || document
  target.dispatchEvent(new KeyboardEvent('keyup', {
    key: mapped.key, code: mapped.code, keyCode: mapped.keyCode,
    which: mapped.keyCode, bubbles: true, cancelable: true,
  }))
}, true)
