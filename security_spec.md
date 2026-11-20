# ClinicaPrev Firestore Security Specification (Phase 0 — Payload-First TDD)

## 1. Data Invariants & Privacy Architecture
1. **Zero End-User PII in Firestore**: Personal biometric inputs, risk scores, and saved user assessments are never written to Firestore — they stay exclusively inside the user's browser `localStorage`.
2. **Public Scientific Read, Verified Curator Write**:
   - `clinical_parameters/active`, `parameter_proposals/{proposalId}`, `parameter_revisions/{revisionId}`, and `monitoring_digests/latest` contain public, non-PII clinical reference metadata and academic literature digests. Public read (`get`/`list` where bounded) enables frictionless use without visitor authentication.
   - All mutations (`create`, `update`, `delete`) require a verified curator account (`request.auth != null && request.auth.token.email_verified == true` matching the bootstrapped curator email or `/admins/{uid}`).
3. **Mathematical Guardrails Enforced in Rules**:
   - Even a verified curator cannot write out-of-range clinical coefficients (e.g., `dailyStepsOptimalThreshold` outside `6000..10000` or `score2RegionCalibrationFactor` outside `0.75..1.05`).
4. **Immutable Audit Trail**:
   - `parameter_revisions/{revisionId}` is append-only (`allow update, delete: if false;`) and enforces server timestamp `incoming().createdAt == request.time`.
5. **Terminal State Locking on Proposals**:
   - Once a proposal reaches a terminal status (`approved`, `auto_applied`, `rejected`), non-admin updates are impossible, and even curator status transitions only allow explicit field allowlists via `affectedKeys().hasOnly(...)`.
6. **Admin Registry Isolation**:
   - `/admins/{adminUid}` is strictly denied to all client reads/writes (`allow read, write: if false;`) to prevent privilege escalation or enumeration.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Anonymous Write to Active Parameters**: Unauthenticated client attempts `setDoc('/clinical_parameters/active', validParams)`.
2. **Unverified Admin Email Spoof**: Authenticated user with `email: 'emiliano.feletti@gmail.com'` and `email_verified: false` attempts write.
3. **Non-Admin Verified User Write**: Verified third-party user (`attacker@example.com`) attempts to approve a proposal.
4. **Shadow Field Injection (Ghost Field)**: Curator writes `/clinical_parameters/active` with extra field `isBypassed: true`.
5. **Clinical Guardrail Poisoning**: Curator writes `dailyStepsOptimalThreshold: 999999` or `score2RegionCalibrationFactor: 5.0` outside safe bounds.
6. **Non-Singleton ID Poisoning**: Curator attempts to write `/clinical_parameters/../../evil` or `/clinical_parameters/arbitrary_id` (only `active` allowed).
7. **Client Timestamp Forgery**: Curator creates `/parameter_revisions/rev_1` with backdated client `createdAt` instead of `request.time`.
8. **Audit Log Tampering**: Curator attempts `update` or `delete` on `/parameter_revisions/rev_1`.
9. **Proposal URL Protocol Injection**: Curator creates `/parameter_proposals/prop_1` with `sourceUrl: "javascript:alert(1)"` (fails `^https://.*$`).
10. **Proposal Oversized Payload (DoW)**: Curator sends `rationale` with 5,000 characters (exceeds `maxLength: 700`).
11. **Digest Unbounded Array Poisoning**: Curator writes `/monitoring_digests/latest` with `publications.size() > 60`.
12. **Self-Assigned Admin Escalation**: Authenticated user attempts `create` on `/admins/{uid}` with `{ role: 'admin' }`.
