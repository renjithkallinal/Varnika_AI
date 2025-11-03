# Varnika — Starter Project

This is a starter template for **Varnika** — an AI text-to-video web app (Next.js frontend + FastAPI backend) with ModelScope integration and Firebase storage.

## Quick files
- frontend/ — Next.js app (dark theme)
- backend/ — FastAPI backend, ModelScope wrapper, Firebase upload helper
- infra/docker-compose.yml — GPU-ready compose (requires NVIDIA Container Toolkit)

## Notes about GPU docker-compose
- The `runtime: nvidia` and `deploy.resources.reservations.devices` entries assume you have the NVIDIA Container Toolkit installed on the host.
- On many systems, `docker compose` with GPU support requires Docker Engine with NVIDIA support (https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html).
- Place your Firebase service account JSON at `backend/firebase-service-account.json` (or update compose secrets path) before running.

## To run locally (non-docker)
1. Backend: (on a GPU machine)
   ```
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   # ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account or set firebase key path
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```

## To run with Docker Compose
1. Ensure NVIDIA Container Toolkit is installed on the host and Docker can use GPUs.
2. Copy your Firebase service account JSON to `backend/firebase-service-account.json`.
3. From `infra/`:
   ```
   docker compose up --build
   ```

