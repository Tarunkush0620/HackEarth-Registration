(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = 'he_scan_token';
  const ORG_KEY = 'he_scan_org';
  const ROLE_KEY = 'he_scan_role';

  let token = localStorage.getItem(KEY) || '';
  let currentOrg = localStorage.getItem(ORG_KEY) || 'Organiser';
  let currentRole = localStorage.getItem(ROLE_KEY) || 'viewer';

  let stream = null, scanning = false, lastText = '', lastAt = 0, busy = false, tabNow = 'scan';
  let currentRecord = null;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TRACKS = {
    'sustainability-climate': 'Sustainability & Climate',
    'ai-social-good': 'AI for Social Good',
    'health-wellbeing': 'Health & Well-being',
    'smart-communities': 'Smart Communities',
  };
  const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');

  /* ---------- API Wrapper ---------- */
  async function api(path, opts = {}) {
    const r = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
    });
    let data = {};
    try { data = await r.json(); } catch {}
    if (r.status === 401 && path !== '/api/login') { lock(); throw new Error('locked'); }
    return { ok: r.ok, status: r.status, data };
  }

  /* ---------- Lock / Unlock Organiser Portal ---------- */
  function lock() {
    token = '';
    currentOrg = '';
    currentRole = 'viewer';
    localStorage.removeItem(KEY);
    localStorage.removeItem(ORG_KEY);
    localStorage.removeItem(ROLE_KEY);
    stopCamera();
    $('#app').hidden = true;
    $('#result').hidden = true;
    $('#editModal').hidden = true;
    $('#login').hidden = false;
  }

  async function unlock(orgName, role) {
    if (orgName) {
      currentOrg = orgName;
      localStorage.setItem(ORG_KEY, orgName);
    }
    if (role) {
      currentRole = role;
      localStorage.setItem(ROLE_KEY, role);
    }

    const badge = $('#currentOrgBadge');
    const orgSpan = $('#currentOrgName');
    if (badge && orgSpan) {
      if (currentRole === 'super_admin') {
        badge.className = 'current-org super-admin-badge';
        orgSpan.textContent = `👑 ${currentOrg} (Super Admin)`;
      } else {
        badge.className = 'current-org viewer-badge';
        orgSpan.textContent = `👤 ${currentOrg} (View Only)`;
      }
    }

    $('#login').hidden = true;
    $('#app').hidden = false;
    refreshStats();
    setInterval(refreshStats, 20000);
    if (tabNow === 'scan') startCamera();
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#loginErr').textContent = '';
    const pin = $('#passcode').value;
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        $('#loginErr').textContent = d.error || 'Invalid PIN.';
        return;
      }
      token = d.token;
      localStorage.setItem(KEY, token);
      const name = d.organiser ? d.organiser.name : 'Organiser';
      const role = d.organiser ? d.organiser.role : 'viewer';
      $('#passcode').value = '';
      unlock(name, role);
    } catch {
      $('#loginErr').textContent = 'Network error contacting server.';
    }
  });

  $('#logout').addEventListener('click', lock);

  /* ---------- Live Stats Refresher ---------- */
  async function refreshStats() {
    if (!token) return;
    try {
      const { ok, data } = await api('/api/stats');
      if (ok) {
        $('#cIn').textContent = data.checkedIn || 0;
        $('#cAll').textContent = data.paid || 0;
        const pct = data.paid ? Math.round(100 * data.checkedIn / data.paid) : 0;
        $('#meterFill').style.width = pct + '%';
        if ($('#badgeStay')) $('#badgeStay').textContent = `${data.stayTeams || 0} Stay Booked`;
        if ($('#badgeWomen')) $('#badgeWomen').textContent = `${data.allFemale || 0} All-Women`;
      }
    } catch {}
  }

  /* ---------- Audio Feedback & Vibration ---------- */
  let ac;
  function beep(freq, ms, type = 'sine') {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ac.destination);
      g.gain.setValueAtTime(0.2, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + ms / 1000);
      o.start();
      o.stop(ac.currentTime + ms / 1000);
    } catch {}
  }

  function feel(kind) {
    if (kind === 'ok') {
      beep(880, 160);
      setTimeout(() => beep(1174, 180), 90);
      if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
    } else if (kind === 'already') {
      beep(520, 260, 'triangle');
      if (navigator.vibrate) navigator.vibrate([100, 60, 100]);
    } else {
      beep(220, 360, 'sawtooth');
      if (navigator.vibrate) navigator.vibrate([220, 80, 220]);
    }
  }

  /* ---------- Camera & QR Frame Grabber ---------- */
  async function startCamera() {
    const msg = $('#camMsg');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      msg.textContent = 'Camera not available in this browser. Use photo upload or database search.';
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      });
      const v = $('#video');
      v.srcObject = stream;
      await v.play();
      msg.textContent = '';
      scanning = true;
      requestAnimationFrame(tick);
    } catch {
      msg.textContent = 'Camera permission required. Allow camera access or use photo upload.';
    }
  }

  function stopCamera() {
    scanning = false;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  const grab = $('#grab'), gctx = grab.getContext('2d', { willReadFrequently: true });
  let lastTick = 0;

  function tick(ts) {
    if (!scanning) return;
    requestAnimationFrame(tick);
    if (busy || tabNow !== 'scan' || ts - lastTick < 120) return;
    lastTick = ts;

    const v = $('#video');
    if (v.readyState < 2 || !v.videoWidth) return;

    const w = Math.min(720, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth);
    grab.width = w; grab.height = h;
    gctx.drawImage(v, 0, 0, w, h);

    const img = gctx.getImageData(0, 0, w, h);
    if (typeof jsQR !== 'undefined') {
      const hit = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
      if (hit && hit.data) onCode(hit.data);
    }
  }

  async function onCode(text) {
    const now = Date.now();
    if (text === lastText && now - lastAt < 4000) return;
    lastText = text;
    lastAt = now;
    busy = true;
    await submit({ payload: text });
  }

  /* Photo File Upload Fallback */
  $('#photo').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const bmp = await createImageBitmap(f);
      const w = Math.min(1600, bmp.width), h = Math.round(w * bmp.height / bmp.width);
      grab.width = w; grab.height = h;
      gctx.drawImage(bmp, 0, 0, w, h);
      const img = gctx.getImageData(0, 0, w, h);
      const hit = jsQR(img.data, w, h, { inversionAttempts: 'attemptBoth' });
      busy = true;
      if (hit && hit.data) {
        await submit({ payload: hit.data });
      } else {
        showResult({ status: 'invalid', note: 'No readable QR pass found in photo.' });
      }
    } catch {
      showResult({ status: 'invalid', note: 'Could not process the selected image file.' });
    }
  });

  /* Manual Code Form */
  $('#manualForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#manualCode').value.trim();
    if (!code) return;
    busy = true;
    await submit({ code });
  });

  /* ---------- Check-In Submission & Complete Details View ---------- */
  async function submit(body) {
    try {
      const { ok, data } = await api('/api/scan', { method: 'POST', body: JSON.stringify(body) });
      if (!ok) {
        showResult({ status: 'bad', note: data.error || 'Server error verifying pass.' });
        return;
      }
      showResult(data);
    } catch (e) {
      if (e.message !== 'locked') {
        showResult({ status: 'bad', note: 'No connection to server. Check network and scan again.' });
      }
    }
  }

  const ICONS = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>',
    already: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M12 5v9"/><circle cx="12" cy="19" r="0.6"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  function showResult(d) {
    currentRecord = d;
    const el = $('#result');
    const title = $('#rTitle'), team = $('#rTeam'), mem = $('#rMembers'), note = $('#rNote');
    const undo = $('#rUndo'), editBtn = $('#rEdit');
    const womenBadge = $('#rWomenBadge'), stayBadge = $('#rStayBadge');
    const stayCallout = $('#rStayCallout'), stayDetails = $('#rStayDetails');
    const auditStamp = $('#rAuditStamp'), checkedBy = $('#rCheckedBy'), checkedAt = $('#rCheckedAt');

    undo.hidden = true;
    editBtn.hidden = true;
    mem.innerHTML = '';
    note.textContent = '';
    team.textContent = '';
    $('#rTrack').textContent = '';
    womenBadge.hidden = true;
    stayBadge.hidden = true;
    stayCallout.hidden = true;
    auditStamp.hidden = true;

    let cls = 'bad';

    const populateComprehensiveDetails = () => {
      const teamIdStr = d.teamId || (d.teamNumber ? String(d.teamNumber).padStart(3, '0') : '001');
      if ($('#rTeamIdBadge')) $('#rTeamIdBadge').textContent = `Team #${teamIdStr}`;
      team.textContent = d.team || '';
      const trackName = TRACKS[d.track] || d.track || 'General Track';
      $('#rTrack').textContent = trackName;
      $('#rTrackFull').textContent = trackName;
      $('#rCode').textContent = d.code || '';
      $('#rIdeaTitle').textContent = d.ideaTitle || 'Not submitted';
      $('#rUnstopId').textContent = d.unstopTeamId || 'N/A';
      $('#rCollegeFull').textContent = [d.college, d.city].filter(Boolean).join(', ') || 'N/A';

      if (d.isAllFemale) womenBadge.hidden = false;
      if (d.needStay) {
        stayBadge.hidden = false;
        stayCallout.hidden = false;
        const gCount = d.stayCount || (d.members ? d.members.length : 1);
        stayDetails.textContent = `${gCount} Guest(s) Confirmed for ${d.team || 'Team'}. Includes Free University Shuttle Service. (₹${(gCount * 1500).toLocaleString('en-IN')} Paid)`;
      }

      // Leader details
      $('#rLeaderName').textContent = d.leaderName || 'N/A';
      const lPhone = $('#rLeaderPhone');
      lPhone.textContent = d.leaderPhone || 'N/A';
      lPhone.href = d.leaderPhone ? `tel:${d.leaderPhone}` : '#';
      const lEmail = $('#rLeaderEmail');
      lEmail.textContent = d.leaderEmail || 'N/A';
      lEmail.href = d.leaderEmail ? `mailto:${d.leaderEmail}` : '#';

      // Emergency Contact
      $('#rEmergencyName').textContent = `${d.emergencyName || 'Parent / Guardian'} (${d.emergencyRelation || 'Contact'})`;
      const emPhone = $('#rEmergencyPhone');
      emPhone.textContent = d.emergencyPhone || 'Not specified';
      emPhone.href = d.emergencyPhone ? `tel:${d.emergencyPhone}` : '#';

      // Payment Audit
      const feeInr = d.amountInr || (d.amountPaise ? Math.round(d.amountPaise / 100) : 0);
      $('#rAmountPaid').textContent = feeInr ? `₹${feeInr.toLocaleString('en-IN')} (Settled)` : 'Settled';
      $('#rPaymentId').textContent = d.razorpayPaymentId || d.razorpayOrderId || 'Settled';

      // Organiser Audit Stamp
      if (d.checkedIn) {
        auditStamp.hidden = false;
        checkedBy.textContent = d.checkedInBy || 'Organiser Desk';
        checkedAt.textContent = timeOf(d.checkedInAt) || 'Today';
      }

      // All Members Checklist with Presence Toggle (Present / Absent)
      const members = d.members || [];
      const totalCount = members.length;
      let presentCount = members.filter((m) => m.present !== false).length;

      if ($('#rPresentCount')) $('#rPresentCount').textContent = presentCount;
      if ($('#rTotalMembers')) $('#rTotalMembers').textContent = totalCount;

      mem.innerHTML = members.map((m, idx) => {
        const isPres = m.present !== false;
        return `
          <li class="r-member-item ${isPres ? '' : 'is-absent'}" id="memItem_${idx}">
            <div class="r-member-info">
              <div class="r-mname">
                ${idx + 1}. ${esc(m.name)} 
                <span style="font-weight:400; font-size:12px; color:var(--soft);">(${esc(m.gender || 'Student')}${idx === 0 ? ' · Team Leader' : ''})</span>
              </div>
              <div class="r-mroll">🪪 College Roll / Student ID: <code>${esc(m.rollNumber || 'Not specified')}</code></div>
              <div class="r-mcontact">📞 <a href="tel:${esc(m.phone || d.leaderPhone || '')}">${esc(m.phone || d.leaderPhone || 'N/A')}</a> &bull; ✉️ <a href="mailto:${esc(m.email || '')}">${esc(m.email || '')}</a></div>
            </div>
            <div class="attendance-toggle-wrap">
              <label class="attendance-badge-btn ${isPres ? 'present' : 'absent'}" id="lblAtt_${idx}">
                <input type="checkbox" class="chk-member-present" data-idx="${idx}" ${isPres ? 'checked' : ''}>
                <span id="txtAtt_${idx}">${isPres ? '✓ PRESENT' : '✗ ABSENT'}</span>
              </label>
            </div>
          </li>
        `;
      }).join('');
    };

    if (d.status === 'ok') {
      cls = 'ok';
      title.textContent = 'Admitted · Entry Confirmed';
      populateComprehensiveDetails();
      note.textContent = `Team verified by ${d.checkedInBy || 'Organiser'}.`;
    } else if (d.status === 'already') {
      cls = 'already';
      title.textContent = 'Already Checked In';
      populateComprehensiveDetails();
      note.textContent = `Previously admitted at ${timeOf(d.checkedInAt)} by ${d.checkedInBy || 'an organiser'}.`;
    } else if (d.status === 'unpaid') {
      title.textContent = 'Payment Not Completed';
      populateComprehensiveDetails();
      note.textContent = 'This team has not completed payment on the portal. Ask them to complete payment or consult Finance.';
    } else if (d.status === 'notfound') {
      title.textContent = 'Not Registered';
      note.textContent = `No team found for registration code "${d.code || ''}". Send them to the main desk.`;
    } else if (d.status === 'invalid') {
      title.textContent = 'Invalid / Forged QR Pass';
      note.textContent = d.note || 'The cryptographic signature of this QR pass is invalid. Do not admit.';
    } else {
      title.textContent = 'Verification Failed';
      note.textContent = d.note || 'Could not verify team. Try again.';
    }

    // Role-based permissions:
    // Only Tarun Kushwaha (Super Admin) can edit records or undo check-ins!
    if (currentRole === 'super_admin' && d.code) {
      editBtn.hidden = false;
      undo.hidden = !d.checkedIn;
      undo.onclick = () => doUndo(d.code);
    } else {
      editBtn.hidden = true;
      undo.hidden = true;
    }

    $('#rCard').hidden = !team.textContent;
    $('#rIcon').innerHTML = ICONS[cls === 'bad' ? 'bad' : cls];
    el.className = `result ${cls}`;
    el.hidden = false;
    feel(cls);
    $('#rNext').focus();
    refreshStats();
  }

  async function doUndo(code) {
    try {
      const { ok, data } = await api('/api/undo', { method: 'POST', body: JSON.stringify({ code }) });
      $('#rNote').textContent = ok ? 'Check-in successfully undone.' : (data.error || 'Could not undo check-in.');
      $('#rUndo').hidden = true;
      $('#rAuditStamp').hidden = true;
      refreshStats();
    } catch {
      $('#rNote').textContent = 'Network error attempting undo.';
    }
  }

  $('#rNext').addEventListener('click', () => {
    $('#result').hidden = true;
    busy = false;
    lastText = '';
    lastAt = 0;
    if (tabNow === 'find') runSearch();
  });

  /* ---------- Attendance Presence Toggling & Autosave ---------- */
  let attSaveTimer = null;
  async function saveAttendance() {
    if (!currentRecord || !currentRecord.code) return;
    clearTimeout(attSaveTimer);
    attSaveTimer = setTimeout(async () => {
      try {
        const attendance = (currentRecord.members || []).map((m) => m.present !== false);
        const { ok, data } = await api('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({ code: currentRecord.code, attendance }),
        });
        if (ok) {
          const statusEl = $('#attSaveStatus');
          if (statusEl) {
            statusEl.style.display = 'inline-flex';
            setTimeout(() => { statusEl.style.display = 'none'; }, 2000);
          }
          if (data && data.team) {
            currentRecord.members = data.team.members;
            currentRecord.presentCount = data.team.presentCount;
          }
        }
      } catch {}
    }, 300);
  }

  // Attendance Checkbox change
  $('#rMembers').addEventListener('change', (e) => {
    const chk = e.target.closest('.chk-member-present');
    if (!chk || !currentRecord) return;
    const idx = Number(chk.dataset.idx);
    const isPres = chk.checked;
    if (currentRecord.members && currentRecord.members[idx]) {
      currentRecord.members[idx].present = isPres;
    }
    const lbl = $(`#lblAtt_${idx}`);
    const txt = $(`#txtAtt_${idx}`);
    const item = $(`#memItem_${idx}`);
    if (lbl) lbl.className = `attendance-badge-btn ${isPres ? 'present' : 'absent'}`;
    if (txt) txt.textContent = isPres ? '✓ PRESENT' : '✗ ABSENT';
    if (item) {
      if (isPres) item.classList.remove('is-absent');
      else item.classList.add('is-absent');
    }
    const presCount = (currentRecord.members || []).filter((m) => m.present !== false).length;
    if ($('#rPresentCount')) $('#rPresentCount').textContent = presCount;
    saveAttendance();
  });

  // Mark all present
  const btnAllPres = $('#btnMarkAllPresent');
  if (btnAllPres) {
    btnAllPres.addEventListener('click', () => {
      if (!currentRecord || !currentRecord.members) return;
      currentRecord.members.forEach((m, idx) => {
        m.present = true;
        const chk = document.querySelector(`.chk-member-present[data-idx="${idx}"]`);
        if (chk) chk.checked = true;
        const lbl = $(`#lblAtt_${idx}`);
        const txt = $(`#txtAtt_${idx}`);
        const item = $(`#memItem_${idx}`);
        if (lbl) lbl.className = 'attendance-badge-btn present';
        if (txt) txt.textContent = '✓ PRESENT';
        if (item) item.classList.remove('is-absent');
      });
      if ($('#rPresentCount')) $('#rPresentCount').textContent = currentRecord.members.length;
      saveAttendance();
    });
  }

  // Mark all absent
  const btnAllAbs = $('#btnMarkAllAbsent');
  if (btnAllAbs) {
    btnAllAbs.addEventListener('click', () => {
      if (!currentRecord || !currentRecord.members) return;
      currentRecord.members.forEach((m, idx) => {
        m.present = false;
        const chk = document.querySelector(`.chk-member-present[data-idx="${idx}"]`);
        if (chk) chk.checked = false;
        const lbl = $(`#lblAtt_${idx}`);
        const txt = $(`#txtAtt_${idx}`);
        const item = $(`#memItem_${idx}`);
        if (lbl) lbl.className = 'attendance-badge-btn absent';
        if (txt) txt.textContent = '✗ ABSENT';
        if (item) item.classList.add('is-absent');
      });
      if ($('#rPresentCount')) $('#rPresentCount').textContent = 0;
      saveAttendance();
    });
  }

  /* ---------- Super Admin: Record Editor Modal ---------- */
  $('#rEdit').addEventListener('click', () => {
    if (!currentRecord) return;
    const d = currentRecord;
    const teamIdStr = d.teamId || (d.teamNumber ? String(d.teamNumber).padStart(3, '0') : '001');
    if ($('#editModalSub')) $('#editModalSub').textContent = `Team #${teamIdStr} · ${d.code || ''}`;
    $('#editCode').value = d.code || '';
    $('#editTeamName').value = d.team || '';
    $('#editTrack').value = d.track || 'sustainability-climate';
    $('#editIdeaTitle').value = d.ideaTitle || '';
    $('#editCollege').value = d.college || '';
    $('#editCity').value = d.city || '';
    $('#editUnstopId').value = d.unstopTeamId || '';
    $('#editLeaderPhone').value = d.leaderPhone || '';
    $('#editEmergencyName').value = d.emergencyName || '';
    $('#editEmergencyPhone').value = d.emergencyPhone || '';
    $('#editNeedStay').checked = Boolean(d.needStay);
    $('#editStayCount').value = d.stayCount || 0;

    // Populate members for editing
    const container = $('#editMembersContainer');
    container.innerHTML = '';
    const members = d.members || [];
    members.forEach((m, i) => {
      const div = document.createElement('div');
      div.className = 'edit-member-item';
      div.innerHTML = `
        <div class="edit-member-head">${i === 0 ? 'Leader' : `Member ${i + 1}`}</div>
        <div class="edit-grid" style="margin-bottom:6px;">
          <div class="edit-field">
            <label>Name</label>
            <input type="text" class="edit-m-name" value="${esc(m.name)}" required>
          </div>
          <div class="edit-field">
            <label>College Roll / Student ID</label>
            <input type="text" class="edit-m-roll" value="${esc(m.rollNumber || '')}" placeholder="e.g. 21BCE10234">
          </div>
        </div>
        <div class="edit-grid">
          <div class="edit-field">
            <label>Mobile Number</label>
            <input type="tel" class="edit-m-phone" value="${esc(m.phone || '')}">
          </div>
          <div class="edit-field">
            <label>Email</label>
            <input type="email" class="edit-m-email" value="${esc(m.email || '')}">
          </div>
        </div>
      `;
      container.appendChild(div);
    });

    $('#editModal').hidden = false;
  });

  function closeEditModal() {
    $('#editModal').hidden = true;
  }
  $('#closeEditModal').addEventListener('click', closeEditModal);
  $('#cancelEditBtn').addEventListener('click', closeEditModal);

  $('#editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = $('#saveEditBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const memberRows = document.querySelectorAll('#editMembersContainer .edit-member-item');
    const members = Array.from(memberRows).map((row, i) => ({
      name: row.querySelector('.edit-m-name').value.trim(),
      rollNumber: row.querySelector('.edit-m-roll').value.trim(),
      phone: row.querySelector('.edit-m-phone').value.trim(),
      email: row.querySelector('.edit-m-email').value.trim(),
      gender: currentRecord.members && currentRecord.members[i] ? currentRecord.members[i].gender : 'student',
    }));

    const payload = {
      code: $('#editCode').value.trim(),
      teamName: $('#editTeamName').value.trim(),
      track: $('#editTrack').value,
      ideaTitle: $('#editIdeaTitle').value.trim(),
      college: $('#editCollege').value.trim(),
      city: $('#editCity').value.trim(),
      unstopTeamId: $('#editUnstopId').value.trim(),
      leaderPhone: $('#editLeaderPhone').value.trim(),
      emergencyName: $('#editEmergencyName').value.trim(),
      emergencyPhone: $('#editEmergencyPhone').value.trim(),
      needStay: $('#editNeedStay').checked,
      stayCount: Number($('#editStayCount').value) || 0,
      members,
    };

    try {
      const { ok, data } = await api('/api/update-team', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!ok) {
        alert(data.error || 'Failed to update record.');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
        return;
      }

      alert('✓ Record successfully updated by Super Admin!');
      closeEditModal();
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';

      // Re-render result sheet with updated record
      showResult({ ...data.team, status: currentRecord.status });
      refreshStats();
      if (tabNow === 'find') runSearch();
    } catch {
      alert('Network error updating record.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });

  /* ---------- Tabs & Full Participant Database Search ---------- */
  function setTab(t) {
    tabNow = t;
    $('#tabScan').setAttribute('aria-selected', t === 'scan');
    $('#tabFind').setAttribute('aria-selected', t === 'find');
    $('#paneScan').hidden = t !== 'scan';
    $('#paneFind').hidden = t !== 'find';

    if (t === 'scan') {
      if (!stream && token) startCamera();
    } else {
      stopCamera();
      $('#q').focus();
    }
  }

  $('#tabScan').onclick = () => setTab('scan');
  $('#tabFind').onclick = () => setTab('find');

  let timer;
  $('#q').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 250);
  });

  async function runSearch() {
    const q = $('#q').value.trim();
    const list = $('#results');
    if (q.length < 2) {
      list.innerHTML = '';
      $('#findTip').hidden = false;
      return;
    }
    try {
      const { ok, data } = await api(`/api/search?q=${encodeURIComponent(q)}`);
      if (!ok) {
        list.innerHTML = `<li>${esc(data.error || 'Search failed.')}</li>`;
        return;
      }
      const results = data.results || [];
      $('#findTip').hidden = results.length > 0;
      if (!results.length) {
        list.innerHTML = '<li>No paid team matches that query.</li>';
        return;
      }

      list.innerHTML = results.map((r) => {
        const teamIdStr = r.teamId || (r.teamNumber ? String(r.teamNumber).padStart(3, '0') : '001');
        const memRolls = (r.members || []).map((m) => `${m.name} (${m.rollNumber || 'No ID'})`).join(', ');
        return `
          <li>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
              <h3 style="margin:0;">${esc(r.team)}</h3>
              <span class="chip" style="background:var(--indigo); color:#ffffff; font-weight:700; font-size:12px; padding:3px 8px; border-radius:6px; flex-shrink:0;">Team #${esc(teamIdStr)}</span>
            </div>
            <p class="meta">
              <b>${esc(r.code)}</b> &bull; ${esc(TRACKS[r.track] || r.track)} &bull; ${esc(r.college)}<br>
              ${r.ideaTitle ? `<span style="color:var(--indigo); font-weight:500;">💡 Idea: ${esc(r.ideaTitle)}</span><br>` : ''}
              <span style="color:var(--soft);">Roll IDs: ${esc(memRolls)}</span>
            </p>
            <div class="sub-row">
              <span class="chip ${r.checkedIn ? 'in' : ''}">${r.checkedIn ? `✓ Admitted by ${esc(r.checkedInBy || 'Organiser')} (${esc(timeOf(r.checkedInAt))})` : 'Not checked in'}</span>
              ${r.checkedIn ? `<span class="chip ${r.presentCount === r.totalMembers ? 'in' : 'stay'}">👥 ${r.presentCount !== undefined ? r.presentCount : r.totalMembers}/${r.totalMembers} Present</span>` : ''}
              ${r.needStay ? `<span class="chip stay">🏨 Stay (${r.stayCount || r.members.length} Guests)</span>` : ''}
              ${r.isAllFemale ? `<span class="chip women">★ All-Women</span>` : ''}
            </div>
            <div class="row">
              <span style="font-size:12px; color:var(--soft);">Leader: 📞 ${esc(r.leaderPhone || '')} &bull; 🚨 Guardian: ${esc(r.emergencyPhone || '')}</span>
              <button class="btn sm" data-code="${esc(r.code)}" type="button">${r.checkedIn ? 'View Record' : (currentRole === 'super_admin' ? 'Manage & Admit' : 'Inspect Record')}</button>
            </div>
          </li>
        `;
      }).join('');
    } catch {}
  }

  $('#results').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-code]');
    if (b) {
      busy = true;
      submit({ code: b.dataset.code });
    }
  });

  /* ---------- Export Master CSV ---------- */
  const exportBtn = $('#btnExportCsv');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      if (!token) return;
      try {
        exportBtn.disabled = true;
        exportBtn.textContent = 'Exporting...';
        const res = await fetch('/api/export', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          alert('Failed to export roster.');
          exportBtn.disabled = false;
          exportBtn.textContent = '📥 Export Master CSV';
          return;
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'WIE_HackEarth_2026_Master_Roster.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        exportBtn.disabled = false;
        exportBtn.textContent = '📥 Export Master CSV';
      } catch {
        alert('Network error exporting roster.');
        exportBtn.disabled = false;
        exportBtn.textContent = '📥 Export Master CSV';
      }
    });
  }

  /* ---------- Boot & Lifecycle ---------- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCamera();
    else if (token && !$('#app').hidden && tabNow === 'scan' && !stream) startCamera();
  });

  if (token) {
    unlock(currentOrg, currentRole);
  } else {
    $('#login').hidden = false;
  }
})();
