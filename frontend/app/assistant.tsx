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
import { useRef } from "react";

// 封装与 LangGraph API 的交互逻辑
import { createThread, getThreadState, sendMessage } from "@/lib/chatApi";

export const Assistant = () => {

  // threadIdRef 用于保存当前对话的线程 ID，确保在页面刷新前是持续一致的。
  const threadIdRef = useRef<string | undefined>(undefined);

  // 初始化 runtime，传入当前线程ID
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,

    // 向 LangGraph assistant 发送消息
    stream: async (messages, { command }) => {
      if (!threadIdRef.current) {
        const { thread_id } = await createThread();
        threadIdRef.current = thread_id;
      }
      const threadId = threadIdRef.current;
      return sendMessage({
        threadId,
        messages,
        command,
      });
    },

    // 用户重置对话时创建新线程
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread();
      // 创建新线程后更新 threadIdRef
      threadIdRef.current = thread_id;
    },

    // 切换到已有线程时的处理
    onSwitchToThread: async (threadId) => {
      const state = await getThreadState(threadId);
      // 切换到指定线程时，更新 threadIdRef 并返回当前线程的消息状态
      threadIdRef.current = threadId;
      return { messages: state.values.messages };
    },
  });

  // const runtime = useChatRuntime({
  //   api: "/api/chat",
  // });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
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
    </AssistantRuntimeProvider>
  );
};
