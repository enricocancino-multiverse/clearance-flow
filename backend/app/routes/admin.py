"""
Admin routes: graph management, metrics, users.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.models.account import Account, UserRole
from app.models.clearance import (
    AlgorithmMetrics,
    ClearanceEdge,
    ClearanceNode,
    ClearanceRequest,
)
from app.services.kahn_service import KahnService, KahnAlgorithmError
from app.routes.auth import get_current_account
from app.schemas.clearance import (
    AlgorithmRunRequest,
    AlgorithmRunResponse,
    AlgorithmMetricsResponse,
    ClearanceEdgeCreate,
    ClearanceEdgeResponse,
    ClearanceNodeCreate,
    ClearanceNodeResponse,
    ClearanceNodeUpdate,
    GraphStateResponse,
)
from app.schemas.auth import AccountResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


async def require_superadmin(
    account = Depends(get_current_account),
) -> None:
    """Ensure the current user is a superadmin."""
    if account.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )


# ─── Graph Management ────────────────────────────────────────────────

@router.get("/graph", response_model=GraphStateResponse)
async def get_graph(
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> GraphStateResponse:
    """Get complete DAG state: all nodes and edges."""
    nodes_result = await session.execute(
        select(ClearanceNode).order_by(ClearanceNode.position_y, ClearanceNode.position_x)
    )
    nodes = nodes_result.scalars().all()

    edges_result = await session.execute(select(ClearanceEdge))
    edges = edges_result.scalars().all()

    return GraphStateResponse(
        nodes=[ClearanceNodeResponse.model_validate(n) for n in nodes],
        edges=[ClearanceEdgeResponse.model_validate(e) for e in edges],
    )


@router.post("/nodes", response_model=ClearanceNodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    payload: ClearanceNodeCreate,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> ClearanceNodeResponse:
    """Create a new clearance node."""
    node = ClearanceNode(**payload.model_dump())
    session.add(node)
    await session.commit()
    await session.refresh(node)
    return ClearanceNodeResponse.model_validate(node)


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: str,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> None:
    """Delete a clearance node and its associated edges."""
    # Check if node exists
    node_result = await session.execute(select(ClearanceNode).where(ClearanceNode.id == node_id))
    node = node_result.scalar_one_or_none()

    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found",
        )

    # Delete associated edges first (cascade should handle this, but explicit is safer)
    await session.execute(
        delete(ClearanceEdge).where(
            (ClearanceEdge.from_node_id == node_id) | (ClearanceEdge.to_node_id == node_id)
        )
    )

    # Delete the node
    await session.delete(node)
    await session.commit()


@router.post("/rules", response_model=ClearanceEdgeResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: ClearanceEdgeCreate,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> ClearanceEdgeResponse:
    """Create a prerequisite rule (edge) between nodes."""
    # Verify both nodes exist
    from_node_result = await session.execute(
        select(ClearanceNode).where(ClearanceNode.id == payload.from_node_id)
    )
    from_node = from_node_result.scalar_one_or_none()
    if not from_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source node not found",
        )

    to_node_result = await session.execute(
        select(ClearanceNode).where(ClearanceNode.id == payload.to_node_id)
    )
    to_node = to_node_result.scalar_one_or_none()
    if not to_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target node not found",
        )

    edges_result = await session.execute(select(ClearanceEdge))
    adjacency: dict[str, list[str]] = {}
    for existing_edge in edges_result.scalars().all():
        adjacency.setdefault(str(existing_edge.from_node_id), []).append(
            str(existing_edge.to_node_id)
        )

    source_id = str(payload.from_node_id)
    target_id = str(payload.to_node_id)
    pending_nodes = [target_id]
    visited: set[str] = set()
    while pending_nodes:
        current_id = pending_nodes.pop()
        if current_id == source_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rule would create a cycle",
            )
        if current_id in visited:
            continue
        visited.add(current_id)
        pending_nodes.extend(adjacency.get(current_id, []))

    edge = ClearanceEdge(**payload.model_dump())
    session.add(edge)
    await session.commit()
    await session.refresh(edge)
    return ClearanceEdgeResponse.model_validate(edge)


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: str,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> None:
    """Delete a prerequisite rule (edge)."""
    edge_result = await session.execute(select(ClearanceEdge).where(ClearanceEdge.id == rule_id))
    edge = edge_result.scalar_one_or_none()

    if not edge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found",
        )

    await session.delete(edge)
    await session.commit()


# ─── Metrics ──────────────────────────────────────────────────────────

@router.get("/metrics", response_model=list[AlgorithmMetricsResponse])
async def get_metrics(
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> list[AlgorithmMetricsResponse]:
    """Get Kahn's algorithm execution metrics from C++ module."""
    metrics_result = await session.execute(
        select(AlgorithmMetrics)
        .order_by(AlgorithmMetrics.recorded_at.desc())
        .limit(limit)
    )
    metrics = metrics_result.scalars().all()
    return [AlgorithmMetricsResponse.model_validate(m) for m in metrics]


@router.post("/algorithm/run", response_model=AlgorithmRunResponse)
async def run_graph_algorithm(
    payload: AlgorithmRunRequest,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> AlgorithmRunResponse:
    """Run Kahn's topological sort on the current clearance graph and record metrics."""
    nodes_result = await session.execute(
        select(ClearanceNode).order_by(ClearanceNode.position_y, ClearanceNode.position_x)
    )
    nodes = list(nodes_result.scalars().all())
    edges_result = await session.execute(select(ClearanceEdge))
    edges = list(edges_result.scalars().all())

    try:
        with KahnService() as algorithm:
            algorithm.create_handle(nodes, edges)
            sorted_ids, has_cycle, metrics = algorithm.execute(payload.simulated_user_count)
    except (KahnAlgorithmError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    session.add(
        AlgorithmMetrics(
            id=UUID(metrics.id),
            execution_time_ms=metrics.execution_time_ms,
            vertex_count=metrics.vertex_count,
            edge_count=metrics.edge_count,
            heap_usage_mb=metrics.heap_usage_mb,
            simulated_user_count=metrics.simulated_user_count,
            complexity=metrics.complexity,
            recorded_at=metrics.recorded_at,
        )
    )
    await session.commit()
    return AlgorithmRunResponse(
        sorted_node_ids=sorted_ids,
        has_cycle=has_cycle,
        metrics=metrics,
    )


# ─── Users ────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[AccountResponse])
async def get_users(
    role: Optional[UserRole] = None,
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_superadmin),
) -> list[AccountResponse]:
    """Get all system users, optionally filtered by role."""
    query = (
        select(Account)
        .options(selectinload(Account.student), selectinload(Account.faculty))
        .order_by(Account.created_at.desc())
    )

    if role:
        query = query.where(Account.role == role)

    result = await session.execute(query)
    accounts = result.scalars().all()
    return [
        AccountResponse.model_validate(account).model_copy(
            update={
                "department": (
                    account.student.department
                    if account.student
                    else account.faculty.department
                    if account.faculty
                    else None
                )
            }
        )
        for account in accounts
    ]


@router.delete("/users/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    account_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_account: Account = Depends(get_current_account),
    _: None = Depends(require_superadmin),
) -> None:
    """Delete a student or faculty account without allowing an admin to remove themself."""
    account = await session.get(Account, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    if account.id == current_account.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrator account",
        )
    if account.role == UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use an existing administrator account to manage administrator access",
        )
    await session.delete(account)
    await session.commit()