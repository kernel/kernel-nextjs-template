import { Kernel } from "@onkernel/sdk";
import { NextResponse } from "next/server";
import { SESSION_TAG, SESSION_TTL_MS } from "@/lib/session";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkernel%2Fkernel-nextjs-template&env=OPENAI_API_KEY&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D";

/** Best effort: a failure here should not stop a new session from being created. */
async function destroyExpiredSessions(kernel: Kernel) {
  const page = await kernel.browsers.list({
    tags: SESSION_TAG,
    status: "active",
    limit: 50,
  });
  const expired = page.items.filter((browser) => {
    return Date.now() - Date.parse(browser.created_at) > SESSION_TTL_MS;
  });

  await Promise.all(
    expired.map((browser) =>
      kernel.browsers.deleteByID(browser.session_id).catch((error) => {
        console.error(`failed to destroy ${browser.session_id}`, error);
      }),
    ),
  );
}

export async function POST() {
  const apiKey = process.env.KERNEL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "MISSING_API_KEY",
        message: "KERNEL_API_KEY environment variable is not set",
        deployUrl: DEPLOY_URL,
      },
      { status: 400 },
    );
  }

  try {
    const kernel = new Kernel({ apiKey });
    const startTime = Date.now();

    const browser = await kernel.browsers.create({
      stealth: true,
      headless: false,
      // a smaller window than the 1920x1080 default keeps the live view readable
      viewport: { width: 1280, height: 800, refresh_rate: 60 },
      // and if nobody is watching, close it after five idle minutes
      timeout_seconds: 300,
      tags: SESSION_TAG,
    });

    await destroyExpiredSessions(kernel).catch((error) => {
      console.error("failed to sweep expired browsers", error);
    });

    return NextResponse.json({
      success: true,
      sessionId: browser.session_id,
      liveViewUrl: browser.browser_live_view_url,
      cdpWsUrl: browser.cdp_ws_url,
      region: browser.region,
      stealth: browser.stealth,
      spinUpTime: Date.now() - startTime,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  } catch (error) {
    console.error("failed to create browser", error);

    return NextResponse.json(
      {
        error: "Failed to create browser",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
