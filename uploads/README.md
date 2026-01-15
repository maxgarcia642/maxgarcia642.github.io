# Uploads Folder

This folder contains your uploaded content files for the portfolio.

**Alternative:** You can also use Google Drive/Docs links instead of uploading files. See the "Using Google Drive/Docs Links" section below.

## File Structure

### Resume
- **File**: `resume.pdf`
- **Limit**: 1 file only
- **How to update**: Replace `resume.pdf` with your new resume file (keep the same filename)

### Projects (Articles & Projects Section)
- **Files**: `project-001.pdf`, `project-002.pdf`, etc.
- **Limit**: Up to 100 projects
- **Naming convention**: Use `project-XXX.pdf` format where XXX is a 3-digit number (001-100)

## How to Add/Update Content

### Option 1: Upload Files to This Folder

#### Step 1: Upload Files
1. Navigate to this `uploads/` folder in your GitHub repository
2. Click "Add file" → "Upload files"
3. Drag and drop your PDF files
4. Commit the changes

### Step 2: Update content.json
1. Go back to the root of your repository
2. Open `content.json`
3. Click the pencil icon to edit

#### For Resume:
- The `resumeFile` field should be set to `"resume.pdf"` or your actual resume filename
- Simply upload your resume to this folder

#### For Projects (using local files):
- Add or edit entries in the `projects` array
- Each project needs:
  - `id`: Unique number (1-100)
  - `title`: Your project title
  - `description`: Brief description
  - `file`: Filename (e.g., `"project-001.pdf"`)
  - `dateAdded`: When first added (ISO format: `"2026-01-11T00:00:00Z"`)
  - `dateUpdated`: When last updated (ISO format)

### Option 2: Using Google Drive/Docs Links (Recommended)

**Benefits:**
- **No file size limits** - GitHub has upload size restrictions, but Google Drive doesn't
- **Easier updates** - Edit your Google Doc directly without re-uploading
- **Works with Google Docs and Google Drive PDFs**

#### How to Use Google Drive/Docs Links:

1. **Create or upload your document to Google Drive**
2. **Share the document:**
   - Click the "Share" button
   - Change permissions to "Anyone with the link can view"
   - Copy the shareable link
3. **Update content.json:**
   - Instead of using the `file` field, use `driveLink`
   - Example:

```json
{
  "id": 4,
  "title": "My Google Doc Project",
  "description": "A project hosted on Google Docs",
  "driveLink": "https://docs.google.com/document/d/YOUR_DOC_ID/edit?usp=sharing",
  "dateAdded": "2026-01-15T00:00:00Z",
  "dateUpdated": "2026-01-15T00:00:00Z"
}
```

**Note:** The link will automatically be converted to a preview format for embedding.

### Mixing Local Files and Google Drive Links

You can use both methods in your portfolio:
- Some projects can use local PDF files (`file` field)
- Others can use Google Drive/Docs links (`driveLink` field)
- If a project has both, `driveLink` takes priority

### Example Project Entry:
```json
{
  "id": 4,
  "title": "My Research Paper on AI",
  "description": "An analysis of machine learning applications in finance.",
  "file": "project-004.pdf",
  "dateAdded": "2026-01-15T00:00:00Z",
  "dateUpdated": "2026-01-15T00:00:00Z"
}
```

## Ordering
Projects are automatically sorted by `dateUpdated` (most recent first). To change the order:
1. Update the `dateUpdated` field to move a project up
2. Use more recent dates for projects you want to appear first

## Tips
- Keep filenames simple (no spaces, use hyphens)
- Use lowercase filenames for consistency
- PDF files work best for the preview feature
- Maximum recommended file size: 10MB per file
