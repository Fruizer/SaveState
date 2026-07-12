const STORAGE_KEY = "savestate.projects.v1";

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function nowISO() {
  return new Date().toISOString();
}

function loadProjects(seedProjects = []) {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const seed = clone(seedProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(seedProjects);
  } catch {
    const seed = clone(seedProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function createProject(payload) {
  return {
    id: crypto.randomUUID(),
    name: "",
    folderPath: "",
    idePath: "",
    browserLinks: [],
    usageCount: 0,
    launchedToday: false,
    lastLaunchedAt: null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    ...payload,
  };
}

function upsertProject(projects, projectId, payload) {
  if (!projectId) {
    return [createProject(payload), ...projects];
  }

  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          ...payload,
          updatedAt: nowISO(),
        }
      : project
  );
}

function deleteProject(projects, projectId) {
  return projects.filter((project) => project.id !== projectId);
}

function duplicateProject(projects, projectId) {
  const source = projects.find((project) => project.id === projectId);
  if (!source) return projects;

  const copy = {
    ...clone(source),
    id: crypto.randomUUID(),
    name: `${source.name} Copy`,
    usageCount: 0,
    launchedToday: false,
    lastLaunchedAt: null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  return [copy, ...projects];
}

function markProjectLaunched(projects, projectId) {
  return projects.map((project) =>
    project.id === projectId
      ? {
          ...project,
          usageCount: (Number(project.usageCount) || 0) + 1,
          launchedToday: true,
          lastLaunchedAt: nowISO(),
          updatedAt: nowISO(),
        }
      : project
  );
}