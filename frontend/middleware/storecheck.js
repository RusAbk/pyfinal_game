export default function ({
  store,
  redirect
}) {
  if (store.state.key == undefined) {
    return redirect('/')
  }
  if (store.state.key != undefined && store.state.name == undefined) {
    return redirect('/pregame')
  }
  if (store.state.key != undefined && store.state.name != undefined) {
    return redirect('/game')
  }
}
