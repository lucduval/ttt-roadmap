import { cronJobs } from "convex/server";

const crons = cronJobs();

// Dynamics sync is handled via Next.js API route (/api/sync-dynamics)
// since Dynamics blocks requests from Convex's cloud IPs.
// To automate, set up an external cron (e.g. Vercel Cron Jobs or cron-job.org)
// that POSTs to your deployed URL: https://your-app.vercel.app/api/sync-dynamics

export default crons;
