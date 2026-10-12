/* 
 * CSC 303 Academic Advisor System
 * Dynamic Frontend Controller
 * Author: Paul (Student Academic Advisor System)
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

  // Sync Sliders
  function syncSliders() {
    valCurrentGpa.textContent = parseFloat(currentGpaInput.value).toFixed(2);
    valCoreCsAvg.textContent = parseFloat(coreCsAvgInput.value).toFixed(2);
    valAttendanceRate.textContent = `${parseFloat(attendanceRateInput.value).toFixed(1)}%`;
    valStudyHours.textContent = `${parseFloat(studyHoursInput.value).toFixed(1)} hrs`;
  }

  [currentGpaInput, coreCsAvgInput, attendanceRateInput, studyHoursInput].forEach(slider => {
    slider.addEventListener('input', syncSliders);
  });

  // Default Profile for Paul (CSC 303 Student)
  const defaultPaulProfile = {
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
  };

  function setProfileValues(p) {
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

  // Run Inference via API
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
      renderResults(data);
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

  // Reset Button
  btnLoadDefaults.addEventListener('click', () => {
    setProfileValues(defaultPaulProfile);
    runInference();
  });

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runInference();
  });

  // Initial Load
  setProfileValues(defaultPaulProfile);
  runInference();
});
