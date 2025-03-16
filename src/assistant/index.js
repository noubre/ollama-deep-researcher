const { graph } = require('./graph');
const { Configuration } = require('./configuration');

async function runResearch(topic, config = {}) {
  const configuration = new Configuration(config);
  
  const initialState = {
    research_topic: topic,
    search_query: '',
    running_summary: '',
    sources_gathered: [],
    web_research_results: [],
    research_loop_count: 0
  };

  try {
    const result = await graph.invoke(initialState);
    return result.running_summary;
  } catch (error) {
    console.error("Error in research:", error);
    return `Failed to complete research on "${topic}". Error: ${error.message}`;
  }
}

module.exports = { runResearch };
