# Testing Strategy & Progress Tracking

## Overview
This document outlines the testing strategy for the Friend Party app, including priorities, coverage goals, and progress tracking. Our approach focuses on **high-value, testable business logic** while acknowledging the complexity of our external service dependencies.

## Current Status
- **Test Files**: 6 passed (6) - **100% pass rate** ✅
- **Tests**: 21 passed (21) - **100% pass rate** ✅
- **Overall Coverage**: **3.69%** (statements and lines)
- **Branch Coverage**: **44.82%**
- **Function Coverage**: **24.65%**

## Testing Philosophy
We prioritize **testing business logic over UI components** and focus on **maintainable, valuable tests** rather than achieving unrealistic coverage goals. Our strategy aligns with industry best practices for apps with heavy external service dependencies.

## Testing Tiers & Priorities

### 🎯 Tier 1: High Value, Low Complexity (Start Here)
**Goal**: Establish testing foundation with pure business logic
**Coverage Target**: 25-35%
**Timeline**: Next 2-4 weeks

| File | Current Coverage | Priority | Status | Notes |
|------|------------------|----------|---------|-------|
| `src/lib/hirelings.ts` | 100% ✅ | Complete | ✅ Done | Pure business logic |
| `src/lib/morale.ts` | 91.66% ✅ | Complete | ✅ Done | Pure business logic |
| `src/lib/utils.ts` | 94.28% ✅ | Complete | ✅ Done | Pure business logic |
| `src/lib/settings.ts` | 75.51% ✅ | Complete | ✅ Done | Pure business logic |
| `src/utils/partyCodeGenerator.ts` | 100% ✅ | Complete | ✅ Done | Pure business logic |

**Next Steps**: 
- [ ] Add edge case tests to existing utilities
- [ ] Test error handling scenarios
- [ ] Add integration tests between related utilities

### 🎯 Tier 2: Business Logic with Dependencies (Medium Priority)
**Goal**: Test core API functionality with mockable dependencies
**Coverage Target**: 40-50%
**Timeline**: 1-2 months

| File | Current Coverage | Priority | Status | Notes |
|------|------------------|----------|---------|-------|
| `src/app/api/party/[code]/vote-hireling-conversion/route.ts` | 52.91% ✅ | High | ✅ In Progress | Core business logic |
| `src/app/api/party/[code]/mottos/route.ts` | 0% ❌ | High | ❌ Not Started | Party motto management |
| `src/app/api/party/[code]/join/route.ts` | 0% ❌ | High | ❌ Not Started | Party joining logic |
| `src/app/api/party/[code]/vote/route.ts` | 0% ❌ | High | ❌ Not Started | Voting system |
| `src/app/api/party/[code]/propose-motto/route.ts` | 0% ❌ | Medium | ❌ Not Started | Motto proposals |
| `src/app/api/party/[code]/start-questionnaire/route.ts` | 0% ❌ | Medium | ❌ Not Started | Assessment flow |
| `src/app/api/party/[code]/finish-questionnaire/route.ts` | 0% ❌ | Medium | ❌ Not Started | Assessment completion |

**Testing Approach**:
- Mock Supabase client responses
- Test business logic validation
- Test error handling scenarios
- Test edge cases and boundary conditions

### 🎯 Tier 3: State Management (High Value, Medium Complexity)
**Goal**: Test Zustand store logic and state transitions
**Coverage Target**: 50-60%
**Timeline**: 2-3 months

| File | Current Coverage | Priority | Status | Notes |
|------|------------------|----------|---------|-------|
| `src/store/partyStore.ts` | 0% ❌ | High | ❌ Not Started | Core app state |

**Testing Approach**:
- Test state transitions
- Test async operations
- Test error handling
- Mock external API calls

### 🎯 Tier 4: React Components (Lower Priority, Higher Complexity)
**Goal**: Test user interactions and component behavior
**Coverage Target**: 55-65%
**Timeline**: 3+ months

| File | Current Coverage | Priority | Status | Notes |
|------|------------------|----------|---------|-------|
| `src/components/common/UnifiedQuestionnaire.tsx` | 0% ❌ | Medium | ❌ Not Started | Complex with external deps |
| `src/components/HamburgerMenu.tsx` | 0% ❌ | Low | ❌ Not Started | Simple UI component |
| `src/components/DebugToolbar.tsx` | 0% ❌ | Low | ❌ Not Started | Debug functionality |
| `src/components/Auth.tsx` | 0% ❌ | Medium | ❌ Not Started | Authentication UI |

**Testing Approach**:
- Test user interactions
- Test component state changes
- Mock external dependencies
- Test accessibility features

### 🎯 Tier 5: Hooks & External Services (Lowest Priority)
**Goal**: Test custom hooks and service integrations
**Coverage Target**: 60-70%
**Timeline**: 4+ months

| File | Current Coverage | Priority | Status | Notes |
|------|------------------|----------|---------|-------|
| `src/hooks/useAuth.ts` | 0% ❌ | Low | ❌ Not Started | Heavy Supabase deps |
| `src/lib/supabase/client.ts` | 0% ❌ | Low | ❌ Not Started | External service config |

**Testing Approach**:
- Mock external service calls
- Test hook behavior in isolation
- Test error scenarios
- Integration tests with mocked services

## Coverage Goals & Timeline

### Short Term (Next 2-4 weeks)
- **Coverage Target**: **25-35%**
- **Focus**: Complete Tier 1, start Tier 2
- **New Tests**: 8-12 test files
- **Priority**: API routes and business logic

### Medium Term (1-2 months)
- **Coverage Target**: **40-50%**
- **Focus**: Complete Tier 2, start Tier 3
- **New Tests**: 20-25 total test files
- **Priority**: State management and core functionality

### Long Term (3+ months)
- **Coverage Target**: **50-65%**
- **Focus**: Complete Tier 3, start Tier 4
- **New Tests**: 30-35 total test files
- **Priority**: Component testing and user interactions

### Extended Term (6+ months)
- **Coverage Target**: **60-70%**
- **Focus**: Complete Tier 4, start Tier 5
- **New Tests**: 35-40 total test files
- **Priority**: Hooks and external services

## Testing Infrastructure Requirements

### Current Setup
- ✅ Vitest for test runner
- ✅ v8 coverage provider
- ✅ Node.js test environment

### Required Additions
- [ ] `@testing-library/react` for component testing
- [ ] `@testing-library/jest-dom` for DOM matchers
- [ ] `@testing-library/user-event` for user interaction testing
- [ ] `jsdom` for browser environment simulation
- [ ] `msw` (Mock Service Worker) for API mocking

### Configuration Updates
- [ ] Update `vitest.config.ts` for React testing
- [ ] Add test setup files
- [ ] Configure coverage thresholds
- [ ] Set up test utilities and helpers

## Testing Patterns & Best Practices

### API Route Testing
```typescript
// Example pattern for API route tests
describe('POST /api/party/[code]/join', () => {
  it('should allow valid user to join party', async () => {
    // Mock Supabase client
    // Test business logic
    // Verify response format
  });
  
  it('should reject invalid party codes', async () => {
    // Test error handling
    // Verify error responses
  });
});
```

### Component Testing
```typescript
// Example pattern for component tests
describe('UnifiedQuestionnaire', () => {
  it('should render questions for authenticated users', () => {
    // Mock store state
    // Mock external dependencies
    // Test rendering behavior
  });
});
```

### State Management Testing
```typescript
// Example pattern for Zustand store tests
describe('partyStore', () => {
  it('should update member status correctly', () => {
    // Test state transitions
    // Verify store updates
    // Test async operations
  });
});
```

## Progress Tracking

### Weekly Check-ins
- [ ] **Week 1**: Complete Tier 1 edge cases
- [ ] **Week 2**: Start Tier 2 API route testing
- [ ] **Week 3**: Continue API route testing
- [ ] **Week 4**: Complete Tier 2, start Tier 3

### Monthly Reviews
- [ ] **Month 1**: Coverage target 25-35%
- [ ] **Month 2**: Coverage target 40-50%
- [ ] **Month 3**: Coverage target 50-60%
- [ ] **Month 6**: Coverage target 60-70%

### Success Metrics
- **Test Pass Rate**: Maintain 100%
- **Coverage Growth**: Steady increase month-over-month
- **Test Quality**: Meaningful tests that catch real bugs
- **Maintenance**: Tests remain fast and reliable

## Risk Mitigation

### Common Challenges
1. **External Dependencies**: Heavy Supabase integration makes testing complex
2. **State Complexity**: Zustand store with multiple async operations
3. **Component Dependencies**: Components directly call external services
4. **Real-time Features**: WebSocket subscriptions and auth state changes

### Mitigation Strategies
1. **Proper Mocking**: Use MSW and dependency injection
2. **Test Isolation**: Test business logic separate from external calls
3. **Integration Tests**: Test complete workflows with mocked services
4. **Progressive Testing**: Start simple, add complexity gradually

## Next Steps

### Immediate Actions (This Week)
1. [ ] Install required testing dependencies
2. [ ] Update Vitest configuration
3. [ ] Create test utilities and helpers
4. [ ] Start Tier 2 API route testing

### This Sprint (2 weeks)
1. [ ] Complete 3-4 API route tests
2. [ ] Achieve 25-30% coverage
3. [ ] Establish testing patterns
4. [ ] Document testing procedures

### This Quarter (3 months)
1. [ ] Complete Tier 2 and Tier 3
2. [ ] Achieve 50-60% coverage
3. [ ] Start component testing
4. [ ] Implement integration tests

## Conclusion

This testing strategy prioritizes **business value over coverage numbers** and focuses on **maintainable, reliable tests**. By following the tiered approach, we'll build a robust testing foundation that grows with the application while maintaining high quality and reliability.

The key to success is **consistent progress** rather than trying to achieve everything at once. Each tier builds upon the previous one, creating a solid foundation for comprehensive testing coverage.
