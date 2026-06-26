import { exec } from "child_process";
import { promisify } from "util";

const pexec = promisify(exec);
const ACCOUNT = process.env.GCP_ACCOUNT || "rami@emergedigital.com";
// Cloud Run (and other GCP compute) sets K_SERVICE; there we use the attached service
// account via the metadata server. Locally, this Mac's ADC drifts to the SES account,
// so we mint a token for a SPECIFIC gcloud account instead.
const ON_GCP = !!process.env.K_SERVICE;

let cached: { token: string; exp: number } = { token: "", exp: 0 };

async function fromMetadata(): Promise<{ token: string; ttlMs: number }> {
  const r = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  const j: any = await r.json();
  return { token: j.access_token, ttlMs: (j.expires_in || 3600) * 1000 };
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached.token && now < cached.exp) return cached.token;

  if (ON_GCP) {
    const { token, ttlMs } = await fromMetadata();
    cached = { token, exp: now + Math.max(60_000, ttlMs - 5 * 60 * 1000) };
    return token;
  }

  const { stdout } = await pexec(`gcloud auth print-access-token --account=${ACCOUNT}`, { maxBuffer: 1024 * 1024 });
  const token = stdout.trim();
  cached = { token, exp: now + 50 * 60 * 1000 };
  return token;
}
