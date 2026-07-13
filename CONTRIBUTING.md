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
Create a new local branch for your work. We have strict branch naming conventions enforced by the server. Your branch **must** start with one of the following prefixes:

* `feature/` (For new features)
* `bugfix/` (For bug fixes - **Must include the Issue number**, e.g., `bugfix/123-fix-crash`)
* `hotfix/` (For urgent production fixes)
* `docs/` (For documentation updates)
* `test/` (For adding or updating tests)

**Example:**
```bash
git checkout -b feature/new-telemetry-ui
```

*Note: If your branch name does not match these rules, the GitHub server will reject your `git push` command.*

### 3. Make Changes and Commit
Write your code, ensure any relevant tests pass, and commit your changes with clear, descriptive commit messages.

### 4. Push Your Branch
Push your branch directly to this repository:
```bash
git push -u origin feature/new-telemetry-ui
```

### 5. Open a Pull Request
Once your work is ready for review:
1. Go to the repository on GitHub.
2. You will see a banner prompting you to open a Pull Request for your recently pushed branch. Click **Compare & pull request**.
3. Ensure the base branch is set to `main` (or the appropriate release branch).
4. Fill out the PR description with details about your changes.
5. Submit the PR for review.

### 6. Review and Merge
The `main` branch is protected. You cannot push directly to it. All changes must go through a Pull Request and pass any required status checks or reviews before a repository administrator merges it.

Thank you for contributing!
