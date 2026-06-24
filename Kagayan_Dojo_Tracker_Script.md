# Kagay-an Martial Arts School — Dojo Tracker
## Presentation Script

---

## OPENING

"This is the **Kagay-an Martial Arts School Dojo Tracker** — a custom mobile and web application built exclusively for our dojo. It's designed to replace manual record-keeping with a clean, organized digital system that works for both instructors and students."

---

## PURPOSE

"The goal of this app is simple: **give our sensei, senpai, and coaches full visibility over the dojo in one place**, while also giving each player a personal portal to see their own progress.

Before this app, attendance was tracked manually, player records were scattered, and there was no easy way to notify everyone about announcements or upcoming events. This app solves all of that."

---

## WHO IT'S FOR

"There are **two types of users** in the app:

- **Instructors** — Sensei, Senpai, and Coaches. They have full access to manage everything.
- **Players** — Each student has their own personal login to view their own profile and activity."

---

## FEATURES

### 1. Dual Portal Login
"The login screen lets you switch between Instructor and Player mode. Instructors log in with their dojo credentials. Players log in with their personal accounts created by the instructor."

### 2. Player Profiles
"Each player has an ESPN-style profile card showing:
- Full name and profile photo
- Belt rank, age, weight, and height
- Year they started training
- Membership status — Active Member, Alumni, or Inactive

It's like a martial arts trading card for every student."

### 3. Attendance Tracking
"Instructors can time students in and out of each session with a single tap. The app automatically marks attendance as **Present** or **Late** based on the time, and keeps a full history per player. The Dashboard shows today's attendance at a glance alongside a weekly summary."

### 4. Staff Attendance
"Coaches and instructors can also log their own attendance, so the dojo has a complete record of who was present on any given day — not just the students."

### 5. Achievements
"Each player's profile includes an achievements section. Instructors can add trophies, medals, and competition results with the date and description. This builds each player's martial arts résumé right inside the app."

### 6. Birthday Notifications
"The app automatically detects when today is a player's or staff member's birthday and shows a birthday banner on both the Dashboard and the Player Portal. No more forgetting to greet your teammates."

### 7. Announcements
"Instructors can post announcements with categories like General, Event, Schedule Change, or Emergency. These appear in the Players' News tab so everyone stays informed — no group chats needed."

### 8. PDF Export
"From the dashboard, instructors can export a full PDF attendance report and share it directly — via email, messaging apps, or save it to files. Useful for record-keeping and submitting reports."

### 9. Player Portal
"When a student logs in, they see their own personal portal — their profile stats, their attendance history, their achievements, and the latest announcements. Read-only, clean, and focused entirely on them."

---

## TECHNICAL OVERVIEW

### Frontend
"The app is built with **Expo and React Native**, which means a single codebase runs on both **Android, iOS, and the web browser** — no need to build three separate apps.

We use **Expo Router** for navigation, which works like a file-based routing system similar to Next.js but for mobile. The UI is built with React Native components styled to match our dojo's color scheme — dark navy navigation, red primary actions, and clean white cards.

Additional libraries used:
- **React Native Reanimated** for smooth animations
- **Expo Image Picker** for uploading player profile photos
- **expo-print and expo-sharing** for PDF generation and export
- **Inter** font via Expo Google Fonts for clean, professional typography
- **TypeScript** throughout for type safety and reliability"

### Backend
"The backend is a **REST API built with Express 5** running on **Node.js 24**, written entirely in TypeScript. It handles all data operations, serves the API endpoints, and is bundled with **esbuild** for fast production builds.

We use **Pino** as the logger — a high-performance structured logger that keeps server logs clean and queryable. The API is contract-first: routes are defined in an **OpenAPI specification**, and client hooks and Zod schemas are auto-generated from it using Orval, so the frontend and backend always stay in sync."

### Database
"The database is **PostgreSQL**, hosted and managed through **Supabase**. We use **Drizzle ORM** to write type-safe database queries in TypeScript — it's lightweight, fast, and gives us full control over the schema without the overhead of heavier ORMs.

**Zod** is used for data validation on both the server and client side, ensuring that data is always the right shape before it's stored or displayed.

For offline resilience and canvas preview support, the app also uses **AsyncStorage** (the React Native equivalent of localStorage) to cache data locally on the device — so the app still loads and shows content even when storage is temporarily unavailable."

### Project Structure
"Everything lives in a **pnpm monorepo** — a single repository with multiple packages:
- `artifacts/mobile` — the Expo app
- `artifacts/api-server` — the Express backend
- `lib/db` — the shared Drizzle database schema
- `lib/api-spec` — the OpenAPI contract and generated client hooks

This structure keeps the codebase organized, avoids duplication, and makes it easy to deploy each piece independently."

---

## CLOSING

"In summary, the Kagay-an Dojo Tracker is a **full-stack, cross-platform application** purpose-built for our martial arts school. It handles everything from daily attendance to player achievements, birthday recognition, and dojo-wide announcements — all in one secure, login-protected app that works on any device.

It's currently deployed and accessible to our dojo members, and can be installed on any phone by simply visiting the link and tapping 'Add to Home Screen.'"

---

*End of script.*
