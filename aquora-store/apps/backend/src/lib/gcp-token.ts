import { exec } from "child_process";
import { promisify } from "util";

const pexec = promisify(exec);
const ACCOUNT = process.env.GCP_ACCOUNT || "rami@emergedigital.com";

// Drift-proof GCP auth: mint an access token for a SPECIFIC gcloud account,
// bypassing ADC (which silently drifts to the SES account on this machine).
// Tokens last ~60min; cache for 50.
let cached: { token: string; exp: number } = { token: "", exp: 0 };

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached.token && now < cached.exp) return cached.token;
  const { stdout } = await pexec(`gcloud auth print-access-token --account=${ACCOUNT}`, { maxBuffer: 1024 * 1024 });
  const token = stdout.trim();
  cached = { token, exp: now + 50 * 60 * 1000 };
  return token;
}
