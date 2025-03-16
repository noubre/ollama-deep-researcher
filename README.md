# Ollama Deep Researcher

A web-based research assistant built with Node.js. It uses Ollama LLM to generate queries and fetches results from Tavily, Perplexity, or DuckDuckGo.

## 🚀 Quickstart

### Prerequisites
1. Install Node.js (v18+): [nodejs.org](https://nodejs.org)
2. Install Ollama: `ollama pull deepseek-r1:8b`

### Setup
```bash
git clone https://github.com/your-username/ollama-deep-researcher.git
cd ollama-deep-researcher
npm install
cp .env.example .env
```

Edit .env with your settings (e.g., API keys, search API).

### Run
```bash
node src/cli.js "Your research topic"
```

## Configuration

- **SEARCH_API**: tavily, perplexity, or duckduckgo.
- **API keys**: TAVILY_API_KEY, PERPLEXITY_API_KEY (required for Tavily and Perplexity).

## How It Works

1. Generates a search query using Ollama.
2. Fetches results from the configured web search API (Tavily, Perplexity, or DuckDuckGo).
3. Summarizes and refines the research iteratively.
