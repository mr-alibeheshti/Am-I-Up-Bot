import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export function configEmailService() {
  const MAIL_HOST = "process.env.MAIL_HOST";
  const MAIL_PORT = "process.env.MAIL_PORT";
  const MAIL_USER = "process.env.MAIL_USER";
  const MAIL_PASSWORD = "process.env.MAIL_PASSWORD";

  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASSWORD) {
    throw new Error("One or more mail environment variables are missing.");
  }

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    tls: true,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASSWORD,
    },
  } as nodemailer.TransportOptions);

  return transporter;
}

export function sendEmail(email: any, domain: String) {
  const transporter = configEmailService();

  transporter
    .sendMail({
      from: "AmUp?! <info@teenagedream.ir>",
      to: email,
      subject: "Your site is Down!!!",
      html: `⚠️ دامنه ${domain} در دسترس نیست <hr> برای مشاهده گزارشات اخیر به بات مراجعه کنید : https://t.me/am_up_bot`,
    })
    .then(() => console.log("OK, Email has been sent."))
    .catch((error) => console.error("Error sending email:", error));
}

export default { configEmailService, sendEmail };
