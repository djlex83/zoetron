from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class DreamMemory:
    """A single dream memory with optional versioning."""
    id: str
    content: str
    tags: List[str]
    embedding: List[float]
    version: int = 1  # default version for newly created memories


class MemoryStore:
    """
    Store for DreamMemory objects that keeps a version history per ID.
    The `add_fact` method validates input, assigns/updates the version,
    stores the memory, and returns the version number that was stored.
    """

    def __init__(self, embedding_dim: int = 3):
        """
        Args:
            embedding_dim: Expected length of the embedding vector.
        """
        self._memories: Dict[str, List[DreamMemory]] = {}
        self._embedding_dim = embedding_dim

    def add_fact(self, memory: DreamMemory) -> int:
        """
        Validate and store a DreamMemory, returning its version number.

        Steps:
        1. Type‑check the incoming object.
        2. Validate that `embedding` is a list of floats of the expected dimension.
        3. Determine the next version for this `id`.
        4. Store a copy of the memory with the assigned version.
        5. Return the version number.

        Raises:
            TypeError: If `memory` is not a DreamMemory instance.
            ValueError: If embedding validation fails.
        """
        if not isinstance(memory, DreamMemory):
            raise TypeError('Memory must be DreamMemory instance')

        # ---- embedding validation ----
        if not isinstance(memory.embedding, list):
            raise ValueError('Embedding must be a list')
        if not all(isinstance(x, float) for x in memory.embedding):
            raise ValueError('All embedding elements must be floats')
        if len(memory.embedding) != self._embedding_dim:
            raise ValueError(
                f'Embedding length must be {self._embedding_dim}, got {len(memory.embedding)}'
            )

        # ---- version handling ----
        versions = self._memories.setdefault(memory.id, [])
        version = len(versions) + 1  # next version number

        # Store an immutable copy with the version set
        versioned_memory = DreamMemory(
            id=memory.id,
            content=memory.content,
            tags=memory.tags.copy(),
            embedding=memory.embedding.copy(),
            version=version,
        )
        versions.append(versioned_memory)

        return version


# ------------------- Demo -------------------
if __name__ == "__main__":
    store = MemoryStore(embedding_dim=3)

    dream = DreamMemory(
        id='dream1',
        content='I flew over a city made of glass',
        tags=['flight', 'city'],
        embedding=[0.1, 0.2, 0.3]
    )

    version_stored = store.add_fact(dream)
    print(f'Stored dream with version {version_stored}')
    print(f'Total unique dream IDs: {len(store._memories)}')
    print(f'History for dream1: {[m.version for m in store._memories["dream1"]]}')
