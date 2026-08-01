const SUPABASE_URL = 'https://aymdooyafimliiggxeqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWRvb3lhZmltbGlpZ2d4ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDUxNDksImV4cCI6MjEwMDY4MTE0OX0.-NBhiyGDlrWq4QKNLx9Ll5GlIk0mV_rBWnr0vdbUCOU';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentCategoria = 'DISPONÍVEL';
let currentLivroId = null;
let currentLivroTitulo = null;

let allLoadedBooks = {};
let currentPage = 0;
const PAGE_SIZE = 24;

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCategoria = e.target.getAttribute('data-categoria');
            fetchLivros(true);
        });
    });

    // Load More button
    document.getElementById('btnCarregarMais').addEventListener('click', () => {
        fetchLivros(false);
    });

    // Modal Confirmation
    document.getElementById('btnConfirmarReserva').addEventListener('click', enviarReserva);

    fetchLivros(true);
});

async function fetchLivros(reset = false) {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('booksGrid');
    const emptyState = document.getElementById('emptyState');
    const btnCarregarMais = document.getElementById('btnCarregarMais');

    if (reset) {
        currentPage = 0;
        grid.innerHTML = '';
        allLoadedBooks = {};
        grid.style.display = 'none';
        emptyState.style.display = 'none';
        btnCarregarMais.style.display = 'none';
        loading.style.display = 'block';
    } else {
        btnCarregarMais.innerText = "Carregando...";
        btnCarregarMais.disabled = true;
    }

    try {
        const from = currentPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error, count } = await db
            .from('livros_catalogo')
            .select('*', { count: 'exact' })
            .eq('categoria', currentCategoria)
            .order('titulo')
            .range(from, to);

        if (error) throw error;

        loading.style.display = 'none';

        if (reset && (!data || data.length === 0)) {
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        
        data.forEach(livro => {
            allLoadedBooks[livro.id] = livro;
            
            const card = document.createElement('div');
            card.className = 'book-card';
            card.onclick = () => abrirModal(livro.id);
            
            const noCacheUrl = `${livro.capa_url}?t=${new Date().getTime()}`;
            const codigoHtml = livro.codigo ? `<div class="book-codigo">${livro.codigo}</div>` : '';

            card.innerHTML = `
                <img src="${noCacheUrl}" class="book-cover" alt="Capa" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23333\\'/><text x=\\'50%\\' y=\\'50%\\' font-family=\\'Arial\\' font-size=\\'14\\' fill=\\'%23777\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Sem Capa</text></svg>'">
                <div class="book-info">
                    <div class="book-title">${livro.titulo}</div>
                    <div class="book-author">${livro.autor || 'Autor desconhecido'}</div>
                    ${codigoHtml}
                </div>
            `;
            grid.appendChild(card);
        });

        if (count > (currentPage + 1) * PAGE_SIZE) {
            btnCarregarMais.style.display = 'block';
            btnCarregarMais.innerText = "Carregar Mais";
            btnCarregarMais.disabled = false;
        } else {
            btnCarregarMais.style.display = 'none';
        }

        currentPage++;

    } catch (err) {
        console.error("Erro ao buscar livros:", err);
        if (reset) {
            loading.style.display = 'none';
            emptyState.innerHTML = "Ocorreu um erro ao carregar o acervo. Verifique sua conexão e tente novamente.";
            emptyState.style.display = 'block';
        } else {
            btnCarregarMais.innerText = "Erro. Tentar novamente";
            btnCarregarMais.disabled = false;
        }
    }
}

function abrirModal(id) {
    const livro = allLoadedBooks[id];
    if (!livro) return;

    currentLivroId = id;
    currentLivroTitulo = livro.titulo;

    document.getElementById('modalImg').src = `${livro.capa_url}?t=${new Date().getTime()}`;
    document.getElementById('modalImg').onerror = function() {
        this.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%23333'/><text x='50%' y='50%' font-family='Arial' font-size='14' fill='%23777' text-anchor='middle' dominant-baseline='middle'>Sem Capa</text></svg>";
    };
    
    document.getElementById('modalTitle').innerText = livro.titulo;
    document.getElementById('modalAuthor').innerText = livro.autor || 'Autor desconhecido';
    
    if (livro.codigo) {
        document.getElementById('modalCodigo').style.display = 'inline-block';
        document.getElementById('modalCodigo').innerText = livro.codigo;
    } else {
        document.getElementById('modalCodigo').style.display = 'none';
    }

    document.getElementById('modalSinopse').innerHTML = (livro.sinopse || 'Nenhuma sinopse disponível.').replace(/\\n/g, '<br>');

    document.getElementById('formTitle').innerText = currentCategoria === 'DISPONÍVEL' ? 'Reservar este livro' : 'Declarar interesse';
    document.getElementById('btnConfirmarReserva').innerText = currentCategoria === 'DISPONÍVEL' ? 'Confirmar Reserva' : 'Confirmar Interesse';
    
    document.getElementById('reservaNome').value = '';
    document.getElementById('reservaContato').value = '';
    
    document.getElementById('modalReserva').classList.add('show');
}

function fecharModal() {
    document.getElementById('modalReserva').classList.remove('show');
    currentLivroId = null;
    currentLivroTitulo = null;
}

async function enviarReserva() {
    const nome = document.getElementById('reservaNome').value.trim();
    const contato = document.getElementById('reservaContato').value.trim();

    if (!nome || !contato) {
        alert("Por favor, preencha seu nome e contato.");
        return;
    }

    const btn = document.getElementById('btnConfirmarReserva');
    const originalText = btn.innerText;
    btn.innerText = "Aguarde...";
    btn.disabled = true;

    try {
        const { error } = await db.from('reservas_site').insert([{
            livro_id: currentLivroId,
            livro_titulo: currentLivroTitulo,
            leitor_nome: nome,
            leitor_contato: contato,
            status: 'PENDENTE'
        }]);

        if (error) throw error;

        alert(`Sucesso! Sua solicitação para "${currentLivroTitulo}" foi enviada para a biblioteca.`);
        fecharModal();
    } catch (err) {
        console.error("Erro ao reservar:", err);
        alert("Ocorreu um erro ao enviar sua reserva. Tente novamente mais tarde.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}
