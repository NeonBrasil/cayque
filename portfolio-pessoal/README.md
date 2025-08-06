# Portfolio Pessoal

Este é o meu portfólio pessoal, um projeto moderno e responsivo que apresenta minhas habilidades, experiências e projetos. O portfólio é construído com HTML, CSS e JavaScript, e é otimizado para funcionar em diferentes dispositivos.

## Estrutura do Projeto

O projeto é organizado da seguinte forma:

```
portfolio-pessoal
├── src
│   ├── index.html          # Arquivo principal HTML
│   ├── css
│   │   ├── main.css        # Estilos principais
│   │   ├── components      # Estilos específicos para seções
│   │   │   ├── header.css
│   │   │   ├── hero.css
│   │   │   ├── about.css
│   │   │   ├── portfolio.css
│   │   │   ├── skills.css
│   │   │   ├── contact.css
│   │   │   └── footer.css
│   │   └── utils           # Estilos utilitários
│   │       ├── variables.css
│   │       ├── reset.css
│   │       └── responsive.css
│   ├── js
│   │   ├── main.js         # Código JavaScript principal
│   │   ├── components      # Lógica específica para seções
│   │   │   ├── navigation.js
│   │   │   ├── portfolio-filter.js
│   │   │   ├── smooth-scroll.js
│   │   │   └── theme-toggle.js
│   │   └── utils           # Funções utilitárias
│   │       └── helpers.js
│   └── assets              # Recursos do portfólio
│       ├── icons
│       └── data
│           └── projects.json
├── .github
│   └── workflows
│       └── deploy.yml      # Configuração de implantação
├── .gitignore              # Arquivos a serem ignorados pelo Git
├── package.json            # Configurações do npm
├── webpack.config.js       # Configuração do Webpack
└── README.md               # Documentação do projeto
```

## Como Usar

1. Clone o repositório:
   ```
   git clone https://github.com/seu-usuario/portfolio-pessoal.git
   ```

2. Navegue até o diretório do projeto:
   ```
   cd portfolio-pessoal
   ```

3. Instale as dependências:
   ```
   npm install
   ```

4. Execute o projeto:
   ```
   npm start
   ```

5. Para publicar no GitHub Pages, siga as instruções no arquivo `.github/workflows/deploy.yml`.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript ES6+
- Webpack
- GitHub Actions

## Contribuições

Sinta-se à vontade para contribuir com melhorias ou sugestões. Para isso, abra uma issue ou envie um pull request.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.