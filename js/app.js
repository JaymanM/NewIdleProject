const nD = val => new Decimal(val)

function DefaultPlayer() {
  return {
    apples: {
      current: nD(0),
    },
    hands: {
      current: nD(2),
      sacrificed: nD(0)
    },
    styles: {
      current: "Light"
    },
    notations: {
      current: "Standard",
      precision: 0
    },
    tabs: {
      current: 1
    },
    achs: {
      status: new Array(2).fill(false)
    }
  }
}

const load = () => JSON.parse(localStorage.getItem("idle_save"), untagging) ?? DefaultPlayer()

const store = new Vuex.Store({
  state: load(),
  getters: {
    currentValues: (state, getters) => {
      return {
        apples: state.apples.current,
        hands: state.hands.current,
        hands_sacrificed: state.hands.sacrificed,
        notation: state.notations.current,
        tab: state.tabs.current,
        style: state.styles.current,
        precision: state.notations.precision,
        completed_achievements() {
          let totalCompletedAchs = 0;
          for (i of state.achs.status) {
            if (i === true) {
              totalCompletedAchs++;
            }
          }
          return totalCompletedAchs;
        }
      }
    },
    perSecValues: (state, getters) => {
      return {
        apples: nD(state.hands.current).mul(getters.gainPerValues.hand)
      }
    },
    costValues: state => {
      return {
        hand: state.hands.current.pow(2).mul(5).floor(),
        hand_sacrifice: state.hands.sacrificed.add(1).pow(2).mul(100)
      }
    },
    gainPerValues: (state, getters) => {
      return {
        hand: nD(1).mul(getters.effectValues.hand_sacrifice_multi).mul(getters.effectValues.achievement_multi)
      }
    },
    booleanCanValues: (state, getters) => {
      return {
        buy_hand: state.apples.current.gte(getters.costValues.hand),
        sacrifice_hand: state.apples.current.gte(getters.costValues.hand_sacrifice) && state.hands.current.gt(2)
      }
    },
    effectValues: (state, getters) => {
      return {
        hand_sacrifice_multi: nD(1).mul(nD(1.1).pow(state.hands.sacrificed)),
        achievement_multi: nD(1).mul(nD(1.4).pow(getters.currentValues.completed_achievements()))
      }
    },
    booleanIsValues: (state, getters) => {
      return {
        hand_sacrifice_unlocked: state.achs.status[0]
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
    DECREMENT_HANDS: (state, payload) => {
      state.hands.current = state.hands.current.sub(payload);
    },
    SWITCH_TAB: (state, payload) => {
      state.tabs.current = payload;
    },
    INCREMENT_HANDS_SACRIFICED: (state, payload) => {
      state.hands.sacrificed = state.hands.sacrificed.add(payload);
    },
    SWITCH_STYLE: (state, payload) => {
      state.styles.current = payload;
    },
    SWITCH_PRECISION: (state, payload) => {
      state.notations.precision = payload;
    },
    SWITCH_NOTATION: (state, payload) => {
      state.notations.current = payload;
    },
    OBTAIN_ACHIEVEMENT: (state, id) => {
      Vue.set(state.achs.status, id, true);
    }
  }
});

const app = new Vue({
  el: "#app",
  store,
  created() {
    this.checkAchievements();
    this.req = requestAnimationFrame(this.tick);
    this.time = 0;
    this.saveInterval = setInterval(this.save, 15000);
    this.achInterval = setInterval(this.checkAchievements, 1000);
    this.notes = ["Standard", "Scientific", "Logarithmic", "Mixed Scientific", "Alphabetic", "Engineering", "Infinity"];
    this.themes = ["Light", "Dark"];
    this.letters = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    this.alphabet = `abcdefghijklmnopqrstuvwxyz`;
    this.achievementData = {
      0: {
        title: "Ambidextrous",
        pre: "Have", 
        suf: "hands at any one time",
        req: 8,
        reward: "Unlock the hand sacrifice upgrade",
        isUnlocked: () => this.current.hands.gte(8),
        isImplemented: true
      },
      1: {
        title: "Where are you putting them?!!",
        pre: "Have",
        suf: "hands at any one time",
        req: 100,
        isUnlocked: () => this.current.hands.gte(100),
        isImplemented: true
      },
      2: {
        title: "An apple flood!",
        pre: "Have",
        suf: "apples at any one time",
        req: 5e5,
        isUnlocked: () => this.current.apples.gte(5e5),
        isImplemented: true
      },
      3: {
        title: "All of the sweaty palms!!",
        pre: "Have",
        suf: "hands at any one time",
        req: 800,
        isUnlocked: () => this.current.hands.gte(800),
        isImplemented: true
      },
      4: {
        title: "How many have I picked again?",
        pre: "Have",
        suf: "apples at any one time",
        req: 5e6,
        isUnlocked: () => this.current.apples.gte(5e6),
        isImplemented: true
      },
      5: {
        title: "COMING SOON",
        isImplemented: false
      },
      6: {
        title: "COMING SOON",
        isImplemented: false
      },
      7: {
        title: "COMING SOON",
        isImplemented: false
      },
      8: {
        title: "COMING SOON",
        isImplemented: false
      },
      9: {
        title: "COMING SOON",
        isImplemented: false
      }
    }
  },
  data: () => store.state,
  computed: {
    ...Vuex.mapGetters({
      current: "currentValues",
      per_sec: "perSecValues",
      cost: "costValues",
      gain_per: "gainPerValues",
      can: "booleanCanValues",
      is: "booleanIsValues",
      effect: "effectValues"
    }),
    // Could make computed values for the boolean accessors, but its not necessary.
    formatted() {
      return {
        apples: this.format(this.current.notation, this.current.apples, this.current.precision),
        apples_per_sec: this.format(this.current.notation, this.per_sec.apples, this.current.precision),
        hands: this.format(this.current.notation, this.current.hands, this.current.precision),
        hands_sacrificed: this.format(this.current.notation, this.current.hands_sacrificed, this.current.precision),
        hand_cost: this.format(this.current.notation, this.cost.hand, this.current.precision),
        hand_sacrifice_cost: this.format(this.current.notation, this.cost.hand_sacrifice, this.current.precision),
        hand_sacrifice_multi: this.format(this.current.notation, this.effect.hand_sacrifice_multi, this.current.precision),
        gain_per_hand: this.format(this.current.notation, this.gain_per.hand, this.current.precision),
        achievements_completed: this.current.completed_achievements().toFixed(0), // Do not need to use format function 'yet'
        achievement_multi: this.format(this.current.notation, this.effect.achievement_multi, this.current.precision),
        achievement_reqs: Object.values(this.achievementData).map(ach => this.format(this.current.notation, nD(ach.req), this.current.precision))
      }
    }
  },
  methods: {
    ...Vuex.mapMutations({
      incrementApples: "INCREMENT_APPLES",
      decrementApples: "DECREMENT_APPLES",
      incrementHands: "INCREMENT_HANDS",
      decrementHands: "DECREMENT_HANDS",
      incrementHandsSacrificed: "INCREMENT_HANDS_SACRIFICED",
      switchTab: "SWITCH_TAB",
      switchStyle: "SWITCH_STYLE",
      switchPrecision: "SWITCH_PRECISION",
      switchNotation: "SWITCH_NOTATION",
      obtainAchievement: "OBTAIN_ACHIEVEMENT"
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
      if (this.can.buy_hand) {
        this.decrementApples(this.cost.hand);
        this.incrementHands(1);
      }
    },
    sacrificeHand() {
      if (this.can.sacrifice_hand) {
        this.decrementApples(this.cost.hand_sacrifice);
        this.decrementHands(1);
        this.incrementHandsSacrificed(1);
      }
    },
    /*changeNotation() {
      let isNotLastNote = this.notes.indexOf(this.notations.current) != this.notes.length - 1;
      let nextIndex = this.notes.indexOf(this.notations.current) + 1;
      this.switchNotation(isNotLastNote ? this.notes[nextIndex] : this.notes[0]);
      //tried using a for loop but figured out a much better and cleaner solution shown above ^
    },
    changeStyle() {
      let isNotLastStyle = this.themes.indexOf(this.styles.current) != this.themes.length - 1;
      let nextIndex = this.themes.indexOf(this.styles.current) + 1;
      this.switchStyle(isNotLastStyle ? this.themes[nextIndex] : this.themes[0]);
    },
    changePrecision() {
      let isNotLastPrecision = this.current.precision != 5;
      let nextIndex = this.current.precision + 1;
      this.switchPrecision(isNotLastPrecision ? nextIndex : 0);
    },*/
    checkAchievements() {
      for (i in this.achievementData) {
        if (this.achievementData[i].title != "COMING SOON") {
          if (this.achievementData[i].isUnlocked()) {
            this.obtainAchievement(i);
          }
        }
      }
    },
    format(note, val, dp = 2) {
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
          string = `${mantissa.toFixed(dp)} ${letter}`;
          break;
        case "scientific":
          mantissa = val.div(nD(10).pow(exponent));
          string = `${mantissa.toFixed(dp)}e${exponent}`;
          break;
        case "logarithmic":
          string = `e${val.log10().toFixed(dp)}`;
          break;
        case "mixed scientific":
          mantissa = val.div(nD(10).pow(exponent >= 15 ? exponent : power));
          string = `${mantissa.toFixed(dp)}${exponent >= 15 ? 'e' + exponent : ' ' + letter}`;
          break;
        case "alphabetic":
          // 1000 = 1.00aa
          mantissa = val.div(nD(10).pow(power));
          string = `${mantissa.toFixed(dp)}${character1}${character2}`;
          break;
        case "engineering":
          // 1e4 I want it to be 10e3, 1e5 = 100e3, 1e6 = 1e6
          mantissa = val.div(nD(10).pow(power));
          string = `${mantissa.toFixed(dp)}e${engineered}`;
          break;
        case "infinity":
          // calculate infinities based on powers of 10 (using log 10)
          mantissa = val.log10().div(infinity);
          string = `${mantissa.toFixed(dp)} ∞`;
      }
    
      return exponent >= 3 ? string : val.toFixed(dp);
    
    
    
      // 6 should show M and 8 should show M, but 9 should show B -> index 1
      //if (exponent < 3) return val.toFixed(2); // if lower than 1,000 (< 1e3)
      //let mantissa = val / Math.pow(1000, exponent); //for scientific notation etc.
      //if (value == 0) return '0.00'; use when we add break eternity/decimal functions as they dont support a value of exactly 0.
      /*if (exponent % 3 == 0) return `${(val / Math.pow(10, exponent)).toFixed(2)}${letter}`// if divisible by three
      if (exponent % 3 == 1) return `${(val / Math.pow(10, exponent - 1)).toFixed(2)}${letter}`
      if (exponent % 3 == 2) return `${(val / Math.pow(10, exponent - 2)).toFixed(2)}${letter}`*/
    }
  },
  components: {
    achievement: {
      props: ['title', 'pre', 'suf', 'req', 'status', 'implemented', 'reward'],
      template: `
        <div class="vw1 achDiv"  :class="{achNotImpl:!implemented, achUnl:status, achNotUnl:!status}">
          <span>{{ title }}</span>
          <br>
          <span v-if="implemented">{{ pre }} {{ req }} {{ suf }}.</span>
          <br>
          <span v-if="reward">Reward: {{ reward }}</span>
        </div>
      `
    } // don't need ternary operator, just us v-if
  }
});