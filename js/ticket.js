// ticket.js

// Gera chave única #CETECXXXXXX
export function gerarChaveUnica() {
  let numero = '';
  for (let i = 0; i < 6; i++) {
    numero += Math.floor(Math.random() * 10);
  }
  return `#CETEC${numero}`;
}

// Gera QR code como DataURL
export function generateQRCodeDataURL(text, callback) {
  const tempDiv = document.createElement("div");
  const qr = new QRCode(tempDiv, {
    text: text,
    width: 150,
    height: 150,
    correctLevel: QRCode.CorrectLevel.H
  });
  setTimeout(() => {
    const img = tempDiv.querySelector("img");
    callback(img.src);
    tempDiv.remove();
  }, 100);
}

// Gera PDF do ingresso
export function gerarPDFIngresso(ticket) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a5"); // A5

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const img = new Image();
  img.src = "img/template_ingresso.jpg"; // caminho correto
  img.onload = () => {
    // Adiciona template como fundo
    doc.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);

    let y = pageHeight / 3;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INGRESSO BISTRÔ CETEC 2025", pageWidth / 2, y, { align: "center" });
    y += 30;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Nome: ${ticket.name}`, pageWidth / 2, y, { align: "center" });
    y += 20;
    doc.text(`Email: ${ticket.email}`, pageWidth / 2, y, { align: "center" });
    y += 20;
    doc.text(`Data do evento: 28/10/2025`, pageWidth / 2, y, { align: "center" });
    y += 20;
    doc.text(`Valor: R$120,00`, pageWidth / 2, y, { align: "center" });
    y += 20;
    doc.text(`Restrições alimentares: ${ticket.restrictions || 'Nenhuma especificada'}`, pageWidth / 2, y, { align: "center" });
    y += 20;
    doc.text(`Chave única: ${ticket.uniqueKey}`, pageWidth / 2, y, { align: "center" });
    y += 30;
    doc.text("Apresente este ingresso no dia do evento.", pageWidth / 2, y, { align: "center" });

    const qrText = `Chave: ${ticket.uniqueKey} | Nome: ${ticket.name}`;
    generateQRCodeDataURL(qrText, function (qrDataUrl) {
      const qrSize = 100;
      doc.addImage(qrDataUrl, "JPEG", (pageWidth - qrSize) / 2, y + 20, qrSize, qrSize);
      doc.save(`ingresso_${ticket.name.replace(/ /g, "_")}.pdf`);
    });
  };
}

// Função para processar a compra
export function finalizarCompra(user, restrictions) {
  if (!user) return null;

  const uniqueKey = gerarChaveUnica();
  const ticket = {
    name: user.name,
    email: user.email,
    date: '2025-10-28',
    price: 120.00,
    restrictions,
    uniqueKey
  };

  gerarPDFIngresso(ticket);
  return ticket;
}
