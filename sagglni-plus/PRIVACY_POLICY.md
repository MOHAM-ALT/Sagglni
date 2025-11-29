Privacy Policy for Sagglni Plus
=================================

Last updated: November 29, 2025

Overview
--------
Sagglni Plus is a client-side Chrome extension designed to assist users with auto-filling web forms. Privacy is a core principle: all personal data is processed and stored locally in your browser's extension storage. The extension does not transmit your personal profile data to remote servers by default.

Data Collection & Storage
-------------------------
- Profiles and personal information are stored locally in your Chrome `storage.local` area. This data is accessible only to the extension and the browser profile that installed it.
- The extension collects metadata about analyzed forms only as local, transient data necessary to provide timely analysis and auto-fill features.

AI Usage
--------
- If you enable AI features, Sagglni Plus will make calls only to local LLM endpoints (Ollama or LM Studio) on your machine. AI requests are not sent to any public or vendor cloud unless you explicitly run a non-local service.
- The extension requires explicit opt-in for AI usage. AI analysis will never fire without the user's explicit consent in settings.

Analytics & Tracking
--------------------
- Sagglni Plus does not collect telemetry or usage analytics by default. Optional analytics or error reporting can be added only with clear consent and an explicit opt-in.

Third-Party Services
--------------------
- Sagglni Plus works with external local services you run (Ollama, LM Studio). The extension itself does not transmit your profile data to third-party servers unless you explicitly configure a remote AI API.

Data Deletion
-------------
- Users can delete all stored profiles and settings from the extension's Settings page. Deleting profiles will remove them from `chrome.storage.local` where they are persisted.

Security
--------
- Data stored in Chrome is sandboxed to the user profile and protected by the browser.
- Use a secure local environment for AI backends and follow the security guidelines of your chosen LLM provider.

Legal & Compliance
------------------
- This extension is designed to store data locally to allow compliance with privacy laws (e.g., GDPR). Users can export and delete data as required.
- If you are using Sagglni Plus in a regulated environment, consult your organization's policies.

Reporting Issues
----------------
Report security or privacy issues by opening an issue in the GitHub repository or contacting the author.

Contact
-------
Mohammed Al-Qahtani
GitHub: https://github.com/MOHAM-ALT/Sagglni
