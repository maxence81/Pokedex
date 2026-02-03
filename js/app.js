// ============================================
// POKEMON API SERVICE
// ============================================
const PokemonAPI = {
    baseUrl: 'https://pokeapi.co/api/v2',
    model3DUrl: 'https://pokemon-3d-api.onrender.com/v1/pokemon',
    pokemon3DData: null,

    // Fetch Pokemon list
    async getPokemonList(limit = 151, offset = 0) {
        const response = await fetch(`${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`);
        return response.json();
    },

    // Fetch single Pokemon
    async getPokemon(idOrName) {
        const response = await fetch(`${this.baseUrl}/pokemon/${idOrName}`);
        return response.json();
    },

    // Fetch Pokemon species for additional info
    async getPokemonSpecies(id) {
        const response = await fetch(`${this.baseUrl}/pokemon-species/${id}`);
        return response.json();
    },

    // Fetch evolution chain
    async getEvolutionChain(url) {
        const response = await fetch(url);
        return response.json();
    },

    // Get all Pokemon with details
    async getPokemonWithDetails(limit = 151, offset = 0) {
        const list = await this.getPokemonList(limit, offset);
        const promises = list.results.map(pokemon => this.getPokemon(pokemon.name));
        return Promise.all(promises);
    },

    // Load 3D model data
    async load3DData() {
        if (this.pokemon3DData) return this.pokemon3DData;
        try {
            const response = await fetch(this.model3DUrl);
            const data = await response.json();
            this.pokemon3DData = data.pokemon || data;
            return this.pokemon3DData;
        } catch (error) {
            console.error('Error loading 3D data:', error);
            return null;
        }
    },

    // Get 3D model URL for a Pokemon
    get3DModel(pokemonId) {
        if (!this.pokemon3DData) return null;
        const pokemon = this.pokemon3DData.find(p => p.id === pokemonId);
        if (pokemon && pokemon.forms && pokemon.forms.length > 0) {
            const regularForm = pokemon.forms.find(f => f.formName === 'regular');
            return regularForm || pokemon.forms[0];
        }
        return null;
    },

    // Parse evolution chain
    parseEvolutionChain(chain) {
        const evolutions = [];

        function traverse(node) {
            if (node.species) {
                const id = node.species.url.split('/').filter(Boolean).pop();
                evolutions.push({
                    name: node.species.name,
                    id: parseInt(id),
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
                });
            }
            if (node.evolves_to && node.evolves_to.length > 0) {
                node.evolves_to.forEach(evo => traverse(evo));
            }
        }

        traverse(chain);
        return evolutions;
    },

    // Get type color
    getTypeColor(type) {
        const colors = {
            normal: '#A8A77A',
            fire: '#EE8130',
            water: '#6390F0',
            electric: '#F7D02C',
            grass: '#7AC74C',
            ice: '#96D9D6',
            fighting: '#C22E28',
            poison: '#A33EA1',
            ground: '#E2BF65',
            flying: '#A98FF3',
            psychic: '#F95587',
            bug: '#A6B91A',
            rock: '#B6A136',
            ghost: '#735797',
            dragon: '#6F35FC',
            dark: '#705746',
            steel: '#B7B7CE',
            fairy: '#D685AD'
        };
        return colors[type] || '#777';
    },

    // Get stat color
    getStatColor(value) {
        if (value < 50) return '#ff5252';
        if (value < 80) return '#ffb74d';
        if (value < 100) return '#81c784';
        return '#4fc3f7';
    }
};

// ============================================
// VUE COMPONENTS
// ============================================

// Header Component
const HeaderComponent = {
    template: `
        <header class="header">
            <div class="header-content">
                <router-link to="/" class="logo">
                    <div class="pokeball-icon"></div>
                    <span>Pokédex</span>
                </router-link>
                <nav class="nav-links">
                    <router-link to="/" class="nav-link">Home</router-link>
                    <router-link to="/pokedex" class="nav-link">Pokédex</router-link>
                    <router-link to="/battle" class="nav-link">Battle</router-link>
                    <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
                        {{ isDark ? '☀️' : '🌙' }}
                    </button>
                </nav>
            </div>
        </header>
    `,
    data() {
        return {
            isDark: false
        };
    },
    mounted() {
        const savedTheme = localStorage.getItem('pokedex-theme');
        if (savedTheme === 'dark') {
            this.isDark = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    },
    methods: {
        toggleTheme() {
            this.isDark = !this.isDark;
            document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
            localStorage.setItem('pokedex-theme', this.isDark ? 'dark' : 'light');
        }
    }
};

// Footer Component
const FooterComponent = {
    template: `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-logo">
                        <div class="pokeball-icon"></div>
                        <span>Pokédex</span>
                    </div>
                </div>
                <div class="footer-section">
                    <h4>Navigation</h4>
                    <router-link to="/">Home</router-link>
                    <router-link to="/pokedex">Pokédex</router-link>
                    <router-link to="/battle">Battle</router-link>
                </div>
                <div class="footer-section">
                    <h4>Credits</h4>
                    <a href="https://pokeapi.co/" target="_blank" rel="noopener">PokéAPI</a>
                    <a href="https://pokemon-3d-api.onrender.com/" target="_blank" rel="noopener">Pokémon 3D API</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>© 2026 Pokédex - Data provided by PokéAPI</p>
                <p>Pokémon and Pokémon character names are trademarks of Nintendo</p>
            </div>
        </footer>
    `
};

// Loading Spinner Component
const LoadingSpinner = {
    template: `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">{{ text }}</p>
        </div>
    `,
    props: {
        text: {
            type: String,
            default: 'Loading...'
        }
    }
};

// Type Badge Component
const TypeBadge = {
    template: `
        <span class="type-badge" :style="{ backgroundColor: color }">
            {{ type }}
        </span>
    `,
    props: ['type'],
    computed: {
        color() {
            return PokemonAPI.getTypeColor(this.type);
        }
    }
};

// Pokemon Card Component
const PokemonCard = {
    template: `
        <div class="pokemon-card" :style="{ '--type-color': typeColor }" @click="$emit('select', pokemon)">
            <span class="pokemon-id">#{{ formatId(pokemon.id) }}</span>
            <img 
                class="pokemon-image" 
                :src="imageUrl" 
                :alt="pokemon.name"
                loading="lazy"
            >
            <h3 class="pokemon-name">{{ pokemon.name }}</h3>
            <div class="types">
                <type-badge 
                    v-for="type in pokemon.types" 
                    :key="type.type.name" 
                    :type="type.type.name"
                />
            </div>
        </div>
    `,
    props: ['pokemon'],
    components: { TypeBadge },
    computed: {
        imageUrl() {
            return this.pokemon.sprites?.other?.['official-artwork']?.front_default
                || this.pokemon.sprites?.front_default
                || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.pokemon.id}.png`;
        },
        typeColor() {
            return PokemonAPI.getTypeColor(this.pokemon.types[0]?.type?.name || 'normal');
        }
    },
    methods: {
        formatId(id) {
            return String(id).padStart(3, '0');
        }
    }
};

// Pokemon Detail Modal Component
const PokemonModal = {
    template: `
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content">
                <button class="modal-close" @click="$emit('close')">×</button>
                
                <div class="modal-header" :style="{ background: headerGradient }">
                    <img class="pokemon-image" :src="imageUrl" :alt="pokemon.name">
                    <h2 class="pokemon-name">{{ pokemon.name }}</h2>
                    <p class="pokemon-id">#{{ formatId(pokemon.id) }}</p>
                </div>
                
                <div class="modal-body">
                    <!-- Types -->
                    <div class="detail-section">
                        <h3>Type</h3>
                        <div class="types" style="display: flex; gap: 0.5rem;">
                            <type-badge 
                                v-for="type in pokemon.types" 
                                :key="type.type.name" 
                                :type="type.type.name"
                            />
                        </div>
                    </div>
                    
                    <!-- Basic Info -->
                    <div class="detail-section">
                        <h3>Details</h3>
                        <div class="detail-row">
                            <span class="label">Height</span>
                            <span class="value">{{ (pokemon.height / 10).toFixed(1) }} m</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Weight</span>
                            <span class="value">{{ (pokemon.weight / 10).toFixed(1) }} kg</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Base Experience</span>
                            <span class="value">{{ pokemon.base_experience || 'N/A' }}</span>
                        </div>
                    </div>
                    
                    <!-- Abilities -->
                    <div class="detail-section">
                        <h3>Abilities</h3>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <span 
                                v-for="ability in pokemon.abilities" 
                                :key="ability.ability.name"
                                class="type-badge"
                                style="background: #667eea;"
                            >
                                {{ ability.ability.name.replace('-', ' ') }}
                            </span>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="detail-section">
                        <h3>Base Stats</h3>
                        <div class="stats-container">
                            <div class="stat-row" v-for="stat in pokemon.stats" :key="stat.stat.name">
                                <span class="stat-name">{{ formatStatName(stat.stat.name) }}</span>
                                <div class="stat-bar-bg">
                                    <div 
                                        class="stat-bar" 
                                        :style="{ 
                                            width: (stat.base_stat / 255 * 100) + '%',
                                            backgroundColor: getStatColor(stat.base_stat)
                                        }"
                                    ></div>
                                </div>
                                <span class="stat-value">{{ stat.base_stat }}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Evolution Chain -->
                    <div class="detail-section" v-if="evolutions.length > 1">
                        <h3>Evolution Chain</h3>
                        <div class="evolution-chain">
                            <template v-for="(evo, index) in evolutions" :key="evo.id">
                                <div class="evolution-stage" @click="$emit('select-evolution', evo.id)">
                                    <img :src="evo.image" :alt="evo.name">
                                    <span>{{ evo.name }}</span>
                                </div>
                                <span v-if="index < evolutions.length - 1" class="evolution-arrow">→</span>
                            </template>
                        </div>
                    </div>
                    
                    <!-- 3D Model -->
                    <div class="detail-section" v-if="model3D">
                        <h3>3D Model</h3>
                        <div class="model-container">
                            <model-viewer
                                :src="model3D.model"
                                camera-controls
                                auto-rotate
                                shadow-intensity="1"
                                style="width: 100%; height: 250px;"
                            ></model-viewer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: ['pokemon'],
    components: { TypeBadge },
    data() {
        return {
            evolutions: [],
            model3D: null
        };
    },
    computed: {
        imageUrl() {
            return this.pokemon.sprites?.other?.['official-artwork']?.front_default
                || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.pokemon.id}.png`;
        },
        headerGradient() {
            const color = PokemonAPI.getTypeColor(this.pokemon.types[0]?.type?.name || 'normal');
            return `linear-gradient(135deg, ${color} 0%, ${this.darkenColor(color, 20)} 100%)`;
        }
    },
    async mounted() {
        await this.loadEvolutions();
        await this.load3DModel();
    },
    methods: {
        formatId(id) {
            return String(id).padStart(3, '0');
        },
        formatStatName(name) {
            const names = {
                'hp': 'HP',
                'attack': 'Attack',
                'defense': 'Defense',
                'special-attack': 'Sp. Atk',
                'special-defense': 'Sp. Def',
                'speed': 'Speed'
            };
            return names[name] || name;
        },
        getStatColor(value) {
            return PokemonAPI.getStatColor(value);
        },
        darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max((num >> 16) - amt, 0);
            const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
            const B = Math.max((num & 0x0000FF) - amt, 0);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        },
        async loadEvolutions() {
            try {
                const species = await PokemonAPI.getPokemonSpecies(this.pokemon.id);
                const evolutionData = await PokemonAPI.getEvolutionChain(species.evolution_chain.url);
                this.evolutions = PokemonAPI.parseEvolutionChain(evolutionData.chain);
            } catch (error) {
                console.error('Error loading evolutions:', error);
            }
        },
        async load3DModel() {
            try {
                await PokemonAPI.load3DData();
                this.model3D = PokemonAPI.get3DModel(this.pokemon.id);
            } catch (error) {
                console.error('Error loading 3D model:', error);
            }
        }
    }
};

// ============================================
// PAGE COMPONENTS
// ============================================

// Landing Page - 3D Showcase
const LandingPage = {
    template: `
        <main class="landing-3d">
            <div class="landing-bg"></div>
            
            <!-- Left Pokemon - Dragonite -->
            <div class="showcase-frame left">
                <model-viewer
                    v-if="leftModel"
                    :src="leftModel"
                    disable-zoom
                    disable-pan
                    disable-tap
                    interaction-prompt="none"
                    camera-orbit="0deg 75deg 1.8m"
                    field-of-view="30deg"
                    style="width: 100%; height: 100%;"
                ></model-viewer>
                <img v-else src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png" alt="Dragonite" class="fallback-sprite">
            </div>
            
            <!-- Right Pokemon - Charizard -->
            <div class="showcase-frame right">
                <model-viewer
                    v-if="rightModel"
                    :src="rightModel"
                    disable-zoom
                    disable-pan
                    disable-tap
                    interaction-prompt="none"
                    camera-orbit="0deg 75deg 1.8m"
                    field-of-view="30deg"
                    style="width: 100%; height: 100%;"
                ></model-viewer>
                <img v-else src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" alt="Charizard" class="fallback-sprite">
            </div>
            
            <!-- Main content -->
            <div class="landing-content">
                <h1 class="landing-title">
                    <span class="title-line">Explore the</span>
                    <span class="title-highlight">Pokémon World</span>
                </h1>
                
                <div class="landing-actions">
                    <router-link to="/pokedex" class="action-card pokedex-action">
                        <span class="action-icon">📖</span>
                        <span class="action-label">Pokédex</span>
                        <span class="action-desc">Browse all Pokémon</span>
                    </router-link>
                    <router-link to="/battle" class="action-card battle-action">
                        <span class="action-icon">⚔️</span>
                        <span class="action-label">Battle Arena</span>
                        <span class="action-desc">Fight with 3D models</span>
                    </router-link>
                </div>
            </div>
            
            <!-- Floating particles -->
            <div class="particles">
                <div class="particle" v-for="n in 12" :key="n" :style="particleStyle(n)"></div>
            </div>
        </main>
    `,
    data() {
        return {
            leftModel: null,
            rightModel: null
        };
    },
    async mounted() {
        await this.loadModels();
    },
    methods: {
        async loadModels() {
            await PokemonAPI.load3DData();

            // Dragonite (149) à gauche
            const dragonite = PokemonAPI.get3DModel(149);
            this.leftModel = dragonite?.model || null;

            // Charizard (6) à droite
            const charizard = PokemonAPI.get3DModel(6);
            this.rightModel = charizard?.model || null;
        },
        particleStyle(n) {
            const size = 3 + Math.random() * 8;
            return {
                width: size + 'px',
                height: size + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDelay: (n * 0.3) + 's',
                animationDuration: (5 + Math.random() * 5) + 's'
            };
        }
    }
};

// Battle Arena Page
const BattlePage = {
    template: `
        <main>
            <section class="battle-arena">
                <div class="arena-bg"></div>
                
                <h1 class="arena-title">Pokémon Battle Arena</h1>
                <p class="arena-subtitle">Pick two fighters and watch them face off!</p>
                
                <div class="battle-stage">
                    <!-- Left fighter -->
                    <div class="fighter left" :class="{ attacking: leftAttacking, hit: leftHit }">
                        <div class="fighter-info">
                            <span class="fighter-name">{{ leftPokemon?.name || '???' }}</span>
                            <div class="hp-bar">
                                <div class="hp-fill" :style="{ width: leftHP + '%', background: leftHP > 50 ? '#4CAF50' : leftHP > 20 ? '#ff9800' : '#f44336' }"></div>
                            </div>
                            <span class="hp-text">{{ leftHP }}/100</span>
                        </div>
                        <div class="model-wrapper" v-if="leftModel">
                            <model-viewer
                                :src="leftModel"
                                camera-controls
                                auto-rotate
                                rotation-per-second="30deg"
                                camera-orbit="45deg 75deg 2.5m"
                                style="width: 100%; height: 280px;"
                            ></model-viewer>
                        </div>
                        <div class="model-placeholder" v-else>
                            <img v-if="leftPokemon" :src="getSprite(leftPokemon.id)" :alt="leftPokemon.name">
                            <span v-else>?</span>
                        </div>
                    </div>
                    
                    <div class="vs-badge">VS</div>
                    
                    <!-- Right fighter -->
                    <div class="fighter right" :class="{ attacking: rightAttacking, hit: rightHit }">
                        <div class="fighter-info">
                            <span class="fighter-name">{{ rightPokemon?.name || '???' }}</span>
                            <div class="hp-bar">
                                <div class="hp-fill" :style="{ width: rightHP + '%', background: rightHP > 50 ? '#4CAF50' : rightHP > 20 ? '#ff9800' : '#f44336' }"></div>
                            </div>
                            <span class="hp-text">{{ rightHP }}/100</span>
                        </div>
                        <div class="model-wrapper" v-if="rightModel">
                            <model-viewer
                                :src="rightModel"
                                camera-controls
                                auto-rotate
                                rotation-per-second="-30deg"
                                camera-orbit="-45deg 75deg 2.5m"
                                style="width: 100%; height: 280px;"
                            ></model-viewer>
                        </div>
                        <div class="model-placeholder" v-else>
                            <img v-if="rightPokemon" :src="getSprite(rightPokemon.id)" :alt="rightPokemon.name">
                            <span v-else>?</span>
                        </div>
                    </div>
                </div>
                
                <!-- Battle log -->
                <div class="battle-log" v-if="battleLog.length">
                    <p v-for="(msg, i) in battleLog" :key="i" :class="msg.type">{{ msg.text }}</p>
                </div>
                
                <!-- Fighter selection -->
                <div class="fighter-select">
                    <div class="select-group">
                        <label>Left Fighter</label>
                        <select v-model="leftId" @change="loadFighter('left')">
                            <option value="">-- Pick one --</option>
                            <option v-for="p in pokemonList" :key="p.id" :value="p.id">
                                #{{ p.id }} {{ p.name }}
                            </option>
                        </select>
                        <button class="random-btn" @click="randomFighter('left')">🎲</button>
                    </div>
                    <div class="select-group">
                        <label>Right Fighter</label>
                        <select v-model="rightId" @change="loadFighter('right')">
                            <option value="">-- Pick one --</option>
                            <option v-for="p in pokemonList" :key="p.id" :value="p.id">
                                #{{ p.id }} {{ p.name }}
                            </option>
                        </select>
                        <button class="random-btn" @click="randomFighter('right')">🎲</button>
                    </div>
                </div>
                
                <!-- Battle controls -->
                <div class="battle-controls">
                    <button class="fight-btn" @click="startBattle" :disabled="!canFight || fighting">
                        {{ fighting ? 'Fighting...' : winner ? 'Rematch!' : 'FIGHT!' }}
                    </button>
                    <router-link to="/pokedex" class="pokedex-link">
                        or browse the Pokédex →
                    </router-link>
                </div>
                
                <!-- Winner announcement -->
                <div class="winner-overlay" v-if="winner" @click="resetBattle">
                    <div class="winner-card">
                        <span class="winner-label">WINNER!</span>
                        <img :src="getSprite(winner.id)" :alt="winner.name">
                        <h2>{{ winner.name }}</h2>
                        <p>click to continue</p>
                    </div>
                </div>
            </section>
        </main>
    `,
    data() {
        return {
            pokemonList: [],
            leftId: '',
            rightId: '',
            leftPokemon: null,
            rightPokemon: null,
            leftModel: null,
            rightModel: null,
            leftHP: 100,
            rightHP: 100,
            leftAttacking: false,
            rightAttacking: false,
            leftHit: false,
            rightHit: false,
            fighting: false,
            winner: null,
            battleLog: []
        };
    },
    computed: {
        canFight() {
            return this.leftPokemon && this.rightPokemon;
        }
    },
    async mounted() {
        await this.loadPokemonList();
        await PokemonAPI.load3DData();

        this.randomFighter('left');
        this.randomFighter('right');
    },
    methods: {
        async loadPokemonList() {
            try {
                const data = await PokemonAPI.getPokemonList(151, 0);
                this.pokemonList = data.results.map((p, i) => ({
                    id: i + 1,
                    name: p.name
                }));
            } catch (e) {
                console.log('failed to load list', e);
            }
        },
        async loadFighter(side) {
            const id = side === 'left' ? this.leftId : this.rightId;
            if (!id) return;

            try {
                const pokemon = await PokemonAPI.getPokemon(id);
                const model3d = PokemonAPI.get3DModel(parseInt(id));

                if (side === 'left') {
                    this.leftPokemon = pokemon;
                    this.leftModel = model3d?.model || null;
                    this.leftHP = 100;
                } else {
                    this.rightPokemon = pokemon;
                    this.rightModel = model3d?.model || null;
                    this.rightHP = 100;
                }
                this.winner = null;
                this.battleLog = [];
            } catch (e) {
                console.log('cant load pokemon', e);
            }
        },
        randomFighter(side) {
            const randId = Math.floor(Math.random() * 151) + 1;
            if (side === 'left') {
                this.leftId = randId;
            } else {
                this.rightId = randId;
            }
            this.loadFighter(side);
        },
        getSprite(id) {
            return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
        },
        async startBattle() {
            if (this.winner) {
                this.resetBattle();
                return;
            }
            if (!this.canFight || this.fighting) return;

            this.fighting = true;
            this.battleLog = [];
            this.leftHP = 100;
            this.rightHP = 100;

            let turn = 0;
            while (this.leftHP > 0 && this.rightHP > 0) {
                await this.delay(800);

                if (turn % 2 === 0) {
                    const dmg = this.calcDamage(this.leftPokemon, this.rightPokemon);
                    this.leftAttacking = true;
                    await this.delay(200);
                    this.rightHit = true;
                    this.rightHP = Math.max(0, this.rightHP - dmg);
                    this.battleLog.unshift({ text: `${this.leftPokemon.name} deals ${dmg} damage!`, type: 'left-atk' });
                    await this.delay(300);
                    this.leftAttacking = false;
                    this.rightHit = false;
                } else {
                    const dmg = this.calcDamage(this.rightPokemon, this.leftPokemon);
                    this.rightAttacking = true;
                    await this.delay(200);
                    this.leftHit = true;
                    this.leftHP = Math.max(0, this.leftHP - dmg);
                    this.battleLog.unshift({ text: `${this.rightPokemon.name} deals ${dmg} damage!`, type: 'right-atk' });
                    await this.delay(300);
                    this.rightAttacking = false;
                    this.leftHit = false;
                }
                turn++;

                if (this.battleLog.length > 5) this.battleLog.pop();
            }

            this.fighting = false;
            this.winner = this.leftHP > 0 ? this.leftPokemon : this.rightPokemon;
        },
        calcDamage(attacker, defender) {
            const atk = attacker.stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
            const def = defender.stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
            const base = Math.floor((atk / def) * 15);
            const variance = Math.floor(Math.random() * 10) - 5;
            return Math.max(5, base + variance);
        },
        delay(ms) {
            return new Promise(r => setTimeout(r, ms));
        },
        resetBattle() {
            this.winner = null;
            this.leftHP = 100;
            this.rightHP = 100;
            this.battleLog = [];
        }
    }
};

// Pokedex Page
const PokedexPage = {
    template: `
        <main class="pokedex-page">
            <div class="pokedex-container">
                <h1 class="page-title">Pokédex</h1>
                <p class="page-subtitle">Explore and discover all Pokémon</p>
                
                <!-- Search Section -->
                <div class="search-section">
                    <div class="search-wrapper">
                        <span class="search-icon">🔍</span>
                        <input 
                            type="text" 
                            class="search-input" 
                            v-model="searchQuery"
                            @input="onSearch"
                            @focus="showResults = true"
                            placeholder="Search Pokémon by name or number..."
                        >
                        <div class="search-results" v-if="showResults && searchResults.length > 0">
                            <div 
                                class="search-result-item" 
                                v-for="result in searchResults" 
                                :key="result.id"
                                @click="selectFromSearch(result)"
                            >
                                <img :src="result.image" :alt="result.name">
                                <span class="name">{{ result.name }}</span>
                                <span class="id">#{{ formatId(result.id) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Type Filters -->
                <div class="filter-section">
                    <button 
                        class="filter-btn" 
                        :class="{ active: selectedType === 'all' }"
                        @click="filterByType('all')"
                    >
                        All
                    </button>
                    <button 
                        v-for="type in types" 
                        :key="type"
                        class="filter-btn"
                        :class="{ active: selectedType === type }"
                        @click="filterByType(type)"
                    >
                        {{ type }}
                    </button>
                </div>
                
                <!-- Loading State -->
                <loading-spinner v-if="loading" text="Loading Pokémon..." />
                
                <!-- Pokemon Grid -->
                <div class="pokemon-grid" v-else>
                    <pokemon-card 
                        v-for="pokemon in filteredPokemon" 
                        :key="pokemon.id"
                        :pokemon="pokemon"
                        @select="openModal"
                    />
                </div>
                
                <!-- Load More Button -->
                <div style="text-align: center; margin-top: 2rem;" v-if="!loading && canLoadMore">
                    <button class="cta-button primary" @click="loadMore" :disabled="loadingMore">
                        {{ loadingMore ? 'Loading...' : 'Load More Pokémon' }}
                    </button>
                </div>
            </div>
            
            <!-- Modal -->
            <pokemon-modal 
                v-if="selectedPokemon" 
                :pokemon="selectedPokemon"
                @close="closeModal"
                @select-evolution="selectEvolution"
            />
        </main>
    `,
    components: {
        'loading-spinner': LoadingSpinner,
        'pokemon-card': PokemonCard,
        'pokemon-modal': PokemonModal
    },
    data() {
        return {
            pokemons: [],
            loading: true,
            loadingMore: false,
            searchQuery: '',
            searchResults: [],
            showResults: false,
            selectedType: 'all',
            selectedPokemon: null,
            offset: 0,
            limit: 50,
            types: ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal']
        };
    },
    computed: {
        filteredPokemon() {
            if (this.selectedType === 'all') return this.pokemons;
            return this.pokemons.filter(p =>
                p.types.some(t => t.type.name === this.selectedType)
            );
        },
        canLoadMore() {
            return this.offset < 1010;
        }
    },
    async mounted() {
        await this.loadPokemons();
        this.checkQueryParam();
        document.addEventListener('click', this.handleClickOutside);
    },
    unmounted() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        async loadPokemons() {
            this.loading = true;
            try {
                const pokemons = await PokemonAPI.getPokemonWithDetails(this.limit, this.offset);
                this.pokemons = pokemons;
                this.offset += this.limit;
            } catch (error) {
                console.error('Error loading Pokémon:', error);
            }
            this.loading = false;
        },
        async loadMore() {
            if (this.loadingMore) return;
            this.loadingMore = true;
            try {
                const newPokemons = await PokemonAPI.getPokemonWithDetails(this.limit, this.offset);
                this.pokemons = [...this.pokemons, ...newPokemons];
                this.offset += this.limit;
            } catch (error) {
                console.error('Error loading more Pokémon:', error);
            }
            this.loadingMore = false;
        },
        onSearch() {
            if (this.searchQuery.length < 2) {
                this.searchResults = [];
                return;
            }

            const query = this.searchQuery.toLowerCase();
            this.searchResults = this.pokemons
                .filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    String(p.id).includes(query)
                )
                .slice(0, 8)
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
                }));
        },
        selectFromSearch(result) {
            const pokemon = this.pokemons.find(p => p.id === result.id);
            if (pokemon) {
                this.openModal(pokemon);
            }
            this.showResults = false;
            this.searchQuery = result.name;
        },
        handleClickOutside(e) {
            if (!e.target.closest('.search-wrapper')) {
                this.showResults = false;
            }
        },
        filterByType(type) {
            this.selectedType = type;
        },
        openModal(pokemon) {
            this.selectedPokemon = pokemon;
            document.body.style.overflow = 'hidden';
        },
        closeModal() {
            this.selectedPokemon = null;
            document.body.style.overflow = '';
        },
        async selectEvolution(id) {
            try {
                const pokemon = await PokemonAPI.getPokemon(id);
                this.selectedPokemon = pokemon;
            } catch (error) {
                console.error('Error loading evolution:', error);
            }
        },
        formatId(id) {
            return String(id).padStart(3, '0');
        },
        async checkQueryParam() {
            const pokemonId = this.$route.query.pokemon;
            if (pokemonId) {
                try {
                    const pokemon = await PokemonAPI.getPokemon(pokemonId);
                    this.openModal(pokemon);
                } catch (error) {
                    console.error('Error loading Pokémon from query:', error);
                }
            }
        }
    },
    watch: {
        '$route.query.pokemon'(newId) {
            if (newId) {
                this.checkQueryParam();
            }
        }
    }
};

// ============================================
// VUE ROUTER SETUP
// ============================================
const routes = [
    { path: '/', component: LandingPage },
    { path: '/pokedex', component: PokedexPage },
    { path: '/battle', component: BattlePage }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        return { top: 0 };
    }
});

// ============================================
// VUE APP INITIALIZATION
// ============================================
const app = Vue.createApp({
    template: `
        <header-component />
        <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
        <footer-component />
    `
});

app.component('header-component', HeaderComponent);
app.component('footer-component', FooterComponent);
app.component('type-badge', TypeBadge);

app.use(router);
app.mount('#app');
