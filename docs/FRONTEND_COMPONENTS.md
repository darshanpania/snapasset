# Frontend Core Components Documentation

## Overview

This document describes the core frontend components implemented for the SnapAsset image generation interface.

## Component Architecture

```
src/
├── components/
│   ├── PromptInput.jsx         # Image prompt input component
│   ├── PromptInput.css         # Prompt input styles
│   ├── PlatformPresets.jsx     # Platform selection component
│   ├── PlatformPresets.css     # Platform presets styles
│   ├── ResultsGrid.jsx         # Results display component
│   └── ResultsGrid.css         # Results grid styles
├── data/
│   └── platformPresets.js      # Platform dimensions data
├── App.jsx                     # Main application
└── App.css                     # Global styles
```

## Components

### 1. PromptInput Component

**Purpose:** Allows users to describe the image they want to generate.

**Features:**
- Text area with 500 character limit
- Character counter
- Image style selector (6 options)
- Form validation
- Loading state during generation
- Helpful tips section

**Props:**
- `onGenerate`: Function called when user submits (receives `{ prompt, imageType }`)
- `isGenerating`: Boolean to disable inputs during generation

**Usage:**
```jsx
<PromptInput 
  onGenerate={handleGenerate}
  isGenerating={isGenerating}
/>
```

### 2. PlatformPresets Component

**Purpose:** Multi-select interface for choosing target platforms and their dimensions.

**Features:**
- Organized by categories (Social, App, Web)
- Search functionality
- Select/Deselect all per category
- Visual selection summary
- Expandable/collapsible categories
- Shows dimension count per platform

**Props:**
- `selectedPlatforms`: Array of selected platform keys
- `onPlatformToggle`: Function called when toggling selection `(key, isSelected)`
- `isGenerating`: Boolean to disable during generation

**Usage:**
```jsx
<PlatformPresets 
  selectedPlatforms={selectedPlatforms}
  onPlatformToggle={handlePlatformToggle}
  isGenerating={isGenerating}
/>
```

### 3. ResultsGrid Component

**Purpose:** Displays generated images in a responsive grid with download options.

**Features:**
- Responsive grid layout
- Individual image preview
- Image preview modal
- Download individual images
- Download all as ZIP button
- Shows platform info, dimensions, file size

**Props:**
- `results`: Array of result objects
- `isGenerating`: Boolean loading state

**Result Object Structure:**
```javascript
{
  platform: 'Instagram',
  label: 'Post (Square)',
  width: 1080,
  height: 1080,
  icon: '📷',
  url: 'https://...',
  thumbnail: 'https://...',
  fileSize: 245000 // bytes
}
```

**Usage:**
```jsx
<ResultsGrid 
  results={results}
  isGenerating={isGenerating}
/>
```

## Platform Presets Data

Located in `src/data/platformPresets.js`

### Structure

```javascript
{
  platformKey: {
    name: 'Platform Name',
    icon: '📱',
    category: 'social' | 'app' | 'web' | 'custom',
    dimensions: [
      { label: 'Type', width: 1080, height: 1080 }
    ]
  }
}
```

### Included Platforms

#### Social Media
- **Instagram**: Post (3 formats), Story, Reels, Profile
- **Twitter/X**: Post, Header, Profile
- **Facebook**: Post, Cover, Profile, Story
- **LinkedIn**: Post, Cover, Profile, Company Logo
- **YouTube**: Thumbnail, Channel Art, Profile
- **TikTok**: Video, Profile
- **Pinterest**: Pin (standard & square), Profile

#### App Icons
- **iOS**: App Icon (@1x, @2x, @3x), App Store
- **Android**: HDPI, XHDPI, XXHDPI, XXXHDPI, Play Store

#### Web Assets
- **Favicon**: 16x16, 32x32, Apple Touch Icon
- **Open Graph**: OG Image
- **Twitter Card**: Summary, Large Summary
- **Web Banner**: Leaderboard, Medium Rectangle, Wide Skyscraper

## State Management

The main App component manages:

```javascript
const [selectedPlatforms, setSelectedPlatforms] = useState([])
const [isGenerating, setIsGenerating] = useState(false)
const [results, setResults] = useState([])
```

### Platform Selection Logic

```javascript
const handlePlatformToggle = (platformKey, isSelected) => {
  setSelectedPlatforms(prev => {
    if (isSelected && !prev.includes(platformKey)) {
      return [...prev, platformKey]
    } else if (!isSelected && prev.includes(platformKey)) {
      return prev.filter(key => key !== platformKey)
    }
    return prev
  })
}
```

### Generation Flow

1. User enters prompt and selects image style
2. User selects target platforms
3. User clicks "Generate Images"
4. Validation checks
5. API call to generate images
6. Results displayed in grid
7. User can preview/download images

## Styling

### Design System

**Colors:**
- Primary: `#667eea` → `#764ba2` (gradient)
- Secondary: `#f093fb` → `#f5576c` (gradient)
- Success: `#4caf50`
- Error: `#f44336`
- Background: `#f5f7fa`

**Typography:**
- System fonts: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- Headers: 1.8rem - 3rem
- Body: 1rem
- Small: 0.85rem

**Spacing:**
- Base unit: 0.5rem (8px)
- Common: 1rem, 1.5rem, 2rem, 3rem

**Border Radius:**
- Small: 6px - 8px
- Medium: 12px
- Large: 20px
- Pill: 50px

### Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## API Integration (To Do)

### Expected Backend Endpoint

```
POST /api/generate
Content-Type: application/json

{
  "prompt": "A modern minimalist logo",
  "imageType": "photo",
  "platforms": ["instagram", "twitter", "facebook"]
}
```

### Expected Response

```json
{
  "success": true,
  "results": [
    {
      "platform": "instagram",
      "label": "Post (Square)",
      "width": 1080,
      "height": 1080,
      "url": "https://storage.../image.png",
      "fileSize": 245000
    }
  ]
}
```

## Accessibility

- Semantic HTML elements
- ARIA labels on icon-only buttons
- Keyboard navigation support
- Focus states on interactive elements
- Alt text on images
- Screen reader friendly

## Performance Optimizations

- Lazy loading images with `loading="lazy"`
- CSS transitions instead of JS animations
- Debounced search input (can be added)
- Virtual scrolling for large result sets (can be added)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

1. **Drag & Drop Upload**: Add image upload capability
2. **Image History**: Store and retrieve previous generations
3. **Favorites**: Save preferred platforms
4. **Batch Operations**: Generate multiple variations
5. **Advanced Editing**: Crop, rotate, adjust before generation
6. **Custom Dimensions**: Allow user-defined sizes
7. **Templates**: Pre-made prompt templates
8. **Export Options**: Different formats (PNG, JPG, WebP)
9. **Sharing**: Share results via link
10. **Dark Mode**: Theme toggle

## Testing Checklist

- [ ] Prompt validation works
- [ ] Character counter accurate
- [ ] Style selector changes value
- [ ] Platform search filters correctly
- [ ] Multi-select works
- [ ] Category expand/collapse
- [ ] Select/Deselect all works
- [ ] Results display correctly
- [ ] Modal opens/closes
- [ ] Download buttons work (when implemented)
- [ ] Responsive on mobile
- [ ] Loading states appear
- [ ] Error messages display

## Contributing

When adding new components:

1. Create component file in `src/components/`
2. Create corresponding CSS file
3. Export from component file
4. Import in App.jsx
5. Add to this documentation
6. Test responsive behavior
7. Ensure accessibility

---

**Last Updated:** January 24, 2026  
**Author:** Darshan Pania
