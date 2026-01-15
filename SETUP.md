# Setup Instructions

## For GitHub Pages (Static Hosting)

When hosting on GitHub Pages, the admin panel requires a backend server which isn't available. Use these instructions to manually update your content:

### Resume (1 file)
1. Navigate to the `uploads/` folder in your GitHub repository
2. Upload your resume as `resume.pdf`
3. The resume will automatically appear in the Introduction section

### Articles & Projects (up to 100 files)

You can use either local PDF files or Google Drive/Docs links for your projects.

#### Option 1: Local PDF Files
1. **Upload PDF files** to the `uploads/` folder
   - Name them: `project-001.pdf`, `project-002.pdf`, etc.
2. **Edit `content.json`** in the root directory
3. Add your project to the `projects` array with the `file` field:

```json
{
  "id": 4,
  "title": "Your Project Title",
  "description": "Brief description of the project",
  "file": "project-004.pdf",
  "dateAdded": "2026-01-15T00:00:00Z",
  "dateUpdated": "2026-01-15T00:00:00Z"
}
```

#### Option 2: Google Drive/Docs Links (Recommended for large files)
1. Upload your document to Google Drive or create a Google Doc
2. Click "Share" and set permissions to "Anyone with the link can view"
3. Copy the shareable link
4. **Edit `content.json`** in the root directory
5. Add your project to the `projects` array with the `driveLink` field:

```json
{
  "id": 5,
  "title": "Your Google Doc Project",
  "description": "Brief description of the project",
  "driveLink": "https://docs.google.com/document/d/YOUR_DOC_ID/edit?usp=sharing",
  "dateAdded": "2026-01-15T00:00:00Z",
  "dateUpdated": "2026-01-15T00:00:00Z"
}
```

**Note:** You can mix both local files and Google Drive links in your projects. If a project has both `file` and `driveLink`, the `driveLink` will be used.

**Benefits of Google Drive/Docs:**
- No file size limits (GitHub has limits on file uploads)
- Easy to update content (just edit the Google Doc)
- Supports both Google Docs and Google Drive PDF files

### Ordering Projects
Projects are sorted by `dateUpdated` (most recent first). To reorder:
- Set a more recent `dateUpdated` date to move a project to the front
- Example: `"dateUpdated": "2026-12-31T00:00:00Z"` will appear first

### Editing Section Titles
Edit the `intro` and `sections` objects in `content.json` to change titles and descriptions.

---

## For Replit (With Backend Server)

### Installation
1. `npm install` - Install all dependencies
2. `npm start` - Start the server on port 5000

### Default Admin Credentials
- **Password**: `Websiteadmin12`
- **Admin URL**: `http://localhost:5000/admin.html`

### Change Admin Password
Set the `ADMIN_PASSWORD` environment variable:
```bash
export ADMIN_PASSWORD="your-new-password"
npm start
```

### Using the Admin Panel
1. Click the **⚙️ Admin** button in the top navigation
2. Enter the admin password (`Websiteadmin12` by default)
3. Edit any section title or description
4. Upload resume and project PDFs
5. Click "Save" to update content in real-time

---

## Features
- ✨ Frutiger Aero design with smooth animations
- 🔐 Admin authentication with JWT tokens (Replit only)
- 📝 Editable content stored in `content.json`
- 🎨 Pixel art 16x16 editor
- 📊 Investment utility links
- 📱 Fully responsive design (mobile-friendly)
- 📄 PDF viewer with expand functionality

## Content Limits
- **Resume**: 1 file only (`resume.pdf`)
- **Projects**: Up to 100 entries
- **Recommended file size**: Under 10MB per PDF

## Environment Variables (Replit/Backend Only)
- `JWT_SECRET` - Change JWT signing key (default: unsafe, change in production)
- `ADMIN_PASSWORD` - Set admin password (default: Websiteadmin12)
- `PORT` - Server port (default: 5000)
