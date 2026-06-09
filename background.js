// Before/After Slider — Background Service Worker

async function getProjects() {
  const data = await chrome.storage.local.get('baProjects');
  return data.baProjects || [];
}

async function saveProjects(projects) {
  await chrome.storage.local.set({ baProjects: projects });
}

async function saveProject(project) {
  const projects = await getProjects();
  const existing = projects.findIndex(p => p.id === project.id);
  if (existing >= 0) {
    projects[existing] = project;
  } else {
    projects.unshift(project);
  }
  if (projects.length > 50) projects.length = 50;
  await saveProjects(projects);
}

async function deleteProject(id) {
  const projects = await getProjects();
  await saveProjects(projects.filter(p => p.id !== id));
}

// ─── HTML Generator ──────────────────────────────────────────────

function generateSliderHTML(project) {
  const { title, description, beforeImg, afterImg, brand, sliderColor, labelStyle } = project;
  
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description || title + ' — Before & After Comparison')}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
      background: #F2F2F7;
      color: #1D1D1F;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .hero {
      text-align: center;
      margin-bottom: 24px;
      max-width: 600px;
    }
    
    .hero-title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    
    .hero-desc {
      font-size: 15px;
      color: #86868B;
      line-height: 1.5;
    }
    
    .slider-container {
      position: relative;
      width: 100%;
      max-width: 800px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      cursor: col-resize;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    
    .slider-container img {
      display: block;
      width: 100%;
      height: auto;
    }
    
    .before-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      overflow: hidden;
    }
    
    .before-layer img {
      position: absolute;
      top: 0;
      left: 0;
      width: 200%;
      max-width: none;
    }
    
    .slider-line {
      position: absolute;
      top: 0;
      left: 50%;
      width: 3px;
      height: 100%;
      background: ${sliderColor || '#FFFFFF'};
      transform: translateX(-50%);
      z-index: 10;
      pointer-events: none;
    }
    
    .slider-handle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 48px;
      height: 48px;
      background: ${sliderColor || '#FFFFFF'};
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 11;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      pointer-events: none;
    }
    
    .slider-handle svg {
      width: 24px;
      height: 24px;
      fill: #1D1D1F;
    }
    
    .label-before, .label-after {
      position: absolute;
      top: 16px;
      padding: 6px 14px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      color: white;
      font-size: 13px;
      font-weight: 600;
      border-radius: 20px;
      z-index: 5;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .label-before { left: 16px; }
    .label-after { right: 16px; }
    
    .slider-container:hover .label-before,
    .slider-container:hover .label-after,
    .slider-container.dragging .label-before,
    .slider-container.dragging .label-after {
      opacity: 1;
    }
    
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 13px;
      color: #86868B;
    }
    
    .footer-brand {
      font-weight: 600;
      color: #1D1D1F;
    }
    
    @media (max-width: 600px) {
      .hero-title { font-size: 22px; }
      .slider-handle { width: 40px; height: 40px; }
      .slider-handle svg { width: 20px; height: 20px; }
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1 class="hero-title">${esc(title)}</h1>
    ${description ? `<p class="hero-desc">${esc(description)}</p>` : ''}
  </div>
  
  <div class="slider-container" id="slider">
    <!-- After image (full width background) -->
    <img src="${afterImg}" alt="After" id="after-img">
    
    <!-- Before layer (clipped) -->
    <div class="before-layer" id="before-layer">
      <img src="${beforeImg}" alt="Before" id="before-img">
    </div>
    
    <!-- Slider line -->
    <div class="slider-line" id="slider-line"></div>
    
    <!-- Slider handle -->
    <div class="slider-handle" id="slider-handle">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5l-5 7 5 7M16 5l5 7-5 7"/>
      </svg>
    </div>
    
    <!-- Labels -->
    <div class="label-before">Before</div>
    <div class="label-after">After</div>
  </div>
  
  <div class="footer">
    <div class="footer-brand">${esc(brand || 'Ahmad Asri Photography')}</div>
    <div>Interior Photography · Yogyakarta</div>
  </div>
  
  <script>
    (function() {
      const slider = document.getElementById('slider');
      const beforeLayer = document.getElementById('before-layer');
      const beforeImg = document.getElementById('before-img');
      const afterImg = document.getElementById('after-img');
      const line = document.getElementById('slider-line');
      const handle = document.getElementById('slider-handle');
      
      let isDragging = false;
      let sliderWidth = 0;
      let currentPercent = 50;
      
      function updateSlider(percent) {
        percent = Math.max(2, Math.min(98, percent));
        currentPercent = percent;
        
        beforeLayer.style.width = percent + '%';
        line.style.left = percent + '%';
        handle.style.left = percent + '%';
        beforeImg.style.width = (10000 / percent) + '%';
      }
      
      function getPercent(e) {
        const rect = slider.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return ((clientX - rect.left) / rect.width) * 100;
      }
      
      function startDrag(e) {
        isDragging = true;
        slider.classList.add('dragging');
        updateSlider(getPercent(e));
        e.preventDefault();
      }
      
      function onDrag(e) {
        if (!isDragging) return;
        updateSlider(getPercent(e));
        e.preventDefault();
      }
      
      function endDrag() {
        isDragging = false;
        slider.classList.remove('dragging');
      }
      
      // Mouse events
      slider.addEventListener('mousedown', startDrag);
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', endDrag);
      
      // Touch events
      slider.addEventListener('touchstart', startDrag, { passive: false });
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('touchend', endDrag);
      
      // Keyboard
      slider.setAttribute('tabindex', '0');
      slider.setAttribute('role', 'slider');
      slider.setAttribute('aria-valuenow', '50');
      slider.setAttribute('aria-label', 'Before/After comparison');
      
      slider.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          updateSlider(currentPercent - 2);
          slider.setAttribute('aria-valuenow', Math.round(currentPercent));
        } else if (e.key === 'ArrowRight') {
          updateSlider(currentPercent + 2);
          slider.setAttribute('aria-valuenow', Math.round(currentPercent));
        }
      });
      
      // Resize handler
      window.addEventListener('resize', () => updateSlider(currentPercent));
      
      // Initial
      updateSlider(50);
    })();
  </script>
</body>
</html>`;
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Message Handler ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  
  if (msg.type === 'GET_PROJECTS') {
    (async () => {
      const projects = await getProjects();
      const list = projects.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        brand: p.brand,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        hasImages: !!(p.beforeImg && p.afterImg)
      }));
      sendResponse({ success: true, projects: list });
    })();
    return true;
  }
  
  if (msg.type === 'GET_PROJECT') {
    (async () => {
      const projects = await getProjects();
      const project = projects.find(p => p.id === msg.id);
      sendResponse({ success: !!project, project });
    })();
    return true;
  }
  
  if (msg.type === 'SAVE_PROJECT') {
    (async () => {
      await saveProject(msg.project);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'DELETE_PROJECT') {
    (async () => {
      await deleteProject(msg.id);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'GENERATE_HTML') {
    (async () => {
      const projects = await getProjects();
      const project = projects.find(p => p.id === msg.id);
      if (!project) {
        sendResponse({ success: false, error: 'Project not found' });
        return;
      }
      const html = generateSliderHTML(project);
      sendResponse({ success: true, html });
    })();
    return true;
  }
  
  if (msg.type === 'DOWNLOAD_HTML') {
    const html = msg.html;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    chrome.downloads.download({
      url,
      filename: `before_after_${Date.now()}.html`,
      saveAs: true
    }, () => {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

console.log('[Before/After Slider] Background loaded');
