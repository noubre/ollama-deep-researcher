const { StateGraph, START, END } = require('@langchain/langgraph');

// Debug function that logs the structure of state
function debugState({ state }) {
  console.log('State structure:', JSON.stringify(state, null, 2));
  return {};
}

// Create a simple StateGraph for debugging
const builder = new StateGraph({
  channels: {
    research_topic: { value: "test query" },
    search_query: { value: "" }
  }
});

// Add a debug node
builder.addNode("debug", debugState);
builder.addEdge(START, "debug");
builder.addEdge("debug", END);

const graph = builder.compile();

// Run the graph
async function main() {
  try {
    const initialState = {
      research_topic: "test query",
      search_query: ""
    };
    
    console.log("Initial state:", JSON.stringify(initialState, null, 2));
    const result = await graph.invoke(initialState);
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
