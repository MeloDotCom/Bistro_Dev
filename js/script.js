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
// jQuery On ready
$(function(){
  let compraBloqueada = false;
  let dadosCompra = null;
  // Verifica bloqueio persistente
  if(localStorage.getItem('bistroCetecCompraBloqueada')) {
    compraBloqueada = true;
    try { dadosCompra = JSON.parse(localStorage.getItem('bistroCetecDadosCompra')); } catch(e){}
    $('#diet').prop('readonly', true);
    $('#quantity').prop('readonly', true);
    if(dadosCompra) {
      $('#diet').val(dadosCompra.restrictions);
      $('#quantity').val(dadosCompra.quantity);
      $('#buyTotal').text('R$' + (dadosCompra.quantity * 120).toFixed(2).replace('.',','));
      $('#buyResult').html('<div class="alert alert-info">Compra registrada! Clique em "Baixar ingresso" para baixar o PDF.</div>').show();
    }
  }
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
  $('#btnLockBuy').on('click', function(){
    const user = getUser();
    if(!user){ alert('Você precisa estar logado'); $('#modalBuy').modal('hide'); $('#modalLogin').modal('show'); return; }
    const diet = $('#diet').val().trim();
    const quantity = parseInt($('#quantity').val(), 10) || 1;
    const uniqueKey = gerarChaveUnica();
    const dadosAtuais = {
      name: user.name,
      email: user.email,
      date: '2025-10-28',
      price: 120.00,
      restrictions: diet,
      uniqueKey,
      quantity
    };
    // travar campos
    $('#diet').prop('readonly', true);
    $('#quantity').prop('readonly', true);
    compraBloqueada = true;
    dadosCompra = dadosAtuais;
    localStorage.setItem('bistroCetecCompraBloqueada', '1');
    localStorage.setItem('bistroCetecDadosCompra', JSON.stringify(dadosAtuais));
    gerarPDFIngresso(dadosAtuais);
    $('#buyResult').html('<div class="alert alert-success">PDF do ingresso baixado!</div>').show();
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