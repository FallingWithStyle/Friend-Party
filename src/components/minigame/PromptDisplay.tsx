'use client';

import React, { useState, useEffect } from 'react';
import { PromptDisplayProps, DragonsHoardPrompt } from '@/types/dragonsHoard';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// Helper function to format category names for display
const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'goblin_market': 'Goblin Market',
    'dragons_hoard': 'Dragon\'s Hoard',
    'wizards_tower': 'Wizard\'s Tower',
    'rogues_hideout': 'Rogue\'s Hideout',
    'cursed_tomb': 'Cursed Tomb',
    'pirate_underwater': 'Pirate & Underwater',
    'giant_forest': 'Giant & Forest',
    'knight_tavern': 'Knight & Tavern'
  };
  
  return categoryMap[category] || category.replace('_', ' ').toUpperCase();
};

export function PromptDisplay({ prompts, onPromptsReady }: PromptDisplayProps) {
  const [assignedPrompts, setAssignedPrompts] = useState<DragonsHoardPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    assignPrompts();
  }, []);

  const assignPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all available categories
      const { data: categories, error: categoriesError } = await supabase
        .from('dragons_hoard_prompts')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null);

      if (categoriesError) {
        throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
      }

      if (!categories || categories.length === 0) {
        throw new Error('No categories available');
      }

      // Get unique categories
      const uniqueCategories = [...new Set(categories.map(c => c.category))];
      
      // Randomly select 2 categories
      const shuffled = uniqueCategories.sort(() => 0.5 - Math.random());
      const selectedCategories = shuffled.slice(0, 2);

      // Get one random prompt from each selected category
      const assignedPrompts: DragonsHoardPrompt[] = [];
      
      for (const category of selectedCategories) {
        const { data: categoryPrompts, error: promptError } = await supabase
          .from('dragons_hoard_prompts')
          .select('*')
          .eq('is_active', true)
          .eq('category', category)
          .order('random()')
          .limit(1)
          .single();

        if (promptError) {
          throw new Error(`Failed to fetch prompt for category ${category}: ${promptError.message}`);
        }

        if (categoryPrompts) {
          assignedPrompts.push(categoryPrompts);
        }
      }

      if (assignedPrompts.length === 0) {
        throw new Error('No prompts available for selected categories');
      }

      setAssignedPrompts(assignedPrompts);
      onPromptsReady();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign prompts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="prompt-display loading">
        <div className="loading-spinner"></div>
        <p>Assigning your prompts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prompt-display error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={assignPrompts} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="prompt-display">
      <h2>Your Loot Creation Prompts</h2>
      <p>Create two cursed or funny loot items based on these prompts:</p>
      
      <div className="prompts-container">
        {assignedPrompts.map((prompt, index) => (
          <div key={prompt.id} className="prompt-card">
            <div className="prompt-header">
              <span className="prompt-number">Prompt {index + 1}</span>
              <span className="prompt-category">{formatCategoryName(prompt.category)}</span>
            </div>
            <div className="prompt-text">
              {prompt.prompt_text}
            </div>
          </div>
        ))}
      </div>

      <div className="prompt-actions">
        <button 
          onClick={onPromptsReady}
          className="ready-btn"
        >
          I'm Ready to Create Loot!
        </button>
      </div>
    </div>
  );
}
