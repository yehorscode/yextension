import { useEffect, useState } from "react"

import { Storage } from "@plasmohq/storage"

import { CLICK_STORAGE_KEY } from "~/constants"

import "@/style.css"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"

const storage = new Storage({ area: "local" })

function IndexPopup() {
  const [count, setCount] = useState<number>(0)
  const [config_BeepEnabled, setConfig_BeepEnabled] = useState<boolean>(true)
  const [config_JumpScaresEnabled, setConfig_JumpScaresEnabled] =
    useState<boolean>(true)
  const [config_ImageReplaceEnabled, setConfig_ImageReplaceEnabled] =
    useState<boolean>(false)
  const [config_ButtonHideEnabled, setConfig_ButtonHideEnabled] =
    useState<boolean>(false)
  const handleToggleBeep = async () => {
    const nextValue = !config_BeepEnabled
    setConfig_BeepEnabled(nextValue)
    await storage.set("yextension:enable-beep", nextValue)
  }
  const handleToggleJumpscares = async () => {
    const nextValue = !config_JumpScaresEnabled
    setConfig_JumpScaresEnabled(nextValue)
    await storage.set("yextension:enable-jumpscare", nextValue)
  }
  const handleToggleImageReplace = async () => {
    const nextValue = !config_ImageReplaceEnabled
    setConfig_ImageReplaceEnabled(nextValue)
    await storage.set("yextension:enable-image-replace", nextValue)
  }
  const handleToggleButtonHide = async () => {
    const nextValue = !config_ButtonHideEnabled
    setConfig_ButtonHideEnabled(nextValue)
    await storage.set("yextension:enable-button-hide", nextValue)
  }
  useEffect(() => {
    const fetchConfig = async () => {
      const a_value = await storage.get<boolean>("yextension:enable-beep")
      setConfig_BeepEnabled(a_value ?? true)
      const b_value = await storage.get<boolean>("yextension:enable-jumpscare")
      setConfig_JumpScaresEnabled(b_value ?? true)
      const c_value = await storage.get<boolean>(
        "yextension:enable-image-replace"
      )
      setConfig_ImageReplaceEnabled(c_value ?? false)
      const d_value = await storage.get<boolean>(
        "yextension:enable-button-hide"
      )
      setConfig_ButtonHideEnabled(d_value ?? false)
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
        An extension for all <i>my</i> needs and some things that i made for fun
      </span>

      <Collapsible className="min-w-full">
        <CollapsibleTrigger className="bg-gray-300 min-w-full rounded-sm">
          <span>Config (expand)</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col items-center justify-center gap-2">
          <div className="flex flex-row items-center justify-center gap-4 bg-gray-100 px-2 mt-2">
            <span>{config_BeepEnabled ? "Beep Enabled" : "Beep Disabled"}</span>
            <button
              className="px-2 font-mono bg-gray-300"
              onClick={handleToggleBeep}
              style={{
                backgroundColor: config_BeepEnabled ? "lightcoral" : "lime"
              }}>
              {config_BeepEnabled ? "Disable" : "Enable"} beep
            </button>
          </div>
          <div className="flex flex-row items-center justify-center gap-4 bg-gray-100 px-2">
            <span>
              {config_JumpScaresEnabled
                ? "Jumpscares Enabled"
                : "Jumpscares Disabled"}
            </span>
            <button
              className="px-2 font-mono bg-gray-300"
              onClick={handleToggleJumpscares}
              style={{
                backgroundColor: config_JumpScaresEnabled
                  ? "lightcoral"
                  : "lime"
              }}>
              {config_JumpScaresEnabled ? "Disable" : "Enable"} jumpscares
            </button>
          </div>
          <div className="flex flex-row items-center justify-center gap-4 bg-gray-100 px-2">
            <span>
              {config_ImageReplaceEnabled
                ? "Image Replace Enabled"
                : "Image Replace Disabled"}
            </span>
            <button
              className="px-2 font-mono bg-gray-300"
              onClick={handleToggleImageReplace}
              style={{
                backgroundColor: config_ImageReplaceEnabled
                  ? "lightcoral"
                  : "lime"
              }}>
              {config_ImageReplaceEnabled ? "Disable" : "Enable"} image replace
            </button>
          </div>
          <div className="flex flex-row items-center justify-center gap-4 bg-gray-100 px-2 mb-2">
            <span>
              {config_ButtonHideEnabled
                ? "Button Hide Enabled"
                : "Button Hide Disabled"}
            </span>
            <button
              className="px-2 font-mono bg-gray-300"
              onClick={handleToggleButtonHide}
              style={{
                backgroundColor: config_ButtonHideEnabled
                  ? "lightcoral"
                  : "lime"
              }}>
              {config_ButtonHideEnabled ? "Disable" : "Enable"} button hide
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <span>Count: {count}</span>
    </div>
  )
}
export default IndexPopup
