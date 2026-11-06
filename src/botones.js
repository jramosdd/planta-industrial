/* =========================================================
   BOTONES DE VISUALIZACIÓN — PLANTA INDUSTRIAL 3D

   MODO 1: MOSTRAR TODO
   MODO 2: SOLO BOMBAS UF + REFRIGERACIÓN

   No modifica geometrías ni coordenadas.
   ========================================================= */

export function crearBotonesVisualizacion(planta) {

  // =======================================================
  // 1. REFERENCIAS
  // =======================================================

  const equipos = planta.userData.equipos || [];

  const sistemaTuberias = planta.getObjectByName(
    "SISTEMA_TUBERIAS"
  );

  // =======================================================
  // 2. CREAR PANEL
  // =======================================================

  const panel = document.createElement("div");

  panel.id = "panelVisualizacion";

  panel.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 180px;
    padding: 12px;
    background: rgba(8,47,99,0.94);
    border-radius: 9px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.18);
    font-family: Arial, sans-serif;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 9px;
  `;

  // =======================================================
  // 3. CREAR BOTONES
  // =======================================================

  function crearBoton(texto, accion) {

    const boton = document.createElement("button");

    boton.textContent = texto;

    boton.style.cssText = `
      background: #3F7CB0;
      color: white;
      border: none;
      padding: 11px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      cursor: pointer;
    `;

    boton.addEventListener("click", accion);

    panel.appendChild(boton);

    return boton;
  }

  // =======================================================
  // 4. MOSTRAR TODO
  // =======================================================

  function mostrarTodo() {

    equipos.forEach(equipo => {
      equipo.visible = true;
    });

    if (sistemaTuberias) {
      sistemaTuberias.visible = true;

      sistemaTuberias.children.forEach(objeto => {
        objeto.visible = true;
      });
    }

    const piso = planta.getObjectByName("PISO_PLANTA");

    if (piso) piso.visible = true;
  }

  // =======================================================
  // 5. SOLO BOMBAS UF + REFRIGERACIÓN
  // =======================================================

  function mostrarBombasUF() {

    // Ocultar todos los equipos salvo bombas UF y PA-05
    equipos.forEach(equipo => {

      const esBombaUF =
        equipo.userData.tipo === "bombaUF";

      const esBombaRefrigeracion =
        equipo.name === "PA-05";

      equipo.visible =
        esBombaUF || esBombaRefrigeracion;
    });

    // Tuberías: mostrar solamente refrigeración
    if (sistemaTuberias) {

      sistemaTuberias.visible = true;

      sistemaTuberias.children.forEach(objeto => {

        const nombre = objeto.name.toUpperCase();

        const esRefrigeracion =
          objeto.userData.servicio === "refrigeracion" ||
          nombre.includes("REFRIGERACION") ||
          nombre.includes("TERMOSIFON") ||
          nombre.includes("SELLO");

        const esValvulaAguaTermosifon =
          nombre.startsWith("V_AGUA_TERMOSIFON_");

        const esValvulaPA05 =
          nombre === "V_DESCARGA_PA05" ||
          nombre === "V_SUCCION_PA-05";

        objeto.visible =
          esRefrigeracion ||
          esValvulaAguaTermosifon ||
          esValvulaPA05;
      });
    }

    // Mantener el piso
    const piso = planta.getObjectByName("PISO_PLANTA");

    if (piso) piso.visible = true;
  }

  // =======================================================
  // 6. AGREGAR BOTONES
  // =======================================================

  crearBoton("MOSTRAR TODO", mostrarTodo);

  crearBoton(
    "SOLO BOMBAS UF",
    mostrarBombasUF
  );

  document.body.appendChild(panel);

  // =======================================================
  // 7. FUNCIONES DISPONIBLES
  // =======================================================

  return {
    mostrarTodo,
    mostrarBombasUF
  };
}