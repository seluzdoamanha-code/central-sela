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
    
    // Iniciar Aba de Equipe
    await carregarEquipe();
    
    // Iniciar Aba de Documentos
    await carregarDocumentos();
    await popularSelectDepartamentos();
    
    // Formulario de Documentos
    document.getElementById('formDoc').addEventListener('submit', salvarDocumento);
    
    // Iniciar Aba de Agenda
    await carregarAgenda();
    document.getElementById('formEvento').addEventListener('submit', salvarEvento);
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

// ==========================================
// MÓDULO DE EQUIPE
// ==========================================
async function carregarEquipe() {
    try {
        const { data, error } = await db
            .from('vinculos_estrutura')
            .select(`
                papel,
                pessoas (nome_completo, papeis, celular, email)
            `)
            .eq('estrutura_id', estruturaId);
            
        if (error) throw error;
        
        const gridLideranca = document.getElementById('gridLideranca');
        const gridMembros = document.getElementById('gridMembros');
        const status = document.getElementById('equipeStatus');
        
        if (!data || data.length === 0) {
            status.textContent = 'Nenhum membro vinculado a este departamento.';
            return;
        }
        
        status.textContent = `${data.length} membro(s) na equipe.`;
        
        let htmlLider = '';
        let htmlMembro = '';
        
        data.forEach(rel => {
            const pessoa = rel.pessoas;
            if (!pessoa) return;
            
            const isLider = rel.papel && (
                rel.papel.toLowerCase().includes('diretor') ||
                rel.papel.toLowerCase().includes('diretora') ||
                rel.papel.toLowerCase().includes('diretoria') ||
                rel.papel.toLowerCase().includes('direção') ||
                rel.papel.toLowerCase().includes('direcao') ||
                rel.papel.toLowerCase().includes('líder') ||
                rel.papel.toLowerCase().includes('lider') ||
                rel.papel.toLowerCase().includes('coordenador') ||
                rel.papel.toLowerCase().includes('coordenadora') ||
                rel.papel.toLowerCase().includes('gerente')
            );
            
            // Format phone if it exists
            const telefone = pessoa.celular ? `<div style="font-size: 11px; margin-top: 4px; color: var(--text-muted);">📱 ${pessoa.celular}</div>` : '';
            const emailIcon = pessoa.email ? `<div style="font-size: 11px; margin-top: 2px; color: var(--text-muted);">✉️ ${pessoa.email}</div>` : '';
            
            const cardHtml = `
            <div style="background: var(--bg-panel); border: 1px solid ${isLider ? 'var(--primary)' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; flex-direction: column;">
                <div style="font-size: 15px; font-weight: 600; color: var(--text-main);">${pessoa.nome_completo}</div>
                <div style="font-size: 13px; color: var(--primary); margin-top: 4px; font-weight: 500;">${rel.papel || 'Membro'}</div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                    ${telefone}
                    ${emailIcon}
                </div>
                ${pessoa.papeis && pessoa.papeis.length > 0 ? 
                    `<div style="margin-top: 12px; display: flex; gap: 4px; flex-wrap: wrap;">
                        ${pessoa.papeis.map(t => `<span style="background: rgba(129, 140, 248, 0.1); color: #818cf8; padding: 2px 8px; border-radius: 12px; font-size: 10px;">${t}</span>`).join('')}
                    </div>` 
                : ''}
            </div>
            `;
            
            if (isLider) htmlLider += cardHtml;
            else htmlMembro += cardHtml;
        });
        
        if (htmlLider) {
            document.getElementById('containerLideranca').style.display = 'block';
            gridLideranca.innerHTML = htmlLider;
        }
        
        if (htmlMembro) {
            document.getElementById('containerMembros').style.display = 'block';
            gridMembros.innerHTML = htmlMembro;
        }
        
    } catch (err) {
        console.error("Erro ao carregar equipe:", err);
        document.getElementById('equipeStatus').textContent = "Erro: " + (err.message || "Falha ao buscar membros no banco de dados.");
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
                <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${icon} ${doc.titulo}</div>
                ${deleteBtn}
            </div>
            <div style="font-size: 12px; color: var(--text-muted);">${dono}</div>
            <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
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
                <label style="display: flex; align-items: center; gap: 8px; color: var(--text-main); cursor: pointer;">
                    <input type="checkbox" class="chk-dept" value="${d.id}" style="width: auto;"> ${d.nome}
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

// ==========================================
// MÓDULO DE AGENDA
// ==========================================

async function carregarAgenda() {
    const listAgenda = document.getElementById('listAgenda');
    listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Carregando...</div>';
    
    try {
        const hojeIso = new Date().toISOString();
        
        // Buscar eventos locais e globais futuros
        const { data: eventos, error } = await db
            .from('agenda')
            .select('*, estruturas(nome)')
            .or(`estrutura_id.eq.${estruturaId},visibilidade.eq.Global`)
            .gte('data_hora_inicio', hojeIso)
            .order('data_hora_inicio', { ascending: true });
            
        if (error) throw error;
        
        if (!eventos || eventos.length === 0) {
            listAgenda.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Nenhum evento agendado.</div>';
            return;
        }
        
        let html = '';
        eventos.forEach(ev => {
            const dataInicio = new Date(ev.data_hora_inicio);
            const dataFim = ev.data_hora_fim ? new Date(ev.data_hora_fim) : null;
            
            const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
            const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const isGlobal = ev.visibilidade === 'Global';
            const badgeGloblal = isGlobal ? `<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px;">GLOBAL</span>` : '';
            const organizador = isGlobal && ev.estruturas ? `Organizado por: ${ev.estruturas.nome}` : '';
            
            // Gerar Link Google Calendar (Formato: YYYYMMDDTHHMMSSZ)
            const gcalInicio = dataInicio.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            let gcalFim = gcalInicio;
            if (dataFim) {
                gcalFim = dataFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            } else {
                // +1 hora por padrão
                const tempFim = new Date(dataInicio.getTime() + 60 * 60 * 1000);
                gcalFim = tempFim.toISOString().split('.')[0].replace(/[-:]/g, "") + "Z";
            }
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.titulo)}&dates=${gcalInicio}/${gcalFim}&details=${encodeURIComponent(ev.descricao || '')}&location=${encodeURIComponent(ev.local || '')}`;

            // Gerar conteudo ICS
            const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${gcalInicio}
DTEND:${gcalFim}
SUMMARY:${ev.titulo}
DESCRIPTION:${ev.descricao || ''}
LOCATION:${ev.local || ''}
END:VEVENT
END:VCALENDAR`;
            
            const icsEncoded = encodeURIComponent(icsContent);

            html += `
            <div style="background: var(--bg-panel); border: 1px solid ${isGlobal ? '#ef4444' : 'var(--border)'}; border-radius: 8px; padding: 16px; display: flex; gap: 16px; position: relative;">
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; min-width: 60px;">
                    <div style="font-size: 14px; color: var(--primary); font-weight: bold;">${dataFormatada.split(' de ')[0]}</div>
                    <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">${dataFormatada.split(' de ')[1] || ''}</div>
                </div>
                <div style="flex: 1; padding-right: 24px;">
                    <div style="font-size: 16px; font-weight: 600; color: var(--text-main);">${ev.titulo} ${badgeGloblal}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                    ${ev.descricao ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 8px; line-height: 1.4;">${ev.descricao}</div>` : ''}
                    ${organizador ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">${organizador}</div>` : ''}
                    
                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <a href="${gcalUrl}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Google Agenda</a>
                        <a href="data:text/calendar;charset=utf8,${icsEncoded}" download="${ev.titulo.replace(/\s+/g, '_')}.ics" class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; text-decoration: none;">+ Apple/Outlook (.ics)</a>
                    </div>
                </div>
                <button onclick="excluirEventoAgenda('${ev.id}')" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 14px; cursor: pointer; color: var(--text-muted);" title="Excluir Evento">🗑️</button>
            </div>
            `;
        });
        
        listAgenda.innerHTML = html;
    } catch (err) {
        console.warn("Erro ao carregar agenda", err);
        listAgenda.innerHTML = '<div style="color: #ef4444; font-size: 13px;">⚠️ Erro: Tabela agenda não encontrada.</div>';
    }
}

window.abrirModalEvento = function() {
    document.getElementById('formEvento').reset();
    document.getElementById('modalEvento').style.display = 'flex';
};

window.fecharModalEvento = function() {
    document.getElementById('modalEvento').style.display = 'none';
};

async function salvarEvento(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveEvento');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const titulo = document.getElementById('inEvTitulo').value;
    const inicio = document.getElementById('inEvInicio').value;
    const fim = document.getElementById('inEvFim').value;
    const local = document.getElementById('inEvLocal').value;
    const visibilidade = document.getElementById('inEvVisibilidade').value;
    const descricao = document.getElementById('inEvDescricao').value;

    try {
        const { error } = await db.from('agenda').insert([{
            estrutura_id: estruturaId,
            titulo: titulo,
            data_hora_inicio: inicio ? new Date(inicio).toISOString() : null,
            data_hora_fim: fim ? new Date(fim).toISOString() : null,
            local: local,
            visibilidade: visibilidade,
            descricao: descricao
        }]);

        if (error) throw error;
        
        fecharModalEvento();
        await carregarAgenda();
    } catch (err) {
        console.error("Erro ao salvar evento:", err);
        alert("Erro ao salvar o evento.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Evento';
    }
}

window.excluirEventoAgenda = async (id) => {
    if (!confirm("Tem certeza que deseja apagar este evento da agenda?")) return;
    
    try {
        const { error } = await db.from('agenda').delete().eq('id', id);
        if (error) throw error;
        carregarAgenda();
    } catch (err) {
        console.error("Erro ao excluir evento:", err);
        alert("Erro ao excluir evento.");
    }
};
