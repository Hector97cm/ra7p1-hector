import { Player, PokemonList, PokemonTeam } from "./model.js";

export class PokemonTeamViewModel {
  constructor(pokemonUI) {
    this.player1 = new Player();
    this.player2 = new Player();
    this.currentPlayer = this.player1;
    this.team = new PokemonTeam();
    this.pokemonList = new PokemonList();
    this.pokemonUI = pokemonUI;
  }

  initializeMatch(player1Name, player2Name) {
    this.player1 = new Player(player1Name);
    this.player2 = new Player(player2Name);
    this.currentPlayer = this.player1;
  }

  switchPlayer() {
    this.currentPlayer =
      this.currentPlayer === this.player1 ? this.player2 : this.player1;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  areTeamsComplete() {
    return this.player1.team.isFull() && this.player2.team.isFull();
  }

  addPokemonToTeam(name) {
    const pokemon = this.pokemonList.getPokemonByName(name);
    if (!pokemon) {
      console.error("❌ Pokémon not found in the global list.");
      return;
    }

    if (this.team.getCredits() < pokemon.points) {
      console.error("❌ Not enough credits to add this Pokémon!");
      return;
    }

    const success = this.team.addPokemon(pokemon);
    if (!success) {
      console.warn(`⚠️ The Pokémon ${pokemon.name} is already on the team.`);
    }
  }

  addPokemonToCurrentPlayer(pokemon) {
    return this.currentPlayer.addPokemon(pokemon);
  }

  removePokemonFromTeam(name) {
    this.currentPlayer.team.removePokemon(name);
  }

  sortGlobalList(criteria, method) {
    this.pokemonList.sortPokemons(criteria, method);
  }

  getGlobalList() {
    return this.pokemonList.allPokemons;
  }

  getTeamDetails() {
    return this.team.getTeamDetails();
  }

  getCredits() {
    return this.currentPlayer.team.getCredits();
  }

  setPlayerNames(player1Name, player2Name) {
    this.player1.name = player1Name;
    this.player2.name = player2Name;
  }

  autoSelectCpuTeam() {
    console.log("⚙️ Auto-selecting Pokémon for CPU...");
    const cpuTeam = this.player2.team;
    const availablePokemons = [...this.pokemonList.allPokemons];
    const targetTeamSize = 6;
    const maxCredits = 200;

    console.log("Available Pokémon count:", availablePokemons.length);
    console.log("Max Credits:", maxCredits);

    // Barajar la lista de Pokémon para variedad
    for (let i = availablePokemons.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePokemons[i], availablePokemons[j]] = [
        availablePokemons[j],
        availablePokemons[i],
      ];
    }

    // Limpiar el equipo y establecer créditos
    cpuTeam.selectedTeam = [];
    cpuTeam.credits = maxCredits;
    console.log("Initial Credits:", cpuTeam.credits);

    // Seleccionar 6 Pokémon dentro del límite de 200 créditos
    let selectedCount = 0;
    let totalCost = 0;

    // Primera pasada: intentar llenar con variedad
    for (let pokemon of availablePokemons) {
      if (
        selectedCount < targetTeamSize &&
        cpuTeam.credits >= pokemon.points &&
        !cpuTeam.selectedTeam.some((p) => p.name === pokemon.name)
      ) {
        const success = cpuTeam.addPokemon(pokemon);
        if (success) {
          selectedCount++;
          totalCost += pokemon.points;
          console.log(
            `Added ${pokemon.name} (Points: ${pokemon.points}), Total Cost: ${totalCost}, Credits left: ${cpuTeam.credits}`
          );
        }
      }
      if (selectedCount === targetTeamSize) break;
    }

    // Si no se alcanzó el objetivo, ajustar con Pokémon más baratos
    if (selectedCount < targetTeamSize) {
      console.warn("⚠️ Adjusting team to reach 6 Pokémon...");
      const remainingSpots = targetTeamSize - selectedCount;
      const remainingPokemons = availablePokemons.filter(
        (p) => !cpuTeam.selectedTeam.some((sp) => sp.name === p.name)
      );

      // Ordenar restantes por costo ascendente
      remainingPokemons.sort((a, b) => a.points - b.points);

      for (let pokemon of remainingPokemons) {
        if (
          selectedCount < targetTeamSize &&
          cpuTeam.credits >= pokemon.points
        ) {
          const success = cpuTeam.addPokemon(pokemon);
          if (success) {
            selectedCount++;
            totalCost += pokemon.points;
            console.log(
              `Added ${pokemon.name} (Points: ${pokemon.points}), Total Cost: ${totalCost}, Credits left: ${cpuTeam.credits}`
            );
          }
        }
        if (selectedCount === targetTeamSize) break;
      }
    }

    // Verificación final
    if (selectedCount !== targetTeamSize) {
      console.error(
        `❌ Failed to select exactly 6 Pokémon. Selected: ${selectedCount}, Total Cost: ${totalCost}, Credits left: ${cpuTeam.credits}`
      );
      console.log("Selected Team:", cpuTeam.selectedTeam.map((p) => p.name));
    } else if (totalCost > maxCredits) {
      console.error(
        `❌ Total cost exceeds 200 credits! Total Cost: ${totalCost}`
      );
    }

    console.log(`✅ CPU team selected (${cpuTeam.selectedTeam.length} Pokémon): ${cpuTeam.getTeamDetails()}`);
    console.log("CPU Team Size:", cpuTeam.selectedTeam.length);
    console.log("Total Cost:", totalCost);
    console.log("Remaining Credits:", cpuTeam.credits);
  }

  async startBattle() {
    console.log("🔥 Iniciant la batalla...");
    this.pokemonUI.$data.currentPokemon1 = null;
    this.pokemonUI.$data.currentPokemon2 = null;

    while (
      this.player1.team.selectedTeam.length > 0 &&
      this.player2.team.selectedTeam.length > 0
    ) {
      await this.fightRound();
    }

    const winner =
      this.player1.team.selectedTeam.length > 0
        ? this.player1.getName()
        : this.player2.getName();

    this.addToBattleLog(`🏆 La batalla ha acabat! ${winner} és el guanyador!`, 'h2');
  }

  addToBattleLog(message, type = 'p', bold = false) {
    this.pokemonUI.$data.battleLog.push({ message, type, bold });
    console.log(message);
  }

  async fightRound() {
    const pokemon1 = this.getRandomFighter(this.player1.team);
    const pokemon2 = this.getRandomFighter(this.player2.team);

    if (!pokemon1 || !pokemon2) return;

    this.addToBattleLog(`⚔️ ${pokemon1.name} vs ${pokemon2.name}`);
    this.pokemonUI.$data.currentPokemon1 = pokemon1;
    this.pokemonUI.$data.currentPokemon2 = pokemon2;

    await new Promise((resolve) => {
      setTimeout(() => {
        if (pokemon1.special_power === pokemon2.special_power) {
          this.addToBattleLog(`💥 ${pokemon1.name} i ${pokemon2.name} es derroten mútuament!`, 'p', true);
          this.player2.team.removePokemon(pokemon2.name);
          this.player1.team.removePokemon(pokemon1.name);
        } else if (pokemon1.special_power > pokemon2.special_power) {
          this.addToBattleLog(`💥 ${pokemon1.name} derrota ${pokemon2.name}!`);
          const damageMade = this.player2.team.removePokemon(pokemon2.name);
          const message = this.player1.team.decreaseSpecialPower(pokemon1.name, damageMade);
          this.addToBattleLog(`${message}`, 'p', true);
        } else {
          this.addToBattleLog(`💥 ${pokemon2.name} derrota ${pokemon1.name}!`);
          const damageMade = this.player1.team.removePokemon(pokemon1.name);
          const message = this.player2.team.decreaseSpecialPower(pokemon2.name, damageMade);
          this.addToBattleLog(`${message}`, 'p', true);
        }

        this.pokemonUI.$data.viewModel.player1.team.selectedTeam = [...this.player1.team.selectedTeam];
        this.pokemonUI.$data.viewModel.player2.team.selectedTeam = [...this.player2.team.selectedTeam];
        resolve();
      }, 2000);
    });
  }

  getRandomFighter(team) {
    if (team.selectedTeam.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * team.selectedTeam.length);
    return team.selectedTeam[randomIndex];
  }
}