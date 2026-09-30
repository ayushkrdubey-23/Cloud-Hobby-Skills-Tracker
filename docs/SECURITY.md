# Security

## Current Security Measures

### Authentication
Application functionality requires an authenticated Firebase user.

### User Ownership
Private collections such as skills, practice sessions, goals, and milestones use the authenticated user's UID for access control.

### Community Authorization
Authenticated users can view community content. Users can create content under their own UID and modify/delete their own content.

### Environment Variables
Firebase configuration is loaded from Vite environment variables. `.env` is ignored by Git.

## Production Requirement
Before production deployment, Firebase Storage security rules should be reviewed and configured for authenticated uploads, file ownership, file type restrictions, file size limits, and controlled reads.

## Future Security Improvements
- Stronger field validation
- Storage ownership rules
- Rate limiting
- Abuse reporting
- Content moderation
- Audit logging
- Monitoring
- Automated security-rule testing
