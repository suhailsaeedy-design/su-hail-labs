(() => {
  'use strict';
  const VERIFIED='smd_private_admin_verified_v2',panel='suhail-labs';
  const mount=document.querySelector('#secureAdminMount'),status=document.querySelector('#secureAdminStatus');
  const setStatus=(m,state='')=>{if(status){status.textContent=m;status.className='admin-status '+state}};
  async function fetchBundle(auth){
    const st=auth.authStatus,base=String(st.config.supabaseUrl).replace(/\/+$/,'');
    const res=await fetch(`${base}/rest/v1/rpc/suhail_admin_bundle`,{
      method:'POST',
      headers:{apikey:st.config.publishableKey,Authorization:`Bearer ${st.session.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify({p_panel:panel})
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error('Private administration could not be loaded.');
    return body;
  }
  async function boot(){
    let gate=null;try{gate=JSON.parse(sessionStorage.getItem(VERIFIED)||'null')}catch{}
    if(!gate||gate.panel!==panel){location.replace('admin-login.html');return}
    try{
      const auth=await SMD21AdminAuth.verifiedCloudRole();
      if(!auth.authorized||auth.authStatus?.source!=='session')throw new Error('verification');
      setStatus('Verified owner session. Loading Creator Studio…','ok');
      const bundle=await fetchBundle(auth);
      document.documentElement.lang='en';document.documentElement.dir='ltr';
      document.body.className='studio-body';
      const style=document.createElement('style');style.textContent=String(bundle.css||'');document.head.appendChild(style);
      mount.outerHTML=String(bundle.html||'');
      const script=document.createElement('script');script.textContent=String(bundle.js||'');document.body.appendChild(script);
    }catch{
      sessionStorage.removeItem(VERIFIED);
      try{await SMD21CloudAuth.signOutRemote()}catch{}
      setStatus('Private administration requires a new verified sign-in.','bad');
      setTimeout(()=>location.replace('admin-login.html'),700);
    }
  }
  boot();
})();