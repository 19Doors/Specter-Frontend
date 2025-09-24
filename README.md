# Specter 👁️✨

**Your AI Legal Assistant with X-Ray Vision for Contracts.**

[!][License: MIT](https://img.shields.io/badge(https://opensource.org/licenseshttps://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs)  
[!][Framework: FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for(https://fastapi.tiangoloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google)(https://cloud.google.com a generative AI solution developed for the **Google Cloud Gen AI Exchange Hackathon**. Its objective is to demystify complex legal documents by simplifying jargon into clear, accessible guidance, empowering users to make informed decisions. It provides a private and supportive environment to analyze contracts, explain clauses, and answer questions in a simple, practical manner.

***

## 🚀 Key Features

* **👁️ Visual Risk Annotation (Legal X-Ray Vision)**: Specter's core feature uses **Google Document AI** to visually highlight and annotate high-risk or confusing clauses directly on the original document. This provides immediate, in-context understanding by showing you not just *what* the risks are, but exactly *where* they are.

* **📝 Key Information Extraction**: When a document is uploaded, it is processed by **Gemini 1.5** to create a dashboard overview. This dashboard intelligently extracts, displays, and simplifies all crucial data, such as financial terms, parties and obligations, and critical dates.

* **💬 Conversational Q&A (Chat with your Doc)**: An interactive chat interface allows users to ask specific questions about their document in natural language. Powered by a RAG system using **BigQuery Vector Search**, it provides instant, context-aware answers in plain language.

* **🔒 Secure Document Management**: The platform includes secure account support with **Google Authentication**. All uploaded documents are stored in **Google Cloud Storage**, while analyses and chat histories are saved to **Firestore**, creating a persistent and organized repository for users.

***

## 💡 How It Works (Architecture)

Specter is built on a modern, scalable architecture that leverages Google Cloud's powerful AI services. The workflow is orchestrated between a Next.js frontend and a FastAPI backend, both hosted on **Cloud Run**.

1. **Authentication & Upload**: The user logs in via Google Auth and uploads a legal document (e.g., PDF) through the **Next.js** frontend.  
2. **Backend Ingestion**: The **FastAPI** backend receives the file and securely stores the raw document in **Google Cloud Storage**.  
3. **Document Processing**: **Document AI** is triggered to perform OCR and layout extraction. It extracts the raw text along with precise bounding box coordinates for every paragraph and element.  
4. **AI Analysis & Summarization**: The extracted text is sent to **Gemini 1.5**. The model analyzes the content and generates a structured JSON output containing summaries, financial terms, identified risks, and key obligations.  
5. **Data Persistence**:  
   * The structured summary and annotation data are stored in **Firestore** for quick retrieval.  
   * For the RAG system, the document text is chunked, converted into vector embeddings using **Google's Text Embedding Model**, and indexed in **BigQuery Vector Search**.  
6. **Frontend Rendering**: The frontend retrieves the analysis from Firestore and the original document from Cloud Storage. It then renders the document and overlays the visual highlights (the "Legal X-Ray Vision") using the bounding box data. The conversational chat interface queries the BigQuery RAG system to provide contextual answers.

***

## 🛠️ Technology Stack

### Frontend
* **Core Framework**: Next.js, React  
* **UI**: Tailwind CSS, Radix UI (via shadcn/ui)  
* **Document Display**: react-pdf  
* **Animations**: GSAP  
* **Runtime**: Bun  

### Backend
* **API Framework**: FastAPI (Python)  
* **AI Orchestration**: LangChain, LangGraph  

### Google Cloud Platform & AI
* **Compute**: Cloud Run  
* **Generative AI**: Gemini 1.5 Pro & Flash  
* **Document Intelligence**: Document AI  
* **Databases**:  
  * Firestore (Application Database for summaries/chats)  
  * BigQuery with Vector Search (Vector Database for RAG)  
* **Storage**: Cloud Storage (for raw document files)  
* **AI Models**: Google's Text Embedding Model  
* **Authentication**: Google Authentication  

***

## ⚙️ Setup and Installation

To run this project locally, you will need to set up both the backend and frontend services.

### Backend Setup (`specter-backend`)

1. **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd 19doors-specter-backend
    ```
2. **Set up a Python virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3. **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4. **Set up Google Cloud Authentication**:
    Ensure you have the Google Cloud SDK installed and authenticated.
    ```bash
    gcloud auth application-default login
    ```
5. **Create a `.env` file** and add your project-specific credentials:
    ```env
    # No environment variables needed for the backend as per the provided code,
    # but ensure your gcloud CLI is configured with the correct project.
    # The project ID and processor ID are hardcoded in the source files.
    ```
6. **Run the backend server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

### Frontend Setup (`specter-frontend`)

1. **Navigate to the frontend directory**:
    ```bash
    cd ../19doors-specter-frontend
    ```
2. **Install dependencies**:
    ```bash
    bun install
    ```
3. **Set up environment variables**:
    Create a `.env.local` file in the frontend root and add the following:
    ```env
    # Turso Database for Better-Auth
    TURSO_DATABASE_URL="your-turso-db-url"
    TURSO_AUTH_TOKEN="your-turso-auth-token"

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

    # URL of your running backend
    NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
    ```
4. **Run the frontend development server**:
    ```bash
    bun dev
    ```
    The application will be available at `http://localhost:3000`.

***

## 👥 Team

This project was created by **Team Arrow** for the Google Gen AI Hackathon.  
* **Team Leader**: Sakaar Srivastava  
