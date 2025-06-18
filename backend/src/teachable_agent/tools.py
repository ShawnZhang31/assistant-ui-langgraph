"""Define he agent's tools."""

import uuid
from typing import Annotated, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import InjectedToolArg
from langgraph.store.base import BaseStore

from teachable_agent.configuration import Configuration


# async def upsert_memory(
#     content: str,
#     context: str,
#     *,
#     memory_id: Optional[uuid.UUID] = None,
#     # Hide these arguments from the model.
#     config: Annotated[RunnableConfig, InjectedToolArg],
#     store: Annotated[BaseStore, InjectedToolArg],
# ):
#     """Upsert a memory in the database.

#     If a memory conflicts with an existing one, then just UPDATE the
#     existing one by passing in memory_id - don't create two memories
#     that are the same. If the user corrects a memory, UPDATE it.

#     Args:
#         content: The main content of the memory. For example:
#             "User expressed interest in learning about French."
#         context: Additional context for the memory. For example:
#             "This was mentioned while discussing career options in Europe."
#         memory_id: ONLY PROVIDE IF UPDATING AN EXISTING MEMORY.
#         The memory to overwrite.
#     """
#     mem_id = memory_id or uuid.uuid4()
#     user_id = Configuration.from_runnable_config(config).user_id
#     await store.aput(
#         ("memories", user_id),
#         key=str(mem_id),
#         value={"content": content, "context": context},
#     )
#     return f"Stored memory {mem_id}"

async def get_weather(location: str):
    """Get the current weather for a given location.
    This function fetching weather data for a specified location.
    It returns a string describing the current weather conditions.
    Args:
        location: The location for which to get the weather.
    Returns:
        A string describing the current weather.
    """
    # This is a placeholder implementation.
    # In a real application, you would call a weather API here.
    return f"The current weather in {location} is sunny with a temperature of 25°C."

async def get_news(topic: str):
    """Get the latest news for a given topic.
    This function fetches news articles related to the specified topic.
    Args:
        topic: The topic for which to get the news.
    Returns:
        A string summarizing the latest news on the topic.
    """
    # This is a placeholder implementation.
    # In a real application, you would call a news API here.
    return f"The latest news on {topic} is that everything is going great!"

async def get_joke(category: str = "general") -> str:
    """Get a joke from a given category.
    This function fetches a joke from the specified category.
    Args:
        category: The category of the joke (e.g., "general", "programming").
    Returns:
        A string containing a joke from the specified category.
    """
    # This is a placeholder implementation.
    # In a real application, you would call a joke API here.
    return f"Here's a {category} joke for you: Why did the chicken cross the road? To get to the other side!"
