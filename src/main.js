import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector("#experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);

camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setAnimationLoop(animate); 

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
  camera.updateProjectionMatrix()

// Update Renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

function animate(time) {

  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;
  
  renderer.render(scene, camera);
};
