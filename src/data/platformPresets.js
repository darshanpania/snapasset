export const platformPresets = {
  // Social Media Platforms
  instagram: {
    name: 'Instagram',
    icon: '📷',
    category: 'social',
    dimensions: [
      { label: 'Post (Square)', width: 1080, height: 1080 },
      { label: 'Post (Portrait)', width: 1080, height: 1350 },
      { label: 'Post (Landscape)', width: 1080, height: 566 },
      { label: 'Story', width: 1080, height: 1920 },
      { label: 'Reels', width: 1080, height: 1920 },
      { label: 'Profile Picture', width: 320, height: 320 },
    ]
  },
  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    category: 'social',
    dimensions: [
      { label: 'Post Image', width: 1200, height: 675 },
      { label: 'Header', width: 1500, height: 500 },
      { label: 'Profile Picture', width: 400, height: 400 },
    ]
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    category: 'social',
    dimensions: [
      { label: 'Post Image', width: 1200, height: 630 },
      { label: 'Cover Photo', width: 820, height: 312 },
      { label: 'Profile Picture', width: 180, height: 180 },
      { label: 'Story', width: 1080, height: 1920 },
    ]
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    category: 'social',
    dimensions: [
      { label: 'Post Image', width: 1200, height: 627 },
      { label: 'Cover Photo', width: 1584, height: 396 },
      { label: 'Profile Picture', width: 400, height: 400 },
      { label: 'Company Logo', width: 300, height: 300 },
    ]
  },
  youtube: {
    name: 'YouTube',
    icon: '📺',
    category: 'social',
    dimensions: [
      { label: 'Thumbnail', width: 1280, height: 720 },
      { label: 'Channel Art', width: 2560, height: 1440 },
      { label: 'Profile Picture', width: 800, height: 800 },
    ]
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    category: 'social',
    dimensions: [
      { label: 'Video', width: 1080, height: 1920 },
      { label: 'Profile Picture', width: 200, height: 200 },
    ]
  },
  pinterest: {
    name: 'Pinterest',
    icon: '📌',
    category: 'social',
    dimensions: [
      { label: 'Pin (Standard)', width: 1000, height: 1500 },
      { label: 'Pin (Square)', width: 1000, height: 1000 },
      { label: 'Profile Picture', width: 165, height: 165 },
    ]
  },

  // App Icons
  ios: {
    name: 'iOS App',
    icon: '🍎',
    category: 'app',
    dimensions: [
      { label: 'App Icon (@3x)', width: 180, height: 180 },
      { label: 'App Icon (@2x)', width: 120, height: 120 },
      { label: 'App Icon (@1x)', width: 60, height: 60 },
      { label: 'App Store', width: 1024, height: 1024 },
    ]
  },
  android: {
    name: 'Android App',
    icon: '🤖',
    category: 'app',
    dimensions: [
      { label: 'XXXHDPI', width: 192, height: 192 },
      { label: 'XXHDPI', width: 144, height: 144 },
      { label: 'XHDPI', width: 96, height: 96 },
      { label: 'HDPI', width: 72, height: 72 },
      { label: 'Play Store', width: 512, height: 512 },
    ]
  },

  // Web Assets
  favicon: {
    name: 'Favicon',
    icon: '🌐',
    category: 'web',
    dimensions: [
      { label: '32x32', width: 32, height: 32 },
      { label: '16x16', width: 16, height: 16 },
      { label: 'Apple Touch Icon', width: 180, height: 180 },
    ]
  },
  openGraph: {
    name: 'Open Graph',
    icon: '🔗',
    category: 'web',
    dimensions: [
      { label: 'OG Image', width: 1200, height: 630 },
    ]
  },
  twitter_card: {
    name: 'Twitter Card',
    icon: '🎴',
    category: 'web',
    dimensions: [
      { label: 'Summary Card', width: 1200, height: 630 },
      { label: 'Large Summary', width: 1200, height: 600 },
    ]
  },
  webBanner: {
    name: 'Web Banner',
    icon: '🖼️',
    category: 'web',
    dimensions: [
      { label: 'Leaderboard', width: 728, height: 90 },
      { label: 'Medium Rectangle', width: 300, height: 250 },
      { label: 'Wide Skyscraper', width: 160, height: 600 },
    ]
  },
}