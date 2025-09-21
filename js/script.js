// Simulação de autenticação simples usando localStorage
const LS_KEY = 'bistroCetecUser';

// Funções de login
function getUser() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)); }
  catch (e) { return null; }
}
function setUser(u) { localStorage.setItem(LS_KEY, JSON.stringify(u)); }
function clearUser() { localStorage.removeItem(LS_KEY); }

// Atualiza navbar
function updateNav() {
  const user = getUser();
  const btnLogin = document.getElementById('btnLogin');
  const btnOpenBuy = document.getElementById('btnOpenBuy');

  if (user) {
    btnLogin.innerHTML = `Olá, ${user.name} &nbsp; <span class="small">(sair)</span>`;
    btnLogin.classList.remove('btn-outline-light');
    btnLogin.classList.add('btn-light');
    btnLogin.onclick = () => { if(confirm('Deseja sair?')) { clearUser(); updateNav(); } };

    btnOpenBuy.disabled = false;
    btnOpenBuy.title = 'Comprar ingresso (clicável)';
  } else {
    btnLogin.innerHTML = 'Registrar / Login';
    btnLogin.classList.remove('btn-light');
    btnLogin.classList.add('btn-outline-light');
    btnLogin.onclick = () => $('#modalLogin').modal('show');

    btnOpenBuy.disabled = false;
    btnOpenBuy.title = 'Você precisa estar logado para finalizar a compra';
  }
}

// Gera chave única #CETECXXXXXX
function gerarChaveUnica() {
  let numero = '';
  for(let i=0; i<6; i++){
    numero += Math.floor(Math.random()*10);
  }
  return `#CETEC${numero}`;
}

// Gera QR code como DataURL
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
      const qrSize = 100;
      doc.addImage(qrDataUrl, "PNG", (pageWidth - qrSize) / 2, y + 20, qrSize, qrSize);

      // download do PDF
      doc.save(`ingresso_${ticket.name.replace(/ /g, "_")}.pdf`);
    });
  };
}
// jQuery On ready
$(function(){
  updateNav();

  // Abrir modal automaticamente se vier de outra tela
  if(window.location.hash === '#btnLogin') {
    $('#modalLogin').modal('show');
    window.location.hash = '';
  }
  if(window.location.hash === '#btnOpenBuy') {
    const user = getUser();
    if(!user){
      $('#modalLogin').modal('show');
    } else {
      $('#buyName').val(user.name);
      $('#buyEmail').val(user.email);
      $('#buyResult').hide();
      $('#modalBuy').modal('show');
    }
    window.location.hash = '';
  }

  // Abrir modal login
  $('#btnLogin').on('click', function(e){
    const user = getUser();
    if(user){
      if(confirm('Deseja sair?')){ clearUser(); updateNav(); }
    } else {
      $('#modalLogin').modal('show');
    }
  });

  // Login form
  $('#formLogin').on('submit', function(ev){
    ev.preventDefault();
    const name = $('#userName').val().trim();
    const email = $('#userEmail').val().trim();
    if(!name || !email){ alert('Preencha nome e email'); return; }
    setUser({name,email});
    $('#modalLogin').modal('hide');
    updateNav();
    alert('Login realizado! Agora você pode finalizar a compra do ingresso.');
  });

  // Abrir modal compra
  $('#btnOpenBuy').on('click', function(){
    const user = getUser();
    if(!user){ $('#modalLogin').modal('show'); return; }
    $('#buyName').val(user.name);
    $('#buyEmail').val(user.email);
    $('#buyResult').hide();
    $('#quantity').val(1);
    $('#buyTotal').text('R$120,00');
    $('#modalBuy').modal('show');
  });

  // Atualizar valor total ao mudar quantidade
  $(document).on('input', '#quantity', function(){
    let qtd = parseInt($(this).val(), 10);
    if(isNaN(qtd) || qtd < 1) qtd = 1;
    const total = qtd * 120;
    $('#buyTotal').text('R$' + total.toFixed(2).replace('.',','));
  });

  // Finalizar compra e gerar PDF com QR
  $('#formBuy').on('submit', function(ev){
    ev.preventDefault();
    const user = getUser();
    if(!user){ alert('Você precisa estar logado'); $('#modalBuy').modal('hide'); $('#modalLogin').modal('show'); return; }

    const diet = $('#diet').val().trim();
    const quantity = parseInt($('#quantity').val(), 10) || 1;
    for(let i=0; i<quantity; i++){
      const uniqueKey = gerarChaveUnica();
      const ticket = {
        name: user.name,
        email: user.email,
        date: '2025-10-28',
        price: 120.00,
        restrictions: diet,
        uniqueKey,
        quantity
      };
      gerarPDFIngresso(ticket);
    }
    $('#buyResult').html('<div class="alert alert-success">PDF(s) do ingresso gerado! Confira seu download.</div>').show();
    $('#diet').val('');
  });

  // back-to-top
  $('.back-to-top').on('click', function(e){ e.preventDefault(); $('html,body').animate({scrollTop:0},400); });
});
// Smooth scroll for links with .scrollto classes
$(document).on('click', '.scrollto', function(e){
  if(location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname){
    e.preventDefault();
    var target = $(this.hash);
    if(target.length){
        var scrollto = target.offset().top - 70;
        $('html, body').animate({scrollTop: scrollto}, 400);
        return false;
    }   
    }
});