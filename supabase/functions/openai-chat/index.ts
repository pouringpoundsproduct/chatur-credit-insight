
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { query, context, systemPrompt } = await req.json();

    console.log('OpenAI Chat Request:', { query, hasContext: !!context });

    const messages = [
      {
        role: 'system',
        content: systemPrompt || `You are Chatur, a Credit Card AI Assistant created by BankKaro. 
        You help users with credit card queries. Be helpful, accurate, and friendly.
        If you don't have specific information, be honest about it.`
      }
    ];

    if (context) {
      messages.push({
        role: 'system',
        content: `Context information: ${context}`
      });
    }

    messages.push({
      role: 'user',
      content: query
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('OpenAI Response generated successfully');

    return new Response(JSON.stringify({ 
      text: generatedText,
      confidence: 85,
      source: 'OpenAI'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-chat function:', error);
    return new Response(JSON.stringify({ 
      text: "I'm experiencing some technical difficulties. Please try again in a moment.",
      confidence: 20,
      source: 'OpenAI',
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
