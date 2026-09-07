import PDFDocument from 'pdfkit';

export interface CertificatePDFData {
  certificateNumber: string;
  customerName: string;
  propertyAddress: string;
  propertyType: string;
  serviceDate: Date | string;
  issuedAt: Date | string;
}

/**
 * Generates an official, beautifully styled 247Sparkle Fumigation Certificate as a PDF Buffer.
 * Page layout: A4 Landscape with gold/navy decorative framing, seal, and verification URL.
 */
export async function generateCertificatePDF(data: CertificatePDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 30, bottom: 30, left: 35, right: 35 },
      info: {
        Title: `247Sparkle Fumigation Certificate - ${data.certificateNumber}`,
        Author: '247Sparkle Cleaning & Fumigation Services',
        Subject: 'Official Certificate of Fumigation & Pest Control',
        Keywords: 'Fumigation, Pest Control, 247Sparkle, Certificate',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    const width = 841.89;
    const height = 595.28;

    // Outer decorative border (Deep Navy)
    doc
      .rect(20, 20, width - 40, height - 40)
      .lineWidth(3)
      .stroke('#1A0A5E');

    // Inner decorative border (Sparkle Gold)
    doc
      .rect(26, 26, width - 52, height - 52)
      .lineWidth(1.5)
      .stroke('#F5C200');

    // Thin accent inner border
    doc
      .rect(30, 30, width - 60, height - 60)
      .lineWidth(0.5)
      .stroke('#E2E8F0');

    // Top Header Banner
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text('247SPARKLE CLEANING & FUMIGATION SERVICES', 0, 50, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#CC0000')
      .text('PROFESSIONAL RESIDENTIAL & COMMERCIAL PEST CONTROL SOLUTIONS', 0, 78, {
        align: 'center',
        characterSpacing: 2,
      });

    // Decorative line
    doc
      .moveTo(width / 2 - 150, 96)
      .lineTo(width / 2 + 150, 96)
      .lineWidth(1)
      .stroke('#F5C200');

    // Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text('CERTIFICATE OF FUMIGATION', 0, 112, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .fillColor('#64748B')
      .text(
        'This document certifies that pest control and fumigation treatment has been conducted on the premises below.',
        0,
        138,
        {
          align: 'center',
        }
      );

    // Certificate Number Badge
    const certNumberText = `Certificate No: ${data.certificateNumber}`;
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text(certNumberText, 0, 162, { align: 'center' });

    // Main Details Table / Card Box
    const boxX = 60;
    const boxY = 190;
    const boxWidth = width - 120;
    const boxHeight = 190;

    doc.rect(boxX, boxY, boxWidth, boxHeight).fillColor('#F8FAFC').fill();
    doc.rect(boxX, boxY, boxWidth, boxHeight).lineWidth(1).stroke('#E2E8F0');

    // Left column: Client and Property details
    const col1X = boxX + 30;
    const col2X = boxX + 400;

    const sDate =
      typeof data.serviceDate === 'string' ? new Date(data.serviceDate) : data.serviceDate;
    const iDate = typeof data.issuedAt === 'string' ? new Date(data.issuedAt) : data.issuedAt;

    const formattedServiceDate = sDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const formattedIssuedDate = iDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Row 1: Customer Name
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('ISSUED TO / CLIENT:', col1X, boxY + 20);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text(data.customerName, col1X, boxY + 34);

    // Row 2: Property Type
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('PROPERTY TYPE:', col1X, boxY + 65);
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#0F172A')
      .text(data.propertyType, col1X, boxY + 79);

    // Row 3: Property Address
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('PROPERTY LOCATION / ADDRESS:', col1X, boxY + 110);
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#0F172A')
      .text(data.propertyAddress, col1X, boxY + 124, {
        width: 320,
      });

    // Right column: Dates & Standards
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('DATE OF TREATMENT:', col2X, boxY + 20);
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(formattedServiceDate, col2X, boxY + 34);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('DATE OF ISSUANCE:', col2X, boxY + 65);
    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#0F172A')
      .text(formattedIssuedDate, col2X, boxY + 79);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('TREATMENT METHODOLOGY:', col2X, boxY + 110);
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#0F172A')
      .text(
        'Eco-Friendly Chemical Fumigation & Residual Insecticide Barrier Application (Effective against Crawling & Flying Pests)',
        col2X,
        boxY + 124,
        { width: 300 }
      );

    // Standard safety certification paragraph
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#475569')
      .text(
        'This premises has been treated in accordance with approved safety procedures and public health regulations. The chemicals utilized are environmentally responsible and certified for residential/commercial eradication.',
        boxX,
        395,
        { width: boxWidth, align: 'center' }
      );

    // Seal simulation and Signatures
    const sealX = width / 2;
    const sealY = 460;

    // Left Signature
    doc.moveTo(100, 480).lineTo(260, 480).lineWidth(1).stroke('#94A3B8');
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text('Lead Fumigation Specialist', 100, 485, { width: 160, align: 'center' });
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#64748B')
      .text('Field Technical Operations', 100, 498, { width: 160, align: 'center' });

    // Official Stamp / Seal in Center
    doc.circle(sealX, sealY, 32).lineWidth(2).stroke('#F5C200');
    doc.circle(sealX, sealY, 28).lineWidth(0.8).stroke('#1A0A5E');
    doc
      .fontSize(7)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text('247SPARKLE', sealX - 25, sealY - 14, { width: 50, align: 'center' });
    doc
      .fontSize(6)
      .font('Helvetica-Bold')
      .fillColor('#CC0000')
      .text('VERIFIED', sealX - 25, sealY - 3, { width: 50, align: 'center' });
    doc
      .fontSize(6)
      .font('Helvetica')
      .fillColor('#1A0A5E')
      .text('OFFICIAL SEAL', sealX - 25, sealY + 7, { width: 50, align: 'center' });

    // Right Signature
    doc
      .moveTo(width - 260, 480)
      .lineTo(width - 100, 480)
      .lineWidth(1)
      .stroke('#94A3B8');
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1A0A5E')
      .text('Quality Assurance Director', width - 260, 485, { width: 160, align: 'center' });
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#64748B')
      .text('247Sparkle Services Ltd.', width - 260, 498, { width: 160, align: 'center' });

    // Bottom verification footer
    const verifyUrl = `https://247sparkle.com/verify?number=${encodeURIComponent(data.certificateNumber)}`;
    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#64748B')
      .text(
        `Authenticity can be verified at anytime online: ${verifyUrl} · Tel: 09039661885`,
        0,
        542,
        { align: 'center' }
      );

    doc.end();
  });
}
