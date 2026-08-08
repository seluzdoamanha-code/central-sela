let currentTab = 'pendentes';
let currentDia = '';
let dataFull = [];
let editandoId = null;

const diasSemanaList = [
    'Todos', 'Segunda-feira', 'Terça-feira', 
    'Quarta-feira (Desobsessão)', 'Quarta-feira (Desencarnado)', 
    'Quinta-feira'
];

document.addEventListener('DOMContentLoaded', () => {
    carregarLista();
});

function mudarAba(aba) {
    currentTab = aba;
    
    // Atualizar UI das abas
    document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab_${aba}`).classList.add('active');
    
    carregarLista();
}

function setDia(dia) {
    currentDia = dia;
    
    // Atualizar UI dos filtros
    document.querySelectorAll('.m-filter-pill').forEach(p => p.classList.remove('active'));
    
    if (dia === '') {
        document.getElementById('pill_todos').classList.add('active');
    } else {
        const p = document.getElementById(`pill_${formatDiaId(dia)}`);
        if(p) p.classList.add('active');
    }
    
    renderLista();
}

function formatDiaId(dia) {
    if (dia === 'Segunda-feira') return 'segunda';
    if (dia === 'Terça-feira') return 'terca';
    if (dia === 'Quarta-feira (Desobsessão)') return 'qua_desob';
    if (dia === 'Quarta-feira (Desencarnado)') return 'qua_desenc';
    if (dia === 'Quinta-feira') return 'quinta';
    return '';
}

async function carregarLista() {
    const listaEl = document.getElementById('listaGestaoIrradiacoes');
    listaEl.innerHTML = '<div class="empty-state">Carregando dados...</div>';
    
    const estruturaId = localStorage.getItem('estrutura_atual');
    
    try {
        let query = db.from('app_irradiacao_solicitacoes').select('*');
        if (estruturaId) {
            query = query.eq('estrutura_id', estruturaId);
        }
        
        let targetStatus = currentTab;
        if (currentTab === 'ativos') targetStatus = 'ativo';
        if (currentTab === 'pendentes') targetStatus = 'pendente';
        
        query = query.eq('status', targetStatus).order('nome_solicitado', { ascending: true });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        dataFull = data || [];
        atualizarContadores(dataFull);
        renderLista();
        
    } catch (err) {
        console.error(err);
        listaEl.innerHTML = `<div class="empty-state" style="color:var(--danger)">Erro ao carregar os dados.<br>${err.message}</div>`;
    }
}

function atualizarContadores(dados) {
    let counts = {
        'Todos': dados.length,
        'Segunda-feira': 0,
        'Terça-feira': 0,
        'Quarta-feira (Desobsessão)': 0,
        'Quarta-feira (Desencarnado)': 0,
        'Quinta-feira': 0
    };
    
    dados.forEach(item => {
        const d = item.dias_semana || '';
        if (d.includes('Segunda-feira')) counts['Segunda-feira']++;
        if (d.includes('Terça-feira')) counts['Terça-feira']++;
        if (d.includes('Quarta-feira (Desobsessão)')) counts['Quarta-feira (Desobsessão)']++;
        if (d.includes('Quarta-feira (Desencarnado)')) counts['Quarta-feira (Desencarnado)']++;
        if (d.includes('Quinta-feira')) counts['Quinta-feira']++;
    });
    
    document.getElementById('count_Todos').innerText = `(${counts['Todos']})`;
    document.getElementById('count_Segunda-feira').innerText = `(${counts['Segunda-feira']})`;
    document.getElementById('count_Terça-feira').innerText = `(${counts['Terça-feira']})`;
    document.getElementById('count_Quarta-feira (Desobsessão)').innerText = `(${counts['Quarta-feira (Desobsessão)']})`;
    document.getElementById('count_Quarta-feira (Desencarnado)').innerText = `(${counts['Quarta-feira (Desencarnado)']})`;
    document.getElementById('count_Quinta-feira').innerText = `(${counts['Quinta-feira']})`;
}

function renderLista() {
    const listaEl = document.getElementById('listaGestaoIrradiacoes');
    
    let filtered = dataFull;
    if (currentDia !== '') {
        filtered = dataFull.filter(item => (item.dias_semana || '').includes(currentDia));
    }
    
    if (filtered.length === 0) {
        listaEl.innerHTML = '<div class="empty-state">Nenhum registro encontrado nesta visão.</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(item => {
        const dataPed = new Date(item.criado_em).toLocaleDateString('pt-BR');
        const endStr = item.endereco ? item.endereco : 'Endereço não informado';
        
        // Escape para botões
        const safeNome = (item.nome_solicitado || '').replace(/'/g, "\\'");
        const safeEnd = (item.endereco || '').replace(/'/g, "\\'");
        const safeDias = (item.dias_semana || '').replace(/'/g, "\\'");
        const semanasAlvoStr = item.semanas_alvo || 4;
        
        let actions = '';
        if (currentTab === 'pendentes') {
            actions = `
                <button class="btn-action btn-primary" onclick="aprovar('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}')">Triagem ✔️</button>
                <button class="btn-action btn-secondary" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})">Editar ✏️</button>
                <button class="btn-action btn-danger" onclick="excluir('${item.id}')">Excluir</button>
            `;
        } else if (currentTab === 'ativos') {
            actions = `
                <button class="btn-action btn-secondary" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})">Editar ✏️</button>
                <button class="btn-action btn-danger" onclick="arquivar('${item.id}')">Forçar Arquivamento</button>
            `;
        } else if (currentTab === 'historico') {
            actions = `
                <button class="btn-action btn-primary" onclick="aprovar('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}')">Reativar ♻️</button>
                <button class="btn-action btn-secondary" onclick="abrirEdicao('${item.id}', '${safeNome}', '${safeEnd}', '${safeDias}', ${semanasAlvoStr})">Editar ✏️</button>
                <button class="btn-action btn-danger" onclick="excluir('${item.id}')">Excluir</button>
            `;
        }
        
        let badge = '';
        if (currentTab === 'ativos' && item.semanas_alvo) {
            let left = item.semanas_alvo - (item.leituras || 0);
            if (left < 0) left = 0;
            badge = `<div style="font-size: 11px; background: rgba(16, 185, 129, 0.2); color: var(--accent); padding: 2px 6px; border-radius: 4px;">Faltam ${left} semanas</div>`;
        }
        
        html += `
            <div class="m-card">
                <div class="m-card-header">
                    <div>
                        <div class="m-card-title">${item.nome_solicitado}</div>
                        <div class="m-card-subtitle">📍 ${endStr}</div>
                    </div>
                    ${badge}
                </div>
                <div class="m-card-meta">
                    Criado em: ${dataPed} | Dias: <strong style="color: var(--text-main);">${item.dias_semana}</strong>
                </div>
                <div class="m-card-actions">
                    ${actions}
                </div>
            </div>
        `;
    });
    
    listaEl.innerHTML = html;
}

// ----------------------------------------------------
// BOTTOM SHEET (EDICAO)
// ----------------------------------------------------
function abrirEdicao(id, nome, end, dias, semanas) {
    editandoId = id;
    document.getElementById('editId').value = id;
    document.getElementById('editNome').value = nome;
    document.getElementById('editEnd').value = end;
    document.getElementById('editSemanasRestantes').value = semanas;
    
    // Marcar tags corretas
    document.querySelectorAll('.edit-tag').forEach(tag => {
        if (dias.includes(tag.getAttribute('data-val'))) {
            tag.classList.add('selected');
        } else {
            tag.classList.remove('selected');
        }
    });
    
    document.getElementById('bsOverlay').classList.add('active');
    document.getElementById('bsEdicao').classList.add('active');
}

function fecharBottomSheet() {
    document.getElementById('bsOverlay').classList.remove('active');
    document.getElementById('bsEdicao').classList.remove('active');
    editandoId = null;
}

function toggleEditTag(el) {
    el.classList.toggle('selected');
}

async function salvarEdicao() {
    if (!editandoId) return;
    
    const nome = document.getElementById('editNome').value.trim().toUpperCase();
    const end = document.getElementById('editEnd').value.trim().toUpperCase();
    
    let diasArr = [];
    document.querySelectorAll('.edit-tag.selected').forEach(tag => {
        diasArr.push(tag.getAttribute('data-val'));
    });
    
    if (diasArr.length === 0) {
        alert('Selecione ao menos um dia!');
        return;
    }
    
    if (!nome) {
        alert('Nome obrigatório!');
        return;
    }
    
    const diasStr = diasArr.join(', ');
    
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .update({
                nome_solicitado: nome,
                endereco: end,
                dias_semana: diasStr
            })
            .eq('id', editandoId);
            
        if (error) throw error;
        
        fecharBottomSheet();
        carregarLista(); // recarrega e atualiza UI
        
    } catch (err) {
        alert('Erro ao salvar: ' + err.message);
    }
}


// ----------------------------------------------------
// ACOES DIRETAS (Triagem, Excluir, Arquivar)
// ----------------------------------------------------
async function aprovar(id, nome, end, dias) {
    if(!confirm(`Mover '${nome}' para o Painel de Leitura (Ativo)?`)) return;
    
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .update({ status: 'ativo', leituras: 0 })
            .eq('id', id);
        if (error) throw error;
        carregarLista();
    } catch (err) {
        alert('Erro ao aprovar: ' + err.message);
    }
}

async function excluir(id) {
    if(!confirm('Tem certeza que deseja excluir esta solicitação permanentemente?')) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .delete().eq('id', id);
        if (error) throw error;
        carregarLista();
    } catch (err) {
        alert('Erro ao excluir: ' + err.message);
    }
}

async function arquivar(id) {
    if(!confirm('Forçar arquivamento (mover para histórico)?')) return;
    try {
        const { error } = await db.from('app_irradiacao_solicitacoes')
            .update({ status: 'historico' }).eq('id', id);
        if (error) throw error;
        carregarLista();
    } catch (err) {
        alert('Erro ao arquivar: ' + err.message);
    }
}
