import Scheduling from "../models/schedulingSchema";
import TelegramBot from "node-telegram-bot-api";

function ShowManitorings(bot: TelegramBot, chatID: number) {
  Scheduling.find({ chatID: chatID })
    .then((schedules) => {
      if (schedules.length === 0) {
        bot.sendMessage(chatID, "مانیتورینگی تنظیم نشده است.", {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "ایجاد مانیتورینگ جدید",
                  callback_data: "create_new_scheduling",
                },
              ],
              [{ text: "بازگشت به منوی اصلی", callback_data: "main_menu" }],
            ],
          },
        });
      } else {
        const data = schedules.map((schedule) => {
          return [
            {
              text: `${schedule.domain} - ${schedule.interval}`,
              callback_data: `schedule_${schedule._id}`,
            },
          ];
        });

        bot.sendMessage(chatID, "مانیتورینگ شما:", {
          reply_markup: {
            inline_keyboard: [
              ...data,
              [
                {
                  text: "حذف تمام مانیتورینگ ها",
                  callback_data: "delete_all_scheduling",
                },
              ],
              [
                {
                  text: "افزودن مانیتورینگ جدید",
                  callback_data: "create_new_scheduling",
                },
              ],
            ],
          },
        });
      }
    })
    .catch((err) => {
      console.error("Error fetching schedules:", err);
      bot.sendMessage(chatID, "خطا در دریافت مانیتورینگ.");
    });
}

export default ShowManitorings;
