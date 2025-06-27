# Predictable view management for neurodivergent users

Single-page applications that work well for users with ADHD and autism require predictable, instant view switching without animations or complex state management. The most effective approach combines a simple state machine pattern with the HTML `hidden` attribute, natural browser focus management, and consistent navigation structures - all implementable in under 100 lines of vanilla JavaScript. Research reveals that synchronous transitions, clear visual hierarchy, and respecting user preferences for reduced motion are essential for creating inclusive web experiences.

## Why traditional SPAs fail neurodivergent users

Users with ADHD and autism face unique challenges with typical single-page applications. **Motion animations fall into the category of "irrelevant distractions"** that impair recall and create extraneous cognitive load, according to W3C research. For many people with ADHD, it's impossible to read through a web page with moving content - their eyes won't stop moving back to the animation. Parallax effects and scroll-jacking are prime triggers for vestibular disorders and concentration problems.

Beyond animations, unpredictable navigation patterns create significant barriers. Users with autism have an increased need for consistency and prefer predictable layouts. When SPAs implement complex routing with delays, caching, or unexpected state changes, they violate WCAG 3.2 Predictable guidelines that are fundamental for cognitive accessibility. Time constraints from loading states are particularly difficult for users with ADHD, who may perceive processing delays as personal errors.

The solution lies in embracing simplicity. Research from the AASPIRE Web Accessibility Guidelines for Autistic Users emphasizes straightforward user interface elements, minimal cognitive burden, and user control over the experience. This aligns perfectly with the goal of creating view management patterns under 100 lines of code.

## State machines create predictable navigation flows

State machines provide the foundation for predictable view transitions by explicitly defining all possible states and transitions. A minimal implementation requires just 20 lines:

```javascript
function createMachine(definition) {
  const machine = {
    value: definition.initialState,
    transition(currentState, event) {
      const stateConfig = definition.states[currentState];
      const transition = stateConfig.transitions[event];
      if (!transition) return machine.value;
      
      transition.action?.();
      machine.value = transition.target;
      return machine.value;
    }
  };
  return machine;
}
```

This pattern ensures **every navigation action has a defined outcome**, eliminating the unpredictability that confuses neurodivergent users. The state machine explicitly models view transitions as state changes, making the application's behavior transparent and debuggable. Unlike complex routers with middleware, guards, and async loaders, this approach maintains a clear cause-and-effect relationship between user actions and view changes.

For view management specifically, the state machine tracks which view is active and orchestrates transitions synchronously. Each view state has explicit transitions to other valid states, preventing invalid navigation paths that could leave users stranded or confused.

## Synchronous switching eliminates cognitive disruption

The most effective view switching pattern combines the `hidden` HTML attribute with a simple state-driven approach:

```javascript
class ViewManager {
  constructor() {
    this.views = new Map();
    this.currentView = null;
  }
  
  register(name, element) {
    this.views.set(name, element);
    element.hidden = true;
  }
  
  show(name) {
    const newView = this.views.get(name);
    if (!newView) return;
    
    if (this.currentView) {
      this.currentView.hidden = true;
    }
    
    newView.hidden = false;
    this.currentView = newView;
    
    this.manageFocus(newView);
  }
  
  manageFocus(view) {
    const target = view.querySelector('h1, main, [tabindex]');
    if (target) {
      target.tabIndex = -1;
      target.focus();
      setTimeout(() => target.removeAttribute('tabindex'), 0);
    }
  }
}
```

This approach delivers **instant, synchronous transitions** without animations or delays. The `hidden` attribute provides better accessibility than `display: none` because it's semantically meaningful to assistive technologies. Screen readers understand that hidden content is temporarily unavailable rather than structurally absent.

The synchronous nature is critical. Research shows that users with ADHD struggle with temporal gaps between action and result. Asynchronous transitions, loading states, and animated page changes create cognitive disruption. By making view switches instant and atomic, users maintain their train of thought and spatial understanding of the application.

## Natural focus management preserves spatial context

Focus management in SPAs often becomes overly complex, but neurodivergent users benefit from predictable, browser-native behavior. The recommended approach moves focus to the main content area after navigation while preserving natural tab order:

```javascript
function handleNavigation(newView) {
  // Switch view instantly
  showView(newView);
  
  // Focus main content or first heading
  const focusTarget = newView.querySelector('main, h1, [role="main"]');
  if (focusTarget) {
    focusTarget.tabIndex = -1;
    focusTarget.focus();
    
    // Clean up tabindex to restore natural flow
    focusTarget.addEventListener('blur', () => {
      focusTarget.removeAttribute('tabindex');
    }, { once: true });
  }
}
```

This pattern **announces the view change to screen readers** while maintaining spatial consistency for keyboard users. Unlike complex focus trapping or management libraries, it leverages the browser's built-in focus behavior. Users can predict where focus will land (the main content) while maintaining the ability to navigate naturally with Tab and Shift+Tab.

The temporary `tabindex="-1"` makes non-interactive elements focusable programmatically without adding them to the tab order. This technique, recommended by WCAG guidelines, ensures screen readers announce the new content while preserving the natural document flow.

## Comparing implementation approaches reveals clear winners

Research across multiple implementation patterns highlights distinct advantages and trade-offs:

**Simple show/hide** emerges as the winner for most use cases. Using the `hidden` attribute or `display: none` provides instant switching, full accessibility support, and zero animation. The entire implementation fits in under 50 lines while maintaining predictability.

**CSS-only transitions** work well when properly configured with `transition: none` to eliminate animations. However, they require careful management of z-index and positioning. The approach works best for simple toggles rather than complex navigation.

**Web Components** provide excellent encapsulation and lifecycle management through `connectedCallback` and `disconnectedCallback`. Each view becomes a self-contained component with natural cleanup. The downside is increased complexity and potential issues with older browsers, though polyfills are available.

**History API only** approaches offer the cleanest URLs and natural browser integration. A minimal router using `pushState` and `popstate` events can be implemented in 30 lines. However, focus management requires more manual intervention compared to other approaches.

The research consistently points to **combining simple show/hide with History API** as the optimal solution, providing clean URLs, instant transitions, and minimal complexity.

## Framework lessons applied to vanilla patterns

React and Vue's approaches to view management reveal valuable patterns that work without framework overhead. React's conditional rendering treats view switching as simple JavaScript control flow: `{condition && <Component />}` or using ternary operators. This mental model translates directly to vanilla JavaScript using `element.hidden = !condition`.

Vue's distinction between `v-if` (creates/destroys elements) and `v-show` (toggles display) provides important insight. **For predictable navigation, v-show's approach is superior** - keeping elements in the DOM but hidden reduces layout thrashing and maintains form state. This maps to using `hidden` or `display: none` rather than adding/removing elements.

Both frameworks emphasize unidirectional data flow and centralized state management. A minimal store pattern achieves the same predictability:

```javascript
const store = {
  state: { currentView: 'home' },
  actions: {
    navigate(view) {
      this.state.currentView = view;
      this.render();
    }
  },
  render() {
    document.querySelectorAll('[data-view]').forEach(el => {
      el.hidden = el.dataset.view !== this.state.currentView;
    });
  }
};
```

This pattern provides **predictable state mutations** without reactive complexity, maintaining the cause-and-effect clarity essential for neurodivergent users.

## Building inclusive navigation starts with simplicity

Creating SPAs that work well for users with ADHD and autism requires embracing constraints that ultimately benefit all users. The research points to a clear implementation strategy:

Start with a simple state machine to model navigation states explicitly. Use the `hidden` attribute for instant view switching without animations. Implement natural focus management that moves attention to main content while preserving tab order. Keep the entire implementation under 100 lines to ensure maintainability and predictability.

Most importantly, **respect user preferences and provide control**. Honor `prefers-reduced-motion` settings, offer high-contrast themes, and allow users to disable any remaining transitions. Test with actual neurodivergent users and iterate based on their feedback.

The goal isn't to create the most feature-rich SPA, but the most reliable and predictable one. By focusing on simplicity, synchronous behavior, and user control, developers can create navigation experiences that include everyone while maintaining elegance and performance. The patterns presented here prove that accessibility and simplicity are not constraints but catalysts for better design.