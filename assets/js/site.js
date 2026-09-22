(() => {
  'use strict';
  const bundled = window.SUHAIL_LABS_DATA;
  let data = bundled;
  if (new URLSearchParams(location.search).get('preview') === 'draft') {
    try { data = JSON.parse(localStorage.getItem('suhailLabsDraftDataV2')) || bundled; } catch { data = bundled; }
  }
  if (!data) return;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  const savedTheme = localStorage.getItem('suhailLabsTheme');
  const preferred = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = savedTheme || preferred;
  const themeToggle = $('#themeToggle');
  const syncThemeLabel = () => { if (themeToggle) themeToggle.textContent = document.documentElement.dataset.theme === 'dark' ? '☼' : '◐'; };
  syncThemeLabel();
  themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('suhailLabsTheme', next);
    syncThemeLabel();
  });

  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');
  navToggle?.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => { mainNav?.classList.remove('open'); navToggle?.setAttribute('aria-expanded','false'); }));

  $$('[data-name]').forEach(el => el.textContent = data.profile.name);
  const bio = $('[data-bio]'); if (bio) bio.textContent = data.profile.bio;
  const portrait = $('#profilePortrait');
  if (portrait && /^https?:\/\//.test(data.profile.avatar || '')) {
    portrait.innerHTML = `<img src="${esc(data.profile.avatar)}" alt="${esc(data.profile.name)}" loading="lazy" referrerpolicy="no-referrer" />`;
    portrait.classList.add('has-photo');
  }
  const heroCount = $('#projectCountHero'); if (heroCount) heroCount.textContent = String(data.projects.length).padStart(2,'0');
  const aboutPoints = $('#aboutPoints');
  if (aboutPoints) aboutPoints.innerHTML = data.profile.aboutPoints.map(p => `<div class="about-point"><i>✓</i><span>${esc(p)}</span></div>`).join('');
  const stackTags = $('#stackTags');
  if (stackTags) stackTags.innerHTML = data.profile.stack.map(t => `<span class="stack-tag">${esc(t)}</span>`).join('');

  const capabilityGrid = $('#capabilityGrid');
  if (capabilityGrid) capabilityGrid.innerHTML = data.capabilities.map(c => `<article class="capability-card reveal"><div class="capability-icon">${esc(c.icon)}</div><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`).join('');

  const processList = $('#processList');
  if (processList) processList.innerHTML = data.process.map(p => `<li class="process-item"><span class="step">${esc(p.step)}</span><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></li>`).join('');

  const grid = $('#projectGrid');
  const filters = $('#projectFilters');
  const search = $('#projectSearch');
  const empty = $('#emptyState');
  let activeCategory = 'All';
  const categories = ['All', ...new Set(data.projects.map(p => p.category))];
  if (filters) filters.innerHTML = categories.map(c => `<button type="button" class="filter-button${c === 'All' ? ' active' : ''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('');

  function renderProjects(){
    if (!grid) return;
    const q = (search?.value || '').trim().toLowerCase();
    const items = data.projects.filter(p => {
      const cat = activeCategory === 'All' || p.category === activeCategory;
      const hay = [p.title,p.categoryLabel,p.summary,...p.tech].join(' ').toLowerCase();
      return cat && (!q || hay.includes(q));
    });
    grid.innerHTML = items.map(p => `
      <article class="project-card reveal visible">
        <div class="project-cover"><strong>${esc(p.category==='3D'?'3D':p.category==='WEB'?'WEB':'APP')}</strong></div>
        <div class="project-body">
          <div class="project-meta"><span>PROJECT ${esc(p.id)}</span><span>${esc(p.status)}</span></div>
          <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
          <div class="tag-row">${p.tech.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <div class="card-actions">
            ${p.live ? `<a class="button button-primary" href="${esc(p.live)}"${/^https?:\/\//.test(p.live)?' target="_blank" rel="noopener"':''}>${esc(p.liveLabel || 'Open live demo')} ↗</a>` : ''}
            <a class="button button-secondary" href="${esc(p.detailsUrl)}">Details</a>
          </div>
        </div>
      </article>`).join('');
    if (empty) empty.hidden = items.length > 0;
  }
  renderProjects();
  filters?.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]'); if (!btn) return;
    activeCategory = btn.dataset.filter;
    $$('.filter-button', filters).forEach(b => b.classList.toggle('active', b === btn));
    renderProjects();
  });
  search?.addEventListener('input', renderProjects);

  const profilesGrid = $('#profilesGrid');
  if (profilesGrid) profilesGrid.innerHTML = data.profile.profiles.map(p => {
    const active = /^https?:\/\//.test(p.url || '');
    return `<article class="profile-card"><strong>${esc(p.name)}</strong><small>${esc(p.group)} • ${esc(p.handle)}</small><p>${esc(p.note)}</p>${active ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Open ↗</a>` : `<span class="small-note">Link pending</span>`}</article>`;
  }).join('');

  const contact = $('#contactActions');
  if (contact) {
    const email = (data.profile.email || '').trim();
    contact.innerHTML = email
      ? `<a class="button button-primary" href="mailto:${esc(email)}">Email Suhail</a><a class="button button-secondary" href="links.html">Official links</a><a class="button button-secondary" href="work-with-me.html">Project brief</a>`
      : `<a class="button button-primary" href="links.html">Official links</a><a class="button button-secondary" href="work-with-me.html">Project brief</a>`;
  }

  const assistantPanel = $('#publicAssistant');
  const assistantLauncher = $('#assistantLauncher');
  const assistantClose = $('#assistantClose');
  const publicMessages = $('#publicAssistantMessages');
  const addPublicMessage = (role, message) => {
    if (!publicMessages) return;
    const el = document.createElement('div');
    el.className = `public-msg ${role}`;
    el.textContent = message;
    publicMessages.appendChild(el);
    publicMessages.scrollTop = publicMessages.scrollHeight;
  };
  const publicAnswer = raw => {
    const q = String(raw || '').toLowerCase().trim();
    const idMatch = q.match(/(?:project\s*#?\s*|#)(\d{1,3})/i);
    if (idMatch) {
      const p=data.projects.find(x=>x.id===idMatch[1].padStart(3,'0'));
      if(p) return `Project ${p.id}: ${p.title}\n${p.summary}\nTechnologies: ${p.tech.join(', ')}.`;
    }
    if (/3d|network|topology/.test(q)) { const x=data.projects.find(p=>p.category==='3D'); return x?`${x.title}: ${x.summary}`:'No 3D project is published yet.'; }
    if (/medical|dictionary|anatomy|pwa/.test(q)) { const x=data.projects.find(p=>/medical dictionary/i.test(p.title)); return x?`${x.title}: ${x.summary}`:'The medical dictionary project is not listed yet.'; }
    if (/download|source|code/.test(q)) return `Projects with downloads: ${data.projects.filter(p=>p.download).map(p=>`Project ${p.id} — ${p.title}`).join('; ')}.`;
    if (/what.*build|skills|service|special|capabil|technolog/.test(q)) return `${data.profile.name} focuses on web applications, software systems, database systems, AI-ready assistants, admin/analytics tools and interactive 3D web experiences. Stack: ${data.profile.stack.join(', ')}.`;
    if (/freelanc|hire|work with|client/.test(q)) return 'Open “Work with me” from the navigation for the client project process and project brief.';
    if (/github/.test(q)) return 'GitHub: @suhailsaeedy-design. Open the GitHub card in Profiles or Official Links.';
    if (/project|portfolio|latest/.test(q)) return `Suhail Labs currently publishes ${data.projects.length} projects: ${data.projects.map(p=>`${p.id} ${p.title}`).join('; ')}.`;
    if (/who|about|suhail/.test(q)) return `${data.profile.name} — ${data.profile.title}. ${data.profile.bio}`;
    return 'Ask me about Suhail’s projects, skills, downloads, GitHub profile or client work.';
  };
  const openAssistant=()=>{if(!assistantPanel)return;assistantPanel.hidden=false;assistantLauncher?.setAttribute('aria-expanded','true');if(publicMessages&&!publicMessages.children.length)addPublicMessage('assistant','Hi — I’m the Suhail Labs portfolio assistant. Ask me about projects, skills, downloads or client work.');};
  const closeAssistant=()=>{if(assistantPanel)assistantPanel.hidden=true;assistantLauncher?.setAttribute('aria-expanded','false');};
  assistantLauncher?.addEventListener('click',()=>assistantPanel?.hidden?openAssistant():closeAssistant());
  assistantClose?.addEventListener('click',closeAssistant);
  $('#publicAssistantForm')?.addEventListener('submit',e=>{e.preventDefault();const input=$('#publicAssistantInput');const q=input?.value?.trim();if(!q)return;addPublicMessage('user',q);input.value='';setTimeout(()=>addPublicMessage('assistant',publicAnswer(q)),80);});
  $$('[data-public-prompt]').forEach(b=>b.addEventListener('click',()=>{const q=b.dataset.publicPrompt;openAssistant();addPublicMessage('user',q);setTimeout(()=>addPublicMessage('assistant',publicAnswer(q)),80);}));

  const year=$('#year'); if(year) year.textContent=new Date().getFullYear();
})();