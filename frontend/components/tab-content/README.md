# TabContent Component Documentation

## Overview

The TabContent component manages the display and lifecycle of content within the fixed tab system. It provides lazy loading, caching, error handling, and smooth transitions between different tab views.

## Features

- **Lazy Loading**: Content loads only when tabs are accessed
- **Intelligent Caching**: Automatic data caching with expiration
- **Error Handling**: Comprehensive error states with retry options
- **Loading States**: Skeleton screens and loading indicators
- **Smooth Transitions**: Animated content switching
- **Memory Management**: Automatic cleanup of unused data
- **Performance Monitoring**: Built-in performance metrics

## Usage

### Basic Implementation

```xml
<tab-content 
  activeTab="{{activeTab}}"
  loading="{{loading}}"
  error="{{error}}"
  enableLazyLoad="{{true}}"
  enableCache="{{true}}"
  bindtabcontentchange="onTabContentChange"
  bindlazyload="onTabLazyLoad"
  bindretry="onTabRetry"
>
  <!-- Tab content slots -->
  <view slot="all-events">
    <!-- All events content -->
  </view>
  
  <view slot="search">
    <!-- Search content -->
  </view>
  
  <view slot="create">
    <!-- Create form content -->
  </view>
</tab-content>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activeTab` | String | `''` | Currently active tab ID |
| `loading` | Boolean | `false` | Global loading state |
| `error` | String | `''` | Error message to display |
| `loadingText` | String | `'加载中...'` | Custom loading text |
| `showRetry` | Boolean | `true` | Show retry button on error |
| `className` | String | `''` | Custom CSS class |
| `customStyle` | String | `''` | Custom inline styles |
| `enableLazyLoad` | Boolean | `true` | Enable lazy loading |
| `enableCache` | Boolean | `true` | Enable data caching |
| `cacheExpiry` | Number | `300000` | Cache expiry time (ms) |
| `enableTransition` | Boolean | `true` | Enable transitions |

## Slots

The component uses named slots for different tab content:

- `all-events`: All events tab content
- `search`: Search tab content  
- `create`: Create event tab content
- `my-events`: My events tab content
- `popular`: Popular events tab content

## Events

### tabcontentchange

Triggered when tab content changes.

```javascript
onTabContentChange: function(e) {
  const { activeTab, previousTab, timestamp } = e.detail;
  // Handle content change
}
```

### lazyload

Triggered when a tab needs to be lazy loaded.

```javascript
onTabLazyLoad: function(e) {
  const { tabId } = e.detail;
  this.loadTabData(tabId);
}
```

### retry

Triggered when user clicks retry button.

```javascript
onTabRetry: function(e) {
  const { activeTab } = e.detail;
  this.retryLoadTab(activeTab);
}
```

### preload

Triggered for tab preloading.

```javascript
onPreload: function(e) {
  const { tabId } = e.detail;
  this.preloadTabData(tabId);
}
```

### refresh

Triggered when tab is refreshed.

```javascript
onRefresh: function(e) {
  const { tabId } = e.detail;
  this.refreshTabData(tabId);
}
```

## Methods

### setCacheData(tabId, data)

Sets cached data for a specific tab.

```javascript
this.selectComponent('#tab-content').setCacheData('search', searchResults);
```

### getCacheData(tabId)

Retrieves cached data for a tab.

```javascript
const cachedData = this.selectComponent('#tab-content').getCacheData('search');
```

### clearTabCache(tabId)

Clears cache for a specific tab.

```javascript
this.selectComponent('#tab-content').clearTabCache('search');
```

### clearAllCache()

Clears all cached data.

```javascript
this.selectComponent('#tab-content').clearAllCache();
```

### preloadTab(tabId)

Preloads a specific tab.

```javascript
this.selectComponent('#tab-content').preloadTab('popular');
```

### refreshTab(tabId)

Forces refresh of a tab.

```javascript
this.selectComponent('#tab-content').refreshTab('my-events');
```

### getPerformanceMetrics()

Returns performance metrics.

```javascript
const metrics = this.selectComponent('#tab-content').getPerformanceMetrics();
```

## Caching System

### Cache Structure

```javascript
{
  cache: {
    'search': { results: [...], query: 'tennis' },
    'popular': { events: [...], timeRange: '7d' }
  },
  cacheTimestamps: {
    'search': 1640995200000,
    'popular': 1640995300000
  }
}
```

### Cache Expiry

- Default expiry: 5 minutes
- Automatic cleanup of expired cache
- Manual cache invalidation support

### Cache Strategies

1. **Time-based**: Expires after set duration
2. **Manual**: Explicit invalidation
3. **Memory-based**: LRU eviction when memory is low

## Loading States

### Loading Indicators

```xml
<!-- Built-in loading state -->
<view class="tab-loading">
  <view class="loading-spinner"></view>
  <view class="loading-text">{{loadingText}}</view>
</view>
```

### Custom Loading States

```javascript
// Set custom loading text
this.setData({
  loadingText: '正在搜索赛事...'
});
```

## Error Handling

### Error Display

```xml
<!-- Built-in error state -->
<view class="tab-error">
  <view class="error-icon">⚠️</view>
  <view class="error-message">{{error}}</view>
  <button class="retry-btn" bindtap="onRetry">重试</button>
</view>
```

### Error Recovery

```javascript
// Handle error with retry
onTabRetry: function(e) {
  const { activeTab } = e.detail;
  
  // Clear error state
  this.setData({ error: '' });
  
  // Retry loading
  this.loadTabData(activeTab);
}
```

## Performance Optimization

### Lazy Loading

- Content loads only when tab is first accessed
- Reduces initial page load time
- Improves memory usage

### Virtual Scrolling

For large lists within tabs:

```javascript
// Enable virtual scrolling for large datasets
enableVirtualScroll: true,
itemHeight: 120, // Fixed item height
bufferSize: 10   // Items to render outside viewport
```

### Memory Management

- Automatic cleanup of unused data
- Configurable cache limits
- Memory usage monitoring

## Transitions and Animations

### Built-in Transitions

- Fade in/out
- Slide left/right
- Scale animations

### Custom Transitions

```css
.tab-panel.custom-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Accessibility

### Screen Reader Support

```xml
<view 
  class="tab-panel" 
  role="tabpanel"
  aria-labelledby="tab-{{activeTab}}"
  aria-hidden="{{activeTab !== tabId}}"
>
  <!-- Content -->
</view>
```

### Keyboard Navigation

- Tab key navigation
- Arrow key support
- Enter/Space activation

## Best Practices

### Data Management

1. **Cache Wisely**: Cache frequently accessed data
2. **Clean Up**: Implement proper cleanup in lifecycle methods
3. **Error Boundaries**: Handle errors gracefully
4. **Loading States**: Always show loading feedback

### Performance

1. **Lazy Load**: Use lazy loading for heavy content
2. **Debounce**: Debounce rapid tab switches
3. **Virtual Scrolling**: For large lists
4. **Memory Limits**: Set reasonable cache limits

### User Experience

1. **Smooth Transitions**: Use appropriate animations
2. **Error Recovery**: Provide retry mechanisms
3. **Loading Feedback**: Show progress indicators
4. **Offline Support**: Handle network failures

## Troubleshooting

### Common Issues

**Content not loading**
- Check lazy loading configuration
- Verify event handlers are bound
- Ensure data loading logic is correct

**Cache not working**
- Verify cache is enabled
- Check cache expiry settings
- Ensure proper cache key usage

**Performance issues**
- Monitor memory usage
- Check for memory leaks
- Optimize data structures

### Debug Mode

```javascript
// Enable debug logging
this.setData({
  debugMode: true
});
```

## Migration Guide

### From Static Content

1. Wrap existing content in slot elements
2. Add lazy loading logic
3. Implement error handling
4. Add loading states

### Breaking Changes

- Content must be wrapped in named slots
- Loading states are now managed by component
- Cache system requires explicit data setting

## Examples

### Complete Tab Implementation

```xml
<tab-content 
  activeTab="{{activeTab}}"
  loading="{{loading}}"
  error="{{error}}"
  enableLazyLoad="{{true}}"
  enableCache="{{true}}"
  bindlazyload="onTabLazyLoad"
>
  <view slot="search">
    <view class="search-content">
      <input 
        placeholder="搜索赛事..." 
        value="{{searchQuery}}"
        bindinput="onSearchInput"
      />
      <view wx:for="{{searchResults}}" wx:key="id">
        {{item.name}}
      </view>
    </view>
  </view>
</tab-content>
```

```javascript
Page({
  data: {
    activeTab: 'search',
    loading: false,
    error: '',
    searchQuery: '',
    searchResults: []
  },
  
  onTabLazyLoad: function(e) {
    const { tabId } = e.detail;
    
    if (tabId === 'search') {
      this.loadSearchData();
    }
  },
  
  loadSearchData: function() {
    this.setData({ loading: true });
    
    // Load data
    API.searchEvents().then(res => {
      this.setData({
        searchResults: res.data,
        loading: false
      });
      
      // Cache the results
      this.selectComponent('#tab-content')
        .setCacheData('search', res.data);
    }).catch(err => {
      this.setData({
        error: '搜索失败，请重试',
        loading: false
      });
    });
  }
});
```

## Support

For technical support and feature requests, please refer to the project documentation or contact the development team.