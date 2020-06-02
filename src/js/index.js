'use strict'

var currentActivePane = null

var mainRefreshMeterController = new MeterController('home-meter-refresh', 'indeterminate')

const MAIN_NAV_ELEMENT_ID = 'home-main-data-entries'
var countries = {}
var currentCountry = null
var isDataLoaded = false

mainRefreshMeterController.start()
var grid = codegrid.CodeGrid()
mainRefreshMeterController.stop()

function setSoftkeys (leftLocalizationKey, centerLocalizationKey, rightLocalizationKey) {
  document.getElementById('softkey-left').setAttribute('data-l10n-id', 'softkey-left-' + leftLocalizationKey)
  document.getElementById('softkey-center').setAttribute('data-l10n-id', 'softkey-center-' + centerLocalizationKey)
  document.getElementById('softkey-right').setAttribute('data-l10n-id', 'softkey-right-' + rightLocalizationKey)
}

function defaultKeyHandler (e) {
  switch (e.key) {
    case 'SoftLeft':
      if (isDataLoaded && currentCountry !== null) {
        openPane('left')
      } else {
        navigator.mozL10n.formatValue('alert-location-unavailable').then((text) => {
          alert(text)
        }).catch(() => {
          alert('We were unable to acquire your location. You may try again later by using REFRESH.')
        })
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
  setSoftkeys('location', 'refresh', 'info')
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
    setSoftkeys('back', 'read', 'none')
    naviBoard.setNavigation(panes.right.htmlElementId)
    document.body.onclick = (e) => {
      if (e.target.className && e.target.className.includes('info-entry')) {
        const INFO_DATA_TAG = e.target.getAttribute('data-covid19-info')
        if (INFO_DATA_TAG) {
          navigator.mozL10n.formatValue('home-info-body-' + INFO_DATA_TAG, {
            newline: '\n\n'
          }).then((text) => {
            alert(text)
          }).catch(() => {
            alert('Info body not found for selected info topic.')
          })
        }
      }
    }
    window.onkeydown = this.customKeyHandler
  }

  customKeyHandler (e) {
    switch (e.key) {
      case 'SoftLeft':
        document.body.onclick = undefined
        naviBoard.destroyNavigation(panes.right.htmlElementId)
        closePane()
        break
      case 'Enter':
        naviBoard.getActiveElement().click()
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

function refreshData () {
  function refreshCompleteCb () {
    function adDisplayedCb () {
      isDataLoaded = true
      window.onkeydown = defaultKeyHandler
      setSoftkeys('location', 'refresh', 'info')
      if (currentCountry === null) {
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

      document.getElementById('home-main-data-entry-refresh').setAttribute('data-l10n-args', JSON.stringify({
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

  naviBoard.destroyNavigation(MAIN_NAV_ELEMENT_ID)
  window.onkeydown = undefined
  isDataLoaded = false

  closePane()
  mainRefreshMeterController.show()
  mainRefreshMeterController.start()
  setSoftkeys('none', 'none', 'none')

  COVID19API.summary().then((summary) => {
    document.getElementById('home-main-data-entry-confirmed').innerText = summary.cases
    document.getElementById('home-main-data-entry-deaths').innerText = summary.deaths
    document.getElementById('home-main-data-entry-recovered').innerText = summary.recovered

    countries = summary.countries

    navigator.geolocation.getCurrentPosition((pos) => {
      grid.getCode(pos.coords.latitude, pos.coords.longitude, (err, code) => {
        if (err === null && typeof code === 'string') {
          currentCountry = code.toUpperCase()
          if (currentCountry in countries) {
            var country = countries[currentCountry]
            const L10N_ARG = JSON.stringify({
              country: country.name
            })
            document.getElementById('home-location-data-entry-total-cases-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-data-entry-new-cases-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-data-entry-total-deaths-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-data-entry-new-deaths-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-data-entry-total-recovered-label').setAttribute('data-l10n-args', L10N_ARG)
            document.getElementById('home-location-data-entry-new-recovered-label').setAttribute('data-l10n-args', L10N_ARG)

            document.getElementById('home-location-data-entry-total-cases-number').innerText = country.cases.total
            document.getElementById('home-location-data-entry-new-cases-number').innerText = country.cases.new
            document.getElementById('home-location-data-entry-total-deaths-number').innerText = country.deaths.total
            document.getElementById('home-location-data-entry-new-deaths-number').innerText = country.deaths.new
            document.getElementById('home-location-data-entry-total-recovered-number').innerText = country.recovered.total
            document.getElementById('home-location-data-entry-new-recovered-number').innerText = country.recovered.new
          } else {
            currentCountry = null
          }
        } else {
          console.log(err)
          currentCountry = null
        }
        refreshCompleteCb()
      })
    }, (err) => {
      console.error(err)
      refreshCompleteCb()
      currentCountry = null
    }, {
      enableHighAccuracy: false,
      timeout: Infinity,
      maximumAge: 3600000
    })
  }).catch((err) => {
    naviBoard.setNavigation(MAIN_NAV_ELEMENT_ID)
    setSoftkeys('none', 'refresh', 'info')
    isDataLoaded = false
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
