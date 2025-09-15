// Layout Comparison Tool - Paste this into browser console
// Usage:
// 1. Run captureLayout('before') on first screen
// 2. Navigate/change to second screen
// 3. Run captureLayout('after')
// 4. Run compareLayouts() to see differences

window.layoutCaptures = window.layoutCaptures || {};

function captureLayout(name = 'capture') {
  const elements = document.querySelectorAll('*');
  const layoutData = {};

  elements.forEach((el, index) => {
    // Skip text nodes and scripts
    if (el.nodeType !== 1 || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;

    // Create unique identifier
    const id = el.id || el.className || `${el.tagName.toLowerCase()}_${index}`;
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);

    // Only capture visible elements
    if (rect.width === 0 && rect.height === 0) return;
    if (styles.display === 'none' || styles.visibility === 'hidden') return;

    // Detect columns
    const children = Array.from(el.children);
    let columnInfo = null;
    if (children.length > 0) {
      const childRects = children.map(c => c.getBoundingClientRect());
      const uniqueLefts = [...new Set(childRects.map(r => Math.round(r.left)))];
      const uniqueTops = [...new Set(childRects.map(r => Math.round(r.top)))];

      if (uniqueLefts.length > 1 && uniqueTops.length === 1) {
        columnInfo = {
          type: 'horizontal',
          columns: uniqueLefts.length,
          childrenPerColumn: Math.ceil(children.length / uniqueLefts.length)
        };
      } else if (styles.display === 'flex' && styles.flexWrap === 'wrap' && children.length > 2) {
        const firstChildWidth = childRects[0]?.width || 0;
        const containerWidth = rect.width;
        const estimatedColumns = Math.floor(containerWidth / firstChildWidth);
        if (estimatedColumns > 1) {
          columnInfo = {
            type: 'flex-wrap',
            estimatedColumns,
            childWidth: firstChildWidth,
            containerWidth
          };
        }
      }
    }

    layoutData[id] = {
      tag: el.tagName,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
      },
      styles: {
        display: styles.display,
        position: styles.position,
        flexDirection: styles.flexDirection,
        flexWrap: styles.flexWrap,
        justifyContent: styles.justifyContent,
        alignItems: styles.alignItems,
        alignContent: styles.alignContent,
        gridTemplateColumns: styles.gridTemplateColumns,
        padding: styles.padding,
        margin: styles.margin,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        overflow: styles.overflow,
        zIndex: styles.zIndex,
        transform: styles.transform,
        width: styles.width,
        maxWidth: styles.maxWidth,
        minWidth: styles.minWidth
      },
      text: el.innerText ? el.innerText.substring(0, 50) : '',
      childCount: children.length,
      columnInfo
    };
  });

  window.layoutCaptures[name] = layoutData;
  console.log(`✅ Layout captured as "${name}" - ${Object.keys(layoutData).length} elements`);
  return layoutData;
}

function compareLayouts(name1 = 'before', name2 = 'after') {
  const layout1 = window.layoutCaptures[name1];
  const layout2 = window.layoutCaptures[name2];

  if (!layout1 || !layout2) {
    console.error('❌ Missing captures. Run captureLayout() for both states first.');
    return;
  }

  const differences = {
    added: [],
    removed: [],
    moved: [],
    resized: [],
    styleChanged: []
  };

  // Check for removed elements
  Object.keys(layout1).forEach(id => {
    if (!layout2[id]) {
      differences.removed.push({ id, element: layout1[id] });
    }
  });

  // Check for added and changed elements
  Object.keys(layout2).forEach(id => {
    if (!layout1[id]) {
      differences.added.push({ id, element: layout2[id] });
    } else {
      const el1 = layout1[id];
      const el2 = layout2[id];

      // Check position changes
      const posDiff = Math.abs(el1.position.top - el2.position.top) > 1 ||
                      Math.abs(el1.position.left - el2.position.left) > 1;
      if (posDiff) {
        differences.moved.push({
          id,
          from: el1.position,
          to: el2.position,
          delta: {
            top: el2.position.top - el1.position.top,
            left: el2.position.left - el1.position.left
          }
        });
      }

      // Check size changes
      const sizeDiff = Math.abs(el1.position.width - el2.position.width) > 1 ||
                       Math.abs(el1.position.height - el2.position.height) > 1;
      if (sizeDiff) {
        differences.resized.push({
          id,
          from: { width: el1.position.width, height: el1.position.height },
          to: { width: el2.position.width, height: el2.position.height },
          delta: {
            width: el2.position.width - el1.position.width,
            height: el2.position.height - el1.position.height
          }
        });
      }

      // Check style changes
      const styleChanges = {};
      Object.keys(el1.styles).forEach(prop => {
        if (el1.styles[prop] !== el2.styles[prop]) {
          styleChanges[prop] = {
            from: el1.styles[prop],
            to: el2.styles[prop]
          };
        }
      });

      if (Object.keys(styleChanges).length > 0) {
        differences.styleChanged.push({ id, changes: styleChanges });
      }
    }
  });

  // Check for column changes
  const columnChanges = [];
  Object.keys(layout2).forEach(id => {
    if (layout1[id]) {
      const col1 = layout1[id].columnInfo;
      const col2 = layout2[id].columnInfo;

      if (JSON.stringify(col1) !== JSON.stringify(col2)) {
        columnChanges.push({
          id,
          from: col1,
          to: col2
        });
      }
    }
  });

  // Output results
  console.group('📊 Layout Comparison Results');

  if (columnChanges.length) {
    console.group(`🏛️ Column Layout Changes (${columnChanges.length})`);
    columnChanges.forEach(({id, from, to}) => {
      if (!from && to) {
        console.log(`${id}: Now has ${to.columns || to.estimatedColumns} columns (${to.type})`);
      } else if (from && !to) {
        console.log(`${id}: No longer has columns (was ${from.columns || from.estimatedColumns} columns)`);
      } else if (from && to) {
        const fromCols = from.columns || from.estimatedColumns;
        const toCols = to.columns || to.estimatedColumns;
        if (fromCols !== toCols) {
          console.log(`${id}: Changed from ${fromCols} to ${toCols} columns`);
        }
      }
    });
    console.groupEnd();
  }

  if (differences.added.length) {
    console.group(`✨ Added (${differences.added.length})`);
    differences.added.forEach(({id, element}) => {
      console.log(`${id}: ${element.tag} at (${element.position.left}, ${element.position.top})`);
    });
    console.groupEnd();
  }

  if (differences.removed.length) {
    console.group(`🗑️ Removed (${differences.removed.length})`);
    differences.removed.forEach(({id, element}) => {
      console.log(`${id}: ${element.tag}`);
    });
    console.groupEnd();
  }

  if (differences.moved.length) {
    console.group(`📍 Moved (${differences.moved.length})`);
    differences.moved.forEach(({id, delta}) => {
      console.log(`${id}: Delta top: ${delta.top.toFixed(1)}px, Delta left: ${delta.left.toFixed(1)}px`);
    });
    console.groupEnd();
  }

  if (differences.resized.length) {
    console.group(`📐 Resized (${differences.resized.length})`);
    differences.resized.forEach(({id, delta}) => {
      console.log(`${id}: Delta width: ${delta.width.toFixed(1)}px, Delta height: ${delta.height.toFixed(1)}px`);
    });
    console.groupEnd();
  }

  if (differences.styleChanged.length) {
    console.group(`🎨 Style Changes (${differences.styleChanged.length})`);
    differences.styleChanged.forEach(({id, changes}) => {
      console.log(`${id}:`, changes);
    });
    console.groupEnd();
  }

  console.groupEnd();

  return differences;
}

function showVisualDiff() {
  const differences = compareLayouts();
  if (!differences) return;

  // Remove any existing overlay
  const existingOverlay = document.getElementById('layout-diff-overlay');
  if (existingOverlay) existingOverlay.remove();

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'layout-diff-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 99999;
  `;

  // Highlight moved elements
  differences.moved.forEach(({id}) => {
    const el = document.querySelector(`#${id}`) ||
               document.querySelector(`.${id.split(' ')[0]}`) ||
               document.querySelectorAll(id.split('_')[0])[parseInt(id.split('_')[1], 10) || 0];

    if (el) {
      const rect = el.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px solid red;
        background: rgba(255, 0, 0, 0.1);
        pointer-events: none;
      `;
      overlay.appendChild(highlight);
    }
  });

  // Highlight resized elements
  differences.resized.forEach(({id}) => {
    const el = document.querySelector(`#${id}`) ||
               document.querySelector(`.${id.split(' ')[0]}`) ||
               document.querySelectorAll(id.split('_')[0])[parseInt(id.split('_')[1], 10) || 0];

    if (el) {
      const rect = el.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.style.cssText = `
        position: fixed;
        top: ${rect.top}px;
        left: ${rect.left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 2px dashed blue;
        background: rgba(0, 0, 255, 0.1);
        pointer-events: none;
      `;
      overlay.appendChild(highlight);
    }
  });

  document.body.appendChild(overlay);

  console.log('🎯 Visual overlay added (red=moved, blue=resized). Run clearVisualDiff() to remove.');
}

function clearVisualDiff() {
  const overlay = document.getElementById('layout-diff-overlay');
  if (overlay) overlay.remove();
  console.log('✅ Visual overlay cleared');
}

// Quick summary function
function layoutSummary() {
  const captures = Object.keys(window.layoutCaptures);
  if (captures.length === 0) {
    console.log('No captures yet. Run captureLayout("name") first.');
    return;
  }

  console.group('📸 Available Captures');
  captures.forEach(name => {
    const count = Object.keys(window.layoutCaptures[name]).length;
    console.log(`• ${name}: ${count} elements`);
  });
  console.groupEnd();
}

console.log(`
🔍 Layout Comparison Tool Loaded! (Column-aware version)

Commands:
• captureLayout('before')  - Capture current layout
• captureLayout('after')   - Capture layout after changes
• compareLayouts()         - Show differences (including column changes)
• showVisualDiff()        - Highlight changes on page
• clearVisualDiff()       - Remove visual highlights
• layoutSummary()         - Show available captures

Example workflow:
1. captureLayout('3cols')  - Capture 3-column layout
2. Change to 2 columns
3. captureLayout('2cols')  - Capture 2-column layout
4. compareLayouts('3cols', '2cols')  - Compare layouts

The tool now detects:
• Column count changes (flex-wrap and grid)
• Element positions and sizes
• CSS property changes (flexWrap, alignContent, etc.)
`);