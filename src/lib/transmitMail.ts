import { createTransport } from 'nodemailer';
import { google } from 'googleapis';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { API_ADDRESS, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_REDIRECT_URI } from '../config.js';

export enum VerificationType {
  Signup,
  ForgotPassword
}

const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

export async function sendVerificationToken(verificationType: VerificationType, name: string, email: string, code: number) {
  const accessToken = await oAuth2Client.getAccessToken();

  const transport = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: 'emil.poppler@gmail.com',
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken
    }
  } as SMTPTransport.Options);

  const mailOptions = createVerificationTokenMail(verificationType, name, email, code);

  try {
    await transport.sendMail(mailOptions);
  } catch {
    throw new Error();
  }
}

function createVerificationTokenMail(verificationType: VerificationType, name: string, email: string, code: number) {
  switch (verificationType) {
    case VerificationType.Signup: {
      return {
        from: 'Netlight <emil.poppler@gmail.com>',
        to: email,
        subject: "Signup verification",
        html: `
          <div style="width: 100%; height: 100%; margin: 0; background-color: #f6f9fc;">
            <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
              <div style="box-sizing: border-box; width: 100%; height: 70px; padding: 0 40px;">
                <div style="height: 100%; border-bottom: 1px solid #ebeef1;">
                  <img src="${API_ADDRESS}/images/logo.png" style="height: 100%;">
                </div>
              </div>
              <div style="box-sizing: border-box; padding: 0 40px;">
                <div style="border-bottom: 1px solid #ebeef1; padding: 32px 0;">
                  <span style="line-height: 28px; font-size: 20px; color: #32325d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Signup verification</span>
                  <span style="padding-top: 16px;display: block;font-size: 16px;color: #525f7f;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Hello ${name},</span>
                  <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">We are happy that you've chosen to sign up!</span>
                  <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">To complete your signup process, please verify your account by entering the verification code provided below:</span>
                  <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">${code}</span>
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
      };
    }

    case VerificationType.ForgotPassword: {
      return {
        from: 'Netlight <emil.poppler@gmail.com>',
        to: email,
        subject: "Forgot Password",
        html: `
          <div style="width: 100%; height: 100%; margin: 0; background-color: #f6f9fc;">
            <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
              <div style="box-sizing: border-box; width: 100%; height: 70px; padding: 0 40px;">
                <div style="height: 100%; border-bottom: 1px solid #ebeef1;">
                  <img src="${API_ADDRESS}/images/logo.png" style="height: 100%;">
                </div>
              </div>
              <div style="box-sizing: border-box; padding: 0 40px;">
                <div style="border-bottom: 1px solid #ebeef1; padding: 32px 0;">
                  <span style="line-height: 28px; font-size: 20px; color: #32325d; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Forgot your password?</span>
                  <span style="padding-top: 16px;display: block;font-size: 16px;color: #525f7f;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">Hello ${name},</span>
                  <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">We received a request to reset the password for your account.</span>
                  <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">To complete your password reset process, please verify your account by entering the verification code provided below:</span>
                  <span style="padding-top: 8px; display: block; font-size: 16px; color: #525f7f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu';">${code}</span>
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
      };
    }
  }
}