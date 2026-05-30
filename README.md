# Lineage Archive

> Sovereign Digital Heirloom — multi-generational family archive

## Stack
- **Backend**: Django + Django REST Framework + SQLite (dev) / PostgreSQL (prod)
- **Frontend**: React (Vite) + React Query + Zustand
- **Hosting**: Render.com (auto-deploy on push to `main`)

## Local development

### Backend
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173  
Backend API on http://localhost:8000/api

## Deploying to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo — Render reads `render.yaml` automatically
4. Add your GitHub repo secrets for CI/CD:
   - `RENDER_DEPLOY_HOOK_BACKEND` — from Render backend service settings
   - `RENDER_DEPLOY_HOOK_FRONTEND` — from Render frontend service settings
5. Every push to `main` runs tests then auto-deploys

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Create account |
| POST | `/api/auth/login/` | Get JWT tokens |
| GET/PATCH | `/api/auth/profile/` | View/edit profile |
| GET/POST | `/api/auth/permissions/` | Manage viewing access |
| GET | `/api/vault/items/` | List vault items |
| POST | `/api/vault/upload/` | Upload media |
| POST | `/api/vault/items/:id/triage/` | keep / queue / delete |
| GET | `/api/vault/gates/` | Annual compile gates |
| POST | `/api/vault/compile/:year/` | Execute annual compile |
| GET | `/api/vault/timeline/:user_id/` | Read lineage timeline |
| GET | `/api/lineage/tree/` | Family graph |

## Architecture

Four sovereignty principles enforced in code:
1. **Absolute individual sovereignty** — UUID-keyed user nodes, JWT auth
2. **Device silence** — no push logic, no notification triggers
3. **365-day manual compiles** — AnnualCompileGate model, two-step confirm
4. **Bloodline grouping** — directional paternal/maternal FK on User model
