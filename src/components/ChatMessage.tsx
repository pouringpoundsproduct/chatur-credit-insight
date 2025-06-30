
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bot, User, ExternalLink, FileText } from 'lucide-react';
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

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'API':
        return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30';
      case 'MITC':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
      case 'OpenAI':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30';
      case 'System':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'API':
        return '🔌';
      case 'MITC':
        return '📚';
      case 'OpenAI':
        return '🤖';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-[85%]`}>
        <div className={`p-2 rounded-full ${message.isUser ? 'bg-blue-500' : 'bg-gray-700'} transition-all duration-300 hover:scale-110`}>
          {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <Card className={`p-4 ${
          message.isUser 
            ? 'bg-blue-600/20 border-blue-500/30' 
            : 'bg-gray-800/50 border-gray-700/50'
        } backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
          <div className="whitespace-pre-wrap text-sm leading-relaxed mb-2">
            {message.text}
          </div>
          
          {!message.isUser && (
            <>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/30">
                <div className="flex items-center space-x-2">
                  {message.source && (
                    <Badge className={`text-xs px-3 py-1 transition-all duration-300 cursor-pointer ${getSourceColor(message.source)}`}>
                      <span className="mr-1">{getSourceIcon(message.source)}</span>
                      {message.source}
                    </Badge>
                  )}
                  {message.confidence !== undefined && (
                    <span className={`text-xs font-medium ${getConfidenceColor(message.confidence)}`}>
                      {message.confidence}% confidence
                    </span>
                  )}
                </div>
                
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {/* Source Documents from MITC */}
              {message.sourceDocuments && message.sourceDocuments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <p className="text-xs text-blue-400 font-medium">Source Documents:</p>
                  </div>
                  <div className="space-y-2">
                    {message.sourceDocuments.slice(0, 2).map((result, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-lg p-2 border border-gray-700/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-300">
                            {result.chunk.metadata.cardName || 'Credit Card Info'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.similarity * 100)}% match
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {result.chunk.content.substring(0, 120)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Data Cards */}
              {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700/30">
                  <p className="text-xs text-green-400 font-medium mb-2 flex items-center">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Related Cards:
                  </p>
                  <div className="space-y-1">
                    {message.data.slice(0, 2).map((card: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-green-500/10 rounded p-2">
                        <span className="text-gray-300 font-medium">{card.card_name || 'Credit Card'}</span>
                        <span className="text-green-400">{card.annual_fee || 'Fee N/A'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatMessage;
