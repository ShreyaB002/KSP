# KSP Datathon: Forensic Digital Twin & Investigation Assistant

A comprehensive full-stack application built for the KSP (Karnataka State Police) Datathon. This project serves as a **Forensic Digital Twin and Conversational Investigation Assistant**, designed to help law enforcement officers and investigators manage crime incidents, analyze witness and suspect statements, detect behavioral stress/contradictions, and visualize data across dynamic maps.

## 🚀 Key Features

* **Premium Command Center UI:** A completely bespoke, dark navy and slate-themed dashboard utilizing modern glassmorphism, responsive data grids, and smooth interactive animations.
* **Geospatial Intelligence Mapping:** 
  * Integrated **Leaflet** map with custom dark-mode CSS overrides.
  * Heatmap clustering of incidents based on crime severity and frequency (e.g., Homicides glow high intensity, Thefts glow lower intensity).
  * Real-time dropping and resolving of incident map markers.
* **Incident Management Module:** Add, update, resolve, and archive crime data (type, date, description, coordinates) from a unified dashboard modal.
* **Statement Intake & Analysis:** Text and voice dictation support for ingesting police narratives and suspect/witness statements.
* **AI & Heuristic Contradiction Detection:** The backend analyzes statements for filler words, memory evasion, timeline shifts, and behavioral stress indicators to assign risk scores and detect contradictions across multiple testimonies.
* **Conversational RAG Assistant:** An integrated chat interface allowing officers to query case data and statement history conversationally.

## 🛠️ Technology Stack

### Frontend (React + Vite + TypeScript)
* **Framework:** React 18
* **Build Tool:** Vite
* **Language:** TypeScript
* **Routing:** React Router v6
* **Mapping & Vis:** Leaflet, Leaflet.heat, Three.js
* **Icons & Styling:** Lucide React, Custom CSS Variables

### Backend (Python + FastAPI)
* **Framework:** FastAPI
* **Validation:** Pydantic
* **HTTP Client:** HTTPX (for LLM / internal API routing)
* **Environment:** `python-dotenv`

## 📂 Project Structure

```
KSP datathon/
├── backend/
│   ├── main.py              # Main FastAPI application & routes
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Backend environment secrets
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components (MapViewport, Intake, Modals)
│   │   ├── context/         # React Context providers (CaseContext)
│   │   ├── pages/           # Route views (Dashboard, Analysis, Assistant)
│   │   ├── index.css        # Global styles & Dark Mode Command Center Theme
│   │   ├── App.tsx          # App routing and layout shell
│   │   └── types.ts         # TypeScript interfaces (Case, Network, Statement)
│   ├── package.json         # NPM dependencies and scripts
│   ├── tsconfig.json        # TypeScript configuration
│   └── vite.config.ts       # Vite bundler config
└── README.md                # Project documentation
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Setup Backend
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start the FastAPI server (typically runs on port 8000)
uvicorn main:app --reload
```

### 2. Setup Frontend
Open a separate terminal and navigate to the `frontend` directory:
```bash
cd frontend

# Install NPM dependencies
npm install

# Start the Vite development server
npm run dev
```

### 3. Access the Application
- The Frontend will be available at `http://localhost:5173`
- The Backend API Documentation (Swagger UI) will be available at `http://localhost:8000/docs`

## 🎨 UI/UX Design Notes
The frontend utilizes a custom `index.css` file providing a **Deep Slate/Navy Command Center Theme**. It overrides default Leaflet styles using CSS filters (`invert`, `hue-rotate`) to create a cohesive dark mode mapping experience. Glassmorphic translucent cards (`backdrop-filter: blur(20px)`) and glowing hover states create depth, establishing a high-tech forensic investigation aesthetic.
