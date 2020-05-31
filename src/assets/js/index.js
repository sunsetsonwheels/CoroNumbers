'use strict'

var currentActivePane = null

var mainRefreshMeterController = new MeterController('home-meter-refresh', 'indeterminate')

const MAIN_NAV_ELEMENT_ID = 'home-main-info-entries'
var countries = {}
var currentCountry = null


class CountryPaneController {
  onShow () {
    naviBoard.destroyNavigation(MAIN_NAV_ELEMENT_ID)
    setSoftkeys('none', 'none', 'back')
    naviBoard.setNavigation(panes.left.htmlElementId)
    window.onkeydown = this.customKeyHandler
  }

  customKeyHandler (e) {
    switch (e.key) {
      case 'SoftRight':
        naviBoard.destroyNavigation(panes.left.htmlElementId)
        closePane()
        break
      case 'ArrowUp':
      case 'ArrowDown':
        naviBoard.getActiveElement().scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
        break
    }
  }
}

class InformationPaneController {
  onShow () {
    naviBoard.destroyNavigation(MAIN_NAV_ELEMENT_ID)
    setSoftkeys('back', 'none', 'none')
    window.onkeydown = this.customKeyHandler
  }

  customKeyHandler (e) {
    switch (e.key) {
      case 'SoftLeft':
        closePane()
        break
    }
  }
}

var panes = {
  left: {
    htmlElementId: 'home-content-pane-location',
    controller: new CountryPaneController()
  },
  right: {
    htmlElementId: 'home-content-pane-information',
    controller: new InformationPaneController()
  }
}

function defaultKeyHandler (e) {
  switch (e.key) {
    case 'SoftLeft':
      if (currentCountry !== 'null') {
        openPane('left')
      }
      break
    case 'Enter':
      refreshData()
      break
    case 'SoftRight':
      openPane('right')
      break
  }
}

function resetPanes () {
  currentActivePane = null
  if (currentCountry === null) {
    setSoftkeys('none', 'refresh', 'info')
  } else {
    setSoftkeys('location', 'refresh', 'info')
  }
  naviBoard.setNavigation(MAIN_NAV_ELEMENT_ID)
  window.onkeydown = defaultKeyHandler
}

function closePane () {
  if (currentActivePane !== null) {
    var currentActivePaneElement = document.getElementById(panes[currentActivePane].htmlElementId)
    currentActivePaneElement.classList.remove('show-content-pane-' + currentActivePane)
    currentActivePaneElement.classList.add('hide-content-pane-' + currentActivePane)
    resetPanes()
  } else {
    console.warn('No pane is currently active. Not closing any panes.')
  }
}

function openPane (pane) {
  if (pane in panes) {
    try {
      var currentActivePaneElement = document.getElementById(panes[pane].htmlElementId)
      currentActivePaneElement.classList.remove('hide-content-pane-' + pane)
      currentActivePaneElement.classList.add('show-content-pane-' + pane)
      panes[pane].controller.onShow()
      currentActivePane = pane
    } catch (err) {
      console.error('Opening pane failed! Error: ' + err)
      resetPanes()
    }
  } else {
    console.warn('Non-existent pane "' + pane + '" being opened. Not opening any panes.')
  }
}

function setSoftkeys (leftLocalizationKey, centerLocalizationKey, rightLocalizationKey) {
  document.getElementById('softkey-left').setAttribute('data-l10n-id', 'softkey-left-' + leftLocalizationKey)
  document.getElementById('softkey-center').setAttribute('data-l10n-id', 'softkey-center-' + centerLocalizationKey)
  document.getElementById('softkey-right').setAttribute('data-l10n-id', 'softkey-right-' + rightLocalizationKey)
}

function refreshData () {
  function refreshCompleteCb () {
    function adDisplayedCb () {
      window.onkeydown = defaultKeyHandler
      if (currentCountry === null) {
        setSoftkeys('none', 'refresh', 'info')

        navigator.mozL10n.formatValue('toast-refresh-partial').then((text) => {
          kaiosToaster({
            message: text,
            type: 'warning'
          })
        }).catch(() => {
          kaiosToaster({
            message: 'Data refresh partially completed!',
            type: 'warning'
          })
        })
      } else {
        setSoftkeys('location', 'refresh', 'info')

        navigator.mozL10n.formatValue('toast-refresh-full').then((text) => {
          kaiosToaster({
            message: text,
            type: 'success'
          })
        }).catch(() => {
          kaiosToaster({
            message: 'Data refresh completed!',
            type: 'success'
          })
        })
      }

      document.getElementById('home-main-info-entry-refresh').setAttribute('data-l10n-args', JSON.stringify({
        date: (new Date())
      }))

      mainRefreshMeterController.stop()
      mainRefreshMeterController.hide()

      naviBoard.setNavigation(MAIN_NAV_ELEMENT_ID)

      naviBoard.getActiveElement().focus()
    }

    getKaiAd({
      publisher: '4c1c949f-8463-4551-aa6b-c1b8c1c14edc',
      app: 'COVID-19 Numbers',
      slot: 'refresh',
      onerror: err => {
        console.error('KaiAds error:', err)
        adDisplayedCb()
      },
      onready: ad => {
        ad.on('close', () => adDisplayedCb())
        ad.call('display')
      }
    })
  }

  window.onkeydown = () => {}

  closePane()
  mainRefreshMeterController.show()
  mainRefreshMeterController.start()
  setSoftkeys('none', 'none', 'none')

  COVID19API.summary().then((summary) => {
    document.getElementById('home-main-info-entry-confirmed').innerText = summary.cases
    document.getElementById('home-main-info-entry-deaths').innerText = summary.deaths
    document.getElementById('home-main-info-entry-recovered').innerText = summary.recovered

    countries = summary.countries

    navigator.geolocation.getCurrentPosition((pos) => {
      var grid = codegrid.CodeGrid()
      grid.getCode(pos.coords.latitude, pos.coords.longitude, (err, code) => {
        if (err === null && typeof code === 'string') {
          currentCountry = code.toUpperCase()
          if (currentCountry in countries) {
            var country = countries[currentCountry]
            const L10N_ARG = JSON.stringify({
              country: country.name
            })
            document.getElementById('home-location-info-entry-total-cases-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-info-entry-new-cases-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-info-entry-total-deaths-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-info-entry-new-deaths-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-info-entry-total-recovered-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-info-entry-new-recovered-label').setAttribute('data-l10n-args', L10N_ARG)

            document.getElementById('home-location-info-entry-total-cases-number').innerText = country.cases.total
            document.getElementById('home-location-info-entry-new-cases-number').innerText = country.cases.new
            document.getElementById('home-location-info-entry-total-deaths-number').innerText = country.deaths.total
            document.getElementById('home-location-info-entry-new-deaths-number').innerText = country.deaths.new
            document.getElementById('home-location-info-entry-total-recovered-number').innerText = country.recovered.total
            document.getElementById('home-location-info-entry-new-recovered-number').innerText = country.recovered.new
          } else {
            currentCountry = null
          }
          console.log(currentCountry)
        } else {
          console.log(err)
          currentCountry = null
          throw err
        }
        refreshCompleteCb()
      })
    }, (err) => {
      console.error(err)
      navigator.mozL10n.formatValue('alert-location-unavailable').then((text) => {
        alert(text)
      }).catch(() => {
        alert('We were unable to acquire your location. You may try again later by using REFRESH.')
      })
      refreshCompleteCb()
      currentCountry = null
    }, {
      enableHighAccuracy: false,
      timeout: Infinity,
      maximumAge: 3600000
    })
  }).catch((err) => {
    naviBoard.destroyNavigation(MAIN_NAV_ELEMENT_ID)
    setSoftkeys('none', 'refresh', 'info')
    window.onkeydown = defaultKeyHandler
    mainRefreshMeterController.stop()
    mainRefreshMeterController.hide()
    kaiosToaster({
      message: err,
      type: 'error'
    })
  })
}

refreshData()

window.onkeydown = defaultKeyHandler
