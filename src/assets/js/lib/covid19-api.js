class COVID19API {
  constructor () {
    this.apiRoot = 'https://api.covid19api.com/'
  }

  asyncXHR (endpoint) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest({ mozSystem: true })
      xhr.timeout = 5000
      xhr.open('GET', this.apiRoot + endpoint)
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.response))
          } catch (err) {
            reject(err)
          }
        } else {
          reject(xhr.statusText)
        }
      }
      xhr.onerror = () => reject(xhr.statusText)
      xhr.ontimeout = () => reject(xhr.statusText)
      xhr.send()
    })
  }

  summary () {
    return new Promise((resolve, reject) => {
      this.asyncXHR('summary').then(summary => {
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
          resolve({
            cases: summary.Global.TotalConfirmed,
            deaths: summary.Global.TotalDeaths,
            recovered: summary.Global.TotalRecovered,
            countries: countries
          })
        } catch (err) {
          reject(err)
        }
      }).catch(err => reject(err))
    })
  }

  countries () {
    return new Promise((resolve, reject) => {
      this.asyncXHR('countries').then(countries => {
        var list = {}
        for (var country in countries) {
          list[country.ISO2] = {
            slug: country.Slug,
            name: country.Country
          }
        }
        resolve(list)
      }).catch(err => reject(err))
    })
  }
}
