/* 
 * CSC 303 Academic Advisor System
 * Dynamic Frontend Controller
 * Profiles: Paul | Abah Benjamin
 */

document.addEventListener('DOMContentLoaded', () => {
  // Input References
  const form = document.getElementById('advisorForm');
  const levelSelect = document.getElementById('academicLevel');
  const trackSelect = document.getElementById('specializationTrack');
  const currentGpaInput = document.getElementById('currentGpa');
  const coreCsAvgInput = document.getElementById('coreCsAvg');
  const completedCreditsInput = document.getElementById('completedCredits');
  const currentCreditLoadInput = document.getElementById('currentCreditLoad');
  const attendanceRateInput = document.getElementById('attendanceRate');
  const studyHoursInput = document.getElementById('studyHours');
  const failedCoursesSelect = document.getElementById('failedCourses');
  const stressLevelSelect = document.getElementById('stressLevel');

  // Slider Badges
  const valCurrentGpa = document.getElementById('valCurrentGpa');
  const valCoreCsAvg = document.getElementById('valCoreCsAvg');
  const valAttendanceRate = document.getElementById('valAttendanceRate');
  const valStudyHours = document.getElementById('valStudyHours');

  // Results Outputs
  const standingTag = document.getElementById('standingTag');
  const standingSub = document.getElementById('standingSub');
  const riskBar = document.getElementById('riskBar');
  const riskBreakdown = document.getElementById('riskBreakdown');
  const projectedGpaVal = document.getElementById('projectedGpaVal');
  const gpaDeltaBadge = document.getElementById('gpaDeltaBadge');
  const maxLoadVal = document.getElementById('maxLoadVal');
  const loadNote = document.getElementById('loadNote');
  const trackPill = document.getElementById('trackPill');

  // Containers & Spinner
  const diagnosticsList = document.getElementById('diagnosticsList');
  const adviceList = document.getElementById('adviceList');
  const courseTableBody = document.getElementById('courseTableBody');
  const spinner = document.getElementById('spinner');
  const btnLoadDefaults = document.getElementById('btnLoadDefaults');

  // Profile Switcher
  const profileSwitcher = document.getElementById('profileSwitcher');

  // Nav identity elements (updated on profile switch)
  const navUserAvatar = document.getElementById('navUserAvatar');
  const navUserName = document.getElementById('navUserName');
  const navUserDetails = document.getElementById('navUserDetails');
  const advisorTitle = document.getElementById('advisorTitle');

  // Print slip elements
  const btnPrintSlip = document.getElementById('btnPrintSlip');
  const slipStudentName = document.getElementById('slipStudentName');
  const slipMatric = document.getElementById('slipMatric');
  const slipLevel = document.getElementById('slipLevel');
  const slipCurrentGpa = document.getElementById('slipCurrentGpa');
  const slipStanding = document.getElementById('slipStanding');
  const slipUnits = document.getElementById('slipUnits');
  const slipDate = document.getElementById('slipDate');
  const slipNotes = document.getElementById('slipNotes');
  const slipCoursesBody = document.getElementById('slipCoursesBody');

  // Goal Calculator
  const targetClassSelect = document.getElementById('targetClass');
  const remainingCreditsInput = document.getElementById('remainingCredits');
  const goalResultBox = document.getElementById('goalResultBox');

  // ─── Student Profiles ──────────────────────────────────────────────────────

  const PROFILES = {
    paul: {
      id: 'paul',
      name: 'Paul',
      avatar: 'P',
      matric: 'CSC/2022/303',
      level: '300L',
      track: 'Software Engineering',
      label: '300L • Software Engineering Track',
      data: {
        academic_level: '300L',
        specialization_track: 'Software Engineering',
        completed_credits: 78,
        current_credit_load: 18,
        current_gpa: 4.18,
        core_cs_avg_grade: 4.25,
        attendance_rate: 88.5,
        study_hours_per_week: 20.0,
        failed_courses_count: 0,
        stress_level: 2
      }
    },
    abah: {
      id: 'abah',
      name: 'Abah Benjamin',
      avatar: 'AB',
      matric: 'CSC/2022/412',
      level: '300L',
      track: 'Artificial Intelligence & Data Science',
      label: '300L • AI & Data Science Track',
      data: {
        academic_level: '300L',
        specialization_track: 'Artificial Intelligence & Data Science',
        completed_credits: 72,
        current_credit_load: 16,
        current_gpa: 3.75,
        core_cs_avg_grade: 3.90,
        attendance_rate: 82.0,
        study_hours_per_week: 17.0,
        failed_courses_count: 0,
        stress_level: 2
      }
    }
  };

  let currentProfile = PROFILES.paul;
  let lastResults = null;

  // ─── Sync Sliders ──────────────────────────────────────────────────────────

  function syncSliders() {
    valCurrentGpa.textContent = parseFloat(currentGpaInput.value).toFixed(2);
    valCoreCsAvg.textContent = parseFloat(coreCsAvgInput.value).toFixed(2);
    valAttendanceRate.textContent = `${parseFloat(attendanceRateInput.value).toFixed(1)}%`;
    valStudyHours.textContent = `${parseFloat(studyHoursInput.value).toFixed(1)} hrs`;
    runGoalCalculator();
  }

  [currentGpaInput, coreCsAvgInput, attendanceRateInput, studyHoursInput].forEach(slider => {
    slider.addEventListener('input', syncSliders);
  });

  // ─── Profile Loading ────────────────────────────────────────────────────────

  function setProfileValues(p) {
    const d = p.data;
    if (d.academic_level) levelSelect.value = d.academic_level;
    if (d.specialization_track) trackSelect.value = d.specialization_track;
    if (d.completed_credits !== undefined) completedCreditsInput.value = d.completed_credits;
    if (d.current_credit_load !== undefined) currentCreditLoadInput.value = d.current_credit_load;
    if (d.current_gpa !== undefined) currentGpaInput.value = d.current_gpa;
    if (d.core_cs_avg_grade !== undefined) coreCsAvgInput.value = d.core_cs_avg_grade;
    if (d.attendance_rate !== undefined) attendanceRateInput.value = d.attendance_rate;
    if (d.study_hours_per_week !== undefined) studyHoursInput.value = d.study_hours_per_week;
    if (d.failed_courses_count !== undefined) failedCoursesSelect.value = String(Math.min(3, d.failed_courses_count));
    if (d.stress_level !== undefined) stressLevelSelect.value = String(d.stress_level);
    syncSliders();
  }

  function applyProfileIdentity(profile) {
    // Nav chip
    if (navUserAvatar) navUserAvatar.textContent = profile.avatar;
    if (navUserName) navUserName.textContent = `${profile.name} (Student)`;
    if (navUserDetails) navUserDetails.textContent = profile.label;

    // Panel heading
    if (advisorTitle) advisorTitle.textContent = `Advisor Recommendations for ${profile.name}`;

    // Reset button label
    if (btnLoadDefaults) btnLoadDefaults.textContent = `Reset to ${profile.name.split(' ')[0]}'s Profile`;

    // Page title
    document.title = `CSC 303 Academic Advisor — ${profile.name}`;
  }

  function switchProfile(profileId) {
    currentProfile = PROFILES[profileId] || PROFILES.paul;
    applyProfileIdentity(currentProfile);
    setProfileValues(currentProfile);
    runInference();
  }

  // Profile Switcher dropdown
  if (profileSwitcher) {
    profileSwitcher.addEventListener('change', () => {
      switchProfile(profileSwitcher.value);
    });
  }

  // ─── Goal Calculator ────────────────────────────────────────────────────────

  function runGoalCalculator() {
    if (!goalResultBox) return;
    const currentGpa = parseFloat(currentGpaInput.value) || 0;
    const earnedCredits = parseInt(completedCreditsInput.value) || 0;
    const remaining = parseInt(remainingCreditsInput?.value) || 44;
    const targetGpa = parseFloat(targetClassSelect?.value) || 4.50;

    const totalCredits = earnedCredits + remaining;
    if (totalCredits <= 0 || remaining <= 0) {
      goalResultBox.innerHTML = `<span style="color: var(--text-muted)">Enter valid credit values.</span>`;
      return;
    }

    // Required GPA in remaining credits: (target * total - current * earned) / remaining
    const requiredGpa = ((targetGpa * totalCredits) - (currentGpa * earnedCredits)) / remaining;
    const isAchievable = requiredGpa <= 5.0;
    const isComfort = requiredGpa <= currentGpa + 0.2;

    let statusColor = isAchievable ? (isComfort ? 'var(--success-text)' : 'var(--warning-text)') : 'var(--danger-text)';
    let statusMsg = isAchievable
      ? (isComfort ? '✓ On track — maintain current pace.' : '↑ Attainable — consistent improvement needed.')
      : '✗ Target not mathematically achievable at current standing.';

    const targetLabel = targetClassSelect?.options[targetClassSelect.selectedIndex]?.text || '';

    goalResultBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="color:var(--text-muted); font-size:12px;">${targetLabel}</span>
        <span style="color:${statusColor}; font-size:12px; font-weight:600;">${statusMsg}</span>
      </div>
      <div style="display:flex; gap:24px; align-items:baseline;">
        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Required GPA (remaining ${remaining} units)</div>
          <span class="goal-metric" style="font-size:24px; color:${statusColor};">${requiredGpa > 5.0 ? '>5.0' : requiredGpa < 0 ? 'N/A' : requiredGpa.toFixed(2)}</span>
          <span style="font-size:13px; color:var(--text-muted);"> / 5.0</span>
        </div>
        <div>
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:2px;">Total Units at Graduation</div>
          <span class="goal-metric" style="font-size:18px;">${totalCredits}</span>
        </div>
      </div>
    `;
  }

  if (targetClassSelect) targetClassSelect.addEventListener('change', runGoalCalculator);
  if (remainingCreditsInput) remainingCreditsInput.addEventListener('input', runGoalCalculator);
  if (completedCreditsInput) completedCreditsInput.addEventListener('input', runGoalCalculator);

  // ─── Print Slip ─────────────────────────────────────────────────────────────

  function populatePrintSlip(results) {
    const profile = currentProfile;
    if (slipStudentName) slipStudentName.textContent = profile.name;
    if (slipMatric) slipMatric.textContent = profile.matric;
    if (slipLevel) slipLevel.textContent = profile.level;
    if (slipCurrentGpa) slipCurrentGpa.textContent = `${parseFloat(currentGpaInput.value).toFixed(2)} / 5.0`;
    if (slipUnits) slipUnits.textContent = `${currentCreditLoadInput.value} Units`;
    if (slipDate) slipDate.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    if (results) {
      const risk = results.predicted_risk || 'Moderate Risk';
      if (slipStanding) slipStanding.textContent = risk === 'Low Risk' ? 'Good Standing' : risk === 'Moderate Risk' ? 'Standard Progress' : 'Academic Warning';
      if (slipNotes) slipNotes.textContent = (results.recommendations || []).slice(0, 3).join(' • ');

      // Fill slip courses table
      if (slipCoursesBody) {
        slipCoursesBody.innerHTML = '';
        (results.course_pathway || []).forEach(c => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${escapeHtml(c.code)}</td><td>${escapeHtml(c.title)}</td><td>${c.credits}</td><td>${escapeHtml(c.type)}</td>`;
          slipCoursesBody.appendChild(tr);
        });
      }
    }
  }

  if (btnPrintSlip) {
    btnPrintSlip.addEventListener('click', () => {
      populatePrintSlip(lastResults);
      window.print();
    });
  }

  // ─── API Inference ──────────────────────────────────────────────────────────

  async function runInference() {
    spinner.classList.remove('hidden');

    const payload = {
      academic_level: levelSelect.value,
      specialization_track: trackSelect.value,
      completed_credits: parseInt(completedCreditsInput.value) || 0,
      current_credit_load: parseInt(currentCreditLoadInput.value) || 18,
      current_gpa: parseFloat(currentGpaInput.value) || 3.0,
      core_cs_avg_grade: parseFloat(coreCsAvgInput.value) || 3.0,
      attendance_rate: parseFloat(attendanceRateInput.value) || 80.0,
      study_hours_per_week: parseFloat(studyHoursInput.value) || 15.0,
      failed_courses_count: parseInt(failedCoursesSelect.value) || 0,
      extracurricular_hours: 8.0,
      stress_level: parseInt(stressLevelSelect.value) || 2
    };

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      lastResults = data;
      renderResults(data);
      runGoalCalculator();
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      spinner.classList.add('hidden');
    }
  }

  function renderResults(data) {
    const risk = data.predicted_risk || 'Moderate Risk';

    // 1. Standing & Risk Tag
    if (risk === 'Low Risk') {
      standingTag.textContent = 'Good Standing';
      standingTag.className = 'status-tag tag-good';
      standingSub.textContent = 'Low Risk \u2022 Dean\'s List Track';
      riskBar.className = 'bar-fill fill-good';
      riskBar.style.width = '18%';
      loadNote.textContent = 'Full capacity unlocked for specialized electives';
    } else if (risk === 'Moderate Risk') {
      standingTag.textContent = 'Standard Progress';
      standingTag.className = 'status-tag tag-warning';
      standingSub.textContent = 'Moderate Risk \u2022 Targeted Optimization Advised';
      riskBar.className = 'bar-fill fill-warning';
      riskBar.style.width = '55%';
      loadNote.textContent = 'Standard load to maintain steady degree pace';
    } else {
      standingTag.textContent = 'Academic Warning';
      standingTag.className = 'status-tag tag-danger';
      standingSub.textContent = 'High Risk \u2022 Immediate Faculty Intervention Needed';
      riskBar.className = 'bar-fill fill-danger';
      riskBar.style.width = '92%';
      loadNote.textContent = 'Reduced load capped for prerequisite recovery';
    }

    // Probabilities
    if (data.risk_probabilities) {
      const p = data.risk_probabilities;
      riskBreakdown.textContent = `Probabilities: Low ${p['Low Risk'] || 0}% \u2022 Mod ${p['Moderate Risk'] || 0}% \u2022 High ${p['High Risk'] || 0}%`;
    }

    // 2. Projected GPA
    projectedGpaVal.textContent = data.projected_next_gpa.toFixed(2);
    const delta = data.gpa_delta;
    const isPos = delta >= 0;
    gpaDeltaBadge.textContent = (isPos ? '+' : '') + delta.toFixed(2);
    gpaDeltaBadge.className = 'delta-badge ' + (isPos ? 'badge-pos' : 'badge-neg');

    // 3. Max Recommended Load
    maxLoadVal.textContent = data.max_recommended_credits;
    trackPill.textContent = data.student_profile.specialization_track;

    // 4. Diagnostics
    diagnosticsList.innerHTML = '';
    (data.diagnostics || []).forEach(d => {
      const div = document.createElement('div');
      div.className = 'diag-card';
      div.innerHTML = `
        <span class="diag-pill pill-${d.severity}">${d.severity}</span>
        <div class="diag-body">
          <strong>${escapeHtml(d.factor)}</strong>
          <p>${escapeHtml(d.detail)}</p>
        </div>
      `;
      diagnosticsList.appendChild(div);
    });

    // 5. Advisor Notes
    adviceList.innerHTML = '';
    (data.recommendations || []).forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'advice-item';
      li.innerHTML = `
        <span class="advice-bullet">${idx + 1}</span>
        <span>${escapeHtml(item)}</span>
      `;
      adviceList.appendChild(li);
    });

    // 6. Course Pathway Table
    courseTableBody.innerHTML = '';
    (data.course_pathway || []).forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="code-cell">${escapeHtml(c.code)}</td>
        <td>${escapeHtml(c.title)}</td>
        <td>${c.credits}</td>
        <td>${escapeHtml(c.type)}</td>
        <td><span class="status-badge status-${c.status}">${escapeHtml(c.status)}</span></td>
      `;
      courseTableBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Reset Button — resets to active profile's defaults
  btnLoadDefaults.addEventListener('click', () => {
    setProfileValues(currentProfile);
    runInference();
  });

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runInference();
  });

  // ─── Initial Load ───────────────────────────────────────────────────────────
  applyProfileIdentity(currentProfile);
  setProfileValues(currentProfile);
  runInference();
});
