
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportToPDF = async (elementId: string, fileName: string = 'schedule.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // 1. Create a print wrapper to ensure content isn't clipped by the parent's overflow:auto
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = 'auto';
    wrapper.style.height = 'auto';
    wrapper.style.background = 'white';
    
    // 2. Clone the content
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = `${element.scrollWidth}px`;
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    clone.style.margin = '20px'; // Padding for PDF
    
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // 3. High-quality capture
    const canvas = await html2canvas(clone, {
      scale: 3, // 3x scale for crisp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth + 40,
      height: element.scrollHeight + 40,
    });

    document.body.removeChild(wrapper);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(fileName);
  } catch (err) {
    console.error("PDF Export failed", err);
    alert("Could not generate PDF. Check console for details.");
  }
};
