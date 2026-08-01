const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const urlParams = new URLSearchParams(window.location.search);
const pessoaId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!pessoaId) {
        alert("ID de pessoa não fornecido!");
        window.location.href = 'pessoas.html';
        return;
    }

    // Configura o link de edição
    const btnEditar = document.getElementById('btnEditarCadastro');
    if (btnEditar) {
        btnEditar.onclick = () => {
            window.location.href = `pessoas.html?edit=${pessoaId}`;
        };
    }

    await carregarPerfil();
});

function formatarDocumento(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length === 11) {
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (v.length === 14) {
        return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return v;
}

function formatarCelular(v) {
    if (!v) return '-';
    v = v.replace(/\D/g, '');
    if (v.length <= 10) {
        return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

async function carregarPerfil() {
    try {
        const { data: pessoa, error } = await db
            .from('pessoas')
            .select('*')
            .eq('id', pessoaId)
            .single();

        if (error) throw error;
        
        if (!pessoa) {
            document.getElementById('nomePessoa').textContent = "Pessoa não encontrada";
            return;
        }

        // Injeta dados no topo
        document.getElementById('nomePessoa').textContent = pessoa.nome_curto || pessoa.nome_completo;
        
        // Exibição da Foto ou Iniciais
        const containerFoto = document.getElementById('fotoPerfilContainer');
        if (pessoa.foto_url) {
            containerFoto.innerHTML = `<img src="${pessoa.foto_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 60px;">`;
            containerFoto.style.border = 'none';
        } else {
            // Pega as iniciais do nome completo
            const partes = pessoa.nome_completo.trim().split(' ');
            let iniciais = partes[0].charAt(0);
            if (partes.length > 1) {
                iniciais += partes[partes.length - 1].charAt(0);
            }
            
            // Gera uma cor baseada no nome
            const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
            const colorIndex = pessoa.nome_completo.length % colors.length;
            
            containerFoto.innerHTML = `<span style="font-size: 40px; font-weight: 600; color: white;">${iniciais.toUpperCase()}</span>`;
            containerFoto.style.background = colors[colorIndex];
            containerFoto.style.border = 'none';
        }
        
        // Injeta dados na coluna da esquerda
        document.getElementById('infoNome').textContent = pessoa.nome_completo;
        document.getElementById('infoNomeCurto').textContent = pessoa.nome_curto || '-';
        document.getElementById('infoCpf').textContent = formatarDocumento(pessoa.cpf_cnpj);
        document.getElementById('infoCelular').textContent = formatarCelular(pessoa.celular);
        document.getElementById('infoEmail').textContent = pessoa.email || '-';

        // Injeta Papéis
        const containerPapeis = document.getElementById('infoPapeis');
        if (pessoa.papeis && pessoa.papeis.length > 0) {
            containerPapeis.innerHTML = pessoa.papeis.map(tag => 
                `<span style="background: rgba(79,70,229,0.2); color: #818cf8; padding: 4px 10px; border-radius: 4px; font-size: 13px; margin-right: 6px; margin-bottom: 6px; display: inline-block;">${tag}</span>`
            ).join('');
        } else {
            containerPapeis.textContent = 'Nenhum papel atribuído';
        }

    } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        document.getElementById('nomePessoa').textContent = "Erro ao carregar perfil";
    }
}
