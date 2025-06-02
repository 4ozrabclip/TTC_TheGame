# 🕸 The Code Company: The Game

Built with [Next.js 15](https://nextjs.org), [React 19 (RC)](https://react.dev), and [Yarn Workspaces](https://yarnpkg.com/features/workspaces) as part of a monorepo.

> 📦 Located at: `packages/website`

---

## Getting Started

First, make sure you're at the **root of the monorepo**, and install dependencies using the classic `node_modules` linker (this repo is **not using Plug'n'Play** for compatibility with Next.js and other tools):

```bash
yarn config set nodeLinker node-modules
yarn install
```

Then, to run the development server:
```bash
cd packages/website
yarn dev
```
Open your browser to localhost to view The Game



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
