function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFilteredProjects(projects, query) {
  const q = query.trim().toLowerCase();
  if (!q) return projects;

  return projects.filter((project) => {
    const haystack = [
      project.name,
      project.folderPath,
      project.idePath,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

function getDashboardStats(projects) {
  const totalProjects = projects.length;
  const launchedToday = projects.filter((project) => project.launchedToday).length;

  const mostUsedProject = projects.reduce((top, project) => {
    if (!top) return project;
    return project.usageCount > top.usageCount ? project : top;
  }, null);

  return {
    totalProjects,
    launchedToday,
    mostUsed: mostUsedProject ? mostUsedProject.name : "—",
  };
}

function renderDashboard({ projects, gridEl, emptyEl, badgeEl, totalEl, launchedEl, usedEl }) {
  const stats = getDashboardStats(projects);

  totalEl.textContent = stats.totalProjects;
  launchedEl.textContent = stats.launchedToday;
  usedEl.textContent = stats.mostUsed;
  badgeEl.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;

  gridEl.innerHTML = "";

  if (projects.length === 0) {
    if (emptyEl) {
      emptyEl.classList.remove("hidden");
      gridEl.appendChild(emptyEl);
    }
    return;
  }

  if (emptyEl) emptyEl.classList.add("hidden");

  const fragment = document.createDocumentFragment();

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.projectId = project.id;
    card.style.setProperty("--project-accent", project.accentColor || "#4f86ff");

    card.innerHTML = `
      <div class="card-top-row">
        <div class="project-text-block">
          <h3 class="project-title">${escapeHtml(project.name)}</h3>
          <p class="project-description">${escapeHtml(project.description || project.folderPath)}</p>
        </div>
        <div class="category-badge">${escapeHtml(project.category || 'Workspace')}</div>
      </div>

      <div class="component-indicators">
        ${project.hasEditor !== false ? `
        <div class="comp-chip code" title="Code Editor">
          <img src="assets/code-xml.svg" alt="Code" class="custom-icon" />
        </div>` : ''}
        
        ${project.hasBrowser ? `
        <div class="comp-chip web" title="Browser Context">
          <img src="assets/globe.svg" alt="Web" class="custom-icon" />
        </div>` : ''}

        ${project.hasTerminal !== false ? `
        <div class="comp-chip term" title="Terminal">
          <img src="assets/terminal.svg" alt="Terminal" class="custom-icon" />
        </div>` : ''}

        ${project.hasNotes ? `
        <div class="comp-chip notes" title="Notes">
          <img src="assets/sticky-note.svg" alt="Notes" class="custom-icon" />
        </div>` : ''}
      </div>

      <div class="history-row">
        <span style="display: flex; align-items: center; gap: 8px;">
          <img src="assets/calendar-days.svg" alt="Calendar" class="custom-icon text-icon" />
          Last Launch
        </span>
        <span>Just now</span>
      </div>

      <div class="action-row">
        <button class="launch-btn" type="button" data-action="launch">
          ▶ Launch
        </button>
        <div class="menu-wrap">
          <button class="menu-toggle" type="button" aria-label="Project actions" aria-expanded="false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
          </button>
          <div class="card-menu" role="menu" aria-hidden="true">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="duplicate">Duplicate</button>
            <button type="button" data-action="delete" class="danger">Delete</button>
          </div>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  gridEl.appendChild(fragment);
}