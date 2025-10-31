import type { PlasmoCSConfig } from "plasmo"

import { Storage } from "@plasmohq/storage"

import { CLICK_ENABLE_BEEP, CLICK_MESSAGE_TYPE } from "@/constants"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}
let beepEnabled = true
const storage = new Storage({ area: "local" })
const syncBeepSetting = async () => {
  beepEnabled = (await storage.get<boolean>(CLICK_ENABLE_BEEP)) ?? true
}

void syncBeepSetting()

if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
      return
    }

    const change = changes[CLICK_ENABLE_BEEP]
    if (!change) {
      return
    }

    beepEnabled = (change.newValue as boolean) ?? true
  })
}
type AudioContextConstructor = typeof AudioContext
let audioContext: AudioContext | undefined

function handleJumpscare() {
  if (Math.random() < 0.5) {
    if (beepEnabled) {
      playBeep(2000, "square")
    }
  }
}

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

export const playBeep = (frequency = 880, type: OscillatorType = "sine") => {
  const ctx = getAudioContext()
  if (!ctx) {
    return
  }

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined)
  }
  if (!beepEnabled) {
    return
  }
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.value = frequency

  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18)

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.2)

  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
  }
  handleJumpscare()
}
const handleClickableClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }
  if (!event.isTrusted || event.button !== 0) {
    return
  }

  const clickable = target.closest(
    "a, button, [role='button'], [onclick], input[type='button'], input[type='submit'], summary"
  )
  if (!clickable) {
    return
  }
  if (beepEnabled) {
    playBeep()
  }

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

if (
  typeof window !== "undefined" &&
  !window.yextensionClickListenerRegistered
) {
  window.yextensionClickListenerRegistered = true
  registerClickTracking()
}
