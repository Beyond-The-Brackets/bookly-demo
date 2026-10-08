# Security

## ⚠️ Intentionally vulnerable demo app — do not deploy

Bookly is the demo application used by [Grace](https://agent-grace.com) during onboarding. It is
**vulnerable on purpose**: problems were planted in the code so that a Grace audit has real issues
to report and a fix to replay. They are not bugs to report, and this app must never be deployed or
exposed to the internet.

- No credential in this repository works against a real service, and all seed data is fictitious.
  Secret scanners (GitHub push protection, gitleaks, …) may still flag it: that is expected here.

## Reporting a problem in Grace itself

This repository is not a security target. To report a vulnerability in Grace itself, contact the
Grace team through https://agent-grace.com.
