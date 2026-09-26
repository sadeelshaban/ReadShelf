import { createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const ENV_FILE = join(process.cwd(), ".env.local");
const WRANGLER_CONFIG = join(
  homedir(),
  "AppData",
  "Roaming",
  "xdg.config",
  ".wrangler",
  "config",
  "default.toml",
);

function loadEnvFile() {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() ?? "";
const BUCKET_NAME = process.env.R2_BUCKET_NAME?.trim() || "readshelf";
const TOKEN_NAME = "readshelf-app";

function readWranglerOAuthToken() {
  if (!existsSync(WRANGLER_CONFIG)) {
    throw new Error("Wrangler is not logged in. Run: npx wrangler login");
  }

  const match = readFileSync(WRANGLER_CONFIG, "utf8").match(
    /oauth_token\s*=\s*"([^"]+)"/,
  );
  if (!match) {
    throw new Error("Could not read wrangler OAuth token.");
  }
  return match[1];
}

async function cloudflareApi(path, method, body, token) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    const message =
      json.errors?.map((e) => e.message).join("; ") || response.statusText;
    throw new Error(message);
  }
  return json.result;
}

function upsertEnvVar(name, value) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split("\n") : [];
  const filtered = lines.filter((line) => !line.startsWith(`${name}=`));
  filtered.push(`${name}=${value}`);
  writeFileSync(ENV_FILE, filtered.join("\n"), "utf8");
}

if (!ACCOUNT_ID) {
  console.error("Set R2_ACCOUNT_ID in .env.local before creating an R2 token.");
  process.exit(1);
}

const oauthToken = readWranglerOAuthToken();

console.log("Fetching R2 permission groups...");
let permissionGroups;
try {
  permissionGroups = await cloudflareApi(
    `/accounts/${ACCOUNT_ID}/tokens/permission_groups`,
    "GET",
    null,
    oauthToken,
  );
} catch {
  console.error("");
  console.error("Cannot create R2 keys automatically with wrangler login.");
  console.error("Cloudflare only shows the Secret Access Key once in the dashboard.");
  console.error("");
  console.error("Quick manual step (~1 minute):");
  console.error("  1. https://dash.cloudflare.com/?to=/:account/r2/overview");
  console.error("  2. Manage R2 API Tokens -> Create API token");
  console.error("  3. Object Read & Write -> bucket readshelf");
  console.error("  4. Run: npm run save:r2-keys");
  console.error("");
  process.exit(1);
}

const writeGroup = permissionGroups.find(
  (group) => group.name === "Workers R2 Storage Bucket Item Write",
);

if (!writeGroup) {
  throw new Error("Could not find Workers R2 Storage Bucket Item Write permission.");
}

const bucketResource = `com.cloudflare.edge.r2.bucket.${ACCOUNT_ID}_default_${BUCKET_NAME}`;

console.log("Creating R2 API token...");
const tokenResult = await cloudflareApi(
  `/accounts/${ACCOUNT_ID}/tokens`,
  "POST",
  {
    name: TOKEN_NAME,
    policies: [
      {
        effect: "allow",
        resources: {
          [bucketResource]: "*",
        },
        permission_groups: [{ id: writeGroup.id }],
      },
    ],
  },
  oauthToken,
);

const accessKeyId = tokenResult.id;
const secretAccessKey = createHash("sha256")
  .update(tokenResult.value)
  .digest("hex");

upsertEnvVar("R2_ACCOUNT_ID", ACCOUNT_ID);
upsertEnvVar("R2_ACCESS_KEY_ID", accessKeyId);
upsertEnvVar("R2_SECRET_ACCESS_KEY", secretAccessKey);
upsertEnvVar("R2_BUCKET_NAME", BUCKET_NAME);
upsertEnvVar("STORAGE_PROVIDER", "r2");

console.log("Saved R2 credentials to .env.local");
