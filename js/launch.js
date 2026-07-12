'use strict';

function qsLaunch(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`SaveState launch: missing element "${selector}"`);
  return el;
}

function qsaLaunch(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function setStepIndicator(stepEl, state) {
  const indicator = stepEl.querySelector('.launch-step-indicator');
  if (!indicator) return;

  if (state === 'pending') indicator.textContent = '○';
  if (state === 'active') indicator.textContent = '⟳';
  if (state === 'complete') indicator.textContent = '✓';
}

function setStepState(stepEl, state) {
  stepEl.classList.remove('pending', 'active', 'complete');
  stepEl.classList.add(state);
  setStepIndicator(stepEl, state);
}

function createLaunchSequence({
  appShellSelector = '.app-shell',
  launchViewSelector = '#launch-sequence-view',
  projectNameSelector = '#launch-project-name',
  readyButtonSelector = '#ready-to-work-btn',
  stepSelector = '.launch-step',
} = {}) {
  const appShell = document.querySelector(appShellSelector);
  const launchView = qsLaunch(launchViewSelector);
  const projectNameEl = qsLaunch(projectNameSelector);
  const readyButton = qsLaunch(readyButtonSelector);
  const stepEls = qsaLaunch(stepSelector, launchView);

  const state = {
    timers: [],
    isRunning: false,
    currentProject: null,
  };

  function clearTimers() {
    state.timers.forEach((timerId) => clearTimeout(timerId));
    state.timers = [];
  }

  function resetSteps() {
    stepEls.forEach((stepEl) => setStepState(stepEl, 'pending'));
    readyButton.classList.add('hidden');
  }

  function open() {
    if (appShell) appShell.classList.add('hidden');
    launchView.classList.remove('hidden');
    launchView.setAttribute('aria-hidden', 'false');
  }

  function close() {
    clearTimers();
    state.isRunning = false;
    state.currentProject = null;
    resetSteps();
    launchView.classList.add('hidden');
    launchView.setAttribute('aria-hidden', 'true');
    if (appShell) appShell.classList.remove('hidden');
  }

  function run(project) {
    if (!project) return;

    clearTimers();
    resetSteps();

    state.isRunning = true;
    state.currentProject = project;

    open();
    projectNameEl.textContent = `Launching ${project.name}`;

    const stepOrder = [
      { index: 0, label: 'Code Editor' },
      { index: 1, label: 'Terminal Environment' },
      { index: 2, label: 'Browser Context' },
    ];

    const stepDelay = 1000;
    let currentIndex = 0;

    const advance = () => {
      if (currentIndex >= stepOrder.length) {
        state.isRunning = false;
        readyButton.classList.remove('hidden');
        return;
      }

      const { index } = stepOrder[currentIndex];
      const stepEl = stepEls[index];
      if (!stepEl) return;

      setStepState(stepEl, 'active');

      state.timers.push(
        setTimeout(() => {
          setStepState(stepEl, 'complete');
          currentIndex += 1;
          advance();
        }, stepDelay)
      );
    };

    advance();
  }

  function bindReadyButton() {
    readyButton.addEventListener('click', () => {
      close();
    });
  }

  bindReadyButton();

  return {
    run,
    open,
    close,
    reset: close,
    isRunning: () => state.isRunning,
    getCurrentProject: () => state.currentProject,
  };
}