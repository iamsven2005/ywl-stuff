import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Reset the DriveFolder ID sequence
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "DriveFolder_id_seq" RESTART WITH 1;`)

  // Delete all folders (if needed)
  await prisma.driveFolder.deleteMany()

  // Get all users
  const users = await prisma.user.findMany()

  // Create a root folder for each user
  for (const user of users) {
    await prisma.driveFolder.create({
      data: {
        name: "My Drive",
        parentId: null,
        ownerId: user.id,
      },
    })

    console.log(`Created root folder for user ${user.username} (ID: ${user.id})`)
  }

  console.log("✅ Drive folders created for all users.")
}

main()
  .catch((e) => {
    console.error("Error:", e)
  })
  .finally(() => prisma.$disconnect())
