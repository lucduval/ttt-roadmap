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
        const role = (sessionClaims as Record<string, unknown> | null)?.role;
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

        // No $select — fetch the full record so that all virtual lookup ID
        // fields (_owninguser_value, _createdby_value, _modifiedby_value) are
        // reliably returned. Using $select with these fields can silently drop
        // them because they are computed/owner-type virtual properties in
        // Dynamics OData and may not be recognised as selectable field names.
        const json = await dynamicsRequest(
            `${baseUrl}/api/data/v9.2/riivo_opportunities?$top=5000`,
            headers
        );

        const records = ((json.value ?? []) as Record<string, unknown>[]);
        const syncedAt = Date.now();

        const convex = new ConvexHttpClient(convexUrl);

        // Store opportunity records for the FA Lead Generation chart (all opps)
        await convex.mutation(api.adoption.upsertOpportunityData, {
            opportunities: records.map((r) => ({
                opportunityId: (r.riivo_opportunityid as string) ?? "",
                isAutomated: (r.riivo_automatedopportunity as boolean) ?? false,
                createdOn: (r.createdon as string) ?? new Date().toISOString(),
                syncedAt,
            })).filter((r) => r.opportunityId !== ""),
        });

        // Count opportunities per user across all three attribution fields:
        //   _owninguser_value  — the FA the opportunity is assigned to
        //   _createdby_value   — who created the record
        //   _modifiedby_value  — who last modified the record
        // We use a Set per opportunity to avoid counting the same user twice
        // if they appear in more than one field on the same record.
        const oppCounts: Record<string, number> = {};
        for (const r of records) {
            const touched = new Set<string>();
            const owningUser = r._owninguser_value as string | null | undefined;
            const createdBy  = r._createdby_value  as string | null | undefined;
            const modifiedBy = r._modifiedby_value as string | null | undefined;
            if (owningUser) touched.add(owningUser);
            if (createdBy)  touched.add(createdBy);
            if (modifiedBy) touched.add(modifiedBy);
            for (const uid of touched) {
                oppCounts[uid] = (oppCounts[uid] ?? 0) + 1;
            }
        }

        await convex.mutation(api.adoption.upsertAdoptionData, {
            users: [],
            activities: Object.entries(oppCounts).map(([dynamicsUserId, count]) => ({
                dynamicsUserId,
                entityType: "opportunities",
                count,
                syncedAt,
            })),
        });

        const automated = records.filter((r) => r.riivo_automatedopportunity === true).length;

        // Sample the first record's user fields so the caller can confirm
        // they are being returned correctly.
        const sample = records[0] ? {
            _owninguser_value: records[0]._owninguser_value ?? null,
            _createdby_value:  records[0]._createdby_value  ?? null,
            _modifiedby_value: records[0]._modifiedby_value ?? null,
        } : null;

        return NextResponse.json({
            success: true,
            syncedAt,
            totalRecords: records.length,
            automatedCount: automated,
            usersWithOppActivity: Object.keys(oppCounts).length,
            sampleUserFields: sample,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
