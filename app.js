const API = 'http://localhost:8080/clientes'; // ✅ CORRIGIDO

let todosClientes = [];
let filtroAtivo = 'todos';
let idEditando = null;
let idRemovendo = null;

document.addEventListener('DOMContentLoaded', () => {
  carregarClientes();
  configurarAbas();
  configurarBusca();
  configurarMascaraTelefone();
});

async function carregarClientes() {
  mostrarEstado('loading');
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    todosClientes = await res.json();
    renderizar();
    atualizarStats();
  } catch {
    document.getElementById('loading').textContent =
      'Erro ao conectar com a API. Verifique se o backend está rodando.';
  }
}

async function salvar() {
  if (!validarFormulario()) return;

  const btn = document.getElementById('btn-salvar');
  btn.classList.add('loading');
  btn.disabled = true;

  const payload = {
    nome: document.getElementById('f-nome').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    telefone: document.getElementById('f-tel').value.trim() || null,
  };

  const url = idEditando ? `${API}/${idEditando}` : API;
  const method = idEditando ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast(idEditando ? 'Cliente atualizado' : 'Cliente cadastrado');
      fecharForm();
      carregarClientes();
    } else {
      const msg = await res.text();
      toast(msg || 'Erro ao salvar', true);
    }
  } catch {
    toast('Erro de conexão', true);
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

async function confirmarRemocao() {
  fecharModal();
  try {
    await fetch(`${API}/${idRemovendo}`, { method: 'DELETE' });
    toast('Cliente removido');
    carregarClientes();
  } catch {
    toast('Erro ao remover', true);
  }
}

function renderizar() {
  const busca = document.getElementById('busca').value.toLowerCase().trim();

  let lista = [...todosClientes];

  if (filtroAtivo === 'telefone') {
    lista = lista.filter(c => c.telefone);
  } else if (filtroAtivo === 'recentes') {
    lista = lista.slice(0, 5);
  }

  if (busca) {
    lista = lista.filter(c =>
      c.nome.toLowerCase().includes(busca) ||
      c.email.toLowerCase().includes(busca)
    );
  }

  const loading = document.getElementById('loading');
  const tabela = document.getElementById('tabela');
  const empty = document.getElementById('empty');
  const tbody = document.getElementById('tbody');

  loading.style.display = 'none';

  if (!lista.length) {
    tabela.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tabela.style.display = 'table';

  tbody.innerHTML = lista.map(c => {
    const iniciais = c.nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

    return `
      <tr>
        <td>
          <div class="name-cell">
            <div class="avatar">${iniciais}</div>
            <div>
              <div class="name-main">${c.nome}</div>
              <div class="name-email">${c.email}</div>
            </div>
          </div>
        </td>
        <td class="phone-cell">${c.telefone || '<span style="color:var(--text-3)">—</span>'}</td>
        <td class="date-cell">—</td>
        <td>
          <div class="actions-cell">
            <button class="btn-row-edit" onclick="abrirEdicao(${c.id})">Editar</button>
            <button class="btn-row-del" onclick="abrirModal(${c.id}, '${c.nome.replace(/'/g, "\\'")}')">Remover</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function atualizarStats() {
  document.getElementById('stat-total').textContent = todosClientes.length;
  document.getElementById('stat-tel').textContent =
    todosClientes.filter(c => c.telefone).length;
  document.getElementById('stat-mes').textContent = '—';
}

function abrirForm() {
  idEditando = null;
  document.getElementById('drawer-title').textContent = 'Novo cliente';
  document.getElementById('btn-label').textContent = 'Cadastrar';
  limparFormulario();
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

async function abrirEdicao(id) {
  idEditando = id;

  const cliente = todosClientes.find(c => c.id === id);
  if (!cliente) return;

  document.getElementById('f-nome').value = cliente.nome;
  document.getElementById('f-email').value = cliente.email;
  document.getElementById('f-tel').value = cliente.telefone || '';

  document.getElementById('drawer-title').textContent = 'Editar cliente';
  document.getElementById('btn-label').textContent = 'Salvar alterações';
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

function fecharForm() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  limparFormulario();
  idEditando = null;
}

function limparFormulario() {
  ['f-nome', 'f-email', 'f-tel'].forEach(id => {
    document.getElementById(id).value = '';
    document.getElementById(id).classList.remove('has-error');
  });
  document.getElementById('err-nome').classList.remove('visible');
  document.getElementById('err-email').classList.remove('visible');
}

function validarFormulario() {
  let ok = true;
  const nome = document.getElementById('f-nome').value.trim();
  const email = document.getElementById('f-email').value.trim();

  if (!nome) ok = false;
  if (!email) ok = false;

  return ok;
}

function abrirModal(id, nome) {
  idRemovendo = id;
  document.getElementById('modal-sub').textContent = `Remover "${nome}"?`;
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('btn-confirmar').onclick = confirmarRemocao;
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function configurarAbas() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      filtroAtivo = this.dataset.filter;
      renderizar();
    });
  });
}

function configurarBusca() {
  document.getElementById('busca').addEventListener('input', renderizar);
}

function configurarMascaraTelefone() {
  document.getElementById('f-tel').addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    this.value = v;
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function mostrarEstado(estado) {
  document.getElementById('loading').style.display = estado === 'loading' ? 'block' : 'none';
  document.getElementById('tabela').style.display = 'none';
  document.getElementById('empty').style.display = 'none';
}