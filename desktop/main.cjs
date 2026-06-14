const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");

const isDev = !app.isPackaged;
const DEV_URL = process.env.READSHELF_DEV_URL || "http://127.0.0.1:3000";
const DESKTOP_PORT = Number.parseInt(process.env.READSHELF_PORT || "38472", 10);

let serverProcess = null;
let mainWindow = null;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    fs.appendFileSync(path.join(app.getPath("userData"), "readshelf.log"), line);
  } catch {
    /* ignore logging failures */
  }
}

function showStartupError(message) {
  log(message);
  dialog.showErrorBox(
    "ReadShelf could not start",
    `${message}\n\nIf you copied ReadShelf.exe alone, reinstall using the Setup installer.\nLog: ${path.join(app.getPath("userData"), "readshelf.log")}`,
  );
}

function getAppIcon() {
  if (isDev) {
    return path.join(__dirname, "..", "public", "favicon.png");
  }
  return path.join(process.resourcesPath, "standalone", "public", "favicon.png");
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 3000;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function waitForServer(url, attempts = 120) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      /* server still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`ReadShelf server did not start in time: ${url}`);
}

function startStandaloneServer(port) {
  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `Missing app files at ${standaloneDir}. Install ReadShelf using "ReadShelf Setup.exe" instead of copying ReadShelf.exe alone.`,
    );
  }

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  serverProcess.stdout?.on("data", (chunk) => log(`server: ${chunk}`));
  serverProcess.stderr?.on("data", (chunk) => log(`server err: ${chunk}`));

  serverProcess.on("exit", (code, signal) => {
    if (code && code !== 0) {
      log(`ReadShelf server exited with code ${code}${signal ? ` (${signal})` : ""}`);
    }
  });

  serverProcess.on("error", (error) => {
    log(`Failed to start server process: ${error.message}`);
  });
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "ReadShelf",
    autoHideMenuBar: true,
    icon: getAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (
      targetUrl.startsWith("http://127.0.0.1") ||
      targetUrl.startsWith("http://localhost")
    ) {
      return { action: "allow" };
    }
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      if (isDev) {
        await waitForServer(DEV_URL);
        createWindow(DEV_URL);
        return;
      }

      const port = DESKTOP_PORT;
      const url = `http://127.0.0.1:${port}`;
      startStandaloneServer(port);
      await waitForServer(url);
      createWindow(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showStartupError(message);
      app.quit();
    }
  });
}

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow) {
    mainWindow.show();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});
