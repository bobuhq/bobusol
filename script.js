const intro=document.getElementById('intro');
const enter=document.getElementById('enterBtn');
enter.addEventListener('click',()=>{
  intro.classList.add('hidden');
  document.body.classList.remove('locked');
  setTimeout(()=>intro.remove(),850);
});

const menu=document.querySelector('.menu');
const nav=document.querySelector('.header nav');
menu.addEventListener('click',()=>nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('visible')});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const canvas=document.getElementById('stars');
const ctx=canvas.getContext('2d');
let stars=[];
function resize(){
  canvas.width=innerWidth*devicePixelRatio;
  canvas.height=innerHeight*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  stars=Array.from({length:Math.min(190,Math.floor(innerWidth/6))},()=>({
    x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.2,s:Math.random()*.16+.035
  }));
}
function animate(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  ctx.fillStyle='rgba(255,255,255,.76)';
  stars.forEach(star=>{
    star.y+=star.s;
    if(star.y>innerHeight){star.y=0;star.x=Math.random()*innerWidth}
    ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill();
  });
  requestAnimationFrame(animate);
}
addEventListener('resize',resize);resize();animate();

const roadmap=document.querySelector('.galaxy-road');
const ship=document.getElementById('ship');
function moveShip(){
  if(!roadmap||!ship)return;
  const rect=roadmap.getBoundingClientRect();
  const progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight+rect.height)));
  ship.style.left=`calc(${progress*100}% - 18px)`;
}
addEventListener('scroll',moveShip,{passive:true});moveShip();




// BOBU Genesis Portal v1.5 — Supabase live mode with safe local preview fallback.
(() => {
  const STORAGE_KEY='bobuGenesisRegistrationV15';
  const config=window.BOBU_CONFIG||{};
  const MAX_MEMBERS=Number(config.maxGenesisMembers)||1000;
  const form=document.getElementById('genesisForm');
  if(!form) return;

  const registrationCard=document.getElementById('registrationCard');
  const memberCard=document.getElementById('memberCard');
  const formStatus=document.getElementById('formStatus');
  const databaseStatus=document.getElementById('databaseStatus');
  const terms=document.getElementById('termsDialog');
  const fields={
    bobonautName:document.getElementById('bobonautName'),
    walletAddress:document.getElementById('walletAddress'),
    xUsername:document.getElementById('xUsername'),
    telegramUsername:document.getElementById('telegramUsername'),
    instagramUsername:document.getElementById('instagramUsername')
  };

  const hasLiveConfig=Boolean(config.supabaseUrl&&config.supabaseAnonKey&&window.supabase);
  const db=hasLiveConfig?window.supabase.createClient(config.supabaseUrl,config.supabaseAnonKey):null;
  let liveCount=0;

  const cleanUsername=value=>value.trim().replace(/^@+/, '').toLowerCase();
  const looksLikeSolanaAddress=value=>/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
  const validUsername=value=>/^[A-Za-z0-9_.]{2,30}$/.test(cleanUsername(value));
  const escapeText=value=>String(value).replace(/[<>]/g,'');

  function setDbStatus(message,state='preview'){
    databaseStatus.textContent=message;
    databaseStatus.className=`database-status ${state}`;
  }

  function showError(input,message){
    input.classList.toggle('invalid',Boolean(message));
    const error=input.parentElement.querySelector('.field-error');
    if(error) error.textContent=message||'';
  }

  function validate(){
    let ok=true;
    const name=fields.bobonautName.value.trim();
    if(name.length<2){showError(fields.bobonautName,'Use at least 2 characters.');ok=false}else showError(fields.bobonautName,'');
    if(!looksLikeSolanaAddress(fields.walletAddress.value)){showError(fields.walletAddress,'Enter a valid public Solana address.');ok=false}else showError(fields.walletAddress,'');
    ['xUsername','telegramUsername','instagramUsername'].forEach(key=>{
      if(!validUsername(fields[key].value)){showError(fields[key],'Enter a valid public username.');ok=false}else showError(fields[key],'');
    });
    if(!document.getElementById('termsAccepted').checked){formStatus.textContent='Please accept the Genesis Terms.';ok=false}else formStatus.textContent='';
    return ok;
  }

  function updateCounter(total=0){
    total=Math.max(0,Math.min(MAX_MEMBERS,Number(total)||0));
    document.getElementById('memberCount').textContent=total.toLocaleString();
    document.getElementById('spotsRemaining').textContent=`${Math.max(0,MAX_MEMBERS-total).toLocaleString()} spots remaining`;
    document.getElementById('memberProgress').style.width=`${(total/MAX_MEMBERS)*100}%`;
  }

  async function refreshLiveCount(){
    if(!db){
      const saved=localStorage.getItem(STORAGE_KEY);
      updateCounter(saved?1:0);
      setDbStatus('Preview mode — add Supabase details in config.js before public launch.','preview');
      return;
    }
    const {count,error}=await db.from('genesis_members').select('id',{count:'exact',head:true}).eq('status','genesis_member');
    if(error){
      setDbStatus('Portal database could not be reached. Check config.js and RLS policies.','error');
      updateCounter(0);
      return;
    }
    liveCount=count||0;
    updateCounter(liveCount);
    setDbStatus('Live Genesis database connected.','online');
  }

  function renderMember(data){
    document.getElementById('memberName').textContent=escapeText(data.bobonautName);
    document.getElementById('genesisId').textContent=data.genesisId;
    document.getElementById('memberWallet').textContent=`${data.walletAddress.slice(0,6)}…${data.walletAddress.slice(-6)}`;
    document.getElementById('registrationDate').textContent=new Date(data.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
    const note=document.getElementById('memberSyncNote');
    if(note) note.textContent=data.live?'Your registration is connected to the official Genesis database.':'Preview mode: this registration is stored only on this device until Supabase is configured.';
    registrationCard.hidden=true;
    memberCard.hidden=false;
  }

  async function registerLive(payload){
    const {data,error}=await db.from('genesis_members').insert({
      bobonaut_name:payload.bobonautName,
      wallet_address:payload.walletAddress,
      x_username:payload.xUsername,
      telegram_username:payload.telegramUsername,
      instagram_username:payload.instagramUsername,
      terms_version:'1.0'
    }).select('id,status,created_at').single();

    if(error){
      if(error.code==='23505') throw new Error('This wallet or social username is already registered.');
      throw new Error(error.message||'Registration could not be completed.');
    }

    return {
      ...payload,
      genesisId:data.status==='waitlist'?'WAITLIST':`#${String(data.id).padStart(6,'0')}`,
      createdAt:data.created_at,
      live:true,
      status:data.status
    };
  }

  function registerPreview(payload){
    return {
      ...payload,
      genesisId:'#000001',
      createdAt:new Date().toISOString(),
      live:false,
      status:'preview'
    };
  }

  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved){
    try{renderMember(JSON.parse(saved))}catch{localStorage.removeItem(STORAGE_KEY)}
  }
  refreshLiveCount();

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!validate()) return;
    const submit=form.querySelector('[type=submit]');
    submit.disabled=true;
    formStatus.className='form-status';
    formStatus.textContent=hasLiveConfig?'Registering securely…':'Saving preview registration…';

    const payload={
      bobonautName:fields.bobonautName.value.trim(),
      walletAddress:fields.walletAddress.value.trim(),
      xUsername:cleanUsername(fields.xUsername.value),
      telegramUsername:cleanUsername(fields.telegramUsername.value),
      instagramUsername:cleanUsername(fields.instagramUsername.value)
    };

    try{
      const registration=hasLiveConfig?await registerLive(payload):registerPreview(payload);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(registration));
      formStatus.textContent=registration.status==='waitlist'?'Genesis capacity is full. You joined the waitlist.':'Registration completed.';
      formStatus.className='form-status success';
      renderMember(registration);
      await refreshLiveCount();
      memberCard.scrollIntoView({behavior:'smooth',block:'center'});
    }catch(error){
      formStatus.textContent=error.message;
      formStatus.className='form-status error';
    }finally{
      submit.disabled=false;
    }
  });

  Object.values(fields).forEach(input=>input.addEventListener('input',()=>showError(input,'')));
  document.getElementById('editRegistration').addEventListener('click',()=>{
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    Object.keys(fields).forEach(key=>{if(data[key])fields[key].value=key.includes('Username')?'@'+data[key]:data[key]});
    memberCard.hidden=true;registrationCard.hidden=false;
  });
  document.getElementById('openTerms').addEventListener('click',()=>terms.showModal());
  document.getElementById('closeTerms').addEventListener('click',()=>terms.close());
  document.getElementById('acceptTerms').addEventListener('click',()=>{document.getElementById('termsAccepted').checked=true;terms.close()});
  terms.addEventListener('click',event=>{if(event.target===terms)terms.close()});
})();
