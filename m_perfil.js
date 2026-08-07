(function() {
    const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let pessoaAtual = null;
    let currentId = new URLSearchParams(window.location.search).get('id');

    document.addEventListener('DOMContentLoaded', async () => {
        if (!currentId) {
            alert('Pessoa não encontrada.');
            window.location.href = 'm_pessoas.html';
            return;
        }

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
    });

    // Rascunho para futuras ACLs (Access Control List)
    async function checarPermissaoEdicao() {
        // Futuro: Verificar perfil do usuarioLogado no banco
        // Por enquanto, liberado para testes da Diretoria.
        return true; 
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
        if (p.logradouro) endereco.push(p.logradouro);
        if (p.numero) endereco.push(p.numero);
        if (p.bairro) endereco.push(p.bairro);
        if (p.cidade) endereco.push(`${p.cidade} - ${p.uf || ''}`);
        
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
        document.getElementById('inpLogradouro').value = p.logradouro || '';
        document.getElementById('inpNumero').value = p.numero || '';
        document.getElementById('inpBairro').value = p.bairro || '';
        document.getElementById('inpCidade').value = p.cidade || '';
        document.getElementById('inpUf').value = p.uf || '';
    }

    async function salvarEdicao() {
        const btnSaveEdit = document.getElementById('btnSaveEdit');
        btnSaveEdit.innerText = 'Salvando...';
        btnSaveEdit.disabled = true;

        const dados = {
            nome_completo: document.getElementById('inpNome').value.trim(),
            nome_curto: document.getElementById('inpNomeCurto').value.trim(),
            celular: document.getElementById('inpCelular').value.trim(),
            email: document.getElementById('inpEmail').value.trim(),
            data_nascimento: document.getElementById('inpNascimento').value || null,
            cep: document.getElementById('inpCep').value.trim(),
            logradouro: document.getElementById('inpLogradouro').value.trim(),
            numero: document.getElementById('inpNumero').value.trim(),
            bairro: document.getElementById('inpBairro').value.trim(),
            cidade: document.getElementById('inpCidade').value.trim(),
            uf: document.getElementById('inpUf').value.trim().toUpperCase()
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
