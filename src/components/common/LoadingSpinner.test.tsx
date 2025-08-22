import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default structure', () => {
    render(<LoadingSpinner />);
    
    // Check that the overlay div exists
    const overlay = screen.getByAltText('Loading...').closest('.loading-overlay');
    expect(overlay).toBeInTheDocument();
    
    // Check that the image exists with correct alt text
    const image = screen.getByAltText('Loading...');
    expect(image).toBeInTheDocument();
    expect(image).toHaveClass('loading-spinner');
  });

  it('renders with correct image attributes', () => {
    render(<LoadingSpinner />);
    
    const image = screen.getByAltText('Loading...');
    expect(image).toHaveAttribute('src', '/d20.svg');
    expect(image).toHaveAttribute('width', '64');
    expect(image).toHaveAttribute('height', '64');
  });

  it('has correct CSS classes', () => {
    render(<LoadingSpinner />);
    
    const overlay = screen.getByAltText('Loading...').closest('.loading-overlay');
    expect(overlay).toHaveClass('loading-overlay');
    
    const image = screen.getByAltText('Loading...');
    expect(image).toHaveClass('loading-spinner');
  });
});
