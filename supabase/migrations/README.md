# Database migrations

Apply SQL migrations in lexical filename order to a staging Supabase project before production:

1. `202610200001_github_integration.sql`
2. `202610200002_static_analysis.sql`
3. `202610210001_repository_evolution.sql`
4. `202610220001_production_hardening.sql`

Use the Supabase CLI's linked-project migration workflow or the SQL editor. Review the generated migration plan and back up production before applying. Do not run the disposable integration suite against a production project. This repository checkout has no linked Supabase project credentials, so the migration set has been reviewed for ordering only; no remote database application is claimed.
