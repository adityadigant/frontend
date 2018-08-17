// Initialize the firebase application
registerServiceWorker()

firebase.initializeApp({
  apiKey: "AIzaSyA4s7gp7SFid_by1vLVZDmcKbkEcsStBAo",
  authDomain: "growthfile-207204.firebaseapp.com",
  databaseURL: "https://growthfile-207204.firebaseio.com",
  projectId: "growthfile-207204",
  storageBucket: "growthfile-207204.appspot.com",
  messagingSenderId: "701025551237"
})

// firebaseUI login config object
function firebaseUiConfig (value) {
  return {
    'callbacks': {
      'signInSuccess': function (user, credential, redirectUrl) {
        if (value) {
          updateEmail(user, value)
          return
        }

        // no redirect
        return false
      },
      'signInFailure': function (error) {
        return handleUIError(error)
      }
    },
    'signInFlow': 'popup',
    'signInOptions': [

      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,

        recaptchaParameters: {
          type: 'image',
          size: 'invisible',
          badge: 'bottomleft'
        },
        defaultCountry: 'IN'
      }
    ]
  }
}

moment.locale('en', {
  calendar: {
    lastDay: '[yesterday]',
    sameDay: 'LT',
    nextDay: '[Tomorrow at] LT',
    lastWeek: 'dddd',
    nextWeek: 'dddd [at] LT',
    sameElse: 'L'
  },

  months: [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
  ]
})

// initialize smooth scrolling
window.scrollBy({
  top: 100,
  left: 0,
  behavior: 'smooth'
})

firebase.auth().onAuthStateChanged(function (auth) {
  // if user is signed in then run userIsSigned fn else run userSignedOut fn
  auth ? userSignedIn(auth) : userSignedOut()
})

function userSignedIn (auth) {
  if (window.Worker && window.indexedDB) {
    layoutGrid()
    requestCreator('initializeIDB')
    return
  }

  firebase.auth().signOut().catch(signOutError)

}

// When user is signed out
function userSignedOut () {
  const login = document.createElement('div')
  login.id = 'login-container'
  document.body.innerHTML = login.outerHTML

  const ui = new firebaseui.auth.AuthUI(firebase.auth())

  // DOM element to insert firebaseui login UI
  ui.start('#login-container', firebaseUiConfig())
}

function signOutError (error) {
  // handler error with snackbar
  snacks(error)
}

function layoutGrid () {
  const layout = document.createElement('div')
  layout.classList.add('mdc-layout-grid', 'mdc-typography', 'app')

  const layoutInner = document.createElement('div')
  layoutInner.className = 'mdc-layout-grid__inner cell-space'

  const headerDiv = document.createElement('div')
  headerDiv.id = 'header'
  const currentPanel = document.createElement('div')
  currentPanel.id = 'app-current-panel'
  currentPanel.className = 'mdc-layout-grid__cell--span-12'

  const snackbar = document.createElement('div')
  snackbar.id = 'snackbar-container'

  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  layoutInner.appendChild(snackbar)

  layout.appendChild(layoutInner)
  document.body.innerHTML = layout.outerHTML
}

function registerServiceWorker(){
  if(!navigator.serviceWorker) return
  navigator.serviceWorker.register('./syncWorker.js',{
    scope : './'
  })
  .then(console.log)
  .catch(console.log)
}