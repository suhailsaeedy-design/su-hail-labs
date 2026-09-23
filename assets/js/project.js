(() => {
  'use strict';
  const bundled = window.SUHAIL_LABS_DATA;
  let data = bundled;
  if (new URLSearchParams(location.search).get('preview') === 'draft') {
    try { data = JSON.parse(localStorage.getItem('suhailLabsDraftDataV2')) || bundled; } catch { data = bundled; }
  }
  const $ = s => document.querySelector(s);
  const esc = (v='') => String(v).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  const savedTheme = localStorage.getItem('suhailLabsTheme');
  document.documentElement.dataset.theme = savedTheme || 'light';
  const themeToggle = $('#themeToggle');
  const sync = () => { if(themeToggle) themeToggle.textContent = document.documentElement.dataset.theme === 'dark' ? '☼' : '◐'; };
  sync(); themeToggle?.addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('suhailLabsTheme',next);sync();});

  const id = new URLSearchParams(location.search).get('id') || data.projects[0]?.id;
  const p = data.projects.find(x => x.id === id);
  const mount = $('#projectDetail');
  if (!p) {
    mount.innerHTML = `<div class="error-page" style="min-height:55vh"><div><span class="section-kicker">PROJECT NOT FOUND</span><h1>That project is not published.</h1><a class="button button-primary" href="index.html#projects">Back to projects</a></div></div>`;
    return;
  }
  document.title = `${p.title} — Suhail Labs`;
  mount.innerHTML = `<div class="project-layout">
    <article class="project-panel">
      <span class="section-kicker">${esc(p.categoryLabel)}</span>
      <h1>${esc(p.title)}</h1>
      <p>${esc(p.description)}</p>
      <div class="tag-row">${(p.focusAreas || [p.category]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="project-actions">
        ${p.live ? `<a class="button button-primary" href="${esc(p.live)}"${/^https?:\/\//.test(p.live)?' target="_blank" rel="noopener"':''}>${esc(p.liveLabel || 'Open live project')} ↗</a>` : ''}
        ${p.download ? `<a class="button button-secondary" href="${esc(p.download)}"${/^https?:\/\//.test(p.download)?' target="_blank" rel="noopener"':''}>Download source ↓</a>` : ''}
        ${p.source && p.source !== p.live ? `<a class="button button-secondary" href="${esc(p.source)}" target="_blank" rel="noopener">Source repository ↗</a>` : ''}
      </div>
      <h2>Project highlights</h2><ul class="feature-list">${p.highlights.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>
      <h2>What visitors can learn</h2><ul class="feature-list">${p.learning.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>
      <p class="small-note"><strong>Professional note:</strong> ${esc(p.note)}</p>
    </article>
    <aside class="project-panel">
      <span class="section-kicker">PROJECT ${esc(p.id)}</span>
      <h2>${esc(p.status)}</h2>
      <p>${esc(p.summary)}</p>
      <div class="tag-row">${(p.focusAreas || [p.category]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
    </aside>
  </div>`;
  const y=$('#year'); if(y) y.textContent = new Date().getFullYear();
})();