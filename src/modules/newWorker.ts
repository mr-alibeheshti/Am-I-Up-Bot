
import { startConsumers } from "./consumer";

if (process.env.LISTEN_TELEGRAM) {
  const bot = require('./TelegramService');
}

startConsumers();
console.log("Worker started");
