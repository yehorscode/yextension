import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import { CLICK_STORAGE_KEY } from "~/constants"

import "@/style.css"
import { Button } from "./components/ui/button"

const storage = new Storage({ area: "local" })

function IndexPopup() {
  const [count, setCount] = useState<number>(0)
  const [config_BeepEnabled, setConfig_BeepEnabled] = useState<boolean>(true)

  const handleToggleBeep = async () => {
    const nextValue = !config_BeepEnabled
    setConfig_BeepEnabled(nextValue)
    await storage.set("yextension:enable-beep", nextValue)
  }

  useEffect(() => {
    const fetchConfig = async () => {
      const value = await storage.get<boolean>("yextension:enable-beep")
      setConfig_BeepEnabled(value ?? true)
    }

    fetchConfig()
  }, [])
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
    <div className="flex flex-col items-center justify-center min-w-fit">
      <h1 className="font-bold text-2xl">yExtension</h1>
      <span>
        An extension for all <i>my</i> needs and some things that i made for
        fun
      </span>
      <div className="">
        <span>Config (expand)</span>
      </div>
      
      <span>Count: {count}</span>
      <span>{config_BeepEnabled ? "Enabled" : "Disabled"}</span>
      <button onClick={handleToggleBeep} className="p-2 font-mono bg-gray-400">
        {config_BeepEnabled ? "Disable" : "Enable"} beep
      </button>
    </div>
  )
}
export default IndexPopup