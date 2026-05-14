import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createId } from "@paralleldrive/cuid2";
const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean up existing data
  await prisma.viewEvent.deleteMany();
  await prisma.communityRoom.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.section.deleteMany();
  await prisma.room.deleteMany();
  await prisma.seller.deleteMany();

  // ─── Sellers ────────────────────────────────────────────────────────────────
  const seller1Id = createId();
  const seller2Id = createId();

  // Auth is bypassed — passwordHash is a required schema field but never used.
  const passwordHash1 = "demo-placeholder";
  const passwordHash2 = "demo-placeholder";

  const seller1 = await prisma.seller.create({
    data: {
      id: seller1Id,
      email: "seller@acmecorp.com",
      name: "Alex Morgan",
      passwordHash: passwordHash1,
    },
  });

  const seller2 = await prisma.seller.create({
    data: {
      id: seller2Id,
      email: "seller2@acmecorp.com",
      name: "Sam Chen",
      passwordHash: passwordHash2,
    },
  });

  console.log(`Created sellers: ${seller1.email}, ${seller2.email}`);

  // ─── Room 1 (Seller 1): Q3 Business Review — Acme Corp ──
  const room1Id = createId();
  const room1 = await prisma.room.create({
    data: {
      id: room1Id,
      sellerId: seller1Id,
      name: "Q3 Business Review",
      customerName: "Acme Corp",
      description:
        "Custom Twilio Flex evaluation package for Acme Corp's contact center modernization initiative.",
      slug: "acme-corp-room",
      status: "published",
      branding: JSON.stringify({
        sellerLogoUrl: "https://placehold.co/200x60/ef4444/ffffff?text=TWILIO&font=montserrat",
        customerLogoUrl: "https://placehold.co/200x60/e2e8f0/475569?text=ACME+CORP&font=montserrat",
        primaryColor: "#ef4444",
        companyName: "Twilio",
      }),
    },
  });

  // Section 1.1 — Product Overview
  const s1_1Id = createId();
  await prisma.section.create({
    data: {
      id: s1_1Id,
      roomId: room1Id,
      title: "Product Overview",
      order: 0,
      audienceTag: "executive",
      assets: {
        create: [
          {
            id: createId(),
            type: "file",
            sourceType: "manual",
            title: "Twilio Flex Overview Deck",
            description:
              "Executive summary of Twilio Flex capabilities, architecture, and differentiators vs. legacy CCaaS platforms.",
            fileKey: "flex-overview-deck-v3.pdf",
            metadata: JSON.stringify({ mimeType: "application/pdf", sizeMb: 4.2 }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Twilio Flex Product Page",
            description: "Official Twilio Flex product page with feature highlights and customer stories.",
            url: "https://www.twilio.com/en-us/flex",
            metadata: JSON.stringify({}),
            order: 1,
          },
          {
            id: createId(),
            type: "richtext",
            sourceType: "manual",
            title: "Why Flex for Healthcare",
            description: "Key talking points for HIPAA-eligible deployments, patient engagement workflows, and EHR integrations.",
            metadata: JSON.stringify({
              content:
                "<h2>Why Twilio Flex for Healthcare</h2><ul><li>HIPAA-eligible infrastructure with BAA support</li><li>Native integration with Epic, Cerner, and Salesforce Health Cloud</li><li>Omnichannel: voice, SMS, WhatsApp, webchat in one agent desktop</li><li>Custom agent UI via React SDK — no vendor lock-in</li></ul>",
            }),
            order: 2,
          },
        ],
      },
    },
  });

  // Section 1.2 — Business Case
  const s1_2Id = createId();
  await prisma.section.create({
    data: {
      id: s1_2Id,
      roomId: room1Id,
      title: "Business Case",
      order: 1,
      audienceTag: "champion",
      assets: {
        create: [
          {
            id: createId(),
            type: "file",
            sourceType: "manual",
            title: "ROI Calculator — Contact Center Modernization",
            description:
              "Interactive model showing 3-year TCO reduction and agent productivity gains for a 500-seat deployment.",
            fileKey: "flex-roi-calculator-500seat.xlsx",
            metadata: JSON.stringify({ mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeMb: 0.8 }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Forrester TEI Study: Twilio Flex",
            description: "Forrester Total Economic Impact study showing 246% ROI over three years.",
            url: "https://www.twilio.com/en-us/resources/reports/total-economic-impact-of-twilio-flex",
            metadata: JSON.stringify({}),
            order: 1,
          },
          {
            id: createId(),
            type: "richtext",
            sourceType: "manual",
            title: "Acme Corp Success Metrics",
            description: "Proposed KPIs and baseline targets tailored to Acme's current contact center performance.",
            metadata: JSON.stringify({
              content:
                "<h2>Proposed Success Metrics</h2><table><tr><th>Metric</th><th>Baseline</th><th>Target</th></tr><tr><td>Average Handle Time</td><td>6m 42s</td><td>5m 15s</td></tr><tr><td>First Call Resolution</td><td>61%</td><td>78%</td></tr><tr><td>CSAT Score</td><td>3.4 / 5</td><td>4.2 / 5</td></tr><tr><td>Agent Attrition</td><td>34%</td><td>18%</td></tr></table>",
            }),
            order: 2,
          },
        ],
      },
    },
  });

  // Section 1.3 — Technical Deep Dive
  const s1_3Id = createId();
  await prisma.section.create({
    data: {
      id: s1_3Id,
      roomId: room1Id,
      title: "Technical Deep Dive",
      order: 2,
      audienceTag: "technical",
      assets: {
        create: [
          {
            id: createId(),
            type: "file",
            sourceType: "manual",
            title: "Flex Architecture & Security Whitepaper",
            description:
              "Deep-dive on Twilio Flex multi-tenant architecture, data residency options, and security controls.",
            fileKey: "flex-architecture-security-whitepaper.pdf",
            metadata: JSON.stringify({ mimeType: "application/pdf", sizeMb: 6.1 }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Flex Developer Docs",
            description: "Full Twilio Flex developer documentation including Plugin SDK, TaskRouter, and Conversations.",
            url: "https://www.twilio.com/docs/flex",
            metadata: JSON.stringify({}),
            order: 1,
          },
        ],
      },
    },
  });

  console.log(`Created Room 1: ${room1.name} (${room1.status})`);

  // ─── Room 2 (Seller 1): Partnership Proposal — Acme Corp ────────────────────
  const room2Id = createId();
  const room2 = await prisma.room.create({
    data: {
      id: room2Id,
      sellerId: seller1Id,
      name: "Partnership Proposal",
      customerName: "Acme Corp",
      description:
        "Twilio Messaging and Verify package proposal for Acme Corp's user onboarding and transactional notification workflows.",
      slug: "acme-corp-draft",
      status: "draft",
      branding: JSON.stringify({
        sellerLogoUrl: "https://placehold.co/200x60/ef4444/ffffff?text=TWILIO&font=montserrat",
        customerLogoUrl: "https://placehold.co/200x60/e2e8f0/475569?text=ACME+CORP&font=montserrat",
        primaryColor: "#ef4444",
        companyName: "Twilio",
      }),
    },
  });

  // Section 2.1 — Messaging Solutions
  const s2_1Id = createId();
  await prisma.section.create({
    data: {
      id: s2_1Id,
      roomId: room2Id,
      title: "Messaging Solutions",
      order: 0,
      assets: {
        create: [
          {
            id: createId(),
            type: "file",
            sourceType: "manual",
            title: "Twilio Programmable Messaging Overview",
            description: "One-pager covering SMS, MMS, WhatsApp Business, and RCS capabilities.",
            fileKey: "twilio-messaging-overview.pdf",
            metadata: JSON.stringify({ mimeType: "application/pdf", sizeMb: 1.5 }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Messaging Quickstart Guide",
            description: "Send your first SMS in under 5 minutes with any programming language.",
            url: "https://www.twilio.com/docs/messaging/quickstart",
            metadata: JSON.stringify({}),
            order: 1,
          },
        ],
      },
    },
  });

  // Section 2.2 — User Verification & Security
  const s2_2Id = createId();
  await prisma.section.create({
    data: {
      id: s2_2Id,
      roomId: room2Id,
      title: "User Verification & Security",
      order: 1,
      assets: {
        create: [
          {
            id: createId(),
            type: "richtext",
            sourceType: "manual",
            title: "Verify API: Reduce Fraud at Onboarding",
            description: "How Twilio Verify reduces account takeover fraud during user registration.",
            metadata: JSON.stringify({
              content:
                "<h2>Twilio Verify for Acme Corp</h2><p>Stop fraudulent signups before they happen with multi-channel OTP:</p><ul><li>SMS, Voice, Email, WhatsApp, and TOTP in one API</li><li>Built-in carrier intelligence to block SIM-swap fraud</li><li>Silent Network Auth for frictionless mobile verification</li><li>Pay per successful verification — no monthly minimums</li></ul>",
            }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Verify Pricing Calculator",
            description: "Estimate your Verify costs based on monthly active users and channel mix.",
            url: "https://www.twilio.com/en-us/verify/pricing",
            metadata: JSON.stringify({}),
            order: 1,
          },
        ],
      },
    },
  });

  console.log(`Created Room 2: ${room2.name} (${room2.status})`);

  // ─── Room 3 (Seller 2): Technical Evaluation — Acme Corp ────────────────────
  const room3Id = createId();
  const room3 = await prisma.room.create({
    data: {
      id: room3Id,
      sellerId: seller2Id,
      name: "Technical Evaluation",
      customerName: "Acme Corp",
      description:
        "Twilio Video SDK evaluation package for Acme Corp's live streaming and virtual event platform.",
      slug: "acme-corp-eval",
      status: "draft",
      branding: JSON.stringify({
        sellerLogoUrl: "https://placehold.co/200x60/ef4444/ffffff?text=TWILIO&font=montserrat",
        customerLogoUrl: "https://placehold.co/200x60/e2e8f0/475569?text=ACME+CORP&font=montserrat",
        primaryColor: "#ef4444",
        companyName: "Twilio",
      }),
    },
  });

  // Section 3.1 — Video Platform Capabilities
  const s3_1Id = createId();
  await prisma.section.create({
    data: {
      id: s3_1Id,
      roomId: room3Id,
      title: "Video Platform Capabilities",
      order: 0,
      assets: {
        create: [
          {
            id: createId(),
            type: "file",
            sourceType: "manual",
            title: "Twilio Video SDK Technical Overview",
            description: "Comprehensive guide to Twilio Video rooms, tracks, and participant management.",
            fileKey: "twilio-video-sdk-technical-overview.pdf",
            metadata: JSON.stringify({ mimeType: "application/pdf", sizeMb: 3.7 }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Video SDK JavaScript Quickstart",
            description: "Build a group video chat app in minutes using the Twilio Video JavaScript SDK.",
            url: "https://www.twilio.com/docs/video/javascript-getting-started",
            metadata: JSON.stringify({}),
            order: 1,
          },
          {
            id: createId(),
            type: "richtext",
            sourceType: "manual",
            title: "Acme Corp Use Case Fit",
            description: "Analysis of how Twilio Video maps to Acme Corp's live event and broadcast requirements.",
            metadata: JSON.stringify({
              content:
                "<h2>Twilio Video for Acme Corp</h2><h3>Use Cases Supported</h3><ul><li><strong>Virtual Events:</strong> Group Rooms support up to 50 participants with dominant speaker detection</li><li><strong>Broadcast:</strong> WebRTC-to-RTMP for streaming to YouTube, Twitch, and custom CDNs</li><li><strong>Recording:</strong> Composited and per-track cloud recording with webhook notifications</li></ul><h3>Scale Considerations</h3><p>For events exceeding 50 participants, Twilio's Live API provides low-latency HLS at scale with sub-5s latency.</p>",
            }),
            order: 2,
          },
        ],
      },
    },
  });

  // Section 3.2 — Integration & Compliance
  const s3_2Id = createId();
  await prisma.section.create({
    data: {
      id: s3_2Id,
      roomId: room3Id,
      title: "Integration & Compliance",
      order: 1,
      assets: {
        create: [
          {
            id: createId(),
            type: "file",
            sourceType: "manual",
            title: "Video Compliance & Data Residency Guide",
            description: "Documentation on GDPR, CCPA, and regional data residency options for Twilio Video.",
            fileKey: "twilio-video-compliance-guide.pdf",
            metadata: JSON.stringify({ mimeType: "application/pdf", sizeMb: 2.3 }),
            order: 0,
          },
          {
            id: createId(),
            type: "link",
            sourceType: "manual",
            title: "Video REST API Reference",
            description: "Complete REST API reference for managing Video rooms, recordings, and compositions.",
            url: "https://www.twilio.com/docs/video/api",
            metadata: JSON.stringify({}),
            order: 1,
          },
          {
            id: createId(),
            type: "richtext",
            sourceType: "manual",
            title: "Migration Path from Zoom Video SDK",
            description: "Step-by-step migration guide for teams moving from Zoom Video SDK to Twilio Video.",
            metadata: JSON.stringify({
              content:
                "<h2>Migration from Zoom Video SDK</h2><ol><li><strong>Auth swap:</strong> Replace Zoom JWT tokens with Twilio Access Tokens (15-min TTL, no polling)</li><li><strong>Room lifecycle:</strong> Twilio Rooms are created on first participant join — no pre-create needed</li><li><strong>Track model:</strong> Twilio uses a publish/subscribe track model — subscribe only to tracks you render</li><li><strong>Recording:</strong> Replace Zoom cloud recording webhooks with Twilio <code>RecordingStatusCallback</code></li></ol>",
            }),
            order: 2,
          },
        ],
      },
    },
  });

  console.log(`Created Room 3: ${room3.name} (${room3.status})`);

  // ─── Community Room (shared from Room 1) ────────────────────────────────────
  const communityRoomId = createId();
  await prisma.communityRoom.create({
    data: {
      id: communityRoomId,
      roomId: room1Id,
      sellerId: seller1Id,
      title: "Q3 Business Review Template",
      description:
        "Battle-tested room template for enterprise Flex pitches. Includes executive overview, ROI calculator, and technical deep dive sections. Customize for your prospect and go.",
      tags: JSON.stringify(["template", "business-review", "enterprise"]),
      cloneCount: 7,
      viewCount: 42,
    },
  });

  console.log("Created community room from Room 1");

  // ─── ViewEvents on Room 1 ────────────────────────────────────────────────────
  // Fetch asset IDs from room 1 sections for realistic events
  const room1Sections = await prisma.section.findMany({
    where: { roomId: room1Id },
    include: { assets: true },
    orderBy: { order: "asc" },
  });

  const allAssets = room1Sections.flatMap((s) => s.assets);

  const visitorA = "visitor_acme_procurement_vp";
  const visitorB = "visitor_acme_it_architect";

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  const viewEvents = [
    // Visitor A — 3 days ago
    {
      id: createId(),
      roomId: room1Id,
      visitorId: visitorA,
      action: "room_viewed",
      timestamp: new Date(now.getTime() - 3 * msPerDay),
      ipHash: "sha256_a1b2c3",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    {
      id: createId(),
      roomId: room1Id,
      assetId: allAssets[0]?.id,
      visitorId: visitorA,
      action: "asset_viewed",
      timestamp: new Date(now.getTime() - 3 * msPerDay + 2 * 60 * 1000),
      ipHash: "sha256_a1b2c3",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    {
      id: createId(),
      roomId: room1Id,
      assetId: allAssets[0]?.id,
      visitorId: visitorA,
      action: "asset_downloaded",
      timestamp: new Date(now.getTime() - 3 * msPerDay + 4 * 60 * 1000),
      ipHash: "sha256_a1b2c3",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    {
      id: createId(),
      roomId: room1Id,
      assetId: allAssets[1]?.id,
      visitorId: visitorA,
      action: "link_clicked",
      timestamp: new Date(now.getTime() - 3 * msPerDay + 7 * 60 * 1000),
      ipHash: "sha256_a1b2c3",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    // Visitor A — yesterday
    {
      id: createId(),
      roomId: room1Id,
      visitorId: visitorA,
      action: "room_viewed",
      timestamp: new Date(now.getTime() - 1 * msPerDay),
      ipHash: "sha256_a1b2c3",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    {
      id: createId(),
      roomId: room1Id,
      assetId: allAssets[3]?.id,
      visitorId: visitorA,
      action: "asset_viewed",
      timestamp: new Date(now.getTime() - 1 * msPerDay + 3 * 60 * 1000),
      ipHash: "sha256_a1b2c3",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    // Visitor B — 2 days ago
    {
      id: createId(),
      roomId: room1Id,
      visitorId: visitorB,
      action: "room_viewed",
      timestamp: new Date(now.getTime() - 2 * msPerDay),
      ipHash: "sha256_d4e5f6",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: createId(),
      roomId: room1Id,
      assetId: allAssets[6]?.id,
      visitorId: visitorB,
      action: "asset_viewed",
      timestamp: new Date(now.getTime() - 2 * msPerDay + 5 * 60 * 1000),
      ipHash: "sha256_d4e5f6",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: createId(),
      roomId: room1Id,
      assetId: allAssets[7]?.id,
      visitorId: visitorB,
      action: "link_clicked",
      timestamp: new Date(now.getTime() - 2 * msPerDay + 9 * 60 * 1000),
      ipHash: "sha256_d4e5f6",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  ];

  // Filter out events where assetId is undefined (in case section has fewer assets than expected)
  for (const event of viewEvents) {
    const { assetId, ...rest } = event as typeof event & { assetId?: string };
    await prisma.viewEvent.create({
      data: assetId ? { ...rest, assetId } : rest,
    });
  }

  console.log(`Created ${viewEvents.length} view events on Room 1`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
