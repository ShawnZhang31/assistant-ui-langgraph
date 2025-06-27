import { Client, ThreadState} from "@langchain/langgraph-sdk";
import {
  LangChainMessage,
  LangGraphCommand,
} from "@assistant-ui/react-langgraph";

// This file contains functions to interact with the LangGraph API for chat functionality.
const createClient = () => {
  const apiUrl =
    process.env["NEXT_PUBLIC_LANGGRAPH_API_URL"] ||
    new URL("/api", window.location.href).href;
  return new Client({
    apiUrl,
    apiKey: process.env["NEXT_PUBLIC_LANGGRAPH_API_KEY"] || "",
  });
};

// Function to create a new assistant in the LangGraph API
export const createAssistant = async (graphId: string) => {
  const client = createClient();
  return client.assistants.create({ graphId });
};

// Function to create a new thread in the LangGraph API
export const createThread = async () => {
  const client = createClient();
  return client.threads.create();
};

// Function to get the state of a thread by its ID
export const getThreadState = async (threadId: string) => {
  const client = createClient();
  try {
    const state = await client.threads.getState(threadId);
    console.log('Thread state for', threadId, ':', JSON.stringify(state, null, 2));
    return state;
  } catch (error) {
    console.error('Failed to get thread state for', threadId, ':', error);
    throw error;
  }
};

// Function to get all threads list
export const getThreadsList = async () => {
  const client = createClient();
  return client.threads.search();
};

// Function to delete a thread by its ID
export const deleteThread = async (threadId: string) => {
  const client = createClient();
  return client.threads.delete(threadId);
};

// Function to send a message in a thread, optionally with a command
export const sendMessage = async (params: {
  threadId: string;
  messages?: LangChainMessage[];
  command?: LangGraphCommand | undefined;
}) => {
  const client = createClient();
  return client.runs.stream(
    params.threadId,
    process.env["NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID"]!,
    {
      input: params.messages?.length
        ? {
            messages: params.messages,
          }
        : null,
      command: params.command,
      streamMode: ["messages", "updates"],
    }
  );
};