Phase 3 - Roadmap & Planning
===================================

Overview
--------
Phase 3 will expand the AI-backed extension from "local LLM" feature polish into broader production-ready capabilities, data portability, and improved user experience. We focus on reliability, observability, E2E test coverage, and feature parity across edge cases.

Priorities  (high → low)
---------------------------
1) E2E integration with a Local LLM harness (Docker/container) + CI
   - Create a sandbox Docker image that provides a predictable minimal LLM endpoint (e.g. a small mock API or llm emulator) for testing.
   - Provide a CI job to spin up the harness and run E2E tests to validate full analyze→AI→fill→history flows.
   - Acceptance: CI runs E2E that covers extracted AI paths.

2) Production LLM integration (remote) & edge routing
   - Integrate OpenAI/ML API path (with opt-in), allow switching backend: LOCAL (Ollama/LM Studio), REMOTE (OpenAI/Anthropic), STUB (test)
   - Add encryption and local storage controls (user consent, opt-in & AI-trace redaction rules)
   - Acceptance: Remote call path exists behind a feature flag and settings UI.

3) UI/UX polishing & small features
   - Per-field accept/reject (done) + bulk 'Accept all/Reject all'
   - Field-level AI suggestions in modal (done) + action logs
   - Provide inline Undo for AI suggestions

4) Data and privacy controls
   - Audit logs with user-facing explanation for fields sent to AI
   - Add data sanitization before sending to AI backends
   - Provide clear setting toggles & retention policies for application history

5) Advanced AI features
   - Auto-suggest mapping improvements (learned mapping persistence across sessions)
   - Multi-field suggestion bundling (e.g., detect pattern: 'phone' and 'mobile' group mappings)
   - Context-aware prompt generation for AI-based transformations

6) Performance, observability, and security
   - Logs, error capturing and retry strategies
   - CI fuzz tests to validate resilience against malformed AI responses

Implementation timeline (estimate)
---------------------------------
- Sprint 1 (2 weeks): E2E harness + CI + basic remote LLM path setup
- Sprint 2 (2 weeks): Secure remote LLM integration + telemetry + QA
- Sprint 3 (1 week): UX polish, feature finish, docs

User-facing Acceptance Criteria
-------------------------------
- AI features disabled by default; opt-in required
- When AI is enabled, user sees clear consent modal & per-field activity with the option to accept/reject suggestions
- All major flows (analyze -> AI suggestions -> accept -> fill) are test-covered in CI
- History and settings reflect user's choices and can be cleared

Next Steps (Immediate)
----------------------
1) Add E2E harness for a reproducible local LLM environment (Docker + HTTP mock).
2) Add CI job and test scenario for the full path including AI analysis and per-field acceptance.
3) Make remote LLM (OpenAI) a configurable backend and gate it behind a feature flag.

Misc Notes
----------
- Ensure privacy best practices before sending any user inputs to third-party/model services: per-field redaction rules (SSN, bank numbers), and user toggles.
- Consider adding a 'Preview' step where AI suggestions highlight differences vs. original before accept.
