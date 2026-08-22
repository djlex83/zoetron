import abc
import logging

# Configure a simple logger for the stub
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class MemoryStore(abc.ABC):
    """Abstract base class defining the contract for a memory store."""

    @abc.abstractmethod
    def add_fact(self, fact):
        """Add a fact to the store.

        Args:
            fact: The fact to store.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def get_fact(self, key):
        """Retrieve a fact by its key.

        Args:
            key: Identifier for the fact.

        Returns:
            The stored fact or None if not found.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def remove_fact(self, key):
        """Remove a fact by its key.

        Args:
            key: Identifier of the fact to remove.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def list_facts(self):
        """List all facts currently stored.

        Returns:
            A collection of all facts.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def clear(self):
        """Remove all facts from the store."""
        raise NotImplementedError


class MemoryStoreStub(MemoryStore):
    """Auto‑generated stub that logs every method call to catch missing implementations early."""

    def add_fact(self, fact):
        logger.info("Stub: add_fact(%r)", fact)

    def get_fact(self, key):
        logger.info("Stub: get_fact(%r)", key)
        return None

    def remove_fact(self, key):
        logger.info("Stub: remove_fact(%r)", key)

    def list_facts(self):
        logger.info("Stub: list_facts()")
        return []

    def clear(self):
        logger.info("Stub: clear()")


if __name__ == "__main__":
    # Demonstration of the stub in action
    store = MemoryStoreStub()
    store.add_fact("Sample fact")
    print(store.get_fact("sample_key"))
    store.remove_fact("sample_key")
    print(store.list_facts())
    store.clear()
