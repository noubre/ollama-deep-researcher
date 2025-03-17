# Ollama Deep Researcher

A powerful web-based research assistant built with Node.js that leverages Ollama LLM to generate intelligent search queries and fetch comprehensive results from popular search APIs (Tavily, Perplexity, or DuckDuckGo).

## ✨ Features

- **Intelligent Query Generation** - Uses Ollama LLM to create optimized search queries
- **Multiple Search APIs** - Supports Tavily, Perplexity, and DuckDuckGo
- **Iterative Research** - Refines searches and builds a comprehensive summary
- **Simple CLI Interface** - Easy to use from command line

## 🚀 Quickstart

### Prerequisites
1. Install Node.js (v18+): [nodejs.org](https://nodejs.org)
2. Install Ollama: [ollama.com](https://ollama.com)
3. Pull the required model: `ollama pull deepseek-r1:8b`

### Setup
```bash
git clone https://github.com/noubre/ollama-deep-researcher.git
cd ollama-deep-researcher
npm install
cp .env.example .env
```

Edit `.env` with your settings:
- Choose a search API
- Add API keys if using Tavily or Perplexity

### Run
```bash
npm start "Your research topic"
```
Or directly:
```bash
node src/cli.js "Your research topic"
```

## ⚙️ Configuration

| Environment Variable | Description | Options |
|----------------------|-------------|---------|
| `SEARCH_API` | The search API to use | `tavily`, `perplexity`, `duckduckgo` |
| `TAVILY_API_KEY` | API key for Tavily | Required if using Tavily |
| `PERPLEXITY_API_KEY` | API key for Perplexity | Required if using Perplexity |
| `OLLAMA_BASE_URL` | URL for Ollama API | Default: `http://localhost:11434` |
| `OLLAMA_MODEL` | Model to use | Default: `deepseek-r1:8b` |

## 🏗️ Architecture

The application follows a modular architecture:

- **src/cli.js**: Command line interface
- **src/assistant/**: Core assistant functionality
  - **index.js**: Main entry point for the assistant
  - **graph.js**: Research workflow using LangGraph
  - **configuration.js**: Environment configuration
  - **prompts.js**: LLM prompt templates
  - **utils.js**: Helper functions for web searches and processing

## 🧠 How It Works

1. The research process is organized as a graph of states and actions
2. Initial topic is used to generate a specific search query via Ollama
3. Search query is used to fetch results from the configured search API
4. Results are processed and summarized
5. The process iterates, refining the research with follow-up questions
6. A final comprehensive summary is produced

## 🔧 Advanced Usage

### Custom Models

You can use different Ollama models by changing the `OLLAMA_MODEL` variable in your `.env` file.

### Debugging

For debugging issues:
```bash
node debug.js "Your research topic"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
