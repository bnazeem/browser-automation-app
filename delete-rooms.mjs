import { Liveblocks } from "@liveblocks/node"

const lb = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY })

const ids = [
  "124095d7-5b0d-43e9-8aec-7519cb7c7703",
  "1817bd27-a1d4-4a42-9245-698b8eec2054",
  "2cbd9730-036e-49f8-af44-9d743f7ce0c1",
  "58494c24-425d-4bc1-8988-0ef2592c0765",
  "63b1bff1-ee4d-433f-b450-3ad19f137b33",
  "31101c4e-f31a-480f-8e58-19e0136e1329",
  "c4816f51-89a4-4128-b84f-1e0ae9559288",
]

for (const id of ids) {
  await lb.deleteRoom(id)
  console.log("deleted", id)
}
