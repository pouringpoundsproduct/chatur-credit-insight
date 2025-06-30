
import { useState } from 'react';
import { SearchResult } from '@/utils/vectorSearch';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  source?: string;
  confidence?: number;
  data?: any;
  sourceDocuments?: SearchResult[];
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    addMessage,
    clearMessages
  };
};
