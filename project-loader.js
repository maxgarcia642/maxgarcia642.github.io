// Load projects and resume dynamically
// Supports both local content.json (GitHub Pages) and Replit API fallback
document.addEventListener('DOMContentLoaded', async () => {
  const REPLIT_URL = 'https://workspace.maxgarcia642.repl.co'; 
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  let data = null;
  
  // Try to load from local content.json first (preferred for GitHub Pages)
  try {
    const localRes = await fetch('./content.json');
    if (localRes.ok) {
      data = await localRes.json();
      console.log('Loaded content from local content.json');
    }
  } catch (e) {
    console.log('Local content.json not available, trying API...');
  }
  
  // Fallback to Replit API if local content.json didn't work
  if (!data) {
    try {
      const API_URL = isGitHubPages ? REPLIT_URL + '/api' : '/api';
      const res = await fetch(`${API_URL}/content`);
      if (res.ok) {
        data = await res.json();
        console.log('Loaded content from API');
      }
    } catch (e) {
      console.log('API not available');
    }
  }
  
  // If no data loaded, use defaults
  if (!data) {
    console.log('Using default content');
    return;
  }
  
  // Determine base URL for uploads
  const BASE_URL = isGitHubPages ? '' : (data.projects ? '' : REPLIT_URL);
  
  // Load resume if available
  if (data.resumeFile) {
    const resumeFrame = document.getElementById('resumeFrame');
    const resumeDownload = document.getElementById('resumeDownload');
    const resumePath = `${BASE_URL}/uploads/${data.resumeFile}`;
    
    if (resumeFrame) {
      resumeFrame.src = resumePath;
    }
    if (resumeDownload) {
      resumeDownload.href = resumePath;
    }
  }
  
  // Load projects
  const projectTrack = document.getElementById('projectTrack');
  if (projectTrack && data.projects && data.projects.length > 0) {
    // Sort projects by dateUpdated (most recent first)
    const sortedProjects = [...data.projects].sort((a, b) => {
      const dateA = new Date(a.dateUpdated || a.dateAdded || 0);
      const dateB = new Date(b.dateUpdated || b.dateAdded || 0);
      return dateB - dateA; // Most recent first
    });
    
    // Limit to 100 projects max
    const limitedProjects = sortedProjects.slice(0, 100);
    
    projectTrack.innerHTML = '';
    
    limitedProjects.forEach((project, idx) => {
      // Skip projects without valid files or drive links
      if ((!project.file && !project.driveLink) || !project.title) return;
      
      // Prioritize driveLink over file if both exist
      let fileUrl;
      
      if (project.driveLink) {
        // Handle OneDrive links (1drv.ms format or direct onedrive.live.com links)
        if (project.driveLink.includes('1drv.ms') || project.driveLink.includes('onedrive.live.com')) {
          // Extract file ID and container ID from OneDrive URL for proper embedding
          const urlParams = new URLSearchParams(project.driveLink.split('?')[1] || '');
          const cid = urlParams.get('cid') || project.driveLink.match(/cid=([^&]+)/)?.[1];
          const fileId = urlParams.get('id') || project.driveLink.match(/id=([^&]+)/)?.[1];
          
          if (cid && fileId) {
            // Decode the file ID (replace %21 with !)
            const decodedFileId = decodeURIComponent(fileId);
            // Construct OneDrive embed URL
            // Format: https://onedrive.live.com/embed?cid=CID&resid=RESID&authkey=AUTHKEY
            // For public files, we can use the embed format without authkey
            fileUrl = `https://onedrive.live.com/embed?cid=${cid}&resid=${decodedFileId}`;
          } else {
            // Fallback: Use Office Online viewer with the direct link
            const encodedUrl = encodeURIComponent(project.driveLink);
            fileUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
          }
        }
        // Handle Google Drive/Google Docs links
        else if (project.driveLink.includes('drive.google.com') || project.driveLink.includes('docs.google.com')) {
          // Extract file ID from Google Drive/Google Docs URL
          const docIdMatch = project.driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (docIdMatch && docIdMatch[1]) {
            const fileId = docIdMatch[1];
            if (project.driveLink.includes('docs.google.com/document')) {
              // Google Docs document - use preview for full viewer interface
              fileUrl = `https://docs.google.com/document/d/${fileId}/preview`;
            } else if (project.driveLink.includes('docs.google.com/spreadsheets')) {
              // Google Sheets - use preview
              fileUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
            } else if (project.driveLink.includes('docs.google.com/presentation')) {
              // Google Slides - use preview
              fileUrl = `https://docs.google.com/presentation/d/${fileId}/preview`;
            } else if (project.driveLink.includes('drive.google.com')) {
              // Google Drive file - use preview for full viewer with thumbnails, tabs, page selection
              fileUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            } else {
              // Fallback: try to replace /edit or /view with /preview
              fileUrl = project.driveLink
                .replace(/\/edit(\?.*)?$/, '/preview')
                .replace(/\/view(\?.*)?$/, '/preview');
            }
          } else {
            // Fallback: try to replace /edit or /view with /preview
            fileUrl = project.driveLink
              .replace(/\/edit(\?.*)?$/, '/preview')
              .replace(/\/view(\?.*)?$/, '/preview');
          }
        } else {
          // Unknown format - use as-is
          fileUrl = project.driveLink;
        }
      } else if (project.file) {
        const filePath = `${BASE_URL}/uploads/${project.file}`;
        // Check if file is .docx and use Google Docs Viewer to convert to PDF
        if (project.file.toLowerCase().endsWith('.docx')) {
          // Use Google Docs Viewer to convert .docx to PDF view
          const encodedUrl = encodeURIComponent(window.location.origin + filePath);
          fileUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
        } else {
          fileUrl = filePath;
        }
      }
      
      const article = document.createElement('article');
      article.className = 'post-card';
      article.setAttribute('role', 'listitem');
      article.setAttribute('tabindex', '0');
      article.setAttribute('data-src', fileUrl);
      article.setAttribute('data-original-link', project.driveLink || project.file || '');
      article.setAttribute('data-fallback-links', project.fallbackLinks ? JSON.stringify(project.fallbackLinks) : '');
      article.setAttribute('data-id', project.id || idx + 1);
      
      // Format date for display
      const displayDate = project.dateUpdated ? 
        new Date(project.dateUpdated).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }) : '';
      
      article.innerHTML = `
        <div class="post-preview">
          <iframe src="${fileUrl}" title="${project.title} preview" loading="lazy"></iframe>
        </div>
        <h3>${project.title}</h3>
        <p class="muted">${project.description || ''}</p>
        ${displayDate ? `<p class="muted small" style="font-size:0.75rem;opacity:0.7">Updated: ${displayDate}</p>` : ''}
        <button class="btn ghost expand-btn" type="button" aria-label="Open ${project.title}">Expand</button>
      `;
      projectTrack.appendChild(article);
    });
    
    // Re-initialize carousel after loading projects
    setTimeout(() => {
      if (typeof initCarousel === 'function') {
        initCarousel();
      }
    }, 100);
  } else {
    // No projects available - show placeholder message
    if (projectTrack) {
      projectTrack.innerHTML = `
        <article class="post-card" role="listitem" style="min-width:100%;text-align:center;padding:40px 20px">
          <h3>No Projects Yet</h3>
          <p class="muted">Projects will appear here once you add PDF files to the uploads folder and update content.json.</p>
          <p class="muted small">See uploads/README.md for instructions.</p>
        </article>
      `;
    }
  }
});
