# Import the Dedalus SDK
from dedalus_labs import AsyncDedalus, DedalusRunner

# Initialize the async client
client = AsyncDedalus()

# Create a runner for agent execution
runner = DedalusRunner(client)

# Use multiple models - Dedalus routes intelligently
response = await runner.run(
    # input: user's prompt (use messages for multi-turn)
    input="Analyze this codebase and suggest improvements",
    # model: pass a list for handoffs between models
    model=["anthropic/claude-sonnet-4", "openai/gpt-4.1"],
    # mcp_servers: MCP server IDs or URLs (from marketplace)
    mcp_servers=["@issac/fetch-mcp"],
    # instructions: custom system instructions
    instructions="You are a code review assistant.",
    # max_steps: maximum LLM calls during the run
    max_steps=10,
    stream=True,
)

# Access the analysis results (or consume stream)
print(response.final_output)