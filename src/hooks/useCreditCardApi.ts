
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
      console.log('BankKaro API Response:', data);

      // Extract cards data from the response
      let cards = [];
      if (data.data && Array.isArray(data.data)) {
        cards = data.data;
      } else if (Array.isArray(data)) {
        cards = data;
      } else {
        console.log('Unexpected API response format:', data);
        return [];
      }

      // Filter results based on query if needed
      if (query && cards.length > 0) {
        const queryLower = query.toLowerCase();
        cards = cards.filter((card: CreditCard) => 
          card.card_name?.toLowerCase().includes(queryLower) ||
          card.bank_name?.toLowerCase().includes(queryLower) ||
          card.key_features?.toLowerCase().includes(queryLower) ||
          card.benefits?.toLowerCase().includes(queryLower)
        );
      }

      return cards.slice(0, 10); // Limit to top 10 results
    } catch (err) {
      console.error('Error fetching credit cards:', err);
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
