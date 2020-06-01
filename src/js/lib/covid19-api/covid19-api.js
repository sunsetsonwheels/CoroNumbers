class COVID19API {
  static summary () {
    return new Promise ((resolve, reject) => {
      var worker = new Worker('js/lib/covid19-api/workers/summary-worker.js')
      worker.onmessage = (e) => {
        worker.terminate()
        if (e.data.status === 'success') {
          resolve(e.data.product)
        } else {
          reject(e.data.product)
        }
      }
      worker.postMessage({
        ready: true
      })
    })
  }

  static countries (mode) {
    return new Promise ((resolve, reject) => {
      var worker = new Worker('js/lib/covid19-api/workers/countries-worker.js')
      worker.onmessage = (e) => {
        worker.terminate()
        if (e.data.status === 'success') {
          resolve(e.data.product)
        } else {
          reject(e.data.product)
        }
      }
      worker.postMessage({
        ready: true,
        mode: mode
      })
    })
  }
}
