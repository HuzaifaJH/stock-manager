import { app, BrowserWindow, screen, dialog, ipcMain } from "electron";
import path from "path";
import { exec } from "child_process";
import net from "net";
import killPort from "kill-port";
import fs from "fs";
import dayjs from "dayjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  ipcMain.on("print-content", (event, htmlContent) => {
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    const tempPath = path.join(
      app.getPath("temp"),
      `invoice_${timestamp}.html`
    );
    fs.writeFileSync(tempPath, htmlContent);
    console.log("[PRINT] Temp path:", tempPath);

    const printWindow = new BrowserWindow({
      width: 400,
      height: 600,
      show: true,
      frame: false,
      webPreferences: {
        contextIsolation: true,
      },
    });

    printWindow.loadURL("file:///" + tempPath.replace(/\\/g, "/"));

    setTimeout(() => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: "Black Copper 80",
        },
        (success, errorType) => {
          if (!success) console.error("Print failed:", errorType);
          printWindow.close();
          fs.unlink(tempPath, () => {});
        }
      );
    }, 1500);

    // 👇 Wait for page to finish loading before printing
    // printWindow.webContents.once("did-stop-load", () => {
    //   // 👇 Wait a short time to ensure rendering is complete
    //   setTimeout(async () => {
    //     try {
    //       const printers = await printWindow.webContents.getPrintersAsync();
    //       console.log("🖨️ Available Printers:", printers);

    //       printWindow.webContents.print(
    //         {
    //           silent: false,
    //           printBackground: true,
    //           deviceName: "Black Copper 80",
    //         },
    //         (success, errorType) => {
    //           if (!success) console.error("Print failed:", errorType);
    //           else console.log("✅ Print success");

    //           printWindow.close();

    //           fs.unlink(tempPath, (err) => {
    //             if (err) console.warn("❌ Failed to delete temp file:", err);
    //           });
    //         }
    //       );
    //     } catch (err) {
    //       console.error("❌ Failed to fetch printers or print:", err);
    //       printWindow.close();
    //     }
    //   }, 1000); // 500ms delay to ensure layout calculation
    // });

    // printWindow.webContents.on("did-fail-load", (_, __, err) => {
    //   console.error("Failed to load print content:", err);
    // });
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
