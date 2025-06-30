
import { useState } from 'react';

interface CreditCard {
  card_name?: string;
  annual_fee?: string;
  key_features?: string;
  reward_rate?: string;
  eligibility?: string;
  bank_name?: string;
  card_network?: string;
  joining_fee?: string;
  benefits?: string;
}

export const useCreditCardApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCards = async (query: string): Promise<CreditCard[]> => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 BankKaro API - Starting search for:', query);

    try {
      const response = await fetch('https://bk-api.bankkaro.com/sp/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: "",
          banks_ids: [],
          card_networks: [],
          annualFees: "",
          credit_score: "",
          sort_by: "",
          free_cards: "",
          eligiblityPayload: {},
          cardGeniusPayload: {}
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 BankKaro API - Raw response received:', data);

      // Extract cards data from the response
      let cards = [];
      if (data.data && Array.isArray(data.data)) {
        cards = data.data;
      } else if (Array.isArray(data)) {
        cards = data;
      } else {
        console.log('⚠️ BankKaro API - Unexpected response format:', data);
        return [];
      }

      console.log(`📋 BankKaro API - Total cards found: ${cards.length}`);

      // Enhanced query-based filtering
      if (query && cards.length > 0) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(word => word.length > 2);
        
        console.log('🔎 BankKaro API - Filtering with keywords:', queryWords);
        
        cards = cards.filter((card: CreditCard) => {
          const searchableText = [
            card.card_name,
            card.bank_name,
            card.key_features,
            card.benefits,
            card.reward_rate,
            card.eligibility
          ].join(' ').toLowerCase();

          // Check if any query word matches
          const hasMatch = queryWords.some(word => searchableText.includes(word));
          
          // Special handling for specific queries
          const specificMatches = [
            // Bank names
            queryLower.includes('hdfc') && searchableText.includes('hdfc'),
            queryLower.includes('sbi') && searchableText.includes('sbi'),
            queryLower.includes('icici') && searchableText.includes('icici'),
            queryLower.includes('axis') && searchableText.includes('axis'),
            
            // Card types
            queryLower.includes('cashback') && searchableText.includes('cashback'),
            queryLower.includes('travel') && (searchableText.includes('travel') || searchableText.includes('miles')),
            queryLower.includes('premium') && searchableText.includes('premium'),
            queryLower.includes('regalia') && searchableText.includes('regalia'),
            
            // Features
            queryLower.includes('lounge') && searchableText.includes('lounge'),
            queryLower.includes('no annual fee') && (
              searchableText.includes('no annual fee') || 
              searchableText.includes('free') ||
              card.annual_fee === '0' ||
              card.annual_fee === 'Free'
            )
          ].some(Boolean);

          return hasMatch || specificMatches;
        });
        
        console.log(`✅ BankKaro API - Filtered to ${cards.length} relevant cards`);
      }

      const finalResults = cards.slice(0, 10); // Limit to top 10 results
      console.log(`🎯 BankKaro API - Returning ${finalResults.length} cards`);
      
      return finalResults;
    } catch (err) {
      console.error('❌ BankKaro API - Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchCards,
    isLoading,
    error
  };
};
