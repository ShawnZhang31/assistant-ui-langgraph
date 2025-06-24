"use client";

// 为组件树提供上下文环境，管理 Assistant 的运行时状态。
import { AssistantRuntimeProvider } from "@assistant-ui/react";
// import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

// @assistant-ui/react-langgraph 提供的 hook，用于连接到 LangGraph 运行时。
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";

// 用于渲染用户和 assistant 的对话内容
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// 用于记录当前对话线程ID（避免每次组件重新渲染都重新生成）
import { useRef, useState, useCallback, useEffect } from "react";

// 封装与 LangGraph API 的交互逻辑
import { createThread, getThreadState, sendMessage, getThreadsList, deleteThread } from "@/lib/chatApi";
import { ThreadManagerProvider, useThreadManager } from "@/components/assistant-ui/thread-manager";
import { extractMessagesFromThreadState, validateThreadId, logThreadOperation } from "@/lib/threadDebug";

export const Assistant = () => {
  return (
    <ThreadManagerProvider>
      <AssistantWithThreadManager />
    </ThreadManagerProvider>
  );
};

const AssistantWithThreadManager = () => {
  const { addThread, setCurrentThread, updateThreadActivity, currentThreadId } = useThreadManager();

  // threadIdRef 用于保存当前对话的线程 ID，确保在页面刷新前是持续一致的。
  const threadIdRef = useRef<string | undefined>(undefined);

  // 从localStorage恢复当前Thread ID并设置到threadIdRef
  useEffect(() => {
    const savedThreadId = localStorage.getItem('current-thread-id');
    if (savedThreadId) {
      threadIdRef.current = savedThreadId;
      setCurrentThread(savedThreadId); // 确保ThreadManager也知道当前的Thread
    }
  }, [setCurrentThread]);

  // 初始化 runtime，传入当前线程ID
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,

    // 向 LangGraph assistant 发送消息
    stream: async (messages, { command }) => {
      try {
        if (!threadIdRef.current) {
          const { thread_id } = await createThread();
          threadIdRef.current = thread_id;
          addThread(thread_id); // 使用真实的thread_id
        }
        const threadId = threadIdRef.current;
        return sendMessage({
          threadId,
          messages,
          command,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error; // 重新抛出错误，让上层处理
      }
    },

    // 用户重置对话时创建新线程
    onSwitchToNewThread: async () => {
      try {
        const { thread_id } = await createThread();
        // 创建新线程后更新 threadIdRef
        threadIdRef.current = thread_id;
        addThread(thread_id); // 使用真实的thread_id
      } catch (error) {
        console.error('Failed to create new thread:', error);
        throw error; // 重新抛出错误，让上层处理
      }
    },

    // 切换到已有线程时的处理
    onSwitchToThread: async (threadId) => {
      logThreadOperation(threadId, 'switch_start');
      
      if (!validateThreadId(threadId)) {
        console.error('Invalid thread ID provided to onSwitchToThread:', threadId);
        return { messages: [] };
      }
      
      try {
        const state = await getThreadState(threadId);
        logThreadOperation(threadId, 'state_retrieved', state);
        
        // 切换到指定线程时，更新 threadIdRef 并返回当前线程的消息状态
        threadIdRef.current = threadId;
        setCurrentThread(threadId); // 更新ThreadManager的当前Thread
        updateThreadActivity(threadId); // 更新Thread活跃状态
        
        // 使用专门的工具函数来安全地提取消息
        const messages = extractMessagesFromThreadState(state);
        
        logThreadOperation(threadId, 'switch_complete', { messageCount: messages.length });
        return { messages };
      } catch (error) {
        console.error('Failed to switch to thread:', threadId, error);
        logThreadOperation(threadId, 'switch_error', error);
        
        // 如果获取Thread状态失败，返回空数组避免错误
        threadIdRef.current = threadId;
        setCurrentThread(threadId);
        updateThreadActivity(threadId);
        return { messages: [] };
      }
    },
  });

  // const runtime = useChatRuntime({
  //   api: "/api/chat",
  // });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="pb-16">
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        Build Your Own ChatGPT UX
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        Starter Template
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <Thread />
            </SidebarInset>
          </SidebarProvider>
        </div>
        {/* <footer className="fixed bottom-0 left-0 right-0 border-t px-4 py-3 text-center text-sm text-muted-foreground bg-background z-50">
          Developed by JoinAI Team using assistant-ui
        </footer> */}
      </div>
      <footer className="fixed bottom-0 left-0 right-0 border-t px-4 py-3 text-center text-sm text-muted-foreground bg-background z-50">
          Developed by JoinAI Team using assistant-ui
        </footer>
    </AssistantRuntimeProvider>
    
  );
};
