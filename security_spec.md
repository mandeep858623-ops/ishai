# Security Specification - SUPERAI Maps

## 1. Data Invariants
- A saved place must belong to a user and have valid coordinates.
- A trip must belong to a user and contain a list of waypoints.
- Map settings are private to the user.
- Users can only read, write, or delete their own map data.
- Timestamps must be server-generated.

## 2. The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a saved place with someone else's `user_id`.
2. **PII Leak**: Attempt to read another user's saved places.
3. **Ghost Field Injection**: Attempt to add an `isAdmin` field to a saved place.
4. **State Shortcutting**: Attempt to update a trip's `created_at` timestamp.
5. **Resource Poisoning**: Attempt to use a 1MB string as a place name.
6. **Orphaned Record**: Attempt to create a trip without a `user_id`.
7. **Coordinate Bypass**: Attempt to save a place with non-numeric coordinates.
8. **Bulk Scrape**: Attempt to list all saved places in the database without a `user_id` filter.
9. **Unauthorized Update**: Attempt to update another user's map settings.
10. **Timestamp Fraud**: Attempt to set a future `updated_at` time manually.
11. **Type Poisoning**: Attempt to set `waypoints` to a string instead of an array.
12. **ID Injection**: Attempt to use a path traversal string as a document ID.

## 3. Test Cases (Conceptual)
- `get(/databases/$(database)/documents/user_map_places/otherUser/places/placeId)` -> DENIED
- `create(/databases/$(database)/documents/user_map_places/myUser/places/placeId, {user_id: 'otherUser', ...})` -> DENIED
- `update(/databases/$(database)/documents/user_map_places/myUser/places/placeId, {isAdmin: true})` -> DENIED
