// 事件类型映射工具
// 用于在前端英文ID和后端中文值之间转换

const eventTypeMapping = {
  // 英文ID -> 中文显示名
  'mens_singles': '男子单打',
  'womens_singles': '女子单打', 
  'mens_doubles': '男子双打',
  'womens_doubles': '女子双打',
  'mixed_doubles': '混合双打'
};

// 中文显示名 -> 英文ID
const reverseEventTypeMapping = {
  '男子单打': 'mens_singles',
  '女子单打': 'womens_singles',
  '男子双打': 'mens_doubles', 
  '女子双打': 'womens_doubles',
  '混合双打': 'mixed_doubles'
};

// 将英文ID转换为中文显示名
const getChineseEventType = (englishId) => {
  return eventTypeMapping[englishId] || englishId;
};

// 将中文显示名转换为英文ID
const getEnglishEventType = (chineseName) => {
  return reverseEventTypeMapping[chineseName] || chineseName;
};

// 获取所有事件类型选项（用于前端下拉框）
const getAllEventTypes = () => {
  return Object.keys(eventTypeMapping).map(id => ({
    id: id,
    name: eventTypeMapping[id]
  }));
};

// 验证事件类型是否有效
const isValidEventType = (eventType) => {
  return Object.values(eventTypeMapping).includes(eventType) || 
         Object.keys(eventTypeMapping).includes(eventType);
};

module.exports = {
  eventTypeMapping,
  reverseEventTypeMapping,
  getChineseEventType,
  getEnglishEventType,
  getAllEventTypes,
  isValidEventType
};