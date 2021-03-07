const nD = val => new Decimal(val)

function DefaultPlayer() {
  return {
    apples: {
      current: nD(0),
    },
    hands: {
      current: nD(2)
    },
    notations: {
      current: "Standard"
    },
    tabs: {
      current: 1
    },
    styles: {
      current: "Light"
    }
  }
}

const load = () => JSON.parse(localStorage.getItem("idle_save"), untagging) ?? DefaultPlayer()

const store = new Vuex.Store({
  state: load(),
  getters: {
    currentValues: state => {
      return {
        apples: state.apples.current,
        hands: state.hands.current,
        notation: state.notations.current,
        tab: state.tabs.current,
        style: state.styles.current
      }
    },
    perSecValues: (state, getters) => {
      return {
        apples: nD(state.hands.current).mul(getters.gainPerValues.hand)
      }
    },
    costValues: state => {
      return {
        hands: nD(state.hands.current).pow(2).mul(5).floor()
      }
    },
    gainPerValues: state => {
      return {
        hand: nD(1)
      }
    },
    booleanCanValues: (state, getters) => {
      return {
        buy: {
          hand: state.apples.current.gte(getters.costValues.hands)
        }
      }
    }
  },
  mutations: {
    INCREMENT_APPLES: (state, payload) => {
      state.apples.current = state.apples.current.add(payload);
    },
    DECREMENT_APPLES: (state, payload) => {
      state.apples.current = state.apples.current.sub(payload);
    },
    INCREMENT_HANDS: (state, payload) => {
      state.hands.current = state.hands.current.add(payload);
    },
    SWITCH_TAB: (state, payload) => {
      state.tabs.current = payload;
    },
    SWITCH_STYLE: (state, payload) => {
      state.styles.current = payload;
    }
  }
});

const app = new Vue({
  el: "#app",
  store,
  created() {
    this.req = requestAnimationFrame(this.tick);
    this.time = 0;
    this.saveInterval = setInterval(this.save, 15000);
    this.notes = ["Standard", "Scientific", "Logarithmic", "Mixed Scientific", "Alphabetic", "Engineering", "Infinity"];
    this.themes = ["Light", "Dark"];
    this.letters = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    this.alphabet = `abcdefghijklmnopqrstuvwxyz`;
  },
  data: () => store.state,
  computed: {
    ...Vuex.mapGetters({
      current: "currentValues",
      per_sec: "perSecValues",
      cost: "costValues",
      gain_per: "gainPerValues",
      can: "booleanCanValues"
    }),
    // Could make computed values for the boolean accessors, but its not necessary.
    formatted() {
      return {
        apples: this.format(this.current.notation, this.current.apples),
        apples_per_sec: this.format(this.current.notation, this.per_sec.apples),
        hands: this.format(this.current.notation, this.current.hands),
        hand_cost: this.format(this.current.notation, this.cost.hands),
        gain_per_hand: this.format(this.current.notation, this.gain_per.hand)
      }
    }
  },
  methods: {
    ...Vuex.mapMutations({
      incrementApples: "INCREMENT_APPLES",
      decrementApples: "DECREMENT_APPLES",
      incrementHands: "INCREMENT_HANDS",
      switchTab: "SWITCH_TAB",
      switchStyle: "SWITCH_STYLE"
    }),
    tick(timeTaken) {
      const deltaTime = timeTaken - this.time;
      this.incrementApples(nD(this.per_sec.apples).mul(deltaTime / 1000));
      this.time = timeTaken;
      this.req = requestAnimationFrame(this.tick);
    },
    save() {
      localStorage.setItem("idle_save", JSON.stringify(this.$data, tagging));
    },
    load,
    reset() {
      let confirmed = confirm("Would you like to reset your save entirely?");
      if (confirmed) {
        localStorage.removeItem("idle_save");
        location.reload();
      }
    },
    buyHand() {
      if (this.can.buy.hand) {
        this.decrementApples(this.cost.hands);
        this.incrementHands(1);
      }
    },
    changeNotation() {
      let isNotLastNote = this.notes.indexOf(this.notations.current) != this.notes.length - 1;
      let nextIndex = this.notes.indexOf(this.notations.current) + 1;
      this.notations.current = isNotLastNote ? this.notes[nextIndex] : this.notes[0];
      
      //tried using a for loop but figured out a much better and cleaner solution shown above ^
    },
    changeStyle() {
      let isNotLastStyle = this.themes.indexOf(this.styles.current) != this.themes.length - 1;
      let nextIndex = this.themes.indexOf(this.styles.current) + 1;
      this.styles.current = isNotLastStyle ? this.themes[nextIndex] : this.themes[0];
    },
    format(note, val) {
      let exponent = val.log10().floor();
      let mantissa;
      let string;
      let remainder = exponent % 3;
      let x = nD(exponent / 3);
      let index = x.floor() - 1;
      let power = exponent - remainder;
      let letter = this.letters[index];
      let y = nD(index / 26).floor();
      let character1 = this.alphabet.charAt(y);
      let character2 = this.alphabet.charAt(index % 26);
      let engineered = nD(exponent / 3).floor().times(3);
      let infinity = nD(Number.MAX_VALUE).log10();
      
      switch (note.toLowerCase()) {
        case "standard":
          mantissa = val.div(nD(10).pow(power));
          string = `${mantissa.toFixed(2)} ${letter}`;
          break;
        case "scientific":
          mantissa = val.div(nD(10).pow(exponent));
          string = `${mantissa.toFixed(2)}e${exponent}`;
          break;
        case "logarithmic":
          string = `e${val.log10().toFixed(2)}`;
          break;
        case "mixed scientific":
          mantissa = val.div(nD(10).pow(exponent >= 15 ? exponent : power));
          string = `${mantissa.toFixed(2)}${exponent >= 15 ? 'e' + exponent : ' ' + letter}`;
          break;
        case "alphabetic":
          // 1000 = 1.00aa
          mantissa = val.div(nD(10).pow(power));
          string = `${mantissa.toFixed(2)}${character1}${character2}`;
          break;
        case "engineering":
          // 1e4 I want it to be 10e3, 1e5 = 100e3, 1e6 = 1e6
          mantissa = val.div(nD(10).pow(power));
          string = `${mantissa.toFixed(2)}e${engineered}`;
          break;
        case "infinity":
          // calculate infinities based on powers of 10 (using log 10)
          mantissa = val.log10().div(infinity);
          string = `${mantissa.toFixed(2)} ∞`;
      }
    
      return exponent >= 3 ? string : val.toFixed(0);
    
    
    
      // 6 should show M and 8 should show M, but 9 should show B -> index 1
      //if (exponent < 3) return val.toFixed(2); // if lower than 1,000 (< 1e3)
      //let mantissa = val / Math.pow(1000, exponent); //for scientific notation etc.
      //if (value == 0) return '0.00'; use when we add break eternity/decimal functions as they dont support a value of exactly 0.
      /*if (exponent % 3 == 0) return `${(val / Math.pow(10, exponent)).toFixed(2)}${letter}`// if divisible by three
      if (exponent % 3 == 1) return `${(val / Math.pow(10, exponent - 1)).toFixed(2)}${letter}`
      if (exponent % 3 == 2) return `${(val / Math.pow(10, exponent - 2)).toFixed(2)}${letter}`*/
    }
  }
});