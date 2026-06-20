import { PrismaClient, Platform, CampaignStatus, VideoPostStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@khaisong.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Khaisong Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`✔ Admin user ready: ${admin.email}`);

  // Example campaign (the China→Laos prompt from the plan)
  const existing = await prisma.campaign.findFirst({
    where: { title: "Khaisong China→Laos Trust Campaign" },
  });

  if (!existing) {
    const campaign = await prisma.campaign.create({
      data: {
        title: "Khaisong China→Laos Trust Campaign",
        goalPrompt:
          "Promote Khaisong as a trusted procurement and freight forwarding service from China to Laos and Thailand to Laos. Focus on sourcing support, warehouse service, customs support, and delivery to Laos.",
        postsPerDay: 2,
        numberOfDays: 3,
        totalPosts: 6,
        language: "Lao",
        tone: "Helpful, trustworthy, simple, professional",
        targetAudience:
          "Lao business owners, online sellers, shop owners, and SMEs importing from China or Thailand",
        platforms: [Platform.FACEBOOK, Platform.TIKTOK],
        status: CampaignStatus.DRAFT,
        createdById: admin.id,
        videoPosts: {
          create: [
            {
              title: "How Khaisong helps you buy products from China",
              hook: "Want to buy from China but don't know how?",
              targetPlatforms: [Platform.FACEBOOK, Platform.TIKTOK],
              hashtags: ["#Khaisong", "#ChinaToLaos", "#Freight"],
              status: VideoPostStatus.DRAFT,
            },
            {
              title: "Why use a freight forwarder from China to Laos",
              hook: "Save time and avoid customs headaches.",
              targetPlatforms: [Platform.FACEBOOK, Platform.TIKTOK],
              hashtags: ["#Khaisong", "#Logistics", "#Laos"],
              status: VideoPostStatus.DRAFT,
            },
          ],
        },
      },
    });
    console.log(`✔ Example campaign created: ${campaign.title}`);
  } else {
    console.log("✔ Example campaign already exists, skipping");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
