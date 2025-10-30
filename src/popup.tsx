import { Storage } from "@plasmohq/storage"
import { useEffect, useState } from "react"
import { CLICK_STORAGE_KEY } from "~constants"
import "~style.css"
const storage = new Storage({ area: "local" })

function IndexPopup() {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let isMounted = true

    const loadCount = async () => {
      const currentCount = (await storage.get<number>(CLICK_STORAGE_KEY)) ?? 0
      if (isMounted) {
        setCount(currentCount)
      }
    }

    loadCount()

    let removeListener = () => {}

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      const handleStorageChange = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string
      ) => {
        if (areaName !== "local") {
          return
        }

        const change = changes[CLICK_STORAGE_KEY]
        if (!change) {
          return
        }

        setCount((change.newValue as number) ?? 0)
      }

      chrome.storage.onChanged.addListener(handleStorageChange)
      removeListener = () => {
        chrome.storage.onChanged.removeListener(handleStorageChange)
      }
    }

    return () => {
      isMounted = false
      removeListener()
    }
  }, [])

  return (
    <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-min-w-fit">
      <h1 className="plasmo-font-bold plasmo-text-2xl">yExtension</h1>
      <span>An extension for all <i>my</i> needs and some things that i made for fune</span>
      <div className="">
        <span>Config (expand)</span>
      </div>
      <span>Count: {count}</span>
    </div>
  )

}

export default IndexPopup