// Common utility functions

/**
 * Format date to string
 * @param {Date} date - Date object
 * @param {String} format - Format string
 * @return {String} Formatted date string
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return format
    .replace('YYYY', year)
    .replace('MM', formatNumber(month))
    .replace('DD', formatNumber(day))
    .replace('HH', formatNumber(hour))
    .replace('mm', formatNumber(minute))
    .replace('ss', formatNumber(second));
};

/**
 * Format number to 2 digits
 * @param {Number} n - Number to format
 * @return {String} Formatted number
 */
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};

/**
 * Format match duration
 * @param {Number} minutes - Duration in minutes
 * @return {String} Formatted duration (e.g. "2h15")
 */
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h${mins > 0 ? formatNumber(mins) : ''}`;
  } else {
    return `${mins}m`;
  }
};

/**
 * Get match status text
 * @param {String} status - Status code
 * @return {String} Status text
 */
const getMatchStatusText = (status) => {
  const statusMap = {
    'completed': 'COMPLETED',
    'ongoing': 'LIVE',
    'upcoming': 'UPCOMING',
    'registration': 'REGISTRATION'
  };
  
  return statusMap[status] || status.toUpperCase();
};

/**
 * Get match status class
 * @param {String} status - Status code
 * @return {String} CSS class name
 */
const getMatchStatusClass = (status) => {
  const classMap = {
    'completed': 'status-completed',
    'ongoing': 'status-ongoing',
    'upcoming': 'status-upcoming',
    'registration': 'status-registration'
  };
  
  return classMap[status] || '';
};

/**
 * Calculate win rate
 * @param {Number} wins - Number of wins
 * @param {Number} total - Total number of matches
 * @return {String} Win rate percentage
 */
const calculateWinRate = (wins, total) => {
  if (total === 0) return '0%';
  return `${Math.round((wins / total) * 100)}%`;
};

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @return {Object} Cloned object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @return {Boolean} True if empty
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Generate random ID
 * @param {Number} length - ID length
 * @return {String} Random ID
 */
const generateRandomId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Format event time for display
 * @param {String} timeString - ISO time string
 * @return {String} Formatted time display
 */
const formatEventTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const date = new Date(timeString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日(${weekday})${formatNumber(hour)}:${formatNumber(minute)}`;
  } catch (e) {
    return timeString;
  }
};

module.exports = {
  formatDate,
  formatNumber,
  formatDuration,
  getMatchStatusText,
  getMatchStatusClass,
  calculateWinRate,
  deepClone,
  isEmpty,
  generateRandomId,
  formatEventTime
}; 