import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import {
  getFilteredActivities,
  getFilteredCategories,
  useFilterControls,
  categoryHasMatchingActivities,
  getSearchSuggestions,
  highlightSearchMatch,
} from '../FilterControls';

describe('FilterControls', () => {
  const mockActivities = [
    { id: '1', text: 'Running', icon: '🏃', description: 'Cardio exercise' },
    { id: '2', text: 'Swimming', icon: '🏊', description: 'Water sport' },
    { id: '3', text: 'Cycling', icon: '🚴', description: 'Bike exercise' },
  ];

  const mockCategories = [
    {
      id: 'fitness',
      name: 'Fitness',
      activities: mockActivities,
    },
    {
      id: 'sports',
      name: 'Sports',
      activities: [
        { id: '4', text: 'Football', icon: '⚽', description: 'Team sport' },
        { id: '5', text: 'Basketball', icon: '🏀', description: 'Court sport' },
      ],
    },
  ];

  const mockStackMapLibrary = {
    activityGroups: [
      {
        id: 'outdoor',
        name: 'Outdoor Activities',
        activities: [
          { id: '6', text: 'Hiking', icon: '🥾', description: 'Mountain walking' },
        ],
      },
    ],
  };

  describe('getFilteredActivities', () => {
    it('returns all activities when no search query', () => {
      const result = getFilteredActivities(mockActivities, '');
      expect(result).toEqual(mockActivities);
    });

    it('filters activities by text', () => {
      const result = getFilteredActivities(mockActivities, 'run');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Running');
    });

    it('filters activities by icon', () => {
      const result = getFilteredActivities(mockActivities, '🏊');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Swimming');
    });

    it('is case insensitive', () => {
      const result = getFilteredActivities(mockActivities, 'SWIM');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Swimming');
    });

    it('returns empty array when no matches', () => {
      const result = getFilteredActivities(mockActivities, 'xyz');
      expect(result).toHaveLength(0);
    });
  });

  describe('getFilteredCategories', () => {
    it('returns all categories when no search query', () => {
      const result = getFilteredCategories(mockCategories, null, 'mylibrary', '');
      expect(result).toEqual(mockCategories);
    });

    it('filters categories by name', () => {
      const result = getFilteredCategories(mockCategories, null, 'mylibrary', 'fitness');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fitness');
    });

    it('filters categories by activities within them', () => {
      const result = getFilteredCategories(mockCategories, null, 'mylibrary', 'football');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sports');
    });

    it('uses stackmap library when activeTab is stackmap', () => {
      const result = getFilteredCategories(mockCategories, mockStackMapLibrary, 'stackmap', '');
      expect(result).toEqual(mockStackMapLibrary.activityGroups);
    });

    it('filters stackmap library categories', () => {
      const result = getFilteredCategories(mockCategories, mockStackMapLibrary, 'stackmap', 'hiking');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Outdoor Activities');
    });
  });

  describe('useFilterControls', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useFilterControls());

      expect(result.current.searchQuery).toBe('');
      expect(result.current.activeTab).toBe('stackmap');
      expect(result.current.filteredCategories).toEqual([]);
    });

    it('handles search query changes', () => {
      const { result } = renderHook(() => useFilterControls(mockCategories));

      // First change to mylibrary tab since default is stackmap
      act(() => {
        result.current.handleTabChange('mylibrary');
      });

      act(() => {
        result.current.handleSearchChange('fitness');
      });

      expect(result.current.searchQuery).toBe('fitness');
      expect(result.current.filteredCategories).toHaveLength(1);
    });

    it('handles search clear', () => {
      const { result } = renderHook(() => useFilterControls(mockCategories));

      // First change to mylibrary tab since default is stackmap
      act(() => {
        result.current.handleTabChange('mylibrary');
      });

      act(() => {
        result.current.handleSearchChange('fitness');
      });

      act(() => {
        result.current.handleSearchClear();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.filteredCategories).toEqual(mockCategories);
    });

    it('handles tab changes', () => {
      const { result } = renderHook(() => useFilterControls(mockCategories, mockStackMapLibrary));

      act(() => {
        result.current.handleTabChange('mylibrary');
      });

      expect(result.current.activeTab).toBe('mylibrary');
      expect(result.current.searchQuery).toBe(''); // Should clear search on tab change
    });

    it('clears search when changing tabs', () => {
      const { result } = renderHook(() => useFilterControls(mockCategories));

      act(() => {
        result.current.handleSearchChange('test');
      });

      act(() => {
        result.current.handleTabChange('mylibrary');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('categoryHasMatchingActivities', () => {
    const category = mockCategories[0];

    it('returns true when no search query', () => {
      const result = categoryHasMatchingActivities(category, '');
      expect(result).toBe(true);
    });

    it('returns true when activity matches', () => {
      const result = categoryHasMatchingActivities(category, 'running');
      expect(result).toBe(true);
    });

    it('returns false when no activities match', () => {
      const result = categoryHasMatchingActivities(category, 'football');
      expect(result).toBe(false);
    });
  });

  describe('getSearchSuggestions', () => {
    it('returns suggestions from category names and activities', () => {
      const suggestions = getSearchSuggestions(mockCategories, 10);

      expect(suggestions).toContain('fitness');
      expect(suggestions).toContain('sports');
      expect(suggestions).toContain('running');
      expect(suggestions).toContain('swimming');
    });

    it('respects max suggestions limit', () => {
      const suggestions = getSearchSuggestions(mockCategories, 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('returns unique suggestions', () => {
      const categoriesWithDuplicates = [
        {
          id: '1',
          name: 'Fitness',
          activities: [{ id: '1', text: 'Fitness', icon: '💪' }],
        },
      ];

      const suggestions = getSearchSuggestions(categoriesWithDuplicates);
      const uniqueSuggestions = [...new Set(suggestions)];

      expect(suggestions.length).toBe(uniqueSuggestions.length);
    });
  });

  describe('highlightSearchMatch', () => {
    it('returns original text when no search query', () => {
      const result = highlightSearchMatch('Running', '');
      expect(result).toBe('Running');
    });

    it('returns original text when no match found', () => {
      const result = highlightSearchMatch('Running', 'xyz');
      expect(result).toBe('Running');
    });

    it('returns text when match found', () => {
      const result = highlightSearchMatch('Running', 'run');
      expect(result).toBe('Running'); // This is a simple implementation
    });

    it('handles empty text', () => {
      const result = highlightSearchMatch('', 'test');
      expect(result).toBe('');
    });
  });
});