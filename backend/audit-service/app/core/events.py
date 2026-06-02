"""Domain event infrastructure for the Audit Service."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable, Dict, List, Optional
from uuid import uuid4
import logging

logger = logging.getLogger(__name__)


@dataclass
class DomainEvent:
    """Base class for all domain events."""
    
    event_id: str = field(default_factory=lambda: str(uuid4()))
    occurred_at: datetime = field(default_factory=datetime.utcnow)
    user_id: Optional[int] = None
    
    @property
    def event_type(self) -> str:
        """Return the event type identifier."""
        return self.__class__.__name__


class EventBus:
    """Simple in-process event bus for domain events."""
    
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
    
    def subscribe(self, event_type: str, handler: Callable):
        """Subscribe a handler to an event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler {handler.__name__} to event {event_type}")
    
    async def publish(self, event: DomainEvent, db=None):
        """Publish an event to all subscribers."""
        event_type = event.event_type
        logger.info(f"Publishing event: {event_type} (ID: {event.event_id})")
        
        if event_type in self._subscribers:
            for handler in self._subscribers[event_type]:
                try:
                    # Call handler with or without db session based on signature
                    if db is not None:
                        await handler(event, db)
                    else:
                        await handler(event)
                except Exception as e:
                    logger.error(f"Error in event handler {handler.__name__}: {str(e)}")
        else:
            logger.debug(f"No subscribers for event type: {event_type}")
    
    def unsubscribe(self, event_type: str, handler: Callable):
        """Unsubscribe a handler from an event type."""
        if event_type in self._subscribers:
            self._subscribers[event_type].remove(handler)
            logger.info(f"Unsubscribed handler {handler.__name__} from event {event_type}")


# Global event bus instance
event_bus = EventBus()
