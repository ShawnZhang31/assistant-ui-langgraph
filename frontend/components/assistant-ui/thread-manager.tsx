import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getThreadsList } from '@/lib/chatApi';
import { formatThreadTitle } from '@/lib/threadUtils';

interface ThreadInfo {
  id: string;
  title: string;
  createdAt: string;
  lastActive: string;
}

interface ThreadManagerContextType {
  threads: ThreadInfo[];
  currentThreadId: string | null;
  loading: boolean;
  addThread: (threadId: string, title?: string) => void;
  removeThread: (threadId: string) => void;
  setCurrentThread: (threadId: string) => void;
  updateThreadActivity: (threadId: string, lastActive?: string) => Promise<void>;
  updateThreadTitle: (threadId: string, title: string) => void;
  loadThreadsFromAPI: () => Promise<void>;
}

const ThreadManagerContext = createContext<ThreadManagerContextType | undefined>(undefined);

export const useThreadManager = () => {
  const context = useContext(ThreadManagerContext);
  if (!context) {
    throw new Error('useThreadManager must be used within a ThreadManagerProvider');
  }
  return context;
};

interface ThreadManagerProviderProps {
  children: React.ReactNode;
}

export const ThreadManagerProvider: React.FC<ThreadManagerProviderProps> = ({ children }) => {
  const [threads, setThreads] = useState<ThreadInfo[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 从localStorage加载Thread列表（备选方案）
  const loadThreads = useCallback(() => {
    try {
      console.log('Loading threads from localStorage as fallback...');
      const savedThreads = localStorage.getItem('assistant-threads');
      let parsed = [];
      if (savedThreads) {
        parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        console.log('Loaded', parsed.length, 'threads from localStorage');
      }
      
      const currentId = localStorage.getItem('current-thread-id');
      
      // 如果没有当前Thread ID，但有Thread列表，自动选择第一个
      if (!currentId && parsed.length > 0) {
        const firstThreadId = parsed[0].id;
        console.log('Auto-selecting first thread from localStorage:', firstThreadId);
        setCurrentThreadId(firstThreadId);
        localStorage.setItem('current-thread-id', firstThreadId);
      } else if (currentId && parsed.find((thread: any) => thread.id === currentId)) {
        setCurrentThreadId(currentId);
        console.log('Restored current thread ID from localStorage:', currentId);
      } else {
        setCurrentThreadId(null);
        console.log('No valid current thread found in localStorage');
      }
    } catch (error) {
      console.error('Failed to load threads from localStorage:', error);
    }
  }, []);

  // 保存Thread列表到localStorage
  const saveThreads = useCallback((threadList: ThreadInfo[]) => {
    try {
      localStorage.setItem('assistant-threads', JSON.stringify(threadList));
    } catch (error) {
      console.error('Failed to save threads to localStorage:', error);
    }
  }, []);

  // 添加新Thread
  const addThread = useCallback((threadId: string, title?: string) => {
    const now = new Date().toISOString();
    
    // 如果没有提供标题，使用实用工具函数生成标题
    const threadTitle = title || formatThreadTitle(threadId);
    
    const newThread: ThreadInfo = {
      id: threadId,
      title: threadTitle,
      createdAt: now,
      lastActive: now,
    };

    setThreads(prev => {
      const updated = [newThread, ...prev.filter(t => t.id !== threadId)];
      saveThreads(updated);
      return updated;
    });
    
    setCurrentThread(threadId);
  }, [saveThreads]);

  // 删除Thread
  const removeThread = useCallback((threadId: string) => {
    setThreads(prev => {
      const updated = prev.filter(t => t.id !== threadId);
      saveThreads(updated);
      return updated;
    });
    
    // 如果删除的是当前Thread，清除当前Thread ID
    if (currentThreadId === threadId) {
      localStorage.removeItem('current-thread-id');
      setCurrentThreadId(null);
    }
  }, [currentThreadId, saveThreads]);

  // 设置当前Thread
  const setCurrentThread = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
    localStorage.setItem('current-thread-id', threadId);
  }, []);

  // 更新Thread的最后活跃时间（不改变排序）
  const updateThreadActivity = useCallback(async (threadId: string, lastActive?: string) => {
    let updatedTime = lastActive;
    
    // 如果没有提供lastActive时间，从API获取真实的updated时间
    if (!updatedTime) {
      try {
        const response = await getThreadsList();
        const threadData = response.find((thread: any) => thread.thread_id === threadId);
        updatedTime = threadData?.updated_at || new Date().toISOString();
      } catch (error) {
        console.error('Failed to get thread updated time from API:', error);
        updatedTime = new Date().toISOString(); // 降级到当前时间
      }
    }
    
    setThreads(prev => {
      const updated = prev.map(thread =>
        thread.id === threadId
          ? { ...thread, lastActive: updatedTime }
          : thread
      );
      
      // 保持原有的排序，不将活跃Thread移到顶部
      saveThreads(updated);
      return updated;
    });
    
    setCurrentThread(threadId);
  }, [setCurrentThread, saveThreads]);

  // 更新Thread标题
  const updateThreadTitle = useCallback((threadId: string, title: string) => {
    setThreads(prev => {
      const updated = prev.map(thread =>
        thread.id === threadId ? { ...thread, title } : thread
      );
      saveThreads(updated);
      return updated;
    });
  }, [saveThreads]);

  // 从LangGraph API加载Thread列表
  const loadThreadsFromAPI = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading threads from API...');
      const response = await getThreadsList();
      const apiThreads = response.map((thread: any) => ({
        id: thread.thread_id,
        title: formatThreadTitle(thread.thread_id), // 使用统一的格式化函数
        createdAt: thread.created_at || new Date().toISOString(),
        lastActive: thread.updated_at || new Date().toISOString(),
      }));
      
      console.log('Loaded', apiThreads.length, 'threads from API');
      
      // 直接使用API数据，不再合并本地数据
      // 按最后活跃时间排序
      apiThreads.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      
      // 设置Thread列表
      setThreads(apiThreads);
      saveThreads(apiThreads);
      
      // 恢复当前Thread ID（如果存在且在API数据中）
      const savedCurrentId = localStorage.getItem('current-thread-id');
      if (savedCurrentId && apiThreads.find(thread => thread.id === savedCurrentId)) {
        setCurrentThreadId(savedCurrentId);
        console.log('Restored current thread ID:', savedCurrentId);
      } else if (apiThreads.length > 0) {
        // 如果没有保存的current thread或已不存在，选择第一个
        const firstThreadId = apiThreads[0].id;
        setCurrentThreadId(firstThreadId);
        localStorage.setItem('current-thread-id', firstThreadId);
        console.log('Auto-selected first thread as current:', firstThreadId);
      } else {
        setCurrentThreadId(null);
        localStorage.removeItem('current-thread-id');
      }
      
    } catch (error) {
      console.error('Failed to load threads from API:', error);
      throw error; // 重新抛出错误，让调用者知道API加载失败
    } finally {
      setLoading(false);
    }
  }, [saveThreads]);

  // 组件挂载时加载数据（优先从API加载）
  useEffect(() => {
    const initializeThreads = async () => {
      console.log('Initializing threads - loading from API first');
      
      try {
        // 首先尝试从API加载Thread列表
        await loadThreadsFromAPI();
        console.log('Successfully loaded threads from API');
      } catch (error) {
        console.error('Failed to load threads from API, falling back to localStorage:', error);
        // 如果API加载失败，使用本地数据作为备选
        loadThreads();
      }
    };

    initializeThreads();
  }, [loadThreads, loadThreadsFromAPI]);

  const value: ThreadManagerContextType = {
    threads,
    currentThreadId,
    loading,
    addThread,
    removeThread,
    setCurrentThread,
    updateThreadActivity,
    updateThreadTitle,
    loadThreadsFromAPI,
  };

  return (
    <ThreadManagerContext.Provider value={value}>
      {children}
    </ThreadManagerContext.Provider>
  );
};
