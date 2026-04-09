import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

const RETRYABLE_STATUS = [429, 500, 502, 503, 504];

async function withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 2000
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (attempt === maxAttempts) throw e;
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    throw lastError;
}

async function getAccessToken(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    orgUrl: string
): Promise<string> {
    const resp = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                client_id: clientId,
                client_secret: clientSecret,
                scope: `${orgUrl}/.default`,
            }),
        }
    );
    const data = await resp.json() as Record<string, unknown>;
    if (!data.access_token) {
        throw new Error(`Azure AD auth failed: ${JSON.stringify(data)}`);
    }
    return data.access_token as string;
}

async function dynamicsRequest(
    url: string,
    headers: Record<string, string>
): Promise<Record<string, unknown>> {
    return withRetry(async () => {
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            const body = await resp.text();
            const cleanBody = body.replace(/<[^>]*>/g, "").trim().substring(0, 300);
            const err = new Error(`Dynamics ${resp.status}: ${cleanBody}`);
            if (RETRYABLE_STATUS.includes(resp.status)) throw err;
            throw Object.assign(err, { nonRetryable: true });
        }
        return resp.json() as Promise<Record<string, unknown>>;
    }, 3, 2000);
}

export async function POST(request: Request) {
    // Allow external cron triggers via shared secret, otherwise require admin session
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isValidCron) {
        const { sessionClaims } = await auth();
        const claims = sessionClaims as Record<string, unknown> | null;
        // Clerk exposes publicMetadata in session claims under "metadata" or
        // at the top level if a custom JWT template maps it (e.g. "role": "{{user.public_metadata.role}}")
        const role =
            claims?.role ??
            (claims?.metadata as Record<string, unknown> | undefined)?.role ??
            (claims?.publicMetadata as Record<string, unknown> | undefined)?.role ??
            (claims?.public_metadata as Record<string, unknown> | undefined)?.role;
        if (role !== "admin") {
            return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
        }
    }

    const tenantId = process.env.DYNAMICS_TENANT_ID;
    const clientId = process.env.DYNAMICS_CLIENT_ID;
    const clientSecret = process.env.DYNAMICS_CLIENT_SECRET;
    const orgUrl = process.env.DYNAMICS_ORG_URL;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!tenantId || !clientId || !clientSecret || !orgUrl) {
        return NextResponse.json(
            { error: "Missing DYNAMICS_* environment variables" },
            { status: 500 }
        );
    }
    if (!convexUrl) {
        return NextResponse.json(
            { error: "Missing NEXT_PUBLIC_CONVEX_URL" },
            { status: 500 }
        );
    }

    try {
        let days = 30;
        try {
            const body = await request.json();
            if (typeof body.days === "number" && body.days > 0) days = body.days;
        } catch {
            // No body or invalid JSON — use default
        }

        const baseUrl = orgUrl.replace(/\/+$/, "");

        const token = await withRetry(
            () => getAccessToken(tenantId, clientId, clientSecret, baseUrl),
            3,
            1000
        );

        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            Accept: "application/json",
            Prefer: 'odata.include-annotations="*"',
        };

        // 1. Fetch all active CRM users
        const usersJson = await dynamicsRequest(
            `${baseUrl}/api/data/v9.2/systemusers` +
            `?$select=systemuserid,fullname,internalemailaddress,isdisabled,jobtitle` +
            `&$filter=isdisabled eq false` +
            `&$top=250`,
            headers
        );
        const users = ((usersJson.value ?? []) as Record<string, unknown>[])
            .filter((u) => {
                const name = (u.fullname as string) ?? "";
                const email = ((u.internalemailaddress as string) ?? "").toLowerCase();
                const disabled = (u.isdisabled as boolean) ?? false;
                if (name.startsWith("#")) return false;
                if (disabled) return false;
                if (email.includes("microsoft") || email.includes("riivo")) return false;
                if (name.toLowerCase().includes("ttt")) return false;
                return true;
            });

        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const entityTypes = [
            { endpoint: "new_cases", label: "cases" },
            { endpoint: "new_leads", label: "leads" },
            { endpoint: "contacts", label: "contacts" },
            { endpoint: "new_invoiceses", label: "invoices" },
            { endpoint: "opportunities", label: "opportunities" },
        ];

        const activityCounts: Record<string, Record<string, number>> = {};

        for (const { endpoint, label } of entityTypes) {
            try {
                const json = await dynamicsRequest(
                    `${baseUrl}/api/data/v9.2/${endpoint}` +
                    `?$select=_createdby_value` +
                    `&$filter=createdon ge ${since}` +
                    `&$top=5000`,
                    headers
                );
                const records = ((json.value ?? []) as Record<string, unknown>[]);
                for (const r of records) {
                    const uid = r["_createdby_value"] as string;
                    if (!uid) continue;
                    if (!activityCounts[uid]) activityCounts[uid] = {};
                    activityCounts[uid][label] = (activityCounts[uid][label] ?? 0) + 1;
                }
            } catch {
                // Skip entity types that fail — partial data is better than none
            }
        }

        // Count OTP tasks per user (tasks whose subject contains "OTP", attributed to primary representative)
        try {
            const otpJson = await dynamicsRequest(
                `${baseUrl}/api/data/v9.2/tasks` +
                `?$select=subject,_riivo_primaryrepresentative_value,createdon` +
                `&$filter=createdon ge ${since} and contains(subject,'OTP')` +
                `&$top=5000`,
                headers
            );
            const otpRecords = ((otpJson.value ?? []) as Record<string, unknown>[]);
            for (const r of otpRecords) {
                // Check time-of-day filter (10am–3pm) to avoid bulk upload bias
                const createdOn = r["createdon"] as string | undefined;
                if (createdOn) {
                    const hour = new Date(createdOn).getHours();
                    if (hour < 10 || hour >= 15) continue;
                }

                const uid = r["_riivo_primaryrepresentative_value"] as string;
                if (!uid) continue;
                if (!activityCounts[uid]) activityCounts[uid] = {};
                activityCounts[uid]["otpTasks"] = (activityCounts[uid]["otpTasks"] ?? 0) + 1;
            }
        } catch {
            // OTP task query may fail if entity doesn't exist — skip gracefully
        }

        const syncedAt = Date.now();

        // Write results to Convex
        const convex = new ConvexHttpClient(convexUrl);
        await convex.mutation(api.adoption.upsertAdoptionData, {
            users: users.map((u) => ({
                dynamicsId: (u.systemuserid as string) ?? "",
                fullName: (u.fullname as string) ?? "Unknown",
                email: (u.internalemailaddress as string | undefined) ?? undefined,
                department: (u.department as string | undefined) ?? undefined,
                jobTitle: (u.jobtitle as string | undefined) ?? undefined,
                isDisabled: (u.isdisabled as boolean) ?? false,
                lastActiveOn: (u.lastactivedon as string | undefined) ?? undefined,
                lastSyncedAt: syncedAt,
            })),
            activities: Object.entries(activityCounts).flatMap(([userId, counts]) =>
                Object.entries(counts).map(([entityType, count]) => ({
                    dynamicsUserId: userId,
                    entityType,
                    count,
                    syncedAt,
                }))
            ),
        });

        return NextResponse.json({
            success: true,
            syncedAt,
            userCount: users.length,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
