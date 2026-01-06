# MCQ CRUD Implementation Plan

## Overview
Add CRUD functionality for MCQs in assessment type stages with a toggle between content editing and MCQ management.

## Phase 1: Frontend Components Setup

### 1.1 Add Missing shadcn Components
- Add `radio-group` component for MCQ options management
- Verify all required components are available

### 1.2 Create MCQ Management Components
- `MCQTable` - Table showing all MCQs with edit/delete actions
- `MCQEditModal` - Modal for comprehensive MCQ editing
- `MCQOptionEditor` - Component for managing MCQ options

## Phase 2: Update ProblemManageDialog

### 2.1 Add Content/MCQ Toggle for Assessment Stages
- Add toggle switch in editStage section header
- Show toggle only when `stageForm.type === 'assessment'`
- State: `contentMode: 'content' | 'mcqs'`

### 2.2 Conditional Rendering Logic
- When `contentMode === 'content'`: Show existing content editor
- When `contentMode === 'mcqs'`: Show MCQ management interface
- Hide MCQ toggle completely for non-assessment stages

### 2.3 MCQ Management Interface
- Table showing: Question (truncated), Type, Difficulty, Options count, Actions
- Add MCQ button above table
- Edit/Delete buttons for each MCQ row
- Modal for MCQ editing with comprehensive form

## Phase 3: MCQ CRUD Operations

### 3.1 State Management
- Add MCQ-specific state handlers
- Implement add, update, delete operations
- Maintain MCQ array in `stageForm.content.mcqs`

### 3.2 Form Validation
- Validate required fields (question, options, explanation)
- Ensure at least one correct option
- Validate option text is not empty

### 3.3 Data Persistence
- Integrate with existing stage update API
- No backend changes needed (MCQs already supported)

## Phase 4: UI/UX Enhancements

### 4.1 Design Consistency
- Use existing design patterns from ProblemManageDialog
- Match color scheme and spacing
- Consistent button styles and interactions

### 4.2 User Experience
- Smooth transitions between content/MCQ modes
- Clear visual feedback for actions
- Proper loading states

## Phase 5: Testing & Integration

### 5.1 Integration Testing
- Test with existing stage editing workflow
- Verify no breaking changes to other stage types
- Test MCQ data persistence

### 5.2 Edge Cases
- Handle empty MCQ arrays
- Validate MCQ data structure
- Error handling for malformed data

## Implementation Files

### New Files
- `frontend/src/components/ui/radio-group.tsx`
- `frontend/src/components/MCQTable.tsx`
- `frontend/src/components/MCQEditModal.tsx`

### Modified Files
- `frontend/src/components/ProblemManageDialog.tsx`

## Key Design Decisions

1. **Toggle Placement**: In editStage section header, next to focus mode button
2. **Table Design**: Similar to existing stages table with consistent styling
3. **Modal Design**: Comprehensive form with tabs for organization
4. **State Management**: Extend existing stageForm state structure
5. **Validation**: Client-side validation before API calls
6. **Accessibility**: Proper ARIA labels and keyboard navigation

## Success Criteria

- [ ] Toggle appears only for assessment type stages
- [ ] Content and MCQ editing modes work independently
- [ ] MCQ table displays all current MCQs correctly
- [ ] Add MCQ functionality creates new MCQs
- [ ] Edit MCQ modal allows comprehensive field editing
- [ ] Delete MCQ functionality works with confirmation
- [ ] All changes persist when stage is saved
- [ ] No breaking changes to existing functionality
- [ ] Consistent UI/UX with existing design patterns