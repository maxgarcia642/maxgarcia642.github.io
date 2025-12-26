// Load content from backend on page load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/content');
    const data = await res.json();
    
    // Update intro section
    const introTitle = document.getElementById('introTitle');
    const introDesc = document.getElementById('introDesc');
    if (introTitle) introTitle.textContent = data.intro.title;
    if (introDesc) introDesc.textContent = data.intro.description;
    
    // Update section titles and descriptions
    const sections = ['programming', 'posts', 'utilities', 'game', 'connect'];
    sections.forEach(section => {
      const titleEl = document.getElementById(section + 'Title');
      const descEl = document.getElementById(section + 'Desc');
      if (titleEl && data.sections[section]) titleEl.textContent = data.sections[section].title;
      if (descEl && data.sections[section]) descEl.textContent = data.sections[section].description;
    });
  } catch (e) {
    console.log('Content loaded from HTML defaults');
  }
});
