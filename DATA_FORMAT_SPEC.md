# StackMap Data Format Specification

## Overview
This document defines the data format used by StackMap for import/export operations between the PWA and React Native applications.

## Version
Current version: 3

## Data Structure

### Root Object
```json
{
  "version": 3,
  "currentDay": "today" | "tomorrow",
  "users": { /* Users object */ },
  "globalSettings": { /* Global settings */ },
  "templates": [ /* Array of templates */ ],
  "exportDate": "ISO 8601 date string"
}
```

### Users Object
```json
{
  "[userId]": {
    "id": "user_[timestamp]",
    "name": "string",
    "icon": "emoji",
    "days": {
      "today": { "activities": [ /* Array of activities */ ] },
      "tomorrow": { "activities": [ /* Array of activities */ ] }
    },
    "settings": {
      "taskCelebration": "rainbow" | "blue" | "orange" | "pink" | "purple" | "gold" | "green" | "none" | "random",
      "routineCelebration": "rainbow" | "blue" | "orange" | "pink" | "purple" | "gold" | "green" | "none" | "random",
      "soundEnabled": boolean
    },
    "createdAt": "ISO 8601 date string",
    "lastActive": "ISO 8601 date string"
  }
}
```

### Activity Object
```json
{
  "id": "activity_[timestamp]",
  "text": "string",
  "description": "string",
  "emoji": "emoji",
  "completed": boolean,
  "pinned": boolean,
  "activityType": "normal" | "routine",
  "time": null | "HH:MM",
  "createdAt": "ISO 8601 date string"
}
```

### Global Settings
```json
{
  "currentTheme": "purple" | "blue" | "green" | "red" | "orange" | "pink",
  "bannerPosition": "top" | "bottom",
  "defaultView": "normal",
  "displayMode": "numbers" | "icons" | "time",
  "enableDayManagement": boolean,
  "editModePin": null | "4-digit string",
  "pinEnabled": boolean
}
```

### Template Object
```json
{
  "id": "template_[timestamp]",
  "name": "string",
  "emoji": "emoji",
  "description": "string",
  "category": "personal" | "work" | "health" | "learning" | "custom",
  "isDefault": boolean,
  "createdAt": "ISO 8601 date string"
}
```

## Migration Support
The data migration function in both apps handles:
- Converting legacy `title` fields to `text`
- Adding missing fields with sensible defaults
- Ensuring all IDs follow the correct format
- Preserving unknown fields for forward compatibility

## File Format
- File extension: `.json`
- Encoding: UTF-8
- Pretty printed with 2-space indentation
- File naming convention: `stackmap-export-YYYY-MM-DD.json`

## Compatibility
- Both PWA and React Native apps support reading version 3 data
- The apps will migrate older versions automatically on import
- Unknown fields are preserved to maintain forward compatibility