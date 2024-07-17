import amqp from 'amqplib/callback_api';
import axios from 'axios';
import { scheduleJob } from 'node-schedule';
import { sendEmail } from './EmailService';
import Report from '../models/reportSchema';

export const scheduledJobs = new Map();

export function startConsumers() {
    amqp.connect('amqp://localhost', function (error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function (error1, channel) {
        if (error1) {
          throw error1;
        }
        const queue = 'schedule_queue';

        channel.assertQueue(queue, {
          durable: true
        });

        channel.prefetch(1);

        channel.consume(queue, function (msg) {
          if (msg !== null) {
            const schedule = JSON.parse(msg.content.toString());
            addSchedule(schedule);
            console.log(channel.ack(msg));
          }
        });
      });
    });
  }

export async function addSchedule(schedule:any) {
  const job = scheduleJob(`*/${schedule.interval} * * * *`, async () => {
    try {
      const response = await axios.get(`http://${schedule.domain}`);
      const statusCode = response.status;
      if (statusCode !== 200) {
        if (schedule.typeNotification === 'telegram') {
          if (process.env.IS_TELEGRAM_BOT) {
            const bot = await import('./TelegramService');
            bot.default.sendMessage(
              schedule.chatID,
              `⚠️ دامنه ${schedule.domain} در دسترس نیست`
            );
          }
        } else {
          sendEmail(schedule.email, schedule.domain);
        }
      }
      await handleReport(schedule._id, statusCode, schedule.chatID);
    } catch (error:any) {
      console.error('Error checking domain:', error);
      if (schedule.typeNotification === 'telegram') {
        if (process.env.IS_TELEGRAM_BOT) {
          const bot = await import('./TelegramService');
          bot.default.sendMessage(
            schedule.chatID,
            `⚠️ دامنه ${schedule.domain} در دسترس نیست`
          );
        }
      } else {
        sendEmail(schedule.email, schedule.domain);
      }
      await handleReport(
        schedule._id,
        error.response ? error.response.status : 500,
        schedule.chatID
      );
    }
  });
  scheduledJobs.set(schedule._id.toString(), job);
}

async function handleReport(scheduleId:any, statusCode:any, chatId:any) {
  try {
    await new Report({
      scheduleId: scheduleId,
      statusCode: statusCode,
      chatID: chatId,
    }).save();

    const reportCount = await Report.countDocuments({ scheduleId: scheduleId });
    if (reportCount > 15) {
      const oldestReport = await Report.findOne({
        scheduleId: scheduleId,
      }).sort({ timestamp: 1 });
      if (oldestReport) {
        await Report.deleteOne({ _id: oldestReport._id });
      }
    }
  } catch (error) {
    console.error('Error handling report:', error);
  }
}

export function deleteSchedule(scheduleId:any) {
  if (scheduledJobs.has(scheduleId)) {
    scheduledJobs.get(scheduleId)?.cancel();
    scheduledJobs.delete(scheduleId);
  }
}

export default { addSchedule, startConsumers, deleteSchedule, scheduledJobs };
