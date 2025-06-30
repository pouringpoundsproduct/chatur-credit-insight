
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  message: string;
  isLoading: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const ChatInput = ({ message, isLoading, onMessageChange, onSendMessage, onKeyPress }: ChatInputProps) => {
  return (
    <div className="border-t border-gray-700/50 p-4 md:p-6">
      <div className="flex space-x-3">
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Ask me about credit cards..."
          className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 transition-all duration-300 text-sm md:text-base h-12"
          disabled={isLoading}
        />
        <Button
          onClick={onSendMessage}
          disabled={!message.trim() || isLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 px-4 h-12"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
