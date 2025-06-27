# Research Request: Mobile Storage Best Practices for Task Apps

## Research Question
What is the industry consensus on storage solutions for mobile task management apps with these requirements:
- Offline-first operation
- ~1-50MB typical data size
- Text-based tasks with occasional image attachments
- Must survive app reinstalls
- Cross-platform (iOS/Android via Capacitor)

## Current Assumptions to Validate/Challenge

1. **Is IndexedDB actually unreliable on mobile?**
   - Do major apps use it successfully?
   - Are the iOS 7-day eviction concerns outdated?
   - What's the real-world failure rate?

2. **Storage Solution Comparison**
   - What do apps like Todoist, Things, Any.do actually use?
   - How do they handle offline storage?
   - Do they really need complex dual-write systems?

3. **Capacitor Best Practices**
   - What's the recommended storage approach for Capacitor apps?
   - Is Capacitor Preferences sufficient for all data?
   - How do production apps handle this?

4. **Simple vs Complex**
   - Are we over-engineering for edge cases that rarely happen?
   - What's the 80/20 solution that works for most users?
   - How much complexity is actually needed?

## Specific Questions

1. **For apps storing <100MB of user data:**
   - What storage solution do they typically use?
   - How do they handle persistence across app updates?
   - What's their backup/recovery strategy?

2. **Platform-specific concerns:**
   - Is iOS IndexedDB eviction still a real issue in 2024?
   - How do apps handle Android storage clearing?
   - What's the simplest solution that actually works?

3. **User expectations:**
   - Do users expect manual export/import for a task app?
   - How critical is multi-device sync for MVP?
   - What's the minimum viable persistence?

## Research Deliverables Needed

1. **Storage Solution Matrix**
   - Compare: localStorage, IndexedDB, Capacitor Storage, SQLite
   - For each: reliability, complexity, limitations, use cases

2. **Case Studies**
   - 3-5 popular task/note apps
   - What storage they use
   - How they handle edge cases
   - User complaints about data loss (if any)

3. **Recommended Approach**
   - Based on StackMap's actual needs (not hypothetical)
   - Simplest solution that meets requirements
   - Clear upgrade path if needed later

## Key Insight
We may be solving problems that don't exist. Task apps have been around for 15+ years on mobile. There must be established patterns that work without excessive complexity.