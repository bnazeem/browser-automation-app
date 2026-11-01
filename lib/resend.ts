import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set")
}

// Server-only: the Resend API has no CORS, so never import this from client code.
export const resend = new Resend(process.env.RESEND_API_KEY)
