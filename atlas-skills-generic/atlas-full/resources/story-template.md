# User Story Template

Use this template for Phase 2: Story Creation in the Atlas Full Workflow.

**Customization Note**: Adapt sections to match your domain and project needs. Add/remove platform-specific sections as appropriate for your stack.

---

# User Story: [Feature Name]

## Story

**As a** [user type/persona]
**I want** [goal/desire]
**So that** [benefit/value]

### Context
[Brief background: Why is this needed? What problem does it solve? What's the business value?]

---

## Acceptance Criteria

### Must Have (Critical - Required for MVP):

1. [ ] **[Criterion 1]**: [Specific, testable requirement]
   - **Given**: [precondition]
   - **When**: [action]
   - **Then**: [expected result]

2. [ ] **[Criterion 2]**: [Specific, testable requirement]
   - **Given**: [precondition]
   - **When**: [action]
   - **Then**: [expected result]

3. [ ] **[Criterion 3]**: [Specific, testable requirement]
   - **Given**: [precondition]
   - **When**: [action]
   - **Then**: [expected result]

### Should Have (Important - Include if time allows):

1. [ ] **[Criterion 1]**: [Nice-to-have requirement]
2. [ ] **[Criterion 2]**: [Nice-to-have requirement]

### Could Have (Optional - Defer if needed):

1. [ ] **[Criterion 1]**: [Optional enhancement]
2. [ ] **[Criterion 2]**: [Optional enhancement]

### Platform-Specific Requirements (if applicable):

Customize this section for your platforms (e.g., iOS/Android/Web, Windows/Mac/Linux, etc.)

- **Platform A**:
  - [ ] [Platform A-specific requirement]
  - [ ] [Platform A-specific requirement]

- **Platform B**:
  - [ ] [Platform B-specific requirement]
  - [ ] [Platform B-specific requirement]

- **Platform C**:
  - [ ] [Platform C-specific requirement]
  - [ ] [Platform C-specific requirement]

---

## Success Metrics

Define how success will be measured:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| [Metric 1] | [Target value] | [How to measure] |
| [Metric 2] | [Target value] | [How to measure] |
| [Metric 3] | [Target value] | [How to measure] |

### Examples:
- **Adoption**: 80% of active users use feature in first week
- **Performance**: Feature loads in < 3 seconds
- **Reliability**: 99%+ success rate (< 1% error rate)
- **User Satisfaction**: 4+ star rating in feedback
- **Conversion**: 20% increase in [key metric]

---

## Testing Scenarios

### Happy Path (Primary User Flow):

**Scenario 1: [Primary use case]**
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. **Expected**: [What should happen]

**Scenario 2: [Secondary use case]**
1. [Step 1]
2. [Step 2]
3. **Expected**: [What should happen]

### Edge Cases:

**Empty State**:
- **Given**: [No data exists]
- **When**: [User accesses feature]
- **Then**: [Show empty state with clear messaging]

**Error State**:
- **Given**: [Network/server error occurs]
- **When**: [User performs action]
- **Then**: [Show error message with retry option]

**Offline Mode** (if applicable):
- **Given**: [Device offline or no network]
- **When**: [User performs action]
- **Then**: [Queue action for later OR show offline message]

**Large Data Set**:
- **Given**: [Many items (100+, 1000+)]
- **When**: [User loads feature]
- **Then**: [Pagination OR virtualization, performance maintained]

**Slow Network** (if applicable):
- **Given**: [Slow connection]
- **When**: [User loads feature]
- **Then**: [Show loading state, graceful degradation]

**Concurrent Access** (if applicable):
- **Given**: [Feature accessed on multiple devices/sessions]
- **When**: [Changes made in multiple places]
- **Then**: [Sync correctly, handle conflicts]

**Old Version** (if applicable):
- **Given**: [User on older app/software version]
- **When**: [Feature accessed]
- **Then**: [Backwards compatible OR clear upgrade prompt]

---

## Dependencies

### External Dependencies:
- [External API, service, package, or tool]
- [External API, service, package, or tool]

### Internal Dependencies:
- [Internal module, component, service, or library]
- [Internal module, component, service, or library]

### Platform Dependencies (if applicable):
- **Platform A**: [Platform-specific SDK, permission, API, etc.]
- **Platform B**: [Platform-specific SDK, permission, API, etc.]
- **Platform C**: [Platform-specific API, browser feature, etc.]

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [How to prevent/handle] |
| [Risk 2] | High/Med/Low | High/Med/Low | [How to prevent/handle] |
| [Risk 3] | High/Med/Low | High/Med/Low | [How to prevent/handle] |

### Common Risks:
- **Performance**: Slow load times → Mitigation: Lazy loading, caching, optimization
- **Security**: Data exposure → Mitigation: Encryption, authentication, authorization
- **Usability**: Confusing UI → Mitigation: User testing, clear messaging, tooltips
- **Reliability**: Service downtime → Mitigation: Retry logic, offline support, fallbacks
- **Cost**: High operational costs → Mitigation: Usage limits, optimization, monitoring
- **Scalability**: Can't handle load → Mitigation: Load testing, horizontal scaling

---

## Out of Scope (Explicitly NOT Included)

Clearly state what is NOT part of this story to prevent scope creep:

1. [Feature/functionality explicitly excluded]
2. [Feature/functionality explicitly excluded]
3. [Feature/functionality explicitly excluded]

---

## Design Assets (if applicable)

- Wireframes: [Link to Figma, Sketch, design tool, etc.]
- Mockups: [Link to design files]
- User Flow: [Link to flow diagram]
- Prototype: [Link to interactive prototype]

---

## Technical Notes

Add domain-specific technical considerations:

- [Important technical consideration]
- [Important technical consideration]
- [Important technical consideration]

---

## Definition of Done

This story is complete when:

- [ ] All "Must Have" acceptance criteria met
- [ ] All testing scenarios pass
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed to development/staging and tested
- [ ] Performance metrics meet targets
- [ ] No critical bugs
- [ ] Stakeholder sign-off (if required)

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Research | [hours] |
| Planning | [hours] |
| Implementation | [hours] |
| Testing | [hours] |
| Documentation | [hours] |
| **Total** | **[hours]** |

---

## Example: Feature X Implementation

Replace this example with one relevant to your domain.

# User Story: Advanced Search Feature

## Story

**As a** power user of the application
**I want** to use advanced search filters and operators
**So that** I can quickly find exactly what I'm looking for without scrolling through irrelevant results

### Context
Users frequently report difficulty finding specific items in large datasets. Basic search only supports simple text matching. Power users need boolean operators, date ranges, and multi-field filtering to efficiently locate information.

---

## Acceptance Criteria

### Must Have:

1. [ ] **Boolean Operators**: Search supports AND, OR, NOT operators
   - **Given**: User enters 'term1 AND term2' in search
   - **When**: Search executes
   - **Then**: Results contain both term1 and term2

2. [ ] **Date Range Filtering**: Users can filter by date range
   - **Given**: User selects date range picker
   - **When**: User selects start and end dates
   - **Then**: Results filtered to items within date range

3. [ ] **Multi-field Search**: Users can search specific fields
   - **Given**: User enters 'field:value' in search
   - **When**: Search executes
   - **Then**: Results match value in specified field only

4. [ ] **Search Results Sorting**: Users can sort results by relevance, date, or name
   - **Given**: User selects sort option
   - **When**: Sort applies
   - **Then**: Results reorder according to selected criteria

5. [ ] **Performance**: Search returns results in < 1 second for datasets up to 10,000 items
   - **Given**: Database with 10,000 items
   - **When**: User performs complex search
   - **Then**: Results displayed within 1 second

### Should Have:

1. [ ] **Saved Searches**: Users can save frequently used searches
2. [ ] **Search History**: Recent searches saved and accessible
3. [ ] **Search Suggestions**: Auto-complete suggests as user types

### Platform-Specific:

- **Web**:
  - [ ] Keyboard shortcuts (Ctrl/Cmd+K to focus search)
  - [ ] URL parameters preserve search state

- **Desktop**:
  - [ ] Native keyboard shortcuts
  - [ ] System-level search integration (if applicable)

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Adoption** | 40%+ of active users use advanced search in first week | Analytics event tracking |
| **Performance** | Search results in < 1 second | Performance monitoring |
| **User Satisfaction** | 4+ star rating for search feature | In-app feedback |
| **Search Success Rate** | 80%+ of searches result in item selection | Analytics funnel tracking |

---

## Testing Scenarios

### Happy Path:

**Scenario 1: Boolean AND search**
1. User opens search
2. Enters 'urgent AND bug'
3. Search executes
4. **Expected**: All results contain both 'urgent' and 'bug'

**Scenario 2: Date range filter**
1. User opens search
2. Selects date range (last 30 days)
3. Enters search term
4. **Expected**: Results only from last 30 days

### Edge Cases:

**Empty State**:
- **Given**: Search returns no results
- **When**: User views results
- **Then**: "No results found" message with suggestions to broaden search

**Large Result Set**:
- **Given**: Search matches 1,000+ items
- **When**: User views results
- **Then**: Pagination applied, first 50 results shown with load more option

**Complex Query**:
- **Given**: User enters '(term1 OR term2) AND NOT term3 date:2024'
- **When**: Search executes
- **Then**: Query parsed correctly, relevant results returned

**Invalid Syntax**:
- **Given**: User enters malformed query 'term AND OR'
- **When**: Search executes
- **Then**: Error message: "Invalid search syntax. Use AND, OR, NOT correctly."

---

## Dependencies

### External Dependencies:
- Search engine library (e.g., Elasticsearch, Algolia, or custom indexing)

### Internal Dependencies:
- Database query layer
- UI components library
- Analytics service

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Performance degradation on large datasets | Medium | High | Implement indexing, query optimization, pagination |
| Complex query syntax confuses users | High | Medium | Clear help documentation, search examples, tooltips |
| Search results inaccurate | Low | High | Comprehensive testing, relevance tuning, user feedback |

---

## Out of Scope

1. Natural language processing ("find all bugs from last week")
2. Image/file content search
3. Machine learning-based search ranking
4. Full-text search of file attachments

---

## Technical Notes

- Use inverted index for performance
- Cache frequently used searches
- Query parsing requires robust error handling
- Consider rate limiting to prevent abuse

---

## Definition of Done

- [ ] All 5 "Must Have" acceptance criteria met
- [ ] All testing scenarios pass
- [ ] Code reviewed and approved
- [ ] Documentation updated (user guide + developer docs)
- [ ] Deployed to staging and tested with 10,000+ item dataset
- [ ] Performance < 1s verified
- [ ] No critical bugs
- [ ] Product owner sign-off

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Research | 0.5 hours |
| Story Creation | 0.25 hours |
| Planning | 0.5 hours |
| Adversarial Review | 0.25 hours |
| Implementation | 2 hours |
| Testing | 1 hour |
| Validation | 0.25 hours |
| Clean-up | 0.25 hours |
| **Total** | **5 hours** |
