(() => {
  'use strict';
  const VERIFIED='smd_private_admin_verified_v3:suhail-labs',PENDING='smd_private_admin_oauth_pending_v3:suhail-labs',panel='suhail-labs';
  const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
  const status=(m,state='')=>{const e=$('#adminLoginStatus');if(e){e.textContent=m;e.className='admin-status '+state}};
  async function fail(message='Sign-in failed. This account is not authorized for private administration.'){
    sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PENDING);
    try{await SMD21CloudAuth.signOutRemote()}catch{}
    status(message,'bad');
  }
  async function redirectBlocked(){
    sessionStorage.removeItem(VERIFIED);sessionStorage.removeItem(PENDING);
    try{await SMD21CloudAuth.signOutRemote()}catch{}
    location.replace('/suhail-labs/index.html');
  }
  async function complete(){
    if(params.get('oauth')!=='return'||sessionStorage.getItem(PENDING)!==panel){status('Sign in with Google to continue.');return}
    try{
      const auth=await SMD21AdminAuth.verifiedCloudRole();
      if(!auth.authorized){if(auth.blocked){await redirectBlocked();return}await fail();return}
      sessionStorage.setItem(VERIFIED,JSON.stringify({panel,userId:auth.user?.id||'',verifiedAt:Date.now()}));
      sessionStorage.removeItem(PENDING);
      status('Sign-in verified. Opening private administration…','ok');
      location.replace('admin.html');
    }catch{await fail('Sign-in could not be verified. Please try again.')}
  }
  async function begin(){
    sessionStorage.removeItem(VERIFIED);sessionStorage.setItem(PENDING,panel);
    try{
      SMD21Auth.saveConsent?.();
      await SMD21CloudAuth.startGoogleSignIn('/suhail-labs/admin-login.html?oauth=return',{chooseAnother:true,sessionOnly:true});
    }catch{
      sessionStorage.removeItem(PENDING);
      status('Secure Google sign-in could not be started. Please try again.','bad');
    }
  }
  $('#verifyCloudAdmin')?.addEventListener('click',begin);
  complete();
})();