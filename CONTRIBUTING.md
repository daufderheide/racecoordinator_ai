# Contributing to Race Coordinator AI

Welcome! Thank you for your interest in contributing to Race Coordinator AI. We use a **Shared Repository Model** for our development workflow. This means that approved contributors push their branches directly to this repository rather than using forks.

## How to Get Access

If you would like to contribute, you must first be granted **Write** access to this repository.

1. Reach out to the repository owner (either by opening a GitHub Issue or via direct communication).
2. Provide your GitHub username and a brief description of what you'd like to work on.
3. Once approved, you will receive an invitation to join the repository as a Collaborator. **You must accept this email/GitHub invitation before you can push any code.**

*(Note: If you are an external developer and prefer not to request write access, you are still welcome to use the traditional Fork-and-Pull method!)*

## The Contribution Workflow

Once you have accepted your invitation and have Write access, please follow this workflow:

### 1. Clone the Repository
Do not fork the repository. Clone it directly to your machine:
```bash
git clone https://github.com/daufderheide/racecoordinator_ai.git
cd racecoordinator_ai
```

### 2. Create a Branch
Create a new local branch for your work. Branch off **`develop`** for all new features and routine bug fixes, or off **`main`** for urgent production hotfixes.

Your branch **must** start with one of the following prefixes:

* `feature/` (For new features, branched from `develop`)
* `bugfix/` (For bug fixes - **Must include the Issue number**, e.g., `bugfix/123-fix-crash`, branched from `develop`)
* `hotfix/` (For urgent production fixes, branched from `main`)
* `release/` (For beta stabilization branches, e.g., `release/v1.0.0`, branched from `develop`)
* `docs/` (For documentation updates, branched from `develop`)
* `test/` (For adding or updating tests, branched from `develop`)

**Example:**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-telemetry-ui
```

*Note: If your branch name does not match these rules, the GitHub server will reject your `git push` command.*

### 3. Make Changes and Commit
Write your code and ensure relevant tests pass locally.

All commit messages **must** follow [Conventional Commits](https://www.conventionalcommits.org/) standards (enforced by a Git hook):
* `feat:` (New feature, e.g. `feat(phidget): add relay control`)
* `fix:` (Bug fix, e.g. `fix: resolve race day startup timer crash`)
* `refactor:` (Code restructuring without behavior changes)
* `perf:` (Performance optimization)
* `docs:` (Documentation changes)
* `test:` (Adding or correcting tests)
* `chore:` (Maintenance, dependencies, tooling)
* `ci:` (CI/CD workflows and release automation)
* `style:` (Code formatting)
* `build:` (Build scripts and installers)

See [DEVELOPMENT.md](DEVELOPMENT.md#commit-message-conventions--automated-changelogs) for complete details.

### 4. Push Your Branch
Push your branch directly to this repository:
```bash
git push -u origin feature/new-telemetry-ui
```

### 5. Open a Pull Request
Once your work is ready for review:
1. Go to the repository on GitHub.
2. You will see a banner prompting you to open a Pull Request for your recently pushed branch. Click **Compare & pull request**.
3. **Select the base branch:**
   - Set base to **`develop`** for feature, bugfix, docs, and test branches.
   - Set base to **`release/vX.Y.Z`** for fixes targeting an active beta.
   - Set base to **`main`** for hotfix branches.
4. Fill out the PR description with details about your changes.
5. Submit the PR for review.

### 6. Review and Merge
Both the `main` and `develop` branches are protected. You cannot push directly to them. All changes must go through a Pull Request and pass all automated CI status checks (linting, client tests, server tests, visual screendiff tests) before being merged.

For more details on the complete branching strategy and release lifecycles, see [DEVELOPMENT.md](DEVELOPMENT.md).

Thank you for contributing!
