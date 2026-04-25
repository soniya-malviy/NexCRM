# Real-Time AI-Powered CRM Platform

A production-grade Customer Relationship Management system with real-time updates, collaborative chat, intelligent alerting, and AI-powered insights.

## Tech Stack

**Frontend:** React + Vite + TailwindCSS + Zustand + Socket.io-client

**Backend:** Node.js + Express + MongoDB + Socket.io

**AI Service:** Python + FastAPI + Sentence Transformers

**DevOps:** Docker + Docker Compose + GitHub Actions

## Features

- **Authentication:** JWT-based auth with role-based access (Admin, Sales, Support)
- **CRM Module:** Full CRUD for Leads, Contacts, and Deals with Kanban pipeline
- **Real-Time Engine:** Socket.io integration for instant updates
- **Chat System:** Slack-like channels with 1-1 messaging
- **Smart Alerts:** Rule-based alert engine for follow-ups and deal monitoring
- **AI Integration:** Lead scoring and duplicate detection
- **Dashboard:** Analytics with conversion rates and pipeline visualization

## Quick Start

### Using Docker (Recommended)

```bash
docker-compose up --build
```

Access at: http://localhost:3000

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env  # Update with your values
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| GET | /api/leads | List all leads |
| POST | /api/leads | Create lead |
| PUT | /api/leads/:id | Update lead |
| DELETE | /api/leads/:id | Delete lead |
| GET | /api/deals | List all deals |
| POST | /api/deals | Create deal |
| PUT | /api/deals/:id | Update deal |
| GET | /api/messages/channels | List channels |
| POST | /api/messages/messages | Send message |
| GET | /api/dashboard/stats | Dashboard stats |

## Project Structure

```
├── backend/
│   ├── controllers/    # Route handlers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── middlewares/    # Auth, validation
│   ├── sockets/        # Socket.io setup
│   └── server.js       # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Zustand stores
│   │   ├── services/   # API calls
│   │   └── socket/     # Socket client
│   └── package.json
├── ai-service/
│   └── main.py          # FastAPI service
├── docker-compose.yml
└── README.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | JWT signing secret |
| CLIENT_URL | Frontend URL (CORS) |
| PORT | Server port (default: 5000) |

## Demo Credentials

- Email: admin@crm.com
- Password: password123

## License

MIT