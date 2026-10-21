"""Tests for Kahn's topological sort service."""

import uuid

import pytest

from app.models.clearance import ClearanceEdge, ClearanceNode
from app.services.kahn_service import KahnAlgorithmError, KahnService


def make_node(label: str, x: float = 0, y: float = 0) -> ClearanceNode:
    return ClearanceNode(
        id=uuid.uuid4(),
        label=label,
        office=f"{label} Office",
        position_x=x,
        position_y=y,
    )


def test_python_fallback_returns_valid_topological_order():
    first = make_node("First")
    second = make_node("Second")
    third = make_node("Third")
    fourth = make_node("Independent")
    edges = [
        ClearanceEdge(from_node_id=first.id, to_node_id=second.id),
        ClearanceEdge(from_node_id=second.id, to_node_id=third.id),
    ]

    with KahnService() as service:
        service._lib = None
        service.create_handle([first, second, third, fourth], edges)
        ordered, has_cycle, metrics = service.execute(simulated_users=25)

    assert has_cycle is False
    assert len(ordered) == 4
    assert ordered.index(str(first.id)) < ordered.index(str(second.id))
    assert ordered.index(str(second.id)) < ordered.index(str(third.id))
    assert metrics.vertex_count == 4
    assert metrics.edge_count == 2
    assert metrics.simulated_user_count == 25
    assert metrics.complexity == "O((V+E) log V)"


def test_python_fallback_reports_cycles():
    first = make_node("First")
    second = make_node("Second")
    edges = [
        ClearanceEdge(from_node_id=first.id, to_node_id=second.id),
        ClearanceEdge(from_node_id=second.id, to_node_id=first.id),
    ]

    with KahnService() as service:
        service._lib = None
        service.create_handle([first, second], edges)
        ordered, has_cycle, _ = service.execute()

    assert has_cycle is True
    assert ordered == []


def test_rejects_edges_with_unknown_nodes():
    node = make_node("Known")
    unknown_id = uuid.uuid4()
    edge = ClearanceEdge(from_node_id=node.id, to_node_id=unknown_id)

    with KahnService() as service:
        service._lib = None
        with pytest.raises(KahnAlgorithmError, match="existing nodes"):
            service.create_handle([node], [edge])
