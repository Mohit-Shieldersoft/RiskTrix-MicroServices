"""Event infrastructure for domain events.

This module provides an in-process event bus for publishing and handling
domain events across the application. Events enable loose coupling between
modules and support cross-cutting concerns like activity logging and audit trails.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional, Type
from uuid import uuid4
import logging
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


@dataclass(kw_only=True)
class DomainEvent(ABC):
    """Base class for all domain events.
    
    Domain events represent something that happened in the domain that other
    parts of the system might care about.
    
    Attributes:
        event_id: Unique identifier for this event
        occurred_at: Timestamp when the event occurred
        user_id: ID of the user who triggered the event (if applicable)
        metadata: Additional context-specific data
    """
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    user_id: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @property
    @abstractmethod
    def event_type(self) -> str:
        """Human-readable event type identifier."""
        pass


# Type alias for event handlers
EventHandler = Callable[[DomainEvent, AsyncSession], None]


class EventBus:
    """In-process event bus for publishing and handling domain events.
    
    This is a simple implementation that handles events synchronously in the
    same process. It can later be upgraded to use a message queue or outbox
    pattern for distributed systems.
    
    Usage:
        # Register a handler
        event_bus.subscribe(ApplicationCreated, handle_application_created)
        
        # Publish an event
        await event_bus.publish(ApplicationCreated(application_id=1), db)
    """
    
    def __init__(self):
        self._handlers: Dict[Type[DomainEvent], List[EventHandler]] = {}
        
    def subscribe(self, event_type: Type[DomainEvent], handler: EventHandler) -> None:
        """Subscribe a handler to a specific event type.
        
        Args:
            event_type: The event class to subscribe to
            handler: Async function that handles the event
        """
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
        logger.info(f"📢 Registered handler {handler.__name__} for {event_type.__name__}")
        
    def unsubscribe(self, event_type: Type[DomainEvent], handler: EventHandler) -> None:
        """Unsubscribe a handler from an event type.
        
        Args:
            event_type: The event class to unsubscribe from
            handler: The handler to remove
        """
        if event_type in self._handlers:
            self._handlers[event_type].remove(handler)
            logger.info(f"🔇 Unregistered handler {handler.__name__} for {event_type.__name__}")
    
    async def publish(self, event: DomainEvent, db: AsyncSession) -> None:
        """Publish an event to all registered handlers.
        
        Handlers are executed sequentially. If a handler fails, the error is
        logged but does not prevent other handlers from executing.
        
        Args:
            event: The event to publish
            db: Database session for handlers to use
        """
        event_type = type(event)
        handlers = self._handlers.get(event_type, [])
        
        if not handlers:
            logger.debug(f"📭 No handlers registered for {event_type.__name__}")
            return
            
        logger.info(f"📤 Publishing {event_type.__name__} (id={event.event_id})")
        
        for handler in handlers:
            try:
                await handler(event, db)
                logger.debug(f"✅ Handler {handler.__name__} completed for {event_type.__name__}")
            except Exception as e:
                logger.error(
                    f"❌ Handler {handler.__name__} failed for {event_type.__name__}: {e}",
                    exc_info=True
                )
    
    def clear(self) -> None:
        """Clear all registered handlers. Useful for testing."""
        self._handlers.clear()
        logger.info("🧹 Cleared all event handlers")


# Global event bus instance
event_bus = EventBus()
