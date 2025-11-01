import { CLICK_ENABLE_BEEP, CLICK_MESSAGE_TYPE } from "@/constants"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

let jumpscareOverlay: HTMLDivElement | null = null
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}
let beepEnabled = true
let config_JumpScaresEnabled = false
const storage = new Storage({ area: "local" })
const syncBeepSetting = async () => {
  beepEnabled = (await storage.get<boolean>(CLICK_ENABLE_BEEP)) ?? true
}
const syncJumpscareSettings = async () => {
  config_JumpScaresEnabled =
    (await storage.get<boolean>("yextension:enable-jumpscare")) ?? false
}
void syncBeepSetting()
void syncJumpscareSettings()
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

const hideJumpscare = () => {
  if (!jumpscareOverlay) {
    return
  }
  const media = jumpscareOverlay.querySelectorAll("video, audio")
  media.forEach((m) => {
    if (m instanceof HTMLMediaElement) {
      m.pause()
      m.currentTime = 0
    }
  })
  jumpscareOverlay.remove()
  jumpscareOverlay = null
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined)
  }
}
type AudioContextConstructor = typeof AudioContext
let audioContext: AudioContext | undefined

const jumpscarePresets = [
  `
    <div class="yextension-jumpscare-backdrop fixed inset-0 bg-black flex justify-center items-center z-[2147483647] min-w-full min-h-full">
      <img class="yextension-jumpscare-video object-cover max-w-full max-h-full" src="https://media1.tenor.com/m/Gdr-CRylBZkAAAAd/karl-marx-marx-dance.gif" alt="jumpscare" />
    </div>
  `,
  `
    <div class="yextension-jumpscare-backdrop fixed inset-0 bg-black flex justify-center items-center z-[2147483647] min-w-full min-h-full">
      <video class="yextension-jumpscare-video object-cover max-w-full max-h-full" autoplay playsinline>
        <source src=${chrome.runtime.getURL("assets/video/flashbang.webm")} type="video/webm" />
      </video>
    </div>
  `
]

const requestFullscreen = (el: HTMLElement) =>
  el.requestFullscreen?.() ??
  Promise.reject(new Error("Fullscreen API unavailable"))
const showJumpscare = () => {
  if (jumpscareOverlay) {
    return
  }
  jumpscareOverlay = document.createElement("div")
  jumpscareOverlay.innerHTML = jumpscarePresets[
    Math.floor(Math.random() * jumpscarePresets.length)
  ]

  const backdrop = jumpscareOverlay.firstElementChild as HTMLDivElement
  backdrop.addEventListener("click", hideJumpscare)

  document.documentElement.appendChild(jumpscareOverlay)
  requestFullscreen(backdrop).catch(() => undefined)
}

function handleJumpscare() {
  if (Math.random() < 0.5) {
    if (beepEnabled) {
      playBeep(2000, "square")
    }
    if (config_JumpScaresEnabled) {
      showJumpscare()
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
