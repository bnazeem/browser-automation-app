import { resend } from "@/lib/resend"

// Sandbox sender - Resend only delivers it to the account owner's own address
// until we verify a domain.
const FROM = "onboarding@resend.dev"

// The body can contain text scraped from web pages, so escape it before it
// goes into HTML - otherwise any tags in it would render in the email.
function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// HTML ignores newlines, so turn them into <br> to keep the body's line breaks.
function toHtml(text: string) {
  return escapeHtml(text).replace(/\r?\n/g, "<br>")
}

// Sends the body as both plain text and HTML; the email client picks which to
// show. No browser involved. Resend returns
// { data, error } instead of throwing, so an API error is rethrown here - else
// the step would show as done even though nothing was sent.
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    text: body,
    html: toHtml(body),
  })

  if (error || !data)
    throw new Error(error?.message ?? "Resend returned no email id")

  return { id: data.id }
}
