import { Kernel } from "@onkernel/sdk";
import { NextResponse } from "next/server";
import { DEPLOY_URL } from "@/lib/deploy-url";

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
      // /api/agent's own maxDuration is 300s, so a session timeout of the same
      // length can expire mid-run for a task started any time after creation.
      // give it much more headroom than a single run needs.
      timeout_seconds: 1800,
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
