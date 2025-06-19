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
  updateThreadActivity: (threadId: string) => void;
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

  // 从localStorage加载Thread列表
  const loadThreads = useCallback(() => {
    try {
      const savedThreads = localStorage.getItem('assistant-threads');
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
      }
      
      const currentId = localStorage.getItem('current-thread-id');
      setCurrentThreadId(currentId);
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
  const updateThreadActivity = useCallback((threadId: string) => {
    setThreads(prev => {
      const updated = prev.map(thread =>
        thread.id === threadId
          ? { ...thread, lastActive: new Date().toISOString() }
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
      const response = await getThreadsList();
      const apiThreads = response.map((thread: any) => ({
        id: thread.thread_id,
        title: formatThreadTitle(thread.thread_id), // 使用统一的格式化函数
        createdAt: thread.created_at || new Date().toISOString(),
        lastActive: thread.updated_at || new Date().toISOString(),
      }));
      
      // 合并本地和API的Thread，API的Thread为准
      setThreads(prev => {
        const merged = [...apiThreads];
        // 添加本地有但API没有的Thread（可能是新创建的）
        prev.forEach(localThread => {
          if (!apiThreads.find(apiThread => apiThread.id === localThread.id)) {
            merged.push(localThread);
          }
        });
        
        // 按最后活跃时间排序
        merged.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
        
        saveThreads(merged);
        return merged;
      });
    } catch (error) {
      console.error('Failed to load threads from API:', error);
    } finally {
      setLoading(false);
    }
  }, [saveThreads]);

  // 组件挂载时加载数据
  useEffect(() => {
    loadThreads();
    // 也尝试从API加载Thread列表
    loadThreadsFromAPI();
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
