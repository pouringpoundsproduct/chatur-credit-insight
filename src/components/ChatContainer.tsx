
import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import ChatMessage from '@/components/ChatMessage';
import LoadingState from '@/components/LoadingState';
import WelcomeScreen from '@/components/WelcomeScreen';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  source?: string;
  confidence?: number;
  data?: any;
  sourceDocuments?: any[];
}

interface ChatContainerProps {
  showWelcome: boolean;
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

const ChatContainer = ({ showWelcome, messages, isLoading, onSuggestionClick }: ChatContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Card className="flex-1 bg-gray-900/40 border-gray-700/50 backdrop-blur-sm flex flex-col min-h-0">
      <ScrollArea className="flex-1 p-4 md:p-6">
        {showWelcome ? (
          <WelcomeScreen onSuggestionClick={onSuggestionClick} />
        ) : (
          <div className="space-y-4 min-h-full">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <LoadingState />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default ChatContainer;
