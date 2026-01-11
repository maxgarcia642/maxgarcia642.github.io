// Load content from local content.json or backend API
document.addEventListener('DOMContentLoaded', async () => {
  const REPLIT_URL = 'https://workspace.maxgarcia642.repl.co'; 
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  let data = null;
  
  // Try to load from local content.json first (preferred for GitHub Pages)
  try {
    const localRes = await fetch('./content.json');
    if (localRes.ok) {
      data = await localRes.json();
    }
  } catch (e) {
    // Local file not available
  }
  
  // Fallback to Replit API
  if (!data) {
    try {
      const API_URL = isGitHubPages ? REPLIT_URL + '/api' : '/api';
      const res = await fetch(`${API_URL}/content`);
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      console.log('Content loaded from HTML defaults');
      return;
    }
  }
  
  if (!data) {
    console.log('Content loaded from HTML defaults');
    return;
  }
  
  // Update intro section
  if (data.intro) {
    const introTitle = document.getElementById('introTitle');
    const introDesc = document.getElementById('introDesc');
    if (introTitle && data.intro.title) introTitle.textContent = data.intro.title;
    if (introDesc && data.intro.description) introDesc.textContent = data.intro.description;
  }
  
  // Update section titles and descriptions
  if (data.sections) {
    const sections = ['programming', 'posts', 'utilities', 'game', 'connect'];
    sections.forEach(section => {
      const titleEl = document.getElementById(section + 'Title');
      const descEl = document.getElementById(section + 'Desc');
      if (titleEl && data.sections[section]?.title) {
        titleEl.textContent = data.sections[section].title;
      }
      if (descEl && data.sections[section]?.description) {
        descEl.textContent = data.sections[section].description;
      }
    });
  }
});
