import { Resend } from 'resend';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface SendContactEmailParams {
  name: string;
  email: string;
  message: string;
  locale: 'th' | 'en';
  toEmails: string[];
  fromEmail: string;
  apiKey: string;
}

export async function sendContactEmail(
  params: SendContactEmailParams
): Promise<{ success: boolean }> {
  const { name, email, message, locale, toEmails, fromEmail, apiKey } = params;

  const resend = new Resend(apiKey);

  const escapedName = escapeHtml(name);
  const escapedEmail = escapeHtml(email);
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const localeLabel = locale === 'th' ? 'Thai' : 'English';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">New Contact Form Submission</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">Name</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${escapedName}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${escapedEmail}">${escapedEmail}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Locale</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${localeLabel}</td>
    </tr>
  </table>
  <h3 style="color: #333; margin-top: 20px;">Message</h3>
  <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
${escapedMessage}
  </div>
</body>
</html>
`.trim();

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmails,
    replyTo: email,
    subject: `Contact Form: ${name}`,
    html,
  });

  return { success: !error };
}
