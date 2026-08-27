# 🚀 Express + TypeScript API Template

Welcome! This repository is your starting point for creating modern APIs with Express, TypeScript, and a polished workflow thanks to Husky. Put on your helmet, because we're going to do awesome things. 🌐🔗
This repository uses PostgreSQL in the docker-compose.yml as the default database.

---

## 📋 Table of Contents

- [Requirements](#-requirements)
- [Installation](#-installation)
- [Available Scripts](#-available-scripts)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🤖 Requirements

- **Node.js** >= v24.0.1
- **yarn** ≥ 4.9.1 (or **npm** ≥ 6)
- Willingness to learn cool stuff

---

## ⚙️ Installation

1. Clone this repository

   ```bash
   git clone https://github.com/gabriez/express-template.git
   ```

2. Install dependencies

   ```bash
   yarn install
   ```

3. Prepare Husky (runs only once when the repo is cloned for the first time)

   ```bash
   yarn prepare
   ```

4. Start in development mode

   ```bash
   yarn dev
   ```

---

## 🛠️ Available Scripts

All useful commands are ready in the `package.json` to automate your workflow:

| Script         | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| `build`        | Compiles TypeScript (`tsc`).                                        |
| `start`        | Runs the compiled app (`node dist/index.js`).                       |
| `dev`          | Starts the server in watch mode (`tsx watch src/index.ts`).         |
| `type-check`   | Runs a check on file types                                          |
| `lint`         | Runs Biome to check linting issues.                                 |
| `lint:fix`     | Runs Biome and automatically fixes lint issues.                     |
| `format`       | Applies Biome formatting to the entire project.                     |
| `format:check` | Applies Biome to check formatting.                                  |
| `check`        | Runs Biome linter, formatter and import organizer.                  |
| `check:fix`    | Runs Biome and automatically fixes issues.                          |
| `prepare`      | Husky hook: installs Git hooks.                                     |
| `test`         | Runs the tests and control vitest from console                      |
| `test:run`     | Runs all tests inside **tests** folder                              |
| `test:ui`      | Runs the tests and display an UI                                    |
| `coverage`     | Runs the test and checks places of the code that hasn't been tested |

---

## 🚀 Quick Start

1. **Development**:

   ```bash
   yarn dev
   ```

   Edit your code and see live changes.

2. **Build and run**:

   ```bash
   yarn build
   yarn start
   ```

3. **Verify linters before committing**:

   ```bash
   git add . && git commit -m "your message"
   ```

   Thanks to Husky, Biome runs automatically before the commit.

---

## 📁 Project Structure

```plaintext
├─ src/
|  |─ __tests__/      # Tests for controllers and middlewares
│  ├─ utils/          # Utilities
│  └─ index.ts        # Application entry point
├─ .husky/            # Git hooks (Husky)
├─ package.json       # Dependencies and scripts
└─ tsconfig.json      # TypeScript configuration
```
