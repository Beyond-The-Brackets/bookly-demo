# Security

## ⚠️ Intentionally vulnerable demo app — do not deploy

Bookly is the demo application used by [Grace](https://agent-grace.com) during onboarding. It is
**vulnerable on purpose**: problems were planted in the code so that a Grace audit has real issues
to report and a fix to replay. They are not bugs to report, and this app must never be deployed or
exposed to the internet.

- **The embedded Supabase key is fake.** The `service_role` JWT in `lib/supabase.ts` has the right
  shape (its payload says `"role": "service_role"`, `"ref": "bookly-demo"`) but is signed with a
  throwaway secret. It belongs to no Supabase project and grants access to nothing.
- Because it looks like a real key, secret scanners (GitHub push protection, gitleaks, …) may flag
  it. That is expected for this repository; do not "fix" it by deleting the history — the audit
  demo depends on it.
- All seed data is fictitious (`@example.com` addresses, made-up names and phone numbers).

The list of planted problems, with the files they live in, is in `grace/expected-findings.json`.

## Reporting a problem in Grace itself

This repository is not a security target. To report a vulnerability in Grace itself, contact the
Grace team through https://agent-grace.com.
