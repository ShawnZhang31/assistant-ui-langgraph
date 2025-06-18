// 错误处理和调试工具

/**
 * 安全地从Thread状态中提取消息数组
 * @param state LangGraph API返回的Thread状态
 * @returns 消息数组，如果无法提取则返回空数组
 */
export const extractMessagesFromThreadState = (state: any): any[] => {
  try {
    console.log('Extracting messages from thread state:', state);
    
    if (!state) {
      console.warn('Thread state is null or undefined');
      return [];
    }
    
    if (!state.values) {
      console.warn('Thread state does not have values property');
      return [];
    }
    
    const values = state.values;
    
    // 如果values是数组，可能messages在数组中
    if (Array.isArray(values)) {
      console.log('Thread state values is an array, length:', values.length);
      // 查找包含messages的对象
      for (const item of values) {
        if (item && typeof item === 'object' && 'messages' in item) {
          const messages = item.messages;
          if (Array.isArray(messages)) {
            console.log('Found messages array in values array:', messages.length, 'messages');
            return messages;
          }
        }
      }
      console.warn('No messages found in values array');
      return [];
    }
    
    // 如果values是对象，直接访问messages
    if (typeof values === 'object' && values !== null) {
      if ('messages' in values) {
        const messages = (values as any).messages;
        if (Array.isArray(messages)) {
          console.log('Found messages array in values object:', messages.length, 'messages');
          return messages;
        } else {
          console.warn('Messages property exists but is not an array:', typeof messages, messages);
          return [];
        }
      } else {
        console.warn('Values object does not have messages property. Available keys:', Object.keys(values));
        return [];
      }
    }
    
    console.warn('Values is neither an array nor an object:', typeof values, values);
    return [];
  } catch (error) {
    console.error('Error extracting messages from thread state:', error);
    return [];
  }
};

/**
 * 安全地验证Thread ID
 * @param threadId 要验证的Thread ID
 * @returns 是否为有效的Thread ID
 */
export const validateThreadId = (threadId: string): boolean => {
  if (!threadId || typeof threadId !== 'string') {
    console.warn('Invalid thread ID: not a string or empty');
    return false;
  }
  
  if (threadId.length < 3) {
    console.warn('Invalid thread ID: too short');
    return false;
  }
  
  return true;
};

/**
 * 记录Thread切换的调试信息
 * @param threadId Thread ID
 * @param operation 操作类型
 * @param data 额外数据
 */
export const logThreadOperation = (threadId: string, operation: string, data?: any) => {
  console.log(`Thread ${operation}:`, {
    threadId,
    operation,
    timestamp: new Date().toISOString(),
    data
  });
};
