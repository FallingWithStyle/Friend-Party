'use client';

import { useState } from 'react';
import './page.css';

export default function SuggestionsPage() {
  const [suggestion, setSuggestion] = useState('');
  const [suggestionType, setSuggestionType] = useState('other');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!suggestion.trim()) {
      alert('Please enter a suggestion before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion_text: suggestion.trim(),
          suggestion_type: suggestionType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit suggestion');
      }

      setSubmitted(true);
      setSuggestion('');
      setSuggestionType('other');
      
      // Reset the submitted state after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert(`There was an error submitting your suggestion: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="suggestions-container">
      <div className="suggestions-content">
        <h1 className="suggestions-title">Suggestions & Feedback</h1>
        
        <div className="suggestions-intro">
          <p>
            We'd love to hear your ideas for improving Friend Party! Whether it's a new feature, 
            a bug fix, or just a general suggestion, your input helps us make the app better for everyone.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="suggestions-form">
          <div className="form-group">
            <label htmlFor="suggestion-type" className="form-label">
              Type of Suggestion
            </label>
            <select
              id="suggestion-type"
              value={suggestionType}
              onChange={(e) => setSuggestionType(e.target.value)}
              className="form-select"
              required
            >
              <option value="feature">New Feature</option>
              <option value="bug">Bug Report</option>
              <option value="ui_ux">UI/UX Improvement</option>
              <option value="performance">Performance</option>
              <option value="accessibility">Accessibility</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="suggestion" className="form-label">
              Your Suggestion
            </label>
            <textarea
              id="suggestion"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Share your ideas, report bugs, or suggest improvements..."
              className="form-textarea"
              rows={6}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={submitted || isSubmitting}
          >
            {submitted ? 'Thank You!' : isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>

        {submitted && (
          <div className="success-message">
            <p>Thank you for your suggestion! We'll review it and consider it for future updates.</p>
          </div>
        )}

        <div className="suggestions-info">
          <h2>What kind of suggestions are we looking for?</h2>
          <ul>
            <li><strong>New Features:</strong> Ideas for additional functionality or game modes</li>
            <li><strong>UI/UX Improvements:</strong> Ways to make the interface more intuitive or visually appealing</li>
            <li><strong>Bug Reports:</strong> Issues you've encountered while using the app</li>
            <li><strong>Performance:</strong> Suggestions for making the app faster or more responsive</li>
            <li><strong>Accessibility:</strong> Ideas for making the app more accessible to all users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
