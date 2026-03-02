import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

// Sync API routes — restricted to admin users or cron jobs with CRON_SECRET
const isSyncRoute = createRouteMatcher([
    "/api/sync-dynamics(.*)",
    "/api/sync-opportunities(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }

    if (isSyncRoute(request)) {
        // Allow external cron triggers via shared secret header
        const authHeader = request.headers.get("Authorization");
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
            return NextResponse.next();
        }

        // Otherwise require an authenticated admin session
        const { sessionClaims } = await auth();
        const role = (sessionClaims as Record<string, unknown> | null)?.role;
        if (role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden: admin access required" },
                { status: 403 }
            );
        }
    }
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
