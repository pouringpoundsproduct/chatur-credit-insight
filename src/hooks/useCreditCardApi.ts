
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
    
    console.log('🔍 BankKaro API - Starting enhanced search for:', query);

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
      console.log('📊 BankKaro API - Raw response received');

      // Extract cards data from the response
      let cards = [];
      if (data.data && Array.isArray(data.data)) {
        cards = data.data;
      } else if (Array.isArray(data)) {
        cards = data;
      } else {
        console.log('⚠️ BankKaro API - Unexpected response format');
        return [];
      }

      console.log(`📋 BankKaro API - Total cards found: ${cards.length}`);

      // Enhanced filtering with better relevance scoring
      if (query && query.trim().length > 2 && cards.length > 0) {
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(' ').filter(word => word.length > 2);
        
        console.log('🔎 BankKaro API - Applying enhanced filtering for:', queryWords);
        
        const scoredCards = cards.map((card: CreditCard) => {
          const searchableText = [
            card.card_name || '',
            card.bank_name || '',
            card.key_features || '',
            card.benefits || '',
            card.reward_rate || '',
            card.eligibility || ''
          ].join(' ').toLowerCase();

          let score = 0;
          
          // Exact phrase matching (highest score)
          if (searchableText.includes(queryLower)) {
            score += 10;
          }
          
          // Individual word matching
          queryWords.forEach(word => {
            if (searchableText.includes(word)) {
              score += 2;
            }
          });
          
          // Bank name specific matching
          if (card.bank_name && queryWords.some(word => 
            card.bank_name!.toLowerCase().includes(word)
          )) {
            score += 5;
          }
          
          // Card name specific matching
          if (card.card_name && queryWords.some(word => 
            card.card_name!.toLowerCase().includes(word)
          )) {
            score += 5;
          }
          
          // Feature-specific matching
          const featureWords = ['reward', 'cashback', 'lounge', 'travel', 'fuel', 'dining', 'fee'];
          featureWords.forEach(feature => {
            if (queryLower.includes(feature) && searchableText.includes(feature)) {
              score += 3;
            }
          });
          
          return { card, score };
        });
        
        // Filter cards with score > 0 and sort by score
        const filteredCards = scoredCards
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(item => item.card);
        
        console.log(`✅ BankKaro API - Enhanced filtering: ${cards.length} → ${filteredCards.length} cards`);
        
        // Return top 15 results for better variety
        return filteredCards.slice(0, 15);
      }

      // For empty or very short queries, return top cards
      const finalResults = cards.slice(0, 12);
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
