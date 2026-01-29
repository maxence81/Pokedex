let pokemon3DData = null;

function toggleExtraInfo(element) {
    const extraInfo = element.nextElementSibling;
    const arrowIcon = element.querySelector('.arrow-icon');
    const arrowText = element.querySelector('.arrow-text');
    
    if (extraInfo.style.display === 'none') {
        extraInfo.style.display = 'block';
        arrowIcon.textContent = '▲';
        arrowText.textContent = 'Moins d\'infos';
        element.classList.add('expanded');
    } else {
        extraInfo.style.display = 'none';
        arrowIcon.textContent = '▼';
        arrowText.textContent = 'Plus d\'infos';
        element.classList.remove('expanded');
    }
}

let pokemonFrenchNames = [];
let isLoadingFrenchNames = false;

async function loadFrenchPokemonNames() {
    if (pokemonFrenchNames.length > 0 || isLoadingFrenchNames) return pokemonFrenchNames;

    isLoadingFrenchNames = true;
    console.log('Chargement des noms français...');

    try {
        // Charger tous les Pokémon species
        const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/?limit=1500');
        const data = await response.json();

        // Charger les détails de chaque espèce pour obtenir le nom français
        const promises = data.results.map(async (species, index) => {
            try {
                const speciesResponse = await fetch(species.url);
                const speciesData = await speciesResponse.json();
                const frenchName = speciesData.names.find(n => n.language.name === 'fr');
                return {
                    id: speciesData.id,
                    nameFr: frenchName ? frenchName.name : species.name,
                    nameEn: species.name,
                    url: `https://pokeapi.co/api/v2/pokemon/${speciesData.id}/`
                };
            } catch (e) {
                return null;
            }
        });

        const batchSize = 50;
        for (let i = 0; i < promises.length; i += batchSize) {
            const batch = promises.slice(i, i + batchSize);
            const results = await Promise.all(batch);
            pokemonFrenchNames.push(...results.filter(r => r !== null));

            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.placeholder = `Chargement... ${pokemonFrenchNames.length} Pokémon`;
            }
        }

        pokemonFrenchNames.sort((a, b) => a.id - b.id);

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = 'Ex: Pikachu, Salamèche, Carapuce...';
        }

        console.log('Noms français chargés:', pokemonFrenchNames.length);
        isLoadingFrenchNames = false;
        return pokemonFrenchNames;
    } catch (error) {
        console.log('Erreur chargement noms français:', error);
        isLoadingFrenchNames = false;
        return [];
    }
}

function searchPokemonByFrenchName(query) {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return pokemonFrenchNames.filter(pokemon => {
        const normalizedName = pokemon.nameFr.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalizedName.includes(normalizedQuery);
    }).slice(0, 10); 
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = results.map(pokemon => `
        <div class="search-result-item" onclick="selectPokemonFromSearch('${pokemon.url}', '${pokemon.nameFr}')">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png" alt="${pokemon.nameFr}">
            <span>${pokemon.nameFr}</span>
            <span class="pokemon-id">#${pokemon.id}</span>
        </div>
    `).join('');
}

function selectPokemonFromSearch(url, nameFr) {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (searchInput) searchInput.value = nameFr;
    if (searchResults) {
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
    }

    fetchDisplayPokemon(url);
}

function handleSearchInput(event) {
    const query = event.target.value;
    const results = searchPokemonByFrenchName(query);
    displaySearchResults(results);
}

function loadPokemon3DData() {
    return fetch('https://pokemon-3d-api.onrender.com/v1/pokemon')
        .then(response => response.json())
        .then(data => {
            pokemon3DData = data.pokemon || data;
            console.log('Données 3D chargées:', pokemon3DData.length, 'Pokémon');
            return pokemon3DData;
        })
        .catch(error => {
            console.log('Erreur chargement API 3D:', error);
            return null;
        });
}

function get3DModel(pokemonId) {
    if (!pokemon3DData) return null;

    const pokemon = pokemon3DData.find(p => p.id === pokemonId);
    if (pokemon && pokemon.forms && pokemon.forms.length > 0) {
        // Retourner la forme "regular" par défaut
        const regularForm = pokemon.forms.find(f => f.formName === 'regular');
        return regularForm || pokemon.forms[0];
    }
    return null;
}

function display3DModel(pokemonId, pokemonName) {
    const container = document.getElementById('model-3d');
    const modelContainer = document.getElementById('model-3d-container');

    if (!container) return;

    const model = get3DModel(pokemonId);

    if (model && model.model) {
        modelContainer.style.display = 'block';
        container.innerHTML = `
            <model-viewer
                src="${model.model}"
                alt="Modèle 3D de ${pokemonName}"
                auto-rotate
                camera-controls
                shadow-intensity="1"
                style="width: 300px; height: 300px; background-color: transparent;"
                loading="eager"
                poster=""
            >
                <div class="progress-bar hide" slot="progress-bar">
                    <div class="update-bar"></div>
                </div>
            </model-viewer>
            <p style="text-align: center; margin-top: 10px; color: #666; font-size: 0.9em;">
                ${model.name || pokemonName} - Glissez pour faire pivoter
            </p>
        `;
    } else {
        modelContainer.style.display = 'none';
        container.innerHTML = '';
    }
}

function getPokemons1() {
    const url = "https://pokeapi.co/api/v2/pokemon/"
    const fetchOptions = { method: "GET" }
    fetch(url, fetchOptions)
        .then((response) => { return response.json() })
        .then((dataJSON) => {
            console.log(dataJSON)
            let pokemon = dataJSON.results;
            let listPokemonHtml = "";

            for (let i = 0; i < pokemon.length; i++) {
                listPokemonHtml += "<li>" + pokemon[i].name + "</li>";
            }

            if (typeof document !== 'undefined') {
                document.getElementById("liste1").innerHTML = listPokemonHtml;
            }
        })
        .catch((error) => {
            console.log(error)
        })
}


function getPokemons2() {
    const url = "https://pokeapi.co/api/v2/pokemon/?limit=2000"
    const fetchOptions = { method: "GET" }
    fetch(url, fetchOptions)
        .then((response) => { return response.json() })
        .then((dataJSON) => {
            console.log(dataJSON)
            let pokemon = dataJSON.results;
            let listPokemonHtml = "";

            for (let i = 0; i < pokemon.length; i++) {
                listPokemonHtml += "<option value='" + pokemon[i].url + "'>" + pokemon[i].name + "</option>";
            }

            if (typeof document !== 'undefined') {
                document.getElementById("liste2").innerHTML = listPokemonHtml;
            }
        })
        .catch((error) => {
            console.log(error)
        })
}

function fetchDisplayPokemon(url) {
    const fetchOptions = { method: "GET" }
    fetch(url, fetchOptions)
        .then((response) => { return response.json() })
        .then((dataJSON) => {
            console.log(dataJSON)

            const type = dataJSON.types[0].type.name;
            const cardAccent = `var(--type-${type})`;

            const typesHtml = dataJSON.types.map(t => 
                `<span class="pokemon-type" style="background-color: var(--type-${t.type.name})">${t.type.name}</span>`
            ).join('');

            const statsHtml = dataJSON.stats.map(stat => `
                <div class="stat-row">
                    <span class="stat-name">${stat.stat.name}</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar" style="width: ${Math.min(stat.base_stat, 150) / 150 * 100}%; background-color: ${cardAccent}"></div>
                    </div>
                    <span class="stat-value">${stat.base_stat}</span>
                </div>
            `).join('');

            const abilitiesHtml = dataJSON.abilities.slice(0, 6).map(a => 
                `<span class="pokemon-ability">${a.ability.name}${a.is_hidden ? ' (caché)' : ''}</span>`
            ).join('');

            let htmlContent = `
                <div class="pokemon-card" style="--card-accent: ${cardAccent}">
                    <h1 class="name"> ${dataJSON.name}</h1>
                    <img src="${dataJSON.sprites.other.home.front_default}" alt="${dataJSON.name}">
                    <ul class="pokemon-info">
                        <li><strong>${dataJSON.weight / 10} kg</strong>Poids</li>
                        <li><strong>${dataJSON.height / 10} m</strong>Taille</li>
                    </ul>
                    <div class="expand-arrow" onclick="toggleExtraInfo(this)">
                        <span class="arrow-icon">▼</span>
                        <span class="arrow-text">Plus d'infos</span>
                    </div>
                    <div class="extra-info" style="display: none;">
                        <div class="info-section">
                            <h4>Types</h4>
                            <div class="types-container">${typesHtml}</div>
                        </div>
                        <div class="info-section">
                            <h4>Statistiques</h4>
                            <div class="stats-container">${statsHtml}</div>
                        </div>
                        <div class="info-section">
                            <h4>Capacités</h4>
                            <div class="abilities-container">${abilitiesHtml}</div>
                        </div>
                    </div>
                </div>
            `;

            if (typeof document !== 'undefined') {
                const detailEl = document.getElementById("detail");
                detailEl.innerHTML = htmlContent;

                const card = detailEl.querySelector('.pokemon-card');
                card.style.animation = 'none';
                card.offsetHeight; /* trigger reflow */
                card.style.animation = 'slideUp 0.5s ease-out forwards';

                display3DModel(dataJSON.id, dataJSON.name);

                getEvolutionChain(dataJSON.species.url);
            }
        })
        .catch((error) => {
            console.log(error)
        })
}

function getPokemon(event) {
    fetchDisplayPokemon(event.target.value);
}

function getEvolutionChain(speciesUrl) {
    fetch(speciesUrl)
        .then(response => response.json())
        .then(data => {
            fetch(data.evolution_chain.url)
                .then(response => response.json())
                .then(evolutionData => {
                    const chain = evolutionData.chain;
                    const container = document.getElementById('evolution-chain');
                    function buildEvolutionHtml(node) {
                        const urlParts = node.species.url.split('/');
                        const id = urlParts[urlParts.length - 2];
                        const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${id}/`;

                        let html = `
                            <div class="evolution-stage" onclick="fetchDisplayPokemon('${pokemonUrl}')">
                                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${id}.png" alt="${node.species.name}">
                                <span>${node.species.name}</span>
                            </div>
                        `;

                        if (node.evolves_to.length > 0) {
                            const isBranching = node.evolves_to.length > 1;

                            html += `<div class="evolution-arrow">→</div>`;

                            if (isBranching) {
                                html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
                            }

                            node.evolves_to.forEach(child => {
                                html += `<div style="display:flex; align-items:center;">` + buildEvolutionHtml(child) + `</div>`;
                            });

                            if (isBranching) {
                                html += `</div>`;
                            }
                        }

                        return html;
                    }

                    container.innerHTML = buildEvolutionHtml(chain);
                })
        })
        .catch(error => console.log(error));
}

if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
        loadPokemon3DData();
        loadFrenchPokemonNames();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    const searchResults = document.getElementById('searchResults');
                    if (searchResults) {
                        searchResults.style.display = 'none';
                    }
                }
            });
        }

        getPokemons2();
        const liste2 = document.getElementById("liste2");
        if (liste2) {
            liste2.addEventListener("change", getPokemon);
            liste2.addEventListener("change", nomsPokemon);
        }
    });
} else {
    getPokemons2();
}

function nomsPokemon(event) {
    const urlValues = event.target.value.split("/");
    const id = urlValues[urlValues.length - 2];
    const url = "https://pokeapi.co/api/v2/pokemon-species/" + id;
    const fetchOptions = { method: "GET" }
    fetch(url, fetchOptions)
        .then(response => response.json())
        .then(dataJSON => {
            let htmlContent = "<ul>";
            for (let i = 0; i < dataJSON.names.length; i++) {
                htmlContent += `<li>${dataJSON.names[i].language.name} : ${dataJSON.names[i].name}</li>`;
            }
            htmlContent += "</ul>";

            if (typeof document !== 'undefined') {
                document.getElementById("nomsDansAutresLangue").innerHTML = htmlContent;
            }
        })
        .catch(error => console.log(error));
}