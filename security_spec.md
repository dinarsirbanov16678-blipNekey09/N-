# Security Specification for N CHAT

## 1. Data Invariants
- A `Chat` document must contain valid `participants` (UID list).
- A `Message` document must belong to a `Chat` where the `senderId` is a participant in that `Chat`.
- Only participants of a `Chat` can read `Messages` within it.
- `senderId` of a message must equal the authenticated `request.auth.uid`.

## 2. The "Dirty Dozen" Payloads (Initial 5)
1. `Create Chat` without `participants` field (Should be invalid).
2. `Add Message` to `Chat` where user is NOT in the `participants` list (Should be DENIED).
3. `Update Message` text field (Should fail for non-senders).
4. `Delete Message` in `Chat` by non-participant (Should be DENIED).
5. `Add Message` with `chatId` as a 2000-character malicious string (ID Poisoning).

## 3. The Test Runner (firestore.rules.test.ts placeholder)
(To be implemented: Use `firebase/rules-unit-testing`)
