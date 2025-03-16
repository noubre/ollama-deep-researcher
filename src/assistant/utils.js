const axios = require('axios');
const { DDGS } = require('duckduckgo-search');
const { parse } = require('node-html-parser');

function deduplicateAndFormatSources(searchResponse, maxTokensPerSource, includeRawContent = false) {
  const sourcesList = Array.isArray(searchResponse) ? searchResponse : searchResponse.results || [];
  const uniqueSources = {};
  sourcesList.forEach(source => {
    if (!uniqueSources[source.url]) uniqueSources[source.url] = source;
  });

  let formattedText = 'Sources:\n\n';
  Object.values(uniqueSources).forEach((source, i) => {
    formattedText += `Source ${source.title}:\n===\nURL: ${source.url}\n===\nMost relevant content from source: ${source.content}\n===\n`;
    if (includeRawContent && source.raw_content) {
      const charLimit = maxTokensPerSource * 4;
      const rawContent = source.raw_content.length > charLimit ? source.raw_content.slice(0, charLimit) + '... [truncated]' : source.raw_content;
      formattedText += `Full content: ${rawContent}\n\n`;
    }
  });
  return formattedText.trim();
}

function formatSources(searchResults) {
  return (Array.isArray(searchResults) ? searchResults : searchResults.results || []).map(source => `* ${source.title} : ${source.url}`).join('\n');
}

async function duckduckgoSearch(query, maxResults = 3, fetchFullPage = false) {
  const ddgs = new DDGS();
  const searchResults = await ddgs.text(query, { max_results: maxResults });
  const results = await Promise.all(searchResults.map(async r => {
    const url = r.href, title = r.title, content = r.body;
    let rawContent = content;
    if (fetchFullPage) {
      try {
        const { data } = await axios.get(url);
        const root = parse(data);
        rawContent = root.textContent;
      } catch (e) {
        console.warn(`Failed to fetch full page for ${url}: ${e.message}`);
      }
    }
    return { title, url, content, raw_content: rawContent };
  }));
  return { results };
}

async function tavilySearch(query, includeRawContent = true, maxResults = 3) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');
  const response = await axios.post('https://api.tavily.com/search', {
    api_key: apiKey,
    query,
    max_results: maxResults,
    include_raw_content: includeRawContent
  });
  return response.data;
}

async function perplexitySearch(query, loopCount) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not set');
  const response = await axios.post('https://api.perplexity.ai/chat/completions', {
    model: 'sonar-pro',
    messages: [
      { role: 'system', content: 'Search the web and provide factual information with sources.' },
      { role: 'user', content: query }
    ]
  }, { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } });
  const content = response.data.choices[0].message.content;
  const citations = response.data.citations || ['https://perplexity.ai'];
  const results = [{
    title: `Perplexity Search ${loopCount + 1}, Source 1`,
    url: citations[0],
    content,
    raw_content: content
  }];
  citations.slice(1).forEach((citation, i) => {
    results.push({
      title: `Perplexity Search ${loopCount + 1}, Source ${i + 2}`,
      url: citation,
      content: 'See above for full content',
      raw_content: null
    });
  });
  return { results };
}

module.exports = { deduplicateAndFormatSources, formatSources, duckduckgoSearch, tavilySearch, perplexitySearch };
