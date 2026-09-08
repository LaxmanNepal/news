# खबरधारा (KhabarDhara) - Nepali News Aggregator

A modern, real-time Nepali news aggregator with iPhone-inspired glass morphism design. Aggregates news from 15 major Nepali news sources with live updates every second.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

## ✨ Features

### 📰 News Aggregation
- **15 Nepali News Sources**: OnlineKhabar, RatoPati, Nagarik, Setopati, eKantipur, and more
- **7 Categories**: ताजा (Latest), राजनीति (Politics), अर्थ (Economy), खेलकुद (Sports), मनोरञ्जन (Entertainment), प्रविधि (Technology), विदेश (World)
- **Real-time Updates**: Automatic refresh every 15-120 seconds (configurable)
- **Multi-proxy Fallback**: Uses multiple CORS proxies (allorigins, corsproxy.io, rss2json) for reliable fetching
- **Snapshot Fallback**: Shows sample articles when feeds are unreachable

### 🎨 iPhone-Inspired Design
- **Glass Morphism**: Frosted glass effects with backdrop blur throughout
- **Dynamic Island**: Live status indicator with countdown ring
- **iOS Status Bar**: Real-time clock, signal, WiFi, and battery indicators
- **App Icon Categories**: Gradient squircle tiles for each category
- **Bottom Tab Bar**: iPhone-style navigation with badges
- **Bottom Sheets**: iOS-style modal sheets for articles and settings
- **Banner Notifications**: Slide-down notifications for actions

### 📊 Live Widgets
- **Analog Clock**: Live clock with ticking second hand
- **Weather Widget**: Kathmandu weather display
- **Live Feed Console**: Real-time log of all feed operations
- **Source Status**: Visual indicators for each news source
- **Category Stats**: Article counts per category with progress bars

### 🔍 Search & Filter
- **Full-text Search**: Search across titles, descriptions, and sources
- **Category Filter**: Filter by news category
- **Source Filter**: Click source icons to filter by specific news outlet
- **Saved Articles**: Bookmark articles for later reading
- **Search Highlighting**: Matching text highlighted in results

### 📱 Responsive Design
- **Mobile**: Bottom tab bar, optimized for touch
- **Tablet**: Adaptive layout with larger cards
- **Desktop**: Full sidebar with live widgets
- **Safe Areas**: Proper handling of notches and home indicators

### 🌐 Nepali Language
- **Complete Nepali UI**: All text in Nepali (नेपाली)
- **Nepali Digits**: Numbers displayed in Nepali (०-९)
- **Nepali Dates**: Full Nepali date formatting
- **Relative Time**: "५ मिनेटअघि" (5 minutes ago) style timestamps

### ⚡ Performance
- **Skeleton Loading**: Shimmer effects while content loads
- **Intersection Observer**: Lazy loading for cards
- **Optimized Images**: Lazy loading with fallbacks
- **Efficient Updates**: Only re-renders changed content
- **Persistent State**: Settings saved in localStorage

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd khabardhara

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # iOS-style header with Dynamic Island
│   ├── Ticker.tsx      # Breaking news ticker
│   ├── CategoryBar.tsx # Category filter with app icons
│   ├── Feed.tsx        # Article grid with hero
│   ├── LivePanel.tsx   # Live feed console
│   ├── DetailModal.tsx # Article detail bottom sheet
│   ├── SourceSheet.tsx # Source management sheet
│   ├── TabBar.tsx      # Mobile bottom navigation
│   ├── Toast.tsx       # Banner notifications
│   ├── ClockWidget.tsx # Analog clock widget
│   ├── WeatherWidget.tsx # Weather display
│   └── SourceStrip.tsx # Source filter strip
├── data/
│   └── feeds.ts        # News source configuration
├── hooks/
│   └── useNews.ts      # News aggregation logic
├── lib/
│   └── rss.ts          # RSS parsing and utilities
├── App.tsx             # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## 🎯 Key Components

### useNews Hook
Central state management for news aggregation:
- Fetches from 15 RSS feeds
- Manages feed status (loading, ok, error)
- Tracks new articles
- Handles auto-refresh with countdown
- Persists user preferences

### Dynamic Island
Live status indicator showing:
- Live source count
- Sync countdown ring
- Loading state

### Category Bar
Filterable category navigation with:
- Gradient app icons
- Article counts
- Active state highlighting

### Feed Component
Article display with:
- Hero article (first item)
- Grid layout for remaining articles
- Image fallbacks
- New article badges
- Bookmark functionality

## 🎨 Design System

### Colors
- **Primary**: Cyan (#64d2ff)
- **Wire/Breaking**: Red (#ff3b30)
- **Success**: Green (#30d158)
- **Warning**: Gold (#ffd60a)
- **Background**: Deep blue-black (#0a0d1f)

### Typography
- **Headlines**: Noto Serif Devanagari
- **Body**: Mukta / Noto Sans Devanagari
- **Mono**: IBM Plex Mono

### Effects
- **Glass**: backdrop-blur(22px) + saturate(160%)
- **Shadows**: Deep, layered shadows for depth
- **Animations**: Spring-based transitions
- **Gradients**: iOS system color gradients

## 🔧 Configuration

### Adding News Sources

Edit `src/data/feeds.ts`:

```typescript
export const FEEDS: FeedSource[] = [
  {
    id: "example",
    name: "Example News",
    feed: "https://example.com/rss",
    site: "https://example.com",
    category: "taja",
    tag: "EX"
  },
  // ...
];
```

### Adjusting Refresh Interval

In `src/hooks/useNews.ts`, modify `INTERVAL_OPTIONS`:

```typescript
export const INTERVAL_OPTIONS = [
  { sec: 0, label: "बन्द" },      // Off
  { sec: 15, label: "१५से" },     // 15 seconds
  { sec: 30, label: "३०से" },     // 30 seconds
  { sec: 60, label: "१ मि" },     // 1 minute
  { sec: 120, label: "२ मि" },    // 2 minutes
];
```

## 📊 Data Flow

```
RSS Feeds → CORS Proxy → XML Parser → Article Objects
    ↓
useNews Hook (state management)
    ↓
Components (rendering)
    ↓
User Interaction → State Updates → Re-render
```

## 🌐 CORS Handling

The app uses multiple CORS proxies in sequence:
1. `api.allorigins.win`
2. `corsproxy.io`
3. `api.rss2json.com` (JSON API fallback)

If all proxies fail, snapshot articles are displayed.

## 📱 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest)
- **Mobile**: iOS Safari, Chrome Mobile
- **Features Required**: 
  - Fetch API
  - Intersection Observer
  - CSS backdrop-filter
  - CSS Grid & Flexbox

## 🐛 Troubleshooting

### News not loading?
- Check browser console for CORS errors
- Verify RSS feed URLs are accessible
- Try manual sync button
- Check network connectivity

### Images not showing?
- Some feeds don't include images
- Images may be blocked by CORS
- Fallback icons are displayed automatically

### Slow performance?
- Reduce refresh interval
- Disable unused sources
- Clear browser cache

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- News sources: All 15 Nepali news outlets
- Icons: Lucide React
- Design inspiration: iOS design language
- Fonts: Google Fonts (Noto, Mukta, IBM Plex)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**खबरधारा** - Stay informed with Nepal's news, beautifully delivered.
