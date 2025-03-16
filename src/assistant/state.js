class SummaryState {
  constructor(values = {}) {
    this.research_topic = values.research_topic || '';
    this.search_query = values.search_query || '';
    this.running_summary = values.running_summary || '';
    this.sources_gathered = values.sources_gathered || [];
    this.web_research_results = values.web_research_results || [];
    this.research_loop_count = values.research_loop_count || 0;
  }
}

class SummaryStateInput {
  constructor(values = {}) {
    this.research_topic = values.research_topic || '';
  }
}

class SummaryStateOutput {
  constructor(values = {}) {
    this.running_summary = values.running_summary || '';
  }
}

module.exports = { SummaryState, SummaryStateInput, SummaryStateOutput };
