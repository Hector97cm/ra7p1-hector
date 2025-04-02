import { PokemonTeamViewModel } from "../viewModel.js";
import PokemonCard from "./PokemonCard.js";

export const App = {
  components: {
    PokemonCard,
  },
  template: /*html*/`
    <div> 
      <!-- Player Setup Section -->
      <section v-if="currentScreen === 'setup'" class="setup-container" id="player-setup-section">
        <h2 class="setup-title">Configuració dels Jugadors</h2>
        <p class="setup-instruccions">Introdueix els noms dels jugadors per començar el joc.</p>
        <div class="toggle-container">
          <label for="two-players-toggle">Dos Jugadors:</label>
          <label class="switch">
            <input type="checkbox" v-model="isTwoPlayers" id="two-players-toggle" @change="toggleTwoPlayersMode" />
            <span class="slider round"></span>
          </label>
        </div>
        <div class="player-input-group">
          <label for="player1-name" class="player-label">Nom del Jugador 1:</label>
          <input type="text" v-model="player1Name" id="player1-name" class="player-input" required />
        </div>
        <div class="player-input-group" v-if="isTwoPlayers" id="player2-container">
          <label for="player2-name" class="player-label">Nom del Jugador 2:</label>
          <input type="text" v-model="player2Name" id="player2-name" class="player-input" required />
        </div>
        <button @click="startTeamSelection" class="setup-button" id="start-team-selection-button">Següent</button>
      </section>

      <!-- Team Selection Section -->
      <section v-if="currentScreen === 'teamSelection'" id="team-selection-section">
        <h2>Selecciona el teu Equip</h2>
        <p id="current-player-selection">{{ currentPlayerSelectionDisplay }}</p>
        <div id="team-section">
          <h2>El teu Equip</h2>
          <div id="selected-team-grid" class="grid-container">
            <pokemon-card
              v-for="(pokemon, index) in currentTeam"
              :key="index"
              :pokemon="{
                name: pokemon.name,
                image: getImageUrl(pokemon.name),
                points: pokemon.points,
                types: pokemon.types,
                special_power: pokemon.special_power
              }"
              :isSelected="true"
              @toggle-selection="toggleSelection"
            />
          </div>
        </div>
        <h2 id="credits-display">Crèdits restants: {{ creditsDisplay }}</h2>
        <button @click="handleNextPlayer" id="next-player-button">Següent Jugador</button>

        <!-- Sort Options -->
        <div id="sort-options-section">
          <h2>Opcions d'Ordenació</h2>
          <form id="sort-options-form" @submit.prevent="handleSortOptions">
            <fieldset>
              <legend>Ordena per:</legend>
              <label><input type="radio" name="sort-criteria" value="name" v-model="sortCriteria" /> Nom</label>
              <label><input type="radio" name="sort-criteria" value="points" v-model="sortCriteria" /> Punts</label>
              <label><input type="radio" name="sort-criteria" value="type" v-model="sortCriteria" /> Tipus</label>
            </fieldset>
            <fieldset>
              <legend>Mètode d'ordenació:</legend>
              <label><input type="radio" name="sort-method" value="bubble" v-model="sortMethod" /> Bombolla</label>
              <label><input type="radio" name="sort-method" value="insertion" v-model="sortMethod" /> Inserció</label>
              <label><input type="radio" name="sort-method" value="selection" v-model="sortMethod" /> Selecció</label>
            </fieldset>
            <button type="submit" id="sort-team">Ordenar</button>
          </form>
        </div>

        <!-- Pokémon Grid -->
        <div id="pokemon-grid" class="grid-container" ref="gridContainer">
          <pokemon-card
            v-for="(pokemon, index) in globalPokemonList"
            :key="index"
            :pokemon="{
              name: pokemon.name,
              image: getImageUrl(pokemon.name),
              points: pokemon.points,
              types: pokemon.types,
              special_power: pokemon.special_power
            }"
            :isSelected="isPokemonInTeam(pokemon.name)"
            @toggle-selection="toggleSelection"
          />
        </div>
      </section>

      <!-- Battle Section -->
      <section v-if="currentScreen === 'battle'" id="battle-section">
        <h2 id="current-turn-display">{{ currentTurnDisplay }}</h2>
        <div id="teams-overview-section">
          <div>
            <h3 id="player1-team-name">{{ player1Name }}</h3>
            <div id="player1-team-display" class="grid-container">
              <pokemon-card
                v-for="(pokemon, index) in viewModel.player1.team.selectedTeam"
                :key="index"
                :pokemon="{
                  name: pokemon.name,
                  image: getImageUrl(pokemon.name),
                  points: pokemon.points,
                  types: pokemon.types,
                  special_power: pokemon.special_power
                }"
                :isSelected="true"
                @toggle-selection="toggleSelection"
              />
            </div>
          </div>
          <div>
            <h3 id="player2-team-name">{{ player2Name }}</h3>
            <div id="player2-team-display" class="grid-container">
              <pokemon-card
                v-for="(pokemon, index) in viewModel.player2.team.selectedTeam"
                :key="index"
                :pokemon="{
                  name: pokemon.name,
                  image: getImageUrl(pokemon.name),
                  points: pokemon.points,
                  types: pokemon.types,
                  special_power: pokemon.special_power
                }"
                :isSelected="true"
                @toggle-selection="toggleSelection"
              />
            </div>
          </div>
        </div>
        <div id="battle-arena-section" class="arena-container">
          <div id="pokemon1-display" v-if="currentPokemon1">
            <div class="pokemon-card">
              <img :src="getImageUrl(currentPokemon1.name)" :alt="currentPokemon1.name" />
              <h3>{{ currentPokemon1.name }}</h3>
              <p>💥 Poder Especial: {{ currentPokemon1.special_power }}</p>
            </div>
          </div>
          <div id="pokemon2-display" v-if="currentPokemon2">
            <div class="pokemon-card">
              <img :src="getImageUrl(currentPokemon2.name)" :alt="currentPokemon2.name" />
              <h3>{{ currentPokemon2.name }}</h3>
              <p>💥 Poder Especial: {{ currentPokemon2.special_power }}</p>
            </div>
          </div>
        </div>
        <div id="battle-log-section" ref="battleLogContainer">
          <p v-for="(log, index) in battleLog" 
             :key="index" 
             :class="{ 'bold': log.bold }"
             :is="log.type">
            {{ log.message }}
          </p>
        </div>

        <button v-if="!battleFinished" @click="startBattle" id="perform-attack-button">Iniciar Batalla</button>
        <button v-else @click="resetGame" id="reset-game-button">Reiniciar Partida</button>
      </section>
    </div>
  `,
  data() {
    return {
      jsonUrl: "./pokemon_data.json",
      viewModel: null,
      currentPlayer: 1,
      isTwoPlayers: true,
      player1Name: "",
      player2Name: "",
      currentScreen: "setup",
      currentPlayerSelectionDisplay: "",
      creditsDisplay: 0,
      globalPokemonList: [],
      sortCriteria: "name",
      sortMethod: "bubble",
      currentPokemon1: null,
      currentPokemon2: null,
      battleLog: [],
      battleFinished: false,
    };
  },
  computed: {
    currentTeam() {
      return this.currentPlayer === 1
        ? this.viewModel.player1.team.selectedTeam
        : this.viewModel.player2.team.selectedTeam;
    },
    currentTurnDisplay() {
      return this.currentScreen === "battle"
        ? `Comença la batalla: ${this.viewModel.player1.getName()} vs ${this.viewModel.player2.getName()}!`
        : "";
    },
  },
  methods: {
    async init() {
      this.viewModel = new PokemonTeamViewModel(this);
      await this.fetchAndLoadPokemons();
      this.renderGlobalList();
      this.updateCreditsDisplay();
    },
    async fetchAndLoadPokemons() {
      try {
        console.log("Fetching from URL:", this.jsonUrl);
        const response = await fetch(this.jsonUrl);
        if (!response.ok) throw new Error("HTTP error: " + response.status);
        const data = await response.json();
        console.log("Data fetched:", data);
        this.viewModel.pokemonList.loadPokemons(data);
      } catch (error) {
        console.error("Error loading Pokémon data:", error);
      }
    },
    renderGlobalList() {
      this.globalPokemonList = this.viewModel.getGlobalList();
    },
    getImageUrl(name) {
      return `./images/${name}.png`;
    },
    toggleSelection(pokemon) {
      const pokemonName = pokemon.name;
      const isInTeam = this.isPokemonInTeam(pokemonName);

      if (isInTeam) {
        this.viewModel.removePokemonFromTeam(pokemonName);
      } else {
        const addResult = this.viewModel.addPokemonToCurrentPlayer(pokemon);
        if (!addResult) alert("No es pot afegir el Pokémon (crèdits insuficients o equip ple).");
      }
      this.updateCreditsDisplay();
    },
    isPokemonInTeam(name) {
      const playerTeam =
        this.currentPlayer === 1
          ? this.viewModel.player1.team
          : this.viewModel.player2.team;
      return playerTeam.selectedTeam.some((p) => p.name === name);
    },
    updateCreditsDisplay() {
      this.creditsDisplay = this.viewModel.getCredits();
    },
    toggleTwoPlayersMode() {
      if (!this.isTwoPlayers) {
        this.player2Name = "CPU";
      }
    },
    startTeamSelection() {
      if (!this.player1Name) {
        alert("Si us plau, introdueix un nom per al Jugador 1.");
        return;
      }
      if (!this.isTwoPlayers) this.player2Name = "CPU";

      this.viewModel.initializeMatch(this.player1Name, this.player2Name);
      this.currentScreen = "teamSelection";
      this.currentPlayer = 1;
      this.currentPlayerSelectionDisplay = `${this.player1Name}, selecciona el teu Pokémon`;
      this.renderGlobalList();
      this.updateCreditsDisplay();
    },
    handleNextPlayer() {
      if (this.currentPlayer === 1) {
        if (this.isTwoPlayers) {
          this.currentPlayer = 2;
          this.viewModel.switchPlayer();
          this.currentPlayerSelectionDisplay = `${this.player2Name}, selecciona el teu Pokémon`;
          this.renderGlobalList();
          this.updateCreditsDisplay();
        } else {
          this.viewModel.autoSelectCpuTeam();
          this.transitionToBattle();
        }
      } else {
        this.transitionToBattle();
      }
    },
    handleSortOptions() {
      this.viewModel.sortGlobalList(this.sortCriteria, this.sortMethod);
      this.renderGlobalList();
    },
    transitionToBattle() {
      this.currentScreen = "battle";
      this.battleLog = [];
      this.battleFinished = false;
    },
    async startBattle() {
      console.log("🔥 Battle started!");
      try {
        await this.viewModel.startBattle();
        this.viewModel.player1.team.selectedTeam = [...this.viewModel.player1.team.selectedTeam];
        this.viewModel.player2.team.selectedTeam = [...this.viewModel.player2.team.selectedTeam];
        this.battleFinished = true;
      } catch (error) {
        console.error("Error starting battle:", error);
        alert("Error al iniciar la batalla");
      }
    },
    resetGame() {
      this.currentScreen = "setup";
      this.player1Name = "";
      this.player2Name = "";
      this.isTwoPlayers = true;
      this.currentPlayer = 1;
      this.battleLog = [];
      this.currentPokemon1 = null;
      this.currentPokemon2 = null;
      this.battleFinished = false;
      this.viewModel = new PokemonTeamViewModel(this);
      this.init();
    },
    updateTeamsDisplay() {
      this.$forceUpdate();
    },
  },
  watch: {
    battleLog() {
      this.$nextTick(() => {
        const container = this.$refs.battleLogContainer;
        container.scrollTop = container.scrollHeight;
      });
    }
  },
  mounted() {
    this.init();
  },
};
