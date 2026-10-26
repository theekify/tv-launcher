import { useEffect } from 'react'

const KEY_MAP = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  Enter: 'SELECT',
  Backspace: 'BACK',
  Escape: 'QUIT',
  Home: 'HOME',
  s: 'SETTINGS',
  S: 'SETTINGS',
  '/': 'FIND',
  f: 'FIND',
  F: 'FIND',
}

export function useInput(onAction) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return

      const action = KEY_MAP[e.key]
      if (!action) return
      e.preventDefault()
      onAction(action)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onAction])
}
