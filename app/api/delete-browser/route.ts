import { Kernel, NotFoundError } from "@onkernel/sdk";

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return Response.json({ error: "missing sessionId" }, { status: 400 });
  }

  const apiKey = process.env.KERNEL_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "KERNEL_API_KEY environment variable is not set" },
      { status: 400 },
    );
  }

  const kernel = new Kernel({ apiKey });

  try {
    await kernel.browsers.deleteByID(sessionId);

    return Response.json({ success: true });
  } catch (error) {
    // the session may have timed out already, which is not an error for us
    if (error instanceof NotFoundError) {
      return Response.json({ success: true });
    }

    console.error("failed to close browser", error);

    return Response.json(
      {
        error: error instanceof Error ? error.message : "failed to close browser",
      },
      { status: 500 },
    );
  }
}
