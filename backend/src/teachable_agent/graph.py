"""Graphs that extract memories on a schedule."""

import asyncio
import logging
from datetime import datetime

from langchain.chat_models import init_chat_model
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph
from langgraph.store.base import BaseStore
from langgraph.prebuilt import ToolNode

from teachable_agent import configuration, tools, utils
from teachable_agent.state import State
from teachable_agent.utils import split_model_and_provider

logger = logging.getLogger(__name__)

# Initialize the language model to be used for memory extraction
tool_node = ToolNode([tools.get_weather, tools.get_news, tools.get_joke])


def call_model(state: State, config: RunnableConfig) -> dict:
    """Extract the user's state from the conversation and update the memory."""
    configurable = configuration.Configuration.from_runnable_config(config)

#     # Retrieve the most recent memories for context
#     memories = await store.asearch(
#         ("memories", configurable.user_id),
#         query=str([m.content for m in state.messages[-3:]]),
#         limit=10,
#     )

#     # Format memories for inclusion in the prompt
#     formatted = "\n".join(f"[{mem.key}]: {mem.value} (similarity: {mem.score})" for mem in memories)
#     if formatted:
#         formatted = f"""
# <memories>
# {formatted}
# </memories>"""

    # # Prepare the system prompt with user memories and current time
    # # This helps the model understand the context and temporal relevance
    # sys = configurable.system_prompt.format(
    #     user_info=formatted, time=datetime.now().isoformat()
    # )

    # Invoke the language model with the prepared prompt and tools
    # "bind_tools" gives the LLM the JSON schema for all tools in the list so it knows how
    # to use them.

    sys = configurable.system_prompt.format(time=datetime.now().isoformat())

    # print(utils.split_model_and_provider(configurable.model))
    llm = init_chat_model(**utils.split_model_and_provider(configurable.model))
    
    msg = llm.bind_tools([tools.get_weather, tools.get_news, tools.get_joke]).invoke(
        [{"role": "system", "content": sys}, *state.messages],
        # {"configurable": utils.split_model_and_provider(configurable.model)},
    )
    return {"messages": [msg]}


# def tool_action(state: State, config: RunnableConfig):
#     """Define the action to take when a tool is called."""
#     last_message = state.messages[-1]
#     toll_calls = last_message.tool_calls[0]

#     return tools.upsert_memory

# async def store_memory(state: State, config: RunnableConfig, *, store: BaseStore):
#     # Extract tool calls from the last message
#     tool_calls = state.messages[-1].tool_calls

#     # Concurrently execute all upsert_memory calls
#     saved_memories = await asyncio.gather(
#         *(
#             tools.upsert_memory(**tc["args"], config=config, store=store)
#             for tc in tool_calls
#         )
#     )

#     # Format the results of memory storage operations
#     # This provides confirmation to the model that the actions it took were completed
#     results = [
#         {
#             "role": "tool",
#             "content": mem,
#             "tool_call_id": tc["id"],
#         }
#         for tc, mem in zip(tool_calls, saved_memories)
#     ]
#     return {"messages": results}


def route_message(state: State):
    """Determine the next step based on the presence of tool calls."""
    msg = state.messages[-1]
    if msg.tool_calls:
        # If there are tool calls, we need to store memories
        return "tool_node"
    # Otherwise, finish; user can send the next message
    return "__end__"


# Create the graph + all nodes
builder = StateGraph(State, config_schema=configuration.Configuration)

# Define the flow of the memory extraction process
builder.add_node("call_model", call_model)
builder.add_node("tool_node", tool_node)
builder.add_edge("__start__", "call_model")
builder.add_edge("tool_node", "call_model")
builder.add_conditional_edges("call_model", route_message, ["tool_node", "__end__"])

graph = builder.compile()
graph.name = "TeachableAgent"


__all__ = ["graph"]
