
import { Card } from '@/components/ui/card';
import { Bot, Sparkles } from 'lucide-react';

const funFacts = [
  "💳 Did you know? The first credit card was introduced in 1950!",
  "🎯 Cashback cards can save you up to 5% on purchases!",
  "✈️ Travel cards often waive foreign transaction fees!",
  "🛡️ Most credit cards offer zero fraud liability protection!",
  "💎 Premium cards often include airport lounge access!",
  "📱 Contactless payments are now accepted at 99% of merchants!",
  "🏆 Reward points never expire on many premium cards!",
  "🔒 EMV chip cards are 100x more secure than magnetic stripe!"
];

const LoadingState = () => {
  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start space-x-3 max-w-[80%]">
        <div className="p-2 rounded-full bg-gray-700 animate-pulse">
          <Bot className="w-4 h-4" />
        </div>
        
        <Card className="p-4 bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
            <span className="text-sm text-gray-400">Chatur is thinking...</span>
          </div>
          
          <div className="flex items-start space-x-2 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs text-blue-400 font-medium mb-1">Fun Fact</p>
              <p className="text-sm text-gray-300">{randomFact}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoadingState;
