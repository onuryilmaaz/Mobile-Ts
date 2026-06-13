import { api } from '@/services/api';

export type ChatMessage = { role: 'user' | 'model'; text: string };

export const assistantApi = {
  chat: (messages: ChatMessage[]) =>
    api.post('/assistant/chat', { messages }),
};
