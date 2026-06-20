const cmbGeneracion = document.getElementById("cmbGeneracion");
const pokemonContainer = document.getElementById("pokemonContainer");
const modalNombre = document.getElementById("modalNombre");
const modalImagen = document.getElementById("modalImagen");
const modalId = document.getElementById("modalId");
const modalGeneracion = document.getElementById("modalGeneracion");
const modalAltura = document.getElementById("modalAltura");
const modalPeso = document.getElementById("modalPeso");
const modalTipos = document.getElementById("modalTipos");
const modalHabilidades = document.getElementById("modalHabilidades");
const modalMovimientos = document.getElementById("modalMovimientos");
const pokemonModal = document.getElementById("pokemonModal");
const bootstrapModal = new bootstrap.Modal(pokemonModal);

// Rango de IDs por generación, usado para mostrar "Generación 01 • #005"
const generationMap = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649]
};

function padNumber(value) {
    return String(value).padStart(3, "0");
}

function getGenerationForId(id) {
    for (const k in generationMap) {
        const [s, e] = generationMap[k];
        if (id >= s && id <= e) return parseInt(k, 10);
    }
    return 1;
}

function limpiarListas() {
    modalTipos.innerHTML = "";
    modalHabilidades.innerHTML = "";
    modalMovimientos.textContent = "";
}

function muestraErrorModal(mensaje) {
    modalTipos.innerHTML = `<li>${mensaje}</li>`;
    modalHabilidades.innerHTML = `<li>${mensaje}</li>`;
    modalMovimientos.textContent = mensaje;
}

function creaLista(elemento, items) {
    elemento.innerHTML = items
        .map((texto) => `<li class="text-capitalize">${texto}</li>`)
        .join("");
}

// Renderiza los tipos como chips (estilo .type)
function creaTipos(elemento, tipos) {
    elemento.innerHTML = tipos
        .map((texto) => `<li class="type text-capitalize">${texto}</li>`)
        .join("");
}

async function cargarGeneracion(offset, limit) {
    pokemonContainer.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Cargando Pokémons...</p>
        </div>`;

    try {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar lista (${respuesta.status})`);
        }

        const datos = await respuesta.json();
        pokemonContainer.innerHTML = "";

        datos.results.forEach((pokemon, index) => {
            const pokemonId = offset + index + 1;
            const tarjeta = document.createElement("div");
            tarjeta.className = "col-6 col-md-4 col-lg-3";
            tarjeta.innerHTML = `
                <div class="pokemon-card h-100" data-name="${pokemon.name}" data-id="${pokemonId}">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png"
                         alt="${pokemon.name}">
                    <div class="card-body text-center">
                        <div class="poke-num">#${padNumber(pokemonId)}</div>
                        <h5 class="card-title text-capitalize mb-1">${pokemon.name}</h5>
                    </div>
                </div>`;

            tarjeta.querySelector(".pokemon-card").addEventListener("click", () => {
                mostrarDetalle(pokemon.name, pokemonId);
            });
            pokemonContainer.appendChild(tarjeta);
        });
    } catch (error) {
        pokemonContainer.innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <p>No fue posible cargar la Pokédex.</p>
                <p>${error.message}</p>
            </div>`;
    }
}

async function mostrarDetalle(nombre, id) {
    modalNombre.textContent = nombre;
    modalId.textContent = `#${padNumber(id)}`;
    modalGeneracion.textContent = `Generación ${padNumber(getGenerationForId(id)).slice(-2)}`;
    modalImagen.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    modalImagen.alt = nombre;
    modalAltura.textContent = "...";
    modalPeso.textContent = "...";
    limpiarListas();

    try {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar los datos (${respuesta.status})`);
        }

        const datos = await respuesta.json();
        modalAltura.textContent = `${(datos.height / 10).toFixed(1)} m`;
        modalPeso.textContent = `${(datos.weight / 10).toFixed(1)} kg`;

        creaTipos(
            modalTipos,
            datos.types.map((item) => item.type.name)
        );

        creaLista(
            modalHabilidades,
            datos.abilities.map(
                (item) =>
                    `${item.ability.name}${item.is_hidden ? " (oculta)" : ""}`
            )
        );

        const movimientos = datos.moves.slice(0, 6).map((item) => item.move.name);
        modalMovimientos.textContent =
            movimientos.length > 0 ? movimientos.join(" — ") : "No hay movimientos disponibles";
    } catch (error) {
        muestraErrorModal("No se pudieron cargar los datos del Pokémon.");
    }

    bootstrapModal.show();
}

cmbGeneracion.addEventListener("change", () => {
    const [offset, limit] = cmbGeneracion.value.split(",").map(Number);
    cargarGeneracion(offset, limit);
});

cargarGeneracion(0, 151);