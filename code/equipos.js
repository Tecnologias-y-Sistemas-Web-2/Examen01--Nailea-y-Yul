const DB_NAME = "PokedexDB";
const DB_VERSION = 2;
const STORE_ENTRENADORES = "entrenadores";
const STORE_EQUIPOS = "equipos";

function abrirDB() {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

        solicitud.onupgradeneeded = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_ENTRENADORES)) {
                const store = db.createObjectStore(STORE_ENTRENADORES, { keyPath: 'id', autoIncrement: true });
                store.createIndex('nombre', 'nombre', { unique: false });
                store.createIndex('sexo', 'sexo', { unique: false });
                store.createIndex('residencia', 'residencia', { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_EQUIPOS)) {
                const store = db.createObjectStore(STORE_EQUIPOS, { keyPath: 'id', autoIncrement: true });
                store.createIndex('nombre', 'nombre', { unique: false });
                store.createIndex('entrenadorId', 'entrenadorId', { unique: false });
            }
        };

        solicitud.onsuccess = (e) => resolve(e.target.result);
        solicitud.onerror = (e) => reject(e.target.error);
    });
}

function guardarEquipo(equipo) {
    return abrirDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_EQUIPOS, "readwrite");
            const store = tx.objectStore(STORE_EQUIPOS);
            const req = store.add(equipo);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    });
}

function obtenerEquipos() {
    return abrirDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_EQUIPOS, "readonly");
            const store = tx.objectStore(STORE_EQUIPOS);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    });
}

function obtenerEntrenadores() {
    return abrirDB().then((db) => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ENTRENADORES, "readonly");
            const store = tx.objectStore(STORE_ENTRENADORES);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve([]);
        });
    });
}

function imagenPokemon(nombre) {
    return `https://img.pokemondb.net/sprites/omega-ruby-alpha-sapphire/dex/normal/${nombre.toLowerCase()}.png`;
}


// ── Vista: lista de equipos ──────────────────────────────────
const paginaEquipos = document.getElementById("equiposContainer");
if (paginaEquipos) {
    const modal = new bootstrap.Modal(document.getElementById("detalleModal"));

    function cargarEquipos() {
        obtenerEquipos().then((lista) => {
            paginaEquipos.innerHTML = "";

            if (lista.length === 0) {
                paginaEquipos.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="fw-bold fs-5">Aún no hay equipos registrados.</div>
                        <p class="text-muted">Pulsa "Nuevo equipo" para crear el primer equipo.</p>
                    </div>`;
                return;
            }

            lista.forEach((equipo) => {
                const col = document.createElement("div");
                col.className = "col-6 col-md-4 col-lg-3 mb-4";
                const cantPoke = equipo.pokemons ? equipo.pokemons.length : 0;

                col.innerHTML = `
                    <div class="equipo-card h-100">
                        <img class="equipo-img" src="${equipo.imagen || ''}" alt="${equipo.nombre}"
                             onerror="this.src='https://via.placeholder.com/300x160?text=Sin+imagen'">
                        <div class="card-body">
                            <h5 class="card-title">${equipo.nombre}</h5>
                            <p class="entrenador-badge mb-1">👤 ${equipo.entrenadorNombre || "Sin asignar"}</p>
                            <p class="entrenador-badge">🎮 ${cantPoke} Pokémon${cantPoke !== 1 ? "s" : ""}</p>
                        </div>
                    </div>`;

                col.querySelector(".equipo-card").addEventListener("click", () => mostrarDetalle(equipo));
                paginaEquipos.appendChild(col);
            });
        }).catch(() => {
            paginaEquipos.innerHTML = `
                <div class="col-12 text-center text-danger py-5">
                    <p>No fue posible cargar los equipos.</p>
                </div>`;
        });
    }

    function mostrarDetalle(equipo) {
        document.getElementById("detNombre").textContent = equipo.nombre;
        document.getElementById("detEntrenador").textContent = equipo.entrenadorNombre || "Sin asignar";

        const imgEl = document.getElementById("detImagen");
        if (equipo.imagen) {
            imgEl.src = equipo.imagen;
            imgEl.style.display = "block";
        } else {
            imgEl.style.display = "none";
        }

        const listaEl = document.getElementById("detPokemons");
        listaEl.innerHTML = "";
        (equipo.pokemons || []).forEach((p) => {
            const li = document.createElement("li");
            li.innerHTML = `<img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/64'">
                            ${p.nombre}`;
            listaEl.appendChild(li);
        });

        modal.show();
    }

    cargarEquipos();
}


// ── Vista: agregar equipo ────────────────────────────────────
const paginaAgregar = document.getElementById("btnGuardar");
if (paginaAgregar) {
    let pokemonsElegidos = [];
    let todosLosPokemon = [];

    obtenerEntrenadores().then((lista) => {
        const sel = document.getElementById("selectEntrenador");
        const info = document.getElementById("textoEntrenador");
        if (lista.length === 0) {
            info.textContent = "⚠️ Aún no hay entrenadores registrados.";
            return;
        }
        lista.forEach((e) => {
            const op = document.createElement("option");
            op.value = e.id;
            op.textContent = e.nombre;
            sel.appendChild(op);
        });
    });

    fetch("https://pokeapi.co/api/v2/pokemon?offset=0&limit=649")
        .then((r) => r.json())
        .then((data) => { todosLosPokemon = data.results; })
        .catch(() => { todosLosPokemon = []; });

    const inputBuscar = document.getElementById("buscarPokemon");
    const divSugerencias = document.getElementById("sugerencias");

    inputBuscar.addEventListener("input", () => {
        const texto = inputBuscar.value.trim().toLowerCase();
        divSugerencias.innerHTML = "";

        if (texto.length < 2) {
            divSugerencias.classList.remove("visible");
            return;
        }

        const coincidencias = todosLosPokemon.filter((p) => p.name.includes(texto)).slice(0, 8);

        if (coincidencias.length === 0) {
            divSugerencias.classList.remove("visible");
            return;
        }

        coincidencias.forEach((p) => {
            const item = document.createElement("div");
            item.className = "sugerencia-item";
            const imgSrc = imagenPokemon(p.name);
            item.innerHTML = `<img src="${imgSrc}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/40'">
                              <span class="text-capitalize">${p.name}</span>`;
            item.addEventListener("click", () => agregarPokemon(p.name, imgSrc));
            divSugerencias.appendChild(item);
        });

        divSugerencias.classList.add("visible");
    });

    document.addEventListener("click", (e) => {
        if (!inputBuscar.contains(e.target) && !divSugerencias.contains(e.target)) {
            divSugerencias.classList.remove("visible");
        }
    });

    function agregarPokemon(nombre, imagen) {
        divSugerencias.classList.remove("visible");
        inputBuscar.value = "";

        if (pokemonsElegidos.length >= 6) {
            alert("El equipo ya tiene 6 Pokémons (máximo permitido).");
            return;
        }
        if (pokemonsElegidos.find((p) => p.nombre === nombre)) {
            alert(`${nombre} ya está en el equipo.`);
            return;
        }

        pokemonsElegidos.push({ nombre, imagen });
        renderChips();
    }

    function renderChips() {
        const contenedor = document.getElementById("pokemonsSeleccionados");
        contenedor.innerHTML = "";
        pokemonsElegidos.forEach((p, idx) => {
            const chip = document.createElement("div");
            chip.className = "pokemon-chip";
            chip.innerHTML = `<img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/36'">
                              <span class="text-capitalize">${p.nombre}</span>
                              <button class="btn-quitar">✕</button>`;
            chip.querySelector(".btn-quitar").addEventListener("click", () => {
                pokemonsElegidos.splice(idx, 1);
                renderChips();
            });
            contenedor.appendChild(chip);
        });
    }

    document.getElementById("btnGuardar").addEventListener("click", () => {
        const nombre = document.getElementById("nombreEquipo").value.trim();
        const imagen = document.getElementById("imagenEquipo").value.trim();
        const selEl = document.getElementById("selectEntrenador");
        const entId = selEl.value ? parseInt(selEl.value) : null;
        const entNombre = selEl.options[selEl.selectedIndex]?.text || "";

        if (!nombre) { alert("Por favor ingresá el nombre del equipo."); return; }
        if (pokemonsElegidos.length === 0) { alert("Agregá al menos un Pokémon al equipo."); return; }

        const equipo = {
            nombre,
            imagen,
            entrenadorId: entId,
            entrenadorNombre: entNombre === "— Seleccionar entrenador —" ? "Sin asignar" : entNombre,
            pokemons: pokemonsElegidos
        };

        guardarEquipo(equipo).then(() => {
            document.getElementById("nombreEquipo").value = "";
            document.getElementById("imagenEquipo").value = "";
            selEl.selectedIndex = 0;
            pokemonsElegidos = [];
            renderChips();

            const alerta = document.getElementById("alertaExito");
            alerta.style.display = "block";
            setTimeout(() => { alerta.style.display = "none"; }, 3000);
        }).catch(() => {
            alert("Ocurrió un error al guardar el equipo.");
        });
    });
}