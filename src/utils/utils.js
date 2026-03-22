export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const getOtpHtml = (otp) => {
  const safe = escapeHtml(otp);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid #e8ecf1;">
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #eef2f6;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.06em;color:#64748b;text-transform:uppercase;">Auth System</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <h1 style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:22px;font-weight:600;color:#0f172a;">Verification code</h1>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">Use this code to complete your sign-in. Do not share it with anyone.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 28px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;border-radius:10px;border:1px solid #e2e8f0;">
                <tr>
                  <td align="center" style="padding:28px 24px;">
                    <p style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.06em;color:#64748b;text-transform:uppercase;">Your code</p>
                    <p style="margin:0;font-family:Consolas,'Liberation Mono',Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#0f172a;">${safe}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;background-color:#fafbfc;border-top:1px solid #eef2f6;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:1.55;color:#94a3b8;">If you did not request this code, you can ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
