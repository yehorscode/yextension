import { Storage } from "@plasmohq/storage"
import { CLICK_MESSAGE_TYPE, CLICK_STORAGE_KEY } from "~constants"

const storage = new Storage({ area: "local" })

let clickCount = 0

const ready = (async () => {
  clickCount = (await storage.get<number>(CLICK_STORAGE_KEY)) ?? 0
})()

let updateQueue: Promise<void> = ready.then(() => undefined)

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== CLICK_MESSAGE_TYPE) {
    return
  }

  updateQueue = updateQueue
    .catch(() => undefined)
    .then(async () => {
      clickCount += 1
      await storage.set(CLICK_STORAGE_KEY, clickCount)
    })
    .catch(() => undefined)
})
