# Halal Product API Server

REST API server for the Halal Product Chatbot system.

## Installation

```bash
npm install
```

## Configuration

Make sure your `.env.local` file contains the following environment variables:

```env
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
FIREWORKS_API_KEY=your_fireworks_api_key
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX_ID=your_google_cx_id
PORT=3000
HOST=localhost
```

## Running the Server

```bash
# Start the API server
npm start

# Or use the dev script
npm run dev

# Run the CLI chatbot
npm run chatbot
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```
GET /api/health
```

Returns server health status and initialization state.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "initialized": true,
  "companiesLoaded": 1234,
  "timestamp": "2026-04-16T12:00:00.000Z"
}
```

### Get Companies
```
GET /api/companies?search=keyword
```

Returns list of all known companies. Optional `search` parameter filters results.

**Response:**
```json
{
  "success": true,
  "count": 1234,
  "companies": ["Abbott", "Nestle", "Unilever", ...]
}
```

### Get Categories
```
GET /api/categories
```

Returns list of available categories.

**Response:**
```json
{
  "success": true,
  "categories": ["Food", "Beverage", "Additive", "Cosmetic", "Pharma", "Non-food", "Service"]
}
```

### Main Query Endpoint
```
POST /api/query
Content-Type: application/json

{
  "query": "is lays chips halal?"
}
```

Main endpoint for processing user queries. Automatically classifies and routes the query.

**Response:**
```json
{
  "success": true,
  "query": "is lays chips halal?",
  "classified": {
    "type": 2,
    "company": "lays",
    "product": "chips",
    "category": null,
    "e_code": null
  },
  "resolvedCompany": "Lays",
  "resolvedCategory": null,
  "fuzzyWarning": null,
  "summary": null,
  "results": [...],
  "formatted": "...",
  "topScore": 0.923,
  "threshold": 0.85,
  "found": true,
  "notInDatabase": false,
  "webResults": null
}
```

### Search by Company
```
GET /api/search/company?company=Abbott&category=Food
```

Search for products by company name.

**Response:**
```json
{
  "success": true,
  "query": {
    "company": "Abbott",
    "category": "Food"
  },
  "results": [...],
  "count": 10
}
```

### Search by Product
```
GET /api/search/product?product=chips&category=Food&company=Lays
```

Search for products by product name, optionally filtered by category and company.

**Response:**
```json
{
  "success": true,
  "query": {
    "product": "chips",
    "category": "Food",
    "company": "Lays"
  },
  "results": [...],
  "count": 5
}
```

### Search by E-Number
```
GET /api/search/enumbers/:eCode
```

Search for E-number additives.

**Example:**
```
GET /api/search/enumbers/E471
```

**Response:**
```json
{
  "success": true,
  "query": {
    "eCode": "E471"
  },
  "results": [...],
  "count": 1
}
```

### Search by Category
```
GET /api/search/category?category=Food&hint=snacks
```

Browse products by category.

**Response:**
```json
{
  "success": true,
  "query": {
    "category": "Food",
    "hint": "snacks"
  },
  "results": [...],
  "count": 8
}
```

### Classify Query
```
POST /api/classify
Content-Type: application/json

{
  "query": "is lays chips halal?"
}
```

Classify a query without performing the search.

**Response:**
```json
{
  "success": true,
  "query": "is lays chips halal?",
  "classified": {
    "type": 2,
    "company": "lays",
    "product": "chips",
    "category": null,
    "e_code": null
  }
}
```

### Web Search
```
POST /api/websearch
Content-Type: application/json

{
  "query": "KFC halal certification"
}
```

Perform a web search for halal certification information.

**Response:**
```json
{
  "success": true,
  "query": "KFC halal certification",
  "results": "..."
}
```

### Fuzzy Company Match
```
GET /api/match/company?company=abot&threshold=0.4
```

Find the best matching company name using fuzzy matching.

**Response:**
```json
{
  "success": true,
  "query": {
    "company": "abot",
    "threshold": 0.4
  },
  "match": {
    "matched": "Abbott",
    "dist": 0.12
  }
}
```

### Resolve Category
```
GET /api/resolve/category?category=snacks
```

Resolve a category name to its canonical form.

**Response:**
```json
{
  "success": true,
  "query": {
    "category": "snacks"
  },
  "resolved": "Food"
}
```

## Query Types

The system classifies queries into the following types:

- **Type 1**: Company-only query (e.g., "is Abbott halal")
- **Type 2**: Product query with optional brand (e.g., "is lays chips halal")
- **Type 3**: E-number query (e.g., "is E471 halal")
- **Type 4**: Category browse (e.g., "show me halal snacks")
- **Type 5**: General/unclear query (e.g., "what is halal")

## Error Handling

All endpoints return JSON responses with the following structure:

**Success:**
```json
{
  "success": true,
  ...
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## CORS

The server is configured to allow CORS requests from any origin. You can modify this in `server.js` if needed.

## Development

The project structure:

```
backend/
├── server.js              # Express API server
├── chat/
│   ├── chatbot.js         # CLI chatbot
│   └── chatbotService.js  # Core service functions
├── .env.local             # Environment variables
└── package.json           # Dependencies and scripts
```

## Testing the API

You can test the API using curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3000/api/health

# Query
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "is lays chips halal?"}'

# Search by company
curl "http://localhost:3000/api/search/company?company=Abbott"

# Search by E-number
curl http://localhost:3000/api/search/enumbers/E471
```