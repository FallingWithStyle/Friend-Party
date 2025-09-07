'use client';

import React, { useState, useEffect } from 'react';
import { LootCreationProps, DragonsHoardLoot, DragonsHoardPrompt } from '@/types/dragonsHoard';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

interface LootItem {
  prompt_id: string;
  name: string;
  description: string;
}

export function LootCreation({ prompts, onLootCreated, disabled = false }: LootCreationProps) {
  const [lootItems, setLootItems] = useState<LootItem[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize loot items array
  useEffect(() => {
    if (prompts.length > 0) {
      setLootItems(prompts.map(prompt => ({
        prompt_id: prompt.id,
        name: '',
        description: ''
      })));
    }
  }, [prompts]);

  const handleLootChange = (index: number, field: 'name' | 'description', value: string) => {
    setLootItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleNext = () => {
    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (disabled || isSubmitting) return;

    // Validate all loot items
    const hasEmptyNames = lootItems.some(item => !item.name.trim());
    if (hasEmptyNames) {
      setError('Please provide names for all loot items');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Submit each loot item
      for (const lootItem of lootItems) {
        const { data, error: insertError } = await supabase
          .from('dragons_hoard_loot')
          .insert({
            prompt_id: lootItem.prompt_id,
            name: lootItem.name.trim(),
            description: lootItem.description.trim() || null
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(`Failed to create loot item: ${insertError.message}`);
        }

        // Call the callback with the created loot
        onLootCreated({
          session_id: '', // This would be passed from parent
          creator_id: '', // This would be the current user ID
          prompt_id: lootItem.prompt_id,
          name: lootItem.name.trim(),
          description: lootItem.description.trim() || undefined
        });
      }

      // Reset form
      setLootItems(prompts.map(prompt => ({
        prompt_id: prompt.id,
        name: '',
        description: ''
      })));
      setCurrentPromptIndex(0);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create loot items';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = lootItems.every(item => item.name.trim().length > 0);
  const currentPrompt = prompts[currentPromptIndex];
  const currentLoot = lootItems[currentPromptIndex];

  if (prompts.length === 0) {
    return (
      <div className="loot-creation error">
        <h3>No Prompts Available</h3>
        <p>Please wait for prompts to be assigned.</p>
      </div>
    );
  }

  return (
    <div className="loot-creation">
      <h2>Create Your Loot Items</h2>
      <p>Create cursed or funny loot items based on the prompts. Be creative!</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="loot-creation-form">
        <div className="prompt-display">
          <div className="prompt-header">
            <span className="prompt-number">Prompt {currentPromptIndex + 1} of {prompts.length}</span>
            <span className="prompt-category">
              {currentPrompt.category.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="prompt-text">
            {currentPrompt.prompt_text}
          </div>
        </div>

        <div className="loot-input">
          <label htmlFor="loot-name">
            Loot Name *
          </label>
          <input
            id="loot-name"
            type="text"
            value={currentLoot.name}
            onChange={(e) => handleLootChange(currentPromptIndex, 'name', e.target.value)}
            placeholder="Enter a creative name for your loot item..."
            disabled={disabled}
            maxLength={100}
          />
          <small className="character-count">
            {currentLoot.name.length}/100 characters
          </small>
        </div>

        <div className="loot-input">
          <label htmlFor="loot-description">
            Description (Optional)
          </label>
          <textarea
            id="loot-description"
            value={currentLoot.description}
            onChange={(e) => handleLootChange(currentPromptIndex, 'description', e.target.value)}
            placeholder="Describe what this cursed item does..."
            disabled={disabled}
            maxLength={500}
            rows={3}
          />
          <small className="character-count">
            {currentLoot.description.length}/500 characters
          </small>
        </div>

        <div className="navigation">
          <button
            onClick={handlePrevious}
            disabled={currentPromptIndex === 0 || disabled}
            className="nav-btn prev-btn"
          >
            Previous
          </button>
          
          <span className="progress-indicator">
            {currentPromptIndex + 1} of {prompts.length}
          </span>

          {currentPromptIndex < prompts.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!currentLoot.name.trim() || disabled}
              className="nav-btn next-btn"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed || disabled || isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Creating Loot...' : 'Submit All Loot'}
            </button>
          )}
        </div>
      </div>

      <div className="loot-preview">
        <h3>Your Loot Items</h3>
        <div className="loot-list">
          {lootItems.map((item, index) => (
            <div key={index} className="loot-preview-item">
              <div className="loot-name">
                {item.name || `Loot Item ${index + 1}`}
              </div>
              {item.description && (
                <div className="loot-description">
                  {item.description}
                </div>
              )}
              <div className="loot-status">
                {item.name ? '✓ Complete' : '○ Incomplete'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
