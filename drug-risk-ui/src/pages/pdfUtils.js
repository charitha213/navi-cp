import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePrescriptionPDF(prescription) {
  const doc = new jsPDF();

  // Header - Clinic Name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Dr. [Your Name] Clinic', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('MBBS, MD - General Medicine', 105, 27, { align: 'center' });
  doc.text('123 Medical Street, Health City, IN 560001', 105, 33, { align: 'center' });
  doc.text('Phone: +91 9876543210 | Email: contact@drclinic.com', 105, 39, { align: 'center' });

  // Divider
  doc.setLineWidth(0.5);
  doc.line(10, 43, 200, 43);

  // Patient Info
  doc.setFontSize(12);
  doc.text(`Patient Name: ____________________`, 14, 52);
  doc.text(`Age: _____`, 150, 52);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 58);
  doc.text(`Address: ______________________________________`, 14, 58);
  doc.text(`Diagnosis: ____________________________________`, 14, 64);

  // Prescription Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Prescription:', 14, 75);

  // Prescription Table
 const rows = prescription.map((med, i) => [
  i + 1,
  med.name,
  med.risk.charAt(0).toUpperCase() + med.risk.slice(1),
  med.dosage || '',
  `${med.morning ? 'M ' : ''}${med.afternoon ? 'A ' : ''}${med.night ? 'N' : ''}`.trim()
]);


  autoTable(doc, {
    startY: 80,
    head: [['#', 'Medicine Name', 'Risk Level', 'Dosage', 'Duration']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133] },
    styles: {
      cellPadding: 3,
      fontSize: 12,
    },
    columnStyles: {
      0: { cellWidth: 10 },  // #
      1: { cellWidth: 70 },  // Medicine Name
      2: { cellWidth: 30 },  // Risk
      3: { cellWidth: 40 },  // Dosage
      4: { cellWidth: 40 },  // Duration
    },
  });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Note: Please take medication as directed. Contact us for any queries.', 14, 280);

  // Signature
  doc.setFont('helvetica', 'normal');
  doc.text('Doctor\'s Signature: ____________________', 140, 280);

  doc.save('prescription.pdf');
}
