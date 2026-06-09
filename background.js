// Before/After Slider — Background Service Worker

async function getProjects() {
  const data = await chrome.storage.local.get('baProjects');
  return data.baProjects || [];
}

async function saveProjects(projects) {
  await chrome.storage.local.set({ baProjects: projects });
}

// ─── HTML Generator ──────────────────────────────────────────────

function generateHTML(project) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(project.title)} — Before/After</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;background:#F2F2F7;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
.container{max-width:900px;width:100%;background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.header{padding:24px 32px;border-bottom:1px solid #E5E5EA}
.header h1{font-size:28px;font-weight:700;color:#1D1D1F}
.header p{font-size:15px;color:#86868B;margin-top:4px}
.slider-wrap{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden;cursor:ew-resize;user-select:none}
.slider-wrap img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover}
.slider-wrap .after{clip-path:polygon(0 0,var(--pos) 0,var(--pos) 100%,0 100%)}
.divider{position:absolute;top:0;bottom:0;width:3px;background:white;left:var(--pos);transform:translateX(-50%);z-index:10;pointer-events:none}
.divider::before,.divider::after{content:'';position:absolute;left:50%;transform:translateX(-50%)}
.divider::before{top:50%;width:40px;height:40px;background:white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.2);margin-top:-20px}
.divider::after{top:50%;width:0;height:0;border:8px solid transparent;margin-top:-8px}
.divider::after{border-left-color:#1D1D1F;border-right:none;left:calc(50% - 2px)}
.labels{position:absolute;bottom:20px;left:20px;right:20px;display:flex;justify-content:space-between;pointer-events:none;z-index:5}
.label{padding:8px 16px;background:rgba(0,0,0,0.6);color:white;border-radius:20px;font-size:13px;font-weight:600;backdrop-filter:blur(10px)}
.footer{padding:16px 32px;text-align:center;color:#86868B;font-size:13px;border-top:1px solid #E5E5EA}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>${esc(project.title)}</h1>
${project.description ? `<p>${esc(project.description)}</p>` : ''}
</div>
<div class="slider-wrap" id="slider" style="--pos:50%">
<img src="${project.beforePhoto}" alt="Before" class="before">
<img src="${project.afterPhoto}" alt="After" class="after">
<div class="divider" style="--pos:50%"></div>
<div class="labels">
<span class="label">Before</span>
<span class="label">After</span>
</div>
</div>
${project.brand ? `<div class="footer">${esc(project.brand)}</div>` : ''}
</div>
<script>
const slider=document.getElementById('slider');
let isDown=false;
function getPos(e){const r=slider.getBoundingClientRect();const x=e.touches?e.touches[0].clientX:e.clientX;return Math.max(0,Math.min(100,((x-r.left)/r.width)*100))}
function update(pos){slider.style.setProperty('--pos',pos+'%');slider.querySelector('.divider').style.setProperty('--pos',pos+'%')}
slider.addEventListener('mousedown',()=>isDown=true);
slider.addEventListener('touchstart',()=>isDown=true);
window.addEventListener('mouseup',()=>isDown=false);
window.addEventListener('touchend',()=>isDown=false);
slider.addEventListener('mousemove',e=>{if(isDown)update(getPos(e))});
slider.addEventListener('touchmove',e=>{if(isDown)update(getPos(e))});
slider.addEventListener('click',e=>update(getPos(e)));
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
      sendResponse({ success: true, projects });
    })();
    return true;
  }
  
  if (msg.type === 'SAVE_PROJECT') {
    (async () => {
      const projects = await getProjects();
      const idx = projects.findIndex(p => p.id === msg.project.id);
      if (idx >= 0) {
        projects[idx] = msg.project;
      } else {
        projects.push(msg.project);
      }
      await saveProjects(projects);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'DELETE_PROJECT') {
    (async () => {
      const projects = await getProjects();
      const filtered = projects.filter(p => p.id !== msg.projectId);
      await saveProjects(filtered);
      sendResponse({ success: true });
    })();
    return true;
  }
  
  if (msg.type === 'EXPORT_HTML') {
    (async () => {
      const html = generateHTML(msg.project);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url,
        filename: `${msg.project.title || 'before-after'}.html`,
        saveAs: true
      }, () => {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        sendResponse({ success: true });
      });
    })();
    return true;
  }
  
  return true;
});

// ─── Open Side Panel ──────────────────────────────────────────────

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

console.log('[Before/After Slider] Background loaded');
