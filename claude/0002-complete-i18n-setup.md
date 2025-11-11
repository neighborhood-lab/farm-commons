# Task 0002: Complete i18n Setup for Frontend

## Status

[ ] To Do
[ ] In Progress
[ ] Completed

## Priority

High

## Description

Complete the internationalization (i18n) setup for the frontend package. The i18n dependencies are installed but locale files are missing and several components have incomplete i18n integration. This is blocking the frontend build and needs to be resolved for bilingual support (English/Spanish).

## Acceptance Criteria

- [ ] Create en.json locale file with all UI strings
- [ ] Create es.json locale file with Spanish translations
- [ ] Fix ThemeToggle.tsx import path error
- [ ] Fix main.tsx import path error
- [ ] Remove unused 'Calendar' import from FieldsPage.tsx
- [ ] Fix WorkersPage.tsx missing 't' translation function calls
- [ ] Fix Layout.tsx missing imports and i18n setup
- [ ] Fix LanguageSwitcher.tsx react-i18next import
- [ ] Fix dateLocalization.ts missing Locale type
- [ ] Frontend build completes successfully
- [ ] All pages display correctly in both English and Spanish

## Technical Notes

### Files Requiring Fixes:

1. **src/locales/en.json** - Create with all UI strings
2. **src/locales/es.json** - Create with Spanish translations
3. **src/lib/i18n.ts** - Already configured, just needs locale files
4. **src/components/Layout.tsx** - Missing useTranslation import and setup
5. **src/components/LanguageSwitcher.tsx** - Missing react-i18next
6. **src/components/ThemeToggle.tsx** - Import path ending with .tsx
7. **src/main.tsx** - Import path issue
8. **src/pages/WorkersPage.tsx** - Missing translation function calls
9. **src/pages/FieldsPage.tsx** - Unused Calendar import
10. **src/lib/dateLocalization.ts** - Missing date-fns Locale type

### i18n Structure:

```json
{
  "common": {...},
  "navigation": {...},
  "dashboard": {...},
  "workers": {...},
  "schedule": {...},
  "timeTracking": {...},
  "fields": {...}
}
```

## Related Tasks

- Depends on: #0001 (Build errors partially fixed)
- Blocks: All frontend feature work
- Related to: Phase 1 MVP completion

## Completion Checklist

- [ ] Locale JSON files created and populated
- [ ] All import errors fixed
- [ ] All missing i18n hooks added
- [ ] Frontend builds without errors
- [ ] Manual testing in both languages
- [ ] Unit tests pass
- [ ] Documentation updated
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Completion Date

[YYYY-MM-DD]

## Notes

This task unblocks the entire frontend build. Priority is getting the build working, then we can improve translations incrementally.
