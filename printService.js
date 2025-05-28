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

  // Step 1: Get full content height
  const fullHeightPx = await page.evaluate(() => {
    const body = document.body;
    return Math.max(body.scrollHeight, body.offsetHeight);
  });

  // Step 2: Measure top whitespace offset
  const topContentOffsetPx = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT
    );
    let node;
    while ((node = walker.nextNode())) {
      const rect = node.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        return rect.top + window.scrollY - 5; // first non-empty element Y position
      }
    }
    return 0;
  });

  // Step 3: Apply negative transform to shift content upward
  await page.evaluate((offset) => {
    document.body.style.transform = `translateY(-${offset}px)`;
    document.body.style.margin = "0";
    document.body.style.padding = "0";
  }, topContentOffsetPx);

  // Step 4: Convert to mm and export cropped PDF
  const croppedHeightMm = (fullHeightPx - topContentOffsetPx) * 0.264583; // Convert pixels to mm (1px ≈ 0.264583 mm)

  await page.pdf({
    path: pdfPath,
    printBackground: true,
    width: "80mm",
    height: `${croppedHeightMm}mm`,
    margin: {
      top: "0mm",
      right: "0mm",
      bottom: "0mm",
      left: "0mm",
    },
  });

  await browser.close();

  try {
    console.log("PDF PATH:", pdfPath);
    await print(pdfPath, { printer: "Black Copper 80" });
    console.log("Printed successfully");
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
