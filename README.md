# Specter 👁️✨

**Your AI Legal Assistant with X-Ray Vision for Contracts.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Framework: FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Platform: Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)

---

[cite_start]Specter is a generative AI solution developed for the **Google Cloud Gen AI Exchange Hackathon**[cite: 2, 3]. [cite_start]Its objective is to demystify complex legal documents by simplifying jargon into clear, accessible guidance, empowering users to make informed decisions[cite: 6]. [cite_start]It provides a private and supportive environment to analyze contracts, explain clauses, and answer questions in a simple, practical manner[cite: 11, 13].

---

## 🚀 Key Features

* [cite_start]**👁️ Visual Risk Annotation (Legal X-Ray Vision)**: Specter's core feature uses **Google Document AI** to visually highlight and annotate high-risk or confusing clauses directly on the original document[cite: 14, 36, 62, 64]. [cite_start]This provides immediate, in-context understanding by showing you not just *what* the risks are, but exactly *where* they are[cite: 65].

* [cite_start]**📝 Key Information Extraction**: When a document is uploaded, it is processed by **Gemini 1.5** to create a dashboard overview[cite: 16, 69]. [cite_start]This dashboard intelligently extracts, displays, and simplifies all crucial data, such as financial terms, parties and obligations, and critical dates[cite: 70, 71, 72, 73].

* [cite_start]**💬 Conversational Q&A (Chat with your Doc)**: An interactive chat interface allows users to ask specific questions about their document in natural language[cite: 17, 76]. [cite_start]Powered by a RAG system using **BigQuery Vector Search**, it provides instant, context-aware answers in plain language[cite: 18, 43, 77].

* [cite_start]**🔒 Secure Document Management**: The platform includes secure account support with **Google Authentication**[cite: 79]. [cite_start]All uploaded documents are stored in **Google Cloud Storage** [cite: 82][cite_start], while analyses and chat histories are saved to **Firestore**, creating a persistent and organized repository for users[cite: 80, 83].

---

## 💡 How It Works (Architecture)

Specter is built on a modern, scalable architecture that leverages Google Cloud's powerful AI services. [cite_start]The workflow is orchestrated between a Next.js frontend and a FastAPI backend, both hosted on **Cloud Run**[cite: 131, 143, 199].

1.  [cite_start]**Authentication & Upload**: The user logs in via Google Auth and uploads a legal document (e.g., PDF) through the **Next.js** frontend[cite: 98, 107].
2.  [cite_start]**Backend Ingestion**: The **FastAPI** backend receives the file and securely stores the raw document in **Google Cloud Storage**[cite: 117, 146].
3.  [cite_start]**Document Processing**: **Document AI** is triggered to perform OCR and layout extraction[cite: 116, 155]. [cite_start]It extracts the raw text along with precise bounding box coordinates for every paragraph and element[cite: 156].
4.  [cite_start]**AI Analysis & Summarization**: The extracted text is sent to **Gemini 1.5**[cite: 118, 157]. [cite_start]The model analyzes the content and generates a structured JSON output containing summaries, financial terms, identified risks, and key obligations[cite: 159].
5.  **Data Persistence**:
    * [cite_start]The structured summary and annotation data are stored in **Firestore** for quick retrieval[cite: 123, 150].
    * [cite_start]For the RAG system, the document text is chunked, converted into vector embeddings using **Google's Text Embedding Model**, and indexed in **BigQuery Vector Search**[cite: 112, 160, 163, 171].
6.  **Frontend Rendering**: The frontend retrieves the analysis from Firestore and the original document from Cloud Storage. [cite_start]It then renders the document and overlays the visual highlights (the "Legal X-Ray Vision") using the bounding box data[cite: 111, 138]. [cite_start]The conversational chat interface queries the BigQuery RAG system to provide contextual answers[cite: 151].



---

## 🛠️ Technology Stack

### Frontend
* [cite_start]**Core Framework**: Next.js, React [cite: 183]
* [cite_start]**UI**: Tailwind CSS, Radix UI (via shadcn/ui) [cite: 183]
* [cite_start]**Document Display**: react-pdf [cite: 184]
* [cite_start]**Animations**: GSAP [cite: 184]
* [cite_start]**Runtime**: Bun [cite: 184]

### Backend
* [cite_start]**API Framework**: FastAPI (Python) [cite: 186]
* [cite_start]**AI Orchestration**: LangChain, LangGraph [cite: 187]

### Google Cloud Platform & AI
* [cite_start]**Compute**: Cloud Run [cite: 201]
* [cite_start]**Generative AI**: Gemini 1.5 Pro & Flash [cite: 189, 203]
* [cite_start]**Document Intelligence**: Document AI [cite: 190, 205]
* **Databases**:
    * [cite_start]Firestore (Application Database for summaries/chats) [cite: 193, 208]
    * [cite_start]BigQuery with Vector Search (Vector Database for RAG) [cite: 197, 210]
* [cite_start]**Storage**: Cloud Storage (for raw document files) [cite: 194, 206]
* [cite_start]**AI Models**: Google's Text Embedding Model [cite: 191, 212]
* [cite_start]**Authentication**: Google Authentication [cite: 195, 214]

---

## ⚙️ Setup and Installation

To run this project locally, you will need to set up both the backend and frontend services.

### Backend Setup (`specter-backend`)

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd 19doors-specter-backend
    ```
2.  **Set up a Python virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up Google Cloud Authentication**:
    Ensure you have the Google Cloud SDK installed and authenticated.
    ```bash
    gcloud auth application-default login
    ```
5.  **Create a `.env` file** and add your project-specific credentials:
    ```env
    # No environment variables needed for the backend as per the provided code,
    # but ensure your gcloud CLI is configured with the correct project.
    # The project ID and processor ID are hardcoded in the source files.
    ```
6.  **Run the backend server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

### Frontend Setup (`specter-frontend`)

1.  **Navigate to the frontend directory**:
    ```bash
    cd ../19doors-specter-frontend
    ```
2.  **Install dependencies**:
    ```bash
    bun install
    ```
3.  **Set up environment variables**:
    Create a `.env.local` file in the frontend root and add the following:
    ```env
    # Turso Database for Better-Auth
    TURSO_DATABASE_URL="your-turso-db-url"
    TURSO_AUTH_TOKEN="your-turso-auth-token"

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

    # URL of your running backend
    NEXT_PUBLIC_API_BASE_URL="[http://127.0.0.1:8000](http://127.0.0.1:8000)"
    ```
4.  **Run the frontend development server**:
    ```bash
    bun dev
    ```
    The application will be available at `http://localhost:3000`.

---

## 👥 Team

This project was created by **Team Arrow** for the Google Gen AI Hackathon.
* [cite_start]**Team Leader**: Sakaar Srivastava [cite: 4, 5]
