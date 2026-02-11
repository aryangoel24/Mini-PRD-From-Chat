### Run without docker
1. Backend
cd backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt

Create a .env file in the project root:

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

Start the backend:

uvicorn app.main:app --reload --port 8000

Health check:

http://localhost:8000/healthz

2. Frontend

In a new terminal:

cd frontend
npm install
npm run dev

Open:

http://localhost:5173


### Run with Docker
1) Create `.env` from `.env.example`
2) `docker compose up --build`
3) Visit http://localhost:5173