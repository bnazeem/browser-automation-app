import { auth, clerkClient, type User } from "@clerk/nextjs/server"

// `Liveblocks` is a global interface declared in liveblocks.config.ts.
type UserInfo = Liveblocks["UserMeta"]["info"]

// Clerk's user list accepts up to 100 user IDs per request
const CHUNK_SIZE = 100

export async function POST(request: Request) {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return new Response("Unauthorized", { status: 401 })
  }

  let userIds: unknown
  try {
    ;({ userIds } = await request.json())
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  if (
    !Array.isArray(userIds) ||
    userIds.some((id) => typeof id !== "string")
  ) {
    return new Response("Expected { userIds: string[] }", { status: 400 })
  }

  const ids = userIds as string[]

  if (ids.length === 0) {
    return Response.json([])
  }

  // Only resolve users that belong to the caller's organization, so display
  // info can't be harvested for arbitrary users across other tenants.
  const client = await clerkClient()
  const uniqueIds = [...new Set(ids)]
  const users: User[] = []

  for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
    const { data } = await client.users.getUserList({
      userId: uniqueIds.slice(i, i + CHUNK_SIZE),
      organizationId: [orgId],
      limit: CHUNK_SIZE,
    })
    users.push(...data)
  }

  const usersById = new Map(users.map((user) => [user.id, user]))

  // Return one entry per requested ID, in the same order, null for unknown.
  const resolved: (UserInfo | null)[] = ids.map((id) => {
    const user = usersById.get(id)

    if (!user) {
      return null
    }

    return {
      name:
        user.fullName ??
        user.username ??
        user.primaryEmailAddress?.emailAddress ??
        "Anonymous",
      avatar: user.imageUrl,
    }
  })

  return Response.json(resolved)
}
