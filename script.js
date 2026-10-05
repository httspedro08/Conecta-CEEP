/* ---------- Configuração ---------- */
// 1. Você pode adicionar ou remover locais dentro deste array (lista):
const ESPACOS = [
  "Laboratório 1",
  "Laboratório 2",
  "Laboratório 3",
  "Laboratório 4",
  "Ginásio",
  "Auditório",
  "Sala de Adm",
  "Sala de Edificações",
  "Laboratorio Quimica"
];

// 2. Novos horários configurados:
const HORARIOS = [
  "07:10 – 08:00",
  "08:00 – 08:50",
  "08:50 – 09:40",
  "09:55 – 10:45",
  "10:45 – 11:35",
  "11:35 – 12:25"
];

const MESES_PT = "pt-BR";

/* ---------- Armazenamento (localStorage com proteção) ---------- */
const store = {
  get(k, fallback){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
let users = store.get("cc_usuarios2", []);
let reservas = store.get("cc_reservas2", []); 
let sessao = store.get("cc_sessao2", null);

/* ---------- CPF e professores autorizados ---------- */
const ADMIN = {nome: "Juliano", cpf: "10754772985", senha: "123"};
const COORDENACAO = [ADMIN.cpf];
let autorizados = store.get("cc_autorizados2", null);
if(!autorizados){
  autorizados = [{cpf: ADMIN.cpf, nome: ADMIN.nome}, {cpf: "11144477735", nome: "Professor (teste)"}];
  store.set("cc_autorizados2", autorizados);
}
if(!autorizados.some(a => a.cpf === ADMIN.cpf)){
  autorizados.unshift({cpf: ADMIN.cpf, nome: ADMIN.nome});
  store.set("cc_autorizados2", autorizados);
}
if(!users.some(u => u.cpf === ADMIN.cpf)){
  users.push({nome: ADMIN.nome, cpf: ADMIN.cpf, senha: ADMIN.senha});
  store.set("cc_usuarios2", users);
}

function soDigitos(v){ return String(v).replace(/\D/g, "").slice(0, 11); }
function formatarCpf(v){
  const d = soDigitos(v);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
function cpfValido(cpf){
  if(!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for(const t of [9, 10]){
    let soma = 0;
    for(let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
    const dv = (soma * 10) % 11 % 10;
    if(dv !== Number(cpf[t])) return false;
  }
  return true;
}

async function consultarProfessor(cpf){
  return autorizados.some(a => a.cpf === cpf);
}

/* ---------- Estado ---------- */
const hoje = new Date();
let view = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
let selecionado = iso(hoje);
let modo = "in";
let pendente = null;

const $ = id => document.getElementById(id);
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function daDataIso(s){ const [a,m,d] = s.split("-").map(Number); return new Date(a, m-1, d); }
let toastT;
function aviso(msg){ const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 3200); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------- Login e cadastro ---------- */
function erro(m){
  $("authMsg").textContent = m;
  const c = document.querySelector(".authcard");
  c.classList.remove("shake"); void c.offsetWidth; c.classList.add("shake");
}
function setModo(m){
  modo = m;
  $("tabIn").setAttribute("aria-selected", m==="in");
  $("tabUp").setAttribute("aria-selected", m==="up");
  $("nameWrap").hidden = m==="in";
  $("authBtn").textContent = m==="in" ? "Entrar" : "Criar conta";
  $("authMsg").textContent = "";
}
$("tabIn").onclick = () => setModo("in");
$("tabUp").onclick = () => setModo("up");

$("fCpf").addEventListener("input", e => { e.target.value = formatarCpf(e.target.value); });

$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  const cpf = soDigitos($("fCpf").value);
  const senha = $("fPass").value;
  const nome = $("fName").value.trim();
  if(!cpf || !senha){ erro("Preencha CPF e senha."); return; }
  if(!cpfValido(cpf)){ erro("CPF inválido. Confira os números."); return; }
  $("authBtn").disabled = true;
  $("authMsg").textContent = "Verificando se o CPF é de professor...";
  const ehProfessor = await consultarProfessor(cpf);
  $("authBtn").disabled = false;
  $("authMsg").textContent = "";
  if(!ehProfessor){ erro("Este CPF não consta como professor autorizado. Procure a coordenação."); return; }
  const papel = COORDENACAO.includes(cpf) ? "coordenacao" : "professor";
  if(modo === "up"){
    if(!nome){ erro("Informe seu nome completo."); return; }
    if(senha.length < 4){ erro("A senha precisa ter pelo menos 4 caracteres."); return; }
    if(users.some(u => u.cpf === cpf)){ erro("Este CPF já tem cadastro. Use Entrar."); return; }
    users.push({nome, cpf, senha});
    store.set("cc_usuarios2", users);
    sessao = {nome, cpf, papel};
  } else {
    const u = users.find(u => u.cpf === cpf && u.senha === senha);
    if(!u){ erro("CPF ou senha incorretos."); return; }
    sessao = {nome: u.nome, cpf: u.cpf, papel};
  }
  store.set("cc_sessao2", sessao);
  const vai = destino || "reservas"; destino = null;
  $("authForm").reset();
  atualizarHeader();
  aviso("Bem-vindo(a), " + sessao.nome.split(" ")[0] + ".");
  location.hash = "#/" + vai;
  rota();
});

$("logout").onclick = () => { sessao = null; store.set("cc_sessao2", null); atualizarHeader(); aviso("Você saiu da sua conta."); location.hash = "#/inicio"; rota(); };

/* ---------- Calendário ---------- */
function desenharCalendario(){
  $("monthTitle").textContent = view.toLocaleDateString(MESES_PT, {month:"long", year:"numeric"});
  const box = $("days"); box.innerHTML = "";
  const primeiro = view.getDay();
  const total = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
  for(let i=0;i<primeiro;i++){ const b = document.createElement("div"); b.className="day out"; box.appendChild(b); }
  for(let d=1; d<=total; d++){
    const data = new Date(view.getFullYear(), view.getMonth(), d);
    const k = iso(data);
    const qtd = reservas.filter(r => r.data === k).length;
    const b = document.createElement("button");
    b.className = "day" + (data.getDay()===0||data.getDay()===6 ? " weekend":"") + (k===iso(hoje) ? " today":"") + (k===selecionado ? " sel":"");
    b.innerHTML = d + (qtd ? "<small>"+qtd+"</small>" : "");
    b.setAttribute("aria-label", data.toLocaleDateString(MESES_PT,{day:"numeric",month:"long"}) + (qtd ? ", "+qtd+" reservas" : ", sem reservas"));
    b.onclick = () => { selecionado = k; desenharCalendario(); desenharPainel(); };
    box.appendChild(b);
  }
}
$("prev").onclick = () => { view = new Date(view.getFullYear(), view.getMonth()-1, 1); desenharCalendario(); };
$("next").onclick = () => { view = new Date(view.getFullYear(), view.getMonth()+1, 1); desenharCalendario(); };

/* ---------- Painel do dia ---------- */
function desenharPainel(){
  const data = daDataIso(selecionado);
  $("dayTitle").textContent = data.toLocaleDateString(MESES_PT, {weekday:"long", day:"numeric", month:"long"});
  const espaco = $("space").value;
  $("overview").innerHTML = "";
  ESPACOS.forEach(e => {
    const n = reservas.filter(r => r.data === selecionado && r.espaco === e).length;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", e === espaco);
    b.innerHTML = e + " <b>" + n + "/" + HORARIOS.length + "</b>";
    b.onclick = () => { $("space").value = e; desenharPainel(); };
    $("overview").appendChild(b);
  });
  const lista = reservas.filter(r => r.data === selecionado && r.espaco === espaco);
  const livres = HORARIOS.length - lista.length;
  $("daySub").textContent = livres + " de " + HORARIOS.length + " horários livres em " + espaco + ".";
  const box = $("slots"); box.innerHTML = "";
  const wd = data.getDay();
  const motivo = selecionado < iso(hoje) ? "Esta data já passou. Escolha uma data a partir de hoje." : (wd === 0 || wd === 6) ? "Não há aulas aos sábados e domingos." : "";
  if(motivo){ $("daySub").textContent = espaco; box.innerHTML = '<div class="empty">' + motivo + '</div>'; return; }
  HORARIOS.forEach(h => {
    const r = lista.find(x => x.horario === h);
    const el = document.createElement("button");
    el.type = "button";
    if(!r){
      el.className = "slot free";
      el.innerHTML = '<span class="t">'+h+'</span><span class="d">Livre</span><strong>Reservar</strong>';
      el.onclick = () => abrirReserva(h);
    } else if(r.cpf === sessao.cpf){
      el.className = "slot mine";
      el.innerHTML = '<span class="t">'+h+'</span><span class="d">Sua reserva: '+esc(r.turma)+'</span><strong>Cancelar</strong>';
      el.onclick = () => cancelar(r.id);
    } else {
      el.className = "slot busy";
      el.disabled = true;
      el.innerHTML = '<span class="t">'+h+'</span><span class="d">'+esc(r.nome)+' · '+esc(r.turma)+'</span>';
    }
    box.appendChild(el);
  });
}
$("space").onchange = desenharPainel;

/* ---------- Reservar e cancelar ---------- */
function abrirReserva(h){
  pendente = h;
  $("dlgInfo").textContent = $("space").value + " · " + daDataIso(selecionado).toLocaleDateString(MESES_PT,{day:"numeric",month:"long"}) + " · " + h;
  $("turma").value = ""; $("dlgMsg").textContent = "";
  $("dlg").showModal();
  $("turma").focus();
}
$("dlgCancel").onclick = () => $("dlg").close();
$("dlgOk").onclick = () => {
  const turma = $("turma").value.trim();
  if(!turma){ $("dlgMsg").textContent = "Diga a turma ou a atividade."; return; }
  const espaco = $("space").value;
  if(reservas.some(r => r.data===selecionado && r.espaco===espaco && r.horario===pendente)){
    $("dlgMsg").textContent = "Esse horário acabou de ser reservado."; return;
  }
  reservas.push({id: Date.now()+"-"+Math.random().toString(36).slice(2,6), data: selecionado, espaco, horario: pendente, cpf: sessao.cpf, nome: sessao.nome, turma});
  store.set("cc_reservas2", reservas);
  $("dlg").close();
  desenharCalendario(); desenharPainel();
  aviso("Reserva confirmada: " + espaco + ", " + pendente + ".");
};
function cancelar(id){
  if(!confirm("Cancelar esta reserva?")) return;
  reservas = reservas.filter(r => r.id !== id);
  store.set("cc_reservas2", reservas);
  desenharAtual();
  aviso("Reserva cancelada.");
}

/* ---------- Início ---------- */
["D","S","T","Q","Q","S","S"].forEach(l => { const s = document.createElement("div"); s.className="dow"; s.textContent=l; $("dows").appendChild(s); });
$("space").innerHTML = ESPACOS.map(e => "<option>"+e+"</option>").join("");

/* ---------- Páginas e acesso ---------- */
const MAP = {inicio:"home", login:"auth", reservas:"app", minhas:"minhas", professores:"prof"};
const PROTEGIDAS = ["reservas","minhas","professores"];
let destino = null;

function atualizarHeader(){
  const logado = !!sessao;
  $("whoName").textContent = logado ? sessao.nome : "";
  $("logout").hidden = !logado;
  $("loginLink").hidden = logado;
  $("navProf").hidden = !(logado && sessao.papel === "coordenacao");
}
function mostrar(p, aviso){
  Object.keys(MAP).forEach(n => { $(MAP[n]).hidden = n !== p && !(p === "login" && n === "inicio"); });
  document.body.style.overflow = p === "login" ? "hidden" : "";
  if(p === "login") setTimeout(() => $(modo === "up" ? "fName" : "fCpf").focus(), 80);
  document.querySelectorAll("#nav a").forEach(a => {
    if(a.dataset.p === p) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
  if(p === "login") $("authNote").textContent = aviso || "Acesso exclusivo para professores autorizados. Entre com o seu CPF.";
  if(p === "inicio" || p === "login") desenharHome();
  if(p === "reservas"){ desenharCalendario(); desenharPainel(); }
  if(p === "minhas") desenharMinhas();
  if(p === "professores") desenharProf();
  const nomes = {inicio:"Início", login:"Acesso", reservas:"Reservas", minhas:"Minhas reservas", professores:"Professores"};
  $("crumb").innerHTML = '<a href="#/inicio">Início</a>' + (p !== "inicio" ? " › <strong>" + nomes[p] + "</strong>" : "");
  document.title = (p !== "inicio" ? nomes[p] + " · " : "") + "Conecta-CEEP";
  window.scrollTo(0,0);
}
function desenharAtual(){
  if(!$("app").hidden){ desenharCalendario(); desenharPainel(); }
  if(!$("minhas").hidden) desenharMinhas();
}
function desenharHome(){
  const n = reservas.filter(r => r.data === iso(hoje)).length;
  $("homeHoje").textContent = n ? n + (n===1 ? " reserva marcada para hoje." : " reservas marcadas para hoje.") : "Nenhuma reserva marcada para hoje.";
  const dia = reservas.filter(r => r.data === iso(hoje)).sort((a,b) => a.horario.localeCompare(b.horario));
  $("homeAgenda").innerHTML = dia.length
    ? dia.map(r => '<div class="ln"><span class="h">'+r.horario+'</span><span><strong>'+esc(r.espaco)+'</strong> · '+esc(r.turma)+' · '+esc(r.nome)+'</span></div>').join("")
    : '<div class="empty">Nenhum espaço reservado para hoje.</div>';
  $("homeEspacos").innerHTML = ESPACOS.map(e => "<li>"+e+"</li>").join("");
}
function desenharMinhas(){
  const box = $("minhasLista");
  const minhas = reservas.filter(r => r.cpf === sessao.cpf).sort((a,b) => (a.data+a.horario).localeCompare(b.data+b.horario));
  if(!minhas.length){
    box.innerHTML = '<div class="empty">Você ainda não reservou nenhum horário.<br><a href="#/reservas">Abrir o calendário</a></div>';
    return;
  }
  box.innerHTML = "";
  minhas.forEach(r => {
    const el = document.createElement("div");
    el.className = "slot mine";
    el.innerHTML = '<span class="t">'+daDataIso(r.data).toLocaleDateString(MESES_PT,{day:"2-digit",month:"short"})+'</span><span class="d"><strong>'+esc(r.espaco)+'</strong> · '+r.horario+' · '+esc(r.turma)+'</span>';
    const b = document.createElement("button");
    b.type = "button"; b.className = "btn danger"; b.textContent = "Cancelar";
    b.onclick = () => cancelar(r.id);
    el.appendChild(b);
    box.appendChild(el);
  });
}

/* ---------- Exibição de Professores e Senhas ---------- */
function desenharProf(){
  const box = $("profLista");
  box.innerHTML = "";
  autorizados.forEach(a => {
    const el = document.createElement("div");
    el.className = "slot mine";
    const coord = COORDENACAO.includes(a.cpf);

    // Busca a senha criada pelo próprio professor ao cadastrar conta
    const usuario = users.find(u => u.cpf === a.cpf);
    const senhaTexto = usuario ? usuario.senha : "Ainda não criou senha";

    el.innerHTML = '<span class="t">•••.•••.•••-' + a.cpf.slice(-2) + '</span>' +
                   '<span class="d"><strong>' + esc(a.nome || "Sem nome") + '</strong> ' +
                   '· Senha: <code>' + esc(senhaTexto) + '</code>' + 
                   (coord ? " · (Coordenação)" : "") + '</span>';

    if(!coord){
      const b = document.createElement("button");
      b.type = "button"; 
      b.className = "btn danger"; 
      b.textContent = "Remover";
      b.onclick = () => {
        autorizados = autorizados.filter(x => x.cpf !== a.cpf);
        store.set("cc_autorizados2", autorizados);
        desenharProf();
        aviso("Professor removido da lista.");
      };
      el.appendChild(b);
    }
    box.appendChild(el);
  });
}

$("cpfNovo").addEventListener("input", e => { e.target.value = formatarCpf(e.target.value); });
$("profForm").addEventListener("submit", e => {
  e.preventDefault();
  const cpf = soDigitos($("cpfNovo").value);
  const nome = $("nomeNovo").value.trim();
  const msg = $("profMsg");
  if(!cpfValido(cpf)){ msg.textContent = "CPF inválido. Confira os números."; return; }
  if(!nome){ msg.textContent = "Informe o nome do professor."; return; }
  if(autorizados.some(a => a.cpf === cpf)){ msg.textContent = "Este CPF já está na lista."; return; }
  autorizados.push({cpf, nome});
  store.set("cc_autorizados2", autorizados);
  msg.textContent = "";
  $("profForm").reset();
  desenharProf();
  aviso("Professor autorizado.");
});

function rota(){
  const h = location.hash.replace(/^#\/?/,"") || "inicio";
  const p = MAP[h] ? h : "inicio";
  if(PROTEGIDAS.includes(p) && !sessao){
    destino = p;
    mostrar("login", p === "minhas" ? "Entre para ver as suas reservas." : "Entre para acessar o calendário de reservas.");
    return;
  }
  if(p === "professores" && sessao && sessao.papel !== "coordenacao"){
    aviso("Esta página é exclusiva da coordenação.");
    location.hash = "#/reservas";
    return;
  }
  if(p === "login" && sessao){ location.hash = "#/reservas"; return; }
  mostrar(p);
}
window.addEventListener("hashchange", rota);

/* ---------- Fechar o login ---------- */
document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("auth").hidden) location.hash = "#/inicio"; });
let cliqueNoFundo = false;
$("auth").addEventListener("mousedown", e => { cliqueNoFundo = e.target === $("auth"); });
$("auth").addEventListener("click", e => {
  if(cliqueNoFundo && e.target === $("auth")) location.hash = "#/inicio";
  cliqueNoFundo = false;
});

/* ---------- Acessibilidade ---------- */
let fs = 100;
function aplicarFs(){ document.documentElement.style.setProperty("--fs", fs + "%"); }
$("aMais").onclick = () => { fs = Math.min(130, fs + 10); aplicarFs(); };
$("aMenos").onclick = () => { fs = Math.max(90, fs - 10); aplicarFs(); };
function aplicarContraste(on){
  document.documentElement.dataset.theme = on ? "dark" : "light";
  $("contraste").setAttribute("aria-pressed", on);
  store.set("cc_contraste", on);
}
$("contraste").onclick = () => aplicarContraste($("contraste").getAttribute("aria-pressed") !== "true");
aplicarContraste(store.get("cc_contraste", false));

atualizarHeader();
rota();

document.addEventListener('DOMContentLoaded', () => {
  const btnMais = document.getElementById('aMais');
  const btnMenos = document.getElementById('aMenos');
  
  let percentualFonte = 100; // Nível base em percentagem

  if (btnMais) {
    btnMais.addEventListener('click', () => {
      if (percentualFonte < 150) { // Limite máximo
        percentualFonte += 10;
        document.documentElement.style.fontSize = `${percentualFonte}%`;
      }
    });
  }

  if (btnMenos) {
    btnMenos.addEventListener('click', () => {
      if (percentualFonte > 70) { // Limite mínimo
        percentualFonte -= 10;
        document.documentElement.style.fontSize = `${percentualFonte}%`;
      }
    });
  }
});