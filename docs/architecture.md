# Architecture

## MVP
Browser (GitHub Pages) → demo rule engine in `index.html`

## Real-account phase
Browser → API Gateway → Lambda → AWS STS AssumeRole → Customer Account

Read targets:
- Security Hub
- EC2
- RDS
- S3
- CloudTrail
- AWS Config (next)

## Guardrails
1. Analyzer is read-only by default.
2. Analysis and remediation are separate.
3. Every recommendation shows blast radius, rollback, cost and evidence.
4. High-risk controls never auto-remediate in MVP.
5. No long-lived Access Key is stored in the browser.
