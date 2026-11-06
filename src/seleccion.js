import * as THREE from "three";
import { DATOS_EQUIPOS } from "./datos/equipos.js";

/* =========================================================
   SELECCIÓN DE EQUIPOS 3D
   FICHA TÉCNICA BÁSICA
   ========================================================= */

export function activarSeleccionEquipos({
  escena,
  camara,
  renderer,
  planta
}) {

  const equipos = planta.userData.equipos;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let inicioMouse = null;
  let resaltado = null;

  // =======================================================
  // PANEL DE INFORMACIÓN
  // =======================================================

  const panel = document.createElement("div");

  panel.id = "fichaEquipo";

  panel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 290px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 20px;
    background: rgba(255,255,255,0.97);
    color: #15233A;
    font-family: Arial, sans-serif;
    font-size: 13px;
    border: 1px solid #DCE4ED;
    border-radius: 10px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.15);
    box-sizing: border-box;
    z-index: 100;
    display: none;
  `;

  document.body.appendChild(panel);

  // =======================================================
  // CREAR FILA DE INFORMACIÓN
  // =======================================================

  function agregarDato(contenedor, titulo, valor) {

    const fila = document.createElement("div");

    fila.style.cssText = `
      padding: 8px 0;
      border-bottom: 1px solid #E6ECF2;
    `;

    const etiqueta = document.createElement("div");

    etiqueta.style.cssText = `
      font-size: 11px;
      color: #728096;
      margin-bottom: 4px;
    `;

    etiqueta.textContent = titulo;

    const contenido = document.createElement("div");

    contenido.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      color: #15233A;
    `;

    contenido.textContent = Array.isArray(valor)
      ? valor.join(", ")
      : String(valor ?? "Por definir");

    fila.appendChild(etiqueta);
    fila.appendChild(contenido);

    contenedor.appendChild(fila);
  }

  // =======================================================
  // MOSTRAR FICHA
  // =======================================================

  function mostrarFicha(equipo) {

    const datos = DATOS_EQUIPOS[equipo.name];

    if (!datos) return;

    panel.replaceChildren();
    panel.style.display = "block";

    const encabezado = document.createElement("div");

    encabezado.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 16px;
    `;

    const bloqueTitulo = document.createElement("div");

    const codigo = document.createElement("div");

    codigo.textContent = equipo.name;

    codigo.style.cssText = `
      color: #082F63;
      font-size: 20px;
      font-weight: bold;
    `;

    const nombre = document.createElement("div");

    nombre.textContent = datos.nombre;

    nombre.style.cssText = `
      color: #64748B;
      margin-top: 4px;
    `;

    bloqueTitulo.appendChild(codigo);
    bloqueTitulo.appendChild(nombre);

    const cerrar = document.createElement("button");

    cerrar.textContent = "×";

    cerrar.style.cssText = `
      border: none;
      background: #EEF2F6;
      color: #082F63;
      font-size: 22px;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
    `;

    cerrar.addEventListener("click", () => {
      panel.style.display = "none";

      if (resaltado) {
        escena.remove(resaltado);
        resaltado.geometry.dispose();
        resaltado.material.dispose();
        resaltado = null;
      }
    });

    encabezado.appendChild(bloqueTitulo);
    encabezado.appendChild(cerrar);
    panel.appendChild(encabezado);

    // =====================================================
    // DATOS DEL EQUIPO
    // =====================================================

    const nombres = {
      nombre: "Nombre",
      tipo: "Tipo de equipo",
      servicio: "Servicio",
      diametro: "Diámetro",
      capacidad: "Capacidad",
      alimentacion: "Alimentación",
      descarga: "Descarga",
      descargaOF: "Overflow hacia",
      bombas: "Bombas asociadas",
      equipoAsociado: "Equipo asociado",
      estado: "Estado",
      respaldo: "Bomba de respaldo",
      fabricante: "Fabricante",
      modelo: "Modelo",
      caudal: "Caudal",
      presion: "Presión",
      selloMecanico: "Sello mecánico",
      refrigeracion: "Refrigeración del sello"
    };

    Object.entries(datos).forEach(([clave, valor]) => {

      if (clave === "nombre") return;

      agregarDato(
        panel,
        nombres[clave] || clave,
        valor
      );
    });

    // =====================================================
    // COORDENADAS ACTUALES
    // =====================================================

    const posicion = equipo.position;

    const coordenadas = document.createElement("div");

    coordenadas.style.cssText = `
      margin-top: 16px;
      padding: 12px;
      border-radius: 6px;
      background: #EDF4FA;
      color: #082F63;
      line-height: 1.8;
    `;

    coordenadas.textContent =
      `X: ${posicion.x.toFixed(2)} m   ` +
      `Y: ${posicion.y.toFixed(2)} m   ` +
      `Z: ${posicion.z.toFixed(2)} m`;

    panel.appendChild(coordenadas);

  }

  // =======================================================
  // SELECCIONAR Y RESALTAR
  // =======================================================

  function seleccionar(equipo) {

    if (resaltado) {
      escena.remove(resaltado);
      resaltado.geometry.dispose();
      resaltado.material.dispose();
      resaltado = null;
    }

    resaltado = new THREE.BoxHelper(
      equipo,
      0xFFB400
    );

    escena.add(resaltado);

    mostrarFicha(equipo);
  }

  // =======================================================
  // DETECTAR CLIC
  // =======================================================

  renderer.domElement.addEventListener(
    "pointerdown",
    event => {

      if (event.button !== 0) return;

      inicioMouse = {
        x: event.clientX,
        y: event.clientY
      };
    }
  );

  renderer.domElement.addEventListener(
    "pointerup",
    event => {

      if (!inicioMouse || event.button !== 0) return;

      const distancia = Math.hypot(
        event.clientX - inicioMouse.x,
        event.clientY - inicioMouse.y
      );

      inicioMouse = null;

      if (distancia > 5) return;

      const rect =
        renderer.domElement.getBoundingClientRect();

      mouse.x =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;

      mouse.y =
        -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camara);

      const intersecciones = raycaster.intersectObjects(
        equipos,
        true
      );

      if (intersecciones.length === 0) return;

      let objeto = intersecciones[0].object;

      while (
        objeto.parent &&
        !equipos.includes(objeto)
      ) {
        objeto = objeto.parent;
      }

      if (equipos.includes(objeto)) {
        seleccionar(objeto);
      }
    }
  );

  return {
    actualizar() {
      if (resaltado) {
        resaltado.update();
      }
    }
  };
}