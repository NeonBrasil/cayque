# Portfólio Pessoal

Este é um site de portfólio pessoal moderno e responsivo, projetado para ser hospedado no GitHub Pages. O site inclui seções para apresentação pessoal, exibição de projetos, habilidades e informações de contato.

## Características

- Design moderno e responsivo
- Navegação suave com rolagem
- Menu mobile para dispositivos pequenos
- Animações e transições elegantes
- Filtro de projetos por categoria
- Formulário de contato funcional
- Ícones de redes sociais
- Totalmente personalizável

## Estrutura do Site

O site está dividido nas seguintes seções:

1. **Início** - Uma introdução com chamada para ação
2. **Sobre Mim** - Informações pessoais e habilidades
3. **Projetos** - Portfólio de trabalhos com filtros por categoria
4. **Contato** - Formulário e informações de contato

## Tecnologias Utilizadas

- HTML5
- CSS3 (com variáveis CSS para fácil personalização)
- JavaScript (vanilla, sem dependências)
- Font Awesome para ícones
- Google Fonts (Poppins)

## Como Personalizar

### Informações Pessoais

Edite o arquivo `index.html` para alterar:

- Seu nome e título profissional na seção de início
- Texto da seção "Sobre Mim"
- Suas habilidades e níveis de proficiência
- Projetos do portfólio (imagens, títulos, descrições e links)
- Informações de contato (email, telefone, localização)
- Links de redes sociais

### Estilo e Cores

Edite o arquivo `styles.css` para personalizar:

- Esquema de cores (variáveis CSS no início do arquivo)
- Fontes e tamanhos de texto
- Espaçamentos e layouts
- Animações e transições

### Funcionalidades

Edite o arquivo `script.js` para modificar:

- Comportamento do formulário de contato
- Animações e efeitos
- Filtro de projetos
- Navegação e rolagem

## Como Hospedar no GitHub Pages

1. Crie um repositório no GitHub com o nome `username.github.io` (substitua "username" pelo seu nome de usuário do GitHub)
2. Faça upload de todos os arquivos deste projeto para o repositório
3. Vá para as configurações do repositório, navegue até a seção "GitHub Pages"
4. Selecione a branch principal como fonte e salve
5. Seu site estará disponível em `https://username.github.io`

## Personalização Avançada

### Adicionando Novos Projetos

Para adicionar um novo projeto ao portfólio, copie o seguinte código HTML e cole-o dentro da div `projects-grid` no arquivo `index.html`:

```html
<div class="project-card" data-category="categoria">
    <div class="project-img">
        <img src="caminho/para/imagem.jpg" alt="Nome do Projeto">
    </div>
    <div class="project-info">
        <h3>Nome do Projeto</h3>
        <p>Descrição do projeto aqui.</p>
        <div class="project-tags">
            <span>Tag 1</span>
            <span>Tag 2</span>
        </div>
        <div class="project-links">
            <a href="#" target="_blank"><i class="fas fa-external-link-alt"></i></a>
            <a href="#" target="_blank"><i class="fab fa-github"></i></a>
        </div>
    </div>
</div>
```

Substitua:
- `categoria` com a categoria do projeto (web, app, design, etc.)
- `caminho/para/imagem.jpg` com o caminho para a imagem do projeto
- `Nome do Projeto` com o título do seu projeto
- `Descrição do projeto aqui` com uma breve descrição
- Tags e links conforme necessário

### Adicionando Novas Categorias de Filtro

Para adicionar uma nova categoria ao filtro de projetos:

1. Adicione um novo botão na div `project-filters` no arquivo `index.html`:

```html
<button class="filter-btn" data-filter="nova-categoria">Nova Categoria</button>
```

2. Certifique-se de que seus projetos dessa categoria tenham o atributo `data-category="nova-categoria"`

## Dicas de Personalização

- Substitua as imagens de placeholder por suas próprias imagens
- Personalize as cores para combinar com sua identidade visual
- Adicione mais seções conforme necessário (por exemplo, blog, testemunhos)
- Integre o formulário de contato com um serviço como FormSpree para receber emails
- Adicione análises do Google para rastrear visitantes

## Suporte

Se você tiver dúvidas ou precisar de ajuda para personalizar este template, sinta-se à vontade para abrir uma issue no repositório do GitHub.

---

© 2023 Seu Nome. Todos os direitos reservados.tar e publicar o site dnv