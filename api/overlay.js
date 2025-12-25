import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import Busboy from "busboy";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const busboy = Busboy({ headers: req.headers });
  let pdfBuffer;

  busboy.on("file", (_, file) => {
    const chunks = [];
    file.on("data", d => chunks.push(d));
    file.on("end", () => pdfBuffer = Buffer.concat(chunks));
  });

  busboy.on("finish", async () => {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const logoBytes = fs.readFileSync(
      path.join(process.cwd(), "api/Logo.png")
    );

    const logo = await pdfDoc.embedPng(logoBytes);

    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawImage(logo, {
        x: 40,
        y: height - 80,
        width: 120,
        height: 40
      });
    });

    const outputPdf = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=logo_added.pdf");
    res.send(Buffer.from(outputPdf));
  });

  req.pipe(busboy);
}
