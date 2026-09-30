const IS_PRODUCTION = import.meta.env.PROD
const DEVTOOLS_DISABLED = import.meta.env.VITE_DISABLE_DEVTOOLS === 'true'

const SHOULD_PROTECT = IS_PRODUCTION || DEVTOOLS_DISABLED

function blockDevToolsKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.key.toUpperCase() === 'S') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'K') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }, { capture: true })
}

function blockContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, { capture: true })
}

function detectDevToolsDebugger() {
  let devToolsOpen = false

  function check() {
    const start = performance.now()
    debugger
    const end = performance.now()

    if (end - start > 100) {
      if (!devToolsOpen) {
        devToolsOpen = true
        handleDevToolsDetected()
      }
    } else {
      devToolsOpen = false
    }
  }

  setInterval(check, 2000)
}

function detectDevToolsResize() {
  const threshold = 160

  function check() {
    const widthDiff = window.outerWidth - window.innerWidth
    const heightDiff = window.outerHeight - window.innerHeight

    if (widthDiff > threshold || heightDiff > threshold) {
      handleDevToolsDetected()
    }
  }

  window.addEventListener('resize', check)
  check()
}

function clearConsole() {
  const noop = () => {}

  const _origConsole = { ...console }
  void _origConsole

  const methods = ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupEnd', 'groupCollapsed', 'time', 'timeEnd', 'timeLog', 'profile', 'profileEnd', 'assert', 'count', 'countReset']

  methods.forEach(method => {
    try {
      console[method] = noop
    } catch {}
  })

  setInterval(() => {
    try { console.clear() } catch {}
  }, 1000)
}

function blockDrag() {
  document.addEventListener('dragstart', (e) => {
    e.preventDefault()
    return false
  })

  document.addEventListener('drop', (e) => {
    e.preventDefault()
    return false
  })
}

function blockTextSelection() {
  const style = document.createElement('style')
  style.textContent = `
    * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    input, textarea, [contenteditable="true"] {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `
  document.head.appendChild(style)
}

function handleDevToolsDetected() {
  try {
    document.title = '⚠ Acesso restrito'
  } catch {}
}

export function initAntiDevTools() {
  if (!SHOULD_PROTECT) {
    console.log('[Security] Anti-DevTools desativado no modo desenvolvimento')
    return
  }

  blockDevToolsKeys()
  blockContextMenu()
  blockDrag()
  blockTextSelection()
  clearConsole()

  if (IS_PRODUCTION) {
    detectDevToolsDebugger()
    detectDevToolsResize()
  }
}
