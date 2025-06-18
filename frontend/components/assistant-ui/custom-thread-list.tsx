import { FC, useEffect, useState } from "react";
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAssistantRuntime,
} from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";
import { Thread } from "@langchain/langgraph-sdk";

import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { getThreadsList, deleteThread } from "@/lib/chatApi";

export const CustomThreadList: FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const runtime = useAssistantRuntime();

  // 获取Thread列表
  const fetchThreads = async () => {
    try {
      setLoading(true);
      // 暂时使用模拟数据，避免API调用问题
      // const threadsData = await getThreadsList();
      // setThreads(threadsData || []);
      
      // 模拟数据用于测试
      const mockThreads: Thread[] = [];
      setThreads(mockThreads);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取Thread列表
  useEffect(() => {
    fetchThreads();
  }, []);

  // 创建新Thread
  const handleNewThread = async () => {
    try {
      await runtime.switchToNewThread();
      // 刷新列表
      await fetchThreads();
    } catch (error) {
      console.error("Failed to create new thread:", error);
    }
  };

  // 切换到指定Thread
  const handleSwitchToThread = async (threadId: string) => {
    try {
      await runtime.switchToThread(threadId);
    } catch (error) {
      console.error("Failed to switch to thread:", error);
    }
  };

  // 删除Thread
  const handleDeleteThread = async (threadId: string) => {
    try {
      // await deleteThread(threadId);
      // 暂时只从本地状态中移除
      setThreads(prev => prev.filter(t => t.thread_id !== threadId));
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  // 获取Thread标题
  const getThreadTitle = (thread: Thread) => {
    if (thread.metadata && typeof thread.metadata === 'object' && 'title' in thread.metadata) {
      return thread.metadata.title as string || `Thread ${thread.thread_id.slice(0, 8)}...`;
    }
    return `Thread ${thread.thread_id.slice(0, 8)}...`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-stretch gap-1.5">
        <Button className="data-[active]:bg-muted hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" variant="ghost">
          <PlusIcon />
          New Thread
        </Button>
        <div className="text-sm text-muted-foreground px-3 py-2">
          Loading threads...
        </div>
      </div>
    );
  }

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
            key={thread.thread_id}
            className="data-[active]:bg-muted hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2"
          >
            <button
              onClick={() => handleSwitchToThread(thread.thread_id)}
              className="flex-grow px-3 py-2 text-start text-sm"
            >
              {getThreadTitle(thread)}
            </button>
            <TooltipIconButton
              onClick={() => handleDeleteThread(thread.thread_id)}
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
          No threads yet
        </div>
      )}
    </div>
  );
};
