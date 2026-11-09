# Terminal Portfolio <img src="public/images/Logo.png" width="50px">

[![Netlify Status](https://api.netlify.com/api/v1/badges/c9cce46e-0324-44ba-a696-3c52f6576ddf/deploy-status)](https://app.netlify.com/sites/murfy/deploys)
![MIT license](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)

[Live site](https://charbelfayad.com)

# Stack 📚

![React](https://img.shields.io/badge/-React-61DAFB?style=flat&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat&logo=next.js&logoColor=white)

<br>

![Tailwind CSS](https://img.shields.io/badge/-Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vitest](https://img.shields.io/badge/-Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)

<br>

![PostCSS](https://img.shields.io/badge/-PostCSS-DD3A0A?style=flat&logo=postcss&logoColor=white)
![Netlify](https://img.shields.io/badge/-Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)
![Prettier](https://img.shields.io/badge/-Prettier-F7B93E?style=flat&logo=prettier&logoColor=white)
![ESLint](https://img.shields.io/badge/-ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)

# Develop

```sh
npm ci
npm run dev        # http://localhost:3000
npm test           # Vitest + Testing Library (jsdom)
npm run typecheck
npm run build
```

Content lives in `content/` (profile, projects, papers). Project screenshots in
`public/images/projects/` ship pre-sized (at most 2x the 288px preview width) because the image
optimizer is disabled; `content/content.test.ts` checks their declared dimensions.
