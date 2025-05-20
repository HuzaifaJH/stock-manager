import fs from "fs";
import os from "os";
import path from "path";
import puppeteer from "puppeteer";
import pdfToPrinter from "pdf-to-printer";
const { print } = pdfToPrinter;

const tempDir = os.tmpdir();

async function printFile(htmlPath) {
  const pdfPath = htmlPath.replace(".html", ".pdf");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfPath,
    printBackground: true,
    width: "80mm",
  });

  await browser.close();

  try {
    // console.log("PDF PATH:", pdfPath);
    await print(pdfPath, { printer: "Black Copper 80" });
    // console.log("Printed successfully");
  } catch (err) {
    console.error("Printing failed:", err);
  } finally {
    fs.unlinkSync(pdfPath);
  }
}

const printedFiles = new Set();
fs.watch(tempDir, async (eventType, filename) => {
  if (filename.endsWith(".html.ready")) {
    const htmlFile = path.join(tempDir, filename.replace(".ready", ""));
    const readyFile = path.join(tempDir, filename);

    // Prevent re-processing
    if (printedFiles.has(readyFile)) return;
    printedFiles.add(readyFile);

    // console.log("[PRINT SERVICE] Printing:", htmlFile);

    try {
      await printFile(htmlFile);
      fs.unlinkSync(htmlFile);
      fs.unlinkSync(readyFile);
    } catch (err) {
      console.error("Failed to print:", err);
    }

    // Clean up tracked files after a delay
    setTimeout(() => printedFiles.delete(readyFile), 5000);
  }
});
