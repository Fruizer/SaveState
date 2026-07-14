'use strict';

function qsModal(selector, root = document) {
  if (!selector) return null;

  const el = root?.querySelector?.(selector);
  return el || null;
}

function normalizeLinks(rawText) {
  return String(rawText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isValidHexColor(value) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || '');
}

function normalizeHexColor(value) {
  const raw = String(value || '').trim();
  if (!isValidHexColor(raw)) return null;

  if (raw.length === 4) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }

  return raw.toLowerCase();
}

function createProjectModal({
  modalSelector = '#project-modal',
  formSelector = '#project-modal-form',
  titleSelector = '#project-modal-title',
  closeSelector = '#project-modal-close',
  cancelSelector = '#project-modal-cancel',
  deleteSelector = '#project-modal-delete',
  saveSelector = '#project-modal-save',
  idSelector = '#project-modal-id',
  accentSelector = '#project-modal-accent',
  accentInputSelector = '#project-modal-accent-input',
  categorySelector = '#project-modal-category',
  nameSelector = '#project-modal-name',
  folderSelector = '#project-modal-folder',
  ideSelector = '#project-modal-ide',
  browserLinksSelector = '#project-modal-browser-links',
} = {}) {
  const modalEl = qsModal(modalSelector);
  const formEl = qsModal(formSelector);
  const titleEl = qsModal(titleSelector);
  const closeBtn = qsModal(closeSelector);
  const cancelBtn = qsModal(cancelSelector);
  const deleteBtn = qsModal(deleteSelector);
  const saveBtn = qsModal(saveSelector);
  const idField = qsModal(idSelector);
  const accentField = qsModal(accentSelector);
  const accentInputField = qsModal(accentInputSelector);
  const categoryField = qsModal(categorySelector);
  const nameField = qsModal(nameSelector);
  const folderField = qsModal(folderSelector);
  const ideField = qsModal(ideSelector);
  const browserLinksField = qsModal(browserLinksSelector);
  const backdrop = qsModal('.overlay-backdrop', modalEl);
  const backBtn = modalEl ? modalEl.querySelector('.wizard-back') : null;
  const wizardSteps = modalEl ? Array.from(modalEl.querySelectorAll('.wizard-step')) : [];
  const progressSteps = modalEl ? Array.from(modalEl.querySelectorAll('.progress-step')) : [];

  if (!modalEl || !formEl) {
    return {
      bind() {},
      openCreate() {},
      openEdit() {},
      close() {},
      clearForm() {},
      fillForm() {},
      readForm() { return {}; },
      getMode: () => 'create',
      getEditingProjectId: () => null,
    };
  }

  let mode = 'create';
  let editingProjectId = null;
  let bound = false;
  let onSave = null;
  let onDelete = null;
  let currentStep = 1;

  function updateWizardUI() {
    if (!modalEl) return;

    wizardSteps.forEach((step, index) => {
      step.classList.toggle('active', index + 1 === currentStep);
    });

    progressSteps.forEach((step, index) => {
      step.classList.toggle('active', index + 1 === currentStep);
    });

    if (backBtn) {
      backBtn.classList.toggle('hidden', currentStep === 1);
    }

    if (saveBtn) {
      saveBtn.textContent = currentStep >= wizardSteps.length ? 'Create Workspace' : 'Next';
    }
  }

  function setStep(stepIndex) {
    if (!wizardSteps.length) return;
    currentStep = Math.min(Math.max(stepIndex, 1), wizardSteps.length);
    updateWizardUI();
  }

  function open() {
    modalEl.classList.remove('hidden');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    setStep(1);
    window.requestAnimationFrame(() => nameField?.focus());
  }

  function close() {
    modalEl.classList.add('hidden');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setStep(1);
  }

  function setAccentColor(colorValue) {
    const normalized = normalizeHexColor(colorValue) || '#4f86ff';
    if (accentField) accentField.value = normalized;
    if (accentInputField) accentInputField.value = normalized.replace('#', '');

    modalEl.querySelectorAll('.accent-option').forEach((option) => {
      const isActive = option.dataset.color?.toLowerCase() === normalized.toLowerCase();
      option.classList.toggle('active', isActive);
    });
  }

  function resetDynamicLists() {
    modalEl.querySelectorAll('.dynamic-list').forEach((list) => {
      const rows = Array.from(list.querySelectorAll('.dynamic-list-row'));
      rows.forEach((row) => row.remove());

      const row = document.createElement('div');
      row.className = 'dynamic-list-row';
      row.innerHTML = `
        <input type="text" class="dynamic-list-input" />
        <button class="dynamic-list-remove" type="button" aria-label="Remove item">×</button>
      `;
      list.appendChild(row);
    });
  }

  function populateDynamicLists(itemsByList) {
    Object.entries(itemsByList || {}).forEach(([key, values]) => {
      const list = modalEl.querySelector(`.dynamic-list[data-list="${key}"]`);
      if (!list) return;

      const rows = Array.from(list.querySelectorAll('.dynamic-list-row'));
      rows.forEach((row) => row.remove());

      const data = Array.isArray(values) && values.length ? values : [''];
      data.forEach((value) => {
        const row = document.createElement('div');
        row.className = 'dynamic-list-row';
        row.innerHTML = `
          <input type="text" class="dynamic-list-input" value="${escapeHtml(value)}" />
          <button class="dynamic-list-remove" type="button" aria-label="Remove item">×</button>
        `;
        list.appendChild(row);
      });
    });
  }

  function clearForm() {
    formEl.reset();
    if (idField) idField.value = '';
    if (categoryField) categoryField.value = 'Coursework';
    setAccentColor('#4f86ff');
    resetDynamicLists();
    
    // Reset switches to default states
    modalEl.querySelectorAll('.component-card .switch input[type="checkbox"]').forEach((cb) => {
      cb.checked = cb.dataset.component === 'hasEditor' || cb.dataset.component === 'hasTerminal';
      cb.closest('.component-card')?.classList.toggle('active', cb.checked);
    });

    mode = 'create';
    editingProjectId = null;
    titleEl.textContent = 'Create Workspace';
    if (saveBtn) saveBtn.textContent = 'Next';
    if (deleteBtn) deleteBtn.classList.add('hidden');
  }

  function fillForm(project) {
    if (!project) return;

    mode = 'edit';
    editingProjectId = project.id || null;

    titleEl.textContent = 'Edit Workspace';
    if (saveBtn) saveBtn.textContent = 'Update Workspace';
    if (deleteBtn) deleteBtn.classList.remove('hidden');

    if (idField) idField.value = project.id || '';
    if (nameField) nameField.value = project.name || '';
    if (folderField) folderField.value = project.folderPath || '';
    if (ideField) ideField.value = project.idePath || ''; // 💡 Will now bind correctly!
    if (categoryField) categoryField.value = project.category || 'Coursework';
    if (accentField) accentField.value = project.accentColor || '#4f86ff';
    if (accentInputField) accentInputField.value = (project.accentColor || '#4f86ff').replace('#', '');
    
    // Restore switch states from saved data
    modalEl.querySelectorAll('.component-card .switch input[type="checkbox"]').forEach((cb) => {
      const prop = cb.dataset.component;
      if (prop) {
        cb.checked = project[prop] !== false;
        if (prop === 'hasBrowser' || prop === 'hasNotes') {
          cb.checked = !!project[prop];
        }
        cb.closest('.component-card')?.classList.toggle('active', cb.checked);
      }
    });

    populateDynamicLists({
      'browser-links': Array.isArray(project.browserLinks) ? project.browserLinks : [],
      notes: Array.isArray(project.notes) ? project.notes : [],
    });
    setAccentColor(project.accentColor || '#4f86ff');
  }


  function openCreate() {
    clearForm();
    open();
  }

  function openEdit(project) {
    clearForm();
    fillForm(project);
    open();
  }

  function readForm() {
    const browserLinks = Array.from(modalEl.querySelectorAll('.dynamic-list[data-list="browser-links"] .dynamic-list-row'))
      .map((row) => row.querySelector('.dynamic-list-input')?.value.trim() || '')
      .filter(Boolean);

    const notes = Array.from(modalEl.querySelectorAll('.dynamic-list[data-list="notes"] .dynamic-list-row'))
      .map((row) => row.querySelector('.dynamic-list-input')?.value.trim() || '')
      .filter(Boolean);

    // Capture checkbox values
    const hasEditor = modalEl.querySelector('[data-component="hasEditor"]')?.checked ?? true;
    const hasTerminal = modalEl.querySelector('[data-component="hasTerminal"]')?.checked ?? true;
    const hasBrowser = modalEl.querySelector('[data-component="hasBrowser"]')?.checked ?? false;
    const hasNotes = modalEl.querySelector('[data-component="hasNotes"]')?.checked ?? false;

    return {
      name: nameField?.value.trim() || '',
      folderPath: folderField?.value.trim() || '',
      idePath: ideField?.value.trim() || '',
      category: categoryField?.value.trim() || 'Coursework',
      accentColor: normalizeHexColor(accentField?.value || accentInputField?.value) || '#4f86ff',
      browserLinks,
      notes,
      hasEditor,
      hasTerminal,
      hasBrowser,
      hasNotes
    };
  }

  function bind({ handleSave, handleDelete } = {}) {
    onSave = typeof handleSave === 'function' ? handleSave : null;
    onDelete = typeof handleDelete === 'function' ? handleDelete : null;

    if (bound) return;
    bound = true;

    formEl.addEventListener('submit', (event) => {
      event.preventDefault();

      if (currentStep < wizardSteps.length) {
        setStep(currentStep + 1);
        return;
      }

      const data = readForm();

      if (!data.name || !data.folderPath) {
        alert('Workspace Name and Project Path are required.');
        return;
      }

      onSave?.({
        mode,
        projectId: editingProjectId,
        data,
      });

      close();
    });

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
          setStep(currentStep - 1);
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (!editingProjectId) return;
        onDelete?.(editingProjectId);
        close();
      });
    }

    modalEl.querySelectorAll('.component-card .switch input[type="checkbox"]').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        const card = toggle.closest('.component-card');
        if (!card) return;

        card.classList.toggle('active', toggle.checked);
      });
    });

    formEl.addEventListener('click', (event) => {
      const addButton = event.target.closest('.dynamic-list-add');
      if (addButton) {
        const list = modalEl.querySelector(`.dynamic-list[data-list="${addButton.dataset.listTarget}"]`);
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'dynamic-list-row';
        row.innerHTML = `
          <input type="text" class="dynamic-list-input" />
          <button class="dynamic-list-remove" type="button" aria-label="Remove item">×</button>
        `;
        list.appendChild(row);
        return;
      }

      const removeButton = event.target.closest('.dynamic-list-remove');
      if (removeButton) {
        const row = removeButton.closest('.dynamic-list-row');
        const list = row?.closest('.dynamic-list');
        if (!row || !list) return;

        const rows = Array.from(list.querySelectorAll('.dynamic-list-row'));
        if (rows.length > 1) {
          row.remove();
        } else {
          const input = row.querySelector('.dynamic-list-input');
          if (input) input.value = '';
        }
      }
    });

    modalEl.querySelectorAll('.accent-option').forEach((option) => {
      option.addEventListener('click', () => {
        setAccentColor(option.dataset.color || '#4f86ff');
      });
    });

    if (accentInputField) {
      accentInputField.addEventListener('input', () => {
        const value = normalizeHexColor(accentInputField.value);
        if (value) {
          setAccentColor(value);
        }
      });
    }

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modalEl.classList.contains('hidden')) {
        close();
      }
    });
  }

  return {
    bind,
    openCreate,
    openEdit,
    close,
    clearForm,
    fillForm,
    readForm,
    getMode: () => mode,
    getEditingProjectId: () => editingProjectId,
  };
}

function initializeProjectWizard() {
  const projectModal = createProjectModal();

  projectModal.bind({
    handleSave: (projectData) => {
      console.log('Saving project:', projectData);
    },
    handleDelete: (id) => {
      console.log('Deleting project:', id);
    },
  });

  return projectModal;
}

if (typeof window !== 'undefined') {
  window.projectModal = initializeProjectWizard();
}