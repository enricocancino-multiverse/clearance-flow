"""
Kahn's Algorithm Service - Python wrapper for C++ module.

This service provides a Python interface to the compiled C++ Kahn's algorithm module.
It handles loading the shared library, data conversion, and error handling.
"""

import ctypes
import logging
import platform
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.core.config import get_settings
from app.models.clearance import ClearanceEdge, ClearanceNode
from app.schemas.clearance import AlgorithmMetricsResponse

logger = logging.getLogger(__name__)
settings = get_settings()


class KahnAlgorithmError(Exception):
    """Exception raised when Kahn's algorithm execution fails."""
    pass


class KahnService:
    """
    Service for executing Kahn's topological sort algorithm via C++ module.
    """

    def __init__(self):
        self._lib: Optional[ctypes.CDLL] = None
        self._handle: Optional[ctypes.c_void_p] = None
        self._nodes: list[ClearanceNode] = []
        self._edges: list[ClearanceEdge] = []
        self._load_library()

    def _load_library(self) -> None:
        """Load the C++ shared library."""
        system = platform.system().lower()
        if system == "windows":
            lib_name = "kahn_module.dll"
        elif system == "darwin":
            lib_name = "libkahn_module.dylib"
        else:
            lib_name = "kahn_module.so"

        # Try multiple paths
        possible_paths = [
            Path(settings.CPP_MODULE_PATH),
            Path(__file__).parent.parent.parent / "cpp_module" / lib_name,
            Path.cwd() / "cpp_module" / lib_name,
        ]

        for path in possible_paths:
            if path.exists():
                try:
                    self._lib = ctypes.CDLL(str(path))
                    logger.info(f"Loaded C++ module from {path}")
                    return
                except OSError as e:
                    logger.warning(f"Failed to load {path}: {e}")

        # If we get here, library wasn't found - use Python fallback
        logger.warning("C++ module not found, using Python fallback implementation")
        self._lib = None

    def _setup_function_signatures(self) -> None:
        """Set up ctypes function signatures."""
        if not self._lib:
            return

        # kahn_create
        self._lib.kahn_create.argtypes = [
            ctypes.POINTER(ctypes.c_char_p),  # node_ids
            ctypes.POINTER(ctypes.c_char_p),  # node_labels
            ctypes.POINTER(ctypes.c_char_p),  # node_offices
            ctypes.POINTER(ctypes.c_double),  # node_positions_x
            ctypes.POINTER(ctypes.c_double),  # node_positions_y
            ctypes.c_int,                      # node_count
            ctypes.POINTER(ctypes.c_char_p),  # edge_from_ids
            ctypes.POINTER(ctypes.c_char_p),  # edge_to_ids
            ctypes.c_int,                      # edge_count
        ]
        self._lib.kahn_create.restype = ctypes.c_void_p

        # kahn_destroy
        self._lib.kahn_destroy.argtypes = [ctypes.c_void_p]
        self._lib.kahn_destroy.restype = None

        # kahn_execute
        self._lib.kahn_execute.argtypes = [
            ctypes.c_void_p,                    # handle
            ctypes.c_int,                       # simulated_users
            ctypes.POINTER(ctypes.POINTER(ctypes.c_char_p)),  # out_sorted_ids
            ctypes.POINTER(ctypes.c_int),       # out_count
            ctypes.POINTER(ctypes.c_int),       # out_has_cycle
        ]
        self._lib.kahn_execute.restype = ctypes.c_int

        # kahn_free_results
        self._lib.kahn_free_results.argtypes = [
            ctypes.POINTER(ctypes.c_char_p),
            ctypes.c_int,
        ]
        self._lib.kahn_free_results.restype = None

    def _prepare_node_arrays(self, nodes: list[ClearanceNode]) -> tuple:
        """Convert nodes to C-compatible arrays."""
        count = len(nodes)
        node_ids = (ctypes.c_char_p * count)()
        node_labels = (ctypes.c_char_p * count)()
        node_offices = (ctypes.c_char_p * count)()
        node_positions_x = (ctypes.c_double * count)()
        node_positions_y = (ctypes.c_double * count)()

        for i, node in enumerate(nodes):
            node_ids[i] = str(node.id).encode('utf-8')
            node_labels[i] = node.label.encode('utf-8')
            node_offices[i] = node.office.encode('utf-8')
            node_positions_x[i] = node.position_x
            node_positions_y[i] = node.position_y

        return node_ids, node_labels, node_offices, node_positions_x, node_positions_y

    def _prepare_edge_arrays(self, edges: list[ClearanceEdge]) -> tuple:
        """Convert edges to C-compatible arrays."""
        count = len(edges)
        edge_from_ids = (ctypes.c_char_p * count)()
        edge_to_ids = (ctypes.c_char_p * count)()

        for i, edge in enumerate(edges):
            edge_from_ids[i] = str(edge.from_node_id).encode('utf-8')
            edge_to_ids[i] = str(edge.to_node_id).encode('utf-8')

        return edge_from_ids, edge_to_ids

    def create_handle(self, nodes: list[ClearanceNode], edges: list[ClearanceEdge]) -> bool:
        """Create algorithm handle with graph data."""
        self._nodes = list(nodes)
        self._edges = list(edges)
        self._validate_graph()

        if not self._lib:
            return False

        if self._handle is not None:
            self.destroy_handle()

        try:
            self._setup_function_signatures()

            node_ids, node_labels, node_offices, node_pos_x, node_pos_y = self._prepare_node_arrays(nodes)
            edge_from_ids, edge_to_ids = self._prepare_edge_arrays(edges)

            self._handle = self._lib.kahn_create(
                node_ids, node_labels, node_offices,
                node_pos_x, node_pos_y, len(nodes),
                edge_from_ids, edge_to_ids, len(edges)
            )

            return self._handle is not None
        except Exception as e:
            logger.error(f"Failed to create Kahn handle: {e}")
            return False

    def _validate_graph(self) -> None:
        node_ids = [str(node.id) for node in self._nodes]
        if len(node_ids) != len(set(node_ids)):
            raise KahnAlgorithmError("Graph contains duplicate node IDs")

        known_ids = set(node_ids)
        edges: set[tuple[str, str]] = set()
        for edge in self._edges:
            source = str(edge.from_node_id)
            target = str(edge.to_node_id)
            if source not in known_ids or target not in known_ids:
                raise KahnAlgorithmError("Every edge must connect two existing nodes")
            if source == target:
                raise KahnAlgorithmError("A node cannot depend on itself")
            if (source, target) in edges:
                raise KahnAlgorithmError("Graph contains duplicate edges")
            edges.add((source, target))

    def destroy_handle(self) -> None:
        """Destroy algorithm handle."""
        if self._lib and self._handle:
            try:
                self._lib.kahn_destroy(self._handle)
            except Exception as e:
                logger.error(f"Error destroying Kahn handle: {e}")
            finally:
                self._handle = None

    def execute(self, simulated_users: int = 100) -> tuple[list[str], bool, AlgorithmMetricsResponse]:
        """
        Execute Kahn's algorithm.

        Returns:
            Tuple of (sorted_node_ids, has_cycle, metrics)
        """
        if simulated_users < 0:
            raise ValueError("simulated_users cannot be negative")
        if self._lib and self._handle:
            return self._execute_cpp(simulated_users)
        return self._execute_python_fallback(simulated_users)

    def _execute_cpp(self, simulated_users: int) -> tuple[list[str], bool, AlgorithmMetricsResponse]:
        """Execute using C++ module."""
        if not self._lib or not self._handle:
            raise KahnAlgorithmError("C++ algorithm handle is not initialized")

        sorted_ids_ptr = ctypes.POINTER(ctypes.c_char_p)()
        count = ctypes.c_int(0)
        has_cycle = ctypes.c_int(0)

        started_at = time.perf_counter()
        result = self._lib.kahn_execute(
            self._handle,
            simulated_users,
            ctypes.byref(sorted_ids_ptr),
            ctypes.byref(count),
            ctypes.byref(has_cycle)
        )

        if result != 0:
            raise KahnAlgorithmError("C++ algorithm execution failed")

        try:
            sorted_ids = [sorted_ids_ptr[i].decode('utf-8') for i in range(count.value)]
            elapsed_ms = round((time.perf_counter() - started_at) * 1000)
            return sorted_ids, bool(has_cycle.value), self._metrics(elapsed_ms, simulated_users)
        finally:
            self._lib.kahn_free_results(sorted_ids_ptr, count.value)

    def _execute_python_fallback(self, simulated_users: int) -> tuple[list[str], bool, AlgorithmMetricsResponse]:
        """Python fallback implementation of Kahn's algorithm."""
        import heapq

        adjacency: dict[str, list[str]] = {str(node.id): [] for node in self._nodes}
        indegree = {str(node.id): 0 for node in self._nodes}
        nodes_by_id = {str(node.id): node for node in self._nodes}
        index_by_id = {str(node.id): index for index, node in enumerate(self._nodes)}

        for edge in self._edges:
            source = str(edge.from_node_id)
            target = str(edge.to_node_id)
            adjacency[source].append(target)
            indegree[target] += 1

        started_at = time.perf_counter()
        available: list[tuple[int, int, str]] = []
        for index, node in enumerate(self._nodes):
            node_id = str(node.id)
            if indegree[node_id] == 0:
                heapq.heappush(available, (0, index, node_id))

        ordered_ids: list[str] = []
        while available:
            _, _, selected_id = heapq.heappop(available)
            ordered_ids.append(selected_id)

            for next_id in adjacency[selected_id]:
                indegree[next_id] -= 1
                if indegree[next_id] == 0:
                    next_node = nodes_by_id[next_id]
                    position_priority = int(next_node.position_y * 1000 + next_node.position_x)
                    heapq.heappush(
                        available,
                        (position_priority, index_by_id[next_id], next_id),
                    )

        elapsed_ms = round((time.perf_counter() - started_at) * 1000)
        has_cycle = len(ordered_ids) != len(self._nodes)
        logger.info("Executed Kahn's algorithm with Python fallback")
        return ordered_ids, has_cycle, self._metrics(elapsed_ms, simulated_users)

    def _metrics(self, elapsed_ms: int, simulated_users: int) -> AlgorithmMetricsResponse:
        estimated_bytes = len(self._nodes) * 64 + len(self._edges) * 24
        return AlgorithmMetricsResponse(
            id=str(uuid.uuid4()),
            execution_time_ms=elapsed_ms,
            vertex_count=len(self._nodes),
            edge_count=len(self._edges),
            heap_usage_mb=estimated_bytes / (1024 * 1024),
            simulated_user_count=simulated_users,
            complexity="O((V+E) log V)",
            recorded_at=datetime.now(timezone.utc),
        )

    def __enter__(self) -> "KahnService":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.destroy_handle()


# Global service instance
_kahn_service: Optional[KahnService] = None


def get_kahn_service() -> KahnService:
    """Get or create global Kahn service instance."""
    global _kahn_service
    if _kahn_service is None:
        _kahn_service = KahnService()
    return _kahn_service