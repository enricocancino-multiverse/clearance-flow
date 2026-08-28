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

## Tests

```bash
pytest
```
