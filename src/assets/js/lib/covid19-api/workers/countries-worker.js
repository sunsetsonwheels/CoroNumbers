importScripts('xhr.js')

onmessage = (e) => {
  if (e.data.ready) {
    endpointXHR('countries').then((countries) => {
      var list = {}
      for (var country in countries) {
        list[country.ISO2] = {
          slug: country.Slug,
          name: country.Country
        }
      }
      postMessage({
        status: 'success',
        product: list
      })
    }).catch((err) => {
      postMessage({
        status: 'failed',
        product: err
      })
    })
  }
}
