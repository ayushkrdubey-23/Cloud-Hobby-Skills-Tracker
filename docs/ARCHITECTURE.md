# System Architecture

```text
+-----------------------------+
|       User / Browser        |
+--------------+--------------+
               |
               v
+-----------------------------+
|      React + Vite App       |
| Login | Profile | Skills    |
| Practice | Goals | Community|
+--------------+--------------+
               |
       Firebase Web SDK
               |
       +-------+-------+
       |               |
       v               v
+-------------+   +-------------+
| Firebase    |   | Cloud       |
| Auth        |   | Firestore   |
+-------------+   +-------------+
                       |
                       v
                +-------------+
                | Firebase    |
                | Storage     |
                +-------------+
```

## Frontend
React handles the user interface, navigation, forms, client-side state, and Firebase service calls.

## Authentication
Firebase Authentication handles registration, login, and user identity.

## Firestore
Cloud Firestore stores profiles, skills, practice sessions, goals, milestones, community posts, and comments.

## Storage
Firebase Storage stores profile images and community post images.

## Authorization
Firestore security rules use the authenticated user's UID to control access.

## Architecture Style
The MVP follows a cloud-based client architecture:

```text
Client Application
        ↓
Firebase SDK
        ↓
Managed Cloud Services
```
