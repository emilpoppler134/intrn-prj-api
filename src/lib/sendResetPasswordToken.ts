import { createTransport } from 'nodemailer';
import { google } from 'googleapis';
import { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, REDIRECT_URI } from '../config';
import { EStatus } from './response.js';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export async function sendResetPasswordToken(email: string, name: string, code: number): Promise<EStatus> {
  const accessToken = await oAuth2Client.getAccessToken();
  const transport = createTransport({
    service: "gmail",
    auth: {
      type: 'OAuth2',
      user: '50archivese@gmail.com',
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken
    }
  } as SMTPTransport.Options);

  const mailOptions = {
    from: '50archive <50archivese@gmail.com>',
    to: email,
    subject: "Order Confirmation",
    html: `
      <div style="width: 100%; height: 100%; margin: 0; background-color: #f6f9fc;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
          <div style="box-sizing: border-box; width: 100%; height: 70px; padding: 0 40px;">
            <div style="height: 100%; border-bottom: 1px solid #ebeef1;">
              <img src="https://www.50archive.com/images/logo.svg" style="height: 100%;">
            </div>
          </div>
          <div style="box-sizing: border-box; padding: 0 40px;">
            <div style="border-bottom: 1px solid #ebeef1; padding: 32px 0;">
              <span style="line-height: 28px; font-size: 20px; color: #32325d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Forgot your password?</span>
              <span style="padding-top: 16px;display: block;font-size: 16px;color: #525f7f;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Hello ${name},</span>
              <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">We received a request to reset the password for your account.</span>
              <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Your reset code is: ${code}</span>
              <span style="padding-top: 16px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'    , 'Helvetica Neue', 'Ubuntu';">-- Netlight</span>
            </div>
          </div>
          <div style="padding: 20px 40px 64px 40px;">
            <span style="color: #8898aa; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif; font-size: 12px; line-height: 16px;">Netlight, Copyright©netlight.se</span>
          </div>
        </div>
        <div style="display:block; height: 64px; width: 100%;"></div>
      </div>
    `
  }

  try {
    await transport.sendMail(mailOptions);
    return EStatus.OK;
  } catch {
    return EStatus.ERROR
  }
}