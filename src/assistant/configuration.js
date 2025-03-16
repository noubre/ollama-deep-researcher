require('dotenv').config();

class SearchAPI {
  static PERPLEXITY = 'perplexity';
  static TAVILY = 'tavily';
  static DUCKDUCKGO = 'duckduckgo';
}

class Configuration {
  constructor(config = {}) {
    this.max_web_research_loops = parseInt(process.env.MAX_WEB_RESEARCH_LOOPS || config.max_web_research_loops || 3);
    this.local_llm = process.env.OLLAMA_MODEL || config.local_llm || 'llama3';
    this.search_api = process.env.SEARCH_API || config.search_api || SearchAPI.DUCKDUCKGO;
    this.fetch_full_page = (process.env.FETCH_FULL_PAGE || config.fetch_full_page || 'false').toLowerCase() === 'true';
    this.ollama_base_url = process.env.OLLAMA_BASE_URL || config.ollama_base_url || 'http://localhost:11434/';
  }

  static fromRunnableConfig(config = {}) {
    const configurable = config.configurable || {};
    return new Configuration(configurable);
  }
}

module.exports = { Configuration, SearchAPI };
