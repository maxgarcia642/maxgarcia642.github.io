# Uploads Folder

This folder contains your uploaded content files for the portfolio.

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

### Step 1: Upload Files
1. Navigate to this `uploads/` folder in your GitHub repository
2. Click "Add file" → "Upload files"
3. Drag and drop your PDF files
4. Commit the changes

### Step 2: Update content.json
1. Go back to the root of your repository
2. Open `content.json`
3. Click the pencil icon to edit

#### For Resume:
- The `resumeFile` field should be set to `"resume.pdf"`
- Simply upload your resume as `resume.pdf` to this folder

#### For Projects:
- Add or edit entries in the `projects` array
- Each project needs:
  - `id`: Unique number (1-100)
  - `title`: Your project title
  - `description`: Brief description
  - `file`: Filename (e.g., `"project-001.pdf"`)
  - `dateAdded`: When first added (ISO format: `"2026-01-11T00:00:00Z"`)
  - `dateUpdated`: When last updated (ISO format)

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
