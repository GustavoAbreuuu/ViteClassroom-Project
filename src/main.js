import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gsap } from 'gsap';

const canvas = document.querySelector("#experience-canvas");

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Scene, Camera, Renderer
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);

camera.position.set(8, 6, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  logarithmicDepthBuffer: true
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Loaders
const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// =====================================================
// SLIDES
// =====================================================

const slidePaths = [
  "/textures/slides/slide01.webp",
  "/textures/slides/slide02.webp",
  "/textures/slides/slide03.webp",
  "/textures/slides/slide04.webp",
  "/textures/slides/slide05.webp",
  "/textures/slides/slide06.webp",
  "/textures/slides/slide07.webp",
  "/textures/slides/slide08.webp",
  "/textures/slides/slide09.webp",
  "/textures/slides/slide10.webp",
];

let currentSlide = 0;
let telaProjetorMeshes = [];

const slideTexture = textureLoader.load(slidePaths[currentSlide]);
slideTexture.flipY = false;
slideTexture.colorSpace = THREE.SRGBColorSpace;

function applySlideTexture() {
  telaProjetorMeshes.forEach(mesh => {
    mesh.material.map = slideTexture;
    mesh.material.needsUpdate = true;
  });
}

function changeSlide(direction) {
  currentSlide =
    (currentSlide + direction + slidePaths.length) % slidePaths.length;

  const img = new Image();
  img.onload = () => {
    slideTexture.image = img;
    slideTexture.needsUpdate = true;
  };
  img.src = slidePaths[currentSlide];

  // Apaga as luzes na primeira troca de slide (modo apresentação)
  apagarLuzes();

  updateSlideUI();
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") changeSlide(1);
  if (e.key === "ArrowLeft") changeSlide(-1);
});

// =====================================================
// UI: indicador de slide + hint
// =====================================================

const uiContainer = document.createElement("div");
uiContainer.style.cssText = `
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
  z-index: 10;
`;
document.body.appendChild(uiContainer);

const hint = document.createElement("div");
hint.style.cssText = `
  color: rgba(255,255,255,0.6);
  font-family: Inter, sans-serif;
  font-size: 13px;
  letter-spacing: 0.03em;
  background: rgba(0,0,0,0.35);
  padding: 4px 14px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
`;
hint.textContent = "Clique na tela ou use ← → para trocar os slides";
uiContainer.appendChild(hint);

const dotsRow = document.createElement("div");
dotsRow.style.cssText = `
  display: flex;
  gap: 8px;
`;
uiContainer.appendChild(dotsRow);

const dots = [];
slidePaths.forEach((_, i) => {
  const dot = document.createElement("div");
  dot.style.cssText = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${i === 0 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.3)"};
    transition: background 0.25s;
  `;
  dotsRow.appendChild(dot);
  dots.push(dot);
});

function updateSlideUI() {
  dots.forEach((dot, i) => {
    dot.style.background =
      i === currentSlide
        ? "rgba(255,255,255,0.95)"
        : "rgba(255,255,255,0.3)";
  });
}

// =====================================================
// OVERLAY DE "LUZES APAGADAS"
// =====================================================

let luzApagada = false;
let overlayOpacity = 0; // controlado por GSAP para suavidade no clip-path

// Overlay escuro — simula sala com luzes apagadas.
// Usa clip-path para excluir a área do slide do escurecimento.
const overlay = document.createElement("div");
overlay.style.cssText = `
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 10, 0.72);
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity 1.2s ease;
`;
document.body.appendChild(overlay);

// Botão de "religar luzes"
const btnLuz = document.createElement("button");
btnLuz.textContent = "💡 Religar luzes";
btnLuz.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  font-family: Inter, sans-serif;
  font-size: 13px;
  cursor: pointer;
  backdrop-filter: blur(6px);
  z-index: 20;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease, background 0.2s ease;
`;
btnLuz.addEventListener("mouseenter", () => {
  btnLuz.style.background = "rgba(255,255,255,0.25)";
});
btnLuz.addEventListener("mouseleave", () => {
  btnLuz.style.background = "rgba(255,255,255,0.15)";
});
btnLuz.addEventListener("click", () => {
  luzApagada = false;
  overlay.style.opacity = "0";
  overlay.style.clipPath = "";
  btnLuz.style.opacity = "0";
  btnLuz.style.pointerEvents = "none";
});
document.body.appendChild(btnLuz);

// Projeta um ponto 3D para coordenadas de tela (0..width, 0..height)
function projectToScreen(vec3, camera, width, height) {
  const v = vec3.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * width,
    y: (-v.y * 0.5 + 0.5) * height,
  };
}

// Atualiza o clip-path do overlay para excluir a área do slide
// Chamada a cada frame quando luzApagada=true
function atualizarClipPathOverlay() {
  if (telaProjetorMeshes.length === 0) return;

  const slidePlane = telaProjetorMeshes[0];
  slidePlane.updateMatrixWorld(true);

  const w = sizes.width;
  const h = sizes.height;

  // Os 4 cantos do PlaneGeometry 4.6x2.59 em espaço local.
  // A mesh tem rotation.z = Math.PI, então os cantos em espaço local
  // são invertidos — projetamos direto via matrixWorld para obter
  // os pontos corretamente em perspectiva.
  const hw = 4.6 / 2;
  const hh = 2.59 / 2;
  const margin = 16; // px de folga ao redor do slide

  // Ordem: topo-esq, topo-dir, baixo-dir, baixo-esq (sentido anti-horário)
  // para criar um "furo" correto no clip-path via even-odd rule
  const pts = [
    new THREE.Vector3(-hw,  hh, 0),
    new THREE.Vector3( hw,  hh, 0),
    new THREE.Vector3( hw, -hh, 0),
    new THREE.Vector3(-hw, -hh, 0),
  ].map(v => {
    v.applyMatrix4(slidePlane.matrixWorld);
    return projectToScreen(v, camera, w, h);
  });

  // Expande cada ponto para fora do centro do polígono pela margem
  const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
  const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
  const expanded = pts.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: p.x + (dx / len) * margin,
      y: p.y + (dy / len) * margin,
    };
  });

  // clip-path: contorno externo (tela toda, sentido horário)
  // + contorno interno do slide (sentido anti-horário = furo)
  // CSS clip-path usa a regra nonzero: sentidos opostos criam o buraco
  const outer = `0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%`;
  const inner = expanded.map(p => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(', ');
  // Fecha o polígono interno repetindo o primeiro ponto
  const p0 = `${expanded[0].x.toFixed(1)}px ${expanded[0].y.toFixed(1)}px`;

  overlay.style.clipPath = `polygon(${outer}, ${inner}, ${p0})`;
}

function apagarLuzes() {
  if (luzApagada) return;
  luzApagada = true;
  overlay.style.opacity = "1";
  btnLuz.style.opacity = "1";
  btnLuz.style.pointerEvents = "auto";
}

// =====================================================
// RAYCASTER
// =====================================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// =====================================================
// PORTA — ANIMAÇÃO DE ABERTURA
// =====================================================

let portaMeshes = [];    // meshes clicáveis da porta
let portaPivot = null;   // Group com pivot no batente
let portaAberta = false;
let portaAnimando = false;
let vaoPorta = null;     // plano claro do vão da porta (oculto quando fechada)

function abrirFecharPorta() {
  if (portaAnimando || !portaPivot) return;
  portaAnimando = true;

  const abrindo = !portaAberta;
  const alvo = abrindo ? Math.PI / 2 : 0;

  // Mostra o vao ao comecar a abrir
  if (abrindo && vaoPorta) vaoPorta.visible = true;

  gsap.to(portaPivot.rotation, {
    y: alvo,
    duration: 1.0,
    ease: "power2.inOut",
    onComplete: () => {
      // Esconde o vao quando a porta termina de fechar
      if (!abrindo && vaoPorta) vaoPorta.visible = false;
      portaAberta = abrindo;
      portaAnimando = false;
    }
  });
}

// =====================================================
// VENTILADOR — ANIMAÇÃO DAS HÉLICES
// =====================================================

let helicesMeshes = [];  // meshes das hélices detectadas no GLB
let helicesPivot = null; // Group com pivot no centro das hélices
let helicesRotationAxis = null;
const HELICES_ANGULAR_SPEED = Math.PI * 2; // uma volta por segundo

// Clique unificado: slide OU porta
canvas.addEventListener("click", (e) => {
  mouse.x = (e.clientX / sizes.width) * 2 - 1;
  mouse.y = -(e.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Slide
  const intersectsSlide = raycaster.intersectObjects(telaProjetorMeshes);
  if (intersectsSlide.length > 0) {
    changeSlide(1);
    return;
  }

  // Porta
  if (portaMeshes.length > 0) {
    const intersectsPorta = raycaster.intersectObjects(portaMeshes, true);
    if (intersectsPorta.length > 0) {
      abrirFecharPorta();
      return;
    }
  }

});

// Cursor pointer
canvas.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / sizes.width) * 2 - 1;
  mouse.y = -(e.clientY / sizes.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersectsSlide = raycaster.intersectObjects(telaProjetorMeshes);
  const intersectsPorta = portaMeshes.length > 0
    ? raycaster.intersectObjects(portaMeshes, true)
    : [];

  canvas.style.cursor =
    intersectsSlide.length > 0 || intersectsPorta.length > 0
      ? "pointer"
      : "default";
});

// =====================================================
// MAPEAMENTO DE TEXTURAS
// =====================================================

const textureMap = [
  {
    path: "/textures/room/texture_set01.webp",
    prefixes: ["paredes", "placa", "itens_textura01"]
  },
  {
    path: "/textures/room/texture_set02 - chao.webp",
    prefixes: ["chao_-_base", "itens_textura02"]
  },
  {
    path: "/textures/room/texture_set03 - mesas madeira.webp",
    prefixes: ["mesa_frente", "pe_mesa_professor", "itens_textura03"]
  },
  {
    path: "/textures/room/texture_set04 - mesa cima.webp",
    prefixes: ["cima_mesaprofessor", "topo_mesa_professor", "mesa_-_preta", "itens_textura04"]
  },
  {
    path: "/textures/room/texture_set05 - perifericos.webp",
    prefixes: ["monitor", "mouse", "cpu", "itens_textura05"]
  },
  {
    path: "/textures/room/texture_set06 - teclado low poly.webp",
    prefixes: ["base_teclado", "itens_textura06"]
  },
  {
    path: "/textures/room/texture_set07 - cadeiras.webp",
    prefixes: ["cadeira", "itens_textura07"]
  },
  {
    path: "/textures/room/texture_set08 - diversos.webp",
    prefixes: [
      "projetor", "quadro", "porta", "exterior_porta",
      "motor_ventilador", "base_ventilador", "tomadas",
      "interruptor", "itens_textura08"
    ]
  },
  {
    path: "/textures/room/texture_set09 - resto.webp",
    prefixes: ["rolo_tela_projetor", "placa_quadro", "placa_cima_luz", "itens_textura09"]
  },
  {
    path: "/textures/room/texture_set10 - interativos.webp",
    prefixes: [
      "janelacanto", "janeladupla", "saida",
      "telaprojetor", "helices", "placa_luz", "itens_textura10"
    ]
  }
];

const loadedTextures = textureMap.map(entry => {
  const texture = textureLoader.load(
    entry.path,
    () => console.log("✅ Textura carregada:", entry.path),
    undefined,
    err => console.error("❌ ERRO ao carregar textura:", entry.path, err)
  );
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, path: entry.path, prefixes: entry.prefixes };
});

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function getTextureEntryForNode(nodeName) {
  const normalized = normalizeName(nodeName);
  for (const entry of loadedTextures) {
    if (entry.prefixes.some(prefix => normalized.startsWith(normalizeName(prefix)))) {
      return entry;
    }
  }
  return null;
}

// =====================================================
// CARREGAMENTO DO GLB
// =====================================================

loader.load("/models/salaDeAula-v1.glb", (glb) => {

  const unmatched = [];

  // --- Coleta meshes da porta antes de atravessar ---
  // Precisamos do bounding box para criar o pivot correto
  const portaCandidates = [];

  glb.scene.traverse((child) => {
    if (!child.isMesh) return;

    const childNameLower = child.name.toLowerCase();
    const parentNameLower = child.parent?.name?.toLowerCase() || "";

    // Detecta porta
    const isPorta =
      childNameLower.startsWith("porta") ||
      parentNameLower.startsWith("porta") ||
      childNameLower.startsWith("exterior_porta") ||
      parentNameLower.startsWith("exterior_porta");

    if (isPorta) {
      portaCandidates.push(child);
    }

  });

  // --- Monta pivot da porta ---
  if (portaCandidates.length > 0) {
    // Calcula bounding box global de todas as meshes da porta
    const box = new THREE.Box3();
    portaCandidates.forEach(mesh => {
      mesh.updateWorldMatrix(true, false);
      box.expandByObject(mesh);
    });

    const portaSize = new THREE.Vector3();
    box.getSize(portaSize);
    const portaCenter = new THREE.Vector3();
    box.getCenter(portaCenter);

    console.log("🚪 Porta — bbox center:", portaCenter, "size:", portaSize);

    // O pivot fica no batente: escolhemos o lado com maior X (ou menor, conforme
    // a orientação da porta na cena). Testamos ambos; o usuário pode ajustar.
    // Pela imagem a porta está no canto direito da sala (X alto).
    // Batente = borda com maior X da bbox.
    const pivotX = box.max.x;
    const pivotY = box.min.y;
    const pivotZ = portaCenter.z;

    portaPivot = new THREE.Group();
    portaPivot.position.set(pivotX, pivotY, pivotZ);
    scene.add(portaPivot);

    portaCandidates.forEach(mesh => {
      // Converte posição world -> local do pivot
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      mesh.getWorldQuaternion(worldQuat);
      const worldScale = new THREE.Vector3();
      mesh.getWorldScale(worldScale);

      // Remove mesh do parent original e adiciona ao pivot
      mesh.parent.remove(mesh);
      portaPivot.add(mesh);

      // Reposiciona a mesh relativa ao pivot
      mesh.position.copy(
        worldPos.clone().sub(new THREE.Vector3(pivotX, pivotY, pivotZ))
      );
      mesh.quaternion.copy(worldQuat);
      mesh.scale.copy(worldScale);

      portaMeshes.push(mesh);
      console.log("🚪 Mesh de porta adicionada ao pivot:", mesh.name);
    });

    // Plano claro no vão da porta — aparece quando a porta abre
    const vaoGeo = new THREE.PlaneGeometry(portaSize.x, portaSize.y);
    const vaoMat = new THREE.MeshBasicMaterial({
      color: 0xe8e0d0,
      side: THREE.DoubleSide,
    });
    const vaoPlane = new THREE.Mesh(vaoGeo, vaoMat);
    vaoPlane.position.set(
      portaCenter.x,
      portaCenter.y,
      box.max.z + 0.02
    );
    vaoPlane.visible = false; // oculto enquanto a porta estiver fechada
    scene.add(vaoPlane);
    vaoPorta = vaoPlane;
    console.log("Vao da porta em:", vaoPlane.position);
  }

  // --- Localiza a mesh das hélices pelo nome exato ---
  // Só captura a mesh cuja geometry é a das pás — ignora motor e base.
  // O nome no Blender é "helices" (ou começa com "helices" diretamente,
  // sem ser filho de outro objeto chamado "helices").
  glb.scene.traverse((child) => {
    if (!child.isMesh) return;
    const n = child.name.toLowerCase();
    // Aceita apenas a mesh cujo PRÓPRIO nome começa com "helices"
    // e cujo parent NÃO é também "helices" (evita filhos como motor/base)
    const parentN = child.parent?.name?.toLowerCase() || "";
    const isHelicesPropria = n.startsWith("helices") && !parentN.startsWith("helices");
    if (isHelicesPropria) {
      helicesMeshes.push(child);
      console.log('Helice encontrada:', child.name, '| parent:', child.parent?.name);
    }
  });

  if (helicesMeshes.length > 0) {
    // Calcula o centro world das hélices para o pivot
    const bbox = new THREE.Box3();
    helicesMeshes.forEach(m => { m.updateWorldMatrix(true, false); bbox.expandByObject(m); });
    const centro = new THREE.Vector3();
    bbox.getCenter(centro);

    // Cria o pivot no centro das hélices
    helicesPivot = new THREE.Group();
    helicesPivot.position.copy(centro);
    scene.add(helicesPivot);

    // Reparenta SOMENTE as meshes de hélice para o pivot
    helicesMeshes.forEach(m => {
      m.updateWorldMatrix(true, false);
      const wPos = new THREE.Vector3();
      const wQuat = new THREE.Quaternion();
      const wScale = new THREE.Vector3();
      m.getWorldPosition(wPos);
      m.getWorldQuaternion(wQuat);
      m.getWorldScale(wScale);

      m.parent.remove(m);
      helicesPivot.add(m);

      m.position.subVectors(wPos, centro);
      m.quaternion.copy(wQuat);
      m.scale.copy(wScale);

      // No GLB, a espessura das pás está no eixo local X. Convertemos esse
      // eixo para world space antes de separar a mesh de sua hierarquia.
      if (!helicesRotationAxis) {
        helicesRotationAxis = new THREE.Vector3(1, 0, 0)
          .applyQuaternion(wQuat)
          .normalize();
      }
    });

    console.log('Pivot das helices em:', centro, '| total meshes:', helicesMeshes.length);
  }

  // --- Traverse normal para texturas ---
  glb.scene.traverse((child) => {
    if (!child.isMesh) return;

    const childNameLower = child.name.toLowerCase();
    const parentNameLower = child.parent?.name?.toLowerCase() || "";

    // Porta: face externa com textura (FrontSide) + face interna branca (BackSide)
    // A face interna branca fica visível apenas quando a porta está aberta.
    if (portaMeshes.includes(child)) {
      const textureEntry = getTextureEntryForNode("porta");

      // Face externa: textura original do Blender (preta/texturizada)
      child.material = textureEntry
        ? new THREE.MeshBasicMaterial({ map: textureEntry.texture, side: THREE.FrontSide })
        : new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.FrontSide });

      // Face interna: mesh gêmea com BackSide branco, filha da original
      // Herda todas as transformações e fica sempre sincronizada
      const interno = new THREE.Mesh(
        child.geometry,
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })
      );
      interno.name = child.name + "_interno";
      child.add(interno);

      return;
    }

    // Detecta a tela do projetor
    const isTelaProjetor =
      childNameLower.startsWith("telaprojetor") ||
      parentNameLower === "telaprojetor" ||
      parentNameLower.startsWith("telaprojetor");

    if (isTelaProjetor) {
      console.log("🎬 Tela do projetor encontrada:", child.name);

      const originalEntry = getTextureEntryForNode("telaprojetor");
      if (originalEntry) {
        child.material = new THREE.MeshBasicMaterial({
          map: originalEntry.texture,
          side: THREE.DoubleSide,
        });
      }

      const slideGeo = new THREE.PlaneGeometry(4.6, 2.59);
      const slideMat = new THREE.MeshBasicMaterial({
        map: slideTexture,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const slidePlane = new THREE.Mesh(slideGeo, slideMat);
      slidePlane.position.set(3.3, 5.4, -4.42);
      slidePlane.rotation.set(0, Math.PI, Math.PI);

      scene.add(slidePlane);
      telaProjetorMeshes.push(slidePlane);

      return;
    }

    // Mapeamento normal
    const parentName = child.parent?.name || "";
    const isGeneric = /^(Cube|Plane|Sphere|Cylinder|Circle|Torus)/i.test(child.name);

    let textureEntry = null;

    if (parentName) textureEntry = getTextureEntryForNode(parentName);
    if (!textureEntry && !isGeneric) textureEntry = getTextureEntryForNode(child.name);
    if (!textureEntry && isGeneric && parentName) textureEntry = getTextureEntryForNode(parentName);

    if (textureEntry) {
      const nodeName = parentNameLower || childNameLower;
      const isTampo   = nodeName.includes("itens_textura04");
      const isMadeira = nodeName.includes("itens_textura03");

      child.material = new THREE.MeshBasicMaterial({
        map: textureEntry.texture,
        side: THREE.DoubleSide,
        polygonOffset:       isTampo || isMadeira,
        polygonOffsetFactor: isTampo ? -4 : isMadeira ? 4 : 0,
        polygonOffsetUnits:  isTampo ? -4 : isMadeira ? 4 : 0,
      });
      console.log("✅ Textura aplicada:", textureEntry.path, "->", child.name);
    } else {
      unmatched.push(parentName || child.name);
      child.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    }
  });

  if (unmatched.length > 0) {
    console.warn("Nodes sem textura:", [...new Set(unmatched)]);
  } else {
    console.log("✅ Todas as texturas aplicadas com sucesso!");
  }

  if (telaProjetorMeshes.length === 0) {
    console.warn("⚠️ Nenhuma mesh 'telaprojetor' encontrada no modelo.");
  } else {
    console.log(`✅ ${telaProjetorMeshes.length} mesh(es) da tela do projetor registrada(s).`);
  }

  if (portaMeshes.length === 0) {
    console.warn("⚠️ Nenhuma mesh 'porta' encontrada no modelo.");
  } else {
    console.log(`✅ ${portaMeshes.length} mesh(es) da porta registrada(s). Clique para abrir!`);
  }

  scene.add(glb.scene);
});

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Resize
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Render Loop
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta(); // segundos desde o último frame

  // Rotação contínua das hélices no sentido horário.
  // O sinal negativo produz a rotação horária quando observada de frente.
  if (helicesPivot && helicesRotationAxis) {
    helicesPivot.rotateOnWorldAxis(
      helicesRotationAxis,
      -HELICES_ANGULAR_SPEED * delta
    );
  }

  // Atualiza clip-path do overlay para manter o slide sempre iluminado
  if (luzApagada) {
    atualizarClipPathOverlay();
  }

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
