import type { Channel, IncomingMessage, OutgoingMessage } from './types';

export interface TelegramConfig {
  botToken: string;
  secretToken?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number };
    text?: string;
  };
}

export class TelegramChannel implements Channel {
  private apiBase: string;

  constructor(private config: TelegramConfig) {
    this.apiBase = `https://api.telegram.org/bot${config.botToken}`;
  }

  async verify(request: Request): Promise<boolean> {
    if (!this.config.secretToken) return true;
    const token = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    return token === this.config.secretToken;
  }

  async parse(request: Request): Promise<IncomingMessage | null> {
    const update = (await request.json()) as TelegramUpdate;
    const msg = update.message;
    if (!msg?.text) return null;

    return {
      channelType: 'telegram',
      messageId: `tg_${update.update_id}`,
      sessionId: `tg_${msg.chat.id}`,
      userId: `tg_user_${msg.from.id}`,
      text: msg.text,
      raw: update,
      metadata: {
        firstName: msg.from.first_name,
        username: msg.from.username,
        chatId: msg.chat.id,
      },
    };
  }

  async send(message: OutgoingMessage, incoming: IncomingMessage): Promise<void> {
    const chatId = incoming.metadata?.chatId;
    if (!chatId) return;
    const chunks = this.splitMessage(message.text);
    for (const chunk of chunks) {
      await fetch(`${this.apiBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: chunk, parse_mode: 'Markdown' }),
      });
    }
  }

  async sendTyping(chatId: number): Promise<void> {
    await fetch(`${this.apiBase}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });
  }

  private splitMessage(text: string, maxLen = 4096): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxLen) chunks.push(text.slice(i, i + maxLen));
    return chunks;
  }
}
