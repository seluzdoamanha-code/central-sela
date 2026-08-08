const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    loadMetas();
    loadCestas();
});

// UI TABS
function switchTab(tabId) {
    document.querySelectorAll('.m-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.m-config-section').forEach(s => s.classList.remove('active'));
    
    if (tabId === 'metas') {
        document.querySelectorAll('.m-tab-btn')[0].classList.add('active');
        document.getElementById('sec-metas').classList.add('active');
    } else {
        document.querySelectorAll('.m-tab-btn')[1].classList.add('active');
        document.getElementById('sec-cestas').classList.add('active');
    }
}

// ==============================
// METAS
// ==============================
async function loadMetas() {
    const { data, error } = await db.from('ass_metas').select('*').order('ano', { ascending: false }).order('titulo');
    const container = document.getElementById('metasList');
    
    if (error) {
        console.error(error);
        container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar metas.</p>`;
        return;
    }
    
    if (data.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top: 40px;">Nenhuma meta cadastrada.</p>`;
        return;
    }
    
    container.innerHTML = data.map(m => `
        <div class="m-list-item">
            <div class="m-list-content">
                <h4 class="m-list-title">${m.titulo}</h4>
                <p class="m-list-desc">Ano: ${m.ano} | Chave: ${m.chave}</p>
                <span class="m-list-badge" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">Meta: ${m.valor}</span>
            </div>
            <div class="m-list-actions">
                <button class="m-action-btn" onclick="editarMeta('${m.id}')" style="color: #60a5fa;">✏️</button>
                <button class="m-action-btn" onclick="excluirMeta('${m.id}')" style="color: #ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}

function abrirModalMeta() {
    document.getElementById('inpMetaId').value = '';
    document.getElementById('inpMetaTitulo').value = '';
    document.getElementById('inpMetaChave').value = '';
    document.getElementById('inpMetaValor').value = '';
    document.getElementById('inpMetaAno').value = new Date().getFullYear();
    document.getElementById('modalMetaTitle').innerText = 'Nova Meta';
    document.getElementById('modalMetaOverlay').classList.add('active');
}

async function editarMeta(id) {
    const { data, error } = await db.from('ass_metas').select('*').eq('id', id).single();
    if (!error && data) {
        document.getElementById('inpMetaId').value = data.id;
        document.getElementById('inpMetaTitulo').value = data.titulo;
        document.getElementById('inpMetaChave').value = data.chave;
        document.getElementById('inpMetaValor').value = data.valor;
        document.getElementById('inpMetaAno').value = data.ano;
        document.getElementById('modalMetaTitle').innerText = 'Editar Meta';
        document.getElementById('modalMetaOverlay').classList.add('active');
    }
}

async function salvarMeta() {
    const id = document.getElementById('inpMetaId').value;
    const payload = {
        titulo: document.getElementById('inpMetaTitulo').value,
        chave: document.getElementById('inpMetaChave').value,
        valor: document.getElementById('inpMetaValor').value || 0,
        ano: document.getElementById('inpMetaAno').value || new Date().getFullYear()
    };
    
    if (!payload.titulo || !payload.chave) {
        Swal.fire('Atenção', 'Título e chave são obrigatórios.', 'warning');
        return;
    }
    
    let error;
    if (id) {
        const res = await db.from('ass_metas').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await db.from('ass_metas').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        Swal.fire('Erro', 'Não foi possível salvar.', 'error');
    } else {
        fecharModal('modalMetaOverlay');
        Swal.fire({title: 'Sucesso', icon: 'success', toast: true, position: 'top', showConfirmButton: false, timer: 2000});
        loadMetas();
    }
}

async function excluirMeta(id) {
    if(confirm('Deseja excluir esta meta?')) {
        await db.from('ass_metas').delete().eq('id', id);
        loadMetas();
    }
}

// ==============================
// CESTAS
// ==============================
async function loadCestas() {
    const { data, error } = await db.from('ass_cestas_modelos').select('*').order('codigo');
    const container = document.getElementById('cestasList');
    
    if (error) {
        container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar cestas.</p>`;
        return;
    }
    
    if (data.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; margin-top: 40px;">Nenhum modelo cadastrado.</p>`;
        return;
    }
    
    container.innerHTML = data.map(c => {
        // Here we map "Ativo" from db to "Ativa" for display (since we are fixing it in PC now, they might be saved as "Ativo" or "Ativa")
        const isAtiva = c.status === 'Ativa' || c.status === 'Ativo';
        const badgeCls = isAtiva ? 'badge-ativa' : 'badge-inativa';
        const badgeTxt = isAtiva ? 'Ativa' : 'Inativa';
        
        return `
        <div class="m-list-item">
            <div class="m-list-content">
                <h4 class="m-list-title">${c.codigo} - ${c.tipo}</h4>
                <p class="m-list-desc">${c.descricao || 'Sem descrição'}</p>
                <span class="m-list-badge ${badgeCls}">${badgeTxt}</span>
            </div>
            <div class="m-list-actions">
                <button class="m-action-btn" onclick="editarCesta('${c.id}')" style="color: #60a5fa;">✏️</button>
                <!-- Omitimos exclusao complexa no mobile pra simplificar. So inativa. -->
            </div>
        </div>
        `;
    }).join('');
}

function abrirModalCesta() {
    document.getElementById('inpCestaId').value = '';
    document.getElementById('inpCestaCodigo').value = '';
    document.getElementById('inpCestaTipo').value = '';
    document.getElementById('inpCestaDesc').value = '';
    document.getElementById('inpCestaStatus').value = 'Ativa';
    document.getElementById('modalCestaTitle').innerText = 'Novo Modelo';
    document.getElementById('modalCestaOverlay').classList.add('active');
}

async function editarCesta(id) {
    const { data, error } = await db.from('ass_cestas_modelos').select('*').eq('id', id).single();
    if (!error && data) {
        document.getElementById('inpCestaId').value = data.id;
        document.getElementById('inpCestaCodigo').value = data.codigo;
        document.getElementById('inpCestaTipo').value = data.tipo;
        document.getElementById('inpCestaDesc').value = data.descricao;
        
        // normaliza pra Ativa se vier Ativo
        let st = data.status;
        if(st === 'Ativo') st = 'Ativa';
        if(st === 'Inativo') st = 'Inativa';
        
        document.getElementById('inpCestaStatus').value = st;
        
        document.getElementById('modalCestaTitle').innerText = 'Editar Modelo';
        document.getElementById('modalCestaOverlay').classList.add('active');
    }
}

async function salvarCesta() {
    const id = document.getElementById('inpCestaId').value;
    const payload = {
        codigo: document.getElementById('inpCestaCodigo').value,
        tipo: document.getElementById('inpCestaTipo').value,
        descricao: document.getElementById('inpCestaDesc').value,
        status: document.getElementById('inpCestaStatus').value
    };
    
    if (!payload.codigo || !payload.tipo) {
        Swal.fire('Atenção', 'Código e tipo são obrigatórios.', 'warning');
        return;
    }
    
    let error;
    if (id) {
        const res = await db.from('ass_cestas_modelos').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await db.from('ass_cestas_modelos').insert([payload]);
        error = res.error;
    }
    
    if (error) {
        Swal.fire('Erro', 'Não foi possível salvar a cesta.', 'error');
    } else {
        fecharModal('modalCestaOverlay');
        Swal.fire({title: 'Sucesso', icon: 'success', toast: true, position: 'top', showConfirmButton: false, timer: 2000});
        loadCestas();
    }
}

// UTILS
function fecharModal(id) {
    document.getElementById(id).classList.remove('active');
}
