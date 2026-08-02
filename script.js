/* ==========================================================================
   BharatKavach — Single-file prototype (frontend + simulated backend)
   All "backend" state lives in localStorage. No real network calls.
   ========================================================================== */
window.KS = window.KS || {};

/* ---------------- Utilities ---------------- */
KS.util = {
  uid(prefix){ return (prefix||'id') + '-' + Math.random().toString(36).slice(2,9); },
  timeAgo(mins){ if (mins < 60) return mins + ' min ago'; if (mins < 1440) return Math.floor(mins/60) + ' hr ago'; return Math.floor(mins/1440) + ' d ago'; },
  escapeHtml(str){ return String(str==null?'':str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); },
  initials(name){ if(!name) return '?'; return name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(); },
  // NOT real cryptography — this is a UI prototype, not a security system.
  simpleHash(str){ let h = 0; str = String(str); for (let i=0;i<str.length;i++){ h = (Math.imul(31,h) + str.charCodeAt(i))|0; } return 'h'+Math.abs(h).toString(36)+str.length; }
};
KS.tone = {
  css(tone){
    const map = {
      red:{fg:'var(--red)',bg:'var(--red-glow)'}, blue:{fg:'var(--brand)',bg:'var(--brand-soft)'},
      emerald:{fg:'var(--emerald)',bg:'var(--emerald-soft)'}, amber:{fg:'var(--amber)',bg:'var(--amber-soft)'},
      gray:{fg:'var(--text-dim)',bg:'var(--surface-3)'}
    };
    return map[tone] || map.blue;
  }
};

/* ---------------- Storage layer (simulated backend) ---------------- */
KS.db = {
  _get(key, fallback){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; } },
  _set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(e){ return false; } },
  getUsers(){ return this._get('ks_users', {}); },
  saveUsers(users){ this._set('ks_users', users); },
  getSession(){ return this._get('ks_session', null); },
  setSession(userId){ this._set('ks_session', userId); },
  clearSession(){ localStorage.removeItem('ks_session'); },
  getUser(id){ const users = this.getUsers(); return users[id] || null; },
  saveUser(user){ const users = this.getUsers(); users[user.id] = user; this.saveUsers(users); },
  getDirectoryEdits(){ return this._get('ks_directory_edits', {}); }, // { cityKey: { overrides:{id:{...}}, custom:[...], removed:[id,...] } }
  saveDirectoryEdits(edits){ this._set('ks_directory_edits', edits); },
  getChecklistState(){ return this._get('ks_checklist_state', null); },
  saveChecklistState(arr){ this._set('ks_checklist_state', arr); }
};

/* ---------------- Cities ---------------- */
KS.CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Kolkata','Chennai','Chandigarh','Zirakpur','Panchkula','Mohali','Jaipur','Lucknow','Pune','Ahmedabad','Indore','Amritsar'];

/* National, standardised helpline numbers — accurate across every Indian city (ERSS-112). */
KS.NATIONAL_NUMBERS = [
  { label:'National Emergency Number', number:'112' },
  { label:'Police', number:'100' },
  { label:'Fire', number:'101' },
  { label:'Ambulance', number:'102 / 108' },
  { label:'Women Helpline', number:'1091 / 181' },
  { label:'Child Helpline', number:'1098' },
  { label:'Disaster Management', number:'1078' },
  { label:'Cyber Crime Helpline', number:'1930' },
  { label:'Senior Citizen Helpline', number:'14567' },
  { label:'Road Accident Emergency', number:'1073' }
];

KS.EMERGENCY_CATEGORIES = [
  { id:'police', label:'Police', icon:'fa-user-shield', tone:'blue', number:'100' },
  { id:'ambulance', label:'Ambulance', icon:'fa-truck-medical', tone:'red', number:'108' },
  { id:'fire', label:'Fire Brigade', icon:'fa-fire-flame-curved', tone:'amber', number:'101' },
  { id:'women', label:'Women Safety', icon:'fa-person-dress', tone:'emerald', number:'1091' },
  { id:'child', label:'Child Emergency', icon:'fa-child-reaching', tone:'blue', number:'1098' }
];

KS.EMERGENCY_PROCEDURES = [
  { title:'During an Earthquake', icon:'fa-house-crack', steps:['Drop, Cover, and Hold On','Stay away from windows & heavy furniture','Move to open ground if outdoors','Avoid elevators after tremors'] },
  { title:'In Case of Fire', icon:'fa-fire', steps:['Alert others immediately','Use stairs, never elevators','Stay low to avoid smoke inhalation','Call 101 once safe'] },
  { title:'Flood Safety', icon:'fa-water', steps:['Move to higher ground','Avoid walking through moving water','Disconnect electrical appliances','Keep emergency kit ready'] },
  { title:'Medical Emergency', icon:'fa-heart-pulse', steps:['Check responsiveness & breathing','Call 108 for ambulance','Begin CPR if trained','Keep patient warm & calm'] }
];

KS.EMERGENCY_CHECKLIST_DEFAULT = [
  'Emergency contact list saved & shared with family',
  'First-aid kit stocked and accessible',
  'Torch, power bank & essential medicines ready',
  'Important documents digitised in Smart Profile',
  'Evacuation route known for home & workplace',
  'Family meeting point decided in advance'
];

KS.LANGUAGES = ['English','हिंदी (Hindi)','বাংলা (Bengali)','தமிழ் (Tamil)','తెలుగు (Telugu)','मराठी (Marathi)','ગુજરાતી (Gujarati)','ਪੰਜਾਬੀ (Punjabi)'];

/* ---------------- Directory seed generator (per city) ----------------
   National helpline numbers above are accurate everywhere. The institution
   NAMES below are real, well-known public-safety bodies for each city; direct
   line numbers are shown in local-format but are illustrative demo values —
   the whole point of this directory is that every entry is editable, so real
   verified numbers can be filled in per deployment. */
KS.CITY_INSTITUTIONS = {
  Mumbai: { state:'Maharashtra', std:'022', police:'Mumbai Police Commissionerate', hospital:'KEM Hospital, Parel', hospital2:'Sion Hospital (LTMGH)', fire:'Mumbai Fire Brigade — HQ, Byculla', blood:'Red Cross Blood Bank, Mumbai', cyber:'Mumbai Police Cyber Crime Cell, BKC' },
  Delhi: { state:'Delhi (NCT)', std:'011', police:'Delhi Police Headquarters, ITO', hospital:'AIIMS Trauma Centre', hospital2:'Safdarjung Hospital', fire:'Delhi Fire Service — HQ, Connaught Lane', blood:'Rotary Blood Bank, Sardar Patel Marg', cyber:'Delhi Police Cyber Crime Cell, Mandir Marg' },
  Bangalore: { state:'Karnataka', std:'080', police:'Bengaluru City Police Commissionerate', hospital:'Victoria Hospital, Fort', hospital2:'Bowring & Lady Curzon Hospital', fire:'Karnataka Fire & Emergency Services — HQ', blood:'Bangalore Medical Services Trust Blood Bank', cyber:'CEN Cyber Crime Police Station, Bengaluru' },
  Hyderabad: { state:'Telangana', std:'040', police:'Hyderabad City Police Commissionerate', hospital:'Osmania General Hospital', hospital2:'Gandhi Hospital, Secunderabad', fire:'Telangana State Disaster Response & Fire Services — HQ', blood:'Indian Red Cross Blood Bank, Hyderabad', cyber:'Hyderabad Cyber Crime Police Station' },
  Kolkata: { state:'West Bengal', std:'033', police:'Kolkata Police Headquarters, Lalbazar', hospital:'SSKM Hospital (IPGMER)', hospital2:'Calcutta Medical College & Hospital', fire:'West Bengal Fire & Emergency Services — HQ', blood:'Kolkata Red Cross Blood Bank', cyber:'Kolkata Police Cyber Crime PS' },
  Chennai: { state:'Tamil Nadu', std:'044', police:'Greater Chennai Police Commissionerate', hospital:'Rajiv Gandhi Govt. General Hospital', hospital2:'Stanley Medical College Hospital', fire:'Tamil Nadu Fire & Rescue Services — HQ', blood:'Chennai Red Cross Blood Bank', cyber:'Chennai City Cyber Crime Cell' },
  Chandigarh: { state:'Chandigarh (UT)', std:'0172', police:'Chandigarh Police Headquarters, Sector 9', hospital:'PGIMER, Sector 12', hospital2:'Government Multi-Specialty Hospital, Sector 16', fire:'Chandigarh Fire Brigade — Sector 11', blood:'Red Cross Blood Bank, Sector 16', cyber:'Chandigarh Cyber Crime Cell, Sector 11' },
  Zirakpur: { state:'Punjab (SAS Nagar)', std:'0172', police:'Zirakpur City Police Station', hospital:'Government Multi-Specialty Hospital, Sector 16, Chandigarh (nearest)', hospital2:'Civil Hospital, Dhakoli', fire:'Zirakpur Municipal Fire Station', blood:'Tricity Blood Bank Network, Zirakpur', cyber:'SAS Nagar (Mohali) Cyber Crime Cell' },
  Panchkula: { state:'Haryana', std:'0172', police:'Panchkula Police Headquarters, Sector 1', hospital:'Civil Hospital, Sector 6, Panchkula', hospital2:'PGIMER, Sector 12, Chandigarh (nearest tertiary)', fire:'Panchkula Fire Station, Sector 5', blood:'Red Cross Blood Bank, Panchkula', cyber:'Haryana State Cyber Crime Cell, Panchkula' },
  Mohali: { state:'Punjab (SAS Nagar)', std:'0172', police:'SAS Nagar (Mohali) Police Headquarters, Phase 8', hospital:'Government Multi-Specialty Hospital (GMSH-16), nearest', hospital2:'Civil Hospital, Phase 6, Mohali', fire:'Mohali Fire Brigade, Phase 7', blood:'Red Cross Blood Bank, Mohali', cyber:'Punjab Cyber Crime Cell, SAS Nagar' },
  Jaipur: { state:'Rajasthan', std:'0141', police:'Jaipur Police Commissionerate', hospital:'Sawai Man Singh (SMS) Hospital', hospital2:'Jaipuria Hospital', fire:'Rajasthan Fire Service — Jaipur HQ', blood:'Red Cross Blood Bank, Jaipur', cyber:'Rajasthan Cyber Crime Police Station, Jaipur' },
  Lucknow: { state:'Uttar Pradesh', std:'0522', police:'Lucknow Police Commissionerate', hospital:'King George\'s Medical University (KGMU)', hospital2:'Balrampur Hospital', fire:'UP Fire Service — Lucknow HQ', blood:'Red Cross Blood Bank, Lucknow', cyber:'UP Cyber Crime Cell, Lucknow' },
  Pune: { state:'Maharashtra', std:'020', police:'Pune Police Commissionerate', hospital:'Sassoon General Hospital', hospital2:'Pune Municipal Corporation Hospital', fire:'Pune Municipal Fire Brigade — HQ', blood:'Janakalyan Blood Bank, Pune', cyber:'Pune Cyber Crime Cell' },
  Ahmedabad: { state:'Gujarat', std:'079', police:'Ahmedabad Police Commissionerate', hospital:'Civil Hospital, Asarwa', hospital2:'V.S. General Hospital', fire:'Ahmedabad Fire & Emergency Services — HQ', blood:'Red Cross Blood Bank, Ahmedabad', cyber:'Gujarat Cyber Crime Cell, Ahmedabad' },
  Indore: { state:'Madhya Pradesh', std:'0731', police:'Indore Police Commissionerate', hospital:'Maharaja Yeshwantrao (MY) Hospital', hospital2:'Choithram Hospital & Research Centre', fire:'MP Fire Service — Indore HQ', blood:'Red Cross Blood Bank, Indore', cyber:'MP Cyber Crime Cell, Indore' },
  Amritsar: { state:'Punjab', std:'0183', police:'Amritsar Police Commissionerate', hospital:'Guru Nanak Dev Hospital', hospital2:'Government Medical College Hospital, Amritsar', fire:'Punjab Fire Service — Amritsar HQ', blood:'Red Cross Blood Bank, Amritsar', cyber:'Punjab Cyber Crime Cell, Amritsar' }
};

KS.getCityDirectorySeed = function(city){
  const c = KS.CITY_INSTITUTIONS[city] || KS.CITY_INSTITUTIONS.Delhi;
  const mk = (n) => c.std + '-XXXX-' + String(1000+n).slice(-4);
  return [
    { id:'police-1', category:'Police', name:c.police, phone:mk(1), email:'control-room@' + city.toLowerCase() + 'police.gov.in', address:city + ', ' + c.state, hours:'24 x 7', services:['FIR Filing','Lost & Found','Traffic Assistance'], demo:true },
    { id:'hosp-1', category:'Hospitals', name:c.hospital, phone:mk(2), email:'info@' + city.toLowerCase() + 'hospital.gov.in', address:city + ', ' + c.state, hours:'24 x 7 Emergency', services:['Trauma Care','Ambulance','ICU'], demo:true },
    { id:'hosp-2', category:'Hospitals', name:c.hospital2, phone:mk(3), email:'', address:city + ', ' + c.state, hours:'24 x 7 Emergency', services:['General Ward','Emergency Care'], demo:true },
    { id:'fire-1', category:'Fire Stations', name:c.fire, phone:'101', email:'', address:city + ', ' + c.state, hours:'24 x 7', services:['Fire Rescue','Building Safety Audit'], demo:true },
    { id:'women-1', category:'Women Helplines', name:'Women Helpline — ' + city, phone:'1091 / 181', email:'', address:city + ', ' + c.state, hours:'24 x 7', services:['Counselling','Legal Aid','Anonymous Reporting'], demo:false },
    { id:'child-1', category:'Child Helplines', name:'CHILDLINE — ' + city, phone:'1098', email:'support@childlineindia.org.in', address:city + ', ' + c.state, hours:'24 x 7', services:['Rescue','Rehabilitation','Counselling'], demo:false },
    { id:'cyber-1', category:'Cyber Crime', name:c.cyber, phone:'1930', email:'', address:city + ', ' + c.state, hours:'24 x 7 online, Mon–Sat walk-in', services:['Fraud Reporting','Digital Evidence','Account Recovery Aid'], demo:false },
    { id:'blood-1', category:'Blood Banks', name:c.blood, phone:mk(4), email:'', address:city + ', ' + c.state, hours:'8 AM – 8 PM', services:['Blood Donation','Emergency Supply'], demo:true }
  ];
};
KS.DIRECTORY_CATEGORIES = ['All','Police','Hospitals','Fire Stations','Women Helplines','Child Helplines','Cyber Crime','Blood Banks'];
KS.CATEGORY_ICON = { Police:'fa-user-shield', Hospitals:'fa-hospital', 'Fire Stations':'fa-fire-flame-curved', 'Women Helplines':'fa-person-dress', 'Child Helplines':'fa-child-reaching', 'Cyber Crime':'fa-laptop-code', 'Blood Banks':'fa-droplet' };

/* ---------------- Alerts (mock feed) ---------------- */
KS.ALERTS = [
  { id:'AL-1042', title:'Flash Flood Warning — Riverside Colonies', desc:'Rising water levels near low-lying colonies. Residents advised to move to higher ground.', priority:'critical', category:'Flood', icon:'fa-water', time:18 },
  { id:'AL-1041', title:'Heatwave Advisory', desc:'Temperatures expected to cross 42°C. Avoid outdoor activity between 12–4 PM.', priority:'high', category:'Weather Warning', icon:'fa-temperature-high', time:55 },
  { id:'AL-1040', title:'Missing Child Alert — Local Market Area', desc:'8-year-old boy last seen near a local market. Wearing blue school uniform.', priority:'critical', category:'Missing Person', icon:'fa-person-circle-question', time:74 },
  { id:'AL-1039', title:'Government Advisory: Cyclone Watch', desc:'IMD has issued a cyclone watch for the coastline. Fishing activities suspended.', priority:'medium', category:'Government Advisory', icon:'fa-bullhorn', time:130 },
  { id:'AL-1038', title:'Minor Seismic Activity Detected', desc:'A 3.8 magnitude tremor was recorded. No damage reported. Authorities monitoring aftershocks.', priority:'low', category:'Earthquake', icon:'fa-house-crack', time:210 },
  { id:'AL-1037', title:'Thunderstorm Alert', desc:'Heavy rain and lightning expected this evening. Avoid open fields and tall structures.', priority:'medium', category:'Storm', icon:'fa-bolt', time:260 },
  { id:'AL-1036', title:'Senior Citizen Missing', desc:'72-year-old woman with mild dementia missing since morning. Last seen wearing a green saree.', priority:'high', category:'Missing Person', icon:'fa-person-circle-question', time:300 },
  { id:'AL-1035', title:'Air Quality Advisory', desc:'AQI levels have crossed 350 (Severe). Sensitive groups advised to stay indoors.', priority:'medium', category:'Government Advisory', icon:'fa-smog', time:400 }
];

/* ---------------- Kavach AI Chatbot ---------------- */
KS.GUIDE_STEPS = {
  CPR:['Check responsiveness and call for help','Place hands at the center of chest','Push hard & fast — 100-120 compressions/min','Give rescue breaths if trained','Continue until help arrives'],
  Burns:['Cool the burn under running water for 20 min','Remove tight clothing/jewellery near burn','Cover loosely with sterile, non-fluffy cloth','Do NOT apply ice, butter, or toothpaste','Seek medical help for severe burns'],
  Choking:['Ask "Are you choking?"','Give 5 back blows between shoulder blades','Give 5 abdominal thrusts (Heimlich)','Repeat until object is expelled','Call 108 if person becomes unresponsive'],
  'Heart Attack':['Call 108 immediately','Help the person sit down & stay calm','Loosen tight clothing','Give aspirin if available & not allergic','Be ready to perform CPR if unresponsive'],
  'Snake Bite':['Keep the person calm & still','Keep bitten limb below heart level','Remove tight clothing/jewellery','Do NOT cut, suck, or apply ice','Get to hospital immediately'],
  'Electric Shock':['Turn off power source before touching','Use a non-conductive object to separate','Check breathing & pulse','Begin CPR if trained and needed','Call 108 for medical assistance'],
  Fire:['Alert everyone & evacuate calmly','Stay low to avoid smoke','Never use elevators','Close doors behind you','Call 101 once you are safe'],
  Flood:['Move to higher ground immediately','Avoid walking/driving through flood water','Turn off electricity & gas','Keep emergency kit accessible','Monitor official advisories'],
  Earthquake:['Drop, Cover, and Hold On','Stay away from windows & shelves','If outdoors, move to open area','After shaking stops, check for injuries','Be prepared for aftershocks'],
  Heatstroke:['Move person to a cool/shaded area','Remove excess clothing','Cool with water/wet cloths','Give sips of water if conscious','Seek emergency care immediately']
};
KS.AI_GUIDE_CARDS = [
  { title:'CPR', icon:'fa-heart-pulse', tone:'red', desc:'Step-by-step CPR guidance for adults, children & infants.' },
  { title:'Burns', icon:'fa-fire-flame-simple', tone:'amber', desc:'Cooling steps and when to seek emergency care.' },
  { title:'Choking', icon:'fa-lungs', tone:'blue', desc:'Heimlich manoeuvre instructions.' },
  { title:'Heart Attack', icon:'fa-heart-circle-exclamation', tone:'red', desc:'Recognise symptoms early and act fast.' },
  { title:'Snake Bite', icon:'fa-worm', tone:'emerald', desc:'What to do — and what NOT to do.' },
  { title:'Electric Shock', icon:'fa-bolt', tone:'amber', desc:'Safely disconnect power and respond.' },
  { title:'Fire', icon:'fa-fire', tone:'red', desc:'Evacuation priorities and smoke safety.' },
  { title:'Flood', icon:'fa-water', tone:'blue', desc:'Safety measures during rising water.' },
  { title:'Earthquake', icon:'fa-house-crack', tone:'gray', desc:'Drop, cover & hold on — full checklist.' },
  { title:'Heatstroke', icon:'fa-temperature-high', tone:'amber', desc:'Cooling techniques and hydration.' }
];
KS.QUICK_PROMPT_CHIPS = [' Fire Safety',' First Aid',' Electric Shock',' Snake Bite',' Flood Safety','Earthquake',' Heatstroke',' Road Accident'];
KS.SUGGESTED_QUESTIONS = ['What should I do during a fire in my building?','How do I perform CPR on an adult?','Someone fainted near me, what should I do?','How to report a road accident quickly?','What are signs of a heart attack?'];

/* ---------------- Vehicle Information (mock DB) ---------------- */
KS.VEHICLE_DB = {
  'DL3SAB4521': { number:'DL 3S AB 4521', owner:'Rahul Verma', model:'Honda Activa 6G', color:'Pearl White', year:'2022', regDate:'14 Mar 2022', fuel:'Petrol', status:'Active', insurance:'Valid till Mar 2027', rc:'Valid', chassis:'MBLHA10EJKL45210', engine:'JF56E9034812' },
  'MH12DE1433': { number:'MH 12 DE 1433', owner:'Anjali Deshmukh', model:'Maruti Suzuki Swift', color:'Metallic Red', year:'2020', regDate:'02 Jul 2020', fuel:'Petrol', status:'Active', insurance:'Valid till Jul 2026', rc:'Valid', chassis:'MA3ERLF1S00123456', engine:'K12M8899021' },
  'KA05MJ7788': { number:'KA 05 MJ 7788', owner:'Suresh Kumar', model:'Tata Nexon EV', color:'Signature Teal', year:'2023', regDate:'19 Nov 2023', fuel:'Electric', status:'Flagged — Reported Stolen', insurance:'Valid till Nov 2028', rc:'Valid', chassis:'MAT625522PLR33210', engine:'EV-MOTOR-2201' }
};

/* ---------------- Evidence Intelligence (per-session mock) ---------------- */
KS.EVIDENCE_FILES_SEED = [
  { name:'CCTV_MainGate_2040.mp4', size:'124 MB', status:'Enhanced', icon:'fa-video' },
  { name:'witness_statement_audio.mp3', size:'8.2 MB', status:'Transcribed', icon:'fa-file-audio' },
  { name:'scene_photo_01.jpg', size:'3.4 MB', status:'Analyzed', icon:'fa-image' }
];
KS.EVIDENCE_TIMELINE = [
  { time:'08:02 PM', event:'Suspect vehicle enters frame — Main Gate CCTV' },
  { time:'08:07 PM', event:'Object removed from parked vehicle (motion detected)' },
  { time:'08:09 PM', event:'Suspect exits via east lane — plate partially visible' },
  { time:'08:31 PM', event:'Complainant reports theft to nearby shopkeeper' }
];
KS.CASE_SAMPLE = {
  id:'CASE-2026-0417', title:'Two-Wheeler Theft — Local Market', status:'Active Investigation',
  timeline:[
    { time:'Day 1, 08:31 PM', title:'Incident Reported', desc:'Complainant filed a report via Kavach AI.' },
    { time:'Day 1, 09:15 PM', title:'FIR Registered', desc:'IPC 379 — Theft, registered at local police station.' },
    { time:'Day 2, 11:00 AM', title:'CCTV Evidence Collected', desc:'3 camera feeds retrieved from nearby shops.' },
    { time:'Day 3, 02:30 PM', title:'Suspect Vehicle Identified', desc:'Partial plate match found via AI enhancement.' }
  ],
  recommendations:['Cross-check partial plate against regional vehicle database','Request additional CCTV feeds from adjoining lanes','Interview shop owners for witness statements']
};

/* ---------------- Weather (illustrative, per city) ---------------- */
KS.CITY_WEATHER = function(city){
  const seedNum = city.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const temp = 26 + (seedNum % 12);
  const conds = ['Partly Cloudy','Clear Sky','Humid','Light Haze','Sunny'];
  return { location: city + ', India', temp, condition: conds[seedNum % conds.length], icon:'fa-cloud-sun', humidity: 45 + (seedNum % 35), wind: 8 + (seedNum % 18), advisory: temp > 34 ? 'Heat advisory in effect until 6 PM' : 'No active weather advisories' };
};

/* ---------------- Toast & Modal helpers ---------------- */
KS.toast = function(message, opts){
  opts = opts || {};
  const container = document.getElementById('toast-container');
  const tone = opts.tone || 'blue';
  const c = KS.tone.css(tone);
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role','status');
  el.innerHTML = `<div style="width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${c.bg};color:${c.fg};flex-shrink:0;"><i class="fa-solid ${opts.icon||'fa-circle-check'}"></i></div><span>${KS.util.escapeHtml(message)}</span>`;
  container.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .3s ease, transform .3s ease'; el.style.opacity='0'; el.style.transform='translateX(30px)'; setTimeout(()=>el.remove(),300); }, opts.duration || 3200);
};
KS.openModal = function(html, opts){
  opts = opts || {};
  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = opts.id || 'dyn-modal';
  overlay.innerHTML = `<div class="modal-box card-pad ${opts.large?'modal-lg':''}">${html}</div>`;
  root.innerHTML = '';
  root.appendChild(overlay);
  requestAnimationFrame(()=> overlay.classList.add('open'));
  overlay.addEventListener('click', (e)=>{ if (e.target === overlay) KS.closeModal(); });
  return overlay;
};
KS.closeModal = function(){ const root = document.getElementById('modal-root'); root.innerHTML=''; };
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') KS.closeModal(); });

/* Generic tab switcher: data-tab-group / data-tab-target */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-tab-target]');
  if (!btn) return;
  const group = btn.getAttribute('data-tab-group');
  const target = btn.getAttribute('data-tab-target');
  document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll(`[data-tab-panel="${group}"]`).forEach(p=>p.classList.add('hidden'));
  const panel = document.querySelector(`[data-tab-panel="${group}"][data-tab-id="${target}"]`);
  if (panel) panel.classList.remove('hidden');
  if (group === 'kavach-tabs' && target === 'threat' && !KS._threatChartsDrawn) Kavach.renderThreatEngine();
});

/* ---------------- AUTH MODULE ---------------- */
const Auth = {
  step: 1,
  contactRows: 0,
  familyRows: 0,

  init(){
    const cityOptions = KS.CITIES.map(c=>`<option value="${c}">${c}</option>`).join('');
    document.getElementById('login-city').innerHTML = '<option value="">Select your city</option>' + cityOptions;
    document.getElementById('su-city').innerHTML = '<option value="">Select your city</option>' + cityOptions;

    const users = KS.db.getUsers();
    const hasUsers = Object.keys(users).length > 0;
    this.switchTab(hasUsers ? 'login' : 'signup');
    if (this.contactRows === 0) this.addContactRow();
    if (this.familyRows === 0) this.addFamilyRow();
  },

  switchTab(which){
    document.getElementById('tab-btn-login').classList.toggle('active', which==='login');
    document.getElementById('tab-btn-signup').classList.toggle('active', which==='signup');
    document.getElementById('login-form').classList.toggle('active', which==='login');
    document.getElementById('signup-form').classList.toggle('active', which==='signup');
  },

  nextStep(fromStep){
    if (fromStep === 1){
      const name = document.getElementById('su-fullname').value.trim();
      const id = document.getElementById('su-id').value.trim();
      const pw = document.getElementById('su-password').value;
      const pw2 = document.getElementById('su-password2').value;
      if (!name){ KS.toast('Please enter your full name', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
      if (!id){ KS.toast('Please choose a user ID', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
      if (KS.db.getUser(id)){ KS.toast('That user ID is already taken', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
      if (!pw || pw.length < 4){ KS.toast('Password must be at least 4 characters', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
      if (pw !== pw2){ KS.toast('Passwords do not match', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
    }
    if (fromStep === 2){
      const phone = document.getElementById('su-phone').value.trim();
      const city = document.getElementById('su-city').value;
      if (!phone){ KS.toast('Please enter your phone number', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
      if (!city){ KS.toast('Please select your city', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
    }
    this.step = fromStep + 1;
    this.renderStep();
  },
  prevStep(fromStep){ this.step = fromStep - 1; this.renderStep(); },
  renderStep(){
    for (let i=1;i<=4;i++){
      document.getElementById('su-step-'+i).classList.toggle('active', i===this.step);
      document.getElementById('su-prog-'+i).classList.toggle('done', i<=this.step);
    }
  },

  addContactRow(vals){
    vals = vals || {};
    const wrap = document.createElement('div');
    wrap.className = 'dyn-row';
    wrap.style.gridTemplateColumns = '1fr';
    const rid = KS.util.uid('c');
    wrap.dataset.rid = rid;
    wrap.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input class="input" placeholder="Name" data-f="name" value="${KS.util.escapeHtml(vals.name||'')}">
        <input class="input" placeholder="Relation" data-f="relation" value="${KS.util.escapeHtml(vals.relation||'')}">
      </div>
      <div class="flex gap-2">
        <input class="input" placeholder="Phone" data-f="phone" value="${KS.util.escapeHtml(vals.phone||'')}">
        <button type="button" class="btn btn-icon btn-ghost dyn-row-remove" onclick="Auth.removeRow(this)"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    document.getElementById('su-contacts-list').appendChild(wrap);
    this.contactRows++;
  },
  addFamilyRow(vals){
    vals = vals || {};
    const wrap = document.createElement('div');
    wrap.className = 'dyn-row';
    const rid = KS.util.uid('f');
    wrap.dataset.rid = rid;
    wrap.innerHTML = `
      <div class="grid grid-cols-2 gap-2">
        <input class="input" placeholder="Name" data-f="name" value="${KS.util.escapeHtml(vals.name||'')}">
        <input class="input" placeholder="Relation (e.g. Mother)" data-f="relation" value="${KS.util.escapeHtml(vals.relation||'')}">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input class="input" placeholder="Phone" data-f="phone" value="${KS.util.escapeHtml(vals.phone||'')}">
        <input class="input" placeholder="Age" data-f="age" value="${KS.util.escapeHtml(vals.age||'')}">
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input class="input" placeholder="Usual Location" data-f="location" value="${KS.util.escapeHtml(vals.location||'')}">
        <input class="input" placeholder="Work / School" data-f="work" value="${KS.util.escapeHtml(vals.work||'')}">
      </div>
      <div class="flex gap-2">
        <input class="input" placeholder="Blood Group" data-f="blood" value="${KS.util.escapeHtml(vals.blood||'')}">
        <button type="button" class="btn btn-icon btn-ghost dyn-row-remove" onclick="Auth.removeRow(this)"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    document.getElementById('su-family-list').appendChild(wrap);
    this.familyRows++;
  },
  removeRow(btn){ btn.closest('.dyn-row').remove(); },

  readRows(containerId){
    const rows = document.querySelectorAll('#'+containerId+' .dyn-row');
    const out = [];
    rows.forEach(row => {
      const obj = { id: row.dataset.rid };
      row.querySelectorAll('[data-f]').forEach(inp => obj[inp.dataset.f] = inp.value.trim());
      if (obj.name) out.push(obj);
    });
    return out;
  },

  handleSignup(e){
    e.preventDefault();
    const id = document.getElementById('su-id').value.trim();
    const password = document.getElementById('su-password').value;
    const city = document.getElementById('su-city').value;
    if (!id || !password || !city){ KS.toast('Please complete all required fields', {tone:'amber', icon:'fa-triangle-exclamation'}); return false; }

    const contacts = this.readRows('su-contacts-list').map(c => ({ id:c.id, name:c.name, relation:c.relation||'Contact', phone:c.phone||'', primary:false }));
    if (contacts.length) contacts[0].primary = true;
    const family = this.readRows('su-family-list').map(f => ({ id:f.id, name:f.name, relation:f.relation||'Family', phone:f.phone||'', age:f.age||'', location:f.location||'', work:f.work||'', blood:f.blood||'', status:'Safe' }));

    const user = {
      id, passwordHash: KS.util.simpleHash(password), createdAt: Date.now(), city,
      profile: {
        fullName: document.getElementById('su-fullname').value.trim(),
        dob: document.getElementById('su-dob').value,
        gender: document.getElementById('su-gender').value,
        phone: document.getElementById('su-phone').value.trim(),
        altPhone: document.getElementById('su-altphone').value.trim(),
        email: document.getElementById('su-email').value.trim(),
        address: document.getElementById('su-address').value.trim(),
        work: document.getElementById('su-work').value.trim(),
        workAddress: document.getElementById('su-workaddress').value.trim(),
        usualLocation: document.getElementById('su-usualloc').value.trim(),
        bloodGroup: document.getElementById('su-blood').value,
        medical: document.getElementById('su-medical').value.trim(),
        language: 'English'
      },
      contacts, family,
      settings: { theme:'dark', contrast:'normal', textScale:1, reduceMotion:false, voiceMode:false, sidebarCollapsed:false,
        notifications:{ sos:true, weather:true, family:true, updates:false },
        privacy:{ shareProfile:true, anonymizedAI:true, auditLog:true, locationFamily:true },
        permissions:{ shareMedical:true, autoAlert:true, shareLocation:true, aiAnalysis:false } },
      checklist: KS.EMERGENCY_CHECKLIST_DEFAULT.map(()=>false),
      evidenceFiles: JSON.parse(JSON.stringify(KS.EVIDENCE_FILES_SEED)),
      incidents: []
    };
    KS.db.saveUser(user);
    KS.db.setSession(id);
    KS.toast('Account created — welcome to BharatKavach!', {tone:'emerald', icon:'fa-shield-check'});
    App.boot();
    return false;
  },

  handleLogin(e){
    e.preventDefault();
    const id = document.getElementById('login-id').value.trim();
    const password = document.getElementById('login-password').value;
    const city = document.getElementById('login-city').value;
    const user = KS.db.getUser(id);
    if (!user){ KS.toast('No account found with that ID', {tone:'red', icon:'fa-circle-exclamation'}); return false; }
    if (user.passwordHash !== KS.util.simpleHash(password)){ KS.toast('Incorrect password', {tone:'red', icon:'fa-circle-exclamation'}); return false; }
    if (city) { user.city = city; KS.db.saveUser(user); }
    KS.db.setSession(id);
    KS.toast('Welcome back, ' + (user.profile.fullName.split(' ')[0]||user.id) + '!', {tone:'emerald', icon:'fa-shield-check'});
    App.boot();
    return false;
  }
};
document.addEventListener('DOMContentLoaded', ()=> Auth.init());

/* ---------------- CURRENT USER STORE ---------------- */
const Store = {
  current(){ const uid = KS.db.getSession(); return uid ? KS.db.getUser(uid) : null; },
  save(user){ KS.db.saveUser(user); },
  update(mutator){ const u = this.current(); if (!u) return null; mutator(u); this.save(u); return u; },

  directoryFor(city){
    const seed = KS.getCityDirectorySeed(city);
    const edits = KS.db.getDirectoryEdits();
    const cityEdits = edits[city] || { overrides:{}, custom:[], removed:[] };
    let items = seed.filter(d => !cityEdits.removed.includes(d.id)).map(d => Object.assign({}, d, cityEdits.overrides[d.id]||{}));
    items = items.concat((cityEdits.custom||[]).map(d => Object.assign({}, d, cityEdits.overrides[d.id]||{})));
    return items;
  },
  saveDirectoryEntry(city, entry){
    const edits = KS.db.getDirectoryEdits();
    if (!edits[city]) edits[city] = { overrides:{}, custom:[], removed:[] };
    const seedIds = KS.getCityDirectorySeed(city).map(d=>d.id);
    if (seedIds.includes(entry.id)) edits[city].overrides[entry.id] = entry;
    else {
      const idx = edits[city].custom.findIndex(c=>c.id===entry.id);
      if (idx>=0) edits[city].custom[idx] = entry; else edits[city].custom.push(entry);
    }
    KS.db.saveDirectoryEdits(edits);
  },
  addDirectoryEntry(city, entry){
    const edits = KS.db.getDirectoryEdits();
    if (!edits[city]) edits[city] = { overrides:{}, custom:[], removed:[] };
    entry.id = KS.util.uid('custom');
    edits[city].custom.push(entry);
    KS.db.saveDirectoryEdits(edits);
  },
  removeDirectoryEntry(city, id){
    const edits = KS.db.getDirectoryEdits();
    if (!edits[city]) edits[city] = { overrides:{}, custom:[], removed:[] };
    if (edits[city].custom.some(c=>c.id===id)) edits[city].custom = edits[city].custom.filter(c=>c.id!==id);
    else edits[city].removed.push(id);
    KS.db.saveDirectoryEdits(edits);
  }
};

/* ---------------- APP (nav shell, theme, accessibility) ---------------- */
const NAV_ITEMS = [
  { id:'home', label:'Home', icon:'fa-house' },
  { id:'profile', label:'Smart Profile', icon:'fa-id-card-clip' },
  { id:'family', label:'Family Safety', icon:'fa-people-roof' },
  { id:'emergency', label:'Emergency Services', icon:'fa-triangle-exclamation' },
  { id:'directory', label:'Govt. Emergency Directory', icon:'fa-building-columns' },
  { id:'kavach', label:'Kavach AI', icon:'fa-brain' },
  { id:'alerts', label:'Emergency Alerts', icon:'fa-bell' },
  { id:'settings', label:'Settings', icon:'fa-gear' }
];
const PAGE_TITLES = { home:'Welcome back', profile:'Smart Citizen Profile', family:'Family Safety', emergency:'Emergency Services', directory:'Government Emergency Directory', kavach:'Kavach AI', alerts:'Emergency Alerts', settings:'Settings' };

const App = {
  activePage: 'home',

  boot(){
    const user = Store.current();
    if (!user){ this.showAuth(); return; }
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-root').style.display = 'block';
    this.applySettings(user);
    this.buildSidebar();
    this.buildTopbar();
    this.goTo('home');
    Kavach.resetCharts();
  },
  showAuth(){
    document.getElementById('app-root').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
    Auth.init();
  },
  logout(){
    KS.db.clearSession();
    KS.toast('Logged out', {tone:'blue', icon:'fa-right-from-bracket'});
    this.showAuth();
  },

  applySettings(user){
    const s = user.settings;
    document.documentElement.setAttribute('data-theme', s.theme || 'dark');
    document.documentElement.setAttribute('data-contrast', s.contrast || 'normal');
    document.documentElement.setAttribute('data-reduce-motion', s.reduceMotion ? '1' : '0');
    document.documentElement.style.setProperty('--text-scale', s.textScale || 1);
  },

  buildSidebar(){
    const user = Store.current();
    const collapsed = user.settings.sidebarCollapsed;
    const items = NAV_ITEMS.map(item => `
      <button class="nav-item ${item.id===this.activePage?'active':''}" data-nav="${item.id}" onclick="App.goTo('${item.id}')" title="${item.label}">
        <i class="fa-solid ${item.icon}"></i><span>${item.label}</span>
      </button>`).join('');
    const sidebarEl = document.getElementById('app-sidebar');
    sidebarEl.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fa-solid fa-shield-heart"></i></div>
        <div class="brand-text"><strong>BharatKavach</strong><span>Protect. Respond. Empower.</span></div>
      </div>
      <nav class="sidebar-nav">${items}</nav>
      <div class="sidebar-footer">
        <button class="sos-side-btn" id="sos-side-btn"><i class="fa-solid fa-triangle-exclamation"></i><span>Emergency SOS</span></button>
        <button id="sidebar-collapse-btn" class="sidebar-toggle-btn">
          <i class="fa-solid ${collapsed?'fa-angles-right':'fa-angles-left'}"></i>
          <span class="collapse-label">${collapsed?'':'Collapse'}</span>
        </button>
      </div>`;
    if (collapsed) sidebarEl.classList.add('collapsed'); else sidebarEl.classList.remove('collapsed');
    document.getElementById('sidebar-collapse-btn').addEventListener('click', ()=>{
      const isCollapsed = sidebarEl.classList.toggle('collapsed');
      Store.update(u => u.settings.sidebarCollapsed = isCollapsed);
      const icon = document.querySelector('#sidebar-collapse-btn i');
      icon.className = 'fa-solid ' + (isCollapsed?'fa-angles-right':'fa-angles-left');
      document.querySelector('.collapse-label').textContent = isCollapsed?'':'Collapse';
    });
    SOS.bind('sos-side-btn');
  },

  buildTopbar(){
    const user = Store.current();
    const title = PAGE_TITLES[this.activePage] || 'BharatKavach';
    const initials = KS.util.initials(user.profile.fullName || user.id);
    document.getElementById('app-topbar').innerHTML = `
      <div class="flex items-center gap-4 min-w-0">
        <button id="mobile-menu-btn" class="btn btn-icon btn-ghost lg:hidden"><i class="fa-solid fa-bars"></i></button>
        <div class="min-w-0">
          <h1 class="text-lg md:text-xl font-extrabold truncate" style="letter-spacing:-.3px;">${title}</h1>
          <p class="text-xs hidden sm:block" style="color:var(--text-faint);"><i class="fa-solid fa-location-dot mr-1"></i>${user.city} · <span style="color:var(--emerald);">
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button id="theme-toggle-btn" class="btn btn-icon btn-ghost" title="Toggle theme"><i class="fa-solid ${user.settings.theme==='light'?'fa-moon':'fa-sun'}" id="theme-icon"></i></button>
        <button id="contrast-toggle-btn" class="btn btn-icon btn-ghost" title="Toggle high contrast"><i class="fa-solid fa-circle-half-stroke"></i></button>
        <div class="relative">
          <button id="user-menu-btn" class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full" style="background:var(--surface-2); border:1px solid var(--border);">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style="background:linear-gradient(135deg,var(--brand),var(--red));">${initials}</div>
            <span class="text-sm font-semibold hidden sm:block">${(user.profile.fullName||user.id).split(' ')[0]}</span>
            <i class="fa-solid fa-chevron-down text-xs hidden sm:block" style="color:var(--text-faint);"></i>
          </button>
          <div id="user-dropdown" class="card glass hidden" style="position:absolute; right:0; top:52px; width:200px; z-index:70; padding:8px;">
            <button class="nav-item w-full" onclick="App.goTo('profile'); document.getElementById('user-dropdown').classList.add('hidden');"><i class="fa-solid fa-id-card-clip"></i><span>My Profile</span></button>
            <button class="nav-item w-full" onclick="App.goTo('settings'); document.getElementById('user-dropdown').classList.add('hidden');"><i class="fa-solid fa-gear"></i><span>Settings</span></button>
            <button class="nav-item w-full" style="color:var(--red);" onclick="App.logout()"><i class="fa-solid fa-right-from-bracket"></i><span>Log Out</span></button>
          </div>
        </div>
      </div>`;
    document.getElementById('theme-toggle-btn').addEventListener('click', ()=>{
      const next = document.documentElement.getAttribute('data-theme')==='light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      Store.update(u=>u.settings.theme=next);
      document.getElementById('theme-icon').className = 'fa-solid ' + (next==='light'?'fa-moon':'fa-sun');
    });
    document.getElementById('contrast-toggle-btn').addEventListener('click', ()=>{
      const next = document.documentElement.getAttribute('data-contrast')==='high' ? 'normal' : 'high';
      document.documentElement.setAttribute('data-contrast', next);
      Store.update(u=>u.settings.contrast=next);
      KS.toast('High contrast ' + (next==='high'?'enabled':'disabled'), {tone:'blue', icon:'fa-circle-half-stroke'});
    });
    document.getElementById('user-menu-btn').addEventListener('click', (e)=>{ e.stopPropagation(); document.getElementById('user-dropdown').classList.toggle('hidden'); });
    document.addEventListener('click', ()=> { const d=document.getElementById('user-dropdown'); if(d) d.classList.add('hidden'); });
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebarEl = document.getElementById('app-sidebar');
    const overlay = document.getElementById('mobile-overlay');
    mobileBtn.addEventListener('click', ()=>{ sidebarEl.classList.add('mobile-open'); overlay.classList.add('show'); });
    overlay.addEventListener('click', ()=>{ sidebarEl.classList.remove('mobile-open'); overlay.classList.remove('show'); });
  },

  goTo(pageId){
    this.activePage = pageId;
    document.querySelectorAll('.page-view').forEach(v=>v.classList.remove('active'));
    document.getElementById('view-'+pageId).classList.add('active');
    document.querySelectorAll('.nav-item[data-nav]').forEach(b=>b.classList.toggle('active', b.dataset.nav===pageId));
    document.getElementById('app-sidebar').classList.remove('mobile-open');
    document.getElementById('mobile-overlay').classList.remove('show');
    const titleEl = document.querySelector('#app-topbar h1');
    if (titleEl) titleEl.textContent = PAGE_TITLES[pageId] || 'BharatKavach';
    document.getElementById('page-content').scrollTop = 0;
    window.scrollTo(0,0);
    Pages.render(pageId);
  }
};

/* ---------------- SOS MODULE ---------------- */
const SOS = {
  bind(btnId){
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', ()=> this.activate());
  },
  activate(){
    const user = Store.current();
    const contact = (user.contacts && user.contacts[0]) ? user.contacts[0].name : 'your trusted contact';
    const html = `
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white" style="background:linear-gradient(135deg,var(--red),var(--red-dark));"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div><h3 class="font-bold text-lg">Emergency SOS Activated</h3><p class="text-xs" style="color:var(--text-faint);">Kavach AI is analysing your situation...</p></div>
      </div>
      <div id="sos-steps" class="flex flex-col gap-3 mb-5"></div>
      <div class="flex gap-3">
        <button class="btn btn-outline flex-1" onclick="KS.closeModal()">Cancel</button>
        <button class="btn btn-emergency flex-1" onclick="KS.closeModal(); KS.toast('${contact} and other trusted contacts have been notified.', {tone:'red', icon:'fa-check'})">Confirm &amp; Notify Contacts</button>
      </div>`;
    KS.openModal(html, {id:'sos-modal'});
    const steps = [
      { icon:'fa-microphone', text:'Listening &amp; analysing emergency type…' },
      { icon:'fa-brain', text:'Kavach AI identified emergency: <strong>Possible Medical Emergency</strong>' },
      { icon:'fa-file-lines', text:'Incident summary generated' },
      { icon:'fa-user-shield', text:'Nearest responder unit located — ETA 5 min' },
      { icon:'fa-share-nodes', text:'Ready to alert trusted contacts (awaiting your consent)' }
    ];
    const container = document.getElementById('sos-steps');
    if (!container) return;
    container.innerHTML = '';
    steps.forEach((s,i)=>{
      setTimeout(()=>{
        const c = document.getElementById('sos-steps'); if (!c) return;
        const row = document.createElement('div');
        row.className = 'flex items-center gap-3 fade-in-up';
        row.innerHTML = `<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:var(--brand-soft);color:var(--brand);"><i class="fa-solid ${s.icon} text-xs"></i></div><p class="text-sm" style="color:var(--text-dim);">${s.text}</p>`;
        c.appendChild(row);
      }, i*550);
    });
  }
};
function activateService(name, number){
  KS.toast(`Connecting you to ${name} (${number})…`, { tone:'red', icon:'fa-phone-volume' });
}

/* ---------------- PAGES ---------------- */
const Pages = {
  render(id){
    const fn = this['render_'+id];
    if (fn) fn.call(this);
  },

  render_home(){
    const user = Store.current();
    const w = KS.CITY_WEATHER(user.city);
    const alerts = KS.ALERTS.slice(0,3);
    const members = user.family || [];
    document.getElementById('view-home').innerHTML = `
      <section class="reveal mb-7 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <p class="text-sm font-semibold mb-1" style="color:var(--brand);"><i class="fa-solid fa-sun mr-1"></i> ${new Date().toLocaleDateString('en-IN',{weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
          <h2 class="text-3xl md:text-4xl font-extrabold" style="letter-spacing:-1px;">Namaste, ${KS.util.escapeHtml((user.profile.fullName||user.id).split(' ')[0])} </h2>
          <p class="section-sub mt-1">Your safety network is active in ${user.city}. Everything looks calm around you right now.</p>
        </div>
      </section>

      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div class="card card-pad card-hover lg:col-span-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold" style="color:var(--text-faint);"><i class="fa-solid fa-location-dot mr-1"></i>${w.location}</p>
              <h3 class="text-4xl font-extrabold mt-1">${w.temp}°C</h3>
              <p class="text-sm mt-1" style="color:var(--text-dim);">${w.condition}</p>
            </div>
            <i class="fa-solid ${w.icon} text-5xl" style="color:var(--amber);"></i>
          </div>
          <div class="divider my-4"></div>
          <div class="flex items-center justify-between text-xs" style="color:var(--text-dim);">
            <span><i class="fa-solid fa-droplet mr-1" style="color:var(--brand);"></i>Humidity ${w.humidity}%</span>
            <span><i class="fa-solid fa-wind mr-1" style="color:var(--brand);"></i>${w.wind} km/h</span>
          </div>
          <div class="mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2" style="background:var(--amber-soft);color:var(--amber);"><i class="fa-solid fa-triangle-exclamation"></i> ${w.advisory}</div>
        </div>
        <div class="card card-pad card-hover lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div><h3 class="font-bold text-base"><i class="fa-solid fa-bell mr-2" style="color:var(--red);"></i>Recent Alerts</h3><p class="text-xs" style="color:var(--text-faint);">Verified government &amp; AI-monitored alerts near you</p></div>
            <button class="btn btn-ghost btn-sm" onclick="App.goTo('alerts')">View All <i class="fa-solid fa-arrow-right ml-1"></i></button>
          </div>
          <div class="flex flex-col gap-3">${alerts.map(a=>this._alertRowMini(a)).join('')}</div>
        </div>
      </section>

      <section class="reveal card card-pad text-center mb-8" style="background:radial-gradient(circle at 50% 0%, rgba(239,35,60,0.08), var(--surface) 60%);">
        <p class="badge badge-red mx-auto mb-4" style="width:fit-content;"><i class="fa-solid fa-circle" style="font-size:6px;"></i> One-Tap Emergency Response</p>
        <div class="sos-wrap"><button class="sos-btn" id="sos-main-btn"><i class="fa-solid fa-triangle-exclamation"></i><span class="sos-text">EMERGENCY SOS</span><span class="sos-sub">TAP TO ACTIVATE</span></button></div>
        <p class="mt-4 text-sm max-w-lg mx-auto" style="color:var(--text-dim);">Activates Kavach AI Emergency Assistance — identifies your emergency, shares your profile with consent, and alerts trusted contacts instantly.</p>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3 md:gap-5 max-w-2xl mx-auto mt-8">
          ${KS.EMERGENCY_CATEGORIES.map(cat=>{ const c=KS.tone.css(cat.tone); return `
          <button class="quick-action-btn" onclick="activateService('${cat.label}','${cat.number}')">
            <div class="w-11 h-11 rounded-full flex items-center justify-center" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${cat.icon}"></i></div>
            <span>${cat.label}</span></button>`; }).join('')}
        </div>
      </section>

      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div class="card card-pad card-hover lg:col-span-2">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-shield-halved mr-2" style="color:var(--brand);"></i>Quick Access — Kavach AI</h3>
          <div class="grid grid-cols-2 gap-4">
            <button class="card card-pad card-hover text-left" onclick="App.goTo('kavach')"><i class="fa-solid fa-message-bot mb-2" style="color:var(--brand);"></i><p class="text-sm font-bold">Ask Kavach AI</p><p class="text-xs" style="color:var(--text-faint);">First-aid &amp; safety guidance</p></button>
            <button class="card card-pad card-hover text-left" onclick="App.goTo('directory')"><i class="fa-solid fa-building-columns mb-2" style="color:var(--emerald);"></i><p class="text-sm font-bold">Govt. Directory</p><p class="text-xs" style="color:var(--text-faint);">${user.city} services</p></button>
          </div>
        </div>
        <div class="card card-pad card-hover">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-lightbulb mr-2" style="color:var(--amber);"></i>Emergency Tips</h3>
          <div class="flex flex-col gap-4">
            <div class="flex items-start gap-3"><div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:var(--brand-soft);color:var(--brand);"><i class="fa-solid fa-hand-holding-medical text-xs"></i></div><div><p class="text-sm font-semibold">Keep a first-aid kit ready</p><p class="text-xs mt-0.5" style="color:var(--text-faint);">Store one at home and in your vehicle.</p></div></div>
            <div class="flex items-start gap-3"><div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style="background:var(--brand-soft);color:var(--brand);"><i class="fa-solid fa-people-group text-xs"></i></div><div><p class="text-sm font-semibold">Keep contacts up to date</p><p class="text-xs mt-0.5" style="color:var(--text-faint);">Edit them anytime in Smart Profile.</p></div></div>
          </div>
        </div>
      </section>

      <section class="reveal card card-pad card-hover mb-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-base"><i class="fa-solid fa-people-roof mr-2" style="color:var(--emerald);"></i>Family Status</h3>
          <button class="btn btn-ghost btn-sm" onclick="App.goTo('family')">Manage <i class="fa-solid fa-arrow-right ml-1"></i></button>
        </div>
        ${members.length ? `<div class="grid grid-cols-2 md:grid-cols-5 gap-4">${members.map(m=>`
          <div class="flex flex-col items-center text-center p-3 rounded-xl" style="background:var(--surface-2);">
            <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2" style="background:linear-gradient(135deg,var(--brand),var(--emerald));">${KS.util.initials(m.name)}</div>
            <p class="text-xs font-bold truncate w-full">${KS.util.escapeHtml(m.name.split(' ')[0])}</p>
            <span class="badge ${m.status==='Safe'?'badge-emerald':'badge-amber'} mt-2">${KS.util.escapeHtml(m.status||'Safe')}</span>
          </div>`).join('')}</div>` : `<p class="text-sm" style="color:var(--text-faint);">No family members added yet. <button class="font-bold" style="color:var(--brand);" onclick="App.goTo('profile')">Add them in your profile</button>.</p>`}
      </section>`;
    SOS.bind('sos-main-btn');
  },
  _alertRowMini(a){
    const toneMap = {critical:'red',high:'amber',medium:'blue',low:'emerald'};
    const tone = toneMap[a.priority]||'blue';
    const c = KS.tone.css(tone);
    return `<div class="flex items-center gap-4 p-3 rounded-xl" style="background:var(--surface-2);">
      <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${a.icon}"></i></div>
      <div class="min-w-0 flex-1"><p class="text-sm font-bold truncate">${a.title}</p><p class="text-xs truncate" style="color:var(--text-faint);">${KS.util.timeAgo(a.time)}</p></div>
      <span class="badge badge-${tone==='blue'?'blue':tone}">${a.priority}</span></div>`;
  }
};

/* ---------------- PROFILE PAGE ---------------- */
Object.assign(Pages, {
  render_profile(){
    const user = Store.current();
    const p = user.profile;
    document.getElementById('view-profile').innerHTML = `
      <section class="reveal card card-pad mb-6" style="background:linear-gradient(120deg, var(--brand-soft), var(--surface) 60%);">
        <div class="flex flex-col md:flex-row md:items-center gap-6">
          <div class="relative flex-shrink-0 mx-auto md:mx-0">
            <div class="w-28 h-28 rounded-3xl flex items-center justify-center text-white text-4xl font-extrabold" style="background:linear-gradient(135deg,var(--brand),var(--red));box-shadow:var(--shadow-lift);">${KS.util.initials(p.fullName||user.id)}</div>
          </div>
          <div class="flex-1 text-center md:text-left">
            <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
              <h2 class="text-2xl font-extrabold">${KS.util.escapeHtml(p.fullName||user.id)}</h2>
              <span class="badge badge-emerald mx-auto md:mx-0" style="width:fit-content;"><i class="fa-solid fa-shield-check"></i> Verified Profile</span>
            </div>
            <p class="text-sm mt-1" style="color:var(--text-dim);">${KS.util.escapeHtml(p.email||'No email set')} · ${KS.util.escapeHtml(p.phone||'No phone set')}</p>
            <div class="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
              <span class="badge badge-red"><i class="fa-solid fa-tint"></i> Blood: ${KS.util.escapeHtml(p.bloodGroup||'Unknown')}</span>
              <span class="badge badge-blue"><i class="fa-solid fa-location-dot"></i> ${KS.util.escapeHtml(user.city)}</span>
              <span class="badge badge-gray"><i class="fa-solid fa-language"></i> ${KS.util.escapeHtml(p.language||'English')}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="card card-pad card-hover reveal lg:col-span-2">
          <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-base"><i class="fa-solid fa-address-card mr-2" style="color:var(--brand);"></i>Personal Information</h3><span class="badge badge-blue"><i class="fa-solid fa-pen"></i> Editable</span></div>
          <form id="profile-personal-form" class="grid grid-cols-1 sm:grid-cols-2 gap-4" onsubmit="return Pages.saveProfilePersonal(event)">
            <div><label class="field-label">Full Name</label><input class="input" name="fullName" value="${KS.util.escapeHtml(p.fullName)}"></div>
            <div><label class="field-label">Date of Birth</label><input class="input" type="date" name="dob" value="${p.dob||''}"></div>
            <div><label class="field-label">Gender</label><input class="input" name="gender" value="${KS.util.escapeHtml(p.gender||'')}"></div>
            <div><label class="field-label">Phone Number</label><input class="input" name="phone" value="${KS.util.escapeHtml(p.phone||'')}"></div>
            <div><label class="field-label">Alt. Phone</label><input class="input" name="altPhone" value="${KS.util.escapeHtml(p.altPhone||'')}"></div>
            <div><label class="field-label">Email Address</label><input class="input" name="email" value="${KS.util.escapeHtml(p.email||'')}"></div>
            <div><label class="field-label">Occupation / Work</label><input class="input" name="work" value="${KS.util.escapeHtml(p.work||'')}"></div>
            <div><label class="field-label">Workplace / Work Address</label><input class="input" name="workAddress" value="${KS.util.escapeHtml(p.workAddress||'')}"></div>
            <div><label class="field-label">Usual Location</label><input class="input" name="usualLocation" value="${KS.util.escapeHtml(p.usualLocation||'')}"></div>
            <div><label class="field-label">Home Address</label><input class="input" name="address" value="${KS.util.escapeHtml(p.address||'')}"></div>
            <div class="sm:col-span-2 flex justify-end"><button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button></div>
          </form>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-heart-pulse mr-2" style="color:var(--red);"></i>Medical Profile</h3>
          <form onsubmit="return Pages.saveProfileMedical(event)">
            <label class="field-label">Blood Group</label>
            <select class="select mb-4" name="bloodGroup">${['Unknown','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=>`<option ${p.bloodGroup===b?'selected':''}>${b}</option>`).join('')}</select>
            <label class="field-label">Medical Conditions / Allergies</label>
            <textarea class="textarea mb-4" name="medical" style="min-height:70px;">${KS.util.escapeHtml(p.medical||'')}</textarea>
            <button type="submit" class="btn btn-primary btn-sm w-full"><i class="fa-solid fa-floppy-disk"></i> Save Medical Info</button>
          </form>
        </div>

        <div class="card card-pad card-hover reveal lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-base"><i class="fa-solid fa-address-book mr-2" style="color:var(--emerald);"></i>Emergency Contacts</h3>
            <button class="btn btn-ghost btn-sm" onclick="Pages.addContact()"><i class="fa-solid fa-plus"></i> Add Contact</button>
          </div>
          <div class="flex flex-col gap-3" id="emergency-contacts-list">${this._contactRows(user.contacts)}</div>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-language mr-2" style="color:var(--brand);"></i>Preferred Language</h3>
          <select class="select mb-5" id="profile-lang-select" onchange="Store.update(u=>u.profile.language=this.value); KS.toast('Language preference updated',{tone:'emerald',icon:'fa-check'})">${KS.LANGUAGES.map(l=>`<option ${p.language===l?'selected':''}>${l}</option>`).join('')}</select>
          <h3 class="font-bold text-base mb-3"><i class="fa-solid fa-lock mr-2" style="color:var(--amber);"></i>Emergency Permissions</h3>
          <div class="flex flex-col gap-3" id="permissions-list">${this._permissionToggles(user.settings.permissions)}</div>
        </div>

        <div class="card card-pad card-hover reveal lg:col-span-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-base"><i class="fa-solid fa-people-roof mr-2" style="color:var(--emerald);"></i>Family Members</h3>
            <button class="btn btn-ghost btn-sm" onclick="App.goTo('family')">Manage in Family Safety <i class="fa-solid fa-arrow-right ml-1"></i></button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${(user.family||[]).map(m=>`<div class="flex flex-col items-center text-center p-4 rounded-xl" style="background:var(--surface-2);">
              <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2" style="background:linear-gradient(135deg,var(--brand),var(--emerald));">${KS.util.initials(m.name)}</div>
              <p class="text-sm font-bold">${KS.util.escapeHtml(m.name)}</p><p class="text-xs" style="color:var(--text-faint);">${KS.util.escapeHtml(m.relation||'')}</p></div>`).join('') || `<p class="text-sm col-span-4" style="color:var(--text-faint);">No family members yet.</p>`}
          </div>
        </div>
      </div>`;
  },

  _contactRows(contacts){
    if (!contacts || !contacts.length) return `<p class="text-sm" style="color:var(--text-faint);">No emergency contacts yet.</p>`;
    return contacts.map(c=>`
      <div class="flex items-center gap-4 p-3 rounded-xl" style="background:var(--surface-2);">
        <div class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style="background:linear-gradient(135deg,var(--brand),var(--emerald));">${KS.util.initials(c.name)}</div>
        <div class="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(c.name)}" onchange="Pages.updateContact('${c.id}','name',this.value)" placeholder="Name">
          <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(c.relation)}" onchange="Pages.updateContact('${c.id}','relation',this.value)" placeholder="Relation">
          <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(c.phone)}" onchange="Pages.updateContact('${c.id}','phone',this.value)" placeholder="Phone">
        </div>
        ${c.primary?'<span class="badge badge-emerald">Primary</span>':''}
        <button class="btn btn-icon btn-ghost" style="width:36px;height:36px;color:var(--red);" title="Remove" onclick="Pages.removeContact('${c.id}')"><i class="fa-solid fa-trash text-xs"></i></button>
      </div>`).join('');
  },
  _permissionToggles(perm){
    const labels = [['shareMedical','Share medical info with responders'],['autoAlert','Auto-alert trusted contacts on SOS'],['shareLocation','Share live location during emergency'],['aiAnalysis','Allow AI incident analysis on my reports']];
    return labels.map(([key,label])=>`
      <div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">${label}</span>
      <button class="bk-toggle ${perm[key]?'on':''}" onclick="Pages.togglePermission('${key}', this)"></button></div>`).join('');
  },
  togglePermission(key, btn){
    btn.classList.toggle('on');
    Store.update(u=>u.settings.permissions[key] = btn.classList.contains('on'));
    KS.toast('Permission updated', {tone:'emerald', icon:'fa-check'});
  },
  saveProfilePersonal(e){
    e.preventDefault();
    const fd = new FormData(e.target);
    Store.update(u=>{ for (const [k,v] of fd.entries()) u.profile[k]=v; });
    Pages.render_home();
    KS.toast('Profile updated', {tone:'emerald', icon:'fa-check'});
    return false;
  },
  saveProfileMedical(e){
    e.preventDefault();
    const fd = new FormData(e.target);
    Store.update(u=>{ u.profile.bloodGroup = fd.get('bloodGroup'); u.profile.medical = fd.get('medical'); });
    KS.toast('Medical profile updated', {tone:'emerald', icon:'fa-check'});
    return false;
  },
  addContact(){
    Store.update(u=>{ u.contacts = u.contacts || []; u.contacts.push({id:KS.util.uid('c'), name:'New Contact', relation:'', phone:'', primary:u.contacts.length===0}); });
    Pages.render_profile();
  },
  updateContact(id, field, value){
    Store.update(u=> { const c = u.contacts.find(x=>x.id===id); if (c) c[field]=value; });
  },
  removeContact(id){
    Store.update(u=> u.contacts = (u.contacts||[]).filter(c=>c.id!==id));
    Pages.render_profile();
    KS.toast('Contact removed', {tone:'blue', icon:'fa-trash'});
  }
});

/* ---------------- FAMILY SAFETY PAGE ---------------- */
Object.assign(Pages, {
  render_family(){
    const user = Store.current();
    const members = user.family || [];
    const safe = members.filter(m=>!m.status || m.status==='Safe' || m.status==='At School').length;
    const stats = [
      { label:'Total Members', value:members.length, icon:'fa-people-group', tone:'blue' },
      { label:'Currently Safe', value:safe, icon:'fa-shield-check', tone:'emerald' },
      { label:'Needs Attention', value:members.length-safe, icon:'fa-triangle-exclamation', tone:'amber' }
    ];
    document.getElementById('view-family').innerHTML = `
      <section class="reveal mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
 class="text-2xl font-extrabold">Family Vault</h2><p class="section-sub">A secure, consent-based family safety ecosystem — fully editable</p></div>
        <button class="btn btn-primary" onclick="Pages.addFamilyMember()"><i class="fa-solid fa-user-plus"></i> Add Family Member</button>
      </section>

      <section class="reveal grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        ${stats.map(s=>{const c=KS.tone.css(s.tone); return `<div class="card card-pad card-hover flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${s.icon}"></i></div><div><h4 class="text-2xl font-extrabold">${s.value}</h4><p class="text-xs" style="color:var(--text-faint);">${s.label}</p></div></div>`;}).join('')}
      </section>

      <section class="reveal mb-6">
        <h3 class="section-title mb-4">Family Members</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5" id="family-members-grid">${members.map(m=>this._familyCard(m)).join('') || `<p class="text-sm" style="color:var(--text-faint);">No family members added yet.</p>`}</div>
      </section>

      <section class="reveal grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div class="card card-pad card-hover" style="background:linear-gradient(120deg, var(--red-glow), var(--surface) 60%);">
          <div class="flex items-center gap-3 mb-3"><div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:var(--red);color:#fff;"><i class="fa-solid fa-person-circle-question"></i></div><h3 class="font-bold text-base">Missing Child Report Generator</h3></div>
          <p class="text-sm mb-4" style="color:var(--text-dim);">Instantly generate a structured missing child report and broadcast to trusted contacts &amp; ${user.city} authorities.</p>
          <button class="btn btn-emergency w-full" onclick="KS.toast('Missing child report drafted — awaiting confirmation', {tone:'red', icon:'fa-file-signature'})"><i class="fa-solid fa-bullhorn"></i> Generate Report</button>
        </div>
        <div class="card card-pad card-hover" style="background:linear-gradient(120deg, var(--emerald-soft), var(--surface) 60%);">
          <div class="flex items-center gap-3 mb-3"><div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:var(--emerald);color:#fff;"><i class="fa-solid fa-person-dress"></i></div><h3 class="font-bold text-base">Women Safety Toolkit</h3></div>
          <div class="grid grid-cols-2 gap-3">
            <button class="btn btn-outline btn-sm" onclick="SOS.activate()"><i class="fa-solid fa-bolt"></i> One-Tap SOS</button>
            <button class="btn btn-outline btn-sm" onclick="KS.toast('Silent SOS activated — no sound or vibration', {tone:'red', icon:'fa-volume-xmark'})"><i class="fa-solid fa-volume-xmark"></i> Silent SOS</button>
            <button class="btn btn-outline btn-sm" onclick="KS.toast('Emergency audio/video recording started', {tone:'blue', icon:'fa-video'})"><i class="fa-solid fa-video"></i> Start Recording</button>
            <button class="btn btn-outline btn-sm" onclick="KS.toast('Anonymous report submitted securely', {tone:'emerald', icon:'fa-user-secret'})"><i class="fa-solid fa-user-secret"></i> Anonymous Report</button>
          </div>
        </div>
      </section>

      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="card card-pad card-hover lg:col-span-2">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-clock-rotate-left mr-2" style="color:var(--brand);"></i>Family Timeline</h3>
          <div class="timeline">
            <div class="timeline-item"><div class="timeline-dot"></div><p class="text-xs font-bold" style="color:var(--brand);">Just now</p><p class="text-sm mt-1" style="color:var(--text-dim);">Family vault is live and monitoring member status.</p></div>
          </div>
        </div>
        <div class="card card-pad card-hover">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-lock mr-2" style="color:var(--amber);"></i>Family Permissions</h3>
          <div class="flex flex-col gap-3">
            ${['Share live location with family','Auto-notify on SOS activation','Share medical profile with responders','Allow school check-in tracking'].map((l,i)=>`<div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">${l}</span><button class="bk-toggle ${i<3?'on':''}" onclick="this.classList.toggle('on'); KS.toast('Permission updated',{tone:'emerald',icon:'fa-check'})"></button></div>`).join('')}
          </div>
        </div>
      </section>`;
  },
  _familyCard(m){
    return `<div class="card card-pad card-hover" data-fid="${m.id}">
      <div class="flex items-center gap-4 mb-3">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-white text-lg flex-shrink-0" style="background:linear-gradient(135deg,var(--brand),var(--emerald));">${KS.util.initials(m.name)}</div>
        <div class="min-w-0 flex-1"><p class="font-bold text-sm">${KS.util.escapeHtml(m.name)} <span class="badge badge-gray ml-1">${KS.util.escapeHtml(m.relation||'')}</span></p>
        <select class="select mt-2" style="padding:6px 10px;font-size:12px;" onchange="Pages.updateFamily('${m.id}','status',this.value)">
          ${['Safe','At School','At Work','Needs Check-in','Travelling'].map(s=>`<option ${m.status===s?'selected':''}>${s}</option>`).join('')}
        </select></div>
        <button class="btn btn-icon btn-ghost" style="width:32px;height:32px;color:var(--red);" title="Remove" onclick="Pages.removeFamilyMember('${m.id}')"><i class="fa-solid fa-trash text-xs"></i></button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.phone||'')}" placeholder="Phone" onchange="Pages.updateFamily('${m.id}','phone',this.value)">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.age||'')}" placeholder="Age" onchange="Pages.updateFamily('${m.id}','age',this.value)">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.location||'')}" placeholder="Usual Location" onchange="Pages.updateFamily('${m.id}','location',this.value)">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.work||'')}" placeholder="Work / School" onchange="Pages.updateFamily('${m.id}','work',this.value)">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.blood||'')}" placeholder="Blood Group" onchange="Pages.updateFamily('${m.id}','blood',this.value)">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.relation||'')}" placeholder="Relation" onchange="Pages.updateFamily('${m.id}','relation',this.value)">
        <input class="input" style="padding:8px 10px;font-size:12.5px;" value="${KS.util.escapeHtml(m.name||'')}" placeholder="Name" onchange="Pages.updateFamily('${m.id}','name',this.value)">
      </div>
      <div class="mt-3 flex justify-end"><button class="btn btn-emergency btn-xs" onclick="activateService('${KS.util.escapeHtml(m.name).replace(/'/g,'')}','${KS.util.escapeHtml(m.phone||'')}')"><i class="fa-solid fa-phone"></i> Call</button></div>
    </div>`;
  },
  addFamilyMember(){
    Store.update(u=>{ u.family = u.family || []; u.family.push({id:KS.util.uid('f'), name:'New Member', relation:'', age:'', phone:'', location:'', work:'', blood:'', status:'Safe'}); });
    Pages.render_family();
  },
  updateFamily(id, field, value){
    Store.update(u=>{ const m=(u.family||[]).find(x=>x.id===id); if (m) m[field]=value; });
  },
  removeFamilyMember(id){
    Store.update(u=> u.family = (u.family||[]).filter(m=>m.id!==id));
    Pages.render_family();
    KS.toast('Family member removed', {tone:'blue', icon:'fa-trash'});
  }
});

/* ---------------- EMERGENCY SERVICES PAGE ---------------- */
Object.assign(Pages, {
  render_emergency(){
    const user = Store.current();
    const checklist = user.checklist && user.checklist.length===KS.EMERGENCY_CHECKLIST_DEFAULT.length ? user.checklist : KS.EMERGENCY_CHECKLIST_DEFAULT.map(()=>false);
    const done = checklist.filter(Boolean).length;
    const pct = Math.round((done/checklist.length)*100);
    document.getElementById('view-emergency').innerHTML = `
      <section class="reveal mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h2 class="text-2xl font-extrabold">Emergency Categories</h2><p class="section-sub">One-tap access to verified emergency services across India</p></div>
        <button class="btn btn-emergency" id="page-sos-btn"><i class="fa-solid fa-triangle-exclamation"></i> Activate SOS</button>
      </section>

      <section class="reveal grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        ${KS.EMERGENCY_CATEGORIES.map(cat=>{const c=KS.tone.css(cat.tone); return `
        <button class="quick-action-btn" onclick="activateService('${cat.label}','${cat.number}')">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${cat.icon}"></i></div>
          <span>${cat.label}</span><span class="text-[11px] font-bold" style="color:${c.fg};">Dial ${cat.number}</span></button>`;}).join('')}
      </section>

      <section class="reveal grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div><h3 class="section-title mb-1">Emergency Procedures</h3><p class="section-sub mb-4">Step-by-step guidance for critical situations</p>
          <div class="flex flex-col gap-4">${KS.EMERGENCY_PROCEDURES.map(p=>`
            <div class="card card-pad card-hover"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:var(--amber-soft);color:var(--amber);"><i class="fa-solid ${p.icon}"></i></div><h4 class="font-bold text-sm">${p.title}</h4></div>
            <ol class="flex flex-col gap-2">${p.steps.map((s,i)=>`<li class="text-xs flex items-start gap-2" style="color:var(--text-dim);"><span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px]" style="background:var(--surface-3);">${i+1}</span>${s}</li>`).join('')}</ol></div>`).join('')}</div>
        </div>
        <div><h3 class="section-title mb-1">Emergency Checklist</h3><p class="section-sub mb-4">Preparedness checklist for every household — saved to your profile</p>
          <div class="card card-pad">
            <div class="flex flex-col gap-3">${checklist.map((v,i)=>`<label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" ${v?'checked':''} onchange="Pages.toggleChecklist(${i})" style="width:18px;height:18px;accent-color:var(--emerald);"><span class="text-sm" style="color:var(--text-dim);">${KS.EMERGENCY_CHECKLIST_DEFAULT[i]}</span></label>`).join('')}</div>
            <div class="divider my-4"></div>
            <div class="flex items-center justify-between"><span class="text-xs font-semibold" style="color:var(--text-faint);">Completion</span><span class="text-xs font-bold" style="color:var(--emerald);">${pct}%</span></div>
            <div class="w-full h-2 rounded-full mt-2" style="background:var(--surface-3);"><div class="h-2 rounded-full" style="width:${pct}%; background:var(--emerald); transition: width .4s ease;"></div></div>
          </div>
        </div>
      </section>

      <section class="reveal card card-pad">
        <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-phone mr-2" style="color:var(--red);"></i>Verified National Emergency Numbers</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">${KS.NATIONAL_NUMBERS.map(n=>`<div class="p-4 rounded-xl text-center" style="background:var(--surface-2);"><p class="text-2xl font-extrabold" style="color:var(--red);">${n.number}</p><p class="text-xs mt-1" style="color:var(--text-faint);">${n.label}</p></div>`).join('')}</div>
        <p class="text-xs mt-4" style="color:var(--text-faint);"><i class="fa-solid fa-circle-info mr-1"></i>For the local police station, hospital & fire brigade nearest to you, see the <button class="font-bold" style="color:var(--brand);" onclick="App.goTo('directory')">Government Emergency Directory</button>.</p>
      </section>`;
    SOS.bind('page-sos-btn');
  },
  toggleChecklist(idx){
    Store.update(u=>{ if (!u.checklist || u.checklist.length!==KS.EMERGENCY_CHECKLIST_DEFAULT.length) u.checklist = KS.EMERGENCY_CHECKLIST_DEFAULT.map(()=>false); u.checklist[idx] = !u.checklist[idx]; });
    Pages.render_emergency();
  }
});

/* ---------------- GOVT DIRECTORY PAGE ---------------- */
Object.assign(Pages, {
  _dirState: { category:'All', search:'' },
  render_directory(){
    const user = Store.current();
    const items = Store.directoryFor(user.city);
    this._dirItemsCache = items;
    document.getElementById('view-directory').innerHTML = `
      <section class="reveal mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold mb-1">Government Emergency Directory — ${KS.util.escapeHtml(user.city)}</h2>
          <p class="section-sub mb-4">Verified contacts for police, hospitals, fire stations, helplines &amp; more. Every entry is editable.</p>
          <div class="search-bar max-w-xl"><i class="fa-solid fa-magnifying-glass"></i><input class="input" id="directory-search" placeholder="Search by name or service..." oninput="Pages.filterDirectory(this.value)"></div>
        </div>
        <button class="btn btn-primary flex-shrink-0" onclick="Pages.openDirectoryEditor()"><i class="fa-solid fa-plus"></i> Add Entry</button>
      </section>
      <section class="reveal flex flex-wrap gap-2 mb-6" id="directory-categories">
        ${KS.DIRECTORY_CATEGORIES.map(cat=>`<button class="tab-btn ${cat==='All'?'active':''}" onclick="Pages.setDirectoryCategory('${cat}', this)">${cat}</button>`).join('')}
      </section>
      <section class="reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="directory-grid"></section>
      <p class="text-xs mt-6" style="color:var(--text-faint);"><i class="fa-solid fa-circle-info mr-1"></i>National helpline numbers (100/101/102/108/112/1091/1930 etc.) are accurate nationwide. Direct institutional lines shown here are illustrative for this prototype — edit any entry to add a verified local number.</p>`;
    this._renderDirectoryGrid();
  },
  setDirectoryCategory(cat, btn){
    this._dirState.category = cat;
    document.querySelectorAll('#directory-categories .tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    this._renderDirectoryGrid();
  },
  filterDirectory(v){ this._dirState.search = v.toLowerCase(); this._renderDirectoryGrid(); },
  _renderDirectoryGrid(){
    const {category, search} = this._dirState;
    let items = this._dirItemsCache.filter(d => category==='All' || d.category===category);
    if (search) items = items.filter(d => (d.name+d.address+d.category).toLowerCase().includes(search));
    document.getElementById('directory-grid').innerHTML = items.map(d=>`
      <div class="card card-pad card-hover flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <span class="badge badge-blue"><i class="fa-solid ${KS.CATEGORY_ICON[d.category]||'fa-building'}"></i> ${d.category}</span>
          ${d.demo?'<span class="badge badge-gray" title="Demo number — edit to verify">Demo #</span>':'<span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> Verified</span>'}
        </div>
        <h4 class="font-bold text-sm mb-2">${KS.util.escapeHtml(d.name)}</h4>
        <p class="text-xs mb-1 flex items-center gap-2" style="color:var(--text-dim);"><i class="fa-solid fa-phone" style="color:var(--brand);"></i>${KS.util.escapeHtml(d.phone)}</p>
        <p class="text-xs mb-3 flex items-start gap-2" style="color:var(--text-faint);"><i class="fa-solid fa-location-dot mt-0.5" style="color:var(--brand);"></i>${KS.util.escapeHtml(d.address)}</p>
        <div class="mt-auto flex gap-2">
          <button class="btn btn-emergency btn-sm flex-1" onclick="activateService('${KS.util.escapeHtml(d.name).replace(/'/g,'')}','${KS.util.escapeHtml(d.phone)}')"><i class="fa-solid fa-phone"></i> Call</button>
          <button class="btn btn-outline btn-sm" onclick='Pages.openDirectoryEditor(${JSON.stringify(d.id)})'><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-outline btn-sm" style="color:var(--red);" onclick="Pages.deleteDirectoryEntry('${d.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`).join('') || `<p class="text-center text-sm py-12 col-span-full" style="color:var(--text-faint);">No results found.</p>`;
  },
  openDirectoryEditor(id){
    const user = Store.current();
    const entry = id ? this._dirItemsCache.find(d=>d.id===id) : { id:'', category:'Police', name:'', phone:'', email:'', address:'', hours:'24 x 7', services:[] };
    const html = `
      <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-lg">${id?'Edit':'Add'} Directory Entry</h3><button class="btn btn-icon btn-ghost" onclick="KS.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
      <form onsubmit="return Pages.saveDirectoryEntry(event, ${JSON.stringify(entry.id)})" class="flex flex-col gap-3">
        <div><label class="field-label">Category</label><select class="select" name="category">${KS.DIRECTORY_CATEGORIES.filter(c=>c!=='All').map(c=>`<option ${entry.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div><label class="field-label">Name</label><input class="input" name="name" value="${KS.util.escapeHtml(entry.name)}" required></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="field-label">Phone</label><input class="input" name="phone" value="${KS.util.escapeHtml(entry.phone)}"></div>
          <div><label class="field-label">Email</label><input class="input" name="email" value="${KS.util.escapeHtml(entry.email||'')}"></div>
        </div>
        <div><label class="field-label">Address</label><input class="input" name="address" value="${KS.util.escapeHtml(entry.address)}"></div>
        <div><label class="field-label">Hours</label><input class="input" name="hours" value="${KS.util.escapeHtml(entry.hours||'24 x 7')}"></div>
        <div class="flex gap-3 mt-2"><button type="button" class="btn btn-outline flex-1" onclick="KS.closeModal()">Cancel</button><button type="submit" class="btn btn-primary flex-1"><i class="fa-solid fa-floppy-disk"></i> Save</button></div>
      </form>`;
    KS.openModal(html);
  },
  saveDirectoryEntry(e, id){
    e.preventDefault();
    const user = Store.current();
    const fd = new FormData(e.target);
    const entry = { id: id || KS.util.uid('custom'), category: fd.get('category'), name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), address: fd.get('address'), hours: fd.get('hours'), services:[], demo:false };
    if (id) Store.saveDirectoryEntry(user.city, entry); else Store.addDirectoryEntry(user.city, entry);
    KS.closeModal();
    KS.toast('Directory entry saved', {tone:'emerald', icon:'fa-check'});
    Pages.render_directory();
    return false;
  },
  deleteDirectoryEntry(id){
    const user = Store.current();
    Store.removeDirectoryEntry(user.city, id);
    KS.toast('Directory entry removed', {tone:'blue', icon:'fa-trash'});
    Pages.render_directory();
  }
});

/* ---------------- KAVACH AI PAGE (Vehicle + Evidence + Threat Engine + Chatbot) ---------------- */
const Kavach = {
  activeTab: 'chatbot',
  trendChart: null, categoryChart: null,

  resetCharts(){ this.trendChart = null; this.categoryChart = null; KS._threatChartsDrawn = false; },

  render(){
    const user = Store.current();
    document.getElementById('view-kavach').innerHTML = `
      <section class="reveal mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h2 class="text-2xl font-extrabold flex items-center gap-2"><i class="fa-solid fa-brain" style="color:var(--brand);"></i> Kavach AI</h2><p class="section-sub">Vehicle checks, evidence intelligence, threat monitoring &amp; safety chatbot — all localised to ${KS.util.escapeHtml(user.city)}</p></div>
        <span class="badge badge-emerald pulse-live" style="width:fit-content; color:var(--emerald);"><i class="fa-solid fa-circle" style="font-size:6px;"></i> Live Monitoring Active</span>
      </section>

      <section class="reveal flex flex-wrap gap-2 mb-6">
        <button class="tab-btn active" data-tab-group="kavach-tabs" data-tab-target="vehicle" onclick="void 0"><i class="fa-solid fa-car-side mr-1"></i> Vehicle Information</button>
        <button class="tab-btn" data-tab-group="kavach-tabs" data-tab-target="evidence" onclick="void 0"><i class="fa-solid fa-folder-tree mr-1"></i> Evidence Intelligence</button>
        <button class="tab-btn" data-tab-group="kavach-tabs" data-tab-target="threat" onclick="void 0"><i class="fa-solid fa-chart-line mr-1"></i> AI Threat Engine</button>
        <button class="tab-btn" data-tab-group="kavach-tabs" data-tab-target="chatbot" onclick="void 0"><i class="fa-solid fa-message-bot mr-1"></i> Kavach AI Chatbot</button>
      </section>

      <div data-tab-panel="kavach-tabs" data-tab-id="vehicle">${this._vehicleTab()}</div>
      <div data-tab-panel="kavach-tabs" data-tab-id="evidence" class="hidden">${this._evidenceTab(user)}</div>
      <div data-tab-panel="kavach-tabs" data-tab-id="threat" class="hidden">${this._threatTab()}</div>
      <div data-tab-panel="kavach-tabs" data-tab-id="chatbot" class="hidden">${this._chatbotTab()}</div>`;

    // default to chatbot tab open (most used) — but keep vehicle first per spec ordering; select vehicle by default
    this._bindVehicle();
    this._bindEvidence(user);
    this._bindChatbot();
  },

  /* ---------- Vehicle Information tab ---------- */
  _vehicleTab(){
    return `
      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="card card-pad card-hover lg:col-span-1">
          <h3 class="font-bold text-base mb-2"><i class="fa-solid fa-magnifying-glass mr-2" style="color:var(--brand);"></i>Registration Lookup</h3>
          <p class="text-xs mb-3" style="color:var(--text-faint);">Try: DL3SAB4521, MH12DE1433, or KA05MJ7788</p>
          <div class="flex gap-2 mb-3"><input class="input" id="vehicle-input" placeholder="e.g. DL3SAB4521"><button class="btn btn-primary btn-icon" id="vehicle-search-btn"><i class="fa-solid fa-magnifying-glass"></i></button></div>
          <div class="flex flex-wrap gap-2">
            <button class="chip" onclick="Kavach.fillVehicle('DL3SAB4521')">DL3SAB4521</button>
            <button class="chip" onclick="Kavach.fillVehicle('MH12DE1433')">MH12DE1433</button>
            <button class="chip" onclick="Kavach.fillVehicle('KA05MJ7788')">KA05MJ7788 (flagged)</button>
          </div>
          <div id="vehicle-empty" class="text-center py-8" style="color:var(--text-faint);"><i class="fa-solid fa-car-side text-4xl mb-3"></i><p class="text-sm">Enter a vehicle number to view registration details.</p></div>
        </div>
        <div class="lg:col-span-2 hidden" id="vehicle-result-section">
          <div class="card card-pad card-hover text-center mb-5">
            <p id="v-number" class="text-2xl font-extrabold"></p>
            <p id="v-model" class="text-sm mt-1" style="color:var(--text-dim);"></p>
            <span id="v-status" class="badge mt-3 mx-auto"></span>
          </div>
          <div class="card card-pad card-hover mb-5"><div class="grid grid-cols-2 gap-4" id="vehicle-details-grid"></div></div>
          <div class="card card-pad card-hover" id="vehicle-flag-card"></div>
        </div>
      </section>`;
  },
  _bindVehicle(){
    const btn = document.getElementById('vehicle-search-btn');
    const input = document.getElementById('vehicle-input');
    if (!btn) return;
    btn.addEventListener('click', ()=>this.searchVehicle());
    input.addEventListener('keydown', e=>{ if (e.key==='Enter') this.searchVehicle(); });
  },
  fillVehicle(num){ document.getElementById('vehicle-input').value = num; this.searchVehicle(); },
  searchVehicle(){
    const raw = document.getElementById('vehicle-input').value.toUpperCase().replace(/\s/g,'');
    const btn = document.getElementById('vehicle-search-btn');
    if (!raw){ KS.toast('Please enter a vehicle number', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    setTimeout(()=>{
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
      const v = KS.VEHICLE_DB[raw];
      const empty = document.getElementById('vehicle-empty');
      const section = document.getElementById('vehicle-result-section');
      if (!v){ section.classList.add('hidden'); empty.classList.remove('hidden'); empty.innerHTML = `<i class="fa-solid fa-circle-exclamation text-4xl mb-3" style="color:var(--amber);"></i><p class="text-sm">No record found for "<strong>${KS.util.escapeHtml(raw)}</strong>". Try one of the sample numbers above.</p>`; return; }
      empty.classList.add('hidden'); section.classList.remove('hidden');
      document.getElementById('v-number').textContent = v.number;
      document.getElementById('v-model').textContent = v.model + ' · ' + v.color;
      const flagged = v.status.includes('Flagged');
      const statusEl = document.getElementById('v-status');
      statusEl.textContent = v.status;
      statusEl.className = 'badge mt-3 mx-auto ' + (flagged?'badge-red':'badge-emerald');
      document.getElementById('vehicle-details-grid').innerHTML = `
        <div><p class="text-xs" style="color:var(--text-faint);">Owner Name</p><p class="font-semibold">${v.owner}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">Manufacturing Year</p><p class="font-semibold">${v.year}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">Registration Date</p><p class="font-semibold">${v.regDate}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">Fuel Type</p><p class="font-semibold">${v.fuel}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">Insurance</p><p class="font-semibold">${v.insurance}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">RC Status</p><p class="font-semibold">${v.rc}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">Chassis Number</p><p class="font-semibold">${v.chassis}</p></div>
        <div><p class="text-xs" style="color:var(--text-faint);">Engine Number</p><p class="font-semibold">${v.engine}</p></div>`;
      const flagCard = document.getElementById('vehicle-flag-card');
      if (flagged){
        flagCard.innerHTML = `<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4"><div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:var(--red-glow);color:var(--red);"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="flex-1"><p class="font-bold text-sm">This vehicle has been flagged as stolen</p><p class="text-xs" style="color:var(--text-faint);">Report immediately to the nearest police station.</p></div><button class="btn btn-emergency btn-sm flex-shrink-0" onclick="Kavach.openFirModal('${v.number}')">File FIR</button></div>`;
      } else {
        flagCard.innerHTML = `<div class="flex items-center gap-4"><div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:var(--emerald-soft);color:var(--emerald);"><i class="fa-solid fa-circle-check"></i></div><div><p class="font-bold text-sm">No active flags or complaints</p><p class="text-xs" style="color:var(--text-faint);">This vehicle record is clear as per available data.</p></div></div>`;
      }
      KS.toast('Vehicle record retrieved', {tone:'emerald', icon:'fa-check'});
    }, 900);
  },
  openFirModal(vehicleNumber){
    const html = `
      <div class="flex items-center gap-3 mb-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:var(--brand-soft);color:var(--brand);"><i class="fa-solid fa-file-signature text-lg"></i></div><div><h3 class="font-bold text-lg">AI FIR Draft Assistant</h3><p class="text-xs" style="color:var(--text-faint);">Describe what happened — Kavach AI drafts a structured FIR</p></div></div>
      <textarea class="textarea mb-3" id="fir-desc" placeholder="e.g. My vehicle ${vehicleNumber?vehicleNumber:''} was stolen from outside my house between 8-9 PM...">${vehicleNumber ? 'Vehicle '+vehicleNumber+' reported stolen. ' : ''}</textarea>
      <div id="fir-draft-out"></div>
      <div class="flex gap-3 mt-4"><button class="btn btn-outline flex-1" onclick="KS.closeModal()">Close</button><button class="btn btn-primary flex-1" onclick="Kavach.generateFir()"><i class="fa-solid fa-wand-magic-sparkles"></i> Generate Draft</button></div>`;
    KS.openModal(html, {large:true});
  },
  generateFir(){
    const text = document.getElementById('fir-desc').value.trim();
    if (!text){ KS.toast('Please describe the incident first', {tone:'amber', icon:'fa-triangle-exclamation'}); return; }
    const user = Store.current();
    document.getElementById('fir-draft-out').innerHTML = `
      <div class="card card-pad mt-2" style="background:var(--surface-2);">
        <div class="flex flex-wrap gap-2 mb-3"><span class="badge badge-blue">Type: Theft</span><span class="badge badge-amber">Status: Draft — Pending Review</span></div>
        <p class="text-xs" style="color:var(--text-faint);">Complainant</p><p class="text-sm font-semibold mb-2">${KS.util.escapeHtml(user.profile.fullName||user.id)}</p>
        <p class="text-xs" style="color:var(--text-faint);">Location</p><p class="text-sm font-semibold mb-2">${KS.util.escapeHtml(user.city)}</p>
        <p class="text-xs" style="color:var(--text-faint);">Summary</p><p class="text-sm" style="color:var(--text-dim);">${KS.util.escapeHtml(text)}</p>
      </div>`;
    KS.toast('FIR draft generated — review before submitting to your local station', {tone:'emerald', icon:'fa-check'});
  },

  /* ---------- Evidence Intelligence tab (+ incident report + case builder, merged) ---------- */
  _evidenceTab(user){
    const files = user.evidenceFiles || [];
    return `
      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div class="lg:col-span-2">
          <div class="upload-area mb-5" id="evidence-upload">
            <i class="fa-solid fa-cloud-arrow-up text-3xl mb-3" style="color:var(--brand);"></i>
            <p class="text-sm font-semibold mb-1">Drag &amp; drop CCTV, photos, audio or documents</p>
            <p class="text-xs mb-4" style="color:var(--text-faint);">AI will enhance, transcribe &amp; index automatically</p>
            <button class="btn btn-primary btn-sm" type="button">Browse Files</button>
            <input type="file" id="evidence-file-input" class="hidden" multiple>
          </div>
          <div class="card card-pad card-hover">
            <div class="flex items-center justify-between mb-4"><h3 class="font-bold text-base"><i class="fa-solid fa-folder-tree mr-2" style="color:var(--emerald);"></i>Evidence Files</h3><span class="badge badge-blue" id="evidence-count">${files.length} files</span></div>
            <div class="flex flex-col gap-3" id="evidence-file-list"></div>
          </div>
        </div>
        <div>
          <div class="card card-pad card-hover mb-5">
            <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-clock-rotate-left mr-2" style="color:var(--brand);"></i>Evidence Timeline</h3>
            <div class="timeline">${KS.EVIDENCE_TIMELINE.map(t=>`<div class="timeline-item"><div class="timeline-dot"></div><p class="text-xs font-bold" style="color:var(--brand);">${t.time}</p><p class="text-sm mt-1" style="color:var(--text-dim);">${t.event}</p></div>`).join('')}</div>
          </div>
          <div class="card card-pad card-hover">
            <h3 class="font-bold text-base mb-2"><i class="fa-solid fa-diagram-project mr-2" style="color:var(--red);"></i>Case Summary — ${KS.CASE_SAMPLE.id}</h3>
            <p class="text-xs mb-3" style="color:var(--text-faint);">${KS.CASE_SAMPLE.title} · <span class="badge badge-red">${KS.CASE_SAMPLE.status}</span></p>
            <button class="btn btn-outline btn-sm w-full mb-3" onclick="Kavach.openCaseModal()">View Case Timeline</button>
            <button class="btn btn-outline btn-sm w-full" onclick="Kavach.openIncidentModal()"><i class="fa-solid fa-file-waveform"></i> Report New Incident</button>
          </div>
        </div>
      </section>`;
  },
  _bindEvidence(user){
    const uploadArea = document.getElementById('evidence-upload');
    if (!uploadArea) return;
    const fileInput = document.getElementById('evidence-file-input');
    this._renderEvidenceFiles(user);
    uploadArea.addEventListener('click', (e)=>{ if (e.target.tagName!=='BUTTON') fileInput.click(); });
    uploadArea.querySelector('button').addEventListener('click', ()=>fileInput.click());
    fileInput.addEventListener('change', (e)=>this.addEvidenceFiles(e.target.files));
    ['dragover','dragleave','drop'].forEach(evt=>{
      uploadArea.addEventListener(evt, (e)=>{
        e.preventDefault(); e.stopPropagation();
        if (evt==='dragover') uploadArea.classList.add('dragover'); else uploadArea.classList.remove('dragover');
        if (evt==='drop') this.addEvidenceFiles(e.dataTransfer.files);
      });
    });
  },
  addEvidenceFiles(fileList){
    const arr = Array.from(fileList).map(f=>({ name:f.name, size:(f.size/1024).toFixed(1)+' KB', status:'Processing', icon:'fa-file' }));
    if (!arr.length) return;
    Store.update(u=>{ u.evidenceFiles = (u.evidenceFiles||[]).concat(arr); });
    this._renderEvidenceFiles(Store.current());
    KS.toast(`${arr.length} file(s) added — AI processing started`, {tone:'blue', icon:'fa-cloud-arrow-up'});
    setTimeout(()=>{
      Store.update(u=>{ (u.evidenceFiles||[]).forEach(f=>{ if (f.status==='Processing') f.status='Analyzed'; }); });
      this._renderEvidenceFiles(Store.current());
      KS.toast('AI processing complete', {tone:'emerald', icon:'fa-check'});
    }, 1800);
  },
  _renderEvidenceFiles(user){
    const files = user.evidenceFiles || [];
    const toneMap = {Enhanced:'blue', Transcribed:'emerald', Analyzed:'amber', Processing:'gray'};
    const countEl = document.getElementById('evidence-count');
    if (countEl) countEl.textContent = files.length + ' files';
    const listEl = document.getElementById('evidence-file-list');
    if (!listEl) return;
    listEl.innerHTML = files.map(f=>{
      const tone = toneMap[f.status]||'blue';
      return `<div class="flex items-center gap-4 p-3 rounded-xl" style="background:var(--surface-2);">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background:var(--brand-soft);color:var(--brand);"><i class="fa-solid ${f.icon}"></i></div>
        <div class="min-w-0 flex-1"><p class="text-sm font-semibold truncate">${KS.util.escapeHtml(f.name)}</p><p class="text-xs" style="color:var(--text-faint);">${f.size}</p></div>
        <span class="badge badge-${tone}">${f.status==='Processing'?'<i class="fa-solid fa-spinner fa-spin"></i> ':''}${f.status}</span></div>`;
    }).join('') || `<p class="text-sm" style="color:var(--text-faint);">No evidence files yet.</p>`;
  },
  openCaseModal(){
    const c = KS.CASE_SAMPLE;
    const html = `<div class="flex items-center justify-between mb-4"><h3 class="font-bold text-lg">${c.id}</h3><button class="btn btn-icon btn-ghost" onclick="KS.closeModal()"><i class="fa-solid fa-xmark"></i></button></div>
      <p class="text-sm mb-4" style="color:var(--text-dim);">${c.title}</p>
      <div class="timeline mb-4">${c.timeline.map(t=>`<div class="timeline-item"><div class="timeline-dot"></div><p class="text-xs font-bold" style="color:var(--brand);">${t.time}</p><p class="text-sm font-semibold mt-1">${t.title}</p><p class="text-xs" style="color:var(--text-faint);">${t.desc}</p></div>`).join('')}</div>
      <p class="field-label">AI Recommendations</p><ul class="flex flex-col gap-2 mb-4">${c.recommendations.map(r=>`<li class="text-xs flex items-start gap-2" style="color:var(--text-dim);"><i class="fa-solid fa-circle-check mt-0.5" style="color:var(--emerald);"></i>${r}</li>`).join('')}</ul>
      <button class="btn btn-outline w-full" onclick="KS.closeModal()">Close</button>`;
    KS.openModal(html, {large:true});
  },
  openIncidentModal(){
    const html = `<div class="flex items-center gap-3 mb-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:var(--amber-soft);color:var(--amber);"><i class="fa-solid fa-file-waveform text-lg"></i></div><div><h3 class="font-bold text-lg">Report New Incident</h3><p class="text-xs" style="color:var(--text-faint);">Kavach AI will structure this into a report</p></div></div>
      <form onsubmit="return Kavach.submitIncident(event)" class="flex flex-col gap-3">
        <div><label class="field-label">Type</label><select class="select" name="type">${['Fire','Accident','Assault','Theft','Medical Emergency','Natural Disaster','Road Obstruction'].map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div><label class="field-label">Severity</label><select class="select" name="severity">${['Low','Medium','High','Critical'].map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div><label class="field-label">Description</label><textarea class="textarea" name="desc" required></textarea></div>
        <div class="flex gap-3 mt-1"><button type="button" class="btn btn-outline flex-1" onclick="KS.closeModal()">Cancel</button><button type="submit" class="btn btn-primary flex-1"><i class="fa-solid fa-paper-plane"></i> Submit</button></div>
      </form>`;
    KS.openModal(html);
  },
  submitIncident(e){
    e.preventDefault();
    const fd = new FormData(e.target);
    Store.update(u=>{ u.incidents = u.incidents||[]; u.incidents.unshift({ id:'INC-'+Math.floor(1000+Math.random()*9000), type:fd.get('type'), severity:fd.get('severity'), desc:fd.get('desc'), time:Date.now(), status:'Processing' }); });
    KS.closeModal();
    KS.toast('Incident report submitted — AI is generating a structured summary', {tone:'emerald', icon:'fa-check'});
  },

  /* ---------- AI Threat Engine tab ---------- */
  _threatTab(){
    return `
      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div class="card card-pad card-hover lg:col-span-2">
          <h3 class="font-bold text-base mb-1"><i class="fa-solid fa-chart-column mr-2" style="color:var(--brand);"></i>Weekly Incident Trend</h3>
          <p class="text-xs mb-4" style="color:var(--text-faint);">Anonymised incident volume across the past 7 days by category</p>
          <div style="height:260px;"><canvas id="trend-chart"></canvas></div>
        </div>
        <div class="card card-pad card-hover">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-chart-pie mr-2" style="color:var(--amber);"></i>Category Split</h3>
          <div style="height:200px;"><canvas id="category-chart"></canvas></div>
          <div class="flex flex-col gap-2 mt-4" id="category-legend"></div>
        </div>
      </section>
      <section class="reveal grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="card card-pad card-hover"><h3 class="font-bold text-base mb-4"><i class="fa-solid fa-map-location-dot mr-2" style="color:var(--red);"></i>Incident Hotspots</h3><div class="flex flex-col gap-3" id="hotspot-list"></div></div>
        <div class="card card-pad card-hover"><h3 class="font-bold text-base mb-4"><i class="fa-solid fa-gauge-high mr-2" style="color:var(--emerald);"></i>Risk Trend Detection</h3>
          <div class="flex items-center justify-center gap-6"><div class="relative" style="width:140px;height:140px;">
            <svg class="progress-ring" width="140" height="140"><circle class="progress-ring-bg" cx="70" cy="70" r="58" stroke-width="12"></circle><circle class="progress-ring-fg" cx="70" cy="70" r="58" stroke-width="12" stroke="var(--red)" stroke-dasharray="364" stroke-dashoffset="120"></circle></svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-2xl font-extrabold">67%</span><span class="text-[10px]" style="color:var(--text-faint);">Risk Index</span></div>
          </div></div>
          <p class="text-xs text-center mt-4" style="color:var(--text-dim);">Rising activity detected in <strong>3 zones</strong> of this city. High-demand period expected 6–9 PM.</p>
        </div>
        <div class="card card-pad card-hover"><h3 class="font-bold text-base mb-4"><i class="fa-solid fa-server mr-2" style="color:var(--amber);"></i>Evidence Processing Status</h3><div class="flex flex-col gap-4" id="processing-status"></div></div>
      </section>`;
  },
  renderThreatEngine(){
    KS._threatChartsDrawn = true;
    const user = Store.current();
    const cssVar = (n)=> getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const zones = ['Central Zone','North Zone','South Zone','Market District','Station Road'];
    const seed = user.city.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const hotspots = zones.map((z,i)=>({ area: z+', '+user.city, incidents: 15+((seed+i*7)%40), trend: (i%2===0?'+':'-')+(3+((seed+i)%12))+'%' }));
    const max = Math.max(...hotspots.map(h=>h.incidents));
    document.getElementById('hotspot-list').innerHTML = hotspots.map(h=>{
      const up = h.trend.startsWith('+');
      return `<div><div class="flex items-center justify-between mb-1"><span class="text-sm font-semibold">${h.area}</span><span class="text-xs font-bold" style="color:${up?'var(--red)':'var(--emerald)'};">${h.trend}</span></div>
      <div class="w-full h-2 rounded-full" style="background:var(--surface-3);"><div class="h-2 rounded-full" style="width:${(h.incidents/max)*100}%; background:var(--brand);"></div></div>
      <p class="text-[11px] mt-1" style="color:var(--text-faint);">${h.incidents} incidents (30 days)</p></div>`;
    }).join('');
    const proc = [ {label:'CCTV Footage Analysis', pct:92, tone:'emerald'}, {label:'Audio Transcription Queue', pct:76, tone:'blue'}, {label:'Image Enhancement Batch', pct:58, tone:'amber'}, {label:'Document OCR Processing', pct:88, tone:'emerald'} ];
    document.getElementById('processing-status').innerHTML = proc.map(i=>{ const c=KS.tone.css(i.tone); return `<div><div class="flex items-center justify-between mb-1"><span class="text-sm font-semibold">${i.label}</span><span class="text-xs font-bold" style="color:${c.fg};">${i.pct}%</span></div><div class="w-full h-2.5 rounded-full" style="background:var(--surface-3);"><div class="h-2.5 rounded-full" style="width:${i.pct}%; background:${c.fg};"></div></div></div>`; }).join('');

    const trendCtx = document.getElementById('trend-chart');
    if (trendCtx){
      if (this.trendChart) this.trendChart.destroy();
      this.trendChart = new Chart(trendCtx, { type:'bar', data:{ labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets:[
        {label:'Medical', data:[12,15,10,18,22,25,19], backgroundColor:cssVar('--red')},
        {label:'Fire', data:[4,6,3,5,8,7,5], backgroundColor:cssVar('--amber')},
        {label:'Theft', data:[8,9,7,11,13,15,10], backgroundColor:cssVar('--brand')},
        {label:'Accident', data:[10,12,9,14,16,18,13], backgroundColor:cssVar('--emerald')}
      ]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:cssVar('--text-faint'), boxWidth:12, font:{size:11}}}}, scales:{ x:{stacked:true, grid:{display:false}, ticks:{color:cssVar('--text-faint')}}, y:{stacked:true, grid:{color:cssVar('--border')}, ticks:{color:cssVar('--text-faint')}} } } });
    }
    const catCtx = document.getElementById('category-chart');
    if (catCtx){
      if (this.categoryChart) this.categoryChart.destroy();
      const labels = ['Medical Emergency','Theft','Accident','Fire','Assault','Disaster'];
      const data = [28,22,19,12,11,8];
      const colors = [cssVar('--red'), cssVar('--brand'), cssVar('--emerald'), cssVar('--amber'), '#a78bfa', cssVar('--text-faint')];
      this.categoryChart = new Chart(catCtx, { type:'doughnut', data:{labels, datasets:[{data, backgroundColor:colors, borderWidth:0}]}, options:{responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{display:false}}} });
      document.getElementById('category-legend').innerHTML = labels.map((l,i)=>`<div class="flex items-center justify-between text-xs"><span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" style="background:${colors[i]};"></span>${l}</span><span class="font-bold">${data[i]}%</span></div>`).join('');
    }
  },

  /* ---------- Kavach AI Chatbot tab (merged from Suraksha AI) ---------- */
  _chatbotTab(){
    return `
      <section class="reveal grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
        <div class="lg:col-span-3 card card-pad card-hover flex flex-col" style="height:560px;">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3"><div class="ai-avatar floating-ai"><i class="fa-solid fa-shield-heart"></i></div><div><p class="font-bold text-sm">Kavach AI</p><p class="text-xs" style="color:var(--text-faint);">Your emergency response companion</p></div></div>
            <div class="flex items-center gap-2">
              <button class="btn btn-icon btn-ghost" id="voice-btn" title="Voice input"><i class="fa-solid fa-microphone"></i></button>
              <button class="btn btn-ghost btn-sm" id="clear-chat-btn">Clear</button>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mb-3" id="prompt-chips"></div>
          <div class="flex-1 overflow-y-auto flex flex-col gap-4 mb-3 px-1" id="chat-window"></div>
          <div class="flex items-center gap-2">
            <button class="btn btn-icon btn-ghost" id="upload-btn" title="Upload file"><i class="fa-solid fa-paperclip"></i></button>
            <input type="file" id="file-input" class="hidden">
            <input class="input" id="chat-input" placeholder="Describe your situation...">
            <button class="btn btn-primary btn-icon" id="send-btn"><i class="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
        <div class="flex flex-col gap-5">
          <div class="card card-pad card-hover"><h3 class="font-bold text-sm mb-3">Suggested Questions</h3><div class="flex flex-col gap-2" id="suggested-questions"></div></div>
          <div class="card card-pad card-hover"><h3 class="font-bold text-sm mb-3">Recent Conversations</h3><div class="flex flex-col gap-2" id="chat-history-list"></div></div>
        </div>
      </section>
      <section class="reveal">
        <h3 class="section-title mb-4">AI Emergency Guides</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4" id="guide-cards-grid"></div>
      </section>`;
  },
  _bindChatbot(){
    const win = document.getElementById('chat-window');
    if (!win) return;
    document.getElementById('prompt-chips').innerHTML = KS.QUICK_PROMPT_CHIPS.map(c=>`<button class="chip" onclick="Kavach.quickAsk('${c.replace(/'/g,"\\'")}')">${c}</button>`).join('');
    document.getElementById('suggested-questions').innerHTML = KS.SUGGESTED_QUESTIONS.map(q=>`<button class="text-left text-xs p-3 rounded-xl" style="background:var(--surface-2); color:var(--text-dim);" onclick="Kavach.quickAsk('${q.replace(/'/g,"\\'")}')"><i class="fa-solid fa-message mr-2" style="color:var(--brand);"></i>${q}</button>`).join('');
    document.getElementById('chat-history-list').innerHTML = [['Fire safety at home','2 hr ago'],['CPR steps for adults','Yesterday'],['Snake bite first aid','2 days ago']].map(([t,ti])=>`<button class="flex items-center justify-between p-3 rounded-xl text-left" style="background:var(--surface-2);" onclick="KS.toast('Loaded: ${t}', {tone:'blue', icon:'fa-clock-rotate-left'})"><span class="text-xs font-semibold truncate">${t}</span><span class="text-[10px]" style="color:var(--text-faint);">${ti}</span></button>`).join('');
    document.getElementById('guide-cards-grid').innerHTML = KS.AI_GUIDE_CARDS.map(g=>{ const c=KS.tone.css(g.tone); return `<button class="card card-pad card-hover text-left" onclick="Kavach.openGuide('${g.title}')"><div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${g.icon}"></i></div><h4 class="font-bold text-sm mb-1">${g.title}</h4><p class="text-xs" style="color:var(--text-faint);">${g.desc}</p></button>`; }).join('');
    win.innerHTML = '';
    this.appendMessage('ai', 'Namaste  I\'m Kavach AI, your emergency response companion. Describe your situation, tap a quick prompt, or use voice — I can help with first-aid guidance, incident analysis, and connecting you to the right emergency service in your city.');
    document.getElementById('send-btn').addEventListener('click', ()=>this.sendMessage());
    document.getElementById('chat-input').addEventListener('keydown', e=>{ if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); this.sendMessage(); } });
    document.getElementById('voice-btn').addEventListener('click', ()=>this.voiceInput());
    document.getElementById('upload-btn').addEventListener('click', ()=>document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', (e)=>this.simulateUpload(e));
    document.getElementById('clear-chat-btn').addEventListener('click', ()=>{ win.innerHTML=''; this.appendMessage('ai','Conversation cleared. How can I help?'); KS.toast('Conversation cleared', {tone:'blue', icon:'fa-broom'}); });
  },
  openGuide(title){
    const guide = KS.AI_GUIDE_CARDS.find(g=>g.title===title);
    const steps = KS.GUIDE_STEPS[title]||[];
    const c = KS.tone.css(guide.tone);
    const html = `<div class="flex items-center gap-3 mb-5"><div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${guide.icon} text-lg"></i></div><div><h3 class="font-bold text-lg">${title} — Emergency Guide</h3><p class="text-xs" style="color:var(--text-faint);">AI-assisted first-aid instructions</p></div></div>
      <ol class="flex flex-col gap-3 mb-5">${steps.map((s,i)=>`<li class="flex items-start gap-3 text-sm" style="color:var(--text-dim);"><span class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white" style="background:${c.fg};">${i+1}</span>${s}</li>`).join('')}</ol>
      <div class="flex gap-3"><button class="btn btn-outline flex-1" onclick="KS.closeModal()">Close</button><button class="btn btn-primary flex-1" onclick="KS.closeModal(); Kavach.quickAsk('Guide me through ${title} step by step')">Ask Kavach AI</button></div>`;
    KS.openModal(html);
  },
  quickAsk(text){ document.getElementById('chat-input').value = text; this.sendMessage(); },
  sendMessage(){
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    this.appendMessage('user', KS.util.escapeHtml(text));
    input.value = '';
    this.showTyping();
    setTimeout(()=>{ this.removeTyping(); this.appendMessage('ai', this.generateResponse(text)); }, 1100 + Math.random()*600);
  },
  generateResponse(text){
    const lower = text.toLowerCase();
    const user = Store.current();
    let type='General Emergency', service='National Emergency Number (112)', severity='Medium';
    if (lower.includes('fire')){ type='Fire'; service='Fire Brigade (101)'; severity='High'; }
    else if (lower.includes('cpr')||lower.includes('heart')){ type='Medical Emergency'; service='Ambulance (108)'; severity='Critical'; }
    else if (lower.includes('faint')||lower.includes('unconscious')){ type='Medical Emergency'; service='Ambulance (108)'; severity='High'; }
    else if (lower.includes('accident')){ type='Road Accident'; service='Ambulance (108) & Police (100)'; severity='High'; }
    else if (lower.includes('snake')){ type='Snake Bite'; service='Ambulance (108)'; severity='High'; }
    else if (lower.includes('flood')){ type='Flood'; service='Disaster Management (1078)'; severity='High'; }
    else if (lower.includes('theft')||lower.includes('robbery')||lower.includes('stolen')){ type='Theft'; service='Police (100)'; severity='Medium'; }
    return `I've analysed your message. Here's what I found:<br><br>
      <div class="flex flex-wrap gap-2 mb-3"><span class="badge badge-red">Type: ${type}</span><span class="badge badge-amber">Severity: ${severity}</span><span class="badge badge-blue">Suggested: ${service}</span></div>
      Stay calm and follow these immediate steps: ensure your own safety first, move away from danger if possible, and keep your phone accessible. Nearest verified services for ${KS.util.escapeHtml(user.city)} are in the <button style="color:var(--brand);font-weight:700;" onclick="App.goTo('directory')">Government Directory</button>. Would you like me to connect you to <strong>${service}</strong>?`;
  },
  showTyping(){
    const win = document.getElementById('chat-window');
    const row = document.createElement('div'); row.className='flex items-start gap-3'; row.id='typing-row';
    row.innerHTML = `<div class="ai-avatar"><i class="fa-solid fa-shield-heart"></i></div><div class="chat-bubble ai"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
    win.appendChild(row); win.scrollTop = win.scrollHeight;
  },
  removeTyping(){ const r = document.getElementById('typing-row'); if (r) r.remove(); },
  appendMessage(role, html, scroll){
    scroll = scroll===undefined ? true : scroll;
    const win = document.getElementById('chat-window');
    const row = document.createElement('div');
    row.className = 'flex items-start gap-3 fade-in-up ' + (role==='user'?'justify-end':'');
    row.innerHTML = role==='ai' ? `<div class="ai-avatar"><i class="fa-solid fa-shield-heart"></i></div><div class="chat-bubble ai">${html}</div>` : `<div class="chat-bubble user">${html}</div>`;
    win.appendChild(row);
    if (scroll) win.scrollTop = win.scrollHeight;
  },
  voiceInput(){
    const user = Store.current();
    const btn = document.getElementById('voice-btn');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && user.settings.voiceMode){
      try{
        const rec = new SR();
        rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
        btn.classList.add('pulse-live'); btn.style.color = 'var(--red)';
        KS.toast('Listening… speak now', {tone:'red', icon:'fa-microphone'});
        rec.onresult = (e)=>{ document.getElementById('chat-input').value = e.results[0][0].transcript; KS.toast('Voice captured & transcribed', {tone:'emerald', icon:'fa-check'}); };
        rec.onerror = ()=>{ KS.toast('Could not capture voice — try typing instead', {tone:'amber', icon:'fa-triangle-exclamation'}); };
        rec.onend = ()=>{ btn.classList.remove('pulse-live'); btn.style.color=''; };
        rec.start();
        return;
      }catch(err){ /* fall through to simulated */ }
    }
    btn.classList.add('pulse-live'); btn.style.color = 'var(--red)';
    KS.toast('Listening…', {tone:'red', icon:'fa-microphone'});
    setTimeout(()=>{ btn.classList.remove('pulse-live'); btn.style.color=''; document.getElementById('chat-input').value='There is a fire in my house, please help!'; KS.toast('Voice captured & transcribed', {tone:'emerald', icon:'fa-check'}); }, 2000);
  },
  simulateUpload(e){
    const file = e.target.files[0];
    if (!file) return;
    this.appendMessage('user', `<i class="fa-solid fa-paperclip mr-1"></i> Uploaded: ${KS.util.escapeHtml(file.name)}`);
    this.showTyping();
    setTimeout(()=>{ this.removeTyping(); this.appendMessage('ai', `I've analysed your uploaded file. Detected context: <strong>Possible Road Obstruction</strong>. Confidence: 87%.<br>Recommended action: report via the Evidence Intelligence tab.`); }, 1400);
    e.target.value = '';
  }
};
Pages.render_kavach = function(){ Kavach.render(); };

/* ---------------- ALERTS PAGE ---------------- */
Object.assign(Pages, {
  _alertFilter: 'All',
  render_alerts(){
    document.getElementById('view-alerts').innerHTML = `
      <section class="reveal mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h2 class="text-2xl font-extrabold">Emergency Alerts Feed</h2><p class="section-sub">Verified alerts from government sources &amp; AI monitoring systems</p></div>
        <span class="badge badge-red pulse-live"><i class="fa-solid fa-circle" style="font-size:6px;"></i> Live</span>
      </section>
      <section class="reveal flex flex-wrap gap-2 mb-6" id="alerts-filter-bar">${['All','Critical','High','Medium','Low'].map(f=>`<button class="tab-btn ${f==='All'?'active':''}" onclick="Pages.setAlertFilter('${f}', this)">${f}</button>`).join('')}</section>
      <section class="reveal flex flex-col gap-4" id="alerts-feed"></section>`;
    this._renderAlerts();
  },
  setAlertFilter(f, btn){
    this._alertFilter = f;
    document.querySelectorAll('#alerts-filter-bar .tab-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    this._renderAlerts();
  },
  _renderAlerts(){
    const priorityMap = {Critical:'critical',High:'high',Medium:'medium',Low:'low'};
    const items = KS.ALERTS.filter(a=> this._alertFilter==='All' || a.priority===priorityMap[this._alertFilter]);
    const toneMap = {critical:'red',high:'amber',medium:'blue',low:'emerald'};
    document.getElementById('alerts-feed').innerHTML = items.map(a=>{
      const tone = toneMap[a.priority]; const c = KS.tone.css(tone);
      return `<div class="card card-pad card-hover flex flex-col md:flex-row md:items-center gap-4">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:${c.bg};color:${c.fg};"><i class="fa-solid ${a.icon} text-xl"></i></div>
        <div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2 mb-1"><span class="badge badge-${tone==='blue'?'blue':tone}">${a.priority}</span><span class="badge badge-gray">${a.category}</span><span class="text-xs" style="color:var(--text-faint);">${KS.util.timeAgo(a.time)}</span></div>
        <h4 class="font-bold text-base">${a.title}</h4><p class="text-sm mt-1" style="color:var(--text-dim);">${a.desc}</p></div>
        <div class="flex md:flex-col gap-2 flex-shrink-0"><button class="btn btn-outline btn-sm" onclick="KS.toast('Alert shared with family', {tone:'blue', icon:'fa-share-nodes'})"><i class="fa-solid fa-share-nodes"></i> Share</button><button class="btn btn-primary btn-sm" onclick="KS.toast('Viewing full advisory details', {tone:'blue', icon:'fa-circle-info'})">Details</button></div>
      </div>`;
    }).join('') || `<p class="text-center text-sm py-12" style="color:var(--text-faint);">No alerts match this filter.</p>`;
  }
});

/* ---------------- SETTINGS PAGE ---------------- */
Object.assign(Pages, {
  render_settings(){
    const user = Store.current();
    const s = user.settings;
    document.getElementById('view-settings').innerHTML = `
      <section class="reveal mb-6"><h2 class="text-2xl font-extrabold">Settings</h2><p class="section-sub">Manage appearance, language, privacy, accessibility &amp; emergency preferences</p></section>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-location-dot mr-2" style="color:var(--red);"></i>City</h3>
          <label class="field-label">Your City</label>
          <select class="select" id="settings-city-select">${KS.CITIES.map(c=>`<option ${user.city===c?'selected':''}>${c}</option>`).join('')}</select>
          <p class="text-xs mt-2" style="color:var(--text-faint);">Changes your Government Directory &amp; Kavach AI city context immediately.</p>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-palette mr-2" style="color:var(--brand);"></i>Appearance</h3>
          <div class="flex items-center justify-between mb-4"><div><p class="text-sm font-semibold">Dark Mode</p><p class="text-xs" style="color:var(--text-faint);">Switch between dark and light theme</p></div><button class="bk-toggle ${s.theme!=='light'?'on':''}" id="settings-theme-toggle"></button></div>
          <div class="flex items-center justify-between"><div><p class="text-sm font-semibold">Sidebar Collapsed by Default</p></div><button class="bk-toggle ${s.sidebarCollapsed?'on':''}" id="settings-sidebar-toggle"></button></div>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-language mr-2" style="color:var(--emerald);"></i>Language</h3>
          <label class="field-label">App Language</label>
          <select class="select" id="settings-lang-select">${KS.LANGUAGES.map(l=>`<option ${user.profile.language===l?'selected':''}>${l}</option>`).join('')}</select>
          <p class="text-xs mt-3" style="color:var(--text-faint);"><i class="fa-solid fa-circle-info mr-1"></i>Kavach AI supports multilingual conversations in all listed languages.</p>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-universal-access mr-2" style="color:var(--brand);"></i>Accessibility</h3>
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">High contrast mode</span><button class="bk-toggle ${s.contrast==='high'?'on':''}" id="settings-contrast-toggle"></button></div>
            <div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">Larger text size</span><button class="bk-toggle ${s.textScale>1?'on':''}" id="settings-textsize-toggle"></button></div>
            <div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">Reduce motion &amp; animations</span><button class="bk-toggle ${s.reduceMotion?'on':''}" id="settings-motion-toggle"></button></div>
            <div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">Voice chat mode (speech-to-text in Kavach AI)</span><button class="bk-toggle ${s.voiceMode?'on':''}" id="settings-voice-toggle"></button></div>
          </div>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-bell mr-2" style="color:var(--amber);"></i>Notifications</h3>
          <div class="flex flex-col gap-3" id="notif-settings"></div>
        </div>

        <div class="card card-pad card-hover reveal">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-shield-halved mr-2" style="color:var(--red);"></i>Privacy</h3>
          <div class="flex flex-col gap-3" id="privacy-settings"></div>
        </div>

        <div class="card card-pad card-hover reveal lg:col-span-2">
          <h3 class="font-bold text-base mb-4"><i class="fa-solid fa-circle-info mr-2" style="color:var(--brand);"></i>About BharatKavach</h3>
          <div class="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl flex-shrink-0" style="background:linear-gradient(135deg,var(--brand),var(--red));"><i class="fa-solid fa-shield-heart"></i></div>
            <div class="flex-1"><p class="font-bold">BharatKavach — Protect. Respond. Empower.</p><p class="text-sm mt-1" style="color:var(--text-dim);">India's AI-powered public safety &amp; smart forensics platform. Version 2.0.0 (Prototype Build) — single-file, frontend + simulated backend.</p>
              <div class="flex flex-wrap gap-2 mt-3"><span class="badge badge-blue">Privacy-First</span><span class="badge badge-emerald">Consent-Based</span><span class="badge badge-amber">Ethical AI</span></div></div>
          </div>
        </div>

        <div class="card card-pad card-hover reveal lg:col-span-2" style="border-color:var(--red-glow);">
          <h3 class="font-bold text-base mb-3" style="color:var(--red);"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Account</h3>
          <div class="flex flex-col sm:flex-row gap-3">
            <button class="btn btn-outline" onclick="App.logout()"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
          </div>
        </div>
      </div>`;
    this._bindSettings();
  },
  _bindSettings(){
    const user = Store.current();
    document.getElementById('settings-city-select').addEventListener('change', function(){
      Store.update(u=>u.city = this.value);
      App.buildTopbar();
      KS.toast('City updated to ' + this.value, {tone:'emerald', icon:'fa-check'});
    });
    document.getElementById('settings-theme-toggle').addEventListener('click', function(){
      const next = document.documentElement.getAttribute('data-theme')==='light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      Store.update(u=>u.settings.theme=next);
      this.classList.toggle('on', next==='dark');
      App.buildTopbar();
    });
    document.getElementById('settings-sidebar-toggle').addEventListener('click', function(){
      const on = this.classList.toggle('on');
      Store.update(u=>u.settings.sidebarCollapsed = on);
      App.buildSidebar();
    });
    document.getElementById('settings-lang-select').addEventListener('change', function(){
      Store.update(u=>u.profile.language=this.value);
      KS.toast('Language preference updated', {tone:'emerald', icon:'fa-check'});
    });
    document.getElementById('settings-contrast-toggle').addEventListener('click', function(){
      const next = document.documentElement.getAttribute('data-contrast')==='high' ? 'normal' : 'high';
      document.documentElement.setAttribute('data-contrast', next);
      Store.update(u=>u.settings.contrast=next);
      this.classList.toggle('on', next==='high');
      KS.toast('High contrast ' + (next==='high'?'enabled':'disabled'), {tone:'blue', icon:'fa-circle-half-stroke'});
    });
    document.getElementById('settings-textsize-toggle').addEventListener('click', function(){
      const on = this.classList.toggle('on');
      const scale = on ? 1.15 : 1;
      document.documentElement.style.setProperty('--text-scale', scale);
      Store.update(u=>u.settings.textScale = scale);
      KS.toast('Text size ' + (on?'increased':'reset'), {tone:'blue', icon:'fa-text-height'});
    });
    document.getElementById('settings-motion-toggle').addEventListener('click', function(){
      const on = this.classList.toggle('on');
      document.documentElement.setAttribute('data-reduce-motion', on ? '1':'0');
      Store.update(u=>u.settings.reduceMotion = on);
    });
    document.getElementById('settings-voice-toggle').addEventListener('click', function(){
      const on = this.classList.toggle('on');
      Store.update(u=>u.settings.voiceMode = on);
      KS.toast('Voice chat mode ' + (on?'enabled — mic will use real speech recognition where supported':'disabled'), {tone:'blue', icon:'fa-microphone'});
    });
    Pages._renderToggleGroup('notif-settings', [['sos','Emergency SOS alerts'],['weather','Weather & disaster advisories'],['family','Family check-in updates'],['updates','Case & report status updates']], user.settings.notifications, 'notifications');
    Pages._renderToggleGroup('privacy-settings', [['shareProfile','Share profile with responders during SOS'],['anonymizedAI','Allow anonymised data for AI safety analytics'],['auditLog','Enable audit log of data access'],['locationFamily','Allow location sharing with family']], user.settings.privacy, 'privacy');
  },
  _renderToggleGroup(containerId, pairs, stateObj, settingsKey){
    document.getElementById(containerId).innerHTML = pairs.map(([key,label])=>`<div class="flex items-center justify-between"><span class="text-sm" style="color:var(--text-dim);">${label}</span><button class="bk-toggle ${stateObj[key]?'on':''}" onclick="Pages._toggleSetting('${settingsKey}','${key}', this)"></button></div>`).join('');
  },
  _toggleSetting(group, key, btn){
    btn.classList.toggle('on');
    Store.update(u=> u.settings[group][key] = btn.classList.contains('on'));
    KS.toast('Setting updated', {tone:'emerald', icon:'fa-check'});
  }
});

/* ---------------- Reveal-on-scroll ---------------- */
function initReveal(){
  const targets = document.querySelectorAll('.reveal:not(.fade-in-up)');
  if ('IntersectionObserver' in window && targets.length){
    const io = new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if (entry.isIntersecting){ entry.target.classList.add('fade-in-up'); io.unobserve(entry.target); } }); }, {threshold:0.05});
    targets.forEach(t=>io.observe(t));
  } else { targets.forEach(t=>t.classList.add('fade-in-up')); }
}
const _origGoTo = App.goTo.bind(App);
App.goTo = function(pageId){ _origGoTo(pageId); setTimeout(initReveal, 30); };

/* ---------------- BOOTSTRAP ---------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const uid = KS.db.getSession();
  if (uid && KS.db.getUser(uid)) App.boot();
  else App.showAuth();
});
