'use strict';

const els = {
  appShell: document.querySelector('.app-shell'),
  navItems: document.querySelectorAll('.nav-item[data-view]'),
  searchInput: document.getElementById('searchInput'),
  newProjectBtn: document.getElementById('newProjectBtn'),

  totalProjects: document.getElementById('totalProjects'),
  launchedToday: document.getElementById('launchedToday'),
  mostUsed: document.getElementById('mostUsed'),
  projectCountBadge: document.getElementById('projectCountBadge'),

  projectsGrid: document.getElementById('projectsGrid'),
  emptyState: document.getElementById('emptyState') || document.querySelector('.empty-state'),

  modal: document.getElementById('project-modal'),
  modalForm: document.getElementById('project-modal-form'),
  modalTitle: document.getElementById('project-modal-title'),
  modalName: document.getElementById('project-modal-name'),
  modalFolder: document.getElementById('project-modal-folder'),
  modalIde: document.getElementById('project-modal-ide'),
  modalBrowserLinks: document.getElementById('project-modal-browser-links'),

  launchView: document.getElementById('launch-sequence-view'),
  launchProjectName: document.getElementById('launch-project-name'),
  readyToWorkBtn: document.getElementById('ready-to-work-btn'),
  launchSteps: Array.from(document.querySelectorAll('#launch-sequence-view .launch-step'))
};

// Global Context State
const state = {
  projects: [],
  filter: '',
  currentView: 'home'
};

let modalModule;
let launchModule;

function init() {
  // Load state from our window scope modules
  state.projects = loadProjects(seedProjects);

  // Initialize modular features
  modalModule = window.projectModal || createProjectModal();
  if (!window.projectModal) {
    window.projectModal = modalModule;
  }
  launchModule = createLaunchSequence();

  bindGlobalEvents();
  
  modalModule.bind({
    handleSave: ({ mode, projectId, data }) => {
      state.projects = upsertProject(state.projects, projectId, data);
      saveProjects(state.projects);
      uiRender();
    },
    handleDelete: (projectId) => {
      const target = state.projects.find(p => p.id === projectId);
      if (!target) return;
      
      if (confirm(`Delete "${target.name}"?`)) {
        state.projects = deleteProject(state.projects, projectId);
        saveProjects(state.projects);
        uiRender();
      }
    }
  });

  uiRender();
}

function bindGlobalEvents() {
  // View Controller Link Switcher
  els.navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.view;
      els.navItems.forEach(i => i.classList.toggle('active', i === btn));
      
      document.querySelectorAll('[data-view-panel]').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.viewPanel !== state.currentView);
      });
    });
  });

  // Search filter
  els.searchInput.addEventListener('input', () => {
    state.filter = els.searchInput.value;
    uiRender();
  });

  // Trigger modal creation
  els.newProjectBtn.addEventListener('click', () => {
    modalModule.openCreate();
  });

  // Handle Event Delegation inside dynamic grid links
  els.projectsGrid.addEventListener('click', (event) => {
    const menuToggle = event.target.closest('.menu-toggle');
    const menuAction = event.target.closest('.card-menu button[data-action]');
    const launchBtn = event.target.closest('.launch-btn');

    const getCardProject = (targetEl) => {
      const card = targetEl.closest('.project-card');
      return state.projects.find((p) => p.id === card?.dataset.projectId);
    };

    if (menuToggle) {
      event.stopPropagation();
      const menu = menuToggle.closest('.menu-wrap')?.querySelector('.card-menu');
      const isOpen = menu?.classList.contains('open');
      closeAllMenus();
      if (menu && !isOpen) {
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    if (menuAction) {
      const project = getCardProject(menuAction);
      const action = menuAction.dataset.action;
      closeAllMenus();

      if (!project) return;
      if (action === 'edit') modalModule.openEdit(project);
      if (action === 'delete') {
        if (confirm(`Delete "${project.name}"?`)) {
          state.projects = deleteProject(state.projects, project.id);
          saveProjects(state.projects);
          uiRender();
        }
      }
      if (action === 'duplicate') {
        state.projects = duplicateProject(state.projects, project.id);
        saveProjects(state.projects);
        uiRender();
      }
      return;
    }

    if (launchBtn) {
      const project = getCardProject(launchBtn);
      if (project) {
        closeAllMenus();
        launchModule.run(project);
        
        state.projects = markProjectLaunched(state.projects, project.id);
        saveProjects(state.projects);
        uiRender();
      }
    }
  });

  document.addEventListener('click', () => closeAllMenus());
}

function closeAllMenus() {
  document.querySelectorAll('.card-menu.open').forEach((menu) => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('.menu-toggle[aria-expanded="true"]').forEach((toggle) => {
    toggle.setAttribute('aria-expanded', 'false');
  });
}

function uiRender() {
  const visible = getFilteredProjects(state.projects, state.filter);
  
  renderDashboard({
    projects: visible,
    gridEl: els.projectsGrid,
    emptyEl: els.emptyState,
    badgeEl: els.projectCountBadge,
    totalEl: els.totalProjects,
    launchedEl: els.launchedToday,
    usedEl: els.mostUsed
  });
}

// Fire application launch sequence
init();