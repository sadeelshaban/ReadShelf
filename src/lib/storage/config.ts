export type StorageProvider = "supabase" | "r2";

function hasR2Credentials() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

export function getStorageProvider(): StorageProvider {
  const explicit = process.env.STORAGE_PROVIDER?.trim().toLowerCase();
  if (explicit === "r2" || explicit === "supabase") {
    return explicit;
  }
  return hasR2Credentials() ? "r2" : "supabase";
}

export function isR2StorageEnabled() {
  return getStorageProvider() === "r2";
}
