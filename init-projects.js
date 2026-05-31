const fs = require('fs');
const path = require('path');

// Hardcoded details extracted from projects.html
const projectsInfo = [
  {
    slug: 'awr-hq-fitout',
    title: 'AWR DEVELOPMENTS HQ Fitout',
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: 'AWR Developments',
    year: '2024',
    featured: true, // It was in the homepage
    imageDir: 'AWR DEVELOPMENTS HQ Fitout'
  },
  {
    slug: 'ahmed-shah-apartment',
    title: 'AHMED SHAH APARTMENT',
    category: 'residential',
    type_label: 'Residential',
    location: 'Dhaka, Bangladesh',
    client: 'Private Owner',
    year: '2024',
    featured: false,
    imageDir: 'AHMED SHAH APARTMENT'
  },
  {
    slug: 'busy-beans',
    title: 'BUSY BEANS',
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: 'Busy Beans Cafe',
    year: '2024',
    featured: false,
    imageDir: 'BUSY BEANS'
  },
  {
    slug: 'ds-bistro',
    title: "D'S BISTRO",
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: "D's Bistro",
    year: '2024',
    featured: false,
    imageDir: "D'S BISTRO"
  },
  {
    slug: 'nikkei',
    title: 'NIKKEI',
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: 'Nikkei Restaurant',
    year: '2024',
    featured: false,
    imageDir: 'NIKKEI'
  },
  {
    slug: 'yeakin-polimer-limited',
    title: 'Yeakin Polimer Limited',
    category: 'residential',
    type_label: 'Residential',
    location: 'Dhaka, Bangladesh',
    client: 'Yeakin Polymer Ltd.',
    year: '2024',
    featured: false,
    imageDir: 'Yeakin Polymer'
  },
  {
    slug: 'captains',
    title: "Captain's World Interior Fitout",
    category: 'interior',
    type_label: 'Interior Fitout',
    location: 'Dhaka, Bangladesh',
    client: "Captain's World",
    year: '2024',
    featured: false,
    imageDir: 'Captains World'
  },
  {
    slug: 'tarka',
    title: 'Tarka',
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: 'Tarka Restaurant',
    year: '2024',
    featured: false,
    imageDir: 'tarka'
  },
  {
    slug: 'united-cafe',
    title: 'United Cafe',
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: 'United Cafe',
    year: '2024',
    featured: false,
    imageDir: 'united cafe'
  },
  {
    slug: 'uk-bangla-hq',
    title: 'UK BANGLA HQ',
    category: 'interior',
    type_label: 'Interior',
    location: 'Dhaka, Bangladesh',
    client: 'UK Bangla Group',
    year: '2024',
    featured: false,
    imageDir: 'UK BANGLA HQ'
  }
];

const imagesBasePath = path.join(__dirname, 'assets', 'images');
const projectsFolder = path.join(__dirname, '_projects');

if (!fs.existsSync(projectsFolder)) {
  fs.mkdirSync(projectsFolder, { recursive: true });
}

projectsInfo.forEach(p => {
  const targetMdPath = path.join(projectsFolder, `${p.slug}.md`);
  if (fs.existsSync(targetMdPath)) {
    console.log(`Skipping: ${p.slug}.md already exists.`);
    return;
  }

  const projectDir = path.join(imagesBasePath, p.imageDir);
  if (!fs.existsSync(projectDir)) {
    console.warn(`Warning: Image directory not found: ${projectDir}`);
    // Create simple skeleton
    createMarkdownFile(targetMdPath, p, `/assets/images/Hero.jpg`, [], null);
    return;
  }

  // Scan files in directory
  const files = fs.readdirSync(projectDir);
  let featuredImage = '';
  const galleryImages = [];
  let technicalDoc = null;

  files.forEach(file => {
    const filePath = path.join(projectDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      const lowerFile = file.toLowerCase();
      // Skip systemic files
      if (lowerFile === '.ds_store' || lowerFile === 'thumbs.db') return;
      // Skip non-images
      if (!/\.(jpe?g|png|webp|gif)$/i.test(lowerFile)) return;

      const publicPath = `/assets/images/${p.imageDir}/${file}`;
      if (lowerFile.includes('cover')) {
        featuredImage = publicPath;
      } else {
        galleryImages.push(publicPath);
      }
    } else if (stat.isDirectory() && file.toLowerCase() === 'plan') {
      // Check PLAN directory
      const planFiles = fs.readdirSync(filePath);
      const firstPlan = planFiles.find(f => /\.(jpe?g|png|webp)$/i.test(f));
      if (firstPlan) {
        technicalDoc = `/assets/images/${p.imageDir}/PLAN/${firstPlan}`;
      }
    }
  });

  // If no cover image found, use the first image in the gallery as cover
  if (!featuredImage) {
    if (galleryImages.length > 0) {
      featuredImage = galleryImages.shift(); // take the first one
    } else {
      featuredImage = `/assets/images/Hero.jpg`; // global fallback
    }
  }

  // Sort gallery images alphabetically so they are in order
  galleryImages.sort();

  createMarkdownFile(targetMdPath, p, featuredImage, galleryImages, technicalDoc);
});

function createMarkdownFile(targetPath, project, featuredImage, gallery, technicalDoc) {
  let content = `---
title: "${project.title}"
category: "${project.category}"
featured: ${project.featured}
client: "${project.client}"
location: "${project.location}"
year: "${project.year}"
type_label: "${project.type_label}"
featured_image: "${featuredImage}"
project_gallery:
`;

  gallery.forEach(img => {
    content += `  - image: "${img}"\n`;
  });

  if (technicalDoc) {
    content += `technical_document: "${technicalDoc}"\n`;
  }
  content += `---\n\n`;
  content += `Designed with spatial clarity and premium materials, ${project.title} exemplifies WHITE Design Solutions' commitment to architectural permanence and uncompromising quality. Every line and form is refined to command attention and provide lasting value.`;

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Generated: ${path.basename(targetPath)}`);
}

console.log('Project initialization completed!');
