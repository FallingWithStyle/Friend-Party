'use client';

import React, { useState, useEffect } from 'react';
import { HoardCollectionProps, DragonsHoardLootWithDetails } from '@/types/dragonsHoard';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export function HoardCollection({ partyId, hoard, lootDetails }: HoardCollectionProps) {
  const [expandedLoot, setExpandedLoot] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'category' | 'creator'>('date');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique categories for filtering
  const categories = Array.from(new Set(
    lootDetails.map(loot => loot.prompt.category)
  ));

  // Sort and filter loot items
  const sortedAndFilteredLoot = lootDetails
    .filter(loot => filterCategory === 'all' || loot.prompt.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'category':
          return a.prompt.category.localeCompare(b.prompt.category);
        case 'creator':
          return a.creator_name.localeCompare(b.creator_name);
        default:
          return 0;
      }
    });

  const toggleExpanded = (lootId: string) => {
    setExpandedLoot(expandedLoot === lootId ? null : lootId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cursed_items':
        return '👹';
      case 'goblin_market':
        return '🛒';
      case 'dragon_secrets':
        return '🐉';
      case 'cooking_weapons':
        return '🍳';
      default:
        return '⚔️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cursed_items':
        return 'cursed';
      case 'goblin_market':
        return 'market';
      case 'dragon_secrets':
        return 'secrets';
      case 'cooking_weapons':
        return 'cooking';
      default:
        return 'default';
    }
  };

  if (hoard.length === 0) {
    return (
      <div className="hoard-collection empty">
        <div className="empty-state">
          <h3>🏰 Empty Hoard</h3>
          <p>Your party hasn't collected any loot yet.</p>
          <p>Play Dragon's Hoard to start building your collection!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hoard-collection">
      <div className="hoard-header">
        <h3>🏰 Party Hoard Collection</h3>
        <div className="hoard-stats">
          <span className="total-items">{hoard.length} item{hoard.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="hoard-controls">
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="date">Date Added</option>
            <option value="category">Category</option>
            <option value="creator">Creator</option>
          </select>
        </div>

        <div className="filter-controls">
          <label htmlFor="filter-select">Filter:</label>
          <select
            id="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryIcon(category)} {category.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hoard-grid">
        {sortedAndFilteredLoot.map((loot) => (
          <div
            key={loot.id}
            className={`hoard-item ${getCategoryColor(loot.prompt.category)}`}
            onClick={() => toggleExpanded(loot.id)}
          >
            <div className="hoard-item-header">
              <div className="loot-icon">
                {getCategoryIcon(loot.prompt.category)}
              </div>
              <div className="loot-info">
                <h4 className="loot-name">{loot.name}</h4>
                <div className="loot-meta">
                  <span className="loot-category">
                    {loot.prompt.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="loot-creator">
                    by {loot.creator_name}
                  </span>
                </div>
              </div>
              <div className="expand-icon">
                {expandedLoot === loot.id ? '▼' : '▶'}
              </div>
            </div>

            {expandedLoot === loot.id && (
              <div className="hoard-item-details">
                <div className="loot-description">
                  {loot.description || 'No description provided.'}
                </div>
                <div className="loot-prompt">
                  <strong>Inspired by:</strong> {loot.prompt.prompt_text}
                </div>
                <div className="loot-date">
                  Added to hoard: {new Date(loot.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedAndFilteredLoot.length === 0 && filterCategory !== 'all' && (
        <div className="no-results">
          <p>No loot items found in the "{filterCategory.replace('_', ' ')}" category.</p>
          <button
            onClick={() => setFilterCategory('all')}
            className="clear-filter-btn"
          >
            Show All Items
          </button>
        </div>
      )}

      <div className="hoard-footer">
        <p>Your party's collection grows with each game of Dragon's Hoard!</p>
      </div>
    </div>
  );
}
