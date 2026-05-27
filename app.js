/* ==========================================================================
   SWASTIKSHA EXAM ENGINE & SCIENTIFIC CALCULATOR - PYQ CORE JS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // OWNER CONFIGURATION: Paste your secret Google Gemini API key here
  // If left blank (""), the system will fall back to secure backend server, or custom key from localStorage.
  const OWNER_API_KEY = "";

  // --- APPLICATION STATE ---
  const state = {
    candidateName: localStorage.getItem("gate_user_name") || "Aspirant",
    testDurationMinutes: 180,
    selectedStream: "CS", // "CS" or "DS"
    selectedYear: "2024",
    questions: [], // Loaded dynamically based on Stream and Year
    currentQuestionIndex: 0,
    userAnswers: {}, // { questionId: answerValue }
    // AnswerValue types: MCQ: integer index, MSQ: array of indices [0, 2], NAT: string or float
    questionStates: {}, // { questionId: 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'marked-answered' }
    timeLeftSeconds: 0,
    timerInterval: null,
    stopwatchElapsed: 0,
    stopwatchInterval: null,
    isExamActive: false,
    isSubmitted: false,
    performanceHistory: [],
    resultsChartInstance: null,
    modalChartInstance: null,
    calculatorState: {
      screenValue: "0",
      historyValue: "",
      memoryValue: 0,
      isScientificMode: false,
      waitingForOperand: false,
      activeOperator: null,
      firstOperand: null
    }
  };

  // --- DOM SELECTORS ---
  const DOM = {
    // Views
    dashboardView: document.getElementById("dashboard-view"),
    guidelinesView: document.getElementById("guidelines-view"),
    examView: document.getElementById("exam-view"),
    resultsView: document.getElementById("results-view"),

    // Buttons / Controls
    candidateNameInput: document.getElementById("candidate-name-input"),
    testDurationInput: document.getElementById("test-duration-input"),
    startInstructionsBtn: document.getElementById("configure-paper-btn"),
    backToDashboardBtn: document.querySelector(".back-to-dashboard-btn"),
    declarationCheck: document.getElementById("declaration-check"),
    startTestBtn: document.getElementById("start-test-btn"),
    dashboardCalcBtn: document.getElementById("dashboard-calc-btn"),
    calcToggleBtn: document.getElementById("calc-toggle-btn"),
    calcCloseBtn: document.getElementById("calc-close-btn"),
    clearResponseBtn: document.getElementById("clear-response-btn"),
    markReviewBtn: document.getElementById("mark-review-btn"),
    prevQuestionBtn: document.getElementById("prev-question-btn"),
    saveNextBtn: document.getElementById("save-next-btn"),
    submitExamBtn: document.getElementById("submit-exam-btn"),
    exitToDashboardBtn: document.getElementById("exit-to-dashboard-btn"),

    // Stream & Year Setup Dropdowns
    testStreamInput: document.getElementById("test-stream-input"),
    testYearInput: document.getElementById("test-year-input"),
    syllabusDescription: document.getElementById("syllabus-description"),

    // Displays
    candidateNameDisplay: document.getElementById("candidate-name-display"),
    candidateDisplayName: document.getElementById("candidate-display-name"),
    activeTestTitle: document.getElementById("active-test-title"),
    examCountdown: document.getElementById("exam-countdown"),
    qNumber: document.getElementById("q-number"),
    qType: document.getElementById("q-type"),
    qMarks: document.getElementById("q-marks"),
    qNegative: document.getElementById("q-negative"),
    questionText: document.getElementById("question-text"),
    optionsContainer: document.getElementById("options-container"),
    paletteGrid: document.getElementById("palette-grid"),
    sectionGAButton: document.querySelector(".section-tab[data-section='GA']"),

    // Summary stats
    statAnswered: document.getElementById("stat-answered"),
    statNotAnswered: document.getElementById("stat-not-answered"),
    statNotVisited: document.getElementById("stat-not-visited"),
    statMarked: document.getElementById("stat-marked"),
    statMarkedAnswered: document.getElementById("stat-marked-answered"),

    // Calculator DOM
    calcModal: document.getElementById("calculator-modal"),
    calcTitlebar: document.getElementById("calc-titlebar"),
    calcScreen: document.getElementById("calc-screen"),
    calcHistory: document.getElementById("calc-history"),

    // Confirm Submission Modal
    confirmModal: document.getElementById("custom-confirm-modal"),
    confirmMessage: document.getElementById("confirm-modal-message"),
    confirmAnswered: document.getElementById("confirm-answered"),
    confirmReview: document.getElementById("confirm-review"),
    confirmUnattempted: document.getElementById("confirm-unattempted"),
    confirmCancelBtn: document.getElementById("confirm-cancel-btn"),
    confirmOkBtn: document.getElementById("confirm-ok-btn"),

    // Results Display elements
    resultsScoreObtained: document.getElementById("results-score-obtained"),
    resultsScoreTotal: document.getElementById("results-score-total"),
    resultsRadialBar: document.getElementById("results-radial-bar"),
    resultsMarksText: document.getElementById("results-marks-text"),
    resultsCorrectCount: document.getElementById("results-correct-count"),
    resultsWrongCount: document.getElementById("results-wrong-count"),
    resultsUnattemptedCount: document.getElementById("results-unattempted-count"),
    resultsAccuracyPct: document.getElementById("results-accuracy-pct"),
    solutionsContainerList: document.getElementById("solutions-container-list")
  };

  // --- INITIALIZATION ---
  function init() {
    // Adjust right box height based on selected exam duration
    adjustRightBoxHeight();
    setupEventListeners();
    
    // Theme loading
    const savedTheme = localStorage.getItem("gate-mock-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    const themeSelector = document.getElementById("theme-selector");
    if (themeSelector) {
      themeSelector.value = savedTheme;
    }

    // Default config loading
    // Set test duration minutes state (numeric)
    const durationVal = DOM.testDurationInput.value || "180";
    state.testDurationMinutes = parseInt(durationVal, 10);
    // Ensure right box height respects mode
    adjustRightBoxHeight();
    state.selectedStream = DOM.testStreamInput.value || "CS";
    populateYearDropdown();
    state.selectedYear = DOM.testYearInput.value || "2024";
    
    updateSyllabusDescription();
    updateCandidateName();



    // Initialize GeeksforGeeks Subject/Topic Suite
    initGfgDashboard();

    // Façade Custom Selects to replace browser native selects (completely purple on focus/hover!)
    initializeCustomSelects();

    // Load and render performance history
    loadPerformanceHistory();
    renderPerformanceChart();

    const openModalBtn = document.getElementById("open-performance-modal-btn");
    const closeModalBtn = document.getElementById("close-performance-modal-btn");
    const performanceModal = document.getElementById("nav-performance-modal");

    if (openModalBtn && closeModalBtn && performanceModal) {
      openModalBtn.addEventListener("click", () => {
        performanceModal.classList.add("visible");
        renderPerformanceChart();
      });
      closeModalBtn.addEventListener("click", () => {
        performanceModal.classList.remove("visible");
      });
    }

    const resetDataBtn = document.getElementById("reset-data-btn");
    if (resetDataBtn) {
      resetDataBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all your test performance data?")) {
          state.performanceHistory = [];
          savePerformanceHistory();
          renderPerformanceChart();
        }
      });
    }
  }

  // --- SPLASH → LOGIN → APP BOOT SEQUENCE ---
  function bootApp() {
    const splashEl    = document.getElementById('splash-screen');
    const loginEl     = document.getElementById('login-screen');
    const mainAppEl   = document.getElementById('main-app');
    const loginInput  = document.getElementById('login-name-input');
    const loginBtn    = document.getElementById('login-submit-btn');

    function showLogin() {
      if (loginBtn) loginBtn.disabled = false; // Ensure button is enabled
      splashEl.classList.add('fade-out');
      setTimeout(() => {
        splashEl.style.display = 'none';
        loginEl.style.display = 'flex';
        loginEl.classList.add('show');
        if (loginInput) {
          loginInput.value = ''; // Always clear to ask fresh every time
          loginInput.focus();
        }
      }, 800);
    }

    function launchApp(name) {
      // Save name
      const trimmed = (name || '').trim() || 'Aspirant';
      state.candidateName = trimmed;
      localStorage.setItem('gate_user_name', trimmed);

      // Update any candidate name displays
      updateCandidateName();

      loginEl.classList.add('fade-out');
      setTimeout(() => {
        loginEl.style.display = 'none';
        mainAppEl.style.display = '';
        mainAppEl.style.removeProperty('display');
        init();
      }, 600);
    }

    // Submit handler
    function handleLoginSubmit() {
      const val = loginInput ? loginInput.value.trim() : '';
      if (!val) {
        if (loginInput) {
          loginInput.classList.add('input-error');
          loginInput.addEventListener('animationend', () => {
            loginInput.classList.remove('input-error');
          }, { once: true });
        }
        return;
      }
      if (loginBtn) loginBtn.disabled = true;
      launchApp(val);
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', handleLoginSubmit);
    }
    if (loginInput) {
      loginInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLoginSubmit();
      });
    }

    // Splash duration: loader anim is 3s total (0.8s delay + 2.2s anim) → 3.2s
    // Always show the login screen to ask for username every single time
    setTimeout(showLogin, 3200);
  }

  bootApp();


  // Helper to determine if a question was answered correctly
    // ... (existing code unchanged)
    
    // Adjust right box height based on exam mode
    function adjustRightBoxHeight() {
      const leftCol  = document.querySelector('.dashboard-left');
      const rightCol = document.querySelector('.dashboard-right');
      if (!leftCol || !rightCol) return;

      if (window.innerWidth > 992) {
        rightCol.style.height = '100%';
      } else {
        const leftH = leftCol.getBoundingClientRect().height;
        rightCol.style.height = leftH + 'px';
      }

      // All inner panels: fill right column height + scroll internally
      const ids = ['panel-pyq-papers', 'subject-selection-container',
                   'topics-selection-container', 'panel-subject-placeholder'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.height = '100%';
          el.style.maxHeight = '';
          el.style.overflowY = 'auto';
        }
      });
    }

    // Set up a permanent ResizeObserver so right column strictly tracks left column height
    const dLeft = document.querySelector('.dashboard-left');
    if (dLeft) {
      new ResizeObserver(() => adjustRightBoxHeight()).observe(dLeft);
    }
    // Re-run on every window resize so alignment is always maintained
    window.addEventListener('resize', adjustRightBoxHeight);
  function isQuestionCorrect(q) {
    const userAns = state.userAnswers[q.id];
    if (userAns === undefined || userAns === "" || (Array.isArray(userAns) && userAns.length === 0)) {
      return false; // Unattempted
    }
    if (q.type === "MCQ") {
      return parseInt(userAns) === q.correctAnswer;
    }
    if (q.type === "MSQ") {
      if (Array.isArray(userAns) && Array.isArray(q.correctAnswer)) {
        const sortedUser = [...userAns].sort();
        const sortedCorrect = [...q.correctAnswer].sort();
        return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
      }
    }
    if (q.type === "NAT") {
      const userNum = parseFloat(userAns);
      if (!isNaN(userNum)) {
        const range = q.correctAnswerRange;
        return userNum >= range.min && userNum <= range.max;
      }
    }
    return false;
  }

  // --- PERFORMANCE HISTORY & GRAPH LOGIC ---
  function loadPerformanceHistory() {
    try {
      const stored = localStorage.getItem('gate_performance_history');
      if (stored) {
        state.performanceHistory = JSON.parse(stored);
      } else {
        state.performanceHistory = [];
      }
    } catch (e) {
      console.error("Failed to load performance history", e);
      state.performanceHistory = [];
    }
  }

  function savePerformanceHistory() {
    try {
      localStorage.setItem('gate_performance_history', JSON.stringify(state.performanceHistory));
    } catch (e) {
      console.error("Failed to save performance history", e);
    }
  }

  function renderPerformanceChart() {
    renderChartToCanvas('resultsPerformanceChart', 'resultsChartInstance');
    renderChartToCanvas('modalPerformanceChart', 'modalChartInstance');
  }

  function renderChartToCanvas(canvasId, instanceKey) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Only show last 15 attempts
    const history = state.performanceHistory.slice(-15);
    
    if (state[instanceKey]) {
      state[instanceKey].destroy();
      state[instanceKey] = null;
    }

    if (history.length === 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Take a test to see your performance graph here', canvas.width / 2, canvas.height / 2);
      return;
    }

    const labels = history.map((entry, idx) => `Test ${idx + 1}`);
    const dataPoints = history.map(entry => entry.score);

    state[instanceKey] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Score',
          data: dataPoints,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#8b5cf6',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const entry = history[context.dataIndex];
                return `Score: ${entry.score}/${entry.maxMarks} (${entry.mode})`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: { color: '#a3a3a3' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#a3a3a3' }
          }
        }
      }
    });
  }

  function updateInstructionsText() {
    const p1 = document.getElementById("instruction-timer-point");
    const p2 = document.getElementById("instruction-auto-submit-point");
    
    if (p1 && p2) {
      if (state.testDurationMinutes === 60) {
        p1.innerHTML = "The clock will be set at the server. The <strong>stopwatch</strong> at the top right of the screen will display the elapsed time since you started the examination.";
        p2.innerHTML = "The stopwatch runs continuously and does not end automatically. You must manually submit your examination when you are finished.";
      } else {
        p1.innerHTML = "The clock will be set at the server. The <strong>countdown timer</strong> at the top right of the screen will display the remaining time available for you to complete the examination.";
        p2.innerHTML = "When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.";
      }
    }
  }

  // --- VIEW SWITCHING ---
  function switchView(targetView) {
    const views = [DOM.dashboardView, DOM.guidelinesView, DOM.examView, DOM.resultsView];
    views.forEach(v => {
      if (v) {
        v.classList.remove("active");
        v.style.display = "none";
      }
    });

    if (targetView) {
      targetView.style.display = "flex";
      setTimeout(() => {
        targetView.classList.add("active");
      }, 20);
    }
  }

  // --- POPULATE dropdowns based on subject ---
  function populateYearDropdown() {
    DOM.testYearInput.innerHTML = "";
    const stream = state.selectedStream;

    // Dynamically read available paper keys from the question bank
    let pkeys = [];
    if (typeof gatePapers !== "undefined" && gatePapers[stream]) {
      pkeys = Object.keys(gatePapers[stream]).sort((a, b) => {
        // Sort by year desc, then by set number asc
        const yearA = a.split('_')[0], yearB = b.split('_')[0];
        if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
        return a.localeCompare(b);
      });
    }

    if (pkeys.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No papers available";
      DOM.testYearInput.appendChild(opt);
      return;
    }

    pkeys.forEach(pk => {
      const opt = document.createElement("option");
      opt.value = pk;
      // Format display: "2025_S1" -> "2025 — Set 1", "2023" -> "2023"
      const parts = pk.split('_S');
      const year  = parts[0];
      const setLabel = parts.length > 1 ? ` — Set ${parts[1]}` : "";
      const streamLabel = stream === "CS" ? "GATE CS & IT" : "GATE DA";
      opt.textContent = `${streamLabel} ${year}${setLabel}`;
      DOM.testYearInput.appendChild(opt);
    });

    DOM.testYearInput.value = pkeys[0];
    state.selectedYear = pkeys[0];
  }

  function updateSyllabusDescription() {
    const stream = state.selectedStream;
    const pk     = state.selectedYear;  // paper key like "2025_S1" or "2023"

    // Parse year and set from paper key
    const parts    = pk.split('_S');
    const year     = parts[0];
    const setLabel = parts.length > 1 ? ` — Set ${parts[1]}` : "";

    const paperData = (typeof gatePapers !== "undefined" && gatePapers[stream] && gatePapers[stream][pk])
                      ? gatePapers[stream][pk] : null;
    const qCount    = paperData ? Math.min(paperData.length, 65) : 0;
    const hasData   = qCount > 0;

    const badgeClass = hasData ? 'status-pill-correct' : 'status-pill-unattempted';
    const badgeIcon  = hasData ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-clock"></i>';
    const badgeText  = hasData
      ? `${badgeIcon} ${qCount} Questions Loaded from PDF`
      : `${badgeIcon} Paper unavailable`;

    let syllabus = "";
    if (stream === "CS") {
      syllabus = "Discrete Math, Algorithms &amp; DS, Operating Systems, DBMS, Theory of Computation, Digital Logic, Computer Networks &amp; General Aptitude";
    } else {
      syllabus = "Probability &amp; Statistics, Linear Algebra, Calculus, Python, Machine Learning, AI Search &amp; Logic, General Aptitude";
    }

    DOM.syllabusDescription.innerHTML = `
      <h4 style="font-weight:700; color:var(--primary); margin-bottom:6px; font-size:16px;">
        <i class="fa-solid fa-file-lines"></i>
        GATE ${stream === "CS" ? "CS &amp; IT" : "Data Science &amp; AI"} ${year}${setLabel}
      </h4>
      <p style="margin-bottom:8px; font-size:16px; opacity:0.85; line-height: 1.5;">${syllabus}</p>
      <span class="badge ${badgeClass}" style="font-size:14px; padding:4px 10px;">${badgeText}</span>
    `;
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Dashboard actions
    const themeSelector = document.getElementById("theme-selector");
    if (themeSelector) {
      themeSelector.addEventListener("change", (e) => {
        document.documentElement.setAttribute("data-theme", e.target.value);
        localStorage.setItem("gate-mock-theme", e.target.value);
      });
    }

    if (DOM.candidateNameInput) {
      DOM.candidateNameInput.addEventListener("input", updateCandidateName);
    }
    
    // Add listener for exam duration change
    if (DOM.testDurationInput) {
      DOM.testDurationInput.addEventListener('change', () => {
        const val = DOM.testDurationInput.value;
        state.testDurationMinutes = parseInt(val, 10);
        adjustRightBoxHeight();
      });
    }
    
    DOM.testStreamInput.addEventListener("change", (e) => {
      state.selectedStream = e.target.value;
      populateYearDropdown();
      updateSyllabusDescription();
      
      // Re-populate subjects dynamically if in Subject-wise Mock Test mode
      if (state.isGfgMode) {
        state.selectedSubject = null; // Reset selection on stream change
        
        // Reset drawers: show subjects on the right, hide topics
        const subjectContainer = document.getElementById("subject-selection-container");
        const topicsContainer = document.getElementById("topics-selection-container");
        if (subjectContainer) subjectContainer.style.display = "flex";
        if (topicsContainer) topicsContainer.style.display = "none";
        
        renderSubjectsList();
      }
    });

    DOM.testYearInput.addEventListener("change", (e) => {
      state.selectedYear = e.target.value;
      updateSyllabusDescription();
    });



    DOM.startInstructionsBtn.addEventListener("click", () => {
      state.isGfgMode = false; // Reset GFG practice mode
      state.testDurationMinutes = parseInt(DOM.testDurationInput.value) || 20;
      updateInstructionsText();
      switchView(DOM.guidelinesView);
    });

    DOM.backToDashboardBtn.addEventListener("click", () => {
      switchView(DOM.dashboardView);
    });

    DOM.declarationCheck.addEventListener("change", (e) => {
      DOM.startTestBtn.disabled = !e.target.checked;
    });

    // Start Exam trigger
    DOM.startTestBtn.addEventListener("click", startExam);

    // Exam Arena Navigation & Actions
    DOM.prevQuestionBtn.addEventListener("click", navigatePrevious);
    DOM.saveNextBtn.addEventListener("click", saveAndNext);
    DOM.markReviewBtn.addEventListener("click", markForReviewAndNext);
    DOM.clearResponseBtn.addEventListener("click", clearResponse);

    // Section Switching Tabs
    document.querySelectorAll(".section-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        const sec = e.currentTarget.getAttribute("data-section");
        changeSection(sec);
      });
    });

    // Calculator visibility trigger
    if (DOM.dashboardCalcBtn) DOM.dashboardCalcBtn.addEventListener("click", toggleCalculator);
    DOM.calcToggleBtn.addEventListener("click", toggleCalculator);
    DOM.calcCloseBtn.addEventListener("click", toggleCalculator);

    // Submit Exam click
    DOM.submitExamBtn.addEventListener("click", triggerSubmitModal);
    DOM.confirmCancelBtn.addEventListener("click", () => DOM.confirmModal.classList.remove("visible"));
    DOM.confirmOkBtn.addEventListener("click", submitExam);

    // Exit to dashboard from analytics
    DOM.exitToDashboardBtn.addEventListener("click", resetToDashboard);

    // Setup Calculator Events
    setupCalculatorKeyboard();
    makeCalculatorDraggable();
  }

  // --- CORE LOGIC FUNCTIONS ---

  function updateCandidateName() {
    const val = state.candidateName || 'Aspirant';
    
    // Display in the dashboard welcome card
    if (DOM.candidateNameDisplay) {
      DOM.candidateNameDisplay.textContent = val;
    }
    
    // Display in the dashboard header user-pill
    const userPillName = document.getElementById("user-name-pill");
    if (userPillName) {
      userPillName.textContent = val;
    }

    // Display "Candidate" on the live exam view sidebar (displays name only in dashboard)
    if (DOM.candidateDisplayName) {
      DOM.candidateDisplayName.textContent = "Candidate";
    }
  }

  function updateSectionBadgeCounts() {
    const gaCount = state.questions.filter(q => q.section === "GA").length;
    const techCount = state.questions.filter(q => q.section === state.selectedStream).length;
    
    if (DOM.sectionGAButton) document.getElementById("section-ga-count").textContent = `${gaCount} Qs`;
    
    const techCountBadge = document.getElementById("section-tech-count");
    if (techCountBadge) {
      techCountBadge.textContent = `${techCount} Qs`;
    }
  }

  // Clean up PDF extraction artifacts from question/option text
  function cleanPdfText(text) {
    if (!text) return text;
    // Remove "Page X of Y" artifacts
    text = text.replace(/Page\s+\d+\s+of\s+\d+[^.]*?(?=\s|$)/gi, '');
    // Remove "Organising/Organizing Institute: ..." artifacts  
    text = text.replace(/Organ[is|iz]ing Institute:[^"']*/gi, '');
    // Remove header-like numbering at start
    text = text.replace(/^–\s*Q\.\d+.*?Each\s*/i, '');
    // Clean multiple spaces
    text = text.replace(/\s{2,}/g, ' ').trim();
    return text;
  }

  function generateDetailedShortExplanation(q) {
    if (q.explanation) {
      return `
        <div class="short-explanation-content" style="font-size: 15px; line-height: 1.6; color: var(--text-secondary);">
          <p style="margin-bottom: 0;"><i class="fa-solid fa-square-check text-emerald" style="margin-right: 6px;"></i> ${q.explanation}</p>
        </div>
      `;
    }

    let answerText = "";
    
    const getOptionLetter = (idx) => String.fromCharCode(65 + idx);
    
    if (q.type === "MCQ") {
      const letter = getOptionLetter(q.correctAnswer);
      const optionVal = q.options && q.options[q.correctAnswer] ? q.options[q.correctAnswer] : "";
      answerText = `Option <strong>${letter}</strong>${optionVal ? `: <em>${optionVal}</em>` : ""}`;
    } else if (q.type === "MSQ") {
      const letters = Array.isArray(q.correctAnswer) 
        ? q.correctAnswer.map(getOptionLetter)
        : [getOptionLetter(q.correctAnswer)];
        
      const optionsText = Array.isArray(q.correctAnswer)
        ? q.correctAnswer.map(idx => {
            const letter = getOptionLetter(idx);
            const val = q.options && q.options[idx] ? q.options[idx] : "";
            return `Option <strong>${letter}</strong>${val ? `: <em>${val}</em>` : ""}`;
          }).join(" and ")
        : `Option <strong>${letters[0]}</strong>`;
        
      answerText = optionsText;
    } else if (q.type === "NAT") {
      if (q.correctAnswerRange) {
        if (q.correctAnswerRange.min === q.correctAnswerRange.max) {
          answerText = `Exactly <strong>${q.correctAnswerRange.min}</strong>`;
        } else {
          answerText = `Any numeric value between <strong>${q.correctAnswerRange.min}</strong> and <strong>${q.correctAnswerRange.max}</strong>`;
        }
      } else {
        answerText = `Exactly <strong>${q.correctAnswer}</strong>`;
      }
    }
    
    return `
      <div class="short-explanation-content" style="font-size: 15px; line-height: 1.6; color: var(--text-secondary);">
        <p style="margin-bottom: 0;"><i class="fa-solid fa-square-check text-emerald" style="margin-right: 6px;"></i> The correct answer of this question is ${answerText}.</p>
      </div>
    `;
  }

  // --- START EXAM ENGINE ---
  function startExam() {
    state.isExamActive = true;
    state.isSubmitted = false;
    state.currentQuestionIndex = 0;
    state.userAnswers = {};

    const stream = state.selectedStream;
    const year = state.selectedYear;

    if (state.isGfgMode) {
      // Questions are already pre-loaded into state.questions by the subject/topic selector or scraper
      // Ensure they are sequentially indexed
      state.questions = state.questions.map((q, idx) => ({
        ...q,
        id: idx + 1
      }));
    } else {
      // Load dynamic questions from database
      let loadedQuestions = [];
      if (typeof gatePapers !== "undefined" && gatePapers[stream] && gatePapers[stream][year]) {
        loadedQuestions = gatePapers[stream][year];
      } else {
        // Fallback: use latest available year
        const fallbackYear = Object.keys(gatePapers[stream] || {}).sort((a,b) => b-a)[0];
        loadedQuestions = (gatePapers[stream] && fallbackYear) ? gatePapers[stream][fallbackYear] : [];
      }

      // Clean PDF artifacts from all questions
      loadedQuestions = loadedQuestions.map((q, idx) => ({
        ...q,
        id: idx + 1,  // re-index so IDs are sequential
        question: cleanPdfText(q.question),
        options: q.options ? q.options.map(cleanPdfText) : undefined
      }));

      // Filter out garbage placeholder-only questions
      loadedQuestions = loadedQuestions.filter(q => q.question && q.question.length > 15);

      // Cap at 65 questions (official GATE has 65 questions)
      if (loadedQuestions.length > 65) {
        loadedQuestions = loadedQuestions.slice(0, 65);
      }

      state.questions = loadedQuestions;
    }

    // Generate and store short explanations beforehand for all extracted questions
    state.questions = state.questions.map(q => ({
      ...q,
      shortExplanation: generateDetailedShortExplanation(q)
    }));

    // Configure second section tab header based on Selected Stream (CS vs DS)
    const techTab = document.querySelector(".section-tab[data-section='CS']") || 
                    document.querySelector(".section-tab[data-section='DS']") ||
                    document.querySelector(".section-tab[data-section='TOPIC']");
    
    if (state.isGfgMode) {
      if (DOM.sectionGAButton) {
        DOM.sectionGAButton.style.display = "none";
      }
      if (techTab) {
        techTab.setAttribute("data-section", "TOPIC");
        techTab.innerHTML = `Practice Quiz <span class="badge" id="section-tech-count">${state.questions.length} Qs</span>`;
        techTab.classList.add("active");
      }
      DOM.activeTestTitle.textContent = state.gfgExamTitle || "GATE CS Subject-wise Practice";
    } else {
      if (DOM.sectionGAButton) {
        DOM.sectionGAButton.style.display = "";
        DOM.sectionGAButton.classList.add("active");
      }
      if (techTab) {
        techTab.setAttribute("data-section", stream);
        const label = stream === "CS" ? "Computer Science (CS)" : "Data Science & AI (DS)";
        techTab.innerHTML = `${label} <span class="badge" id="section-tech-count">0 Qs</span>`;
        techTab.classList.remove("active");
      }
      
      // Configure Exam title in header — parse set from paper key e.g. "2025_S1"
      const titleParts = year.split('_S');
      const titleYear  = titleParts[0];
      const titleSet   = titleParts.length > 1 ? ` — Set ${titleParts[1]}` : "";
      const streamName = stream === "CS" ? "CS & IT" : "Data Science & AI";
      DOM.activeTestTitle.textContent = `GATE ${streamName} ${titleYear}${titleSet} PYQ Practice Paper`;
    }

    // Initialize question statuses
    state.questions.forEach((q, idx) => {
      state.questionStates[q.id] = "not-visited";
    });

    const isSubjectWise = state.testDurationMinutes === 60;
    const countdownBox = document.getElementById('countdown-box');
    const stopwatchBox = document.getElementById('stopwatch-box');

    if (isSubjectWise) {
      if (countdownBox) countdownBox.style.display = 'none';
      if (stopwatchBox) stopwatchBox.style.display = 'flex';
      state.stopwatchElapsed = parseInt(localStorage.getItem('gate_sw_elapsed') || '0', 10);
      updateStopwatchDisplay();
      setupStopwatchControls();
    } else {
      if (countdownBox) countdownBox.style.display = 'flex';
      if (stopwatchBox) stopwatchBox.style.display = 'none';
      state.timeLeftSeconds = state.testDurationMinutes * 60;
      updateTimerDisplay();
      state.timerInterval = setInterval(tick, 1000);
    }

    // Swap view to exam
    switchView(DOM.examView);

    // Mark first question visited
    const firstQ = state.questions[0];
    state.questionStates[firstQ.id] = "not-visited";

    // Populate elements
    renderQuestionPalette();
    renderQuestion(0);
    updateSectionBadgeCounts();
    updateSummaryStats();
  }

  // Timer Tick
  function tick() {
    if (state.timeLeftSeconds <= 0) {
      clearInterval(state.timerInterval);
      submitExamAuto();
      return;
    }
    state.timeLeftSeconds--;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const hrs = Math.floor(state.timeLeftSeconds / 3600);
    const mins = Math.floor((state.timeLeftSeconds % 3600) / 60);
    const secs = state.timeLeftSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    DOM.examCountdown.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    const countdownBox = document.getElementById('countdown-box');
    if (countdownBox) {
      if (state.timeLeftSeconds < 120) {
        countdownBox.style.background = "rgba(239, 68, 68, 0.25)";
        countdownBox.style.borderColor = "var(--danger)";
      } else {
        countdownBox.style.background = "rgba(239, 68, 68, 0.1)";
        countdownBox.style.borderColor = "rgba(239, 68, 68, 0.3)";
      }
    }
  }

  // --- STOPWATCH FUNCTIONS ---
  function updateStopwatchDisplay() {
    const pad = (n) => String(n).padStart(2, '0');
    const hrs  = Math.floor(state.stopwatchElapsed / 3600);
    const mins = Math.floor((state.stopwatchElapsed % 3600) / 60);
    const secs = state.stopwatchElapsed % 60;
    const el = document.getElementById('stopwatch-display');
    if (el) el.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    localStorage.setItem('gate_sw_elapsed', String(state.stopwatchElapsed));
  }

  function setupStopwatchControls() {
    const startBtn = document.getElementById('sw-start-btn');
    const pauseBtn = document.getElementById('sw-pause-btn');
    const resetBtn = document.getElementById('sw-reset-btn');
    if (!startBtn) return;
    const newStart = startBtn.cloneNode(true);
    const newPause = pauseBtn.cloneNode(true);
    const newReset = resetBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStart, startBtn);
    pauseBtn.parentNode.replaceChild(newPause, pauseBtn);
    resetBtn.parentNode.replaceChild(newReset, resetBtn);
    newStart.addEventListener('click', () => {
      if (state.stopwatchInterval) return;
      state.stopwatchInterval = setInterval(() => {
        state.stopwatchElapsed++;
        updateStopwatchDisplay();
      }, 1000);
      newStart.disabled = true;
      newPause.disabled = false;
    });
    newPause.addEventListener('click', () => {
      clearInterval(state.stopwatchInterval);
      state.stopwatchInterval = null;
      newStart.disabled = false;
      newPause.disabled = true;
    });
    newReset.addEventListener('click', () => {
      clearInterval(state.stopwatchInterval);
      state.stopwatchInterval = null;
      state.stopwatchElapsed = 0;
      localStorage.removeItem('gate_sw_elapsed');
      updateStopwatchDisplay();
      newStart.disabled = false;
      newPause.disabled = true;
    });
  }

  // --- RENDER EXAM ENGINE PANELS ---

  function renderQuestionPalette() {
    DOM.paletteGrid.innerHTML = "";
    state.questions.forEach((q, idx) => {
      const btn = document.createElement("button");
      btn.className = `palette-btn ${state.questionStates[q.id]}`;
      btn.textContent = idx + 1;
      btn.id = `palette-q-${idx}`;
      btn.addEventListener("click", () => selectQuestion(idx));
      DOM.paletteGrid.appendChild(btn);
    });
  }

  function selectQuestion(index) {
    if (index < 0 || index >= state.questions.length) return;
    
    // Set old question status as visited if it was not-visited
    const oldQ = state.questions[state.currentQuestionIndex];
    if (state.questionStates[oldQ.id] === "not-visited") {
      state.questionStates[oldQ.id] = "not-answered";
    }

    state.currentQuestionIndex = index;
    renderQuestion(index);
    updatePaletteActiveState();
    updateSummaryStats();
  }

  function renderQuestion(index) {
    const q = state.questions[index];
    if (!q) return;

    // Display numbers & meta
    DOM.qNumber.textContent = index + 1;
    DOM.qType.textContent = q.type;
    DOM.qMarks.textContent = q.marks;
    DOM.qNegative.textContent = q.negativeMark === 0 ? "0.00" : q.negativeMark.toFixed(2);

    // Update section active tab highlighting
    document.querySelectorAll(".section-tab").forEach(tab => {
      tab.classList.remove("active");
      if (tab.getAttribute("data-section") === q.section) {
        tab.classList.add("active");
      }
    });

    // Populate question text
    DOM.questionText.innerHTML = q.question;

    // Render Math typesetting safely
    typesetMath(DOM.questionText);

    // Clear and build options input templates
    DOM.optionsContainer.innerHTML = "";

    if (q.type === "MCQ") {
      renderMCQOptions(q);
    } else if (q.type === "MSQ") {
      renderMSQOptions(q);
    } else if (q.type === "NAT") {
      renderNATInput(q);
    }

    // Toggle navigation button boundaries
    DOM.prevQuestionBtn.disabled = (index === 0);
    // If it is the very last question, rename Next button to Save
    if (index === state.questions.length - 1) {
      DOM.saveNextBtn.innerHTML = `Save & Finish <i class="fa-solid fa-flag-checkered"></i>`;
    } else {
      DOM.saveNextBtn.innerHTML = `Save & Next <i class="fa-solid fa-chevron-right"></i>`;
    }

    // Update current class in question palette buttons
    updatePaletteActiveState();
  }

  function typesetMath(element) {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(element, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn("Math typesetting failed:", err);
      }
    }
  }

  // MCQ Options Builder
  function renderMCQOptions(question) {
    const savedAns = state.userAnswers[question.id]; // integer index
    
    question.options.forEach((optText, oIdx) => {
      const optWrapper = document.createElement("div");
      optWrapper.className = `choice-wrapper mcq-choice ${savedAns === oIdx ? 'selected' : ''}`;
      optWrapper.addEventListener("click", () => {
        document.querySelectorAll(".mcq-choice").forEach(c => c.classList.remove("selected"));
        optWrapper.classList.add("selected");
        state.userAnswers[question.id] = oIdx;
        updateSummaryStats();
      });

      const labelChar = String.fromCharCode(65 + oIdx); // A, B, C, D
      optWrapper.innerHTML = `
        <div class="choice-indicator">${labelChar}</div>
        <div class="choice-content">
          <span class="choice-label-char">${labelChar}.</span> ${optText}
        </div>
      `;
      
      typesetMath(optWrapper);
      DOM.optionsContainer.appendChild(optWrapper);
    });
  }

  // MSQ Options Builder
  function renderMSQOptions(question) {
    const savedAns = state.userAnswers[question.id] || []; // Array of indices e.g. [0, 2]

    question.options.forEach((optText, oIdx) => {
      const isSelected = savedAns.includes(oIdx);
      const optWrapper = document.createElement("div");
      optWrapper.className = `choice-wrapper msq-choice ${isSelected ? 'selected' : ''}`;
      
      optWrapper.addEventListener("click", () => {
        let currentAns = state.userAnswers[question.id] || [];
        if (currentAns.includes(oIdx)) {
          currentAns = currentAns.filter(i => i !== oIdx);
        } else {
          currentAns.push(oIdx);
        }
        
        state.userAnswers[question.id] = currentAns;
        
        if (currentAns.length === 0) {
          delete state.userAnswers[question.id];
          optWrapper.classList.remove("selected");
        } else {
          optWrapper.classList.add("selected");
        }
        
        updateSummaryStats();
      });

      const labelChar = String.fromCharCode(65 + oIdx);
      optWrapper.innerHTML = `
        <div class="choice-indicator"><i class="fa-solid fa-check"></i></div>
        <div class="choice-content">
          <span class="choice-label-char">${labelChar}.</span> ${optText}
        </div>
      `;

      typesetMath(optWrapper);
      DOM.optionsContainer.appendChild(optWrapper);
    });
  }

  // NAT Decimal Text Field Builder
  function renderNATInput(question) {
    const savedAns = state.userAnswers[question.id] || "";

    const natBox = document.createElement("div");
    natBox.className = "nat-input-box";
    natBox.innerHTML = `
      <label for="nat-val-field">Enter Numeric Response</label>
      <div class="nat-field-wrapper">
        <input type="text" id="nat-val-field" class="nat-input-field" value="${savedAns}" placeholder="0.00" autocomplete="off">
      </div>
      <div class="nat-numpad-hint">
        <i class="fa-solid fa-circle-question"></i> Use standard key inputs or floating virtual calculator.
      </div>
    `;

    DOM.optionsContainer.appendChild(natBox);

    const inputField = document.getElementById("nat-val-field");
    inputField.focus();

    inputField.addEventListener("input", (e) => {
      let val = e.target.value;
      val = val.replace(/[^0-9.\-]/g, "");
      if ((val.match(/\./g) || []).length > 1) {
        val = val.slice(0, -1);
      }
      e.target.value = val;
      
      if (val !== "") {
        state.userAnswers[question.id] = val;
      } else {
        delete state.userAnswers[question.id];
      }
      updateSummaryStats();
    });
  }

  // Palette grid styling active updater
  function updatePaletteActiveState() {
    state.questions.forEach((q, idx) => {
      const paletteBtn = document.getElementById(`palette-q-${idx}`);
      if (paletteBtn) {
        paletteBtn.className = `palette-btn ${state.questionStates[q.id]}`;
        if (idx === state.currentQuestionIndex) {
          paletteBtn.classList.add("current");
        }
      }
    });
  }

  // Update Summary Counts Sidebar
  function updateSummaryStats() {
    let answered = 0;
    let notAnswered = 0;
    let notVisited = 0;
    let marked = 0;
    let markedAnswered = 0;

    state.questions.forEach(q => {
      const status = state.questionStates[q.id];
      if (status === "answered") answered++;
      else if (status === "not-answered") notAnswered++;
      else if (status === "not-visited") notVisited++;
      else if (status === "marked") marked++;
      else if (status === "marked-answered") markedAnswered++;
    });

    DOM.statAnswered.textContent = answered;
    DOM.statNotAnswered.textContent = notAnswered;
    DOM.statNotVisited.textContent = notVisited;
    DOM.statMarked.textContent = marked;
    DOM.statMarkedAnswered.textContent = markedAnswered;
  }

  // --- ACTIONS INTERFACES ---

  function changeSection(sec) {
    const idx = state.questions.findIndex(q => q.section === sec);
    if (idx !== -1) {
      selectQuestion(idx);
    }
  }

  function navigatePrevious() {
    if (state.currentQuestionIndex > 0) {
      selectQuestion(state.currentQuestionIndex - 1);
    }
  }

  // Clear current response
  function clearResponse() {
    const q = state.questions[state.currentQuestionIndex];
    delete state.userAnswers[q.id];
    
    if (q.type === "MCQ") {
      document.querySelectorAll(".mcq-choice").forEach(c => c.classList.remove("selected"));
    } else if (q.type === "MSQ") {
      document.querySelectorAll(".msq-choice").forEach(c => c.classList.remove("selected"));
    } else if (q.type === "NAT") {
      const f = document.getElementById("nat-val-field");
      if (f) f.value = "";
    }

    state.questionStates[q.id] = "not-answered";
    renderQuestionPalette();
    updatePaletteActiveState();
    updateSummaryStats();
  }

  // Save and Next Action
  function saveAndNext() {
    const q = state.questions[state.currentQuestionIndex];
    const answer = state.userAnswers[q.id];

    if (answer !== undefined && answer !== "" && (!Array.isArray(answer) || answer.length > 0)) {
      state.questionStates[q.id] = "answered";
    } else {
      state.questionStates[q.id] = "not-answered";
    }

    renderQuestionPalette();
    
    if (state.currentQuestionIndex < state.questions.length - 1) {
      selectQuestion(state.currentQuestionIndex + 1);
    } else {
      triggerSubmitModal();
    }
  }

  // Mark for Review and Next Action
  function markForReviewAndNext() {
    const q = state.questions[state.currentQuestionIndex];
    const answer = state.userAnswers[q.id];

    if (answer !== undefined && answer !== "" && (!Array.isArray(answer) || answer.length > 0)) {
      state.questionStates[q.id] = "marked-answered";
    } else {
      state.questionStates[q.id] = "marked";
    }

    renderQuestionPalette();

    if (state.currentQuestionIndex < state.questions.length - 1) {
      selectQuestion(state.currentQuestionIndex + 1);
    } else {
      triggerSubmitModal();
    }
  }

  // --- SUBMISSION TRIGGERS & EVALUATIONS ---

  function triggerSubmitModal() {
    let answeredCount = 0;
    let reviewCount = 0;
    let unattemptedCount = 0;

    state.questions.forEach(q => {
      const status = state.questionStates[q.id];
      if (status === "answered" || status === "marked-answered") {
        answeredCount++;
      }
      if (status === "marked" || status === "marked-answered") {
        reviewCount++;
      }
      if (status === "not-visited" || status === "not-answered" || (status === "marked" && !state.userAnswers[q.id])) {
        if (!state.userAnswers[q.id]) {
          unattemptedCount++;
        }
      }
    });

    DOM.confirmAnswered.textContent = answeredCount;
    DOM.confirmReview.textContent = reviewCount;
    DOM.confirmUnattempted.textContent = unattemptedCount;

    DOM.confirmMessage.textContent = `You have completed ${answeredCount} out of ${state.questions.length} questions. Are you sure you wish to finalize and submit?`;
    DOM.confirmModal.classList.add("visible");
  }

  function submitExamAuto() {
    DOM.confirmModal.classList.remove("visible");
    alert("Time is up! Your responses are being submitted automatically.");
    submitExam();
  }

  function submitExam() {
    clearInterval(state.timerInterval);
    clearInterval(state.stopwatchInterval);
    state.stopwatchInterval = null;
    state.isExamActive = false;
    state.isSubmitted = true;
    DOM.confirmModal.classList.remove("visible");

    // Close calculator if open
    DOM.calcModal.classList.remove("visible");

    evaluateMockTestResults();
    renderPerformanceChart();
    switchView(DOM.resultsView);
  }

  // GATE Grading scoring algorithms
  function evaluateMockTestResults() {
    let totalMarks = 0;
    let scoreObtained = 0.0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    state.questions.forEach(q => {
      totalMarks += q.marks;
      const userAns = state.userAnswers[q.id];

      // Unattempted check
      if (userAns === undefined || userAns === "" || (Array.isArray(userAns) && userAns.length === 0)) {
        unattemptedCount++;
        return;
      }

      // Check correctness
      let isCorrect = false;

      if (q.type === "MCQ") {
        if (parseInt(userAns) === q.correctAnswer) {
          isCorrect = true;
        }
      } else if (q.type === "MSQ") {
        if (Array.isArray(userAns) && Array.isArray(q.correctAnswer)) {
          const sortedUser = [...userAns].sort();
          const sortedCorrect = [...q.correctAnswer].sort();
          if (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)) {
            isCorrect = true;
          }
        }
      } else if (q.type === "NAT") {
        const userNum = parseFloat(userAns);
        if (!isNaN(userNum)) {
          const range = q.correctAnswerRange;
          if (userNum >= range.min && userNum <= range.max) {
            isCorrect = true;
          }
        }
      }

      // Evaluate score
      if (isCorrect) {
        correctCount++;
        scoreObtained += q.marks;
      } else {
        wrongCount++;
        scoreObtained += q.negativeMark;
      }
    });

    // Score layout updates
    DOM.resultsScoreObtained.textContent = scoreObtained.toFixed(2);
    DOM.resultsScoreTotal.textContent = totalMarks.toFixed(2);
    DOM.resultsMarksText.textContent = scoreObtained.toFixed(2);

    DOM.resultsCorrectCount.textContent = correctCount;
    DOM.resultsWrongCount.textContent = wrongCount;
    DOM.resultsUnattemptedCount.textContent = unattemptedCount;

    // Record this attempt in performance history
    const modeLabel = state.testDurationMinutes === 60 ? "Subject-wise" : "Full Length";
    state.performanceHistory.push({
      date: new Date().toISOString(),
      score: parseFloat(scoreObtained.toFixed(2)),
      maxMarks: parseFloat(totalMarks.toFixed(2)),
      mode: modeLabel
    });
    savePerformanceHistory();

    // Accuracy Calculator
    const totalAttempted = correctCount + wrongCount;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
    DOM.resultsAccuracyPct.textContent = `${accuracy}%`;

    // Radial Progress circular animation
    const pct = Math.max(0, scoreObtained) / totalMarks;
    const offset = 314.16 - (314.16 * pct);
    DOM.resultsRadialBar.style.strokeDashoffset = offset;

    // Build Solutions Explanations
    populateSolutionsReview();
  }

  // Populate Performance solutions
  function populateSolutionsReview() {
    DOM.solutionsContainerList.innerHTML = "";

    state.questions.forEach((q, idx) => {
      const userAns = state.userAnswers[q.id];
      let statusClass = "status-pill-unattempted";
      let statusText = "Unattempted";
      let isCorrect = false;

      const isAttempted = (userAns !== undefined && userAns !== "" && (!Array.isArray(userAns) || userAns.length > 0));

      if (isAttempted) {
        if (q.type === "MCQ") {
          if (parseInt(userAns) === q.correctAnswer) {
            isCorrect = true;
          }
        } else if (q.type === "MSQ") {
          if (Array.isArray(userAns) && Array.isArray(q.correctAnswer)) {
            const sortedUser = [...userAns].sort();
            const sortedCorrect = [...q.correctAnswer].sort();
            isCorrect = (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect));
          }
        } else if (q.type === "NAT") {
          const userNum = parseFloat(userAns);
          if (!isNaN(userNum)) {
            isCorrect = (userNum >= q.correctAnswerRange.min && userNum <= q.correctAnswerRange.max);
          }
        }

        statusClass = isCorrect ? "status-pill-correct" : "status-pill-wrong";
        statusText = isCorrect ? "Correct" : "Incorrect";
      }

      // Convert answers to readable text
      const formatAnsText = (ansVal, question) => {
        if (ansVal === undefined || ansVal === "" || (Array.isArray(ansVal) && ansVal.length === 0)) {
          return `<span class="text-muted">None</span>`;
        }
        if (question.type === "MCQ") {
          const char = String.fromCharCode(65 + parseInt(ansVal));
          return `<b>Option ${char}</b>: ${question.options[ansVal]}`;
        }
        if (question.type === "MSQ") {
          const indices = Array.isArray(ansVal) ? ansVal : [ansVal];
          return indices.map(i => {
            const char = String.fromCharCode(65 + i);
            return `<b>Option ${char}</b>`;
          }).join(", ");
        }
        return `<span class="code-font">${ansVal}</span>`;
      };

      const userAnsText = formatAnsText(userAns, q);
      const correctAnsText = q.type === "NAT" 
        ? (q.correctAnswerRange.min === q.correctAnswerRange.max 
            ? `<span class="code-font">${q.correctAnswerRange.min}</span>`
            : `<span class="code-font">${q.correctAnswerRange.min} to ${q.correctAnswerRange.max}</span>`
          )
        : formatAnsText(q.correctAnswer, q);

      const sectionLabelText = q.section === "GA" ? "General Aptitude (GA)" : (state.selectedStream === "CS" ? "Computer Science (CS)" : "Data Science & AI (DS)");

      const formatOptionsForResults = (question, uAns) => {
        if (!question.options || question.options.length === 0) return "";
        
        let html = `<div class="results-options-list" style="margin-top: 12px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;">`;
        question.options.forEach((optText, oIdx) => {
          const labelChar = String.fromCharCode(65 + oIdx);
          
          const isCorrectOption = question.type === "MCQ" 
            ? (oIdx === question.correctAnswer)
            : (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(oIdx));
             
          const isUserSelected = question.type === "MCQ"
            ? (oIdx === uAns)
            : (Array.isArray(uAns) && uAns.includes(oIdx));
            
          let styleAttrs = "padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 12px; font-size: 15px; background: rgba(255,255,255,0.01); transition: var(--transition-smooth);";
          let iconHtml = `<div class="choice-indicator" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: var(--bg-tertiary); color: var(--text-secondary);">${labelChar}</div>`;
          
          if (isCorrectOption) {
            styleAttrs = "padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid #10b981; display: flex; align-items: center; gap: 12px; font-size: 15px; background: rgba(16, 185, 129, 0.08); transition: var(--transition-smooth);";
            iconHtml = `<div class="choice-indicator" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #10b981; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; background: #10b981;"><i class="fa-solid fa-check"></i></div>`;
          } else if (isUserSelected) {
            styleAttrs = "padding: 10px 14px; border-radius: var(--border-radius-sm); border: 1px solid #ef4444; display: flex; align-items: center; gap: 12px; font-size: 15px; background: rgba(239, 68, 68, 0.08); transition: var(--transition-smooth);";
            iconHtml = `<div class="choice-indicator" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #ef4444; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; background: #ef4444;"><i class="fa-solid fa-xmark"></i></div>`;
          }
          
          html += `
            <div class="result-option-item" style="${styleAttrs}">
               ${iconHtml}
               <div class="choice-content" style="flex: 1;">
                 ${optText}
               </div>
            </div>
          `;
        });
        html += `</div>`;
        return html;
      };

      const solutionItem = document.createElement("div");
      solutionItem.className = "solution-item";
      solutionItem.innerHTML = `
        <div class="solution-header" id="sol-header-${q.id}">
          <div class="solution-header-left">
            <span class="solution-badge ${statusClass}">${statusText}</span>
            <span class="solution-title">Question ${idx + 1} (${sectionLabelText})</span>
          </div>
          <div class="solution-header-right">
            <span>Marks: ${q.marks}</span>
            <i class="fa-solid fa-chevron-down toggle-icon"></i>
          </div>
        </div>
        
        <div class="solution-body" id="sol-body-${q.id}">
          <div class="solution-question-text" style="font-size: 16px; font-weight: 500; margin-bottom: 12px;">${q.question}</div>
          
          ${formatOptionsForResults(q, userAns)}
          
          <div class="solution-answers-comparison" style="margin-bottom: 16px;">
            <div class="comparison-box">
              <label>Your Response</label>
              <span>${userAnsText}</span>
            </div>
            <div class="comparison-box">
              <label>Correct Response</label>
              <span>${correctAnsText}</span>
            </div>
          </div>
          
          <div class="solution-explanation-box" style="margin-bottom: 8px; background: rgba(139, 92, 246, 0.03); border: 1px solid rgba(139, 92, 246, 0.12); padding: 16px; border-radius: var(--border-radius-sm);">
            <h4 style="color: #c084fc; font-size: 15px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-lightbulb"></i> Short Explanation</h4>
            <div>${q.shortExplanation}</div>
          </div>
        </div>
      `;

      DOM.solutionsContainerList.appendChild(solutionItem);

      // Setup click collapse toggle
      const header = solutionItem.querySelector(".solution-header");
      const body = solutionItem.querySelector(".solution-body");
      const icon = solutionItem.querySelector(".toggle-icon");
      
      header.addEventListener("click", () => {
        const isOpen = body.classList.contains("open");
        
        if (isOpen) {
          body.classList.remove("open");
          icon.className = "fa-solid fa-chevron-down toggle-icon";
        } else {
          body.classList.add("open");
          icon.className = "fa-solid fa-chevron-up toggle-icon";
          typesetMath(body);
        }
      });
    });

    typesetMath(DOM.solutionsContainerList);
  }

  function resetToDashboard() {
    clearInterval(state.timerInterval);
    clearInterval(state.stopwatchInterval);
    state.stopwatchInterval = null;
    state.isExamActive = false;
    state.isSubmitted = false;
    state.isGfgMode = false; // Reset GFG practice mode
    DOM.declarationCheck.checked = false;
    DOM.startTestBtn.disabled = true;
    
    // Reset test-duration-input dropdown to 180 to match state.isGfgMode = false
    const durationInput = document.getElementById("test-duration-input");
    if (durationInput) {
      durationInput.value = "180";
    }
    
    // Make sure we show standard PYQ year-wise papers selector on the right and welcome card on the left
    const welcomeCard = document.getElementById("welcome-card");
    const subjectContainer = document.getElementById("subject-selection-container");
    const topicsContainer = document.getElementById("topics-selection-container");
    const panelPyq = document.getElementById("panel-pyq-papers");
    const panelPlaceholder = document.getElementById("panel-subject-placeholder");
    
    if (welcomeCard) welcomeCard.style.display = "block";
    if (subjectContainer) subjectContainer.style.display = "none";
    if (topicsContainer) topicsContainer.style.display = "none";
    if (panelPyq) panelPyq.style.display = "flex";
    if (panelPlaceholder) panelPlaceholder.style.display = "none";
    adjustRightBoxHeight();

    updateSyllabusDescription();
    renderPerformanceChart();
    switchView(DOM.dashboardView);
  }

  // --- FLOATING SCIENTIFIC CALCULATOR LOGIC ---

  function toggleCalculator() {
    const isVisible = DOM.calcModal.classList.contains("visible");
    if (isVisible) {
      DOM.calcModal.classList.remove("visible");
    } else {
      DOM.calcModal.classList.add("visible");
      state.calculatorState.screenValue = "0";
      state.calculatorState.historyValue = "";
      updateCalculatorDisplay();
    }
  }

  function updateCalculatorDisplay() {
    DOM.calcScreen.value = state.calculatorState.screenValue;
    DOM.calcHistory.value = state.calculatorState.historyValue;
  }

  function setupCalculatorKeyboard() {
    // Click listeners for screen keyboard buttons
    const keys = document.querySelectorAll(".calc-btn");
    keys.forEach(key => {
      key.addEventListener("click", (e) => {
        const action = e.currentTarget.getAttribute("data-action");
        const val = e.currentTarget.getAttribute("data-val");

        if (val) {
          handleCalculatorNum(val);
        } else if (action) {
          handleCalculatorAction(action);
        }
      });
    });

    // Physical keypress event listener for real keyboard typing support
    document.addEventListener("keydown", (e) => {
      // Only process keys if the calculator is open
      if (!DOM.calcModal.classList.contains("visible")) return;

      const key = e.key;

      // Prevent default page scroll/tab on space, arrows, or backspace
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
        e.preventDefault();
      }

      if (key >= '0' && key <= '9') {
        handleCalculatorNum(key);
      } else if (key === '.') {
        handleCalculatorNum('.');
      } else if (key === '+') {
        handleCalculatorAction('add');
      } else if (key === '-') {
        handleCalculatorAction('subtract');
      } else if (key === '*') {
        handleCalculatorAction('multiply');
      } else if (key === '/') {
        handleCalculatorAction('divide');
      } else if (key === '^') {
        handleCalculatorAction('pow');
      } else if (key === '(') {
        handleCalculatorAction('bracket-open');
      } else if (key === ')') {
        handleCalculatorAction('bracket-close');
      } else if (key === ',' || key === ';') {
        handleCalculatorAction('comma');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        performCalculation();
      } else if (key === 'Backspace') {
        handleCalculatorAction('backspace');
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        handleCalculatorAction('clear');
      }
    });
  }

  function handleCalculatorNum(num) {
    if (state.calculatorState.screenValue === "0" || state.calculatorState.screenValue === "Error") {
      if (num === ".") {
        state.calculatorState.screenValue = "0.";
      } else {
        state.calculatorState.screenValue = num;
      }
    } else {
      // Prevent multiple decimal points inside a single numerical token
      if (num === ".") {
        const tokens = state.calculatorState.screenValue.split(/[\+\-\*\/\(\)\^]/);
        const lastToken = tokens[tokens.length - 1];
        if (lastToken.includes(".")) {
          return; // Ignore decimal point if already present in token
        }
      }
      state.calculatorState.screenValue += num;
    }
    updateCalculatorDisplay();
  }

  function handleCalculatorAction(action) {
    let screenStr = state.calculatorState.screenValue;

    const append = (str) => {
      if (screenStr === "0" || screenStr === "Error") screenStr = str;
      else screenStr += str;
    };

    const appendOp = (opStr) => {
      // Allow negative sign from zero to support negative numbers naturally
      if (screenStr === "0" || screenStr === "Error") {
        if (opStr === "-") {
          screenStr = "-";
        }
        return;
      }
      // Prevent consecutive basic operators
      const lastChar = screenStr.slice(-1);
      if (['+', '-', '*', '/', '^', '.'].includes(lastChar)) {
        screenStr = screenStr.slice(0, -1) + opStr;
      } else if (screenStr.endsWith(" mod ")) {
        screenStr = screenStr.slice(0, -5) + opStr;
      } else {
        screenStr += opStr;
      }
    };

    switch (action) {
      case "clear":
        state.calculatorState.screenValue = "0";
        state.calculatorState.historyValue = "";
        break;

      case "backspace":
        if (screenStr.length > 1) {
          state.calculatorState.screenValue = screenStr.slice(0, -1);
        } else {
          state.calculatorState.screenValue = "0";
        }
        return updateCalculatorDisplay();

      case "sign":
        if (!isNaN(screenStr) && screenStr !== "0") {
          state.calculatorState.screenValue = String(parseFloat(screenStr) * -1);
        }
        return updateCalculatorDisplay();

      case "add": appendOp("+"); break;
      case "subtract": appendOp("-"); break;
      case "multiply": appendOp("*"); break;
      case "divide": appendOp("/"); break;
      case "mod": appendOp(" mod "); break;
      case "pow": appendOp("^"); break;
      case "comma": append(","); break;
      case "bracket-open": append("("); break;
      case "bracket-close": append(")"); break;

      case "sin": append("sin("); break;
      case "cos": append("cos("); break;
      case "tan": append("tan("); break;
      case "asin": append("asin("); break;
      case "acos": append("acos("); break;
      case "atan": append("atan("); break;
      
      case "log": append("log10("); break;
      case "ln": append("log("); break; // Math.js treats log(x) as ln(x) by default
      case "sqrt": append("sqrt("); break;
      case "cbrt": append("cbrt("); break;
      
      case "square": append("^2"); break;
      case "cube": append("^3"); break;
      case "inv": 
        if (screenStr === "0" || screenStr === "Error") screenStr = "1/("; 
        else screenStr = "1/(" + screenStr + ")"; 
        break;
      case "fact": append("!"); break;

      case "pi": append("pi"); break;
      case "e": append("e"); break;

      case "mc":
        state.calculatorState.memoryValue = 0;
        return;
      case "mr":
        append(String(state.calculatorState.memoryValue));
        break;
      case "ms":
        state.calculatorState.memoryValue = evaluateSafeMath(screenStr) || 0;
        return;
      case "m+":
        state.calculatorState.memoryValue += evaluateSafeMath(screenStr) || 0;
        return;
      case "m-":
        state.calculatorState.memoryValue -= evaluateSafeMath(screenStr) || 0;
        return;

      case "calculate":
        performCalculation();
        return;
    }

    state.calculatorState.screenValue = screenStr;
    updateCalculatorDisplay();
  }

  function evaluateSafeMath(expr) {
    if (typeof math === 'undefined') return NaN;
    try {
      const angleMode = document.querySelector('input[name="angleMode"]:checked').value;
      const degToRad = (deg) => deg * (Math.PI / 180);
      const radToDeg = (rad) => rad * (180 / Math.PI);

      // Create explicit overrides to match official GATE standard:
      // - ln = natural log (base e)
      // - log = common log (base 10)
      // - log10 = common log (base 10)
      let scope = {
        ln: function(x) { return Math.log(x); },
        log: function(x) { return Math.log10(x); },
        log10: function(x) { return Math.log10(x); }
      };

      if (angleMode === "deg") {
        scope.sin = function(x) { return Math.sin(degToRad(x)); };
        scope.cos = function(x) { return Math.cos(degToRad(x)); };
        scope.tan = function(x) { return Math.tan(degToRad(x)); };
        scope.asin = function(x) { return radToDeg(Math.asin(x)); };
        scope.acos = function(x) { return radToDeg(Math.acos(x)); };
        scope.atan = function(x) { return radToDeg(Math.atan(x)); };
      }

      // Automatically strip trailing operators for evaluation (prevents minor syntax errors)
      let safeExpr = expr.trim();
      if (safeExpr.match(/[\+\-\*\/\^]$/)) {
        safeExpr = safeExpr.slice(0, -1);
      } else if (safeExpr.endsWith("mod")) {
        safeExpr = safeExpr.slice(0, -3);
      }

      let evaluated = math.evaluate(safeExpr, scope);
      
      if (typeof evaluated === 'number') {
        // Round extremely small fractional numbers to exactly 0 to resolve cos(90) or tan(180) float limits
        if (Math.abs(evaluated) < 1e-14) {
          evaluated = 0;
        } else {
          evaluated = Number(math.format(evaluated, {precision: 14}));
        }
      }
      return evaluated;
    } catch(e) {
      console.error("Math.js evaluation error:", e);
      return NaN;
    }
  }

  function performCalculation() {
    if (!state.calculatorState.screenValue || state.calculatorState.screenValue === "0") return;
    
    let expr = state.calculatorState.screenValue;
    state.calculatorState.historyValue = expr + " =";
    
    let result = evaluateSafeMath(expr);
    if (isNaN(result)) {
      state.calculatorState.historyValue = "Syntax Error";
    } else {
      state.calculatorState.screenValue = String(result);
    }
    
    updateCalculatorDisplay();
  }

  function makeCalculatorDraggable() {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    if (DOM.calcTitlebar) {
      DOM.calcTitlebar.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      let topVal = DOM.calcModal.offsetTop - pos2;
      let leftVal = DOM.calcModal.offsetLeft - pos1;

      const maxTop = window.innerHeight - 100;
      const maxLeft = window.innerWidth - 100;
      topVal = Math.max(10, Math.min(topVal, maxTop));
      leftVal = Math.max(10, Math.min(leftVal, maxLeft));

      DOM.calcModal.style.top = `${topVal}px`;
      DOM.calcModal.style.left = `${leftVal}px`;
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // ==========================================================================
  // 18. GEEKSFORGEEKS SUBJECT & TOPIC WISE PRACTICE SUITE & SCRAPER LOGIC
  // ==========================================================================

  state.isGfgMode = false;
  state.selectedSubject = "DBMS";
  state.selectedTopic = null;

  const SUBJECTS_AND_TOPICS = {
    "CS": {
      "DBMS": {
        name: "Database Management (DBMS)",
        icon: "fa-database",
        subtitle: "SQL, Normalization, Transactions, B-Trees",
        topics: {
          "sql": { name: "SQL Queries (SELECT, JOIN, Aggregate)", keywords: ["sql", "select", "where", "group by", "having", "join", "foreign key", "primary key"] },
          "normalization": { name: "Functional Dependencies & Normalization", keywords: ["normalization", "normal form", "functional dependency", "3nf", "bcnf", "2nf", "dependency preserving", "lossless"] },
          "transactions": { name: "Transactions & Concurrency Control", keywords: ["transaction", "concurrency", "serializable", "deadlock", "locking", "2pl", "recoverable"] },
          "indexing": { name: "File Organization & B/B+ Trees", keywords: ["indexing", "b-tree", "b+-tree", "dense index", "sparse index", "indexing schema"] },
          "er_model": { name: "ER-Model to Relational Mapping", keywords: ["er model", "entity-relationship", "relationship", "relational mapping", "cardinality"] }
        }
      },
      "OS": {
        name: "Operating Systems (OS)",
        icon: "fa-microchip",
        subtitle: "Scheduling, Semaphores, Deadlocks, Paging",
        topics: {
          "scheduling": { name: "CPU Scheduling Algorithms (SJF, SRTF, RR)", keywords: ["scheduling", "round robin", "fcfs", "sjf", "srtf", "priority scheduling", "turnaround time"] },
          "synchronization": { name: "Process Synchronization & Semaphores", keywords: ["semaphore", "mutex", "synchronization", "critical section", "producer-consumer", "dining philosophers"] },
          "deadlocks": { name: "Deadlocks Prevention & Banker's Algorithm", keywords: ["deadlock", "banker's", "safe state", "resource allocation"] },
          "paging": { name: "Memory Management, Paging & TLB", keywords: ["page table", "paging", "tlb", "logical address", "physical address", "translation"] },
          "virtual_memory": { name: "Virtual Memory & Page Replacement", keywords: ["page replacement", "lru", "page fault", "fifo", "demand paging", "thrashing"] },
          "disk_files": { name: "File Systems & Disk Scheduling (SCAN, SSTF)", keywords: ["disk scheduling", "scan", "sstf", "c-scan", "inode", "file system"] }
        }
      },
      "CN": {
        name: "Computer Networks (CN)",
        icon: "fa-wifi",
        subtitle: "IP, TCP/UDP, Routing Protocols, DNS",
        topics: {
          "protocols": { name: "OSI & TCP/IP Protocol Suite", keywords: ["osi", "protocol stack", "layer", "ip datagram", "encapsulation"] },
          "datalink": { name: "Data Link Layer & Flow Control", keywords: ["sliding window", "framing", "error control", "parity", "checksum", "flow control"] },
          "mac": { name: "Medium Access Control (CSMA/CD)", keywords: ["ethernet", "csma", "collision", "mac address", "backoff"] },
          "routing": { name: "IP Addressing, Subnetting & Routing", keywords: ["ip address", "subnet", "cidr", "routing table", "dijkstra", "bellman-ford", "distance vector", "link state"] },
          "transport": { name: "Transport Layer Protocols (TCP, UDP)", keywords: ["tcp", "udp", "connection establishment", "congestion control", "window size"] },
          "application": { name: "Application Layer (HTTP, DNS, SMTP)", keywords: ["dns", "http", "smtp", "application layer", "port number"] }
        }
      },
      "DS": {
        name: "Programming & Data Structures",
        icon: "fa-code",
        subtitle: "C, Pointers, Arrays, Trees, Recursion",
        topics: {
          "c_prog": { name: "C Programming (Pointers, Arrays, Recursion)", keywords: ["c program", "pointer", "array", "main()", "printf", "struct", "recursion"] },
          "linked_lists": { name: "Linked Lists, Stacks & Queues", keywords: ["linked list", "doubly linked", "stack", "push", "pop", "queue", "enqueue", "dequeue"] },
          "trees": { name: "Binary Trees & Tree Traversals", keywords: ["binary tree", "traversal", "inorder", "preorder", "postorder", "height of tree"] },
          "bst": { name: "Binary Search Trees & AVL Trees", keywords: ["bst", "binary search tree", "avl", "search tree"] },
          "heaps": { name: "Min/Max Heaps & Priority Queues", keywords: ["heap", "min-heap", "max-heap", "meld", "priority queue"] },
          "hashing": { name: "Hashing & Hash Tables", keywords: ["hashing", "hash table", "collision resolution", "chaining", "probe"] }
        }
      },
      "ALGO": {
        name: "Algorithms",
        icon: "fa-network-wired",
        subtitle: "Asymptotics, Greedy, Sorting, Graphs, DP",
        topics: {
          "asymptotic": { name: "Asymptotic Analysis & Recurrences", keywords: ["complexity", "asymptotic", "big o", "theta", "recurrence", "master theorem"] },
          "sorting": { name: "Searching & Sorting (Quick, Merge, Heap)", keywords: ["sorting", "quick sort", "merge sort", "heap sort", "binary search", "comparisons"] },
          "greedy": { name: "Greedy Algorithms (Huffman, Fractional Knapsack)", keywords: ["greedy", "huffman", "knapsack", "activity selection"] },
          "dp": { name: "Dynamic Programming (LCS, Matrix Chain)", keywords: ["dynamic programming", "matrix chain", "lcs", "memoization"] },
          "graphs": { name: "Graph Traversals & MSTs (Kruskal, Prim, Dijkstra)", keywords: ["minimum spanning tree", "mst", "kruskal", "prim", "dijkstra", "bfs", "dfs", "topological"] },
          "complexity": { name: "Complexity Theory (P, NP, NP-Complete)", keywords: ["np-complete", "np-hard", "undecidable problem", "polynomial time"] }
        }
      },
      "TOC": {
        name: "Theory of Computation (TOC)",
        icon: "fa-project-diagram",
        subtitle: "Automata, CFG, PDA, Turing, Decidability",
        topics: {
          "automata": { name: "Finite Automata & Regular Expressions", keywords: ["finite automata", "dfa", "nfa", "regular expression", "regular language", "minimization"] },
          "cfg": { name: "CFGs & Context Free Languages", keywords: ["context free", "cfg", "cfl", "pumping lemma", "ambiguous grammar"] },
          "pda": { name: "Pushdown Automata", keywords: ["pda", "pushdown", "npda", "dpda"] },
          "turing": { name: "Turing Machines & Decidability", keywords: ["turing machine", "undecidable", "decidable", "halting problem", "recursive language"] }
        }
      },
      "COMPILER": {
        name: "Compiler Design",
        icon: "fa-terminal",
        subtitle: "Parsing, Lexical, SDT, Intermediate Code",
        topics: {
          "lexical": { name: "Lexical Analysis", keywords: ["lexical", "token", "regular expression", "transition diagram"] },
          "parsing": { name: "Syntax Analysis (LL, LR Parsers)", keywords: ["parsing", "parser", "ll(1)", "lr(1)", "lalr", "slr", "shift-reduce"] },
          "sdt": { name: "Syntax Directed Translation & Attribute Grammars", keywords: ["syntax directed", "s-attributed", "l-attributed", "attribute grammar"] },
          "intermediate": { name: "Intermediate Code Generation & Optimization", keywords: ["intermediate code", "three-address", "backpatching", "code optimization", "activation record"] }
        }
      },
      "COA": {
        name: "Computer Organization (COA)",
        icon: "fa-server",
        subtitle: "Addressing Modes, Cache, Pipelining",
        topics: {
          "instructions": { name: "Instruction Formats & Addressing Modes", keywords: ["addressing mode", "instruction format", "registers", "program counter"] },
          "pipelining": { name: "Instruction Pipelining & Hazards", keywords: ["pipelining", "pipeline hazard", "branch penalty", "stalls", "speedup"] },
          "cache": { name: "Cache Memory Hierarchies & Mapping", keywords: ["cache", "direct-mapped", "set-associative", "miss penalty", "hit rate", "block size"] }
        }
      },
      "DIGITAL": {
        name: "Digital Logic",
        icon: "fa-toggle-on",
        subtitle: "Boolean Algebra, K-Maps, Combinational",
        topics: {
          "boolean": { name: "Boolean Algebra & K-Maps", keywords: ["boolean", "karnaugh", "k-map", "logic gate", "sop", "pos"] },
          "combinational": { name: "Combinational Circuits (Mux, Decoders)", keywords: ["combinational", "multiplexer", "decoder", "adder", "demultiplexer"] },
          "sequential": { name: "Sequential Circuits (Flip-Flops, Counters)", keywords: ["flip-flop", "counter", "ripple counter", "sequential", "register"] },
          "number_rep": { name: "Number Representations & Arithmetic", keywords: ["2's complement", "booth", "number system", "signed number"] }
        }
      },
      "MATHS": {
        name: "Engineering & Discrete Maths",
        icon: "fa-calculator",
        subtitle: "Logic, Relations, Graphs, Linear Algebra",
        topics: {
          "logic": { name: "Propositional & Predicate Logic", keywords: ["propositional", "predicate", "first-order logic", "tautology", "quantifier"] },
          "sets": { name: "Set Theory & Relations", keywords: ["partial order", "relation", "equivalence relation", "lattice", "symmetric relation"] },
          "groups": { name: "Groups & Algebraic Structures", keywords: ["group", "monoid", "semigroup", "isomorphism"] },
          "graphs": { name: "Graph Theory", keywords: ["graph theory", "undirected graph", "degree", "coloring", "path"] },
          "math_linear": { name: "Linear Algebra (Matrices, Determinants)", keywords: ["matrix", "determinant", "eigenvalue", "system of linear"] },
          "probability": { name: "Probability & Statistics", keywords: ["probability", "expected length", "random", "uniform distribution", "expectation"] }
        }
      },
      "APTITUDE": {
        name: "General Aptitude (GA)",
        icon: "fa-brain",
        subtitle: "Quantitative, Logical, Verbal analogies",
        topics: {
          "quant": { name: "Quantitative Aptitude", keywords: ["average", "speed", "work", "ratio", "cube", "area", "percentage", "probability"] },
          "verbal": { name: "Verbal Ability", keywords: ["analogy", "replace the word", "sentence", "grammar", "meaning"] },
          "reasoning": { name: "Logical Reasoning", keywords: ["diagram", "cube", "folded", "brother", "daughter", "mother", "sister"] }
        }
      }
    },
    "DS": {
      "DS_PROB": {
        name: "Probability & Statistics",
        icon: "fa-chart-pie",
        subtitle: "Conditional Prob, Random Variables, Distributions",
        topics: {
          "prob_basic": { name: "Conditional Prob, Bayes, Random Variables", keywords: ["probability", "conditional probability", "bayes", "random variable", "binomial", "poisson", "uniform distribution", "normal distribution"] },
          "stats_desc": { name: "Mean, Median, Standard Deviation, Correlation", keywords: ["mean", "median", "mode", "standard deviation", "variance", "correlation", "covariance", "regression", "random sample"] }
        }
      },
      "DS_LA": {
        name: "Linear Algebra",
        icon: "fa-square-root-variable",
        subtitle: "Vector Spaces, Matrices, Eigenvalues, SVD",
        topics: {
          "vector_spaces": { name: "Vector Spaces, Projections, Linear Independence", keywords: ["vector space", "linear dependence", "projection", "subspace", "span", "basis"] },
          "matrix_ops": { name: "Matrices, Linear Systems, Eigenvalues, SVD", keywords: ["matrix", "determinant", "eigenvalue", "eigenvector", "diagonalization", "rank", "svd", "system of linear"] }
        }
      },
      "DS_CALC": {
        name: "Calculus & Optimization",
        icon: "fa-calculator",
        subtitle: "Limits, Gradients, Gradient Descent",
        topics: {
          "calculus_basic": { name: "Limits, Continuity, Maxima, Minima", keywords: ["limit", "continuity", "derivative", "differentiability", "integral", "maxima", "minima", "taylor series"] },
          "optimization_basic": { name: "Gradient Descent, Constrained Optimization", keywords: ["optimization", "gradient", "convex", "constrained", "lagrangian"] }
        }
      },
      "DS_PROG": {
        name: "Programming & Data Structures",
        icon: "fa-code",
        subtitle: "Python, C, Arrays, Stacks, Trees",
        topics: {
          "prog_logic": { name: "C & Python Programming Basics", keywords: ["python", "c program", "pointer", "array", "printf", "list", "struct", "recursion"] },
          "ds_structures": { name: "Stacks, Queues, Binary Search Trees", keywords: ["linked list", "stack", "queue", "binary tree", "bst", "avl", "hash table"] }
        }
      },
      "DS_ALGO": {
        name: "Algorithms",
        icon: "fa-network-wired",
        subtitle: "Sorting, Greedy, Graph search, DP",
        topics: {
          "searching_sorting": { name: "Searching, Sorting & Complexity Analysis", keywords: ["sorting", "quick sort", "merge sort", "binary search", "comparisons", "complexity", "asymptotic"] },
          "algo_design": { name: "Greedy, Dynamic Programming & Graphs", keywords: ["greedy", "knapsack", "dynamic programming", "matrix chain", "lcs", "bfs", "dfs", "dijkstra"] }
        }
      },
      "DS_DBMS": {
        name: "Database Management (DBMS)",
        icon: "fa-database",
        subtitle: "ER Mapping, SQL, Normal Forms",
        topics: {
          "db_concepts": { name: "ER Model, Normalization & Relational Algebra", keywords: ["normalization", "normal form", "functional dependency", "3nf", "bcnf", "er model", "relationship", "relational mapping"] },
          "db_queries": { name: "SQL Queries (SELECT, JOIN, WHERE)", keywords: ["sql", "select", "where", "group by", "having", "join", "foreign key", "primary key"] }
        }
      },
      "DS_ML": {
        name: "Machine Learning",
        icon: "fa-robot",
        subtitle: "Supervised, Unsupervised, Clustering",
        topics: {
          "supervised": { name: "Linear Regression, Decision Trees, SVM", keywords: ["supervised", "regression", "classification", "decision tree", "svm", "neural network", "overfitting"] },
          "unsupervised": { name: "Clustering, K-Means, PCA, Dimensionality", keywords: ["unsupervised", "clustering", "k-means", "pca", "cross validation"] }
        }
      },
      "DS_AI": {
        name: "Artificial Intelligence",
        icon: "fa-brain",
        subtitle: "Search, Minimax, Predicate Logic",
        topics: {
          "search_strategies": { name: "BFS, DFS, A* & Heuristic Search", keywords: ["bfs", "dfs", "a* search", "heuristic", "minimax", "alpha-beta"] },
          "logic_prob": { name: "Propositional Logic & Bayes Networks", keywords: ["logic", "propositional", "predicate", "bayes network"] }
        }
      }
    }
  };

  // Dynamic Keyword-based PYQ Classifier
  function getTopicQuestions(stream, subjectId, topicId) {
    const subject = SUBJECTS_AND_TOPICS[stream]?.[subjectId];
    if (!subject) return [];
    
    const topic = subject.topics[topicId];
    if (!topic) return [];

    let allQuestions = [];
    
    // Gather all questions in gatePapers for this stream
    if (typeof gatePapers !== "undefined" && gatePapers[stream]) {
      Object.keys(gatePapers[stream]).forEach(yearKey => {
        const paperQs = gatePapers[stream][yearKey];
        if (Array.isArray(paperQs)) {
          paperQs.forEach(q => {
            allQuestions.push({
              ...q,
              yearOrigin: yearKey
            });
          });
        }
      });
    }

    // Filter questions based on keywords or section
    let filtered = [];

    // General Aptitude subject filtering is very specific: section GA only!
    if (subjectId === "APTITUDE") {
      filtered = allQuestions.filter(q => q.section === "GA");
    } else {
      // Filter out GA questions first for other subjects
      allQuestions = allQuestions.filter(q => q.section !== "GA");
    }

    // Filter questions matching topic keywords
    filtered = filtered.concat(allQuestions.filter(q => {
      const qText = (q.question || "").toLowerCase();
      const qExpl = (q.explanation || "").toLowerCase();
      
      // Check if any keyword matches
      return topic.keywords.some(kw => qText.includes(kw) || qExpl.includes(kw));
    }));

    // Remove duplicates
    const seen = new Set();
    filtered = filtered.filter(q => {
      const duplicate = seen.has(q.question);
      seen.add(q.question);
      return !duplicate;
    });

    // Fallback: If filtered count is too small (e.g., < 5), let's pull general questions from the subject
    if (filtered.length < 5) {
      const subKeywords = subjectId.includes("DBMS") ? ["database", "table", "sql", "dependency", "concurrency"]
                         : subjectId.includes("OS") ? ["scheduling", "process", "page", "memory", "deadlock"]
                         : subjectId.includes("CN") ? ["network", "tcp", "ip", "routing", "layer"]
                         : subjectId.includes("DS") ? ["pointer", "tree", "linked list", "array", "recursion", "python"]
                         : subjectId.includes("ALGO") ? ["complexity", "greedy", "sort", "graph", "dp"]
                         : subjectId.includes("TOC") ? ["automata", "dfa", "grammar", "turing", "decidable"]
                         : subjectId.includes("COMPILER") ? ["parsing", "lexical", "compiler", "grammar"]
                         : subjectId.includes("COA") ? ["pipeline", "cache", "instruction", "memory"]
                         : subjectId.includes("DIGITAL") ? ["boolean", "multiplexer", "flip-flop", "logic"]
                         : subjectId.includes("ML") ? ["supervised", "regression", "clustering", "pca", "k-means"]
                         : subjectId.includes("AI") ? ["search", "heuristic", "minimax", "logic"]
                         : ["probability", "matrix", "eigenvalue", "limit", "integral", "expectation"];
      filtered = allQuestions.filter(q => {
        const qText = (q.question || "").toLowerCase();
        return subKeywords.some(kw => qText.includes(kw));
      }).slice(0, 10);
    }

    // Re-index questions sequential for the test array
    return filtered.map((q, idx) => ({
      ...q,
      id: idx + 1
    }));
  }

  function initGfgDashboard() {
    const durationInput = document.getElementById("test-duration-input");
    const subjectContainer = document.getElementById("subject-selection-container");
    const topicsContainer = document.getElementById("topics-selection-container");
    const welcomeCard = document.getElementById("welcome-card");
    const panelPyq = document.getElementById("panel-pyq-papers");
    const panelPlaceholder = document.getElementById("panel-subject-placeholder");
    const backBtn = document.getElementById("back-to-subjects-btn");

    // Dynamic Duration selector changes
    if (durationInput) {
      durationInput.addEventListener("change", (e) => {
        const val = parseInt(e.target.value) || 180;
        state.testDurationMinutes = val;
        
        if (val === 180) {
          // Standard full mock mode
          state.isGfgMode = false;
          if (welcomeCard) welcomeCard.style.display = "block";
          if (subjectContainer) subjectContainer.style.display = "none";
          if (topicsContainer) topicsContainer.style.display = "none";
          if (panelPyq) panelPyq.style.display = "flex";
          if (panelPlaceholder) panelPlaceholder.style.display = "none";
        } else {
          // Subject mock mode
          state.isGfgMode = true;
          if (welcomeCard) welcomeCard.style.display = "block"; // Keep welcome card visible on the left
          if (panelPyq) panelPyq.style.display = "none";
          if (panelPlaceholder) panelPlaceholder.style.display = "none"; // Hide placeholder since subjects are shown directly on the right
          
          // Show the topics explorer if a subject was selected previously; otherwise show subjects list
          if (state.selectedSubject) {
            if (subjectContainer) subjectContainer.style.display = "none";
            if (topicsContainer) topicsContainer.style.display = "flex";
            renderSubjectTopics(state.selectedSubject);
          } else {
            if (subjectContainer) subjectContainer.style.display = "flex";
            if (topicsContainer) topicsContainer.style.display = "none";
            renderSubjectsList();
          }
        }
      });
    }

    // Wire back to subjects button in topics drawer
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        state.selectedSubject = null;
        if (topicsContainer) topicsContainer.style.display = "none";
        if (subjectContainer) subjectContainer.style.display = "flex";
        renderSubjectsList();
      });
    }

    // Default DBMS topics render on startup
    state.selectedSubject = null;
  }

  function renderSubjectsList() {
    const list = document.getElementById("subject-selection-list");
    if (!list) return;

    list.innerHTML = "";
    const stream = state.selectedStream || "CS";
    const subjects = SUBJECTS_AND_TOPICS[stream];
    if (!subjects) return;

    Object.keys(subjects).forEach(subId => {
      const sub = subjects[subId];
      const btn = document.createElement("button");
      btn.className = `subject-item ${state.selectedSubject === subId ? 'active' : ''}`;
      btn.setAttribute("data-subject", subId);
      btn.innerHTML = `
        <i class="subject-icon fa-solid ${sub.icon || 'fa-graduation-cap'}"></i>
        <div class="subject-item-content">
          <span class="subject-item-title">${sub.name}</span>
          <span class="subject-item-subtitle">${sub.subtitle || ''}</span>
        </div>
      `;

      btn.addEventListener("click", () => {
        list.querySelectorAll(".subject-item").forEach(i => i.classList.remove("active"));
        btn.classList.add("active");

        state.selectedSubject = subId;

        // Hide subjects card, show topics card on the right side
        const subjectContainer = document.getElementById("subject-selection-container");
        const topicsContainer = document.getElementById("topics-selection-container");
        if (subjectContainer) subjectContainer.style.display = "none";
        if (topicsContainer) topicsContainer.style.display = "flex";
        adjustRightBoxHeight();

        renderSubjectTopics(subId);
      });

      list.appendChild(btn);
    });
  }

  function renderSubjectTopics(subjectId) {
    const stream = state.selectedStream || "CS";
    const subject = SUBJECTS_AND_TOPICS[stream]?.[subjectId];
    if (!subject) return;

    // Update selected subject label text inside the left topics drawer
    const labelLeft = document.getElementById("selected-subject-label-left");
    if (labelLeft) {
      labelLeft.textContent = subject.name;
    }

    const list = document.getElementById("topics-selection-list");
    if (!list) return;

    list.innerHTML = "";

    // Loop through topics and generate list item cards for the left topics drawer
    Object.keys(subject.topics).forEach(topicId => {
      const topic = subject.topics[topicId];
      
      // Classify and count questions dynamically
      const qCount = getTopicQuestions(stream, subjectId, topicId).length;

      const itemCard = document.createElement("div");
      itemCard.className = "topic-card";
      itemCard.style.padding = "12px";
      itemCard.style.margin = "0";
      itemCard.style.border = "1px solid var(--glass-border)";
      itemCard.style.background = "rgba(255, 255, 255, 0.01)";
      itemCard.style.borderRadius = "var(--border-radius-sm)";
      itemCard.style.display = "flex";
      itemCard.style.flexDirection = "column";
      itemCard.style.gap = "8px";
      itemCard.style.transition = "var(--transition-smooth)";
      
      // Add custom hover style
      itemCard.addEventListener("mouseenter", () => {
        itemCard.style.background = "rgba(139, 92, 246, 0.04)";
        itemCard.style.borderColor = "rgba(139, 92, 246, 0.25)";
        itemCard.style.transform = "translateX(2px)";
      });
      itemCard.addEventListener("mouseleave", () => {
        itemCard.style.background = "rgba(255, 255, 255, 0.01)";
        itemCard.style.borderColor = "var(--glass-border)";
        itemCard.style.transform = "translateX(0)";
      });

      itemCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <span style="font-size: 15px; font-weight: 600; color: var(--text-primary); line-height: 1.4;">${topic.name}</span>
          <span class="badge status-pill-correct" style="font-size: 11px; padding: 2px 6px; white-space: nowrap; font-weight: 700;">PYQ</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 8px; margin-top: 2px;">
          <span style="font-size: 15px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid fa-circle-question" style="color: #34d399;"></i> ${qCount} Questions
          </span>
          <button class="topic-play-btn" type="button" style="padding: 4px 10px; font-size: 13px; font-weight: 700; border-radius: 4px; display: flex; align-items: center; gap: 4px; border: none; height: auto;">
            <i class="fa-solid fa-circle-play" style="font-size: 12px;"></i> Start
          </button>
        </div>
      `;

      // Wire start button click
      const startBtn = itemCard.querySelector(".topic-play-btn");
      if (startBtn) {
        startBtn.addEventListener("click", () => {
          launchTopicQuiz(subjectId, topicId);
        });
      }

      list.appendChild(itemCard);
    });
  }

  function launchTopicQuiz(subjectId, topicId, questionsArray = null) {
    state.isGfgMode = true;
    state.selectedSubject = subjectId;
    state.selectedTopic = topicId;
    state.testDurationMinutes = 60; // Force 1-Hour Subject-wise Quiz Duration!

    // Gather questions
    const stream = state.selectedStream || "CS";
    let finalQs = questionsArray;
    if (!finalQs) {
      finalQs = getTopicQuestions(stream, subjectId, topicId);
    }

    // Ensure we have at least 1 question
    if (finalQs.length === 0) {
      alert("No questions are currently available under this topic in the CS/DS library.");
      return;
    }

    state.questions = finalQs;

    const subject = SUBJECTS_AND_TOPICS[stream]?.[subjectId];
    const topic = subject ? subject.topics[topicId] : null;
    const topicName = topic ? topic.name : "Practice Quiz";

    state.gfgExamTitle = `GATE ${stream} Focused Quiz — ${topicName}`;

    // Seed test duration dropdown with 60 minutes just in case
    const durationInput = document.getElementById("test-duration-input");
    if (durationInput) {
      durationInput.value = "60";
    }

    // Reset declaration checkbox and Ready button
    if (DOM.declarationCheck) {
      DOM.declarationCheck.checked = false;
    }
    if (DOM.startTestBtn) {
      DOM.startTestBtn.disabled = true;
    }

    // Switch view to guidelines instructions first
    updateInstructionsText();
    switchView(DOM.guidelinesView);
  }

  function initializeCustomSelects() {
    const selects = document.querySelectorAll("#setup-card select, #panel-pyq-papers select, #theme-selector");
    
    selects.forEach(select => {
      // Avoid double initialization
      if (select.nextElementSibling && select.nextElementSibling.classList.contains("custom-select")) {
        return;
      }
      
      // Hide the native select
      select.style.display = "none";
      
      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "custom-select";
      wrapper.id = select.id + "-custom";
      
      // Find the icon class from the wrapper sibling if exists
      const iconEl = select.previousElementSibling;
      let iconHtml = "";
      if (iconEl && iconEl.tagName === "I") {
        iconHtml = iconEl.outerHTML;
        iconEl.style.display = "none"; // Hide standard icon to let custom select draw it
      }
      
      // Create trigger
      const trigger = document.createElement("div");
      trigger.className = "custom-select-trigger";
      
      const selectedOption = select.options[select.selectedIndex];
      trigger.innerHTML = `
        ${iconHtml}
        <span class="trigger-label">${selectedOption ? selectedOption.text : ""}</span>
        <i class="fa-solid fa-chevron-down arrow"></i>
      `;
      
      // Create options container
      const optionsContainer = document.createElement("div");
      optionsContainer.className = "custom-options";
      
      // Populate options
      function buildOptions() {
        optionsContainer.innerHTML = "";
        Array.from(select.options).forEach(opt => {
          const optDiv = document.createElement("div");
          optDiv.className = `custom-option ${opt.value === select.value ? "selected" : ""}`;
          optDiv.setAttribute("data-value", opt.value);
          optDiv.textContent = opt.text;
          
          optDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            select.value = opt.value;
            trigger.querySelector(".trigger-label").textContent = opt.text;
            
            // Highlight selected
            optionsContainer.querySelectorAll(".custom-option").forEach(child => {
              child.classList.remove("selected");
            });
            optDiv.classList.add("selected");
            
            // Close select
            wrapper.classList.remove("open");
            
            // Dispatch change event to the native select
            select.dispatchEvent(new Event("change"));
          });
          
          optionsContainer.appendChild(optDiv);
        });
      }
      
      buildOptions();
      
      // Listen to dynamic population changes on year select
      if (select.id === "test-year-input") {
        // Create an observer to rebuild options when native options change
        const observer = new MutationObserver(() => {
          buildOptions();
          const activeOpt = select.options[select.selectedIndex];
          trigger.querySelector(".trigger-label").textContent = activeOpt ? activeOpt.text : "";
        });
        observer.observe(select, { childList: true });
      }
      
      // Open / Close triggers
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        // Close all other open custom selects
        document.querySelectorAll(".custom-select").forEach(el => {
          if (el !== wrapper) el.classList.remove("open");
        });
        wrapper.classList.toggle("open");
      });
      
      wrapper.appendChild(trigger);
      wrapper.appendChild(optionsContainer);
      
      // Insert custom select wrapper after the parent select
      select.insertAdjacentElement("afterend", wrapper);
    });
    
    // Global click listener to close custom selects when clicking outside
    document.addEventListener("click", () => {
      document.querySelectorAll(".custom-select").forEach(wrapper => {
        wrapper.classList.remove("open");
      });
    });
  }

  // RUN APP!
  // init() is invoked by bootApp() after splash/login transition to avoid double binding
  // Do not call init() here.
});
