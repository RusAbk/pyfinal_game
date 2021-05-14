export const state = () => ({
  key: undefined,
  name: undefined,
  role: undefined
})

export const mutations = {
  setKey(state, key) {
    state.key = key
  },
  setName(state, name) {
    state.name = name
  },
  setRole(state, role) {
    state.role = role
  },
  initialiseStore(state) {
    if (localStorage.getItem('store')) {
      this.replaceState(
        Object.assign(state, JSON.parse(localStorage.getItem('store')))
      );
    }
  }
}

export const getters = {
  key: state => {
    return state.key;
  },
  name: state => {
    return state.name;
  }
}
