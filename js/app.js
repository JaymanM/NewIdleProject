const nD = val => new Decimal(val)

function DefaultPlayer() {
  return {
    coins: {
      current: nD(0)
    },
    notations: {
      current: "Standard"
    }
  }
}

const load = () => JSON.parse(localStorage.getItem("idle_save"), untagging) ?? DefaultPlayer()

const store = new Vuex.Store({
  state: load(),
  getters: {
    currentValues: state => {
      return {
        coins: state.coins.current,
        notation: state.notations.current
      }
    }
  },
  mutations: {
    INCREMENT_COINS: (state, payload) => {
      state.coins.current = state.coins.current.add(payload);
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
    this.notes = ["Standard", "Scientific", "Logarithmic", "Mixed Scientific", "Alphabet"];
    this.letters = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    this.alphabet = `abcdefghijklmnopqrstuvwxyz`;
  },
  data: () => store.state,
  computed: {
    ...Vuex.mapGetters({
      current: "currentValues"
    }),
    formatted() {
      return {
        coins: this.format(this.current.notation, this.current.coins)
      }
    }
  },
  methods: {
    ...Vuex.mapMutations({
      incrementCoins: "INCREMENT_COINS"
    }),
    tick(timeTaken) {
      const deltaTime = timeTaken - this.time;
      this.incrementCoins(1 * (deltaTime / 1000));
      this.time = timeTaken;
      this.req = requestAnimationFrame(this.tick);
    },
    save() {
      localStorage.setItem("idle_save", JSON.stringify(this.$data, tagging));
    },
    load,
    reset() {
      localStorage.removeItem("idle_save");
      location.reload();
    },
    changeNotation() {
      let isNotLastNote = this.notes.indexOf(this.notations.current) != this.notes.length - 1;
      let nextIndex = this.notes.indexOf(this.notations.current) + 1;
      this.notations.current = isNotLastNote ? this.notes[nextIndex] : this.notes[0];
      
      //tried using a for loop but figured out a much better and cleaner solution shown above ^
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
        case "alphabet":
          // 1000 = 1.00aa
          mantissa = val.div(nD(10).pow(power));
          string = `${mantissa.toFixed(2)}${character1}${character2}`;
          break;
      }
    
      return exponent >= 3 ? string : val.toFixed(2);
    
    
    
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