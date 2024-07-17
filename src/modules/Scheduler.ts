import { scheduleJob, Job } from "node-schedule";
import axios from "axios";
import Scheduling from "../models/schedulingSchema";
import { configEmailService, sendEmail } from "./EmailService";
import bot from "./TelegramService";
import Report from "../models/reportSchema";

export const scheduledJobs: Map<string, Job> = new Map();

export const setupSchedules = async () => {
  try {
    const schedules = await Scheduling.find({});
    schedules.forEach((schedule: any) => {
      addSchedule(schedule);
    });
  } catch (error) {
    console.error("Error setting up schedules:", error);
  }
};

export const addSchedule = async (schedule: any) => {
  const job = scheduleJob(`*/${schedule.interval} * * * *`, async () => {
    try {
      const response = await axios.get(`http://${schedule.domain}`);
      const statusCode = response.status;
      if (statusCode !== 200) {
        if (schedule.typeNotification === "telegram") {
          bot.sendMessage(
            schedule.chatID,
            `⚠️ دامنه ${schedule.domain} در دسترس نیست`
          );
        } else {
          sendEmail(schedule.email, schedule.domain);
        }
      }
      await handleReport(schedule._id, statusCode, schedule.chatID);
    } catch (error: any) {
      console.error("Error checking domain:", error);
      if (schedule.typeNotification === "telegram") {
        bot.sendMessage(
          schedule.chatID,
          `⚠️ دامنه ${schedule.domain} در دسترس نیست`
        );
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
};

const handleReport = async (
  scheduleId: string,
  statusCode: number,
  chatId: number
) => {
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
    console.error("Error handling report:", error);
  }
};

export const deleteSchedule = (scheduleId: string) => {
  if (scheduledJobs.has(scheduleId)) {
    scheduledJobs.get(scheduleId)?.cancel();
    scheduledJobs.delete(scheduleId);
  }
};

export default { setupSchedules, addSchedule, deleteSchedule, scheduledJobs };
