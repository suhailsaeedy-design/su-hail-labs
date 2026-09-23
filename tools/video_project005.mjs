import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir='video-output';
fs.mkdirSync(outDir,{recursive:true});
const projectUrl='http://127.0.0.1:8000/projects/005-smart-inventory/index.html';
const source=fs.readFileSync('projects/005-smart-inventory/index.html','utf8');

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));

async function addOverlay(page,text,sub=''){
  await page.evaluate(({text,sub})=>{
    let el=document.getElementById('__video_caption');
    if(!el){
      el=document.createElement('div');el.id='__video_caption';
      el.style.cssText='position:fixed;z-index:999999;left:42px;right:42px;bottom:54px;padding:22px 26px;border-radius:24px;background:rgba(6,17,30,.88);backdrop-filter:blur(16px);border:1px solid rgba(111,231,255,.32);box-shadow:0 22px 80px rgba(0,0,0,.32);color:white;font-family:Inter,system-ui,sans-serif;pointer-events:none';
      document.body.appendChild(el);
    }
    el.innerHTML='<div style="font-size:34px;font-weight:900;line-height:1.12">'+text+'</div>'+(sub?'<div style="margin-top:8px;font-size:20px;line-height:1.35;color:#c9d7e7">'+sub+'</div>':'');
  },{text,sub});
}
async function clearOverlay(page){await page.evaluate(()=>document.getElementById('__video_caption')?.remove())}

async function finishVideo(page,context,name){
  const video=page.video();
  await page.close();
  await context.close();
  const p=await video.path();
  fs.renameSync(p,path.join(outDir,name));
}

async function newRecordedPage(browser){
  const context=await browser.newContext({
    viewport:{width:1080,height:1920},
    recordVideo:{dir:outDir,size:{width:1080,height:1920}},
    colorScheme:'light'
  });
  const page=await context.newPage();
  return {context,page};
}

async function prepare(page){
  await page.goto(projectUrl,{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.clear();location.reload()});
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
}

async function videoDemo(browser){
  const {context,page}=await newRecordedPage(browser);
  await prepare(page);
  await addOverlay(page,'Smart Inventory & Barcode Stock Manager','A real browser-based stock workflow — local-first and free.');
  await sleep(2800);
  await clearOverlay(page);

  await page.locator('#statusFilter').selectOption('low');
  await addOverlay(page,'Instant low-stock filtering','Find products that need attention without digging through a long list.');
  await sleep(2600);

  await page.locator('#statusFilter').selectOption('all');
  const firstPlus=page.locator('[data-delta="1"]').first();
  await firstPlus.click();
  await addOverlay(page,'Quick stock updates','Increase or decrease quantities directly from each product card.');
  await sleep(2400);

  await page.locator('#addItem').click();
  await addOverlay(page,'Add a real inventory item','Name, SKU/barcode, category, quantity, threshold, cost and optional expiry.');
  await page.locator('input[name="name"]').fill('Portable SSD 1TB');
  await page.locator('input[name="code"]').fill('SL-2001');
  await page.locator('input[name="category"]').fill('Storage');
  await page.locator('input[name="qty"]').fill('7');
  await page.locator('input[name="min"]').fill('3');
  await page.locator('input[name="cost"]').fill('68.50');
  await sleep(1800);
  await page.locator('#saveItem').click();
  await sleep(1600);

  await page.locator('#search').fill('SSD');
  await addOverlay(page,'Fast search + local persistence','The workspace stays in this browser until you export or clear it.');
  await sleep(2600);

  await page.locator('#search').fill('');
  await page.locator('#currency').selectOption('AFN');
  await page.locator('#themeToggle').click();
  await addOverlay(page,'Light and Dark themes + multiple currencies','Default is Light; user preferences can be changed anytime.');
  await sleep(2600);

  await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
  await sleep(1500);
  await addOverlay(page,'Reports, CSV export and JSON backup','Useful for small shops, offices and personal stock tracking.');
  await sleep(3000);

  await addOverlay(page,'Comment “Suhail Saeedy” to get the project link and download.','Also tell me in the comments what project we should build next.');
  await sleep(4200);
  await finishVideo(page,context,'project005-live-demo.mp4');
}

async function videoCodeRun(browser){
  const {context,page}=await newRecordedPage(browser);
  const lines=source.split('\n').slice(0,260);
  const codeHtml=lines.map((l,i)=>'<div><span class="ln">'+String(i+1).padStart(3,' ')+'</span>'+esc(l)+'</div>').join('');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#07111f;color:#dce8f7;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
    body{padding:70px 38px 220px}.head{position:fixed;z-index:3;top:0;left:0;right:0;padding:22px 38px;background:rgba(7,17,31,.94);border-bottom:1px solid #263c52;font-family:Inter,system-ui,sans-serif}
    .head b{font-size:28px;color:#6fe7ff}.head span{display:block;color:#9cafc4;font-size:16px;margin-top:4px}.code{font-size:18px;line-height:1.55;white-space:pre}.ln{display:inline-block;width:64px;color:#587087;user-select:none}.code div:nth-child(7n+1){color:#9fdcff}
  </style></head><body><div class="head"><b>Project 005 — Actual Source Code</b><span>One-file HTML • responsive UI • local inventory logic</span></div><div class="code">${codeHtml}</div></body></html>`);
  await addOverlay(page,'Real code first','This is the same Project 005 source that runs in the live demo.');
  await sleep(2600);
  await clearOverlay(page);
  for(let i=0;i<5;i++){await page.evaluate(()=>window.scrollBy({top:760,behavior:'smooth'}));await sleep(1500)}
  await addOverlay(page,'Clean, editable structure','Responsive design, local storage, filters, reporting and scanner fallback are all in the project.');
  await sleep(2800);

  await page.goto(projectUrl,{waitUntil:'networkidle'});
  await page.evaluate(()=>{localStorage.clear();location.reload()});
  await page.waitForLoadState('networkidle');await sleep(900);
  await addOverlay(page,'Now run the same code live','The dashboard starts with clearly labeled sample data for the portfolio demo.');
  await sleep(2600);
  await clearOverlay(page);

  await page.locator('#statusFilter').selectOption('out');
  await sleep(1500);
  await page.locator('#statusFilter').selectOption('all');
  await page.locator('#addItem').click();
  await page.locator('input[name="name"]').fill('USB-C SSD');
  await page.locator('input[name="code"]').fill('CODE-500');
  await page.locator('input[name="category"]').fill('Storage');
  await page.locator('input[name="qty"]').fill('5');
  await page.locator('input[name="min"]').fill('2');
  await page.locator('input[name="cost"]').fill('52');
  await addOverlay(page,'CRUD workflow in action','Add, edit, delete and adjust stock without a paid backend.');
  await sleep(1800);
  await page.locator('#saveItem').click();
  await sleep(1800);

  await page.locator('#themeToggle').click();
  await sleep(1200);
  await addOverlay(page,'Project link is on Suhail Labs','Live demo + downloadable source package.');
  await sleep(2600);
  await addOverlay(page,'Comment “Suhail Saeedy” to get the project link and download.','What should Project 006 be? Leave your idea in the comments.');
  await sleep(4200);
  await finishVideo(page,context,'project005-code-and-run.mp4');
}

async function videoHook(browser){
  const {context,page}=await newRecordedPage(browser);
  await prepare(page);
  await addOverlay(page,'What if your inventory dashboard worked with zero paid backend?','Project 005 • Smart Inventory & Barcode Stock Manager');
  await sleep(2600);await clearOverlay(page);
  await page.locator('#statusFilter').selectOption('low');await sleep(1600);
  await page.locator('#statusFilter').selectOption('all');
  await page.locator('[data-delta="1"]').first().click();await sleep(1200);
  await page.locator('#themeToggle').click();await sleep(1200);
  await addOverlay(page,'Low-stock alerts • scanner fallback • reports • backup','Everything runs in the browser.');
  await sleep(2600);
  await addOverlay(page,'Comment “Suhail Saeedy” for the project link.','And tell me what we should build next.');
  await sleep(3200);
  await finishVideo(page,context,'project005-quick-hook.mp4');
}

const browser=await chromium.launch({headless:true});
try{
  await videoDemo(browser);
  await videoCodeRun(browser);
  await videoHook(browser);
}finally{await browser.close()}
console.log('Created videos:',fs.readdirSync(outDir));
