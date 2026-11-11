(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const form = $('#form');
  const state = { size: 2, cfg: null };

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
    const rate = state.cfg?.accommodationFeePerPerson || 1500;
    sel.innerHTML = '';
    for (let n = 1; n <= state.size; n++) {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = `${n} member${n > 1 ? 's' : ''} (₹${(n * rate).toLocaleString('en-IN')})`;
      if (n === oldVal || (!oldVal && n === state.size)) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  function updatePricing() {
    const allFemale = isTeamAllFemale();
    const regFee = allFemale ? (state.cfg?.allFemaleFee || 200) : (state.cfg?.fee || 400);
    const stayRate = state.cfg?.accommodationFeePerPerson || 1500;

    const needStay = ($('input[name=needStay]:checked') || {}).value === 'yes';
    const stayWrapper = $('#stayCountWrapper');
    if (stayWrapper) stayWrapper.hidden = !needStay;

    let stayCount = 0;
    let stayFee = 0;
    if (needStay) {
      const sel = $('#stayCount');
      stayCount = sel ? parseInt(sel.value, 10) || state.size : state.size;
      stayFee = stayCount * stayRate;
      const subEl = $('#staySubtotal');
      if (subEl) {
        subEl.textContent = `Accommodation & Shuttle: ${stayCount} member(s) × ₹${stayRate.toLocaleString('en-IN')} = ₹${stayFee.toLocaleString('en-IN')}`;
      }
    }

    const totalFee = regFee + stayFee;

    const banner = $('#discountBanner');
    if (banner) banner.hidden = !allFemale;

    document.querySelectorAll('.fee-inline').forEach((n) => (n.textContent = totalFee.toLocaleString('en-IN')));
    const btn = $('#pay');
    if (btn && !btn.disabled) {
      let label = `Pay ₹${totalFee.toLocaleString('en-IN')} and register`;
      if (allFemale && needStay) {
        label += ` (All-Women Discount + Stay for ${stayCount})`;
      } else if (allFemale) {
        label += ` (All-Women Discount Applied)`;
      } else if (needStay) {
        label += ` (Incl. Stay for ${stayCount})`;
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
    const box = $('#tracks');
    state.cfg.tracks.forEach((t) => {
      const l = document.createElement('label');
      l.className = 'tile';
      l.innerHTML = `<input type="radio" name="track" value="${esc(t.id)}"> ${esc(t.label)}`;
      box.appendChild(l);
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

    return {
      teamName: ($('#teamName') || {}).value || '',
      unstopTeamId: ($('#unstopTeamId') || {}).value || '',
      college: ($('#college') || {}).value || '',
      city: ($('#city') || {}).value || '',
      needStay: needStay ? 'yes' : 'no',
      stayCount,
      ideaTitle: ($('#ideaTitle') || {}).value || '',
      track: (form.querySelector('[name=track]:checked') || {}).value || '',
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
    btn.disabled = b;
    if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
    btn.innerHTML = b ? label : btn.dataset.label || btn.innerHTML;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const body = collect();
    setBusy(true, 'Preparing payment…');
    try {
      const res = await post('/api/create-order', body);
      if (!res.ok) {
        setBusy(false);
        if (res.data.errors) return showErrors(res.data.errors);
        $('#formErr').textContent = res.data.error || 'Something went wrong. Please try again.';
        return;
      }
      openCheckout(res.data, body);
    } catch {
      setBusy(false);
      $('#formErr').textContent = 'Network problem. Check your connection and try again.';
    }
  });

  function openCheckout(o, body) {
    if (o.mock) {
      setBusy(true, 'Simulating test payment…');
      setTimeout(async () => {
        try {
          const v = await post('/api/verify-payment', {
            razorpay_order_id: o.orderId,
            razorpay_payment_id: 'pay_mock_' + Date.now(),
            razorpay_signature: 'mock_sig',
          });
          if (v.ok) return showDone(v.data);
          $('#formErr').textContent = v.data.error || 'Could not confirm the payment.';
        } catch {
          $('#formErr').textContent = 'Payment simulation error.';
        }
        setBusy(false);
      }, 1000);
      return;
    }
    if (!window.Razorpay) {
      setBusy(false);
      $('#formErr').textContent = 'The payment window could not load. Check your connection and try again.';
      return;
    }
    const rzp = new Razorpay({
      key: o.keyId,
      amount: o.amount,
      currency: o.currency,
      order_id: o.orderId,
      name: 'WIE HackEarth 2.0',
      description: `Team registration · ${body.teamName}`,
      prefill: o.prefill,
      notes: { reg_code: o.regCode },
      theme: { color: '#33266b' },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (resp) => {
        setBusy(true, 'Confirming your payment…');
        try {
          const v = await post('/api/verify-payment', resp);
          if (v.ok) return showDone(v.data);
          $('#formErr').textContent = v.data.error || 'Could not confirm the payment.';
        } catch {
          $('#formErr').textContent = 'Payment received but confirmation was interrupted. Your email will arrive shortly. Do not pay again.';
        }
        setBusy(false);
      },
    });
    rzp.on('payment.failed', (r) => {
      setBusy(false);
      $('#formErr').textContent = (r.error && r.error.description) || 'The payment failed. You can try again.';
    });
    rzp.open();
  }

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
    window.scrollTo({ top: done.offsetTop - 20, behavior: 'smooth' });
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
  fetch('/api/config').then((r) => r.json()).then((cfg) => {
    state.cfg = cfg;
    $('#f-dates').textContent = cfg.dates;
    $('#f-venue').textContent = cfg.venue;
    $('#f-fee').innerHTML = `₹${cfg.fee} <span class="wie-tag">(₹${cfg.allFemaleFee || 200} for all-female)</span>`;
    document.querySelectorAll('.fee-inline').forEach((n) => (n.textContent = cfg.fee));
    document.querySelectorAll('.stay-rate-inline').forEach((n) => (n.textContent = (cfg.accommodationFeePerPerson || 1500).toLocaleString('en-IN')));
    renderSize(); renderMembers(); renderTracks(); renderStayCountOptions();

    document.querySelectorAll('input[name=needStay]').forEach((r) => r.addEventListener('change', updatePricing));
    const staySel = $('#stayCount');
    if (staySel) staySel.addEventListener('change', updatePricing);
    updatePricing();
  }).catch(() => { $('#formErr').textContent = 'Could not load the form. Refresh the page.'; });
})();
