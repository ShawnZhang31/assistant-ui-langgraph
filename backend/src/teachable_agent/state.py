"""Define the shared values."""

from __future__ import annotations

from dataclasses import dataclass

from langchain_core.messages import AnyMessage
from langgraph.graph import add_messages
from typing_extensions import Annotated
from typing import BinaryIO, Any


@dataclass(kw_only=True)
class State:
    """Main graph state."""

    messages: Annotated[list[AnyMessage], add_messages]
    """The messages in the conversation. This field is required."""



__all__ = [
    "State",
]
