/** How long a session lives, from creation, whether or not anyone is using it. */
export const SESSION_TTL_MS = 10 * 60 * 1000;

/**
 * Applied to every session this app creates, so it can find and destroy its own
 * leftovers. Kernel's inactivity timeout covers a closed tab; this covers a tab
 * that stays open on the live view.
 */
export const SESSION_TAG = { app: "kernel-nextjs-template" };
