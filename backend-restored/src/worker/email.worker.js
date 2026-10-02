import { Worker } from "bullmq";
import nodemailer from "nodemailer";

import env from "../config/env.js";
import { logger } from "../config/logger.js";

const isTestMode = env.NODE_ENV === "test" || process.argv.some((arg) => arg === "--test" || arg.includes("node:test")) || process.execArgv.some((arg) => arg.includes("--test") || arg.includes("node:test"));

const connection = {
  host: "redis",
  port: 6379,
};

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 587),
  secure: Boolean(env.SMTP_SECURE),
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const emailWorker = isTestMode
  ? null
  : new Worker(
      "email",
      async (job) => {
        const { to, subject, html } = job.data;

        await transporter.sendMail({
          from: env.SMTP_FROM,
          to,
          subject,
          html,
        });

        logger.info({ jobId: job.id, to }, "Email job processed");
        return true;
      },
      { connection }
    );

if (emailWorker) {
  emailWorker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Email worker failed");
  });
}

export const closeEmailWorker = async () => {
  if (!emailWorker) {
    return;
  }

  try {
    await emailWorker.close();
  } catch (error) {
    logger.warn({ error }, "Email worker shutdown warning");
  }
};

export default emailWorker;
