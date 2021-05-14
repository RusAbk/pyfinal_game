export default ({ app }, inject) => {
    // Inject $hello(msg) in Vue, context and store.
    inject('ws', new WebSocket(process.env.socketServer))
  }