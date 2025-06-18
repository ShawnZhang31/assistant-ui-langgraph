import { FC, useEffect, useState } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAssistantRuntime,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

interface ThreadInfo {
  id: string;
  title: string;
  createdAt: string;
  lastActive: string;
}

export const PersistentThreadList: FC = () => {
  const [threads, setThreads] = useState<ThreadInfo[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const runtime = useAssistantRuntime();

  // 从localStorage加载Thread列表
  const loadThreads = () => {
    try {
      const savedThreads = localStorage.getItem('assistant-threads');
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
      }
    } catch (error) {
      console.error('Failed to load threads from localStorage:', error);
    }
  };

  // 保存Thread列表到localStorage
  const saveThreads = (threadList: ThreadInfo[]) => {
    try {
      localStorage.setItem('assistant-threads', JSON.stringify(threadList));
    } catch (error) {
      console.error('Failed to save threads to localStorage:', error);
    }
  };

  // 获取当前Thread ID
  const getCurrentThreadId = () => {
    try {
      const currentId = localStorage.getItem('current-thread-id');
      return currentId;
    } catch (error) {
      console.error('Failed to get current thread ID:', error);
      return null;
    }
  };

  // 保存当前Thread ID
  const saveCurrentThreadId = (threadId: string) => {
    try {
      localStorage.setItem('current-thread-id', threadId);
      setCurrentThreadId(threadId);
    } catch (error) {
      console.error('Failed to save current thread ID:', error);
    }
  };

  // 添加新Thread
  const addThread = (threadId: string) => {
    const now = new Date().toISOString();
    const newThread: ThreadInfo = {
      id: threadId,
      title: `Chat ${threadId.slice(0, 8)}`,
      createdAt: now,
      lastActive: now,
    };

    const updatedThreads = [newThread, ...threads.filter(t => t.id !== threadId)];
    setThreads(updatedThreads);
    saveThreads(updatedThreads);
    saveCurrentThreadId(threadId);
  };

  // 删除Thread
  const removeThread = (threadId: string) => {
    const updatedThreads = threads.filter(t => t.id !== threadId);
    setThreads(updatedThreads);
    saveThreads(updatedThreads);
    
    // 如果删除的是当前Thread，清除当前Thread ID
    if (currentThreadId === threadId) {
      localStorage.removeItem('current-thread-id');
      setCurrentThreadId(null);
    }
  };

  // 更新Thread的最后活跃时间
  const updateThreadActivity = (threadId: string) => {
    const updatedThreads = threads.map(thread =>
      thread.id === threadId
        ? { ...thread, lastActive: new Date().toISOString() }
        : thread
    );
    
    // 将活跃的Thread移到列表顶部
    const activeThread = updatedThreads.find(t => t.id === threadId);
    const otherThreads = updatedThreads.filter(t => t.id !== threadId);
    const sortedThreads = activeThread ? [activeThread, ...otherThreads] : updatedThreads;
    
    setThreads(sortedThreads);
    saveThreads(sortedThreads);
    saveCurrentThreadId(threadId);
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadThreads();
    const currentId = getCurrentThreadId();
    setCurrentThreadId(currentId);
  }, []);

  // 创建新Thread
  const handleNewThread = async () => {
    try {
      await runtime.switchToNewThread();
      
      // 等待一小段时间让runtime处理完成，然后获取新的Thread ID
      setTimeout(() => {
        // 由于我们无法直接从runtime获取Thread ID，我们使用时间戳作为标识
        const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        addThread(newThreadId);
      }, 100);
    } catch (error) {
      console.error("Failed to create new thread:", error);
      // 即使runtime调用失败，我们也创建一个本地Thread记录
      const newThreadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      addThread(newThreadId);
    }
  };

  // 切换到指定Thread
  const handleSwitchToThread = async (threadId: string) => {
    try {
      await runtime.switchToThread(threadId);
      updateThreadActivity(threadId);
    } catch (error) {
      console.error("Failed to switch to thread:", error);
    }
  };

  // 删除Thread
  const handleDeleteThread = (threadId: string) => {
    removeThread(threadId);
  };

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      {/* New Thread Button */}
      <Button 
        onClick={handleNewThread}
        className="data-[active]:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" 
        variant="ghost"
      >
        <PlusIcon />
        New Thread
      </Button>

      {/* Thread List */}
      {threads.length > 0 ? (
        threads.map((thread) => (
          <div
            key={thread.id}
            className={`hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 ${
              currentThreadId === thread.id ? 'bg-muted' : ''
            }`}
          >
            <button
              onClick={() => handleSwitchToThread(thread.id)}
              className="flex-grow px-3 py-2 text-start text-sm"
            >
              {thread.title}
            </button>
            <TooltipIconButton
              onClick={() => handleDeleteThread(thread.id)}
              className="hover:text-primary text-foreground ml-auto mr-3 size-4 p-0"
              variant="ghost"
              tooltip="Delete thread"
            >
              <ArchiveIcon />
            </TooltipIconButton>
          </div>
        ))
      ) : (
        <div className="text-sm text-muted-foreground px-3 py-2">
          No threads yet. Click "New Thread" to start.
        </div>
      )}
    </div>
  );
};
