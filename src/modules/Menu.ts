import { SendMessageOptions } from "node-telegram-bot-api";

export const Mainmenu: SendMessageOptions = {
  reply_markup: {
    keyboard: [
      [{ text: "🌐 افزودن سایت جدید" }],
      [{ text: "📱 مانیتورینگ های فعلی" }],
      [{ text: "🤳 درباره ما" }, { text: "📞 تماس با ما" }],
    ],
    resize_keyboard: true,
  },
};

export const returnMenu: SendMessageOptions = {
  reply_markup: {
    keyboard: [[{ text: "بازگشت به منوی اصلی" }]],
    resize_keyboard: true,
  },
};
export const notifmenu: SendMessageOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Telegram", callback_data: "telegram" },
        { text: "Email", callback_data: "email" },
      ],
    ],
    resize_keyboard: true,
  },
};

export default { Mainmenu, returnMenu, notifmenu };
