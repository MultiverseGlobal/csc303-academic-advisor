/* 
 * AdvisrAI - CSC 303 Academic Advisor System
 * Client-Side Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Form Inputs
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

  // KPI Elements
  const kpiRiskBadge = document.getElementById('kpiRiskBadge');
  const kpiStandingCaption = document.getElementById('kpiStandingCaption');
  const kpiRiskMeter = document.getElementById('kpiRiskMeter');
  const kpiRiskProb = document.getElementById('kpiRiskProb');
  const kpiProjectedGpa = document.getElementById('kpiProjectedGpa');
  const kpiGpaDelta = document.getElementById('kpiGpaDelta');
  const kpiMaxCredits = document.getElementById('kpiMaxCredits');
  const kpiLoadAdvisory = document.getElementById('kpiLoadAdvisory');
  const trackBadge = document.getElementById('trackBadge');

  // Containers
  const diagnosticsContainer = document.getElementById('diagnosticsContainer');
  const recommendationsContainer = document.getElementById('recommendationsContainer');
  const courseTableBody = document.getElementById('courseTableBody');
  const diagnoseSpinner = document.getElementById('diagnoseSpinner');

  // Buttons & Modals
  const btnLoadMyself = document.getElementById('btnLoadMyself');
  const btnResetForm = document.getElementById('btnResetForm');
  const btnOpenChecklist = document.getElementById('btnOpenChecklist');
  const btnCloseChecklist = document.getElementById('btnCloseChecklist');
  const btnConfirmChecklist = document.getElementById('btnConfirmChecklist');
  const checklistModal = document.getElementById('checklistModal');

  const btnOpenColabModal = document.getElementById('btnOpenColabModal');
  const btnCloseColabModal = document.getElementById('btnCloseColabModal');
  const btnCloseColabModalBtn = document.getElementById('btnCloseColabModalBtn');
  const colabModal = document.getElementById('colabModal');
  const btnTriggerRetrain = document.getElementById('btnTriggerRetrain');

  // Modal Stats Elements
  const modalAccuracy = document.getElementById('modalAccuracy');
  const modalR2 = document.getElementById('modalR2');
  const modalImportanceContainer = document.getElementById('modalImportanceContainer');

  // --- Slider Synchronizers ---
  function syncSliders() {
    valCurrentGpa.textContent = parseFloat(currentGpaInput.value).toFixed(2);
    valCoreCsAvg.textContent = parseFloat(coreCsAvgInput.value).toFixed(2);
    valAttendanceRate.textContent = `${parseFloat(attendanceRateInput.value).toFixed(1)}%`;
    valStudyHours.textContent = `${parseFloat(studyHoursInput.value).toFixed(1)} hrs`;
  }

  [currentGpaInput, coreCsAvgInput, attendanceRateInput, studyHoursInput].forEach(slider => {
    slider.addEventListener('input', syncSliders);
  });

  // --- Load Default Profile (Paul) ---
  async function loadDefaultStudentProfile() {
    try {
      const res = await fetch('/api/student-profile/default');
      if (!res.ok) throw new Error('Failed to fetch default profile');
      const data = await res.json();
      populateForm(data);
      runEvaluation();
    } catch (err) {
      console.warn('Fallback loading local profile defaults:', err);
      populateForm({
        academic_level: '300L',
        specialization_track: 'Software Engineering',
        completed_credits: 78,
        current_credit_load: 18,
        current_gpa: 3.52,
        core_cs_avg_grade: 3.60,
        attendance_rate: 88.5,
        study_hours_per_week: 20.0,
        failed_courses_count: 0,
        stress_level: 2
      });
      runEvaluation();
    }
  }

  function populateForm(p) {
    if (p.academic_level) levelSelect.value = p.academic_level;
    if (p.specialization_track) trackSelect.value = p.specialization_track;
    if (p.completed_credits !== undefined) completedCreditsInput.value = p.completed_credits;
    if (p.current_credit_load !== undefined) currentCreditLoadInput.value = p.current_credit_load;
    if (p.current_gpa !== undefined) currentGpaInput.value = p.current_gpa;
    if (p.core_cs_avg_grade !== undefined) coreCsAvgInput.value = p.core_cs_avg_grade;
    if (p.attendance_rate !== undefined) attendanceRateInput.value = p.attendance_rate;
    if (p.study_hours_per_week !== undefined) studyHoursInput.value = p.study_hours_per_week;
    if (p.failed_courses_count !== undefined) failedCoursesSelect.value = String(Math.min(3, p.failed_courses_count));
    if (p.stress_level !== undefined) stressLevelSelect.value = String(p.stress_level);
    syncSliders();
  }

  // --- Run AI Evaluation ---
  async function runEvaluation() {
    diagnoseSpinner.classList.remove('hidden');

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

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      renderEvaluationResults(data);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      diagnoseSpinner.classList.add('hidden');
    }
  }

  function renderEvaluationResults(data) {
    // 1. Risk Standing
    const risk = data.predicted_risk || 'Moderate Risk';
    kpiRiskBadge.textContent = risk;
    kpiRiskBadge.className = 'risk-badge ' + (
      risk === 'Low Risk' ? 'risk-low' : (risk === 'High Risk' ? 'risk-high' : 'risk-mod')
    );
    kpiStandingCaption.textContent = data.standing_summary || '';

    // Risk Meter Fill
    kpiRiskMeter.className = 'risk-meter-fill ' + (
      risk === 'Low Risk' ? 'fill-low' : (risk === 'High Risk' ? 'fill-high' : 'fill-mod')
    );
    if (risk === 'Low Risk') kpiRiskMeter.style.width = '20%';
    else if (risk === 'Moderate Risk') kpiRiskMeter.style.width = '55%';
    else kpiRiskMeter.style.width = '90%';

    // Probabilities
    if (data.risk_probabilities) {
      const p = data.risk_probabilities;
      kpiRiskProb.textContent = `Low: ${p['Low Risk'] || 0}% | Mod: ${p['Moderate Risk'] || 0}% | High: ${p['High Risk'] || 0}%`;
    }

    // 2. Projected GPA
    kpiProjectedGpa.textContent = data.projected_next_gpa.toFixed(2);
    const delta = data.gpa_delta;
    const isPos = delta >= 0;
    kpiGpaDelta.textContent = (isPos ? '+' : '') + delta.toFixed(2);
    kpiGpaDelta.className = 'gpa-delta ' + (isPos ? 'delta-positive' : 'delta-negative');

    // 3. Max Credits
    kpiMaxCredits.textContent = data.max_recommended_credits;
    if (risk === 'High Risk') {
      kpiLoadAdvisory.textContent = 'Reduced load recommended for GPA remediation';
    } else if (risk === 'Moderate Risk') {
      kpiLoadAdvisory.textContent = 'Standard load to maintain steady progress';
    } else {
      kpiLoadAdvisory.textContent = 'Full capacity unlocked for honors & electives';
    }

    trackBadge.textContent = data.student_profile.specialization_track;

    // 4. Diagnostics List
    diagnosticsContainer.innerHTML = '';
    (data.diagnostics || []).forEach(d => {
      const item = document.createElement('div');
      item.className = 'diagnostic-item';
      item.innerHTML = `
        <span class="diag-tag diag-tag-${d.severity}">${d.severity}</span>
        <div class="diag-content">
          <div class="diag-title">${escapeHtml(d.factor)}</div>
          <div class="diag-desc">${escapeHtml(d.detail)}</div>
        </div>
      `;
      diagnosticsContainer.appendChild(item);
    });

    // 5. Recommendations List
    recommendationsContainer.innerHTML = '';
    (data.recommendations || []).forEach((r, idx) => {
      const li = document.createElement('li');
      li.className = 'recommendation-item';
      li.innerHTML = `
        <span class="rec-bullet">${idx + 1}</span>
        <span>${escapeHtml(r)}</span>
      `;
      recommendationsContainer.appendChild(li);
    });

    // 6. Course Pathway Table
    courseTableBody.innerHTML = '';
    (data.course_pathway || []).forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="course-code">${escapeHtml(c.code)}</td>
        <td>${escapeHtml(c.title)}</td>
        <td>${c.credits}</td>
        <td>${escapeHtml(c.type)}</td>
        <td><span class="course-status-pill status-${c.status}">${escapeHtml(c.status)}</span></td>
      `;
      courseTableBody.appendChild(tr);
    });
  }

  // --- Modal Helpers ---
  function openModal(m) { m.classList.remove('hidden'); }
  function closeModal(m) { m.classList.add('hidden'); }

  btnOpenChecklist.addEventListener('click', () => openModal(checklistModal));
  btnCloseChecklist.addEventListener('click', () => closeModal(checklistModal));
  btnConfirmChecklist.addEventListener('click', () => closeModal(checklistModal));

  btnOpenColabModal.addEventListener('click', async () => {
    openModal(colabModal);
    await loadModelMetadata();
  });
  btnCloseColabModal.addEventListener('click', () => closeModal(colabModal));
  btnCloseColabModalBtn.addEventListener('click', () => closeModal(colabModal));

  checklistModal.addEventListener('click', (e) => {
    if (e.target === checklistModal) closeModal(checklistModal);
  });
  colabModal.addEventListener('click', (e) => {
    if (e.target === colabModal) closeModal(colabModal);
  });

  // Fetch Model Info & Populate Colab Modal
  async function loadModelMetadata() {
    try {
      const res = await fetch('/api/model-info');
      const data = await res.json();
      if (data.metrics) {
        modalAccuracy.textContent = `${(data.metrics.classification_accuracy * 100).toFixed(1)}%`;
        modalR2.textContent = data.metrics.regression_r2.toFixed(3);

        const fi = data.metrics.feature_importances || {};
        modalImportanceContainer.innerHTML = '';
        const sortedEntries = Object.entries(fi).slice(0, 6);
        const maxVal = sortedEntries[0] ? sortedEntries[0][1] : 1;

        sortedEntries.forEach(([feature, val]) => {
          const pct = Math.round((val / maxVal) * 100);
          const row = document.createElement('div');
          row.className = 'importance-row';
          row.innerHTML = `
            <div class="importance-labels">
              <span>${escapeHtml(formatFeatureName(feature))}</span>
              <span>${(val * 100).toFixed(1)}% weight</span>
            </div>
            <div class="importance-bar-track">
              <div class="importance-bar-fill" style="width: ${pct}%;"></div>
            </div>
          `;
          modalImportanceContainer.appendChild(row);
        });
      }
    } catch (err) {
      console.warn('Could not load model metadata:', err);
    }
  }

  // Retrain Handler
  btnTriggerRetrain.addEventListener('click', async () => {
    btnTriggerRetrain.disabled = true;
    btnTriggerRetrain.textContent = 'Retraining Pipeline...';
    try {
      const res = await fetch('/api/retrain', { method: 'POST' });
      const data = await res.json();
      alert('Pipeline successfully retrained and .pkl artifact reloaded!');
      await loadModelMetadata();
      await runEvaluation();
    } catch (err) {
      alert('Retrain error: ' + err.message);
    } finally {
      btnTriggerRetrain.disabled = false;
      btnTriggerRetrain.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg> Retrain &amp; Re-export .PKL
      `;
    }
  });

  function formatFeatureName(raw) {
    return raw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runEvaluation();
  });

  btnLoadMyself.addEventListener('click', () => {
    loadDefaultStudentProfile();
  });

  btnResetForm.addEventListener('click', () => {
    form.reset();
    syncSliders();
    runEvaluation();
  });

  // Initial Boot
  syncSliders();
  loadDefaultStudentProfile();
});
