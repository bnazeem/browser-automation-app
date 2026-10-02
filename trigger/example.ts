import { logger, metadata, task, wait } from "@trigger.dev/sdk"

export type HelloWorldPayload = {
  message?: string
}

export const helloWorldTask = task({
  id: "hello-world",
  // Set an optional maxDuration to prevent tasks from running indefinitely
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: HelloWorldPayload, { ctx }) => {
    logger.log("Hello, world!", { payload, ctx })

    metadata.set("step", "starting")
    metadata.set("progress", 0)

    await wait.for({ seconds: 2 })

    metadata.set("step", "working")
    metadata.set("progress", 0.5)

    await wait.for({ seconds: 3 })

    metadata.set("step", "finishing")
    metadata.set("progress", 1)

    return {
      message: payload.message ?? "Hello, world!",
    }
  },
})
