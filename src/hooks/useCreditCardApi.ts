
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

      // Less aggressive filtering - only filter if we have a meaningful query
      if (query && query.trim().length > 2 && cards.length > 0) {
        const queryLower = query.toLowerCase();
        
        console.log('🔎 BankKaro API - Applying basic filter for query:', queryLower);
        
        const filteredCards = cards.filter((card: CreditCard) => {
          const searchableText = [
            card.card_name || '',
            card.bank_name || '',
            card.key_features || '',
            card.benefits || '',
            card.reward_rate || '',
            card.eligibility || ''
          ].join(' ').toLowerCase();

          // Very basic matching - if query contains common words, return more results
          const commonWords = ['card', 'credit', 'bank', 'fee', 'reward', 'cashback', 'travel', 'lounge'];
          const hasCommonWord = commonWords.some(word => queryLower.includes(word));
          
          if (hasCommonWord) {
            // For common queries, return more cards but prioritize exact matches
            return searchableText.length > 0; // Return all cards with content
          }
          
          // For specific queries, look for partial matches
          const queryWords = queryLower.split(' ').filter(word => word.length > 2);
          return queryWords.some(word => searchableText.includes(word));
        });
        
        console.log(`✅ BankKaro API - Filtered from ${cards.length} to ${filteredCards.length} cards`);
        
        // If filtering results in too few cards, return more
        if (filteredCards.length < 3 && cards.length > 3) {
          console.log('🔄 BankKaro API - Too few results after filtering, returning top 10 cards');
          return cards.slice(0, 10);
        }
        
        return filteredCards.slice(0, 10);
      }

      // For empty or very short queries, return top cards
      const finalResults = cards.slice(0, 10);
      console.log(`🎯 BankKaro API - Returning ${finalResults.length} cards (no filtering applied)`);
      
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
