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

    card.innerHTML = `
      <div class="project-header">
        <div>
          <h3 class="project-title">${escapeHtml(project.name)}</h3>
        </div>

        <div class="menu-wrap">
          <button class="menu-toggle" type="button" aria-label="Project actions" aria-expanded="false">⋮</button>
          <div class="card-menu" role="menu" aria-hidden="true">
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="duplicate">Duplicate</button>
            <button type="button" data-action="delete" class="danger">Delete</button>
          </div>
        </div>
      </div>

      <p class="project-folder">${escapeHtml(project.folderPath)}</p>

      <button class="launch-btn" type="button" data-action="launch">
        Launch Workspace
      </button>
    `;

    fragment.appendChild(card);
  });

  gridEl.appendChild(fragment);
}