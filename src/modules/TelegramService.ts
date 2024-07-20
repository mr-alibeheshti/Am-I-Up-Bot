import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import ShowManitorings from './ReportService';
import { Mainmenu, returnMenu, notifmenu } from './Menu';
import Scheduling from '../models/schedulingSchema';
import Report from '../models/reportSchema';
import { configEmailService, sendEmail } from './EmailService';
import setupSchedules from './producer'; 
import { addSchedule, deleteSchedule, scheduledJobs, startConsumers } from './consumer';

dotenv.config();

setupSchedules();
configEmailService();

interface ChatState {
  step: string;
  domain?: string;
  interval?: number;
  typeNotification?: string;
  scheduleId?: string;
  email?: string;
}

const token: string | undefined = "6945591609:AAGBMg-LW-hrA77cAz2lp2cSZd1G-mfNI_g";

const bot: TelegramBot = new TelegramBot(token, { polling: true });

let chatState: { [key: number]: ChatState } = {};

bot.onText(/^\/start$/, function (msg: TelegramBot.Message) {
  const chatId: number = msg.chat.id;
  bot.sendMessage(chatId, "لطفاً یک گزینه را انتخاب کنید:", Mainmenu);
  delete chatState[chatId];
});

bot.on("message", async (msg: TelegramBot.Message) => {
  const chatId: number = msg.chat.id;
  const text: string = msg.text ? msg.text.trim() : "";

  if (!chatState[chatId]) {
    chatState[chatId] = { step: "" };
  }

  if (text === "بازگشت به منوی اصلی") {
    delete chatState[chatId];
    bot.sendMessage(chatId, "لطفا یک گزینه را انتخاب کنید", Mainmenu);
    delete chatState[chatId];
    return;
  }

  if (chatState[chatId] && chatState[chatId].step) {
    switch (chatState[chatId].step) {
      case "enter_domain":
        chatState[chatId].domain = text;
        bot.sendMessage(chatId, "لطفا فاصله زمانی (به دقیقه) را وارد کنید:");
        chatState[chatId].step = "enter_interval";
        break;
      case "enter_interval":
        chatState[chatId].interval = parseInt(text, 10);
        bot.sendMessage(
          chatId,
          "گزارشات سایت شما را از کدام طریق اطلاع رسانی کنیم؟",
          notifmenu
        );
        chatState[chatId].step = "enter_notif_type";
        break;
      case "enter_email":
        chatState[chatId].email = text;
        if (chatState[chatId].typeNotification !== undefined) {
          const newScheduling = new Scheduling({
            chatID: chatId,
            domain: chatState[chatId].domain,
            interval: chatState[chatId].interval,
            typeNotification: chatState[chatId].typeNotification,
            email: chatState[chatId].email,
          });
          try {
            await newScheduling.save();
            await addSchedule(newScheduling);
            bot.sendMessage(chatId, "زمانبندی با موفقیت ثبت شد.", Mainmenu);
          } catch (error) {
            console.error("Error saving new scheduling:", error);
            bot.sendMessage(chatId, "خطا در ثبت زمانبندی.");
          }
          delete chatState[chatId];
        }
        break;
      case "enter_email_edit_step":
        if (text.trim().length === 0) {
          bot.sendMessage(chatId, "متن ورودی نمی‌تواند خالی باشد.");
          return;
        }
        try {
          const updateEmailSchedule = await Scheduling.findByIdAndUpdate(
            chatState[chatId].scheduleId,
            {
              email: text,
              typeNotification: chatState[chatId].typeNotification,
            },
            { new: true }
          );
          await deleteSchedule(chatState[chatId].scheduleId!);
          await addSchedule(updateEmailSchedule);
          bot.sendMessage(chatId, "ایمیل با موفقیت به‌روزرسانی شد.", Mainmenu);
        } catch (error) {
          console.error("Error updating Email:", error);
          bot.sendMessage(chatId, "خطا در به‌روزرسانی دامنه.");
        }
        delete chatState[chatId];
        break;
      case "edit_domain":
        if (text.trim().length === 0) {
          bot.sendMessage(chatId, "متن ورودی نمی‌تواند خالی باشد.");
          return;
        }
        try {
          const updateDomainSchedule = await Scheduling.findByIdAndUpdate(
            chatState[chatId].scheduleId,
            { domain: text },
            { new: true }
          );
          await deleteSchedule(chatState[chatId].scheduleId!);
          await addSchedule(updateDomainSchedule);
          bot.sendMessage(chatId, "دامنه با موفقیت به‌روزرسانی شد.", Mainmenu);
        } catch (error) {
          console.error("Error updating domain:", error);
          bot.sendMessage(chatId, "خطا در به‌روزرسانی دامنه.");
        }
        delete chatState[chatId];
        break;
      case "edit_interval":
        if (text.trim().length === 0) {
          bot.sendMessage(chatId, "متن ورودی نمی‌تواند خالی باشد.");
          return;
        }
        try {
          const updateIntervalSchedule = await Scheduling.findByIdAndUpdate(
            chatState[chatId].scheduleId,
            { interval: parseInt(text, 10) },
            { new: true }
          );
          await deleteSchedule(chatState[chatId].scheduleId!);
          await addSchedule(updateIntervalSchedule);
          bot.sendMessage(
            chatId,
            "فاصله زمانی با موفقیت به‌روزرسانی شد.",
            Mainmenu
          );
        } catch (error) {
          console.error("Error updating interval:", error);
          bot.sendMessage(chatId, "خطا در به‌روزرسانی فاصله زمانی.");
        }
        delete chatState[chatId];
        break;
      default:
    }
  } else {
    switch (text) {
      case "🌐 افزودن سایت جدید":
        bot.sendMessage(
          chatId,
          `شما در حال افزودن سایت جدید هستید \n لطفا نام دامنه مورد نظر را وارد نمایید : `,
          returnMenu
        );
        chatState[chatId] = { step: "enter_domain" };
        break;
      case "📱 مانیتورینگ های فعلی":
        ShowManitorings(bot, chatId);
        break;
      case "🤳 درباره ما":
        bot.sendMessage(
          chatId,
          "😊 اگر میخواهید از وضعیت لحظه ای وبسایت خود مطلع باشید و هر لحظه که با مشکلی مواجه شد یک دستیار این موضوع را به سرعت به شما اطلاع بدهد Am I Up گزینه مناسبی است :)"
        );
        break;
      case "📞 تماس با ما":
        bot.sendMessage(
          chatId,
          `😊 برای ارتباط با تیم پشتیبانی می‌توانید از طریق زیر اقدام کنید:\n📱 شماره تماس: 09929919382\n🤳 آیدی پشتیبانی: @alibeheshti1`
        );
        break;
      default:
        bot.sendMessage(chatId, "لطفا یکی از گزینه‌های منو را انتخاب کنید.");
    }
  }
});
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  const data = callbackQuery.data!;
  if (!chatId) return;
  if (!chatState[chatId]) {
    chatState[chatId] = { step: "" };
  }
  if (messageId !== undefined) {
    await bot.deleteMessage(chatId, messageId);
  }

  if (chatState[chatId].step === "edit_notif_type") {
    chatState[chatId].typeNotification = data;
    if (data === "email") {
      bot.sendMessage(chatId, "لطفا آدرس ایمیل خود را ارسال کنید:");
      chatState[chatId].step = "enter_email_edit_step";
    } else {
      try {
        const updatedTypeNotificationSchedule =
          await Scheduling.findByIdAndUpdate(
            chatState[chatId].scheduleId,
            { typeNotification: chatState[chatId].typeNotification },
            { new: true }
          );
        await deleteSchedule(chatState[chatId].scheduleId!);
        await addSchedule(updatedTypeNotificationSchedule);
        bot.sendMessage(
          chatId,
          "نوع اطلاع رسانی با موفقیت به روز رسانی شد",
          Mainmenu
        );
        delete chatState[chatId];
      } catch (error) {
        console.error("Error updating notification type:", error);
        bot.sendMessage(chatId, "خطا در به‌روزرسانی نوع اطلاع رسانی.");
      }
    }
  } else if (chatState[chatId].step === "enter_notif_type") {
    chatState[chatId].typeNotification = data;
    if (data === "email") {
      bot.sendMessage(chatId, "لطفا آدرس ایمیل خود را ارسال کنید:");
      chatState[chatId].step = "enter_email";
    } else {
      const newScheduling = new Scheduling({
        chatID: chatId,
        domain: chatState[chatId].domain,
        interval: chatState[chatId].interval,
        typeNotification: chatState[chatId].typeNotification,
      });
      try {
        await newScheduling.save();
        await addSchedule(newScheduling);
        bot.sendMessage(chatId, "زمانبندی با موفقیت ثبت شد.", Mainmenu);
        delete chatState[chatId];
      } catch (error) {
        console.error("Error saving new scheduling:", error);
        bot.sendMessage(chatId, "خطا در ثبت زمانبندی.");
      }
    }
  } else if (data.startsWith("change_notification_method_")) {
    const scheduleId = data.split("_")[3];
    console.log(scheduleId);
    bot.sendMessage(
      chatId,
      "گزارشات سایت شما را از کدام طریق اطلاع رسانی کنیم؟",
      notifmenu
    );
    chatState[chatId] = { step: "edit_notif_type", scheduleId: scheduleId };
  } else if (data.startsWith("schedule_")) {
    const scheduleId = data.split("_")[1];
    try {
      const schedule = await Scheduling.findById(scheduleId);
      if (schedule) {
        const reports = await Report.find({ scheduleId: scheduleId })
          .sort({ timestamp: -1 })
          .limit(15);

        let reportMessages = reports
          .map(
            (report) =>
              `ساعت: ${report.timestamp} - استاتوس کد: ${report.statusCode}`
          )
          .join("\n");
        if (!reportMessages) reportMessages = "گزارشی برای نمایش وجود ندارد.";

        bot.sendMessage(
          chatId,
          `دامنه: ${schedule.domain}\nفاصله زمانی: ${schedule.interval} دقیقه\nروش اطلاع رسانی : ${schedule.typeNotification}\n\nآخرین گزارش‌ها:\n${reportMessages}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "ویرایش فاصله زمانی",
                    callback_data: `edit_interval_${scheduleId}`,
                  },
                  {
                    text: "ویرایش دامنه",
                    callback_data: `edit_domain_${scheduleId}`,
                  },
                  {
                    text: "حذف زمان بندی",
                    callback_data: `delete_this_${scheduleId}`,
                  },
                ],
                [
                  {
                    text: "تغییر روش اطلاع رسانی",
                    callback_data: `change_notification_method_${scheduleId}`,
                  },
                ],
              ],
            },
          }
        );
      } else {
        bot.sendMessage(chatId, "زمانبندی یافت نشد.");
      }
    } catch (error) {
      console.error("Error handling callback query:", error);
      bot.sendMessage(chatId, "خطا در پردازش درخواست.");
    }
  } else if (data.startsWith("edit_interval_")) {
    const scheduleId = data.split("_")[2];
    bot.sendMessage(chatId, "لطفا فاصله زمانی جدید را وارد کنید (به دقیقه):");
    chatState[chatId] = { step: "edit_interval", scheduleId: scheduleId };
  } else if (data.startsWith("edit_domain_")) {
    const scheduleId = data.split("_")[2];
    bot.sendMessage(chatId, "لطفا دامنه جدید را وارد کنید:");
    chatState[chatId] = { step: "edit_domain", scheduleId: scheduleId };
  } else if (data.startsWith("delete_this_")) {
    const scheduleId = data.split("_")[2];
    try {
      await Scheduling.findByIdAndDelete(scheduleId);
      await Report.deleteMany({ scheduleId: scheduleId });
      await deleteSchedule(scheduleId);
      bot.sendMessage(chatId, "زمانبندی با موفقیت حذف شد.");
    } catch (error) {
      console.error("Error deleting scheduling:", error);
      bot.sendMessage(chatId, "خطا در حذف زمانبندی.");
    }
  } else if (data.startsWith("delete_all_scheduling")) {
    try {
      await Scheduling.deleteMany({ chatID: chatId });
      await Report.deleteMany({ chatID: chatId });
      scheduledJobs.forEach((job, jobId) => {
        job.cancel();
        scheduledJobs.delete(jobId);
      });
      bot.sendMessage(chatId, "تمامی زمانبندی‌ها با موفقیت حذف شدند.");
      bot.sendMessage(chatId, "لطفاً یک گزینه را انتخاب کنید:", Mainmenu);
    } catch (error) {
      console.error("Error deleting all scheduling:", error);
      bot.sendMessage(chatId, "خطا در حذف تمامی زمانبندی‌ها.");
    }
  } else if (data == "create_new_scheduling") {
    bot.sendMessage(
      chatId,
      "شما در حال افزودن سایت جدید هستید. لطفاً نام دامنه مورد نظر را وارد نمایید:",
      returnMenu
    );
    chatState[chatId] = { step: "enter_domain" };
  } else {
    console.error("Unexpected callback data:", data);
    bot.sendMessage(chatId, "درخواست نامعتبر.");
  }
});
scheduledJobs;
export const sendMessageforServer  = (chatId:number,text:string) =>{
  bot.sendMessage(chatId,text)
}
export default bot;