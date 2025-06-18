import { FC } from "react";
import { useAssistantRuntime } from "@assistant-ui/react";
import { ArchiveIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useThreadManager } from "./thread-manager";
import { deleteThread } from "@/lib/chatApi";
import { getThreadDescription } from "@/lib/threadUtils";

export const EnhancedThreadList: FC = () => {
  const { threads, currentThreadId, loading, addThread, removeThread, updateThreadActivity } = useThreadManager();
  const runtime = useAssistantRuntime();

  // 创建新Thread
  const handleNewThread = async () => {
    try {
      // 直接调用runtime的switchToNewThread，它会处理创建并切换到新线程
      await runtime.switchToNewThread();
      // runtime会通过onSwitchToNewThread回调来处理新线程的添加
    } catch (error) {
      console.error("Failed to create new thread:", error);
    }
  };

  // 切换到指定Thread
  const handleSwitchToThread = async (threadId: string) => {
    try {
      // 调用runtime的switchToThread来切换并恢复历史消息
      await runtime.switchToThread(threadId);
      updateThreadActivity(threadId);
    } catch (error) {
      console.error("Failed to switch to thread:", error);
      // 即使runtime调用失败，我们也更新本地状态
      updateThreadActivity(threadId);
    }
  };

  // 删除Thread
  const handleDeleteThread = async (threadId: string) => {
    try {
      // 先从API删除
      await deleteThread(threadId);
      // 再从本地状态删除
      removeThread(threadId);
    } catch (error) {
      console.error("Failed to delete thread from API:", error);
      // 即使API调用失败，也从本地删除
      removeThread(threadId);
    }
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
      {loading ? (
        <div className="text-sm text-muted-foreground px-3 py-2 text-center">
          Loading threads...
        </div>
      ) : threads.length > 0 ? (
        threads.map((thread) => (
          <div
            key={thread.id}
            className={`hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 ${
              currentThreadId === thread.id ? 'bg-muted' : ''
            }`}
          >
            <button
              onClick={() => handleSwitchToThread(thread.id)}
              className="flex-grow px-3 py-2 text-start"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{thread.title}</span>
                <span className="text-xs text-muted-foreground">
                  {getThreadDescription(thread.id, thread.createdAt)}
                </span>
              </div>
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
