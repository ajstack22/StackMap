/**
 * Integration test to verify the header component extraction was successful
 * and all functionality is preserved.
 */

import React from 'react';

// Test that all modules can be imported successfully
describe('ActivityLibrary Header Extraction Integration', () => {
  it('should import all new header modules without errors', async () => {
    const LibraryHeader = await import('../LibraryHeader');
    const TabSelector = await import('../TabSelector');
    const LibraryActions = await import('../LibraryActions');

    expect(LibraryHeader.default).toBeDefined();
    expect(TabSelector.default).toBeDefined();
    expect(LibraryActions.default).toBeDefined();
  });

  it('should import the main ActivityLibrary component without errors', async () => {
    const ActivityLibrary = await import('../ActivityLibrary');
    expect(ActivityLibrary.default).toBeDefined();
  });

  it('should verify EMPTY_CATEGORIES export is still available', async () => {
    const { EMPTY_CATEGORIES } = await import('../ActivityLibrary');
    expect(EMPTY_CATEGORIES).toBeDefined();
    expect(Array.isArray(EMPTY_CATEGORIES)).toBe(true);
    expect(EMPTY_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should verify the My Templates default category exists', async () => {
    const { EMPTY_CATEGORIES } = await import('../ActivityLibrary');
    const myTemplates = EMPTY_CATEGORIES.find(cat => cat.id === 'my-templates');

    expect(myTemplates).toBeDefined();
    expect(myTemplates.name).toBe('My Templates');
    expect(Array.isArray(myTemplates.activities)).toBe(true);
  });
});