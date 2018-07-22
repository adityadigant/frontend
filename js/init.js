// Initialize the firebase application

firebase.initializeApp({

  apiKey: 'AIzaSyBgbeCmkuveYZwqKp43KNvlEgwumxRroVY',
  authDomain: 'growthfilev2-0.firebaseapp.com',
  databaseURL: 'https://growthfilev2-0.firebaseio.com',
  projectId: 'growthfilev2-0',
  storageBucket: 'growthfilev2-0.appspot.com'

})

// firebaseUI login config object
function firebaseUiConfig() {
  return {
    'callbacks': {
      'signInSuccess': function (user, credential, redirectUrl) {
        // Do not redirect
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
          size: 'normal',
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

firebase.auth().onAuthStateChanged(function (auth) {
  // if user is signed in then run userIsSigned fn else run userSignedOut fn
  auth ? userSignedIn(auth) : userSignedOut()
})

// when user is signed in call requestCreator function inside services.js
function userSignedIn(auth) {
  // document.querySelector('.app').style.display = 'block'

  if (window.Worker && window.indexedDB) {
    layoutGrid()

    // requestCreator is present inside service.js
    const req = window.indexedDB.open(auth.uid)
    req.onsuccess = function () {
      const db = req.result
      if (Object.keys(db.objectStoreNames).length === 0) {
        setTimeout(function () {
          requestCreator('initializeIDB')
          return void(0)
        }, 300)
      } else {
        const rootTx = db.transaction(['root'], 'readwrite')
        const rootObjectStore = rootTx.objectStore('root')
        rootObjectStore.get(auth.uid).onsuccess = function (event) {
          const record = event.target.result
          record.view = 'list'
          rootObjectStore.put(record)
          rootTx.oncomplete = function () {
            // requestCreator('Null')
            listView()
            // conversation(event.target.result.id)
          }
        }
      }
    }
    return
  }

  firebase.auth().signOut().catch(signOutError)
}

// When user is signed out
function userSignedOut() {
  const login = document.createElement('div')
  login.id = "login-container"
  document.body.innerHTML = login.outerHTML

  // document.querySelector('.app').style.display = 'none'

  const ui = new firebaseui.auth.AuthUI(firebase.auth())

  // DOM element to insert firebaseui login UI
  ui.start('#login-container', firebaseUiConfig())
}

function signOutError(error) {
  // handler error with snackbar
}

function layoutGrid() {
  const layout = document.createElement('div')
  layout.classList.add("mdc-layout-grid", "mdc-typography", "app")

  const layoutInner = document.createElement("div")
  layoutInner.className = 'mdc-layout-grid__inner cell-space'
  
  const headerDiv = document.createElement('div')
  headerDiv.id = "header"
  const currentPanel = document.createElement('div')
  currentPanel.id = "app-current-panel"
  currentPanel.className ='mdc-layout-grid__cell--span-12'

  layoutInner.appendChild(headerDiv)
  layoutInner.appendChild(currentPanel)
  
  // const conversationPanelParent = document.createElement('div')
  // conversationPanelParent.className ='mdc-layout-grid__cell--span-12-mobile app-center-panel'
  // const activityParentPanel = document.createElement('div')
  // activityParentPanel.className ='mdc-layout-grid__cell--span-12-mobile app-right-panel'

  layout.appendChild(layoutInner)
  document.body.innerHTML = layout.outerHTML

}

