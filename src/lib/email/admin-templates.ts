import { formatStorageBytes } from "@/lib/admin/storage-usage";

export function storageNoticeEmailHtml(input: {
  siteUrl: string;
  storageBytes: number;
  bookCount: number;
}): string {
  const shelfUrl = `${input.siteUrl.replace(/\/$/, "")}/shelf`;
  const usageLabel = formatStorageBytes(input.storageBytes);
  const bookLabel = input.bookCount === 1 ? "1 book" : `${input.bookCount} books`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ReadShelf storage notice</title>
</head>
<body style="margin:0;padding:0;background:#FBF7F0;font-family:Georgia,'Times New Roman',serif;color:#3c2a21;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FBF7F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #eadbc8;border-radius:16px;padding:32px;">
          <tr>
            <td>
              <h1 style="margin:0 0 16px;font-size:24px;color:#7B4B2A;">Please free up shelf space</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;font-family:Arial,sans-serif;color:#5c4a3a;">
                Your ReadShelf library is currently using <strong>${usageLabel}</strong> across ${bookLabel}.
                We are running on limited trial storage, so please delete PDFs you no longer need from your shelf.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;font-family:Arial,sans-serif;color:#5c4a3a;">
                Open your shelf, remove finished or unused books, and upload again only what you still need.
              </p>
              <a href="${shelfUrl}" style="display:inline-block;background:#7B4B2A;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 20px;border-radius:10px;">
                Open my shelf
              </a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;font-family:Arial,sans-serif;color:#8a7968;">
                If you already cleaned up your library, you can ignore this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
