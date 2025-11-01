import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })

async function initiateConfig() {
  const config = { jumpscares: true, theme: "dark" }
  await storage.set("config", config)
}
