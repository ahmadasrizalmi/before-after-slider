// Before/After Slider — Side Panel Logic

const $ = id => document.getElementById(id);

let projects = [];
let editingProject = null;

// ─── Init ──────────────────────────────────────────────────────────

async function init() {
  setupEvents();
  loadProjects();
}

// ─── Projects ──────────────────────────────────────────────────────

function loadProjects() {
  chrome.runtime.sendMessage({ type: 'GET_PROJECTS' }, (resp) => {
    if (resp?.success) {
      projects = resp.projects;
      renderProjectList();
    }
  });
}

function renderProjectList() {
  const list = $('project-list');
  $('project-count').textContent = `${projects.length} Projects`;
  
  if (projects.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 15 3-3 3 3"/></svg>
        <div>Belum ada slider. Klik "+ Baru" untuk mulai.</div>
      </div>
    `;
    return;
  }
  
  list.innerHTML = projects.map(p => `
    <div class="project-card" data-id="${p.id}">
      <div class="project-header">
        <h3 class="project-title">${esc(p.title || 'Untitled')}</h3>
        <span style="font-size:12px; color:${p.hasImages ? 'var(--green)' : 'var(--text-muted)'};">${p.hasImages ? 'Ready' : 'Draft'}</span>
      </div>
      <div class="project-meta">${esc(p.brand || 'Ahmad Asri Photography')} · ${formatDate(p.createdAt)}</div>
    </div>
  `).join('');
  
  list.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => editProject(card.dataset.id));
  });
}

// ─── Edit Project ──────────────────────────────────────────────────

function editProject(id) {
  chrome.runtime.sendMessage({ type: 'GET_PROJECT', id }, (resp) => {
    if (resp?.success && resp.project) {
      editingProject = resp.project;
      
      $('edit-title').value = editingProject.title || '';
      $('edit-desc').value = editingProject.description || '';
      $('edit-brand').value = editingProject.brand || 'Ahmad Asri Photography';
      $('edit-slider-color').value = editingProject.sliderColor || '#FFFFFF';
      
      updateUploadZone('before', editingProject.beforeImg);
      updateUploadZone('after', editingProject.afterImg);
      updatePreview();
      
      showView('edit');
    }
  });
}

function updateUploadZone(side, imgBase64) {
  const zone = $(`zone-${side}`);
  const input = $(`input-${side}`);
  
  if (imgBase64) {
    zone.classList.add('has-image');
    zone.innerHTML = `
      <input type="file" accept="image/*" style="display:none" id="input-${side}">
      <img src="${imgBase64}" alt="${side}">
      <button class="upload-remove" data-side="${side}">&times;</button>
    `;
    
    // Re-bind events
    zone.querySelector('input').addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageUpload(side, e.target.files[0]);
    });
    zone.querySelector('.upload-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      editingProject[`${side}Img`] = null;
      resetUploadZone(side);
      updatePreview();
    });
    zone.addEventListener('click', (e) => {
      if (e.target.classList.contains('upload-remove')) return;
      zone.querySelector('input').click();
    });
  } else {
    zone.classList.remove('has-image');
    zone.innerHTML = `
      <input type="file" accept="image/*" style="display:none" id="input-${side}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      <div class="upload-zone-label">${side.toUpperCase()}</div>
      <div class="upload-zone-hint">Klik atau drag foto</div>
    `;
    zone.querySelector('input').addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageUpload(side, e.target.files[0]);
    });
    zone.addEventListener('click', () => zone.querySelector('input').click());
  }
}

function resetUploadZone(side) {
  const zone = $(`zone-${side}`);
  zone.classList.remove('has-image');
  zone.innerHTML = `
    <input type="file" accept="image/*" style="display:none" id="input-${side}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
    <div class="upload-zone-label">${side.toUpperCase()}</div>
    <div class="upload-zone-hint">Klik atau drag foto</div>
  `;
  zone.querySelector('input').addEventListener('change', (e) => {
    if (e.target.files[0]) handleImageUpload(side, e.target.files[0]);
  });
  zone.addEventListener('click', () => zone.querySelector('input').click());
}

function handleImageUpload(side, file) {
  if (!editingProject || !file.type.startsWith('image/')) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 1200;
      let w = img.width, h = img.height;
      if (w > maxW) { h = (h / w) * maxW; w = maxW; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      
      editingProject[`${side}Img`] = canvas.toDataURL('image/jpeg', 0.85);
      updateUploadZone(side, editingProject[`${side}Img`]);
      updatePreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── Preview ───────────────────────────────────────────────────────

function updatePreview() {
  const section = $('preview-section');
  const hasBoth = editingProject?.beforeImg && editingProject?.afterImg;
  
  if (hasBoth) {
    section.classList.add('visible');
    $('preview-before').src = editingProject.beforeImg;
    $('preview-after').src = editingProject.afterImg;
    initPreviewSlider();
  } else {
    section.classList.remove('visible');
  }
}

function initPreviewSlider() {
  const slider = $('preview-slider');
  const beforeLayer = $('preview-before-layer');
  const beforeImg = $('preview-before');
  const line = $('preview-line');
  const handle = $('preview-handle');
  
  let isDragging = false;
  
  function updateSlider(percent) {
    percent = Math.max(2, Math.min(98, percent));
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
  
  // Remove old listeners
  slider.replaceWith(slider.cloneNode(true));
  
  const newSlider = $('preview-slider');
  const newBeforeLayer = $('preview-before-layer');
  const newBeforeImg = $('preview-before');
  const newLine = $('preview-line');
  const newHandle = $('preview-handle');
  
  newSlider.addEventListener('mousedown', (e) => {
    isDragging = true;
    updateSlider(getPercent(e));
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSlider(getPercent(e));
  });
  
  document.addEventListener('mouseup', () => { isDragging = false; });
  
  newSlider.addEventListener('touchstart', (e) => {
    isDragging = true;
    updateSlider(getPercent(e));
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    updateSlider(getPercent(e));
  }, { passive: true });
  
  document.addEventListener('touchend', () => { isDragging = false; });
  
  updateSlider(50);
}

// ─── Save/Export ──────────────────────────────────────────────────

function saveProject() {
  if (!editingProject) return;
  
  editingProject.title = $('edit-title').value || 'Untitled Slider';
  editingProject.description = $('edit-desc').value;
  editingProject.brand = $('edit-brand').value;
  editingProject.sliderColor = $('edit-slider-color').value;
  editingProject.updatedAt = new Date().toISOString();
  
  chrome.runtime.sendMessage({ type: 'SAVE_PROJECT', project: editingProject }, (resp) => {
    if (resp?.success) {
      toast('Project disimpan');
      loadProjects();
    }
  });
}

function exportHTML() {
  if (!editingProject) return;
  
  chrome.runtime.sendMessage({ type: 'GENERATE_HTML', id: editingProject.id }, (resp) => {
    if (resp?.success && resp.html) {
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_HTML', html: resp.html }, () => {
        toast('HTML downloaded');
      });
    }
  });
}

function deleteProject() {
  if (!editingProject) return;
  if (!confirm('Hapus project ini?')) return;
  
  chrome.runtime.sendMessage({ type: 'DELETE_PROJECT', id: editingProject.id }, () => {
    editingProject = null;
    showView('list');
    loadProjects();
    toast('Project dihapus');
  });
}

// ─── View Management ──────────────────────────────────────────────

function showView(view) {
  $('view-list').style.display = view === 'list' ? 'block' : 'none';
  $('view-edit').style.display = view === 'edit' ? 'block' : 'none';
}

// ─── Helpers ───────────────────────────────────────────────────────

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Events ────────────────────────────────────────────────────────

function setupEvents() {
  $('btn-new').addEventListener('click', () => {
    editingProject = {
      id: `ba_${Date.now()}`,
      title: '',
      description: '',
      brand: 'Ahmad Asri Photography',
      sliderColor: '#FFFFFF',
      beforeImg: null,
      afterImg: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    $('edit-title').value = '';
    $('edit-desc').value = '';
    $('edit-brand').value = 'Ahmad Asri Photography';
    $('edit-slider-color').value = '#FFFFFF';
    resetUploadZone('before');
    resetUploadZone('after');
    updatePreview();
    showView('edit');
  });
  
  $('btn-back').addEventListener('click', () => {
    showView('list');
    loadProjects();
  });
  
  $('btn-save').addEventListener('click', saveProject);
  $('btn-export').addEventListener('click', exportHTML);
  $('btn-delete').addEventListener('click', deleteProject);
  
  // Slider color change
  $('edit-slider-color').addEventListener('input', () => {
    const color = $('edit-slider-color').value;
    document.documentElement.style.setProperty('--slider-color', color);
  });
  
  // Drag & drop on zones
  ['before', 'after'].forEach(side => {
    const zone = $(`zone-${side}`);
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleImageUpload(side, e.dataTransfer.files[0]);
    });
  });
}

// ─── Start ─────────────────────────────────────────────────────────

init();
