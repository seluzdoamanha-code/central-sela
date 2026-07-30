const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const estruturaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!estruturaId) {
        alert("ID da estrutura não fornecido!");
        window.location.href = 'entidade.html';
        return;
    }

    await carregarDadosEstrutura();
    configurarAbas();
    
    // Iniciar Aba de Documentos
    await carregarDocumentos();
    await popularSelectDepartamentos();
    
    // Formulario de Documentos
    document.getElementById('formDoc').addEventListener('submit', salvarDocumento);
});

async function carregarDadosEstrutura() {
    try {
        const { data, error } = await db.from('estruturas').select('*').eq('id', estruturaId).single();
        if (error) throw error;
        
        if (data) {
            document.getElementById('hubName').textContent = data.nome;
            document.getElementById('hubType').textContent = data.tipo;
        }
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('hubContent').style.display = 'block';
    } catch (err) {
        console.error("Erro ao carregar estrutura:", err);
        document.getElementById('loadingState').textContent = "Erro ao carregar dados. Verifique sua conexão.";
    }
}

function configurarAbas() {
    const botoes = document.querySelectorAll('.tab-btn');
    const conteudos = document.querySelectorAll('.tab-content');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('active'));
            conteudos.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

window.abrirOrganograma = function() {
    window.location.href = `organograma.html?id=${estruturaId}`;
};

// ==========================================
// MÓDULO DE DOCUMENTOS
// ==========================================

async function carregarDocumentos() {
    const listLocais = document.getElementById('listDocsLocais');
    const listOficiais = document.getElementById('listDocsOficiais');
    
    listLocais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    listOficiais.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        // 1. Buscar Documentos Locais (Dono é a estrutura atual)
        const { data: locais, error: errLocais } = await db
            .from('documentos')
            .select('*')
            .eq('estrutura_id', estruturaId);
            
        // 2. Buscar Documentos Herdados (A estrutura atual está na tabela de visibilidade)
        const { data: visibilidade, error: errVis } = await db
            .from('documentos_visibilidade')
            .select('documento_id')
            .eq('estrutura_id', estruturaId);
            
        let herdados = [];
        if (visibilidade && visibilidade.length > 0) {
            const docIds = visibilidade.map(v => v.documento_id);
            const { data: herdadosData } = await db
                .from('documentos')
                .select('*, estruturas(nome)') // traz o nome de quem criou
                .in('id', docIds);
            herdados = herdadosData || [];
        }

        renderizarDocumentos(locais || [], listLocais, true);
        renderizarDocumentos(herdados, listOficiais, false);
        
    } catch (err) {
        console.warn("Erro ao buscar documentos. Tabelas criadas?", err);
        listLocais.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: As tabelas de documentos não foram criadas no Supabase.</div>';
        listOficiais.innerHTML = '';
    }
}

function renderizarDocumentos(docs, container, isLocal) {
    if (!docs || docs.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">Nenhum documento encontrado.</div>`;
        return;
    }
    
    let html = '';
    docs.forEach(doc => {
        const icon = doc.tipo === 'Link' ? '🔗' : '📝';
        const dono = isLocal ? 'Criado por nós' : `📌 Oficial de: ${doc.estruturas?.nome || 'Instância Superior'}`;
        
        let actionBtn = '';
        if (doc.tipo === 'Link') {
            actionBtn = `<a href="${doc.conteudo}" target="_blank" class="btn btn-primary" style="padding: 4px 8px; font-size: 12px; text-decoration: none;">Abrir Link &nearr;</a>`;
        } else {
            // Encode the markdown content to safely pass it in onclick
            const encodedContent = encodeURIComponent(doc.conteudo || '');
            const encodedTitle = encodeURIComponent(doc.titulo || '');
            actionBtn = `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="abrirViewerMarkdown('${encodedTitle}', '${encodedContent}')">Ler Conteúdo</button>`;
        }
        
        let deleteBtn = '';
        if (isLocal) {
            deleteBtn = `<button onclick="excluirDocumento('${doc.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; padding: 4px;" title="Excluir Documento">🗑️</button>`;
        }

        html += `
        <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-size: 16px; font-weight: 600; color: white;">${icon} ${doc.titulo}</div>
                ${deleteBtn}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">${dono}</div>
            <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end;">
                ${actionBtn}
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

window.abrirModalDoc = function() {
    document.getElementById('formDoc').reset();
    toggleDocType();
    
    // Desmarca todos os checkboxes de departamento
    document.querySelectorAll('.chk-dept').forEach(chk => chk.checked = false);
    
    document.getElementById('modalDoc').style.display = 'flex';
};

window.fecharModalDoc = function() {
    document.getElementById('modalDoc').style.display = 'none';
};

window.toggleDocType = function() {
    const tipo = document.getElementById('inDocTipo').value;
    if (tipo === 'Link') {
        document.getElementById('groupDocLink').style.display = 'block';
        document.getElementById('inDocLink').required = true;
        document.getElementById('groupDocMd').style.display = 'none';
        document.getElementById('inDocMd').required = false;
    } else {
        document.getElementById('groupDocLink').style.display = 'none';
        document.getElementById('inDocLink').required = false;
        document.getElementById('groupDocMd').style.display = 'block';
        document.getElementById('inDocMd').required = true;
    }
};

async function popularSelectDepartamentos() {
    const container = document.getElementById('checkDepartamentos');
    try {
        const { data, error } = await db.from('estruturas').select('id, nome').neq('id', estruturaId).order('nome');
        if (data) {
            let html = '';
            data.forEach(d => {
                html += `
                <label style="display: flex; align-items: center; gap: 8px; color: white; cursor: pointer;">
                    <input type="checkbox" class="chk-dept" value="${d.id}"> ${d.nome}
                </label>
                `;
            });
            container.innerHTML = html;
        }
    } catch (e) {
        container.innerHTML = '<span style="color: #ef4444;">Erro ao carregar</span>';
    }
}

async function salvarDocumento(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveDoc');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const titulo = document.getElementById('inDocTitulo').value;
    const tipo = document.getElementById('inDocTipo').value;
    const conteudo = tipo === 'Link' ? document.getElementById('inDocLink').value : document.getElementById('inDocMd').value;
    
    const compartilhamentos = Array.from(document.querySelectorAll('.chk-dept:checked')).map(chk => chk.value);

    try {
        // 1. Inserir Documento Principal
        const { data: docData, error: docError } = await db.from('documentos').insert([{
            estrutura_id: estruturaId,
            titulo: titulo,
            tipo: tipo,
            conteudo: conteudo
        }]).select('id').single();

        if (docError) throw docError;
        
        // 2. Inserir Compartilhamentos (se houver)
        if (compartilhamentos.length > 0 && docData) {
            const insertsVisibilidade = compartilhamentos.map(deptId => ({
                documento_id: docData.id,
                estrutura_id: deptId
            }));
            const { error: visError } = await db.from('documentos_visibilidade').insert(insertsVisibilidade);
            if (visError) console.error("Erro ao salvar visibilidade", visError);
        }

        fecharModalDoc();
        await carregarDocumentos();
    } catch (err) {
        console.error("Erro ao salvar documento:", err);
        alert("Erro ao salvar. Verifique se as tabelas foram criadas no Supabase corretamente.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Documento';
    }
}

window.excluirDocumento = async function(id) {
    if (!confirm("Tem certeza que deseja excluir este documento? Os departamentos que o herdaram também perderão o acesso.")) return;
    
    try {
        // O Supabase (Cascade Delete) ou a exclusao direta da visibilidade primeiro
        await db.from('documentos_visibilidade').delete().eq('documento_id', id);
        const { error } = await db.from('documentos').delete().eq('id', id);
        
        if (error) throw error;
        await carregarDocumentos();
    } catch (err) {
        console.error("Erro ao excluir", err);
        alert("Erro ao excluir.");
    }
};

// ==========================================
// RENDERIZADOR MARKDOWN
// ==========================================
window.abrirViewerMarkdown = function(encodedTitle, encodedContent) {
    const titulo = decodeURIComponent(encodedTitle);
    const conteudo = decodeURIComponent(encodedContent);
    
    document.getElementById('viewerTitle').textContent = titulo;
    
    // Converte o Markdown cru para HTML usando Marked.js
    const htmlConvertido = marked.parse(conteudo);
    document.getElementById('viewerContent').innerHTML = htmlConvertido;
    
    document.getElementById('modalViewer').style.display = 'flex';
};

window.fecharViewer = function() {
    document.getElementById('modalViewer').style.display = 'none';
    document.getElementById('viewerContent').innerHTML = '';
};
