# FireStation Hub Security Specification

## Data Invariants
1. A **User** must have a unique UID matching their auth record.
2. A **ShiftRecord** must belong to an existing User and have a valid status.
3. An **Incident** must have a timestamp and status. Only authorized staff can close an incident.
4. An **InventoryItem** cannot have negative quantity.
5. A **RentalReservation** must not overlap in time (though rules can only check one record at a time, we'll validate the payload structure).
6. **FinancialTransactions** are immutable once recorded, except potentially by admins.

## The "Dirty Dozen" Payloads
1. **Id Poisoning**: Attempting to create a user with a 1MB string as UID.
2. **Identity Spoofing**: User A trying to update User B's profile.
3. **Role Escalation**: Normal user trying to set their role to 'admin'.
4. **State Shortcutting**: Closing an incident without the required fields.
5. **Supply Theft**: Setting inventory quantity to -100.
6. **Shadow Update**: Adding a field like `isVerified: true` to a profile.
7. **Orphaned Writes**: Creating a shift for a non-existent user.
8. **Illegal Deletion**: A firefighter trying to delete a closed incident report.
9. **Financial Tampering**: Changing the amount of a past income transaction.
10. **PII Leak**: A non-auth user trying to list all user emails.
11. **Timestamp Spoofing**: Providing a client-side date for `updatedAt`.
12. **Batch Inconsistency**: Updating a rental but not adding the corresponding financial transaction.

## Test Runner (Draft)
The `firestore.rules.test.ts` would verify these scenarios.

---
Next: Drafting rules.
