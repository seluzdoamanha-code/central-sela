const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let pessoasGlobais = [];
let pessoaEditandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
    setupModal();
    
    // Lógica Unificada de Busca, Filtro e Ordenação
    const inputSearch = document.getElementById('searchInput');
    const filterTag = document.getElementById('filterTag');
    const sortOrder = document.getElementById('sortOrder');

    inputSearch.addEventListener('input', window.aplicarFiltros);
    filterTag.addEventListener('change', window.aplicarFiltros);
    sortOrder.addEventListener('change', window.aplicarFiltros);
    
    // Configura as Tags Dinâmicas
    window.renderizarTagsDisponiveis();
    
    // ==========================================
    // VITRINE DE EVENTOS GLOBAIS
    // ==========================================
    async function carregarEventosGlobais() {
        const containerVitrine = document.getElementById('vitrineEventos');
        const listaEventos = document.getElementById('listaEventosGlobais');
        
        if (!containerVitrine || !listaEventos) return;
        
        try {
            const hojeIso = new Date().toISOString();
            
            const { data, error } = await db
                .from('agenda')
                .select('*, estruturas(nome)')
                .eq('visibilidade', 'Global')
                .gte('data_hora_inicio', hojeIso)
                .order('data_hora_inicio', { ascending: true })
                .limit(3);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                containerVitrine.style.display = 'flex';
                
                let html = '';
                data.forEach(ev => {
                    const dataInicio = new Date(ev.data_hora_inicio);
                    const dataFormatada = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
                    const evDia = dataInicio.toLocaleDateString('pt-BR', { day: '2-digit' });
                    const evMes = dataInicio.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
                    const horaFormatada = dataInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const organizador = ev.estruturas ? ev.estruturas.nome : 'Central SELA';
                    
                    html += `
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center;">
                        <div style="background: #ef4444; color: var(--text-main); border-radius: 6px; padding: 6px 10px; text-align: center; min-width: 55px;">
                            <div style="font-weight: bold; font-size: 16px;">${evDia}</div>
                            <div style="font-size: 11px; text-transform: uppercase;">${evMes}</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text-main); font-size: 14px;">${ev.titulo}</div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${organizador} | ⏰ ${horaFormatada} ${ev.local ? `| 📍 ${ev.local}` : ''}</div>
                        </div>
                    </div>
                    `;
                });
                
                listaEventos.innerHTML = html;
            } else {
                containerVitrine.style.display = 'none';
            }
        } catch (err) {
            console.warn('Tabela agenda ainda não criada ou erro:', err);
        }
    }
    
    // Carrega Vitrine de Eventos Globais
    carregarEventosGlobais();
});

window.aplicarFiltros = () => {
    try {
        const inputSearch = document.getElementById('searchInput');
        const filterTag = document.getElementById('filterTag');
        const sortOrder = document.getElementById('sortOrder');
        
        const termoOriginal = (inputSearch ? inputSearch.value : '').toLowerCase();
        const termoNumeros = termoOriginal.replace(/\D/g, '');
        const tagSelecionada = filterTag ? filterTag.value : '';
        const ordem = sortOrder ? sortOrder.value : 'nome_az';
        
        // 1. Filtrar
        let filtrados = pessoasGlobais.filter(p => {
            const docLimpo = p.cpf_cnpj ? p.cpf_cnpj.replace(/\D/g, '') : '';
            
            const nomeStr = (p.nome_completo || '').toLowerCase();
            const nomeCurtoStr = (p.nome_curto || '').toLowerCase();
            
            const achouPorNome = nomeStr.includes(termoOriginal) || nomeCurtoStr.includes(termoOriginal);
                                 
            const achouPorCpf = termoNumeros.length > 0 && docLimpo && docLimpo.includes(termoNumeros);
            
            const matchBusca = achouPorNome || achouPorCpf;
            
            let matchTag = true;
            if (tagSelecionada) {
                if (tagSelecionada === 'Física' || tagSelecionada === 'Jurídica') {
                    matchTag = p.tipo_pessoa === tagSelecionada;
                } else {
                    matchTag = p.papeis && p.papeis.includes(tagSelecionada);
                }
            }
            
            return matchBusca && matchTag;
        });

        // 2. Ordenar
        if (ordem === 'nome_az') {
            filtrados.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
        } else if (ordem === 'nome_za') {
            filtrados.sort((a, b) => (b.nome_completo || '').localeCompare(a.nome_completo || ''));
        } else if (ordem === 'recentes') {
            filtrados.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }

        // 3. Atualizar Resumo Quantitativo (Stats Ribbon)
        const countFisica = filtrados.filter(p => p.tipo_pessoa === 'Física').length;
        const countJuridica = filtrados.filter(p => p.tipo_pessoa === 'Jurídica').length;
        
        document.getElementById('statTotal').textContent = filtrados.length;
        document.getElementById('statFisica').textContent = countFisica;
        document.getElementById('statJuridica').textContent = countJuridica;
        document.getElementById('statsRibbon').style.display = 'flex';

        renderizarTabela(filtrados);
    } catch (err) {
        console.error("Erro no aplicarFiltros:", err);
    }
};

async function carregarPessoas() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('tableContainer').style.display = 'none';
    
    const { data, error } = await db.from('pessoas').select('*').order('nome_completo');
    
    if (error) {
        document.getElementById('loadingState').textContent = 'Erro ao carregar: ' + error.message;
        return;
    }
    
    pessoasGlobais = data || [];
    
    if (pessoasGlobais.length === 0) {
        document.getElementById('loadingState').textContent = 'Nenhuma pessoa/entidade cadastrada ainda.';
    } else {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('tableContainer').style.display = 'block';
        pessoasGlobais = data;
        window.aplicarFiltros(); // Usa a lógica unificada em vez de renderizar direto
    }
}

function formatarDocumento(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length === 11) {
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (v.length === 14) {
        return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return v;
}

function formatarCelular(v) {
    if (!v) return '';
    v = v.replace(/\D/g, '');
    if (v.length <= 10) {
        return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function renderizarTabela(dados) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    dados.forEach(pessoa => {
        const tags = pessoa.papeis || [];
        // Se for PJ, adiciona tag automática visual
        if (pessoa.tipo_pessoa === 'Jurídica') tags.unshift('🏢 Empresa');
        
        const tagsHtml = tags.map(tag => `<span style="background: rgba(79,70,229,0.2); color: #818cf8; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; white-space: nowrap; display: inline-block; margin-bottom: 4px;">${tag}</span>`).join('');
        
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">
                    ${pessoa.nome_curto || pessoa.nome_completo}
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        <span style="opacity: 0.7;">${pessoa.nome_completo !== pessoa.nome_curto ? pessoa.nome_completo : ''}</span> 
                        ${pessoa.cpf_cnpj ? `• ${formatarDocumento(pessoa.cpf_cnpj)}` : ''}
                    </div>
                </td>
                <td>${tagsHtml}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px; white-space: nowrap;">
                        ${pessoa.celular ? `
                            <a href="https://wa.me/55${pessoa.celular.replace(/\D/g,'')}" target="_blank" style="color: #25D366; text-decoration: none; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                                </svg>
                                ${formatarCelular(pessoa.celular)}
                            </a>
                        ` : '<span style="color:#94a3b8;">-</span>'}
                    </div>
                </td>
                <td style="text-align: right;">
                    <button onclick="editarPessoa('${pessoa.id}')" class="btn-primary" style="padding: 4px 12px; font-size: 12px; min-width: auto;">
                        Editar
                    </button>
                    <button onclick="excluirPessoa('${pessoa.id}')" class="btn-primary" style="padding: 4px 12px; font-size: 12px; min-width: auto; background: var(--bg-dark); border: 1px solid var(--border); color: #ef4444;">
                        Excluir
                    </button>
                    <a href="perfil.html?id=${pessoa.id}" style="color: var(--primary); text-decoration: none; font-weight: 500; font-size: 14px; margin-left: 8px;">Acessar Perfil &rarr;</a>
                </td>
            </tr>
        `;
    });
}

function setupModal() {
    const modal = document.getElementById('modalPessoa');
    const btnNovo = document.getElementById('btnNovaPessoa');
    const btnClose = document.getElementById('btnCloseModal');
    const btnCancel = document.getElementById('btnCancelModal');
    const form = document.getElementById('formPessoa');
    const inTipo = document.getElementById('inTipo');
    const lblCpfCnpj = document.getElementById('lblCpfCnpj');
    const lblNome = document.getElementById('lblNome');
    const lblNomeCurto = document.getElementById('lblNomeCurto');
    const inputCpfCnpj = document.getElementById('inCpfCnpj');
    
    // Elemento para mostrar o erro
    const erroCpf = document.createElement('div');
    erroCpf.style.color = '#ef4444';
    erroCpf.style.fontSize = '12px';
    erroCpf.style.marginTop = '4px';
    erroCpf.style.display = 'none';
    inputCpfCnpj.parentNode.appendChild(erroCpf);
    
    let isCpfValido = true;
    
    const fecharModal = () => { 
        modal.classList.remove('show'); 
        form.reset(); 
        erroCpf.style.display = 'none';
        isCpfValido = true;
        pessoaEditandoId = null;
    };
    
    btnNovo.addEventListener('click', () => modal.classList.add('show'));
    btnClose.addEventListener('click', fecharModal);
    btnCancel.addEventListener('click', fecharModal);
    
    inTipo.addEventListener('change', (e) => {
        inputCpfCnpj.value = ''; // Limpa ao trocar
        erroCpf.style.display = 'none';
        isCpfValido = true;
        
        if (e.target.value === 'Jurídica') {
            lblCpfCnpj.textContent = 'CNPJ';
            lblNome.textContent = 'Razão Social';
            lblNomeCurto.textContent = 'Nome Fantasia';
            document.getElementById('inCpfCnpj').maxLength = 18;
        } else {
            lblCpfCnpj.textContent = 'CPF';
            lblNome.textContent = 'Nome Completo';
            lblNomeCurto.textContent = 'Nome de Tratamento (Nome Curto)';
            document.getElementById('inCpfCnpj').maxLength = 14;
        }
    });
    
    // Máscara e Verificação de Duplicidade dinâmica
    let timeoutBusca;
    inputCpfCnpj.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        
        if (inTipo.value === 'Jurídica') {
            if (v.length > 14) v = v.slice(0, 14);
            v = v.replace(/^(\d{2})(\d)/, "$1.$2");
            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
            v = v.replace(/(\d{4})(\d)/, "$1-$2");
        } else {
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
            v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
        }
        e.target.value = v;
        
        // Timer para buscar no banco após o usuário parar de digitar por 500ms
        clearTimeout(timeoutBusca);
        const docLimpo = e.target.value.replace(/\D/g, '');
        
        if (docLimpo.length >= 11) {
            timeoutBusca = setTimeout(async () => {
                const { data } = await db.from('pessoas').select('id, nome_completo').eq('cpf_cnpj', docLimpo).neq('id', pessoaEditandoId || '').single();
                if (data) {
                    erroCpf.textContent = `⚠️ Este ${inTipo.value === 'Jurídica' ? 'CNPJ' : 'CPF'} já está cadastrado para: ${data.nome_completo}`;
                    erroCpf.style.display = 'block';
                    isCpfValido = false;
                    document.getElementById('btnSaveModal').disabled = true;
                } else {
                    erroCpf.style.display = 'none';
                    isCpfValido = true;
                    document.getElementById('btnSaveModal').disabled = false;
                }
            }, 500);
        } else {
            erroCpf.style.display = 'none';
            isCpfValido = true;
            document.getElementById('btnSaveModal').disabled = false;
        }
    });
    
    // Máscara de Celular
    document.getElementById('inCelular').addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length <= 10) {
            e.target.value = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else {
            e.target.value = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    });
    
    // --- FUNCOES UTILITARIAS ---

    // O listener continua sem a funcao utilitaria local
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isCpfValido) return; 
        
        const btnSave = document.getElementById('btnSaveModal');
        btnSave.disabled = true;
        btnSave.textContent = 'Salvando...';
        
        const tipo = inTipo.value;
        const documentoOriginal = inputCpfCnpj.value;
        const documento = documentoOriginal ? documentoOriginal.replace(/\D/g, '') : null;
        const nome = document.getElementById('inNome').value;
        const nome_curto = document.getElementById('inNomeCurto').value;
        const celular = document.getElementById('inCelular').value || null;
        const email = document.getElementById('inEmail').value || null;
        
        // Coleta tags selecionadas
        const checkboxes = document.querySelectorAll('input[name="papeis"]:checked');
        const papeis = Array.from(checkboxes).map(cb => cb.value);

        const dados = {
            cpf_cnpj: documento,
            nome_completo: nome,
            nome_curto: nome_curto,
            celular: celular,
            email: email,
            tipo_pessoa: tipo,
            papeis: papeis
        };
        
        try {
            if (pessoaEditandoId) {
                const { error } = await db.from('pessoas').update(dados).eq('id', pessoaEditandoId);
                if (error) throw error;
            } else {
                const { error } = await db.from('pessoas').insert([dados]);
                if (error) throw error;
            }
            
            fecharModal();
            carregarPessoas();
        } catch (error) {
            console.error('Erro ao salvar pessoa:', error);
            alert('Erro ao salvar os dados: ' + JSON.stringify(error));
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = 'Salvar Cadastro';
        }
    });
}

window.editarPessoa = async (id) => {
    const pessoa = pessoasGlobais.find(p => p.id === id);
    if (!pessoa) return;
    
    pessoaEditandoId = id;
    
    const modal = document.getElementById('modalPessoa');
    
    document.getElementById('inTipo').value = pessoa.tipo_pessoa || 'Física';
    document.getElementById('inTipo').dispatchEvent(new Event('change'));
    
    document.getElementById('inCpfCnpj').value = formatarDocumento(pessoa.cpf_cnpj) || '';
    document.getElementById('inNome').value = pessoa.nome_completo || '';
    document.getElementById('inNomeCurto').value = pessoa.nome_curto || '';
    document.getElementById('inCelular').value = pessoa.celular || '';
    document.getElementById('inEmail').value = pessoa.email || '';
    
    // Marcar as tags corretas
    const papeis = pessoa.papeis || [];
    document.querySelectorAll('input[name="papeis"]').forEach(cb => {
        cb.checked = papeis.includes(cb.value);
    });
    
    // Forçar a máscara logo após preencher (caso venha do banco sem formatação)
    const event = new Event('input');
    document.getElementById('inCelular').dispatchEvent(event);
    
    modal.classList.add('show');
};

window.excluirPessoa = async (id) => {
    const pessoa = pessoasGlobais.find(p => p.id === id);
    if (confirm(`Tem certeza que deseja excluir ${pessoa.nome_curto || pessoa.nome_completo}?`)) {
        try {
            const { error } = await db.from('pessoas').delete().eq('id', id);
            if (error) throw error;
            carregarPessoas();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert('Não foi possível excluir. Verifique se a pessoa já possui vínculos no sistema.');
        }
    }
};

window.renderizarTagsDisponiveis = () => {
    const TAGS = [
        "Presidente", "Vice-Presidente", "Secretário", "Tesoureiro", 
        "Conselheiro", "Diretor", "Coordenador", "Associado Efetivo", 
        "Associado Proponente", "Ex-Associado", "Voluntário", "Colaborador(a)", 
        "Palestrante", "Evangelizando", "Estudante", "Assistido(a)", "Paciente", 
        "Membro da Família", "Empresa Parceira", "Parceiro", "Fornecedor", 
        "Passista", "Líder", "Outro"
    ];
    
    const container = document.getElementById('tagsCheckboxContainer');
    if (!container) return;
    
    container.innerHTML = TAGS.map(tag => `
        <label class="tag-checkbox tag-checkbox-ui">
            <input type="checkbox" name="papeis" value="${tag}">
            <span>${tag}</span>
        </label>
    `).join('');
    
    // Logica de Busca das Tags
    const searchInput = document.getElementById('tagSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const labels = container.querySelectorAll('.tag-checkbox');
            labels.forEach(lbl => {
                const texto = lbl.textContent.toLowerCase();
                lbl.style.display = texto.includes(termo) ? 'flex' : 'none';
            });
        });
    }
};
