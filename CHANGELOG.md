# Changelog

All notable changes to StackMap will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive repository documentation update
- CONTRIBUTING.md guide for new contributors
- SECURITY.md with vulnerability reporting guidelines
- Visual screenshots in README for better first impressions
- Detailed feature descriptions and user benefits

### Changed
- README.md completely redesigned for user-first approach
- Documentation reorganized for better navigation

## [2025.09.17] - 2025-09-17

### Added
- SonarQube quality improvements implementation
- Strategic test skip functionality for non-critical components
- Console cleanup analysis and backlog tracking system

### Fixed
- All SonarQube API analysis issues resolved
- Dynamic imports converted to static imports in ActivityLibrary tests

### Improved
- Test infrastructure overhaul achieving 94.4% pass rate (68/72 suites)
- Test coverage expanded significantly across multiple components

## [2025.08.18] - 2025-08-18

### Added
- Sync Infrastructure Logic Testing (Session 12)
- Modal business logic extraction and testing (Session 11)
- minimalSyncService test coverage increased from 81% to 92.37%
- Store business logic comprehensive test coverage
- 100% test coverage for constants and utils

### Fixed
- Store integration test issues
- minimalSyncService rate limiting test flakiness
- CategoryActions achieved 100% test coverage

### Changed
- Test infrastructure significantly improved
- Business logic separated from UI components for better testability

## [2025.08.15] - 2025-08-15

### Added
- Store architecture refactoring into 4 focused Zustand stores
- TypeScript migration with @ts-check gradual adoption
- Edit Mode List Refactor for unified interface

### Changed
- Monolithic store split into UserStore, SettingsStore, LibraryStore, AppStore
- Button-based reordering replacing drag & drop for better performance
- Simplified animations (200ms fades) for iOS performance

## [2025.07.01] - 2025-07-01

### Added
- Zero-knowledge encryption sync system
- 32-character hexadecimal recovery phrases
- Invite code system (XXXX-XXXX format)
- Real-time synchronization with 30-second intervals
- Offline queue system for sync

### Security
- Client-side encryption before data transmission
- NaCl encryption with 100k iterations
- Secure recovery phrase generation

## [2025.01.13] - 2025-01-13

### Added
- Multi-user support with personalized themes
- Activity library with pre-built templates
- Check-in system with mood and weather tracking
- Import/Export functionality

### Changed
- Visual activity card system improvements
- Timer functionality for activities
- Progress tracking enhancements

### Fixed
- iOS AsyncStorage 20+ second freeze issue
- Android FlexWrap card layout issues
- Web 3-column layout responsive breakpoints

## [2024.12.01] - 2024-12-01

### Added
- Initial public release
- Cross-platform support (iOS, Android, Web)
- Visual schedule management
- Comic Relief font for accessibility
- High contrast interface

### Features
- Activity cards with icons
- Drag and drop reordering
- User profile creation
- Basic sync functionality
- PWA support for offline use

---

For a complete list of changes, see the [commit history](https://github.com/yourusername/StackMap/commits/main).