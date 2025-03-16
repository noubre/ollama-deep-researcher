const { ChatOllama } = require('@langchain/community/chat_models/ollama');
const { StateGraph, START, END } = require('@langchain/langgraph');
const { deduplicateAndFormatSources, tavilySearch, formatSources, perplexitySearch, duckduckgoSearch } = require('./utils');
const { queryWriterInstructions, summarizerInstructions, reflectionInstructions } = require('./prompts');
require('dotenv').config();

// Define node functions that work with state directly (no destructuring)
async function generateQuery(state) {
  // Log the state structure to understand what we're working with
  console.log('Generate Query State:', state);
  
  const research_topic = state.research_topic;
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  
  const llm = new ChatOllama({ baseUrl, model, temperature: 0, format: 'json' });
  const prompt = queryWriterInstructions.replace('{research_topic}', research_topic);
  
  try {
    const result = await llm.invoke([{ role: 'system', content: prompt }, { role: 'user', content: 'Generate a query:' }]);
    let query;
    try {
      query = JSON.parse(result.content);
    } catch (e) {
      console.warn("Failed to parse LLM response as JSON, using raw content");
      query = { query: result.content };
    }
    return { search_query: query.query };
  } catch (error) {
    console.error("Error generating query:", error.message);
    return { search_query: `Information about ${research_topic}` };
  }
}

async function webResearch(state) {
  console.log('Web Research State:', state);
  
  const search_query = state.search_query;
  const research_loop_count = state.research_loop_count;
  const search_api = process.env.SEARCH_API || 'duckduckgo';
  const fetch_full_page = (process.env.FETCH_FULL_PAGE || 'false').toLowerCase() === 'true';
  
  let searchResults = [];
  let searchStr = '';

  try {
    if (search_api === 'tavily') {
      searchResults = await tavilySearch(search_query, true, 3);
      searchStr = deduplicateAndFormatSources(searchResults, 1000, true);
    } else if (search_api === 'perplexity') {
      searchResults = await perplexitySearch(search_query, research_loop_count);
      searchStr = deduplicateAndFormatSources(searchResults, 1000, false);
    } else {
      searchResults = await duckduckgoSearch(search_query, 3, fetch_full_page);
      searchStr = deduplicateAndFormatSources(searchResults, 1000, true);
    }
  } catch (error) {
    console.error("Error during web research:", error.message);
    searchStr = `No results found for "${search_query}". Please try a different query.`;
    searchResults = [{ title: "No results", url: "", content: searchStr }];
  }

  return {
    sources_gathered: [...(state.sources_gathered || []), formatSources(searchResults)],
    research_loop_count: research_loop_count + 1,
    web_research_results: [...(state.web_research_results || []), searchStr]
  };
}

async function summarizeSources(state) {
  console.log('Summarize Sources State:', state);
  
  const research_topic = state.research_topic;
  const running_summary = state.running_summary;
  const web_research_results = state.web_research_results;
  
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  
  const llm = new ChatOllama({ baseUrl, model, temperature: 0 });
  const mostRecentWebResearch = web_research_results[web_research_results.length - 1];
  
  const humanMessageContent = running_summary
    ? `<User Input> \n ${research_topic} \n <User Input>\n\n<Existing Summary> \n ${running_summary} \n <Existing Summary>\n\n<New Search Results> \n ${mostRecentWebResearch} \n <New Search Results>`
    : `<User Input> \n ${research_topic} \n <User Input>\n\n<Search Results> \n ${mostRecentWebResearch} \n <Search Results>`;
  
  try {
    const result = await llm.invoke([{ role: 'system', content: summarizerInstructions }, { role: 'user', content: humanMessageContent }]);
    let runningSummary = result.content.replace(/<think>.*<\/think>/g, '');
    return { running_summary: runningSummary };
  } catch (error) {
    console.error("Error summarizing sources:", error.message);
    return { running_summary: running_summary || "Failed to generate summary." };
  }
}

async function reflectOnSummary(state) {
  console.log('Reflect On Summary State:', state);
  
  const research_topic = state.research_topic;
  const running_summary = state.running_summary;
  
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/';
  const model = process.env.OLLAMA_MODEL || 'llama3';
  
  const llm = new ChatOllama({ baseUrl, model, temperature: 0, format: 'json' });
  const prompt = reflectionInstructions.replace('{research_topic}', research_topic);
  
  try {
    const result = await llm.invoke([
      { role: 'system', content: prompt },
      { role: 'user', content: `Identify a knowledge gap based on: ${running_summary}` }
    ]);
    
    let followUpQuery;
    try {
      followUpQuery = JSON.parse(result.content);
    } catch (e) {
      console.warn("Failed to parse LLM response as JSON, using fallback query");
      followUpQuery = { follow_up_query: `More details about ${research_topic}` };
    }
    
    return { search_query: followUpQuery.follow_up_query || `Tell me more about ${research_topic}` };
  } catch (error) {
    console.error("Error reflecting on summary:", error.message);
    return { search_query: `Additional information about ${research_topic}` };
  }
}

function finalizeSummary(state) {
  console.log('Finalize Summary State:', state);
  
  const running_summary = state.running_summary;
  const sources_gathered = state.sources_gathered;
  
  const allSources = sources_gathered.join('\n');
  const finalSummary = `## Summary\n\n${running_summary}\n\n### Sources:\n${allSources}`;
  return { running_summary: finalSummary };
}

function routeResearch(state) {
  console.log('Route Research State:', state);
  
  const research_loop_count = state.research_loop_count;
  const max_loops = parseInt(process.env.MAX_WEB_RESEARCH_LOOPS || "3");
  return research_loop_count < max_loops ? "web_research" : "finalize_summary";
}

// Create a new StateGraph
const builder = new StateGraph({
  channels: {
    research_topic: {},
    search_query: {},
    running_summary: {},
    sources_gathered: { default: [] },
    web_research_results: { default: [] },
    research_loop_count: { default: 0 }
  }
});

// Add nodes
builder.addNode("generate_query", generateQuery);
builder.addNode("web_research", webResearch);
builder.addNode("summarize_sources", summarizeSources);
builder.addNode("reflect_on_summary", reflectOnSummary);
builder.addNode("finalize_summary", finalizeSummary);

// Add edges
builder.addEdge(START, "generate_query");
builder.addEdge("generate_query", "web_research");
builder.addEdge("web_research", "summarize_sources");
builder.addEdge("summarize_sources", "reflect_on_summary");
builder.addConditionalEdges("reflect_on_summary", routeResearch);
builder.addEdge("finalize_summary", END);

const graph = builder.compile();
module.exports = { graph };
