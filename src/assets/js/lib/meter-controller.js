class MeterController {
  constructor (meterContainerElementId, meterMode) {
    this.meterContainerElement = document.getElementById(meterContainerElementId)
    this.meterBarElement = this.meterContainerElement.children[0]
    this.meterMode = meterMode || 'determinate'
    this.meterUpdateInterval = null
  }

  start () {
    if (this.meterMode === 'indeterminate') {
      this.meterBarElement.style.width = '0'
      var width = 0
      this.meterUpdateInterval = setInterval(() => {
        if (width >= 100) {
          width = 0
        } else {
          width++
          this.meterBarElement.style.width = width + '%'
        }
      }, 20)
    } else {
      throw new Error('Meter mode is not Indeterminate. Not starting meter.')
    }
  }

  stop () {
    if (this.meterMode === 'indeterminate') {
      clearInterval(this.meterUpdateInterval)
      this.reset()
    } else {
      throw new Error('Meter mode is not Indeterminate. Not stopping meter.')
    }
  }

  set (width) {
    if (this.meterMode === 'determinate') {
      if (width >= 0 && width <= 100) {
        this.meterBarElement.style.width = width + '%'
      } else {
        throw new TypeError('Meter width out of bounds. Not updating meter.')
      }
    } else {
      throw new Error('Meter mode is not Determinate. Not updating meter.')
    }
  }

  reset () {
    this.meterBarElement.style.width = 0 + '%'
  }

  hide () {
    this.meterContainerElement.style.display = 'none'
  }

  show () {
    this.meterContainerElement.style.display = 'initial'
  }
}
