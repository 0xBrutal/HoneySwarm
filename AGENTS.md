# HoneySwarm Agent Rules
1. NEVER execute real shell commands. All terminal interactions are simulated.
2. NEVER expose real API keys or secrets to the frontend or LLM.
3. NEVER allow session state to leak between different visitor IDs.
4. AI classifications are hypotheses; deterministic rules govern security routing.
5. Fallback to deterministic logic if AI providers fail.
