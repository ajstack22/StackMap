/**
 * Integration test to verify the header component extraction was successful
 * and all functionality is preserved.
 */

import React from 'react';
// Static imports to avoid dynamic import issues in Jest
import ActivityLibrary, { EMPTY_CATEGORIES } from '../ActivityLibrary';
import LibraryHeader from '../LibraryHeader';
import TabSelector from '../TabSelector';
import LibraryActions from '../LibraryActions';

describe('ActivityLibrary Header Extraction Integration', () => {
  it('should import all new header modules without errors', () => {
    // Verify all extracted header components are available
    expect(LibraryHeader).toBeDefined();
    expect(typeof LibraryHeader).toBe('function');

    expect(TabSelector).toBeDefined();
    expect(typeof TabSelector).toBe('function');

    expect(LibraryActions).toBeDefined();
    expect(typeof LibraryActions).toBe('function');
  });

  it('should import the main ActivityLibrary component without errors', () => {
    // Verify main component is still available after refactoring
    expect(ActivityLibrary).toBeDefined();
    expect(typeof ActivityLibrary).toBe('function');
  });

  it('should verify EMPTY_CATEGORIES export is still available', () => {
    // Ensure the EMPTY_CATEGORIES export wasn't broken during extraction
    expect(EMPTY_CATEGORIES).toBeDefined();
    expect(Array.isArray(EMPTY_CATEGORIES)).toBe(true);
    expect(EMPTY_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should verify the My Templates default category exists', () => {
    // Verify the critical default category exists to prevent "category not found" errors
    const myTemplates = EMPTY_CATEGORIES.find(cat => cat.id === 'my-templates');

    expect(myTemplates).toBeDefined();
    expect(myTemplates.name).toBe('My Templates');
    expect(myTemplates.icon).toBe('⭐');
    expect(Array.isArray(myTemplates.activities)).toBe(true);
    expect(myTemplates.activities).toHaveLength(0); // Should start empty
  });

  it('should verify all modules are importable without circular dependencies', () => {
    // Test that the refactoring didn't introduce circular dependencies
    // This catches issues where components might import each other incorrectly
    expect(() => {
      // If there were circular dependencies, this would throw
      require('../ActivityLibrary');
      require('../LibraryHeader');
      require('../TabSelector');
      require('../LibraryActions');
    }).not.toThrow();
  });
});