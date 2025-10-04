import axios from 'axios';
import { env } from '../config/env';

export type TelegramSendResponse = {
  ok: boolean;
  result?: any;
  description?: string;
};

export async function sendTelegramMessage(message: string): Promise<TelegramSendResponse> {
  if (!env.telegram.botToken) {
    throw new Error('Telegram bot token is not configured (TELEGRAM_BOT_TOKEN)');
  }

  if (!env.telegram.chatId) {
    throw new Error('Telegram chat id is not configured (TELEGRAM_CHAT_ID)');
  }

  const url = `${env.telegram.apiBase}/bot${env.telegram.botToken}/sendMessage`;

  const response = await axios.post(url, {
    chat_id: env.telegram.chatId,
    text: message,
    parse_mode: 'Markdown'
  });

  return response.data as TelegramSendResponse;
}

export default { sendTelegramMessage };