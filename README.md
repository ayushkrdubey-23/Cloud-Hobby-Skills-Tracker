# Cloud Hobby & Skills Tracker

A cloud-based full-stack web application for tracking hobbies, skills, practice sessions, goals, milestones, and community sharing.

## Project Overview

The **Cloud Hobby & Skills Tracker** helps users organize their learning and hobby activities in one place. Users can create a profile, add skills, record practice sessions, set goals, track milestones, and share progress with a community.

This project was developed as a **Cloud Computing course project** using React and Firebase cloud services.

## Key Features

- Firebase Authentication
- User profile management
- Profile image upload
- Skill tracking
- Practice session tracking
- Goal creation and progress tracking
- Automatic goal milestones
- Dashboard statistics
- Community sharing
- Post likes
- Comments
- Community post image upload
- Firestore authentication and authorization rules
- Firebase cloud database and storage integration
- Responsive navigation and user-friendly interface

## Technology Stack

### Frontend
- React
- Vite
- React Router
- JavaScript
- CSS

### Cloud Services
- Firebase Authentication
- Cloud Firestore
- Firebase Storage

### Development Tools
- VS Code
- Git
- GitHub
- npm

## Cloud Computing Concepts Demonstrated

- Cloud-based authentication
- Cloud database
- Cloud object/file storage
- Client-server architecture
- Serverless backend services
- Authentication and authorization
- Access control through security rules
- Cloud-hosted application architecture
- Document-based cloud data storage

## Application Modules

### Authentication
Users can register and log in using Firebase Authentication.

### Profile
Users can maintain name, username, bio, interests, and a profile image.

### Skills
Users can add and manage the skills or hobbies they are learning.

### Practice
Users can record practice sessions and track total practice time.

### Goals and Milestones
Users can create goals for skills. The application creates progress milestones and calculates progress from practice time.

### Dashboard
The dashboard provides an overview of total skills, practice hours, goals, completed goals, achieved milestones, and average goal progress.

### Community
Authenticated users can create posts, add images, like posts, comment, and delete their own content.

## Firebase Data Structure

```text
users
skills
practiceSessions
goals
milestones
communityPosts
```

Community comments use:

```text
communityPosts/{postId}/comments
```

## Project Structure

```text
Cloud-Hobby-Skills-Tracker/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── Navigation.jsx
│   ├── pages/
│   │   ├── Community.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Goals.jsx
│   │   ├── Login.jsx
│   │   ├── Practice.jsx
│   │   ├── Profile.jsx
│   │   ├── Register.jsx
│   │   └── Skills.jsx
│   ├── services/
│   │   ├── authService.js
│   │   └── firestoreService.js
│   ├── App.jsx
│   ├── App.css
│   ├── firebase.js
│   ├── index.css
│   └── main.jsx
├── Screenshot/
├── docs/
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

## Local Setup

### 1. Clone

```bash
git clone https://github.com/ayushkrdubey-23/Cloud-Hobby-Skills-Tracker.git
cd Cloud-Hobby-Skills-Tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create `.env` in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Do not upload `.env` to GitHub.**

### 4. Run

```bash
npm run dev
```

Open the local URL shown by Vite, normally `http://localhost:5173`.

## Security

The MVP includes Firestore rules requiring authentication and ownership checks for private user data. Community content is available to authenticated users while users can modify only their own posts/comments.

Before production deployment, Firebase Storage rules should also be reviewed and configured.

See `docs/SECURITY.md`.

## Screenshots

Project screenshots are stored in `Screenshot/`.

## Future Enhancements

- Firebase Storage security rule refinement
- Follows/followers
- Notifications and reminders
- Advanced analytics
- Search and filtering
- Goal deadlines
- Cloud Functions
- REST API layer
- Automated testing
- CI/CD
- Production hosting
- Monitoring and logging
- Backup and recovery
- Improved mobile UI
- Progressive Web App support

These are intentionally left for future development so the current MVP remains stable and demonstrable.

## Limitations

- This is a course-level MVP.
- The application uses Firebase client-side services instead of a separate custom backend API.
- Advanced notifications and automation are not included.
- Production-scale monitoring and disaster recovery are future enhancements.

## Learning Outcomes

This project provided practical experience with React, Firebase Authentication, Firestore CRUD operations, Firebase Storage, cloud security rules, authorization, file uploads, community features, Git, GitHub, and cloud application architecture.

## Author

**Ayush Kumar Dubey**

Cloud Computing Project

GitHub: https://github.com/ayushkrdubey-23/Cloud-Hobby-Skills-Tracker

## Guidance

Special thanks to **Mr. Umesh Yadav, Founder, IIP**, for guidance and support through the learning/project development process in collaboration with **eDC IIT Delhi**.

## License

This project is created for educational and academic purposes.
