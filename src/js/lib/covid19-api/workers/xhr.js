function endpointXHR (endpoint) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest({ mozSystem: true })
    xhr.timeout = 5000
    xhr.open('GET', 'https://api.covid19api.com/' + endpoint)
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
    xhr.onerror = () => reject(xhr.status)
    xhr.ontimeout = () => reject(xhr.status)
    xhr.send()
  })
}
