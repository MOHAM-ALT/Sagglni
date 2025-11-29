LM Studio Setup for Sagglni Plus
================================

This document explains how to run a local LM Studio server for testing and E2E validation of the Sagglni Plus extension.

1) Install LM Studio
   - Follow the official LM Studio installation guide at https://github.com/LocalAI/LMStudio or the vendor-specific instructions.
   - Choose a model suitable for form analysis like small-medium text generation models (e.g., Mistral, Orca mini) or other conversational models.

2) Recommended models for form analysis
   - Lightweight models that can return JSON reliably are sufficient for many form analysis tasks.
   - We recommend trying models with prompt-completion quality for short structured outputs (non-chat modes) so the extension can parse the response easily.

3) Port configuration
   - LM Studio commonly runs on port 8000 by default.
   - For tests, set the LM_STUDIO_URL environment variable to your LM Studio instance, e.g.:
     - export LM_STUDIO_URL=http://localhost:8000
   - The background and transformer components use the configured `aiPort` and assume `http://localhost:${port}/api/generate` endpoints for LM Studio.

4) Performance tips
   - Use the `aiBatchSize` setting in the extension's popup settings to tune how many fields are sent per LLM call.
   - Use `aiOnlyLowConfidence` to skip high-confidence fields during AI analysis, reducing token usage.
   - For LM Studio, enable concise prompts (`aiConcise`) to reduce token usage and speed up responses.
   - Add models to the LM Studio that are small and optimized for JSON responses when asked directly (simple models are faster and cheaper).

5) Running E2E tests using real LM Studio
   - To run the E2E test that uses a real LM Studio instance, set the `LM_STUDIO_URL` environment variable and run:
     1) export LM_STUDIO_URL=http://localhost:8000
     2) npm test -- --runInBand --testPathPattern=tests/lm-studio-e2e.test.js

6) Troubleshooting
   - If tests fail due to unreachable LM, verify port and host.
   - If LM Studio returns unexpected formats, consider using the concise option.

7) Notes
   - These tests require a local LM Studio instance with a model that supports `POST /api/generate`.
   - The extension's prompt generation may vary with model characteristics; concise prompts are optimized for token usage.
