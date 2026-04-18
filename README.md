# Lyra Technical Documentation

Lyra is a distributed piano practice platform that integrates real-time MIDI evaluation with a neural recommendation engine. The system provides automated performance analysis, dynamic notation rendering, and personalized exercise sequencing.

## System Architecture

The project is implemented as a microservices-based architecture composed of three primary services orchestrated via Docker.

### LyraFront (Frontend SPA)
A React-based single-page application that serves as the primary user interface and execution engine for exercises.
- **Core Technologies**: React 19, Vite, Tone.js, VexFlow.
- **MIDI Integration**: Utilizes the Web MIDI API for low-latency input capture and state synchronization.
- **Rendering Engines**: 
  - **Notation**: Dynamic grand staff generation via VexFlow.
  - **Visualization**: Canvas-based "Synthesia-style" falling note tiles.
  - **Anatomical Models**: SVG-based hand diagrams for fingering guidance.
- **Evaluation**: Performs client-side quantization and timing analysis of MIDI events against expected note sequences.

### LyraBackend (API Service)
A Node.js service handling persistence, authentication, and service orchestration.
- **Core Technologies**: Express, SQLite3, JWT.
- **Persistence**: Managed via a local SQLite database for exercise metadata, user profiles, and performance history.
- **Logic**: Orchestrates the communication between the frontend and the AI service, transforming raw performance metrics into historical trend data.

### LyraAI (Inference Service)
A Python service dedicated to performance modeling and exercise recommendation.
- **Core Technologies**: FastAPI, PyTorch, Google Gemini API.
- **CNN Engine**: A convolutional neural network trained to analyze multi-dimensional performance vectors (accuracy, rhythm, velocity) to select optimal subsequent exercises.
- **LLM Layer**: An optional integration with Google's Gemini models to generate semantic practice strategies based on CNN output.

## Technical Specifications

### Data Structures
The system relies on a standardized `NoteEvent` model for all musical data:
- `pitch`: MIDI pitch (0-127).
- `startTime`: Temporal position in beats (float).
- `duration`: Note length in beats.
- `hand`: Left/Right assignment.

Exercise configurations support `FingeringMap` objects for mapping MIDI pitches to specific fingers (1-5) and `FingeringChange` events for mid-exercise position shifts.

### Evaluation Modes
- **Free Mode**: Beat advances via a high-resolution timer based on BPM. Performance is measured against a temporal tolerance window.
- **Step Mode**: Input-driven advancement. The system state only progresses when the required pitch set for the current beat is satisfied.

### Recommendation Pipeline
1. **Metric Collection**: The frontend computes metrics for a completed exercise loop.
2. **Analysis**: Metrics are transmitted to `LyraAI` via the backend.
3. **Inference**: The CNN evaluates the user's proficiency level across various technical dimensions.
4. **Selection**: An epsilon-greedy strategy is applied to balance reinforcement of known skills with the introduction of new technical challenges.
5. **Enrichment (Optional)**: If configured, an LLM generates a `strategy_hint` to provide the user with qualitative feedback.

## Infrastructure and Deployment

### Docker Orchestration
The system is deployed using `docker-compose`. 
- **Volumes**: A shared `lyra-data` volume persists the SQLite database and AI model state across container restarts.
- **Networking**: Services communicate over an internal bridge network. The AI service remains isolated and is only reachable by the backend.

### Environment Configuration
The system requires the following environment variables (defined in `.env`):
- `JWT_SECRET`: Required for session security.
- `CORS_ORIGINS`: Allowed origins for frontend access.
- `GEMINI_API_KEY`: Optional; enables the LLM strategy layer.
- `VITE_API_URL`: Build-time variable for frontend-to-backend communication.

## Development Environment

### Prerequisites
- Node.js 20 or higher
- Python 3.10 or higher (for local AI execution)
- Docker Engine 24+ with Compose plugin

### Initial Setup
```bash
# Install dependencies across all services
npm run ginstall

# Build containers
docker compose build
```

### Execution
The root `package.json` provides scripts for lifecycle management:
- `npm run dev`: Executes all services concurrently using `concurrently`.
- `npm run backend`: Starts the Node.js API in development mode.
- `npm run frontend`: Starts the Vite development server.
- `npm run ai`: Provisions the AI service via Docker.

## Documentation References
- [Deployment Guide](DEPLOY.md): Production deployment and reverse proxy setup.
- [Data Model](LyraFront/src/lib/DATAMODEL.md): Comprehensive schema definitions.
- [Usage Guide](LyraFront/USAGE.md): Technical instructions for exercise authorship.
