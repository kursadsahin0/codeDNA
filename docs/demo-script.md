# CodeDNA demo walkthrough

**Fixture:** `harbor`, a small synthetic HTTP router. The repository and its activity are illustrative fixture data, not a customer repository or production measurement.

1. Open `/workspace` and review the fixture summary, analyzed-file/module/dependency counts, highest-dependency modules, recent files, and structural notes.
2. Open **Architecture Map**. Search for `router`, filter the map to the `src` area, and select `src/router.ts`. Use the dependency detail panel to inspect its incoming and outgoing import relationships.
3. Open **Change Impact** and select `src/router.ts`. Review the bounded reverse-dependency chain, affected files, and the rule-based risk signals. Treat these as static review leads, not runtime guarantees.
4. Open **Commit History**, select a fixture commit, and inspect its changed-file summary. Compare two commits to see the stored fixture comparison; historical architecture is shown only where the fixture includes a saved snapshot.
5. Return to the map and change the detail level or clear search to restore the broader view.

No GitHub connection is needed for this walkthrough. Use **Repositories** only when demonstrating the separately configured GitHub App integration.
