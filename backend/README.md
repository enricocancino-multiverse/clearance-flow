# ClearanceFlow Backend

FastAPI backend for ClearanceFlow. It uses PostgreSQL in development and exposes the API under `/api/v1`.

## Setup

From this directory, install the project and development dependencies:

```bash
python -m pip install -e ".[dev]"
```

Start PostgreSQL using `docker compose up -d postgres`, then run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The health endpoint is available at `http://localhost:8000/health`.

To run the API and database together, use `docker compose up --build`. The backend image
compiles the C++ Kahn's algorithm shared library during its build. When running the API
directly outside Docker without that library, the same deterministic topological sort is
provided by the Python fallback. Clearance graph ordering uses Kahn's algorithm; the faculty
queue uses a greedy priority score for exam urgency, completed prerequisites, department
match, and waiting time. The graph traversal uses a min-heap to greedily select among
eligible nodes, so its bound is `O((V+E) log V)`; a FIFO Kahn traversal without that
tie-breaking policy is `O(V+E)`.

## Tests

```bash
pytest
```
