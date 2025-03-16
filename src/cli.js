const { graph } = require('./assistant/graph');

async function runResearch(topic) {
  // Initialize with the topic in the state values
  const initialState = {
    research_topic: topic,
    search_query: '',
    running_summary: '',
    sources_gathered: [],
    web_research_results: [],
    research_loop_count: 0
  };

  try {
    console.log(`Starting research on topic: "${topic}"`);
    const result = await graph.invoke(initialState);
    console.log('Final Research Output:\n', result.running_summary);
  } catch (error) {
    console.error('Error during research:', error);
  }
}

const [,, topic] = process.argv;
if (!topic) {
  console.error('Please provide a research topic. Usage: node src/cli.js "Your topic"');
  process.exit(1);
}

runResearch(topic).catch(console.error);
