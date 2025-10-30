import type { PlasmoCSConfig } from "plasmo"
import { CLICK_MESSAGE_TYPE } from "~constants"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

type AudioContextConstructor = typeof AudioContext

let audioContext: AudioContext | undefined

const getAudioContext = () => {
  if (typeof window === "undefined") {
    return undefined
  }

  const ContextCtor: AudioContextConstructor | undefined =
    window.AudioContext ?? window.webkitAudioContext
  if (!ContextCtor) {
    return undefined
  }

  if (!audioContext) {
    audioContext = new ContextCtor()
  }

  return audioContext
}

const playBeep = () => {
  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined)
  }

  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = "sine"
  oscillator.frequency.value = 880

  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.2)

  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
  }
}

const handleClickableClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }

  if (!event.isTrusted || event.button !== 0) {
    return
  }

  const clickable = target.closest("a, button")
  if (!clickable) {
    return
  }

  playBeep()

  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    return
  }

  chrome.runtime.sendMessage({ type: CLICK_MESSAGE_TYPE }, () => {
    void chrome.runtime.lastError
  })
}

const registerClickTracking = () => {
  document.addEventListener("click", handleClickableClick, true)
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
    yextensionClickListenerRegistered?: boolean
  }
}

if (typeof window !== "undefined" && !window.yextensionClickListenerRegistered) {
  window.yextensionClickListenerRegistered = true
  registerClickTracking()
}