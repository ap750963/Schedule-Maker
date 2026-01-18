import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportToPDF = async (elementId: string, fileName: string = 'schedule.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // 1. Create a clone of the element to render off-screen (prevents scrollbar issues)
    const clone = element.cloneNode(true) as HTMLElement;
    
    // 2. Style the clone to ensure full width/height is captured
    clone.style.width = `${element.scrollWidth}px`;
    clone.style.height = `${element.scrollHeight}px`;
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.zIndex = '-1';
    clone.style.overflow = 'visible'; // Ensure no scrollbars in capture
    
    document.body.appendChild(clone);

    // 3. Wait a moment for DOM to settle (optional but often helpful for styles)
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Capture with high scale
    const canvas = await html2canvas(clone, {
      scale: 2, // Retinal quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff', // Force white background
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // 5. Clean up clone
    document.body.removeChild(clone);

    // 6. Generate PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Create PDF with exact dimensions of the image (1px = 1pt approx in this context for mapping)
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [imgWidth, imgHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(fileName);

  } catch (error) {
    console.error("PDF Export failed:", error);
    alert("Failed to export PDF. Please try again.");
  }
};