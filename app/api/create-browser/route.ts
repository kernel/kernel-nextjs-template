import { Kernel } from "@onkernel/sdk";
import { NextResponse } from "next/server";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkernel%2Fkernel-nextjs-template&env=OPENAI_API_KEY&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D";

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
      // a small window keeps the live view readable in the page
      viewport: { width: 1024, height: 768, refresh_rate: 60 },
      // keep the session around long enough to run a few tasks against it
      timeout_seconds: 300,
    });

    return NextResponse.json({
      success: true,
      sessionId: browser.session_id,
      liveViewUrl: browser.browser_live_view_url,
      cdpWsUrl: browser.cdp_ws_url,
      region: browser.region,
      stealth: browser.stealth,
      spinUpTime: Date.now() - startTime,
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
