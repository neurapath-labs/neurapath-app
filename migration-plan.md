# Evecloud SvelteKit Migration Plan

This document outlines a detailed plan for migrating the Evecloud application from its original vanilla JS implementation to a modern SvelteKit application with Svelte 5 and TypeScript.

## 1. Missing Functionality Analysis

Based on the analysis of the original `script.js` and current SvelteKit implementation, the following functionality is missing and needs to be implemented:

### 1.1 Missing Modal Components
- Explorer modal (`modalbox-explorer`)
- Flagged items modal (`modalbox-flagged`)
- Statistics modal (`modalbox-statistics`) with charting functionality
- Databases modal (`modalbox-databases`)
- Changelog modal (`modalbox-changelog`)
- Tutorial modal (`modalbox-tutorial`)
- Spotlight search modal (`modalbox-spotlight`)
- Policy acceptance modal

### 1.2 Incomplete Features
- Image occlusion creation and learning modes
- Spotlight search functionality
- Text summarization feature
- Database export/import functionality
- Sharing functionality
- Complete keyboard shortcut system
- Policy acceptance workflow

## 2. Detailed Implementation Plan

### 2.1 Implement Missing Modal Components

#### Explorer Modal
- Create `ExplorerModal.svelte` component
- Implement table view of all database items
- Add sorting and filtering capabilities
- Connect to database store for data

#### Flagged Items Modal
- Create `FlaggedItemsModal.svelte` component
- Display all flagged items in a table
- Add unflag action for each item
- Connect to database store for data

#### Statistics Modal
- Create `StatisticsModal.svelte` component
- Implement charting functionality using a Svelte-compatible library
- Display review history and new items statistics
- Connect to profile store for statistics data

#### Databases Modal
- Create `DatabasesModal.svelte` component
- Implement shared databases listing
- Add functionality to browse and import public databases
- Connect to database service for API calls

#### Changelog Modal
- Create `ChangelogModal.svelte` component
- Display application changelog information
- Add "I'm ready!" button to dismiss
- Connect to profile store to track viewed status

#### Tutorial Modal
- Create `TutorialModal.svelte` component
- Implement step-by-step tutorial with 14+ steps
- Add navigation between steps (previous/next)
- Add "Complete tutorial!" button
- Connect to profile store to track completion

#### Spotlight Search Modal
- Create `SpotlightSearchModal.svelte` component
- Implement search functionality across database items
- Add keyboard navigation
- Display search results with titles and content previews

#### Policy Modal
- Create `PolicyModal.svelte` component
- Display privacy policy content
- Add acceptance checkbox and button
- Connect to profile store to track acceptance

### 2.2 Complete Image Occlusion Functionality

#### Image Occlusion Creation
- Implement canvas-based occlusion creation
- Add drawing functionality for rectangles
- Implement save/cancel actions
- Connect to database store to save occlusions

#### Image Occlusion Learning
- Create `OcclusionLearningModal.svelte` component
- Implement canvas display of images with occlusions
- Add show/hide functionality for occlusions
- Connect to learning store for grading

### 2.3 Implement Spotlight Search Feature

- Create spotlight search service
- Implement fuzzy search across database items
- Add keyboard shortcut (Ctrl+Space) to toggle
- Integrate with SpotlightSearchModal

### 2.4 Add Missing Context Menu Actions

- Implement "Import article" action for right sidebar items
- Implement "Create occlusion" action for right sidebar items
- Implement "Postpone 30 days" action
- Implement "Priority queue" related actions

### 2.5 Implement Statistics and Charting Functionality

- Add charting library (e.g., svelte-frappe-charts or Chart.js wrapper)
- Implement statistics service to track:
  - Reviews count per day
  - New items count per day
- Create charts for both statistics types
- Connect to profile store for data persistence

### 2.6 Complete Keyboard Shortcut System

- Implement all keyboard shortcuts from original app:
  - Ctrl+Space: Toggle spotlight
  - Ctrl+G: Text summarization
  - Ctrl+<: Create separate occlusion
  - Ctrl+1-5: Grade items in learning mode
  - And many more...
- Add shortcut customization in settings
- Implement shortcut service to handle key events

### 2.7 Add PDF Import and Text Summarization Features

#### PDF Import
- Implement PDF processing functionality
- Add file drop/paste handling for PDF files
- Extract text content from PDFs
- Create new folder structure for PDF content

#### Text Summarization
- Implement text summarization service
- Add API integration for AI-based summarization
- Create new extracts with summarized content
- Add keyboard shortcut (Ctrl+G)

### 2.8 Implement Database Export/Import Functionality

- Add export database feature
- Add import database feature
- Implement file handling for JSON data
- Connect to database service for API calls

### 2.9 Add Sharing Functionality

- Implement database sharing features
- Add "Make public" functionality
- Implement password protection for shared databases
- Add sharing UI in settings

### 2.10 Implement Tutorial System

- Create comprehensive tutorial with 14+ steps
- Implement step navigation
- Add highlighting of UI elements
- Track tutorial completion in profile

### 2.11 Add Changelog Display

- Implement changelog display on first launch
- Track viewed status in profile
- Add changelog content from original app

### 2.12 Implement Policy Acceptance

- Add privacy policy display
- Implement acceptance workflow
- Track acceptance status in profile

## 3. Implementation Order

1. Implement missing modal components (Explorer, Flagged, Statistics, Databases, Changelog, Tutorial, Spotlight, Policy)
2. Complete image occlusion functionality (creation and learning modes)
3. Implement spotlight search feature
4. Add missing context menu actions
5. Implement statistics and charting functionality
6. Complete keyboard shortcut system
7. Add PDF import and text summarization features
8. Implement database export/import functionality
9. Add sharing functionality
10. Implement tutorial system
11. Add changelog display
12. Implement policy acceptance
13. Test all features and fix any issues
14. Optimize performance and user experience

## 4. Technical Considerations

### 4.1 State Management
- Use existing Svelte stores for state management
- Ensure proper subscription cleanup in components
- Implement proper typing for all store data

### 4.2 UI/UX Consistency
- Maintain consistent styling with existing components
- Use CSS variables for theming
- Ensure responsive design works on all screen sizes

### 4.3 Performance
- Implement virtual scrolling for large data sets
- Optimize database queries
- Use proper loading states for async operations

### 4.4 Error Handling
- Implement comprehensive error handling
- Add user-friendly error messages
- Log errors for debugging

## 5. Testing Strategy

- Unit tests for services and utilities
- Component tests for UI elements
- Integration tests for complex workflows
- Manual testing of all features
- Cross-browser compatibility testing

## 6. Deployment Considerations

- Ensure all new features work in production build
- Verify performance is acceptable
- Test on different device sizes
- Validate all keyboard shortcuts work