# Terminal Portfolio <img src="public/images/Logo.png" width="50px">

[![Netlify Status](https://api.netlify.com/api/v1/badges/c9cce46e-0324-44ba-a696-3c52f6576ddf/deploy-status)](https://app.netlify.com/sites/murfy/deploys)
![MIT license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)

[Live site](https://charbelfayad.com)

# Stack 📚

![Astro](https://img.shields.io/badge/-Astro-BC52EE?style=flat&logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

<br>

![Vitest](https://img.shields.io/badge/-Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)
![Netlify](https://img.shields.io/badge/-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)
![Prettier](https://img.shields.io/badge/-Prettier-F7B93E?style=flat&logo=prettier&logoColor=white)

Static HTML from Astro, no framework runtime. Pages ship about 2.5 kB of gzipped JS (theme toggle,
terminal launcher, link prefetch, project preview). The terminal and its font load on first open.

# Develop

Node is pinned in `.nvmrc` (`nvm use`).

```sh
npm ci
npm run dev        # http://localhost:4321
npm test           # Vitest + Testing Library; .astro files render through Astro's container API
npm run typecheck  # astro check
npm run build      # static site in dist/
```

Content lives in `content/` (profile, projects, papers). Project screenshots in
`public/images/projects/` ship pre-sized (at most 2x the 288px preview width); `content/content.test.ts`
checks their declared dimensions. Netlify headers and redirects live in `public/_headers` and
`public/_redirects`.

# Résumé

`public/data/resume.pdf` is generated, not edited by hand. Its wording lives in
`scripts/resume/content.ts`; links, projects and papers come from `content/`, so the site and the
résumé stay in sync.

```sh
npm run resume     # writes public/data/resume.pdf
```

Needs Windows with Microsoft Word and the [Inter](https://github.com/rsms/inter/releases) font
installed: Word lays the page out and embeds the font. The script refuses to replace the PDF if
the résumé no longer fits on one A4 page. Tests that drive Word run only on Windows.
