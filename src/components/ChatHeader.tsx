
import { CreditCard, Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  showWelcome: boolean;
  isInitialized: boolean;
  onNewChat: () => void;
  onBackToHome: () => void;
}

const ChatHeader = ({ showWelcome, isInitialized, onNewChat, onBackToHome }: ChatHeaderProps) => {
  return (
    <header className="sticky top-0 z-20 px-4 py-4 md:px-6 md:py-5 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/80">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-glow">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Chatur
            </h1>
            <p className="text-xs md:text-sm text-gray-400">Your Credit Card AI Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isInitialized && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
              Initializing...
            </Badge>
          )}
          
          {/* Navigation buttons with improved styling */}
          {!showWelcome && (
            <Button
              onClick={onBackToHome}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <Home className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          )}
          
          <Button
            onClick={onNewChat}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
