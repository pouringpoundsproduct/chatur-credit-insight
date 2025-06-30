
import { supabase } from '@/integrations/supabase/client';

export interface OpenAIResponse {
  text: string;
  confidence: number;
  source: 'OpenAI';
}

export const queryOpenAI = async (query: string, context?: string): Promise<OpenAIResponse> => {
  try {
    console.log('🤖 Calling OpenAI via Supabase Edge Function...');
    console.log('📝 Query:', query);
    console.log('📄 Context provided:', !!context);
    
    const { data, error } = await supabase.functions.invoke('openai-chat', {
      body: {
        query,
        context,
        systemPrompt: `You are Chatur, a Credit Card AI Assistant created by BankKaro. 
        You help users with credit card queries. Be helpful, accurate, and friendly.
        If you don't have specific information, be honest about it.`
      }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw new Error(error.message);
    }

    if (!data) {
      console.error('❌ No response from OpenAI service');
      throw new Error('No response from OpenAI service');
    }

    console.log('✅ OpenAI response received successfully');
    console.log('📊 Response confidence:', data.confidence || 70);
    
    return {
      text: data.text,
      confidence: data.confidence || 70,
      source: 'OpenAI'
    };

  } catch (error) {
    console.error('❌ Error calling OpenAI:', error);
    
    // Return a fallback response with clear error indication
    return {
      text: "I'm experiencing some technical difficulties connecting to my AI service. Please try rephrasing your question or contact support if the issue persists.",
      confidence: 30,
      source: 'OpenAI'
    };
  }
};

// Legacy function - kept for backward compatibility but now calls the Edge Function
export const callSupabaseOpenAI = async (query: string, context?: string) => {
  return queryOpenAI(query, context);
};
