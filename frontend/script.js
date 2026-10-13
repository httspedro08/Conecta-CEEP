/* ---------- Configuração ---------- */
const API_URL = "http://localhost:5000";

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

const TURNOS = {
  matutino: [
    "07:10 - 08:00",
    "08:00 - 08:50",
    "08:50 - 09:40",
    "09:55 - 10:45",
    "10:45 - 11:35",
    "11:35 - 12:25"
  ],
  vespertino: [
    "13:10 - 14:00",
    "14:00 - 14:50",
    "14:50 - 15:40",
    "15:55 - 16:45",
    "16:45 - 17:35",
    "17:35 - 18:25"
  ],
  noturno: [
    "18:40 - 19:30",
    "19:30 - 20:20",
    "20:30 - 21:20",
    "21:20 - 22:10",
    "22:10 - 23:00"
  ]
};
const HORARIOS = Object.values(TURNOS).flat();
const MESES_PT = "pt-BR";

const store = {
  get(k, fallback){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};

let reservas = [];
let autorizados = [];
let sessao = store.get("cc_sessao2", null);

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

async function carregarDadosAPI(){
  try {
    const resReservas = await fetch(API_URL + "/reservas");
    if(resReservas.ok) reservas = await resReservas.json();

    const resProf = await fetch(API_URL + "/professores");
    if(resProf.ok) autorizados = await resProf.json();
  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
  }
}

const hoje = new Date();
let view = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
let selecionado = iso(hoje);
let modo = "in";
let pendente = null;
let turnoAtual = "matutino";

const $ = id => document.getElementById(id);
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function daDataIso(s){ const [a,m,d] = s.split("-").map(Number); return new Date(a, m-1, d); }
let toastT;
function aviso(msg){ const t = $("toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 3200); }
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function mesmoEspaco(a, b){ return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); }
function mesmoHorario(a, b){ return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); }

function horarioJaComecou(dataIso, horario){
  const agora = new Date();
  const hojeAtual = iso(agora);
  if(dataIso < hojeAtual) return true;
  if(dataIso > hojeAtual) return false;
  const inicio = String(horario).match(/(\d{2}):(\d{2})/);
  if(!inicio) return false;
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const minutosInicio = Number(inicio[1]) * 60 + Number(inicio[2]);
  return minutosAgora >= minutosInicio;
}

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
  const nome = $("fName").value.trim().replace(/\s+/g, " ");

  if(!cpf || !senha){ erro("Preencha CPF e senha."); return; }
  if(!cpfValido(cpf)){ erro("CPF inválido. Confira os números."); return; }

  $("authBtn").disabled = true;
  
  try {
    if(modo === "up"){
      if(!nome || nome.split(" ").filter(Boolean).length < 2){ 
        erro("Por favor, digite seu primeiro e segundo nome."); 
        $("authBtn").disabled = false;
        return; 
      }
      if(senha.length < 4){ erro("A senha precisa ter pelo menos 4 caracteres."); $("authBtn").disabled = false; return; }

      const resposta = await fetch(API_URL + "/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf, nome: nome, senha: senha })
      });
      const dados = await resposta.json();

      if(!resposta.ok){
        erro(dados.erro || "Erro ao criar conta.");
        $("authBtn").disabled = false;
        return;
      }
      sessao = { nome: nome, cpf: cpf, papel: dados.papel };
    } else {
      const resposta = await fetch(API_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpf, senha: senha })
      });
      const dados = await resposta.json();

      if(!resposta.ok){
        erro(dados.erro || "CPF ou senha incorretos.");
        $("authBtn").disabled = false;
        return;
      }
      sessao = dados.usuario;
    }

    store.set("cc_sessao2", sessao);
    const vai = destino || "reservas"; destino = null;
    $("authForm").reset();
    atualizarHeader();
    aviso("Bem-vindo(a), " + sessao.nome.split(" ")[0] + ".");
    location.hash = "#/" + vai;
    rota();
  } catch (err) {
    erro("Não foi possível conectar ao servidor.");
  } finally {
    $("authBtn").disabled = false;
  }
});

$("logout").onclick = () => { sessao = null; store.set("cc_sessao2", null); atualizarHeader(); aviso("Você saiu da sua conta."); location.hash = "#/inicio"; rota(); };

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
function mudarMes(delta){
  view = new Date(view.getFullYear(), view.getMonth() + delta, 1);
  selecionado = iso(view);
  desenharCalendario();
  desenharPainel();
}
$("prev").onclick = () => mudarMes(-1);
$("next").onclick = () => mudarMes(1);

function desenharPainel(){
  const data = daDataIso(selecionado);
  $("dayTitle").textContent = data.toLocaleDateString(MESES_PT, {weekday:"long", day:"numeric", month:"long"});
  const espaco = $("space").value;
  $("overview").innerHTML = "";
  ESPACOS.forEach(e => {
    const n = reservas.filter(r => r.data === selecionado && mesmoEspaco(r.espaco, e)).length;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", e === espaco);
    b.innerHTML = e + " <b>" + n + "/" + HORARIOS.length + "</b>";
    b.onclick = () => { $("space").value = e; desenharPainel(); };
    $("overview").appendChild(b);
  });
  const lista = reservas.filter(r => r.data === selecionado && mesmoEspaco(r.espaco, espaco));
  const horariosTurno = TURNOS[turnoAtual];
  const reservasTurno = lista.filter(r => horariosTurno.some(h => mesmoHorario(h, r.horario)));
  const livres = horariosTurno.length - reservasTurno.length;
  $("daySub").textContent = livres + " de " + horariosTurno.length + " horários livres no turno " + turnoAtual + " em " + espaco + ".";
  $("turno").value = turnoAtual;
  const box = $("slots"); box.innerHTML = "";
  const wd = data.getDay();
  const motivo = selecionado < iso(hoje) ? "Esta data já passou. Escolha uma data a partir de hoje." : (wd === 0 || wd === 6) ? "Não há aulas aos sábados e domingos." : "";
  if(motivo){ $("daySub").textContent = espaco; box.innerHTML = '<div class="empty">' + motivo + '</div>'; return; }
  horariosTurno.forEach(h => {
    const r = lista.find(x => mesmoHorario(x.horario, h));
    const el = document.createElement("button");
    el.type = "button";
    if(!r){
      el.className = "slot free";
      el.innerHTML = '<span class="t">'+h+'</span><span class="d">Livre</span><strong>Reservar</strong>';
      el.onclick = () => abrirReserva(h);
    } else if(sessao && soDigitos(r.cpf) === soDigitos(sessao.cpf)){
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
$("turno").onchange = () => {
  turnoAtual = $("turno").value;
  desenharPainel();
};

function abrirReserva(h){
  pendente = h;
  $("dlgInfo").textContent = $("space").value + " · " + daDataIso(selecionado).toLocaleDateString(MESES_PT,{day:"numeric",month:"long"}) + " · " + h;
  $("turma").value = ""; $("dlgMsg").textContent = "";
  $("dlg").showModal();
  $("turma").focus();
}
$("dlgCancel").onclick = () => $("dlg").close();
$("dlgOk").onclick = async () => {
  const turma = $("turma").value.trim();
  if(!turma){ $("dlgMsg").textContent = "Diga a turma ou a atividade."; return; }
  if(!sessao || !sessao.cpf){ $("dlgMsg").textContent = "Sua sessão expirou. Entre novamente."; return; }
  const espaco = $("space").value;
  const data = daDataIso(selecionado);

  if(selecionado < iso(new Date())){
    $("dlgMsg").textContent = "Não é possível reservar uma data que já passou."; return;
  }
  if(data.getDay() === 0 || data.getDay() === 6){
    $("dlgMsg").textContent = "Não é possível reservar sábados ou domingos."; return;
  }
  if(horarioJaComecou(selecionado, pendente)){
    $("dlgMsg").textContent = "Esse horário já começou ou terminou."; return;
  }

  const novaReserva = {
    id: Date.now()+"-"+Math.random().toString(36).slice(2,8),
    data: selecionado,
    espaco: espaco,
    horario: pendente,
    cpf: soDigitos(sessao.cpf),
    nome: sessao.nome,
    turma: turma
  };

  try {
    const resposta = await fetch(API_URL + "/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaReserva)
    });
    const dados = await resposta.json();

    if(!resposta.ok){
      $("dlgMsg").textContent = dados.erro || "Erro ao realizar reserva.";
      return;
    }

    await carregarDadosAPI();
    $("dlg").close();
    desenharCalendario(); 
    desenharPainel();
    aviso("Reserva confirmada: " + espaco + ", " + pendente + ".");
  } catch (err) {
    $("dlgMsg").textContent = "Erro ao conectar com o servidor.";
  }
};

async function cancelar(id){
  if(!confirm("Cancelar esta reserva?")) return;
  try {
    const resposta = await fetch(API_URL + "/reservas/" + id, { method: "DELETE" });
    if(resposta.ok){
      await carregarDadosAPI();
      desenharAtual();
      aviso("Reserva cancelada.");
    } else {
      aviso("Erro ao cancelar a reserva.");
    }
  } catch (err) {
    aviso("Erro ao conectar com o servidor.");
  }
}

["D","S","T","Q","Q","S","S"].forEach(l => { const s = document.createElement("div"); s.className="dow"; s.textContent=l; $("dows").appendChild(s); });
$("space").innerHTML = ESPACOS.map(e => "<option>"+e+"</option>").join("");

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

async function mostrar(p, avisoTxt){
  await carregarDadosAPI();
  Object.keys(MAP).forEach(n => { $(MAP[n]).hidden = n !== p && !(p === "login" && n === "inicio"); });
  document.body.style.overflow = p === "login" ? "hidden" : "";
  if(p === "login") setTimeout(() => $(modo === "up" ? "fName" : "fCpf").focus(), 80);
  document.querySelectorAll("#nav a").forEach(a => {
    if(a.dataset.p === p) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
  if(p === "login") $("authNote").textContent = avisoTxt || "Acesso exclusivo para professores autorizados. Entre com o seu CPF.";
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
  if(!sessao) return;
  const minhas = reservas.filter(r => soDigitos(r.cpf) === soDigitos(sessao.cpf)).sort((a,b) => (a.data+a.horario).localeCompare(b.data+b.horario));
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

function desenharProf(){
  const box = $("profLista");
  box.innerHTML = "";
  autorizados.forEach(a => {
    const el = document.createElement("div");
    el.className = "slot mine";
    const coord = ['10754772985', '09082967979', '12616379929'].includes(soDigitos(a.cpf));

    el.innerHTML = '<span class="t">•••.•••.•••-' + esc(String(a.cpf).slice(-2)) + '</span>' +
                   '<span class="d"><strong>' + esc(a.nome || "Sem nome") + '</strong>' + (coord ? " · (Coordenação)" : "") + '</span>';

    if(!coord){
      const b = document.createElement("button");
      b.type = "button"; 
      b.className = "btn danger"; 
      b.textContent = "Remover";
      b.onclick = async () => {
        try {
          const res = await fetch(API_URL + "/professores/" + soDigitos(a.cpf), { method: "DELETE" });
          if(res.ok){
            await carregarDadosAPI();
            desenharProf();
            aviso("Professor removido e acesso revogado.");
          }
        } catch (err) {
          aviso("Erro ao conectar com o servidor.");
        }
      };
      el.appendChild(b);
    }
    box.appendChild(el);
  });
}

$("cpfNovo").addEventListener("input", e => { e.target.value = formatarCpf(e.target.value); });
$("profForm").addEventListener("submit", async e => {
  e.preventDefault();
  const cpf = soDigitos($("cpfNovo").value);
  const nome = $("nomeNovo").value.trim().replace(/\s+/g, " ");
  const msg = $("profMsg");
  if(!cpfValido(cpf)){ msg.textContent = "CPF inválido. Confira os números."; return; }
  if(!nome){ msg.textContent = "Informe o nome do professor."; return; }

  try {
    const resposta = await fetch(API_URL + "/professores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: cpf, nome: nome })
    });
    const dados = await resposta.json();

    if(!resposta.ok){
      msg.textContent = dados.erro || "Erro ao autorizar professor.";
      return;
    }

    msg.textContent = "";
    $("profForm").reset();
    await carregarDadosAPI();
    desenharProf();
    aviso("Professor autorizado.");
  } catch (err) {
    msg.textContent = "Erro de conexão com a API.";
  }
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

document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("auth").hidden) location.hash = "#/inicio"; });
let cliqueNoFundo = false;
$("auth").addEventListener("mousedown", e => { cliqueNoFundo = e.target === $("auth"); });
$("auth").addEventListener("click", e => {
  if(cliqueNoFundo && e.target === $("auth")) location.hash = "#/inicio";
  cliqueNoFundo = false;
});

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
carregarDadosAPI().then(() => rota());