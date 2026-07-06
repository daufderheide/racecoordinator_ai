# Race Coordinator AI Development Guide

This guide provides instructions for setting up your environment and running the Race Coordinator AI application on Windows and macOS from the source code.

If you encounter any problems with the steps in this document or with Race Coordinator AI itself, please report them by creating an issue on [GitHub](https://github.com/daufderheide/racecoordinator_ai/issues).

> [!NOTE]
If you follow these steps correctly, you should not need to prompt the AI to do anything for you.  If any of these steps fail, you can ask the AI to fix the issues, however we'd also appreciate a bug report on what went wrong so we can fix the problem for the next user.

> [!NOTE] 
System requirements to build and run Race Coordinator AI from source code will be higher than what is required to run the release version.  Specifically, you will need to install more software and configure your environment. It requires a somewhat modern computer with a good amount of RAM (16GB recommended) and a fast internet connection to download dependencies.  You will also need a good deal of disk space.  

---

## Windows

### Step 1: Install Google Antigravity IDE

Please install **Google Antigravity IDE** from the official product page:
- [Google Antigravity IDE Product Page](https://antigravity.google/product/antigravity-ide) *

*\* Note: Ensure you download the **IDE version** specifically, rather than any command-line tool or standalone extension.*

### Step 2: Create a GitHub Account

To collaborate and sync repository changes, you need a GitHub account. Follow these steps:
1. Go to [GitHub](https://github.com/).
2. Click the **Sign up** button in the upper-right corner.
3. Enter your email address, create a strong password, and choose a unique username.
4. Complete the security verification puzzle.
5. Verify your email address using the code sent to your inbox.
6. Choose a plan (the free plan is sufficient for development and beta testing).

> [!IMPORTANT]
> **Everything after Step 2** (including cloning, running dependencies, and launching the client/server) will be done directly inside the **Google Antigravity IDE**.

---

### Beta Testers

As a beta tester, you will clone the repository, install the dependencies, and run both the client and server locally on your system from the main developement branch (currently just main).

> [!WARNING]
> Because you are cloning the repository directly, you will not have permissions to push changes back to it. As such, you should not make any local changes to the code, as you will be unable to update the remote repository with them.

#### 1. Clone the Repository
Once you have your GitHub account set up, clone the repository to your local machine:
1. **Launch the Google Antigravity IDE**.
2. **Open the Terminal** within the IDE. You can find the terminal by:
   - Clicking on **Terminal** in the top menu bar and selecting **New Terminal**, or
   - Pressing the keyboard shortcut key: ``Ctrl + ` `` (control + backtick).
3. **Create and enter a directory** where you want to store your development projects. For example, run these commands to create and switch to a folder named `dev`:
   ```bash
   mkdir dev
   cd dev
   ```
4. Run the following command in that terminal to clone the project:
   ```bash
   git clone https://github.com/daufderheide/racecoordinator_ai.git
   ```
5. In the IDE, open the newly cloned project folder by going to **File -> Open Folder...** and selecting the `racecoordinator_ai` folder (located inside your `dev` directory).
6. Open a new terminal inside the IDE (which will now point directly to the project root directory).

#### 2. Dependencies and Installation
All required dependencies are installed automatically by the application's build and run scripts. You do not need to manually install, configure, or set up any databases, packages, or third-party dependencies on your machine.

#### 3. Building and Running the Application
To run the application, you need to start both the Java backend server and the Angular frontend client. We provide PowerShell scripts to streamline this.

> [!IMPORTANT]
> As a beta tester, there are only 3 commands you will ever need to run, and in general they should be run in this order:
> 1. `git pull` -- syncs your local codebase to the absolute latest version on GitHub.
> 2. `.\run_server_headless.ps1` -- installs dependencies, builds, and starts the server on port 7070
> 3. `.\run_client.ps1` -- installs dependencies, builds, and starts the client on port 4200

##### Update the Codebase
Before starting the server and client, it is highly recommended to update your local codebase with the latest changes.
1. Open a terminal tab inside the Google Antigravity IDE.
2. Run the following command:
   ```powershell
   git pull
   ```

##### Run the Headless Server
The server manages the application logic, databases, and connection ports.
1. Open a terminal tab inside the Google Antigravity IDE (by default this will be a PowerShell terminal on Windows).
2. Run the server headless script:
   ```powershell
   .\run_server_headless.ps1
   ```
   *(This script: [run_server_headless.ps1](run_server_headless.ps1))*
3. On first run it will automatically configure Java (if already installed), download and install Maven (if not found), install server dependencies, build the server, and start it on port 7070.
4. Wait for the terminal to print `MongoDB is ready.` and `Server started.`

##### Run the Client
The client provides the web-based user interface.
1. Open a **second** terminal tab in the IDE (click the `+` button in the terminal panel).
2. Run the client script:
   ```powershell
   .\run_client.ps1
   ```
   *(This script: [run_client.ps1](run_client.ps1))*
3. On first run, it will automatically download and install dependencies (`npm install`), compile Protobuf schemas, and launch the dev server.
4. Once running, access the user interface in your browser at:
   - [http://localhost:4200](http://localhost:4200)

---

### Developers

> [!NOTE]
> **TODO**: Add instructions for contributing code, running tests, writing code, and code formatting rules.  This will require forking the repository and doing pull requests.

---

## macOS

> [!NOTE]
> **TODO**: Add macOS setup and development instructions.
