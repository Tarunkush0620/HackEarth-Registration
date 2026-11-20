(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#form');

  const DEFAULT_CFG = {
    eventName: 'WIE HackEarth 2.0 · 2026',
    dates: '29–30 Nov 2026',
    venue: 'Galgotias University, Greater Noida',
    fee: 400,
    allFemaleFee: 200,
    accommodationFeePerPerson: 1500,
    minMembers: 2,
    maxMembers: 4,
    tracks: [
      { id: 'sustainability-climate', label: 'Sustainability & Climate' },
      { id: 'ai-social-good', label: 'AI for Social Good' },
      { id: 'health-wellbeing', label: 'Health & Well-being' },
      { id: 'smart-communities', label: 'Smart Communities' },
    ],
    teams: [{"id":"001","num":1,"name":"TechVed","leader":"Tanmay Kumar","panel":1},{"id":"002","num":2,"name":"Iconic","leader":"Sakshi Negi","panel":1},{"id":"003","num":3,"name":"HackNova","leader":"Ayush Kumar","panel":1},{"id":"004","num":4,"name":"OmniCore","leader":"Shivam Mishra","panel":1},{"id":"005","num":5,"name":"Dev","leader":"aarav Yadav","panel":1},{"id":"006","num":6,"name":"Doctor Stone","leader":"Mohd Harish","panel":1},{"id":"007","num":7,"name":"Eternals","leader":"Yash Verma","panel":1},{"id":"008","num":8,"name":"Binary Ninjas","leader":"Faisal Ahmad Khan","panel":1},{"id":"009","num":9,"name":"UAU","leader":"Prachi Aggarwal","panel":1},{"id":"010","num":10,"name":"Code Breaker","leader":"Anmol Verma","panel":1},{"id":"011","num":11,"name":"Pitwall Intelligence","leader":"Dhruv Mittal","panel":1},{"id":"012","num":12,"name":"Tech Titans","leader":"Priyanka Ramchandani","panel":1},{"id":"013","num":13,"name":"Xray Coders","leader":"Raj Kumar Gupta","panel":1},{"id":"014","num":14,"name":"SHADOW AI","leader":"DIVYANSH PANDEY","panel":1},{"id":"015","num":15,"name":"Pragati","leader":"Soumya Srivastava","panel":1},{"id":"016","num":16,"name":"SheCodes","leader":"Moupriya Das","panel":1},{"id":"017","num":17,"name":"CoddyIO","leader":"Jatin Garg","panel":1},{"id":"018","num":18,"name":"TRIVIA","leader":"Aayushi Kashyap","panel":1},{"id":"019","num":19,"name":"Shudarshan","leader":"Shikher Singh","panel":1},{"id":"020","num":20,"name":"son?","leader":"Tanuj Pathak","panel":1},{"id":"021","num":21,"name":"X","leader":"Harshit Ojha Ojha","panel":1},{"id":"022","num":22,"name":"Beyond Codes","leader":"Arjav Jain","panel":1},{"id":"023","num":23,"name":"Krisha","leader":"Pavani Agrawal","panel":2},{"id":"024","num":24,"name":"Artemis","leader":"Soumya Chaudhary","panel":2},{"id":"025","num":25,"name":"The Notion","leader":"Akanksha Kedia","panel":2},{"id":"026","num":26,"name":"E-VAIDYA","leader":"Shivam Tyagi","panel":2},{"id":"027","num":27,"name":"BroCode","leader":"Hardik Singal","panel":2},{"id":"028","num":28,"name":"Curious Coders","leader":"Harsh Goel","panel":2},{"id":"029","num":29,"name":"TEAM SARATHI","leader":"Vikash Kumar","panel":2},{"id":"030","num":30,"name":"AURA leaders","leader":"SILAMBARASAN C","panel":2},{"id":"031","num":31,"name":"Ñexacode","leader":"Gautam Kumar","panel":2},{"id":"032","num":32,"name":"AI Healthcare Assistant","leader":"Mumtaz Fatma","panel":2},{"id":"033","num":33,"name":"InnovoCreator","leader":"Jakkam Shambavi Saimamba","panel":2},{"id":"034","num":34,"name":"Codezilla","leader":"Rishabh Rathore","panel":2},{"id":"035","num":35,"name":"Algo avengers","leader":"Jitesh Sharma","panel":2},{"id":"036","num":36,"name":"NexGen","leader":"Nidhi Dhiman","panel":2},{"id":"037","num":37,"name":"Team Genesis","leader":"anamika tanwar","panel":2},{"id":"038","num":38,"name":"ciphernova","leader":"krishna kumar gupta","panel":2},{"id":"039","num":39,"name":"BuildForTomorrow","leader":"Satyam Kumar","panel":2},{"id":"040","num":40,"name":"NeuraNova","leader":"Vaibhav Jain","panel":2},{"id":"041","num":41,"name":"Green Innovators","leader":"Vaidya Sharanya","panel":2},{"id":"042","num":42,"name":"Electronerds","leader":"NIKHIL KUMAR GAUR","panel":2},{"id":"043","num":43,"name":"The Hack Hub","leader":"Abhinash Kumar","panel":3},{"id":"044","num":44,"name":"Code caffeine","leader":"Stuti Mehrotra","panel":3},{"id":"045","num":45,"name":"Team_SBS","leader":"Ayush Jha","panel":3},{"id":"046","num":46,"name":"Team Mechatrons","leader":"Agrim Gupta","panel":3},{"id":"047","num":47,"name":"SanVi","leader":"Sandhya Kumari","panel":3},{"id":"048","num":48,"name":"InnovHERs","leader":"Jai Saxena","panel":3},{"id":"049","num":49,"name":"NOIZ","leader":"Saksham Negi","panel":3},{"id":"050","num":50,"name":"Kanda Poha","leader":"Shaan Shukla","panel":3},{"id":"051","num":51,"name":"Zenvyx","leader":"Tanish Mangla","panel":3},{"id":"052","num":52,"name":"Kajukatli","leader":"Diptanshu jamar","panel":3},{"id":"053","num":53,"name":"hackerszz","leader":"Kalyani Agarwal","panel":3},{"id":"054","num":54,"name":"BlueWeave Team","leader":"Dharanidharan T","panel":3},{"id":"055","num":55,"name":"Innovators","leader":"Vanshika Goswami","panel":3},{"id":"056","num":56,"name":"Achievers","leader":"Saanvi Gupta","panel":3},{"id":"057","num":57,"name":"Mechatrons","leader":"Dejosri Elangovan","panel":3},{"id":"058","num":58,"name":"Team Innovaters","leader":"Siddharth Johari","panel":3},{"id":"059","num":59,"name":"pair programming","leader":"Prachi singh","panel":3},{"id":"060","num":60,"name":"Team Resence","leader":"Piyush Singh","panel":3},{"id":"061","num":61,"name":"Tech Innovators","leader":"Tisha Kothari","panel":3},{"id":"062","num":62,"name":"Harry","leader":"Harsh Pandey Pandey","panel":3},{"id":"063","num":63,"name":"CivicNex","leader":"Prabjot Singh Singh","panel":3},{"id":"064","num":64,"name":"White Tiger","leader":"Pawan Chaturvedi","panel":4},{"id":"065","num":65,"name":"Two shadows","leader":"Lalitha S","panel":4},{"id":"066","num":66,"name":"HERNOVA","leader":"Rohit Kumar dev","panel":4},{"id":"067","num":67,"name":"PARTH","leader":"Arav AGARWAL","panel":4},{"id":"068","num":68,"name":"Code Slayers","leader":"Arya Pandey","panel":4},{"id":"069","num":69,"name":"4stack","leader":"Varun Sah Sah","panel":4},{"id":"070","num":70,"name":"Byteforce","leader":"Ankit Kumar Yadav","panel":4},{"id":"071","num":71,"name":"Codex","leader":"Ishan","panel":4},{"id":"072","num":72,"name":"NEXORA","leader":"Shashwat Kumar Chaurasiya","panel":4},{"id":"073","num":73,"name":"Codetopia","leader":"Farhan Khan","panel":4},{"id":"074","num":74,"name":"Innovexa","leader":"Harsh Bhatnagar","panel":4},{"id":"075","num":75,"name":"Innovatrix","leader":"Tanmay Agarwal Agarwal","panel":4},{"id":"076","num":76,"name":"CodeCrew","leader":"Devansh Kotiyal","panel":4},{"id":"077","num":77,"name":"NovaX","leader":"SAMRUDDHI WAYKAR","panel":4},{"id":"078","num":78,"name":"Janlewa_Coders","leader":"Naitik Jain","panel":4},{"id":"079","num":79,"name":"Divya Prakash Rai","leader":"Ayushi Maurya Maurya","panel":4},{"id":"080","num":80,"name":"Zero Latency","leader":"Harsh","panel":4},{"id":"081","num":81,"name":"Matrix","leader":"Riyush Rai","panel":4},{"id":"082","num":82,"name":"Wampire Slayers","leader":"Prashant Pandey","panel":4},{"id":"083","num":83,"name":"Chrome Cartel","leader":"Swapnil Jadoun","panel":4},{"id":"084","num":84,"name":"cybernova","leader":"Saniya parveen","panel":5},{"id":"085","num":85,"name":"TECH_TITANS","leader":"HARSH VERMA","panel":5},{"id":"086","num":86,"name":"Glitch Hunters","leader":"Ayush Singh","panel":5},{"id":"087","num":87,"name":"DuoX","leader":"Pratha Varshney","panel":5},{"id":"088","num":88,"name":"Zero Toxic","leader":"Pragya Rajwanshi","panel":5},{"id":"089","num":89,"name":"Mind Monks","leader":"Akanksha Singh","panel":5},{"id":"090","num":90,"name":"Tech Karma","leader":"Aryan Chourasia","panel":5},{"id":"091","num":91,"name":"Onslaught","leader":"Aman Patel","panel":5},{"id":"092","num":92,"name":"Sakhibridge","leader":"Yuv Chaudhary","panel":5},{"id":"093","num":93,"name":"UNITx","leader":"utkarsh verma","panel":5},{"id":"094","num":94,"name":"Power Rangers","leader":"Meenu","panel":5},{"id":"095","num":95,"name":"Nova Core","leader":"Rajni Kumari","panel":5},{"id":"096","num":96,"name":"ULTRON","leader":"ANSHU KUMAR MISHRA","panel":5},{"id":"097","num":97,"name":"Ghost","leader":"Kunwar Divyam","panel":5},{"id":"098","num":98,"name":"SHE CODES","leader":"Bhoomika Kalra","panel":5},{"id":"099","num":99,"name":"Glitching Pixels","leader":"Harveer","panel":5},{"id":"100","num":100,"name":"TEAM AQUA","leader":"Shlok Gupta","panel":5},{"id":"101","num":101,"name":"The Conquerors","leader":"Srishti Yadav Yadav","panel":5},{"id":"102","num":102,"name":"INSPINOVA","leader":"Divyanshu Raj","panel":5},{"id":"103","num":103,"name":"TEAM AURA","leader":"SHASHANK GODUGU","panel":5},{"id":"104","num":104,"name":"Luminary","leader":"Aishwarya Singh","panel":6},{"id":"105","num":105,"name":"Team Ignis","leader":"Simran Yadav","panel":6},{"id":"106","num":106,"name":"Electro trio","leader":"RUKASHINI K","panel":6},{"id":"107","num":107,"name":"Bangers","leader":"Sagar Pathak","panel":6},{"id":"108","num":108,"name":"Team Nirmaan","leader":"Aman Sharma","panel":6},{"id":"109","num":109,"name":"CODEFLUX","leader":"Aditya Jha","panel":6},{"id":"110","num":110,"name":"CodeQuasters","leader":"Navya Gupta","panel":6},{"id":"111","num":111,"name":"The Mavericks","leader":"Priyanka Kumari","panel":6},{"id":"112","num":112,"name":"PUSH Panthers","leader":"Hardik Garg","panel":6},{"id":"113","num":113,"name":"CyberVortex","leader":"Aditi Tandon","panel":6},{"id":"114","num":114,"name":"Agent Forge","leader":"Asmita Tripathi","panel":6},{"id":"115","num":115,"name":"Hypercode","leader":"SAUMYA MAURYA MAURYA","panel":6},{"id":"116","num":116,"name":"Kafka","leader":"Ayush Verma","panel":6},{"id":"117","num":117,"name":"Hackgen","leader":"Nikhil Sharma","panel":6},{"id":"118","num":118,"name":"WayFinders","leader":"Sahil Rana","panel":6},{"id":"119","num":119,"name":"Jan drishti","leader":"Pushkar Sachdeva","panel":6},{"id":"120","num":120,"name":"TEAM JARVIS","leader":"Aditya Mittal","panel":6},{"id":"121","num":121,"name":"Stackvane","leader":"Aryan Chikara","panel":6},{"id":"122","num":122,"name":"Nini gang","leader":"Priyanshu","panel":6},{"id":"123","num":123,"name":"CyberPaths","leader":"Shivanshi Vishwakarma","panel":6},{"id":"124","num":124,"name":"NexAI","leader":"Arush Gupta","panel":7},{"id":"125","num":125,"name":"She-Sheild AI","leader":"Manvi Kr","panel":7},{"id":"126","num":126,"name":"OneSolution","leader":"Vansh Gautam","panel":7},{"id":"127","num":127,"name":"PrintAPM","leader":"Jagat Prakash","panel":7},{"id":"128","num":128,"name":"TheVisionGuild","leader":"Nitin Kumar Singh","panel":7},{"id":"129","num":129,"name":"UnPaid Interns","leader":"Mustafa Abdabhaiwala","panel":7},{"id":"130","num":130,"name":"Fourth Dimensions","leader":"Gaurav Pratap Singh","panel":7},{"id":"131","num":131,"name":"Blueprint","leader":"Purnika Tiwari","panel":7},{"id":"132","num":132,"name":"TechSolvers","leader":"Ahan Raj","panel":7},{"id":"133","num":133,"name":"Buzzer","leader":"Mayank Patel","panel":7},{"id":"134","num":134,"name":"Cryptic Coders","leader":"Jeeraj Pal","panel":7},{"id":"135","num":135,"name":"Careeer coders","leader":"Mohd Saif Ansari","panel":7},{"id":"136","num":136,"name":"TheGameChangers","leader":"Manjari Tripathi","panel":7},{"id":"137","num":137,"name":"Robin Hoods","leader":"Joydeep Singh Bedi","panel":7},{"id":"138","num":138,"name":"Prithv-E","leader":"Dhruv Soran","panel":7},{"id":"139","num":139,"name":"Khote Sikkey","leader":"Kapish Rawat","panel":7},{"id":"140","num":140,"name":"JimJam","leader":"Aditya","panel":7},{"id":"141","num":141,"name":"Decoders","leader":"Akshat Auliyan","panel":7},{"id":"142","num":142,"name":"AlphaCoder","leader":"Ritik Pandey","panel":7},{"id":"143","num":143,"name":"Tech Titans","leader":"Shivsagar","panel":7},{"id":"144","num":144,"name":"Pharma Minds","leader":"Monisha Gupta","panel":7},{"id":"145","num":145,"name":"She Knows","leader":"Khilari Saini","panel":7},{"id":"146","num":146,"name":"SnapTrons","leader":"Priyanshi Garg","panel":8},{"id":"147","num":147,"name":"She Shield","leader":"Vedika Pandey","panel":8},{"id":"148","num":148,"name":"Slytherin","leader":"shivam Kashyap","panel":8},{"id":"149","num":149,"name":"Phoenix","leader":"Nishant Kumar","panel":8},{"id":"150","num":150,"name":"SHYNE","leader":"NEERAJ Singh","panel":8},{"id":"151","num":151,"name":"HackSphere","leader":"Tanya Chandra","panel":8},{"id":"152","num":152,"name":"Kiko","leader":"Dev Vardhan","panel":8},{"id":"153","num":153,"name":"Hacker Duo","leader":"Sneha Vashisht","panel":8},{"id":"154","num":154,"name":"Butter_Naan","leader":"Aryash Jain","panel":8},{"id":"155","num":155,"name":"POWER RANGERS","leader":"Aadi Dhankhar","panel":8},{"id":"156","num":156,"name":"NexaForge","leader":"Lovekush Goyal","panel":8},{"id":"157","num":157,"name":"Titans","leader":"ARNAV YADAV","panel":8},{"id":"158","num":158,"name":"UniDevs","leader":"Anadi Gupta","panel":8},{"id":"159","num":159,"name":"MeshMinds","leader":"Kinjal Rohilla","panel":8},{"id":"160","num":160,"name":"Vrases","leader":"Shivam Mishra","panel":8},{"id":"161","num":161,"name":"SPARKS_SKY","leader":"Shyam Sundar Gosai","panel":8},{"id":"162","num":162,"name":"Runtime Terror","leader":"Vijay Prasad","panel":8},{"id":"163","num":163,"name":"SYNCURA","leader":"SHRESTHI RS","panel":8},{"id":"164","num":164,"name":"Rot Brains","leader":"Vaibhav Khanna","panel":8},{"id":"165","num":165,"name":"Elite Engine","leader":"Keshav Gupta","panel":8},{"id":"166","num":166,"name":"The Debuggers","leader":"Md Alfaaz","panel":8}],
  };

  const state = { size: 2, cfg: DEFAULT_CFG };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- errors ---------- */
  function clearErrors() {
    document.querySelectorAll('[data-err]').forEach((e) => (e.textContent = ''));
    document.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    $('#formErr').textContent = '';
  }
  function showErrors(errors) {
    let first = null;
    for (const [key, msg] of Object.entries(errors)) {
      const slot = document.querySelector(`[data-err="${key}"]`);
      if (slot) slot.textContent = msg;
      const input = document.querySelector(`[data-field="${key}"]`) || document.getElementById(key);
      if (input) { input.setAttribute('aria-invalid', 'true'); first = first || input; }
      else if (slot) first = first || slot;
    }
    if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus({ preventScroll: true }); }
  }

  form.addEventListener('input', (e) => {
    const key = e.target.dataset.field || e.target.id || e.target.name;
    if (key) {
      const slot = document.querySelector(`[data-err="${key}"]`);
      if (slot) slot.textContent = '';
      e.target.removeAttribute('aria-invalid');
    }
    debouncedSaveDraft();
  });
  form.addEventListener('change', (e) => {
    const key = e.target.dataset.field || e.target.id || e.target.name;
    if (key) {
      const slot = document.querySelector(`[data-err="${key}"]`);
      if (slot) slot.textContent = '';
      e.target.removeAttribute('aria-invalid');
    }
    debouncedSaveDraft();
  });

  /* ---------- members & pricing ---------- */
  function isTeamAllFemale() {
    const selects = [...document.querySelectorAll('[name=mgender]')];
    if (selects.length === 0) return false;
    return selects.every((s) => s.value === 'female');
  }

  function renderStayCountOptions() {
    const sel = $('#stayCount');
    if (!sel) return;
    const oldVal = parseInt(sel.value, 10);
    sel.innerHTML = '';
    for (let n = 1; n <= state.size; n++) {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = `${n} member${n > 1 ? 's' : ''} (Payable at venue on check-in)`;
      if (n === oldVal || (!oldVal && n === state.size)) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function updatePricing() {
    const allFemale = isTeamAllFemale();
    const regFee = allFemale ? (state.cfg?.allFemaleFee || 200) : (state.cfg?.fee || 400);

    const needStay = ($('input[name=needStay]:checked') || {}).value === 'yes';
    const stayWrapper = $('#stayCountWrapper');
    if (stayWrapper) stayWrapper.hidden = !needStay;

    let stayCount = 0;
    if (needStay) {
      const sel = $('#stayCount');
      stayCount = sel ? parseInt(sel.value, 10) || state.size : state.size;
      const subEl = $('#staySubtotal');
      if (subEl) {
        subEl.textContent = `ℹ️ Assistance Preference Recorded: Lodging requested for ${stayCount} member(s). No payment is charged on this portal. Partner check-in instructions and room allocations will be communicated directly. Estimated tariff (~₹1,500/guest) is payable on arrival.`;
      }
    }

    // Accommodation fee is NOT collected on this portal right now — only the team registration fee!
    const totalFee = regFee;

    const banner = $('#discountBanner');
    if (banner) banner.hidden = !allFemale;

    document.querySelectorAll('.fee-inline').forEach((n) => (n.textContent = totalFee.toLocaleString('en-IN')));
    const btn = $('#pay');
    if (btn && !btn.disabled) {
      let label = `Complete Registration (₹${totalFee.toLocaleString('en-IN')}) & Get RSVP Pass`;
      if (allFemale) {
        label = `Complete Registration (₹200 · All-Women Discount) & Get RSVP Pass`;
      }
      btn.textContent = label;
      btn.dataset.label = label;
    }
  }

  function renderMembers() {
    const box = $('#members');
    const old = [...box.querySelectorAll('.member')].map((m) => ({
      name: m.querySelector('[name=mname]') ? m.querySelector('[name=mname]').value : '',
      email: m.querySelector('[name=memail]') ? m.querySelector('[name=memail]').value : '',
      gender: m.querySelector('[name=mgender]') ? m.querySelector('[name=mgender]').value : '',
      phone: m.querySelector('[name=mphone]') ? m.querySelector('[name=mphone]').value : '',
      rollNumber: m.querySelector('[name=mroll]') ? m.querySelector('[name=mroll]').value : '',
    }));
    box.innerHTML = '';
    for (let i = 0; i < state.size; i++) {
      const v = old[i] || { name: '', email: '', gender: '', phone: '', rollNumber: '' };
      const el = document.createElement('div');
      el.className = 'member';
      el.innerHTML = `
        <h3>${i === 0 ? 'Team leader' : `Member ${i + 1}`}${i === 0 ? '<span class="tag">pays and receives primary pass</span>' : ''}</h3>
        <div class="grid2">
          <div class="field">
            <label for="m${i}n">Full name</label>
            <input id="m${i}n" name="mname" data-field="member${i}.name" maxlength="80" autocomplete="${i === 0 ? 'name' : 'off'}" value="${esc(v.name)}">
            <p class="err" data-err="member${i}.name" role="alert"></p>
          </div>
          <div class="field">
            <label for="m${i}e">Email address</label>
            <input id="m${i}e" name="memail" type="email" inputmode="email" data-field="member${i}.email" maxlength="120" autocomplete="${i === 0 ? 'email' : 'off'}" value="${esc(v.email)}">
            ${i === 0 ? '<p class="hint">Use the email you registered with on Unstop.</p>' : ''}
            <p class="err" data-err="member${i}.email" role="alert"></p>
          </div>
          <div class="field">
            <label for="m${i}p">Mobile number</label>
            <input id="m${i}p" name="mphone" type="tel" inputmode="numeric" data-field="member${i}.phone" maxlength="16" autocomplete="${i === 0 ? 'tel' : 'off'}" value="${esc(v.phone)}">
            <p class="hint">${i === 0 ? 'Primary contact for team coordination.' : 'Direct contact if separated on campus.'}</p>
            <p class="err" data-err="member${i}.phone" role="alert"></p>
          </div>
          <div class="field">
            <label for="m${i}g">Gender</label>
            <select id="m${i}g" name="mgender" data-field="member${i}.gender">
              <option value="">Select gender</option>
              <option value="female" ${v.gender === 'female' ? 'selected' : ''}>Female</option>
              <option value="male" ${v.gender === 'male' ? 'selected' : ''}>Male</option>
              <option value="other" ${v.gender === 'other' ? 'selected' : ''}>Other</option>
            </select>
            <p class="err" data-err="member${i}.gender" role="alert"></p>
          </div>
          <div class="field full-col">
            <label for="m${i}r">College Roll Number / Student ID Number</label>
            <input id="m${i}r" name="mroll" data-field="member${i}.rollNumber" maxlength="40" value="${esc(v.rollNumber)}" autocomplete="off">
            <p class="hint">Must match the physical College ID card presented at the entry desk.</p>
            <p class="err" data-err="member${i}.rollNumber" role="alert"></p>
          </div>
        </div>`;
      box.appendChild(el);
    }
    box.querySelectorAll('[name=mgender]').forEach((sel) => {
      sel.addEventListener('change', updatePricing);
    });
    updatePricing();
  }

  function renderSize() {
    const seg = $('#size');
    seg.innerHTML = '';
    for (let n = state.cfg.minMembers; n <= state.cfg.maxMembers; n++) {
      const l = document.createElement('label');
      l.innerHTML = `<input type="radio" name="size" value="${n}" ${n === state.size ? 'checked' : ''}><span>${n}</span>`;
      seg.appendChild(l);
    }
    seg.addEventListener('change', (e) => {
      state.size = Number(e.target.value);
      renderMembers();
      renderStayCountOptions();
      updatePricing();
    });
  }

  function renderTracks() {
    const sel = $('#track');
    if (sel && sel.tagName === 'SELECT') {
      const currentVal = sel.value;
      sel.innerHTML = '<option value="">Select your track...</option>';
      if (Array.isArray(state.cfg?.tracks)) {
        state.cfg.tracks.forEach((t) => {
          const opt = document.createElement('option');
          opt.value = t.id;
          opt.textContent = t.label;
          if (t.id === currentVal) opt.selected = true;
          sel.appendChild(opt);
        });
      }
      return;
    }
    const box = $('#tracks');
    if (box) {
      box.innerHTML = '';
      if (Array.isArray(state.cfg?.tracks)) {
        state.cfg.tracks.forEach((t) => {
          const l = document.createElement('label');
          l.className = 'tile';
          l.innerHTML = `<input type="radio" name="track" value="${esc(t.id)}"> ${esc(t.label)}`;
          box.appendChild(l);
        });
      }
    }
  }

  function findMatchingTeam(name, leader = '') {
    if (!state.cfg?.teams || !name) return null;
    const clean = String(name).trim();
    const key = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) return null;

    let list = state.cfg.teams.filter((t) => t.name.toLowerCase().trim() === clean.toLowerCase());
    if (list.length === 0) {
      list = state.cfg.teams.filter((t) => t.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key);
    }
    if (list.length > 1 && leader) {
      const lKey = leader.toLowerCase().replace(/[^a-z0-9]/g, '');
      const byL = list.find((t) => {
        const tlKey = t.leader.toLowerCase().replace(/[^a-z0-9]/g, '');
        return lKey.includes(tlKey) || tlKey.includes(lKey);
      });
      if (byL) return byL;
    }
    if (list.length > 0) return list[0];

    const stripped = key.replace(/^team/, '');
    list = state.cfg.teams.filter((t) => {
      const tKey = t.name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^team/, '');
      return tKey === stripped || (stripped.length >= 3 && (tKey.startsWith(stripped) || stripped.startsWith(tKey)));
    });
    if (list.length > 1 && leader) {
      const lKey = leader.toLowerCase().replace(/[^a-z0-9]/g, '');
      const byL = list.find((t) => {
        const tlKey = t.leader.toLowerCase().replace(/[^a-z0-9]/g, '');
        return lKey.includes(tlKey) || tlKey.includes(lKey);
      });
      if (byL) return byL;
    }
    return list.length > 0 ? list[0] : null;
  }

  function renderTeamsDatalist() {
    const list = $('#teamsList');
    if (!list || !Array.isArray(state.cfg?.teams)) return;
    list.innerHTML = '';
    state.cfg.teams.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.label = `Team #${t.id} · Panel ${t.panel} (${t.leader})`;
      list.appendChild(opt);
    });
  }

  function updateTeamMatchBadge() {
    const badge = $('#teamMatchBadge');
    if (!badge) return;
    const teamInput = $('#teamName');
    const leaderInput = document.querySelector('[name=mname]');
    const val = (teamInput?.value || '').trim();
    const leaderVal = (leaderInput?.value || '').trim();

    if (!val || val.length < 2) {
      badge.hidden = true;
      badge.innerHTML = '';
      return;
    }

    const matched = findMatchingTeam(val, leaderVal);
    if (matched) {
      badge.hidden = false;
      badge.className = 'team-badge matched';
      badge.innerHTML = `✓ <b>Official Team #${matched.id}</b> · Panel ${matched.panel} · Leader: ${esc(matched.leader)}`;
      if (leaderInput && !leaderInput.value) {
        leaderInput.placeholder = matched.leader;
      }
    } else if (val.length >= 3) {
      badge.hidden = false;
      badge.className = 'team-badge unmatched';
      badge.innerHTML = `⚠️ Unlisted team name — please verify spelling with shortlist`;
    } else {
      badge.hidden = true;
      badge.innerHTML = '';
    }
  }

  /* ---------- Payment proof upload handler ---------- */
  let proofBase64 = '';

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function handleProofFile(file) {
    if (!file) return;
    const errSlot = document.querySelector('[data-err="paymentProof"]');
    if (errSlot) errSlot.textContent = '';

    if (file.size > 10 * 1024 * 1024) {
      if (errSlot) errSlot.textContent = 'File is too large. Please upload an image under 10MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target.result;
      const isImg = file.type.startsWith('image/');

      if (isImg) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          proofBase64 = canvas.toDataURL('image/jpeg', 0.85);

          const thumb = $('#proofThumb');
          if (thumb) thumb.src = proofBase64;
          const nameEl = $('#proofFileName');
          if (nameEl) nameEl.textContent = file.name;
          const sizeEl = $('#proofFileSize');
          if (sizeEl) sizeEl.textContent = formatBytes(file.size);
          const promptEl = $('#uploadPrompt');
          if (promptEl) promptEl.hidden = true;
          const prevEl = $('#proofPreview');
          if (prevEl) prevEl.hidden = false;
        };
        img.src = rawData;
      } else {
        proofBase64 = rawData;
        const thumb = $('#proofThumb');
        if (thumb) thumb.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23b8337f"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
        const nameEl = $('#proofFileName');
        if (nameEl) nameEl.textContent = file.name;
        const sizeEl = $('#proofFileSize');
        if (sizeEl) sizeEl.textContent = formatBytes(file.size);
        const promptEl = $('#uploadPrompt');
        if (promptEl) promptEl.hidden = true;
        const prevEl = $('#proofPreview');
        if (prevEl) prevEl.hidden = false;
      }
    };
    reader.readAsDataURL(file);
  }

  const fileInput = $('#paymentProof');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleProofFile(file);
    });
  }

  const btnChange = $('#btnChangeProof');
  if (btnChange) {
    btnChange.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      proofBase64 = '';
      if (fileInput) fileInput.value = '';
      const prevEl = $('#proofPreview');
      if (prevEl) prevEl.hidden = true;
      const promptEl = $('#uploadPrompt');
      if (promptEl) promptEl.hidden = false;
      if (fileInput) fileInput.click();
    });
  }

  const dropzone = $('#proofDropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        if (fileInput) fileInput.files = e.dataTransfer.files;
        handleProofFile(file);
      }
    });
  }

  const utrInput = $('#utrNumber');
  if (utrInput) {
    utrInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
    });
  }

  /* ---------- collect + submit ---------- */
  function collect() {
    const needStay = ($('input[name=needStay]:checked') || {}).value === 'yes';
    const stayCount = needStay ? (parseInt(($('#stayCount') || {}).value, 10) || state.size) : 0;
    const members = [...document.querySelectorAll('.member')].map((m) => ({
      name: (m.querySelector('[name=mname]') || {}).value || '',
      email: (m.querySelector('[name=memail]') || {}).value || '',
      gender: (m.querySelector('[name=mgender]') || {}).value || '',
      phone: (m.querySelector('[name=mphone]') || {}).value || '',
      rollNumber: (m.querySelector('[name=mroll]') || {}).value || '',
    }));
    const leaderPhone = members[0] ? members[0].phone : '';
    const trackVal = ($('#track') && $('#track').tagName === 'SELECT')
      ? $('#track').value
      : (form.querySelector('[name=track]:checked') || {}).value || ($('#track') || {}).value || '';

    return {
      teamName: ($('#teamName') || {}).value || '',
      unstopTeamId: ($('#unstopTeamId') || {}).value || '',
      college: ($('#college') || {}).value || '',
      city: ($('#city') || {}).value || '',
      needStay: needStay ? 'yes' : 'no',
      stayCount,
      ideaTitle: ($('#ideaTitle') || {}).value || '',
      track: trackVal,
      txnId: ($('#txnId') || {}).value ? $('#txnId').value.trim() : '',
      utrNumber: ($('#utrNumber') || {}).value ? $('#utrNumber').value.trim() : '',
      paymentProof: proofBase64 || '',
      leaderPhone,
      emergencyName: ($('#emergencyName') || {}).value || '',
      emergencyRelation: ($('#emergencyRelation') || {}).value || '',
      emergencyPhone: ($('#emergencyPhone') || {}).value || '',
      consent: ($('#consent') || {}).checked || false,
      members,
    };
  }

  async function post(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data = {};
    try { data = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data };
  }

  function setBusy(b, label) {
    const btn = $('#pay');
    if (!btn) return;
    btn.disabled = b;
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    btn.innerHTML = b ? label : btn.dataset.label || btn.innerHTML;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const body = collect();

    // Instant client validation for required fields
    const clientErrors = {};
    const txn = (body.txnId || '').trim();
    const utr = (body.utrNumber || '').trim();
    if (!txn && !utr) {
      clientErrors.txnId = 'Enter your Paytm Transaction ID or 12-digit UPI UTR number.';
    } else {
      if (txn && txn.length < 6) {
        clientErrors.txnId = 'Paytm Transaction ID should be at least 6 characters.';
      }
      if (utr && !/^\d{12}$/.test(utr)) {
        clientErrors.utrNumber = 'UPI UTR must be an exact 12-digit number (e.g. 405234123456).';
      }
    }
    if (!body.paymentProof) {
      clientErrors.paymentProof = 'Please upload a screenshot of your payment receipt.';
    }
    if (!body.consent) {
      clientErrors.consent = 'Please confirm to continue.';
    }
    if (Object.keys(clientErrors).length > 0) {
      return showErrors(clientErrors);
    }

    setBusy(true, 'Verifying payment & generating RSVP pass…');
    try {
      const res = await post('/api/create-order', body);
      if (!res.ok) {
        setBusy(false);
        if (res.data && res.data.errors) return showErrors(res.data.errors);
        $('#formErr').textContent = (res.data && (res.data.error || res.data.message)) || 'Something went wrong. Please check your details and try again.';
        return;
      }
      showDone(res.data);
    } catch {
      setBusy(false);
      $('#formErr').textContent = 'Network problem. Check your connection and try again.';
    }
  });

  function showDone(d) {
    $('.layout').hidden = true;
    const done = $('#done');
    done.hidden = false;
    const teamIdStr = d.teamId || '001';
    const discountNote = d.isAllFemale ? ' 🎉 (All-Women Team Discount Applied · ₹200 reg)' : '';
    const stayNote = d.needStay ? ` · 🏨 Stay booked for ${d.stayCount} person(s)` : '';
    $('#doneMsg').textContent = `Team ${d.teamName} (Team #${teamIdStr}) is confirmed.${discountNote}${stayNote} Show this QR at the entry desk.`;
    $('#qrImg').src = d.qr;
    if ($('#doneTeamId')) $('#doneTeamId').textContent = teamIdStr;
    $('#doneCode').textContent = d.regCode;
    const refParts = [d.paytmTxnId || ($('#txnId') ? $('#txnId').value.trim() : ''), d.utrNumber || ($('#utrNumber') ? $('#utrNumber').value.trim() : '')].filter(Boolean);
    if ($('#doneTxn')) $('#doneTxn').textContent = refParts.length ? refParts.join(' / UTR: ') : 'Confirmed';
    $('#dl').href = d.qr;
    $('#dl').setAttribute('download', `HackEarth-RSVP-Team${teamIdStr}-${d.regCode}.png`);

    const dlPdf = $('#dlPdf');
    if (dlPdf && d.invoicePdf) {
      dlPdf.href = d.invoicePdf;
      dlPdf.setAttribute('download', `HackEarth-Invoice-Team${teamIdStr}-${d.regCode}.pdf`);
      dlPdf.hidden = false;
    }

    // Calendar link
    const calBtn = $('#btnCal');
    if (calBtn) {
      const calTitle = encodeURIComponent(`WIE HackEarth 2.0 (Team #${teamIdStr} - ${d.teamName})`);
      const calDesc = encodeURIComponent(`Final round registration confirmed! Team ID: #${teamIdStr} · Registration ID: ${d.regCode}. Venue check-in begins 9:00 AM on 29 Nov 2026.${d.needStay ? ' Accommodation booked with university shuttle.' : ''}`);
      const calLoc = encodeURIComponent(`Galgotias University, Plot No. 2, Yamuna Expressway, Sector 17A, Greater Noida, UP 203201`);
      calBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=20261129T033000Z/20261130T123000Z&details=${calDesc}&location=${calLoc}`;
    }

    $('#doneEmail').textContent = d.emailed
      ? `A copy was emailed to ${d.emails.join(', ')}.`
      : 'Your email is being sent. If it does not arrive in a few minutes, download the QR above and write to the organisers.';
    clearDraft();
    window.scrollTo({ top: done.offsetTop - 20, behavior: 'smooth' });
  }

  /* ---------- LocalStorage Draft Auto-Save & Restore ---------- */
  const DRAFT_KEY = 'he26_form_draft_v1';
  let saveDraftTimer = null;

  function debouncedSaveDraft() {
    clearTimeout(saveDraftTimer);
    saveDraftTimer = setTimeout(saveDraft, 300);
  }

  function saveDraft() {
    try {
      const data = {
        teamName: ($('#teamName') || {}).value || '',
        unstopTeamId: ($('#unstopTeamId') || {}).value || '',
        college: ($('#college') || {}).value || '',
        city: ($('#city') || {}).value || '',
        ideaTitle: ($('#ideaTitle') || {}).value || '',
        track: ($('#track') || {}).value || '',
        size: state.size,
        needStay: ($('input[name=needStay]:checked') || {}).value || 'no',
        stayCount: ($('#stayCount') || {}).value || '',
        emergencyName: ($('#emergencyName') || {}).value || '',
        emergencyRelation: ($('#emergencyRelation') || {}).value || '',
        emergencyPhone: ($('#emergencyPhone') || {}).value || '',
        txnId: ($('#txnId') || {}).value || '',
        utrNumber: ($('#utrNumber') || {}).value || '',
        members: [...document.querySelectorAll('.member')].map((m) => ({
          name: (m.querySelector('[name=mname]') || {}).value || '',
          email: (m.querySelector('[name=memail]') || {}).value || '',
          gender: (m.querySelector('[name=mgender]') || {}).value || '',
          phone: (m.querySelector('[name=mphone]') || {}).value || '',
          rollNumber: (m.querySelector('[name=mroll]') || {}).value || '',
        })),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {}
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;

      if (data.teamName && $('#teamName')) $('#teamName').value = data.teamName;
      if (data.unstopTeamId && $('#unstopTeamId')) $('#unstopTeamId').value = data.unstopTeamId;
      if (data.college && $('#college')) $('#college').value = data.college;
      if (data.city && $('#city')) $('#city').value = data.city;
      if (data.ideaTitle && $('#ideaTitle')) $('#ideaTitle').value = data.ideaTitle;
      if (data.track && $('#track')) $('#track').value = data.track;
      if (data.emergencyName && $('#emergencyName')) $('#emergencyName').value = data.emergencyName;
      if (data.emergencyRelation && $('#emergencyRelation')) $('#emergencyRelation').value = data.emergencyRelation;
      if (data.emergencyPhone && $('#emergencyPhone')) $('#emergencyPhone').value = data.emergencyPhone;
      if (data.txnId && $('#txnId')) $('#txnId').value = data.txnId;
      if (data.utrNumber && $('#utrNumber')) $('#utrNumber').value = data.utrNumber;

      if (data.size && data.size >= state.cfg.minMembers && data.size <= state.cfg.maxMembers) {
        state.size = data.size;
        const sizeRadio = document.querySelector(`input[name=size][value="${data.size}"]`);
        if (sizeRadio) sizeRadio.checked = true;
      }

      if (data.needStay) {
        const stayRadio = document.querySelector(`input[name=needStay][value="${data.needStay}"]`);
        if (stayRadio) stayRadio.checked = true;
      }

      if (Array.isArray(data.members) && data.members.length > 0) {
        renderMembers();
        const memberEls = document.querySelectorAll('.member');
        data.members.forEach((m, idx) => {
          const el = memberEls[idx];
          if (!el) return;
          if (m.name && el.querySelector('[name=mname]')) el.querySelector('[name=mname]').value = m.name;
          if (m.email && el.querySelector('[name=memail]')) el.querySelector('[name=memail]').value = m.email;
          if (m.gender && el.querySelector('[name=mgender]')) el.querySelector('[name=mgender]').value = m.gender;
          if (m.phone && el.querySelector('[name=mphone]')) el.querySelector('[name=mphone]').value = m.phone;
          if (m.rollNumber && el.querySelector('[name=mroll]')) el.querySelector('[name=mroll]').value = m.rollNumber;
        });
      }

      renderStayCountOptions();
      if (data.stayCount && $('#stayCount')) $('#stayCount').value = data.stayCount;
      updatePricing();
      updateTeamMatchBadge();
    } catch {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  /* ---------- policy dialog modal ---------- */
  const modal = $('#policyModal');
  const modalTitle = $('#policyTitle');
  const modalBody = $('#policyBody');
  const modalClose = $('#policyClose');

  if (modal && modalClose) {
    modalClose.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });

    document.querySelectorAll('a[data-policy]').forEach((link) => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const url = link.getAttribute('href');
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('Failed to load');
          const htmlText = await resp.text();
          const doc = new DOMParser().parseFromString(htmlText, 'text/html');
          const card = doc.querySelector('.policy-card');
          if (card) {
            const h1 = card.querySelector('h1');
            modalTitle.textContent = h1 ? h1.textContent : 'Policy';
            if (h1) h1.remove();
            modalBody.innerHTML = card.innerHTML;
            modal.showModal();
            return;
          }
        } catch {
          window.open(url, '_blank');
          return;
        }
        window.location.href = url;
      });
    });
  }

  /* ---------- boot ---------- */
  function applyConfig(cfg) {
    state.cfg = cfg;
    if ($('#f-dates')) $('#f-dates').textContent = cfg.dates;
    if ($('#f-venue')) $('#f-venue').textContent = cfg.venue;
    if ($('#f-fee')) $('#f-fee').innerHTML = `₹${cfg.fee} <span class="wie-tag">(₹${cfg.allFemaleFee || 200} for all-female)</span>`;
    document.querySelectorAll('.fee-inline').forEach((n) => (n.textContent = cfg.fee));
    document.querySelectorAll('.stay-rate-inline').forEach((n) => (n.textContent = (cfg.estimatedStayRate || 1500).toLocaleString('en-IN')));
    renderSize();
    renderMembers();
    renderTracks();
    renderTeamsDatalist();
    renderStayCountOptions();
    updatePricing();
    updateTeamMatchBadge();
  }

  // Initial immediate render with defaults
  applyConfig(DEFAULT_CFG);
  restoreDraft();

  document.querySelectorAll('input[name=needStay]').forEach((r) => r.addEventListener('change', updatePricing));
  const teamInputEl = $('#teamName');
  if (teamInputEl) {
    teamInputEl.addEventListener('input', updateTeamMatchBadge);
    teamInputEl.addEventListener('change', updateTeamMatchBadge);
  }
  const staySel = $('#stayCount');
  if (staySel) staySel.addEventListener('change', updatePricing);

  // Sync with server if available
  fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((cfg) => {
      if (cfg && cfg.tracks) applyConfig(cfg);
    })
    .catch(() => {});
})();
