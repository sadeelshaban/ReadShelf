import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadTemplate(filename: string): string {
  return readFileSync(join(process.cwd(), "supabase", "templates", filename), "utf8");
}

function renderTemplate(template: string, siteUrl: string, confirmationUrl: string): string {
  return template
    .replaceAll("{{ .SiteURL }}", siteUrl)
    .replaceAll("{{SITE_URL}}", siteUrl)
    .replaceAll("{{ .ConfirmationURL }}", confirmationUrl)
    .replaceAll("{{CONFIRMATION_URL}}", confirmationUrl);
}

export function confirmationEmailHtml(siteUrl: string, confirmationUrl: string): string {
  return renderTemplate(loadTemplate("confirmation.html"), siteUrl, confirmationUrl);
}

export function recoveryEmailHtml(siteUrl: string, confirmationUrl: string): string {
  return renderTemplate(loadTemplate("recovery.html"), siteUrl, confirmationUrl);
}
