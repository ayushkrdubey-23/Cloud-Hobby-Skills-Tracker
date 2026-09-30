# Firestore Data Model

## users

```text
users/{userId}
```

Fields may include:
```text
name
username
bio
interests
profileImage
```

## skills

```text
skills/{skillId}
```

Fields:
```text
userId
name
description
category
createdAt
```

## practiceSessions

```text
practiceSessions/{sessionId}
```

Fields:
```text
userId
skillId
minutes
date
notes
createdAt
```

## goals

```text
goals/{goalId}
```

Fields:
```text
userId
skillId
title
targetHours
progress
createdAt
```

## milestones

```text
milestones/{milestoneId}
```

Fields:
```text
userId
goalId
targetValue
achieved
createdAt
```

## communityPosts

```text
communityPosts/{postId}
```

Fields:
```text
userId
authorEmail
title
content
imageUrl
likedBy
createdAt
```

## comments

```text
communityPosts/{postId}/comments/{commentId}
```

Fields:
```text
userId
authorEmail
text
createdAt
```

## Relationships

```text
User
 ├── Skills
 ├── Practice Sessions
 ├── Goals
 │    └── Milestones
 └── Community Posts
       └── Comments
```
