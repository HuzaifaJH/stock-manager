import { app, BrowserWindow, screen, dialog, ipcMain } from "electron";
import path from "path";
import { exec } from "child_process";
import net from "net";
import killPort from "kill-port";
import fs from "fs";
import dayjs from "dayjs";
import { fileURLToPath } from "url";
import { fork } from "child_process";
import { google } from "googleapis";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbName = process.env.DB_NAME;

let mainWindow, splashWindow, nextServer;
const port = 5353;
const timestamp = dayjs().format("YYYYMMDD_HHmmss");

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
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  splashWindow.loadFile(path.join(app.getAppPath(), "public", "splash.html"));
};

const createMainWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 500,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);
  mainWindow.maximize();
  mainWindow.setMenuBarVisibility(false);
  //   mainWindow.webContents.openDevTools();

  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }
};

// Start the Electron app
app.whenReady().then(async () => {
  createSplash();

  // // Start Next.js
  // const nextPath = path.join(process.resourcesPath);
  // // nextServer = exec(`npx next start -p ${port}`, { cwd: nextPath });
  // nextServer = exec(`node .next/standalone/server.js`, {
  //   cwd: nextPath,
  //   env: { ...process.env, PORT: port.toString() },
  // });

  const nextPath = app.isPackaged
    ? path.join(process.resourcesPath, "next")
    : process.cwd();

  nextServer = exec(`node server.js`, {
    cwd: nextPath,
    env: { ...process.env, PORT: port.toString() },
  });

  nextServer.stdout.on("data", (data) => console.log(`Next.js: ${data}`));
  nextServer.stderr.on("data", (data) =>
    console.error(`Next.js Error: ${data}`)
  );

  waitForServer(port, createMainWindow);

  const printServicePath = path.join(__dirname, "printService.js");

  fork(printServicePath);

  ipcMain.handle("print-content", (event, htmlContent) => {
    const tempPath = path.join(
      app.getPath("temp"),
      `invoice_${timestamp}.html`
    );
    fs.writeFileSync(tempPath, htmlContent);
    fs.writeFileSync(tempPath + ".ready", "");
    // console.log("[PRINT] Temp path:", tempPath);
  });

  const ENABLE_LOGS = false; // Toggle this to enable/disable logs

  const log = (...args) => ENABLE_LOGS && console.log(...args);
  const warn = (...args) => ENABLE_LOGS && console.warn(...args);
  const error = (...args) => console.error(...args); // Always show errors

  ipcMain.handle("save-invoice-pdf", async (event, htmlContent) => {
    log("🧾 [PDF] Request received");

    try {
      const pdfWindow = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        frame: false,
        webPreferences: {
          contextIsolation: true,
          preload: path.join(__dirname, "preload.js"),
          webSecurity: false,
        },
      });

      const tempPath = path.join(
        app.getPath("temp"),
        `invoice_${timestamp}.html`
      );
      fs.writeFileSync(tempPath, htmlContent);
      log("🧾 [PDF] Temp path:", tempPath);

      await pdfWindow.loadURL("file:///" + tempPath.replace(/\\/g, "/"));

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timed out waiting for stop-loading")),
          1000
        );
        pdfWindow.webContents.once("did-stop-loading", () => {
          clearTimeout(timeout);
          resolve(null);
        });
      });

      log("🧾 [PDF] Page loaded, generating PDF...");

      const pdfData = await pdfWindow.webContents.printToPDF({
        printBackground: true,
        marginsType: 1,
        pageSize: "A4",
      });

      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "Save Invoice as PDF",
        defaultPath: `invoice_${timestamp}.pdf`,
        filters: [{ name: "PDF Files", extensions: ["pdf"] }],
      });

      if (!canceled && filePath) {
        fs.writeFileSync(filePath, pdfData);
        log(`✅ [PDF] Saved to: ${filePath}`);
      }

      if (fs.existsSync(tempPath)) {
        fs.unlink(tempPath, (err) => {
          if (err) warn("⚠️ [PDF] Failed to delete temp file:", err);
          else log("🧹 [PDF] Temp file deleted");
        });
      }

      pdfWindow.close();
    } catch (err) {
      error("❌ [PDF] Failed to generate or save PDF:", err);
    }
  });

  ipcMain.handle("backup-db", async () => {
    try {
      const dumpPath = path.join(
        app.getPath("temp"),
        `db-backup_${timestamp}.sql`
      );

      // const dumpCommand = `mysqldump -u root -proot ims > "${dumpPath}"`;
      const dumpCommand = `mysqldump -u ${dbUser} -p${dbPass} ${dbName} > "${dumpPath}"`;

      await new Promise((resolve, reject) => {
        exec(dumpCommand, (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "ims-ali-bhai-data-7ba33b968f24.json"),
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const drive = google.drive({ version: "v3", auth });

      const fileMetadata = {
        name: `backup-${new Date().toISOString()}.sql`,
        parents: ["17ko7BtdZwWK-0NTzM7OnUKauLW278Wje"],
      };

      const media = {
        mimeType: "application/sql",
        body: fs.createReadStream(dumpPath),
      };

      await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id",
      });

      fs.unlinkSync(dumpPath);

      return { success: true };
    } catch (error) {
      console.error("Backup failed:", error);
      return { success: false, error: error.message };
    }
  });
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
