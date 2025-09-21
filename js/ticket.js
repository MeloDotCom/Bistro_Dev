// Função para gerar chave única
function gerarChaveUnica() {
	let numero = '';
	for(let i=0; i<6; i++){
		numero += Math.floor(Math.random()*10);
	}
	return `#CETEC${numero}`;
}

// Função para gerar QR code como DataURL
function generateQRCodeDataURL(text, callback){
	const tempDiv = document.createElement("div");
		const qr = new QRCode(tempDiv, {
			text: text,
			width: 150,
			height: 150,
			correctLevel: QRCode.CorrectLevel.H
		});
	setTimeout(()=>{
		const img = tempDiv.querySelector("img");
		callback(img.src);
		tempDiv.remove();
	}, 100);
}

// Função para gerar PDF do ingresso
function gerarPDFIngresso(ticket) {
	const { jsPDF } = window.jspdf;
	const doc = new jsPDF("p", "pt", "a5"); // A5

	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();

	const img = new Image();
	img.src = "img/template_ingresso.png"; // caminho correto
	img.onload = () => {
		// Adiciona template como fundo
		doc.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);

		// Texto no meio da página
		let y = pageHeight / 3;

		doc.setFont("helvetica", "bold");
		doc.setFontSize(16);
		doc.setTextColor('#0b6096');

		y += 20;

		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		doc.setTextColor('#0b6096');
		doc.text(`Nome: ${ticket.name}`, pageWidth / 2, y, { align: "center" });
		y += 20;
		doc.text(`Email: ${ticket.email}`, pageWidth / 2, y, { align: "center" });
		y += 20;
		doc.text(`Data do evento: 28/10/2025`, pageWidth / 2, y, { align: "center" });
		y += 20;
		doc.text(`Quantidade de ingressos: ${ticket.quantity}`, pageWidth / 2, y, { align: "center" });
		y += 20;
		doc.text(`Valor total: R$${(ticket.price * ticket.quantity).toFixed(2).replace('.',',')}`, pageWidth / 2, y, { align: "center" });
		y += 20;
		doc.text(`Restrições alimentares: ${ticket.restrictions || 'Nenhuma especificada'}`, pageWidth / 2, y, { align: "center" });
		y += 20;
		doc.text(`Chave única: ${ticket.uniqueKey}`, pageWidth / 2, y, { align: "center" });
		y += 30;
		doc.text("Apresente este ingresso no dia do evento.", pageWidth / 2, y, { align: "center" });

		// QR code
		const qrText = `Chave: ${ticket.uniqueKey} | Nome: ${ticket.name}`;
		generateQRCodeDataURL(qrText, function (qrDataUrl) {
			const qrSize = 80;
			doc.addImage(qrDataUrl, "PNG", (pageWidth - qrSize) / 2, y + 15, qrSize, qrSize);

			// download do PDF
			doc.save(`ingresso_${ticket.name.replace(/ /g, "_")}.pdf`);
		});
	};
}
