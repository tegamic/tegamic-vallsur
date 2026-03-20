let datosMaquinas = null;
let ciudadActual = "valladolid";
let rankingCargado = false;

const maquina = document.getElementById("maquina");
const resultado = document.getElementById("resultado");
const botonRanking = document.getElementById("boton-ranking");
const ranking = document.getElementById("ranking");
const rankingCartas = document.getElementById("ranking-cartas");
const tituloCiudad = document.getElementById("titulo-ciudad");
const botonesCiudad = document.querySelectorAll(".ciudad-btn");

async function cargarDatosMaquinas() {
  if (datosMaquinas) return datosMaquinas;

  const response = await fetch("data/maquinas.json");

  if (!response.ok) {
    throw new Error(`Error cargando JSON: ${response.status}`);
  }

  datosMaquinas = await response.json();
  return datosMaquinas;
}

async function obtenerCiudadActual() {
  const datos = await cargarDatosMaquinas();
  return datos[ciudadActual];
}

function parsePrecio(precio) {
  return Number(precio.replace("€", "").replace(",", "."));
}

function renderCarta(carta) {
  return `
    <div class="carta">
      <img src="${carta.imagen}" alt="${carta.nombre}" loading="lazy">
      <p>${carta.nombre}</p>
      <b>${carta.precio}</b>
    </div>
  `;
}

function seleccionarBoton(boton) {
  document.querySelectorAll("#maquina button").forEach(btn => {
    btn.classList.remove("activo");
  });
  boton.classList.add("activo");
}

function actualizarBotonesCiudad() {
  botonesCiudad.forEach(btn => {
    btn.classList.toggle("activo", btn.dataset.ciudad === ciudadActual);
  });
}

function construirMapaCombinaciones(combinaciones) {
  const mapa = new Map();

  combinaciones.forEach(combo => {
    combo.ids.forEach(id => mapa.set(id, combo));
  });

  return mapa;
}

async function renderizarMaquina() {
  const ciudad = await obtenerCiudadActual();
  const espirales = ciudad.espiralesOrden || [];
  const combinaciones = ciudad.combinaciones || [];
  const espiralesCombinadas = construirMapaCombinaciones(combinaciones);

  if (tituloCiudad) {
    tituloCiudad.textContent = ciudad.titulo || ciudad.nombre || ciudadActual;
  }

  maquina.innerHTML = "";
  resultado.innerHTML = `<h2>Selecciona un carril para ver las cartas más valiosas</h2>`;

  const yaRenderizadas = new Set();

  espirales.forEach(id => {
    if (yaRenderizadas.has(id)) return;

    const combo = espiralesCombinadas.get(id);
    const btn = document.createElement("button");

    if (combo) {
      combo.ids.forEach(x => yaRenderizadas.add(x));
      btn.innerText = combo.label;
      btn.classList.add("espiral-doble");
      btn.onclick = () => {
        seleccionarBoton(btn);
        mostrarEspiralCombinada(combo);
      };
    } else {
      yaRenderizadas.add(id);
      btn.innerText = id;
      btn.onclick = () => {
        seleccionarBoton(btn);
        mostrarEspiral(id);
      };
    }

    maquina.appendChild(btn);
  });
}

async function mostrarEspiral(id) {
  try {
    const ciudad = await obtenerCiudadActual();
    const espiral = ciudad.espirales[id];

    if (!espiral) {
      resultado.innerHTML = "<p>Aún no hay datos para este carril. Estamos trabajando en ello.</p>";
      return;
    }

    let html = `<h2>${id} ${espiral.coleccion || ""}</h2>`;

    espiral.cartas.forEach(carta => {
      html += renderCarta(carta);
    });

    resultado.innerHTML = html;
  } catch (error) {
    console.error(error);
    resultado.innerHTML = "<p>Error al cargar los datos</p>";
  }
}

async function mostrarEspiralCombinada(combo) {
  try {
    const ciudad = await obtenerCiudadActual();
    const json = ciudad.espirales;

    let html = `<h2>${combo.label}</h2>`;
    let hayDatos = false;

    combo.ids.forEach(id => {
      const espiral = json[id];
      if (!espiral) return;

      hayDatos = true;

      espiral.cartas.forEach(carta => {
        html += renderCarta(carta);
      });
    });

    if (!hayDatos) {
      resultado.innerHTML = "<p>Aún no hay datos para este carril. Estamos trabajando en ello.</p>";
      return;
    }

    resultado.innerHTML = html;
  } catch (error) {
    console.error(error);
    resultado.innerHTML = "<p>Error al cargar los datos</p>";
  }
}

function agruparCartasPorValor(json) {
  const mapa = new Map();

  Object.entries(json).forEach(([espiralId, datosEspiral]) => {
    if (!datosEspiral.cartas) return;

    datosEspiral.cartas.forEach(carta => {
      const clave = `${carta.nombre}|${carta.precio}|${carta.imagen}`;

      if (!mapa.has(clave)) {
        mapa.set(clave, {
          ...carta,
          valorNumerico: parsePrecio(carta.precio),
          espirales: [espiralId]
        });
      } else {
        mapa.get(clave).espirales.push(espiralId);
      }
    });
  });

  return Array.from(mapa.values());
}

async function renderBotonesEspirales(espirales) {
  const ciudad = await obtenerCiudadActual();
  const combinaciones = ciudad.combinaciones || [];
  const espiralesCombinadas = construirMapaCombinaciones(combinaciones);

  const unicos = [];
  const vistos = new Set();

  espirales.forEach(id => {
    const combo = espiralesCombinadas.get(id);
    const label = combo ? combo.label : id;

    if (!vistos.has(label)) {
      vistos.add(label);
      unicos.push(label);
    }
  });

  return unicos.map(label => `
    <button class="boton-espiral-ranking" onclick="abrirEspiralDesdeRanking('${label}')">
      ${label}
    </button>
  `).join("");
}

async function mostrarRanking(top = 10) {
  try {
    const ciudad = await obtenerCiudadActual();
    const cartasUnicas = agruparCartasPorValor(ciudad.espirales);

    cartasUnicas.sort((a, b) => b.valorNumerico - a.valorNumerico);

    const topCartas = cartasUnicas.slice(0, top);

    let html = "";

    for (let index = 0; index < topCartas.length; index++) {
      const carta = topCartas[index];
      const botones = await renderBotonesEspirales(carta.espirales);

      html += `
        <div class="ranking-carta">
          <div class="ranking-posicion">#${index + 1}</div>
          <img src="${carta.imagen}" alt="${carta.nombre}" loading="lazy">
          <div class="ranking-info">
            <h3>${carta.nombre}</h3>
            <p class="ranking-precio">${carta.precio}</p>
            <div class="ranking-espirales">
              <span>Sale en:</span>
              <div class="ranking-espirales-botones">
                ${botones}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    rankingCartas.innerHTML = html;
  } catch (error) {
    console.error(error);
    rankingCartas.innerHTML = "<p>Error al cargar el ranking</p>";
  }
}

window.abrirEspiralDesdeRanking = function(idOLabel) {
  const botones = document.querySelectorAll("#maquina button");

  botones.forEach(btn => {
    if (btn.innerText === idOLabel) {
      btn.click();
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
};

async function cambiarCiudad(nuevaCiudad) {
  ciudadActual = nuevaCiudad;
  rankingCargado = false;

  if (ranking) {
    ranking.style.display = "none";
  }

  if (botonRanking) {
    botonRanking.textContent = "Ver ranking de cartas más valiosas";
  }

  if (rankingCartas) {
    rankingCartas.innerHTML = "";
  }

  actualizarBotonesCiudad();
  await renderizarMaquina();
}

botonesCiudad.forEach(btn => {
  btn.addEventListener("click", async () => {
    const nuevaCiudad = btn.dataset.ciudad;
    if (nuevaCiudad === ciudadActual) return;
    await cambiarCiudad(nuevaCiudad);
  });
});

if (botonRanking && ranking && rankingCartas) {
  botonRanking.addEventListener("click", async () => {
    if (ranking.style.display === "none" || ranking.style.display === "") {
      ranking.style.display = "block";
      botonRanking.textContent = "Ocultar ranking";

      if (!rankingCargado) {
        await mostrarRanking(10);
        rankingCargado = true;
      }
    } else {
      ranking.style.display = "none";
      botonRanking.textContent = "Ver ranking de cartas más valiosas";
    }
  });
}

(async function init() {
  try {
    await cargarDatosMaquinas();
    actualizarBotonesCiudad();
    await renderizarMaquina();
  } catch (error) {
    console.error(error);
    resultado.innerHTML = "<p>Error al inicializar la web</p>";
  }
})();