// 实用工具函数，用于处理Thread相关的操作

/**
 * 格式化Thread ID为更友好的显示名称
 * @param threadId LangGraph返回的完整thread_id
 * @returns 格式化后的显示名称
 */
export const formatThreadTitle = (threadId: string): string => {
  // 如果thread_id包含常见的UUID格式，提取后面部分
//   if (threadId.includes('-')) {
//     const parts = threadId.split('-');
//     return `Thread ${parts[parts.length - 1].slice(0, 8)}`;
//   }
  
  // 否则取后8位字符
//   return `Thread ${threadId.slice(-8)}`;
  return `Thread(${threadId})`;
};

/**
 * 验证thread ID是否为有效的LangGraph格式
 * @param threadId 要验证的thread ID
 * @returns 是否为有效格式
 */
export const isValidThreadId = (threadId: string): boolean => {
  return threadId != null && threadId.length > 8;
};

/**
 * 生成Thread的简短描述
 * @param threadId thread ID
 * @param createdAt 创建时间
 * @returns 描述字符串
 */
export const getThreadDescription = (threadId: string, createdAt: string): string => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just created';
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
};

/**
 * 格式化时间为相对时间显示（xx minutes ago, xx hours ago, xx days ago）
 * @param timestamp ISO时间戳字符串
 * @returns 格式化后的相对时间字符串
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'm' : 'ms'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'h' : 'hs'} ago`;
  } else {
    return `${diffInDays} ${diffInDays === 1 ? 'd' : 'ds'} ago`;
  }
};
