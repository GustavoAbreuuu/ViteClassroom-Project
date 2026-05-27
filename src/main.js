import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Loaders
const textureLoader = new THREE.TextureLoader();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Mapeamento: textura → prefixos dos nodes que pertencem a esse set
const textureMap = [
  {
    path: "/textures/room/texture_set01.webp",
    prefixes: ["paredes", "janela", "saida", "tela projetor", "helices", "rolo tela", "placa"]
  },
  {
    path: "/textures/room/texture_set02 - chao.webp",
    prefixes: ["chao"]
  },
  {
    path: "/textures/room/texture_set03 - mesas madeira.webp",
    prefixes: ["mesa frente", "pe mesa"]
  },
  {
    path: "/textures/room/texture_set04 - mesa cima.webp",
    prefixes: ["cima mesaprofessor", "topo mesa professor", "mesa - preta"]
  },
  {
    path: "/textures/room/texture_set05 - perifericos.webp",
    prefixes: ["monitor", "mouse", "CPU"]
  },
  {
    path: "/textures/room/texture_set06 - teclado low poly.webp",
    prefixes: ["base teclado"]
  },
  {
    path: "/textures/room/texture_set07 - cadeiras.webp",
    prefixes: ["cadeira"]
  },
  {
    path: "/textures/room/textute_set08 - diversos.webp",
    prefixes: ["projetor", "quadro", "porta", "exterior porta", "motor_ventilador", "base ventilador", "tomadas", "interruptor"]
  },
  {
    path: "/textures/room/texture_set09 - resto.webp",
    prefixes: ["rolo tela projetor", "CPU.0"]
  },
];

// Pré-carrega todas as texturas
const loadedTextures = textureMap.map(entry => {
  const texture = textureLoader.load(entry.path);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, prefixes: entry.prefixes };
});

// Retorna a textura correspondente ao nome do node, ou null se não encontrar
function getTextureForNode(nodeName) {
  for (const entry of loadedTextures) {
    if (entry.prefixes.some(prefix => nodeName.startsWith(prefix))) {
      return entry.texture;
    }
  }
  return null;
}

loader.load("/models/salaDeAula-v1.glb", (glb) => {
  glb.scene.traverse(child => {
    if (child.isMesh) {
      const texture = getTextureForNode(child.name);
      if (texture) {
        child.material = new THREE.MeshBasicMaterial({ map: texture });
      }
    }
  });

  scene.add(glb.scene);
});

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const dragPlane = new THREE.Plane();
const dragOffset = new THREE.Vector3();
const worldPosition = new THREE.Vector3();

let isDragging = false;

function getPointerNDC(event) {
  pointer.x = (event.clientX / sizes.width) * 2 - 1;
  pointer.y = -(event.clientY / sizes.height) * 2 + 1;
}

canvas.addEventListener("pointerdown", (event) => {
  getPointerNDC(event);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObject(cube);
  if (hits.length > 0) {
    isDragging = true;
    canvas.style.cursor = "grabbing";

    dragPlane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()),
      hits[0].point
    );

    raycaster.ray.intersectPlane(dragPlane, worldPosition);
    dragOffset.subVectors(cube.position, worldPosition);
  }
});

canvas.addEventListener("pointermove", (event) => {
  getPointerNDC(event);
  raycaster.setFromCamera(pointer, camera);

  if (isDragging) {
    raycaster.ray.intersectPlane(dragPlane, worldPosition);
    cube.position.copy(worldPosition.add(dragOffset));
  } else {
    const hits = raycaster.intersectObject(cube);
    canvas.style.cursor = hits.length > 0 ? "grab" : "default";
  }
});

canvas.addEventListener("pointerup", () => {
  isDragging = false;
  canvas.style.cursor = "default";
});

canvas.addEventListener("pointerleave", () => {
  isDragging = false;
});

// Event Listeners
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update Camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update Renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate(time) {
  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;

  controls.update();

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
