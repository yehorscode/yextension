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
let enableImageReplace = false
let enableButtonhide = false
const storage = new Storage({ area: "local" })
const syncBeepSetting = async () => {
  beepEnabled = (await storage.get<boolean>(CLICK_ENABLE_BEEP)) ?? true
}
const syncJumpscareSettings = async () => {
  config_JumpScaresEnabled =
    (await storage.get<boolean>("yextension:enable-jumpscare")) ?? false
}
const syncImageReplaceSetting = async () => {
  enableImageReplace =
    (await storage.get<boolean>("yextension:enable-image-replace")) ?? false
}
const syncButtonHideSetting = async () => {
  enableButtonhide =
    (await storage.get<boolean>("yextension:enable-button-hide")) ?? false
}

;(async () => {
  await syncBeepSetting()
  await syncJumpscareSettings()
  await syncImageReplaceSetting()
  await syncButtonHideSetting()
  if (enableImageReplace) {
    placeSpookyImages()
    observeImageMutations()
  }
})()

function observeImageMutations() {
  const observer = new MutationObserver((mutations) => {
    let shouldReplace = false
    for (const mutation of mutations) {
      if (
        Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === 1 &&
            ((node as HTMLElement).tagName === "IMG" ||
              (node as HTMLElement).querySelector?.("img"))
        )
      ) {
        shouldReplace = true
        break
      }
    }
    if (shouldReplace && enableImageReplace) {
      placeSpookyImages()
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}
if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
      return
    }

    if (changes[CLICK_ENABLE_BEEP]) {
      beepEnabled = (changes[CLICK_ENABLE_BEEP].newValue as boolean) ?? true
    }

    if (changes["yextension:enable-jumpscare"]) {
      config_JumpScaresEnabled =
        (changes["yextension:enable-jumpscare"].newValue as boolean) ?? false
    }

    if (changes["yextension:enable-image-replace"]) {
      enableImageReplace =
        (changes["yextension:enable-image-replace"].newValue as boolean) ??
        false
    }

    if (changes["yextension:enable-button-hide"]) {
      enableButtonhide =
        (changes["yextension:enable-button-hide"].newValue as boolean) ?? false
    }
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
      <video class="yextension-jumpscare-video object-cover max-w-full max-h-full" autoplay playsinline>
        <source src=${chrome.runtime.getURL("assets/video/flashbang.webm")} type="video/webm" />
      </video>
    </div>
  `,
  `
  <div class="yextension-jumpscare-backdrop fixed inset-0 bg-black flex justify-center items-center z-[2147483647] min-w-full min-h-full">
      <video class="yextension-jumpscare-video object-cover max-w-full max-h-full" autoplay playsinline>
        <source src=${chrome.runtime.getURL("assets/video/communism_jumpscare.webm")} type="video/webm"  />
      </video>
    </div>`
]

function placeSpookyImages() {
  const images = [
    chrome.runtime.getURL("assets/3pumpkins.png"),
    chrome.runtime.getURL("assets/67.png"),
    chrome.runtime.getURL("assets/1955-trollface.png"),
    chrome.runtime.getURL("assets/angrytrump.jpg"),
    chrome.runtime.getURL("assets/blackputin.jpg"),
    chrome.runtime.getURL("assets/karlmarx.jpg"),
    chrome.runtime.getURL("assets/kim.png"),
    chrome.runtime.getURL("assets/lenin.jpg"),
    chrome.runtime.getURL("assets/shostaskovich.jpg"),
    chrome.runtime.getURL("assets/spooky_stalin.jpg"),
    chrome.runtime.getURL("assets/spooky.png"),
    chrome.runtime.getURL("assets/tchaikovsky.jpg"),
    chrome.runtime.getURL("assets/uwuputin.png"),
    chrome.runtime.getURL("assets/wideputin.png"),
    chrome.runtime.getURL("assets/widetrump.jpg"),
    chrome.runtime.getURL("assets/spook.png"),
    chrome.runtime.getURL("assets/job.png")
  ]
  const imgs = document.querySelectorAll("img")
  const replaced = new Set<Element>()
  for (let i = 0; i < imgs.length * 0.5; i++) {
    let attempts = 0
    let randomIndex = Math.floor(Math.random() * imgs.length)
    while (replaced.has(imgs[randomIndex]) && attempts < 10) {
      randomIndex = Math.floor(Math.random() * imgs.length)
      attempts++
    }
    if (!replaced.has(imgs[randomIndex])) {
      const randomImage = images[Math.floor(Math.random() * images.length)]
      imgs[randomIndex].src = randomImage
      replaced.add(imgs[randomIndex])
    }
  }
}
const requestFullscreen = (el: HTMLElement) =>
  el.requestFullscreen?.() ??
  Promise.reject(new Error("Fullscreen API unavailable"))
const showJumpscare = () => {
  if (jumpscareOverlay) {
    return
  }
  jumpscareOverlay = document.createElement("div")
  jumpscareOverlay.innerHTML =
    jumpscarePresets[Math.floor(Math.random() * jumpscarePresets.length)]

  const backdrop = jumpscareOverlay.firstElementChild as HTMLDivElement
  backdrop.addEventListener("click", hideJumpscare)

  document.documentElement.appendChild(jumpscareOverlay)
  requestFullscreen(backdrop).catch(() => undefined)
}

function handleJumpscare() {
  if (Math.random() < 0.1) {
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

const hideButton = (el: Element, probability = 1, durationMs = 1000) => {
  if (!enableButtonhide) return
  if (!(el instanceof HTMLElement)) return
  if (Math.random() >= probability) return
  if (el.dataset.yextDisappearing === "1") return

  el.dataset.yextDisappearing = "1"

  const prevVisibility = el.style.visibility
  const prevPointerEvents = el.style.pointerEvents

  el.style.visibility = "hidden"
  el.style.pointerEvents = "none"

  window.setTimeout(() => {
    el.style.visibility = prevVisibility
    el.style.pointerEvents = prevPointerEvents
    delete el.dataset.yextDisappearing
  }, durationMs)
}

function corruptWebpage() {
  document.body.style.imageRendering = "pixelated"
  document.body.style.filter = "url(#pixelate) brightness(0.5)"
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
  <svg><filter id="pixelate"><feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="0.2" result="noise"/>
  <feBlend mode="multiply" in="noise" in2="SourceGraphic"/></filter></svg>
`
  )
  document.body.style.fontFamily = "monospace"
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

  if (
    clickable.matches(
      "button, input[type='button'], input[type='submit'], [role='button']"
    )
  ) {
    setTimeout(() => {
      hideButton(clickable)
    }, 0)
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
