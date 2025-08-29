# 🚀 API-Based RAG System Setup Guide

This guide will help you set up the new API-based RAG system using Cohere, Groq, and ChromaDB.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- API keys for the services (see below)

## 🔑 Required API Keys

### 1. Cohere AI (Embeddings)
- **Service**: [Cohere AI](https://cohere.ai/)
- **Purpose**: Generate high-quality text embeddings
- **Cost**: Free tier available (100 requests/month)
- **Setup**:
  1. Sign up at [cohere.ai](https://cohere.ai/)
  2. Go to API Keys section
  3. Create a new API key
  4. Copy the key

### 2. Groq AI (LLM)
- **Service**: [Groq AI](https://groq.com/)
- **Purpose**: Generate AI responses using fast LLMs
- **Cost**: Very affordable ($0.05 per 1M tokens)
- **Setup**:
  1. Sign up at [groq.com](https://groq.com/)
  2. Go to API Keys section
  3. Create a new API key
  4. Copy the key

### 3. ChromaDB (Vector Database)
- **Service**: Local ChromaDB server
- **Purpose**: Store and search vector embeddings
- **Cost**: Free (self-hosted)
- **Setup**: See ChromaDB setup section below

## 🛠️ Installation Steps

### Step 1: Install Dependencies
```bash
npm install cohere-ai groq-sdk chromadb
```

### Step 2: Set Environment Variables
Create a `.env` file in your project root:

```env
# Existing Firebase config
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Generative AI (existing)
VITE_GOOGLE_API_KEY=your_google_api_key_here

# New API keys for RAG system
VITE_COHERE_API_KEY=your_cohere_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# ChromaDB configuration
VITE_CHROMADB_HOST=http://localhost:8000
```

### Step 3: Setup ChromaDB

#### Option A: Docker (Recommended)
```bash
# Pull and run ChromaDB
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma

# Verify it's running
curl http://localhost:8000/api/v1/heartbeat
```

#### Option B: Python (Alternative)
```bash
# Install Python 3.8+
pip install chromadb
chroma run --host localhost --port 8000
```

### Step 4: Verify Installation
1. Start your development server: `npm run dev`
2. Navigate to `/rag-api` in your browser
3. Check console for connection status

## 🔧 Configuration

### Cohere Embedding Models
The system uses `embed-english-v3.0` by default. You can change this in `src/lib/rag/embedCohere.ts`:

```typescript
export const DEFAULT_EMBEDDING_OPTIONS: EmbeddingOptions = {
  modelName: 'embed-english-v3.0', // Change this if needed
  inputType: 'search_document'
};
```

### Groq LLM Models
Available models in `src/lib/rag/llmGroq.ts`:

```typescript
export const DEFAULT_LLM_OPTIONS: LLMOptions = {
  model: 'llama3-8b-8192', // Fast and efficient
  temperature: 0.1,         // Low for consistent answers
  maxTokens: 1000           // Adjust based on needs
};
```

Other available models:
- `llama3-8b-8192` - Fast, 8B parameters
- `llama3-70b-8192` - Slower, 70B parameters (better quality)
- `mixtral-8x7b-32768` - Good balance of speed/quality

## 🚀 Usage

### 1. Upload Textbooks
- Navigate to `/rag-api`
- Click "Upload Textbook" tab
- Select a PDF file
- Choose subject and title
- Click "Process Textbook"

### 2. Chat with Textbooks
- Go to "Chat" tab
- Ask questions about your uploaded content
- Get AI-powered answers with source citations

### 3. Manage Knowledge Base
- Go to "Knowledge Base" tab
- View all uploaded textbooks
- Delete books if needed

## 🔍 How It Works

1. **PDF Processing**: PDFs are parsed into text chunks
2. **Embedding Generation**: Cohere API creates vector embeddings for each chunk
3. **Vector Storage**: Embeddings are stored in ChromaDB
4. **Query Processing**: 
   - Question is embedded using Cohere
   - ChromaDB finds similar chunks
   - Groq LLM generates answer from relevant chunks
5. **Response**: Answer with source citations is returned

## 💰 Cost Estimation

### Cohere (Embeddings)
- **Free Tier**: 100 requests/month
- **Paid**: $0.10 per 1M tokens
- **Typical Textbook**: ~2,000 chunks = $0.002 per book

### Groq (LLM)
- **Cost**: $0.05 per 1M tokens
- **Typical Query**: ~500 tokens = $0.000025 per question
- **100 Questions**: ~$0.0025

### Total Cost
- **1 Textbook + 100 Questions**: ~$0.005
- **10 Textbooks + 1000 Questions**: ~$0.05

## 🐛 Troubleshooting

### Common Issues

1. **ChromaDB Connection Failed**
   ```bash
   # Check if ChromaDB is running
   curl http://localhost:8000/api/v1/heartbeat
   
   # Restart ChromaDB
   docker restart <container_id>
   ```

2. **API Key Errors**
   - Verify keys are in `.env` file
   - Check key permissions in service dashboards
   - Ensure keys start with correct prefix

3. **CORS Issues**
   - ChromaDB should be accessible from your frontend
   - Check browser console for CORS errors

4. **Rate Limiting**
   - Cohere: 100 requests/minute on free tier
   - Groq: 500 requests/minute on free tier

### Debug Mode
Enable detailed logging by checking browser console. All API calls are logged with emojis for easy identification.

## 🔄 Migration from Local System

If you're migrating from the local transformers.js system:

1. **Keep both systems**: `/rag` (local) and `/rag-api` (new)
2. **Test with small PDFs first**
3. **Compare quality and speed**
4. **Gradually migrate to API system**

## 📚 Next Steps

1. **Test with a small textbook** (10-20 pages)
2. **Monitor API usage** in service dashboards
3. **Adjust model parameters** based on your needs
4. **Scale up** with larger textbooks

## 🆘 Support

- **Cohere**: [docs.cohere.ai](https://docs.cohere.ai/)
- **Groq**: [docs.groq.com](https://docs.groq.com/)
- **ChromaDB**: [docs.trychroma.com](https://docs.trychroma.com/)

## 🎯 Benefits of API System

✅ **Reliable**: No local model loading issues  
✅ **Fast**: Optimized cloud infrastructure  
✅ **Scalable**: Handle large textbooks easily  
✅ **Cost-effective**: Pay per use, very affordable  
✅ **Maintained**: Regular model updates and improvements  
✅ **No Setup**: No local GPU/ML requirements  

---

**Ready to get started?** Follow the steps above and you'll have a powerful RAG system running in minutes! 🚀
