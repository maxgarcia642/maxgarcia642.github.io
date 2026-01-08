// Load projects and resume dynamically
document.addEventListener('DOMContentLoaded', async () => {
  const REPLIT_URL = 'https://workspace.maxgarcia642.repl.co'; 
  const API_URL = window.location.hostname.includes('github.io') ? REPLIT_URL + '/api' : '/api';
  const BASE_URL = window.location.hostname.includes('github.io') ? REPLIT_URL : '';

  try {
    const res = await fetch(`${API_URL}/content`);
    const data = await res.json();
    
    // Load resume if available
    if (data.resumeFile) {
      const resumeFrame = document.getElementById('resumeFrame');
      const resumeDownload = document.getElementById('resumeDownload');
      if (resumeFrame) resumeFrame.src = `${BASE_URL}/uploads/${data.resumeFile}`;
      if (resumeDownload) resumeDownload.href = `${BASE_URL}/uploads/${data.resumeFile}`;
    }
    
    // Load projects
    const projectTrack = document.getElementById('projectTrack');
    if (projectTrack && data.projects && data.projects.length > 0) {
      projectTrack.innerHTML = '';
      data.projects.forEach((project, idx) => {
        const fileUrl = project.file ? `${BASE_URL}/uploads/${project.file}` : 'about:blank';
        const article = document.createElement('article');
        article.className = 'post-card';
        article.setAttribute('role', 'listitem');
        article.setAttribute('tabindex', '0');
        article.setAttribute('data-src', fileUrl);
        article.innerHTML = `
          <div class="post-preview"><iframe src="${fileUrl}" title="${project.title} preview" loading="lazy" allow="fullscreen"></iframe></div>
          <h3>${project.title}</h3>
          <p class="muted">${project.description}</p>
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
    }
  } catch (e) {
    console.log('Using default content');
  }
});
