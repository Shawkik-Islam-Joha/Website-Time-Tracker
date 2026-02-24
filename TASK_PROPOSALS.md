# Task Proposals: Website-Time-Tracker

## 1) Typo Fix Task
**Title:** Fix typo in README browser compatibility note

**Problem:** The README says "chromium based"; this should be capitalized/hyphenated as "Chromium-based" for correctness and consistency.

**Where:** `README.md` compatibility note near the top.

**Definition of Done:**
- Replace "chromium based" with "Chromium-based".
- Keep the rest of the sentence unchanged.

---

## 2) Bug Fix Task
**Title:** Stop counting time for internal browser pages and restricted URLs

**Problem:** The background tracker records hostnames for any parseable URL, which can include pages like `chrome://extensions` or other non-web contexts depending on browser behavior. This can pollute statistics and produce confusing domains.

**Where:** `background.js` URL/domain extraction and the periodic tracking loop.

**Definition of Done:**
- Only track `http:` and `https:` URLs.
- Ignore unsupported schemes (e.g., `chrome:`, `about:`, `edge:`, `file:`, `view-source:`).
- Add a small guard test plan (manual or automated) showing unsupported schemes are not stored.

---

## 3) Comment/Documentation Discrepancy Task
**Title:** Fix README project structure and data example to match the actual repository

**Problem:** README references files that do not exist (e.g., `content.js`, `.gitignore`) and the JSON example block is malformed/unclosed, making the docs inaccurate.

**Where:** `README.md` "Project Structure" and "Data Structure Example" sections.

**Definition of Done:**
- Remove or correct entries that are not present in the repo.
- Ensure the JSON example is valid and code fences are properly closed.
- Verify README renders correctly in Markdown preview.

---

## 4) Test Improvement Task
**Title:** Add unit tests for time formatting and URL/domain filtering logic

**Problem:** Core logic in `popup.js` (`formatTime`) and `background.js` (`getDomain`/URL handling) has no tests, increasing regression risk.

**Where:** Add a small test setup (e.g., Node + Vitest/Jest) and extract pure functions to testable modules.

**Definition of Done:**
- Add tests for `formatTime` edge cases (`0`, `59`, `60`, `3600`, mixed values).
- Add tests proving URL filtering only accepts `http/https` and rejects restricted/invalid schemes.
- Tests run locally via a documented command.
