# Maximiliano Garcia - Aero Portfolio with CMS

## Overview
A fully functional Frutiger Aero style personal portfolio website with admin authentication and content management system. Users can sign in with a password to edit all website text dynamically.

## Tech Stack
- **Frontend**: HTML5, CSS3 (Frutiger Aero design), JavaScript
- **Backend**: Node.js + Express
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs password hashing
- **Data Storage**: JSON file (content.json)

## Project Structure
```
.
├── index.html              - Main portfolio website
├── admin.html              - Admin login & content editor
├── styles.css              - Frutiger Aero styling
├── script.js               - Frontend interactions
├── content-loader.js       - Load editable content from API
├── server.js               - Express backend with auth & API
├── package.json            - Dependencies
└── assets/                 - PDF files (resume, projects)
```

## Features
1. **Frutiger Aero Design** - Colorful, glossy interface with smooth animations
2. **Admin Panel** - Password-protected admin interface at `/admin.html`
3. **Editable Content** - Change section titles and descriptions in real-time
4. **Pixel Art Game** - 16x16 pixel editor built into the site
5. **Dynamic Loading** - Content loads from backend API

## Admin Login
- **Default Password**: `admin123`
- Change it via `ADMIN_PASSWORD` environment variable
- Admin panel: `/admin.html`
- Edit all section titles and descriptions

## Running the Project
```bash
npm install
npm start
```
Server runs on `http://0.0.0.0:5000`

## API Endpoints
- `GET /api/content` - Get all editable content
- `POST /api/login` - Authenticate with password
- `POST /api/logout` - Logout (requires token)
- `PUT /api/content` - Update specific content (requires auth)
- `POST /api/content/section` - Update section (requires auth)

## Sections Customizable Via Admin
- Introduction (title & description)
- Programming Works (title & description)
- Articles & Projects (title & description)
- Investment Utilities (title & description)
- Pixel Art Game (title & description)
- Connect (title & description)

## Security Notes
- Change `JWT_SECRET` in production
- Change `ADMIN_PASSWORD` via environment variables
- Never commit `content.json` with sensitive data
