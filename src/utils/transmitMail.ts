import FormData from "form-data";
import Mailgun, { MailgunMessageData } from "mailgun.js";
import { API_ADDRESS, MAILGUN_API_KEY } from "../config.js";

const mailgun = new Mailgun(FormData);

const mg = mailgun.client({
  username: "emil.poppler@gmail.com",
  key: MAILGUN_API_KEY,
});

export async function sendSignupVerificaitonMail(
  name: string,
  email: string,
  code: number,
) {
  const data: MailgunMessageData = {
    from: "Netlight <mailgun@sandboxafedf727d548474ea6bc890395e70e14.mailgun.org>",
    to: [email],
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
    `,
  };

  mg.messages.create(
    "sandboxafedf727d548474ea6bc890395e70e14.mailgun.org",
    data,
  );
}

export async function sendForgotPasswordVerificaitonMail(
  name: string,
  email: string,
  code: number,
) {
  const data: MailgunMessageData = {
    from: "Netlight <mailgun@sandboxafedf727d548474ea6bc890395e70e14.mailgun.org>",
    to: [email],
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
    `,
  };

  mg.messages.create(
    "sandboxafedf727d548474ea6bc890395e70e14.mailgun.org",
    data,
  );
}
