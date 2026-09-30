# 🏫 Sala de Aula 3D

**Sala de Aula 3D** é uma experiência interativa desenvolvida para simular, em ambiente tridimensional, a sala de aula da unidade curricular de Computação Gráfica da Universidade do Sul de Santa Catarina (UNISUL), campus Dib Mussi.

O projeto permite explorar virtualmente o ambiente, navegar pela cena e interagir com elementos do espaço. Seu desenvolvimento aplica conceitos de modelagem 3D, transformações geométricas, renderização em tempo real e interação por raycasting diretamente no navegador.

> 🔗 **Projeto online:** [vite-classroom-project-kvkxm07i0-gustavos-projects-b0404bfd.vercel.app](https://vite-classroom-project-kvkxm07i0-gustavos-projects-b0404bfd.vercel.app/).

## 🎬 Demonstração do Projeto


<img width="1622" height="925" alt="Captura de tela 2026-09-30 185110" src="https://github.com/user-attachments/assets/df24691b-19c6-48fc-bfa5-3b129cec0878" />

<img width="1630" height="965" alt="Captura de tela 2026-09-30 185149" src="https://github.com/user-attachments/assets/f54c0bbb-2e86-41be-82c1-1ea86459fe6f" />

<img width="1627" height="767" alt="Captura de tela 2026-09-30 192118" src="https://github.com/user-attachments/assets/8911229c-816c-42c5-a347-953f4f6a9371" />

<img width="1243" height="567" alt="Captura de tela 2026-09-30 192131" src="https://github.com/user-attachments/assets/9eff7e9a-229b-4c8f-90fe-ff0c5388e08e" />

<img width="1602" height="765" alt="Captura de tela 2026-09-30 192146" src="https://github.com/user-attachments/assets/df4f46a7-c22b-4aac-9418-4a4a8e077736" />


## 🚀 Funcionalidades Principais & Interatividade

### 🖱️ Navegação pelo ambiente 3D

- **Exploração livre:** controles de órbita permitem mover a câmera e observar a sala por diferentes ângulos.
- **Renderização em tempo real:** a cena é processada no navegador com WebGL e aceleração por GPU.

### 🖥️ Projetor interativo

- **Troca de slides:** clique na tela do projetor ou use as teclas `←` e `→` para navegar entre os slides.
- **Modo apresentação:** ao trocar o slide, as luzes do ambiente são apagadas para destacar a projeção.
- **Religar luzes:** botão disponível na interface para restaurar a iluminação da sala.
- **Recorte em perspectiva:** a área iluminada acompanha corretamente a tela do projetor mesmo quando a câmera é movimentada.

### 🚪 Porta interativa

- **Abertura e fechamento:** ao clicar na porta, uma animação suave é executada.
- **Detalhamento do ambiente:** o vão da porta é exibido durante a abertura e ocultado ao fechá-la.

### 🌀 Ventilador animado

- **Rotação contínua:** as hélices executam animação no sentido horário.
- **Eixo correto:** a rotação considera a orientação original do modelo 3D, preservando o comportamento visual esperado.

## 🧩 Arquitetura do Sistema & Pipeline Gráfico

O projeto segue um pipeline gráfico voltado para aplicações 3D na web:

```text
Blender
  └── Modelagem 3D da sala e objetos
        ↓
GLTF / GLB
  └── Exportação e compactação dos modelos
        ↓
Three.js
  └── Carregamento do cenário, texturas, câmera e interações
        ↓
WebGL / GPU
  └── Processamento e renderização em tempo real
        ↓
Navegador
  └── Experiência interativa para o usuário
```
## 🛠️ Tecnologias Utilizadas

### Modelagem e renderização
  - Blender: modelagem dos objetos e da estrutura da sala.
  - GLTF / GLB: formato utilizado para exportar o modelo 3D.
  - Three.js: biblioteca responsável pela criação da cena, câmera, carregamento de modelos e renderização 3D.
  - WebGL: tecnologia que permite a renderização gráfica acelerada por hardware no navegador.
  - DRACO Loader: suporte ao carregamento de modelos 3D compactados.
### Desenvolvimento web
  - JavaScript (ES Modules): lógica da aplicação, eventos, animações e interações.
- HTML5: estrutura da página.
- SCSS / CSS: estilização da interface.
- Vite: ambiente de desenvolvimento e geração da build de produção.
- GSAP: animações suaves para elementos interativos, como a porta.
  
###⚙️ Conceitos de Computação Gráfica Aplicados
- Transformações geométricas: translação, rotação e escala dos objetos da cena.
- Câmera em perspectiva: visualização tridimensional do ambiente.
- Texturização: aplicação de texturas nos elementos do cenário.
- Raycasting: detecção de objetos clicados, utilizada nas interações do projetor e da porta.
- Renderização em tempo real: geração contínua da imagem da cena pelo WebGL.
- Animações: movimentação e rotação de objetos com atualização por frame.
  
### ⚡ Otimizações Aplicadas
Para manter um desempenho adequado no navegador, o projeto considera técnicas como:
- Redução da quantidade de polígonos dos modelos.
- Remoção de faces não visíveis.
- Reutilização e redução de texturas.
- Uso de baking, convertendo detalhes visuais e iluminação em texturas estáticas.
- Carregamento de modelo GLB compactado com DRACO.
