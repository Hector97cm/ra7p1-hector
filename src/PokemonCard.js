export default {
  name: 'PokemonCard',
  template: /*html*/ `
    <div 
      class="pokemon-card" 
      :class="{ selected: isSelected }" 
      @click="onToggleSelection"
    >
      <img :src="pokemon.image" :alt="pokemon.name" class="pokemon-image" />
      <h3>{{ pokemon.name }}</h3>
      <p v-if="pokemon.types && pokemon.types.length">
        Tipus: {{ pokemon.types.join(', ') }}
      </p>
      <p>Punts: {{ pokemon.points }}</p>
      <p v-if="pokemon.special_power">Especial: {{ pokemon.special_power }}</p>
    </div>
  `,
  props: {
    pokemon: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onToggleSelection() {
      this.$emit('toggle-selection', this.pokemon);
    }
  }
}
