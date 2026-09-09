import { emailQueue } from "../../config/queue.js";

export const enqueuePasswordResetEmail = async (email, otp) => {
  await emailQueue.add(
    "password-reset",
    {
      to: email,
      subject: "CRT Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #dfe7ee; border-radius: 12px; background: #f8fafc; color: #0f172a;">
          <h2 style="margin-bottom: 16px;">Password Reset Request</h2>
          <p style="margin-bottom: 12px;">Use the code below to reset your password.</p>
          <div style="padding: 16px 20px; background: #0f172a; border-radius: 10px; color: #f8fafc; font-size: 28px; font-weight: 700; letter-spacing: 6px; text-align: center; width: max-content; min-width: 170px; margin: 18px auto;">
            ${otp}
          </div>
          <p style="margin: 0; color: #475569;">This code expires in 5 minutes.</p>
        </div>
      `,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};
