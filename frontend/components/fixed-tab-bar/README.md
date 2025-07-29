# FixedTabBar Component Documentation

## Overview

The FixedTabBar component provides a persistent navigation system that remains fixed at the top of the page during scrolling. It's designed specifically for the tennis tournament mini-program's event management interface.

## Features

- **Fixed Positioning**: Stays visible during page scrolling
- **Badge Support**: Shows notification counts and indicators
- **Authentication Integration**: Disables tabs that require login
- **Touch Friendly**: Optimized for mobile interaction
- **Accessibility**: Screen reader and keyboard navigation support
- **Haptic Feedback**: Provides tactile feedback on supported devices
- **Analytics**: Tracks user interaction patterns

## Usage

### Basic Implementation

```xml
<fixed-tab-bar 
  tabs="{{tabs}}"
  activeTab="{{activeTab}}"
  bindtabchange="onTabChange"
  className="event-tab-bar"
></fixed-tab-bar>
```

### Tab Configuration

```javascript
tabs: [
  { 
    id: 'all', 
    name: '全部', 
    icon: '📋', 
    badge: 0 
  },
  { 
    id: 'search', 
    name: '搜索', 
    icon: '🔍', 
    badge: 0 
  },
  { 
    id: 'create', 
    name: '创建', 
    icon: '➕', 
    badge: 0, 
    requiresAuth: true 
  },
  { 
    id: 'my', 
    name: '我的', 
    icon: '👤', 
    badge: 0, 
    requiresAuth: true 
  },
  { 
    id: 'popular', 
    name: '热门', 
    icon: '🔥', 
    badge: 0 
  }
]
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tabs` | Array | `[]` | Array of tab configuration objects |
| `activeTab` | String | `''` | ID of the currently active tab |
| `className` | String | `''` | Custom CSS class name |
| `customStyle` | String | `''` | Custom inline styles |
| `enableHaptic` | Boolean | `true` | Enable haptic feedback |
| `enableAnimation` | Boolean | `true` | Enable tab switching animations |

## Tab Configuration Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | String | Yes | Unique identifier for the tab |
| `name` | String | Yes | Display name of the tab |
| `icon` | String | Yes | Icon (emoji or icon class) |
| `badge` | Number | No | Badge count (0 hides badge) |
| `disabled` | Boolean | No | Whether the tab is disabled |
| `requiresAuth` | Boolean | No | Whether tab requires authentication |

## Events

### tabchange

Triggered when user taps on a tab.

```javascript
onTabChange: function(e) {
  const { activeTab, previousTab, tabData, index } = e.detail;
  // Handle tab change
}
```

### tabchanged

Triggered after tab change is complete.

```javascript
onTabChanged: function(e) {
  const { newTab, oldTab, timestamp } = e.detail;
  // Handle post-change logic
}
```

## Methods

### updateTabBadge(tabId, badgeCount)

Updates the badge count for a specific tab.

```javascript
this.selectComponent('#tab-bar').updateTabBadge('search', 5);
```

### setTabDisabled(tabId, disabled)

Enables or disables a specific tab.

```javascript
this.selectComponent('#tab-bar').setTabDisabled('create', true);
```

### getTabUsageStats()

Returns usage statistics for analytics.

```javascript
const stats = this.selectComponent('#tab-bar').getTabUsageStats();
```

## Styling

### CSS Variables

```css
--primary-color: #0A4A39;
--primary-color-dark: #083A2F;
--text-on-primary: #FFFFFF;
--card-background: #FFFFFF;
--text-secondary: #666666;
--border-color: #EEEEEE;
```

### Custom Styling

```css
.event-tab-bar {
  background-color: var(--card-background);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
```

## Responsive Design

The component automatically adapts to different screen sizes:

- **Mobile (< 480px)**: Compact layout with smaller icons
- **Tablet (> 768px)**: Expanded layout with larger touch targets
- **Landscape**: Adjusted positioning and spacing

## Accessibility

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Arrow key support
- **Focus Management**: Clear focus indicators
- **High Contrast**: Supports system dark mode

## Performance

- **Lazy Loading**: Tab content loads only when accessed
- **Memory Management**: Automatic cleanup of unused data
- **Efficient Rendering**: Minimal re-renders with memoization
- **Touch Optimization**: Debounced touch events

## Browser Support

- WeChat Mini Program
- iOS Safari (H5 version)
- Android Chrome (H5 version)
- Desktop browsers (admin panel)

## Best Practices

1. **Tab Count**: Keep to 5 tabs maximum for mobile usability
2. **Badge Updates**: Update badges sparingly to avoid performance issues
3. **Authentication**: Check auth status before enabling protected tabs
4. **Error Handling**: Provide fallbacks for failed tab loads
5. **Analytics**: Track tab usage for UX improvements

## Troubleshooting

### Common Issues

**Tabs not switching**
- Check if tab is disabled
- Verify authentication status for protected tabs
- Ensure proper event binding

**Badges not updating**
- Call `updateTabBadge()` method explicitly
- Check badge count calculation logic
- Verify data binding

**Performance issues**
- Limit badge update frequency
- Use lazy loading for tab content
- Implement proper cleanup in lifecycle methods

### Debug Mode

Enable debug logging:

```javascript
// In component initialization
console.log('FixedTabBar debug mode enabled');
```

## Migration Guide

### From Header Navigation

1. Replace header navigation with FixedTabBar
2. Move tab content into slot-based structure
3. Update event handlers for new tab system
4. Migrate existing state management

### Breaking Changes

- Tab switching now uses event system instead of direct method calls
- Badge system requires explicit updates
- Authentication integration is now built-in

## Examples

### Complete Implementation

```xml
<!-- Page WXML -->
<view class="container">
  <fixed-tab-bar 
    id="tab-bar"
    tabs="{{tabs}}"
    activeTab="{{activeTab}}"
    bindtabchange="onTabChange"
    className="event-tab-bar"
  ></fixed-tab-bar>
  
  <view class="tab-content-container">
    <!-- Tab content here -->
  </view>
</view>
```

```javascript
// Page JS
Page({
  data: {
    activeTab: 'all',
    tabs: [
      { id: 'all', name: '全部', icon: '📋', badge: 0 },
      { id: 'search', name: '搜索', icon: '🔍', badge: 0 }
    ]
  },
  
  onTabChange: function(e) {
    const { activeTab } = e.detail;
    this.setData({ activeTab });
    this.loadTabData(activeTab);
  },
  
  updateSearchBadge: function(count) {
    this.selectComponent('#tab-bar').updateTabBadge('search', count);
  }
});
```

## Support

For issues and feature requests, please refer to the project documentation or contact the development team.