importScripts('xhr.js')

onmessage = (e) => {
  if (e.data.ready) {
    endpointXHR('summary').then((summary) => {
      var countries = {}
      try {
        for (var country of summary.Countries) {
          countries[country.CountryCode] = {
            cases: {
              total: country.TotalConfirmed,
              new: country.NewConfirmed
            },
            deaths: {
              total: country.TotalDeaths,
              new: country.NewDeaths
            },
            recovered: {
              total: country.TotalRecovered,
              new: country.NewRecovered
            },
            name: country.Country
          }
        }
        postMessage({
          status: 'success',
          product: {
            cases: summary.Global.TotalConfirmed,
            deaths: summary.Global.TotalDeaths,
            recovered: summary.Global.TotalRecovered,
            countries: countries
          }
        })
      } catch (err) {
        postMessage({
          status: 'failed',
          product: err
        })
      }
    }).catch((err) => {
      postMessage({
        status: 'failed',
        product: err
      })
    })
  }
}
