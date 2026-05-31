const fs = require('fs');
const path = require('path');

// Simple YAML frontmatter parser
function parseFrontMatter(content) {
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) return { meta: {}, body: content };
  const yamlSection = match[1];
  const body = content.replace(/^---([\s\S]*?)---/, '').trim();
  
  const meta = {};
  const lines = yamlSection.split('\n');
  let currentKey = null;
  let currentArray = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('-') && currentArray) {
      let val = trimmed.slice(1).trim();
      val = val.replace(/^["']|["']$/g, '');
      
      if (val.includes(':')) {
        const parts = val.split(':');
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim().replace(/^["']|["']$/g, '');
        currentArray.push({ [k]: v });
      } else {
        currentArray.push(val);
      }
      return;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > -1) {
      const key = trimmed.slice(0, colonIdx).trim();
      let value = trimmed.slice(colonIdx + 1).trim();
      
      if (!value) {
        currentKey = key;
        currentArray = [];
        meta[key] = currentArray;
      } else {
        value = value.replace(/^["']|["']$/g, '');
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        
        meta[key] = value;
        currentKey = null;
        currentArray = null;
      }
    }
  });

  return { meta, body };
}

const projectsDir = path.join(__dirname, '_projects');
const files = fs.readdirSync(projectsDir);
const projects = [];

files.forEach(file => {
  if (!file.endsWith('.md') || file === 'sample-project.md') return;
  const filePath = path.join(projectsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const slug = path.basename(file, '.md');
  const { meta } = parseFrontMatter(content);
  projects.push({ slug, meta });
});

// Sort projects. We want a predictable order.
// Let's sort: featured first, then by year desc, then alphabetically by slug.
projects.sort((a, b) => {
  // Sort by year descending
  const yearA = parseInt(a.meta.year) || 0;
  const yearB = parseInt(b.meta.year) || 0;
  if (yearB !== yearA) return yearB - yearA;

  // Keep original sorting precedence: kolis-dream, dar-al-sukoon, awr-hq-fitout, 138-east...
  const order = [
    'kolis-dream', 'dar-al-sukoon', 'awr-hq-fitout', '138-east',
    'ahmed-shah-apartment', 'busy-beans', 'ds-bistro', 'nikkei',
    'yeakin-polimer-limited', 'captains', 'tarka', 'united-cafe', 'uk-bangla-hq'
  ];
  const idxA = order.indexOf(a.slug);
  const idxB = order.indexOf(b.slug);

  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;

  return a.slug.localeCompare(b.slug);
});

console.log(`Loaded and sorted ${projects.length} projects.`);

// Generate Homepage Featured Grid
const featuredProjects = projects.filter(p => p.meta.featured === true);
let featuredHtml = '      <!-- FEATURED_PROJECTS_START -->\n';
featuredProjects.forEach((p, idx) => {
  featuredHtml += `      <!-- Project ${idx + 1} -->
      <article class="project-card reveal" onclick="window.location.href='project.html?p=${p.slug}'">
        <div class="project-card__image-wrapper">
          <img src="${p.meta.featured_image}" alt="${p.meta.title} - ${p.meta.type_label || 'Project'}"
            class="project-card__image" loading="lazy" />
        </div>
        <div class="project-card__meta">
          <div>
            <h3 class="project-card__title heading-md">${p.meta.title}</h3>
            <p class="project-card__category label-caps">${p.meta.type_label || 'Residential'} / ${p.meta.year || '2024'}</p>
          </div>
        </div>
      </article>\n`;
});
featuredHtml += '      <!-- FEATURED_PROJECTS_END -->';

// Generate Projects list Grid
let projectsListHtml = '        <!-- PROJECTS_GRID_START -->\n';
projects.forEach((p, idx) => {
  projectsListHtml += `        <!-- Project ${idx + 1} -->
        <article class="project-card-all reveal" data-category="${p.meta.category || 'residential'}" onclick="window.location.href='project.html?p=${p.slug}'">
          <div class="project-card-all__image-wrapper">
            <img src="${p.meta.featured_image}" alt="${p.meta.title}" class="project-card-all__image" loading="lazy" />
          </div>
          <div class="project-card-all__meta">
            <div>
              <h3 class="project-card-all__title heading-md">${p.meta.title}</h3>
              <p class="project-card-all__category label-caps">${p.meta.type_label || 'Residential'} / ${p.meta.year || '2024'}</p>
            </div>
          </div>
        </article>\n`;
});
projectsListHtml += '        <!-- PROJECTS_GRID_END -->';

// Update index.html
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  const indexRegex = /<!-- FEATURED_PROJECTS_START -->[\s\S]*?<!-- FEATURED_PROJECTS_END -->/;
  if (indexRegex.test(indexContent)) {
    indexContent = indexContent.replace(indexRegex, featuredHtml);
    fs.writeFileSync(indexHtmlPath, indexContent, 'utf8');
    console.log('Successfully updated index.html with featured projects.');
  } else {
    console.error('Error: Could not find FEATURED_PROJECTS comment markers in index.html.');
  }
}

// Update projects.html
const projectsHtmlPath = path.join(__dirname, 'projects.html');
if (fs.existsSync(projectsHtmlPath)) {
  let projectsContent = fs.readFileSync(projectsHtmlPath, 'utf8');
  const projectsRegex = /<!-- PROJECTS_GRID_START -->[\s\S]*?<!-- PROJECTS_GRID_END -->/;
  if (projectsRegex.test(projectsContent)) {
    projectsContent = projectsContent.replace(projectsRegex, projectsListHtml);
    fs.writeFileSync(projectsHtmlPath, projectsContent, 'utf8');
    console.log('Successfully updated projects.html with all projects.');
  } else {
    console.error('Error: Could not find PROJECTS_GRID comment markers in projects.html.');
  }
}

console.log('Website build process completed successfully!');
