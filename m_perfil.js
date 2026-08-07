(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let pessoaAtual = null;
    let todasAsTags = [];
    let currentId = new URLSearchParams(window.location.search).get('id');

    document.addEventListener('DOMContentLoaded', async () => {
        if (!currentId) {
            alert('Pessoa não encontrada.');
            window.location.href = 'm_pessoas.html';
            return;
        }

        await carregarTags();
        await carregarPerfil();

        // Modal de Edição
        const modal = document.getElementById('mEditModal');
        const btnOpenEdit = document.getElementById('btnOpenEdit');
        const btnCloseEdit = document.getElementById('btnCloseEdit');
        const btnSaveEdit = document.getElementById('btnSaveEdit');

        btnOpenEdit.addEventListener('click', () => {
            preencherFormulario();
            modal.classList.add('open');
        });

        btnCloseEdit.addEventListener('click', () => {
            modal.classList.remove('open');
        });

        btnSaveEdit.addEventListener('click', salvarEdicao);

        // Máscaras de Input
        const inpCep = document.getElementById('inpCep');
        if (inpCep) {
            inpCep.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
                e.target.value = v;
            });
        }

        const inpCelular = document.getElementById('inpCelular');
        if (inpCelular) {
            inpCelular.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length <= 10) {
                    v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
                } else {
                    v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                }
                e.target.value = v;
            });
        }
    });

    // Rascunho para futuras ACLs (Access Control List)
    async function checarPermissaoEdicao() {
        // Futuro: Verificar perfil do usuarioLogado no banco
        // Por enquanto, liberado para testes da Diretoria.
        return true; 
    }

    async function carregarTags() {
        let TAGS = [
            "Presidente", "Vice-Presidente", "Secretário", "Tesoureiro", 
            "Conselheiro", "Diretor", "Coordenador", "Associado Efetivo", 
            "Associado Proponente", "Ex-Associado", "Voluntário", "Colaborador(a)", 
            "Palestrante", "Evangelizando", "Estudante", "Assistido(a)", "Paciente", 
            "Membro da Família", "Empresa Parceira", "Parceiro", "Fornecedor", 
            "Passista", "Líder", "Outros"
        ];
        try {
            const { data, error } = await db.from('configuracoes').select('valor').eq('chave', 'perfis_pessoas').single();
            if (data && data.valor) {
                TAGS = data.valor.split(',').map(s => s.trim()).filter(s => s !== '');
            }
        } catch(err) {
            // Usa tags padrao
        }
        todasAsTags = [...TAGS].sort((a, b) => a.localeCompare(b));
        
        const container = document.getElementById('mTagsContainer');
        if (container) {
            container.innerHTML = todasAsTags.map(tag => `
                <label style="display: flex; align-items: center; gap: 6px; background: var(--bg-card); border: 1px solid var(--border); padding: 8px 12px; border-radius: 8px; font-size: 13px; color: var(--text-main);">
                    <input type="checkbox" name="mPapeis" value="${tag}" style="width: 16px; height: 16px; accent-color: var(--primary);">
                    ${tag}
                </label>
            `).join('');
        }
    }

    function obterIniciais(nome) {
        if (!nome) return '?';
        const partes = nome.trim().split(' ');
        if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }

    function formatarCpfCnpj(v) {
        if (!v) return '';
        v = v.replace(/\D/g,"");
        if (v.length <= 11) {
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g,"\$1.\$2.\$3-\$4");
        } else {
            return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,"\$1.\$2.\$3/\$4-\$5");
        }
    }

    async function carregarPerfil() {
        try {
            const { data, error } = await db.from('pessoas').select('*').eq('id', currentId).single();
            if (error) throw error;
            pessoaAtual = data;
            renderizarVisualizacao();

            const podeEditar = await checarPermissaoEdicao();
            if (podeEditar) {
                document.getElementById('btnOpenEdit').style.display = 'block';
            }

        } catch (e) {
            console.error(e);
            alert('Erro ao carregar dados da pessoa.');
        } finally {
            document.getElementById('mLoadingState').style.display = 'none';
            document.getElementById('mProfileContent').style.display = 'block';
        }
    }

    function renderizarVisualizacao() {
        const p = pessoaAtual;
        
        // Header
        const avatar = document.getElementById('lblAvatar');
        if (p.foto_url) {
            avatar.style.background = 'transparent';
            avatar.style.border = 'none';
            avatar.innerHTML = `<img src="${p.foto_url}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            avatar.style.background = 'var(--bg-card)';
            avatar.style.border = '2px solid var(--border)';
            avatar.innerHTML = obterIniciais(p.nome_completo);
        }

        document.getElementById('lblNomeCompleto').innerText = p.nome_completo || 'Sem Nome';
        document.getElementById('lblTipoPessoa').innerText = p.tipo_pessoa || 'Pessoa Física';
        
        const papeisContainer = document.getElementById('lblPapeis');
        papeisContainer.innerHTML = '';
        if (p.papeis && p.papeis.length > 0) {
            p.papeis.forEach(papel => {
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.style.background = 'rgba(99, 102, 241, 0.2)';
                badge.style.color = '#818cf8';
                badge.style.fontSize = '12px';
                badge.style.padding = '4px 10px';
                badge.innerText = papel;
                papeisContainer.appendChild(badge);
            });
        }

        // Info
        const celularLimpo = (p.celular || '').replace(/\D/g, '');
        document.getElementById('lblCelular').innerText = p.celular || '-';
        const btnZap = document.getElementById('btnWhatsapp');
        if (celularLimpo) {
            btnZap.style.display = 'block';
            btnZap.href = `https://wa.me/55${celularLimpo}`;
        } else {
            btnZap.style.display = 'none';
        }

        document.getElementById('lblEmail').innerText = p.email || '-';
        document.getElementById('lblCpfCnpj').innerText = formatarCpfCnpj(p.cpf_cnpj) || '-';

        if (p.tipo_pessoa === 'Jurídica') {
            document.getElementById('rowNascimento').style.display = 'none';
        } else {
            document.getElementById('rowNascimento').style.display = 'flex';
            if (p.data_nascimento) {
                const partes = p.data_nascimento.split('-');
                document.getElementById('lblNascimento').innerText = `${partes[2]}/${partes[1]}/${partes[0]}`;
            } else {
                document.getElementById('lblNascimento').innerText = '-';
            }
        }

        const endereco = [];
        if (p.endereco) endereco.push(p.endereco);
        if (p.bairro) endereco.push(p.bairro);
        if (p.cidade) endereco.push(`${p.cidade} - ${p.estado || ''}`);
        
        if (endereco.length > 0) {
            document.getElementById('lblEnderecoCompleto').innerText = endereco.join(', ') + (p.cep ? ` (CEP: ${p.cep})` : '');
        } else {
            document.getElementById('lblEnderecoCompleto').innerText = 'Endereço não cadastrado';
        }
    }

    function preencherFormulario() {
        const p = pessoaAtual;
        document.getElementById('inpNome').value = p.nome_completo || '';
        document.getElementById('inpNomeCurto').value = p.nome_curto || '';
        document.getElementById('inpCelular').value = p.celular || '';
        document.getElementById('inpEmail').value = p.email || '';
        document.getElementById('inpNascimento').value = p.data_nascimento || '';
        document.getElementById('inpCep').value = p.cep || '';
        document.getElementById('inpEndereco').value = p.endereco || '';
        document.getElementById('inpBairro').value = p.bairro || '';
        document.getElementById('inpCidade').value = p.cidade || '';
        document.getElementById('inpEstado').value = p.estado || '';

        // Checkboxes de Papeis
        const checkboxes = document.querySelectorAll('input[name="mPapeis"]');
        checkboxes.forEach(cb => {
            cb.checked = (p.papeis && p.papeis.includes(cb.value));
        });
    }

    async function salvarEdicao() {
        const btnSaveEdit = document.getElementById('btnSaveEdit');
        btnSaveEdit.innerText = 'Salvando...';
        btnSaveEdit.disabled = true;

        const checkboxes = document.querySelectorAll('input[name="mPapeis"]:checked');
        const papeis = Array.from(checkboxes).map(cb => cb.value);

        const dados = {
            nome_completo: document.getElementById('inpNome').value.trim(),
            nome_curto: document.getElementById('inpNomeCurto').value.trim(),
            celular: document.getElementById('inpCelular').value.trim(),
            email: document.getElementById('inpEmail').value.trim(),
            data_nascimento: document.getElementById('inpNascimento').value || null,
            cep: document.getElementById('inpCep').value.trim(),
            endereco: document.getElementById('inpEndereco').value.trim(),
            bairro: document.getElementById('inpBairro').value.trim(),
            cidade: document.getElementById('inpCidade').value.trim(),
            estado: document.getElementById('inpEstado').value.trim().toUpperCase(),
            papeis: papeis
        };

        try {
            const { error } = await db.from('pessoas').update(dados).eq('id', currentId);
            if (error) throw error;
            
            // Sucesso! Atualiza obj local e re-renderiza
            Object.assign(pessoaAtual, dados);
            renderizarVisualizacao();
            
            // Fecha modal
            document.getElementById('mEditModal').classList.remove('open');
            
        } catch(e) {
            console.error(e);
            alert('Erro ao salvar os dados.');
        } finally {
            btnSaveEdit.innerText = 'Salvar';
            btnSaveEdit.disabled = false;
        }
    }
})();
