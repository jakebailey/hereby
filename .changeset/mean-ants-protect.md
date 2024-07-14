---
"hereby": minor
---

Swap import-meta-resolve for plain filesystem walking; this makes startup
roughly 10-20% faster and prevents a deprecation warning in Node 22+
