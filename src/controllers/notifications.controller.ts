import { Request, Response } from 'express';
import { sendTelegramMessage } from '../services/telegram.service';

export async function sendTelegram(req: Request, res: Response) {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ message: 'message is required and must be a string' });
  }

  try {
    const result = await sendTelegramMessage(message);
    return res.json({ ok: true, data: result });
  } catch (err: any) {
    console.error('Telegram send error:', err);
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}

export default { sendTelegram };
