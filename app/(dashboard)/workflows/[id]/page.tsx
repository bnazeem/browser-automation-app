import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

export default async function Page({params,}: {
params:Promise<{id: string}>

}) {
  await auth.protect()

  const { id } = await params



  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="font-mono text-sm">{id}</p>
    </div>
  )
}


