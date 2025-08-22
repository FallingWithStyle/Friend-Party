import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

describe('Tabs Components', () => {
  describe('Tabs', () => {
    it('renders with default props', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="tab1" className="custom-tabs">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const tabsContainer = screen.getByText('Tab 1').closest('[role="tablist"]')?.parentElement;
      expect(tabsContainer).toHaveClass('custom-tabs');
    });
  });

  describe('TabsList', () => {
    it('renders with default styling', () => {
      render(
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toBeInTheDocument();
      expect(tabsList).toHaveClass('inline-flex', 'h-10', 'items-center', 'justify-center');
    });

    it('applies custom className', () => {
      render(
        <TabsList className="custom-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      );

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('custom-list');
    });
  });

  describe('TabsTrigger', () => {
    it('renders with default styling', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab).toBeInTheDocument();
      expect(tab).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab).toHaveClass('custom-trigger');
    });

    it('handles disabled state', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" disabled>Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab).toBeDisabled();
    });
  });

  describe('TabsContent', () => {
    it('renders with default styling', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const content = screen.getByText('Content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('mt-2', 'ring-offset-background');
    });

    it('applies custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">Content</TabsContent>
        </Tabs>
      );

      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('Tab Interaction', () => {
    it('switches between tabs when clicked', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      fireEvent.click(tab2);

      expect(tab2).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('calls onValueChange when tab is clicked', () => {
      const onValueChange = vi.fn();
      render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      fireEvent.click(tab2);

      expect(onValueChange).toHaveBeenCalledWith('tab2');
    });
  });
});
