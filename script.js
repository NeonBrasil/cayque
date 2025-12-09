// Esperar que o DOM seja completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const contactForm = document.getElementById('contactForm');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.documentElement; // Usando :root para alternar classes
    
    // Verificar preferência de tema salva
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // Alternar tema
    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'light');
        }
    });

    // Toggle do menu mobile
    menuBtn.addEventListener('click', function() {
        menuBtn.classList.toggle('open');
        navLinks.classList.toggle('active');
    });
    
    // Criar partículas animadas no fundo
    createParticles();
    
    // Função para criar partículas animadas
    function createParticles() {
        const particleContainer = document.querySelector('.particle-container');
        if (!particleContainer) return;
        
        const particleCount = 20; // Número de partículas
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Tamanho aleatório
            const size = Math.random() * 50 + 10; // Entre 10px e 60px
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Posição aleatória
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            
            // Duração e atraso aleatórios para a animação
            const duration = Math.random() * 20 + 10; // Entre 10s e 30s
            const delay = Math.random() * 5; // Entre 0s e 5s
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            
            // Opacidade aleatória
            const opacity = Math.random() * 0.3 + 0.05; // Entre 0.05 e 0.35
            particle.style.opacity = opacity;
            
            particleContainer.appendChild(particle);
        }
    }

    // Fechar menu ao clicar em um link
    navLinks.addEventListener('click', function() {
        menuBtn.classList.remove('open');
        navLinks.classList.remove('active');
    });

    // Filtro de projetos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover classe active de todos os botões
            filterBtns.forEach(btn => btn.classList.remove('active'));
            // Adicionar classe active ao botão clicado
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            projectCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else if (card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }

                // Adicionar animação de fade-in
                setTimeout(() => {
                    if (card.style.display === 'block') {
                        card.style.opacity = '1';
                    }
                }, 100);
            });
        });
    });

    // Formulário de contato
    if (contactForm) {
        // Validação do formulário antes do envio
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Impede o envio padrão do formulário
            
            // Validação básica dos campos
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !subject || !message) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            // Formatar o corpo do email
            const body = `Nome: ${name}\n\nEmail: ${email}\n\nMensagem:\n${message}`;
            
            // Abrir o cliente de email do usuário (Gmail ou outro)
            // Substitua 'seu-email@gmail.com' pelo email que deve receber as mensagens
            window.location.href = `mailto:seu-email@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            // Limpar o formulário após o envio
            contactForm.reset();
        });
    }

    // Animação de scroll suave para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // Ajuste para o header fixo
                    behavior: 'smooth'
                });
            }
        });
    });

    // Destacar item de navegação ativo durante o scroll
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').substring(1) === current) {
                item.classList.add('active');
            }
        });
    });

    // Animação de entrada para elementos quando visíveis na tela
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight - 100) {
                element.classList.add('animated');
            }
        });
    };

    // Adicionar classe para animação em elementos específicos
    const addAnimationClass = function() {
        document.querySelectorAll('.about-img, .about-text, .skill, .project-card, .contact-item').forEach(el => {
            el.classList.add('animate-on-scroll');
        });
    };

    addAnimationClass();
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Executar uma vez no carregamento da página

    // Adicionar efeito de parallax no hero
    window.addEventListener('scroll', function() {
        const hero = document.querySelector('.hero');
        const scrollPosition = window.pageYOffset;
        
        if (hero) {
            hero.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        }
    });

    // Adicionar animação de digitação ao texto do hero
    const typeWriter = function() {
        const heroTitle = document.querySelector('.hero h1');
        
        if (heroTitle) {
            const text = heroTitle.innerHTML;
            heroTitle.innerHTML = '';
            
            let i = 0;
            const typing = setInterval(function() {
                if (i < text.length) {
                    heroTitle.innerHTML += text.charAt(i);
                    i++;
                } else {
                    clearInterval(typing);
                }
            }, 100);
        }
    };

    // Descomente a linha abaixo se quiser ativar o efeito de digitação
    // typeWriter();

    // Adicionar animação às barras de habilidades
    const animateSkills = function() {
        const skillBars = document.querySelectorAll('.skill-level');
        
        skillBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            
            setTimeout(() => {
                bar.style.width = width;
            }, 500);
        });
    };

    // Executar animação das habilidades quando a seção estiver visível
    const skillsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkills();
                skillsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const skillsSection = document.querySelector('.skills');
    if (skillsSection) {
        skillsObserver.observe(skillsSection);
    }

    // Adicionar botão de voltar ao topo
    const createBackToTopButton = function() {
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-arrow-up"></i>';
        button.classList.add('back-to-top');
        document.body.appendChild(button);
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                button.classList.add('show');
            } else {
                button.classList.remove('show');
            }
        });
        
        button.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    };

    createBackToTopButton();

    // Adicionar estilos para o botão de voltar ao topo
    const addBackToTopStyles = function() {
        const style = document.createElement('style');
        style.textContent = `
            .back-to-top {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.2rem;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 999;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            }
            
            .back-to-top.show {
                opacity: 1;
                visibility: visible;
            }
            
            .back-to-top:hover {
                background-color: #5a52d5;
                transform: translateY(-3px);
            }
        `;
        document.head.appendChild(style);
    };

    addBackToTopStyles();

    // Adicionar animação aos ícones sociais
    const socialIcons = document.querySelectorAll('.social-icons a');
    
    socialIcons.forEach((icon, index) => {
        icon.style.opacity = '0';
        icon.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            icon.style.opacity = '1';
            icon.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});

// Language functionality
let currentLanguage = 'pt';

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            // Se for o botão de download CV, preservar o ícone
            if (key === 'download-cv') {
                const icon = element.querySelector('i');
                element.textContent = translations[lang][key];
                if (icon) {
                    element.prepend(icon);
                } else {
                    element.innerHTML = '<i class="fas fa-download"></i> ' + translations[lang][key];
                }
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Update placeholders
    const placeholders = {
        'name': translations[lang]['form-name'],
        'email': translations[lang]['form-email'],
        'subject': translations[lang]['form-subject'],
        'message': translations[lang]['form-message']
    };
    
    Object.keys(placeholders).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.placeholder = placeholders[id];
        }
    });
}

function initLanguage() {
    // Check if language is saved in localStorage
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
        document.getElementById('languageSelect').value = savedLanguage;
        changeLanguage(savedLanguage);
    }
}

// Language selector event listener
document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }
    
    // Initialize language
    initLanguage();
});