import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

export default async function Page() {
  await auth.protect()

  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <UserButton />
      <OrganizationSwitcher hidePersonal />
    </div>
  )
}
