import { PrismaClient, NoteType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@aianki.dev";
  const passwordHash = await hash("demo12345", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: "Demo User",
      passwordHash,
    },
  });

  const deck = await prisma.deck.upsert({
    where: {
      id: "demo-deck",
    },
    update: {},
    create: {
      id: "demo-deck",
      name: "Biology 101",
      userId: user.id,
    },
  });

  const note = await prisma.note.create({
    data: {
      deckId: deck.id,
      type: NoteType.BASIC,
      front: "What is the powerhouse of the cell?",
      back: "Mitochondria.",
      cards: {
        create: {
          front: "What is the powerhouse of the cell?",
          back: "Mitochondria.",
        },
      },
    },
  });

  console.log(`Seeded user ${user.email} with deck ${deck.name} and note ${note.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
