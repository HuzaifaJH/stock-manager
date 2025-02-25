import { app, BrowserWindow, screen } from "electron";
import path from "path";
import { exec } from "child_process";
import net from "net";
import killPort from "kill-port";

let mainWindow, splashWindow, nextServer;
const port = 5353;

// Function to check if Next.js server is running
const waitForServer = (port, callback, retries = 30) => {
  if (retries === 0) {
    console.error("Next.js server did not start in time.");
    return;
  }

  const client = new net.Socket();
  client.connect({ port }, () => {
    client.end();
    console.log("Next.js server is running!");
    callback();
  });

  client.on("error", (err) => {
    console.log(
      `Waiting for Next.js server... ECONNREFUSED (${retries} retries left)`
    );
    setTimeout(() => waitForServer(port, callback, retries - 1), 1000);
  });
};

const createSplash = () => {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 500,
    frame: false,
    alwaysOnTop: true,
    // backgroundColor: "#ffffff",
    webPreferences: { nodeIntegration: false },
  });

  splashWindow.loadFile(path.join(app.getAppPath(), "public", "splash.html"));
};

const createMainWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 500,
    webPreferences: { nodeIntegration: true },
  });

  mainWindow.loadURL(`http://localhost:${port}`);
  mainWindow.maximize();
  //   mainWindow.webContents.openDevTools();

  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }
};

// Start the Electron app
app.whenReady().then(async () => {
  createSplash();

  // Start Next.js
  const nextPath = path.join(process.resourcesPath);
  nextServer = exec(`npx next start -p ${port}`, { cwd: nextPath });

  nextServer.stdout.on("data", (data) => console.log(`Next.js: ${data}`));
  nextServer.stderr.on("data", (data) =>
    console.error(`Next.js Error: ${data}`)
  );

  waitForServer(port, createMainWindow);
});

app.on("window-all-closed", async () => {
  if (nextServer) {
    nextServer.kill(); // Kill the Next.js process
  }

  // Forcefully release the port (useful if Next.js process lingers)
  try {
    await killPort(port, "tcp");
    console.log(`Port ${port} freed`);
  } catch (err) {
    console.error(`Error freeing port ${port}:`, err);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});