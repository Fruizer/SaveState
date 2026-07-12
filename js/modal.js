'use strict';

function qsModal(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`SaveState modal: missing element "${selector}"`);
  return el;
}

function normalizeLinks(rawText) {
  return String(rawText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
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
  const nameField = qsModal(nameSelector);
  const folderField = qsModal(folderSelector);
  const ideField = qsModal(ideSelector);
  const browserLinksField = qsModal(browserLinksSelector);
  const backdrop = qsModal('.overlay-backdrop', modalEl);

  let mode = 'create';
  let editingProjectId = null;
  let bound = false;
  let onSave = null;
  let onDelete = null;

  function open() {
    modalEl.classList.remove('hidden');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.requestAnimationFrame(() => nameField.focus());
  }

  function close() {
    modalEl.classList.add('hidden');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function clearForm() {
    formEl.reset();
    idField.value = '';
    mode = 'create';
    editingProjectId = null;
    titleEl.textContent = 'Create Project';
    saveBtn.textContent = 'Save Project';
    deleteBtn.classList.add('hidden');
  }

  function fillForm(project) {
    if (!project) return;

    mode = 'edit';
    editingProjectId = project.id || null;

    titleEl.textContent = 'Edit Project';
    saveBtn.textContent = 'Update Project';
    deleteBtn.classList.remove('hidden');

    idField.value = project.id || '';
    nameField.value = project.name || '';
    folderField.value = project.folderPath || '';
    ideField.value = project.idePath || '';
    browserLinksField.value = Array.isArray(project.browserLinks)
      ? project.browserLinks.join('\n')
      : '';
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
    return {
      name: nameField.value.trim(),
      folderPath: folderField.value.trim(),
      idePath: ideField.value.trim(),
      browserLinks: normalizeLinks(browserLinksField.value),
    };
  }

  function bind({ handleSave, handleDelete } = {}) {
    onSave = typeof handleSave === 'function' ? handleSave : null;
    onDelete = typeof handleDelete === 'function' ? handleDelete : null;

    if (bound) return;
    bound = true;

    formEl.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = readForm();

      if (!data.name || !data.folderPath || !data.idePath) {
        alert('Project Name, Project Folder, and IDE Path are required.');
        return;
      }

      onSave?.({
        mode,
        projectId: editingProjectId,
        data,
      });

      close();
    });

    deleteBtn.addEventListener('click', () => {
      if (!editingProjectId) return;
      onDelete?.(editingProjectId);
      close();
    });

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