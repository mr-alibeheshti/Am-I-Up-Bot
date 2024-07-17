
import { startConsumers } from "./consumer";

if (process.env.IS_TELEGRAM_BOT) {
  const bot = require('./TelegramService');
}

startConsumers();
console.log("Worker started");
