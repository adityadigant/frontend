/* eslint-env worker */
// import firebase app script because there is no native support of firebase inside web workers

importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/5.0.4/firebase-auth.js')

// Backend API Url
const apiUrl = 'https://us-central1-growthfilev2-0.cloudfunctions.net/api/'

/** reinitialize the firebase app */

firebase.initializeApp({
  apiKey: 'AIzaSyB0D7Ln4r491ESzGA28rs6oQ_3C6RDeP-s',
  authDomain: 'growthfilev2-0.firebaseapp.com',
  databaseURL: 'https://growthfilev2-0.firebaseio.com',
  projectId: 'growthfilev2-0',
  storageBucket: 'growthfilev2-0.appspot.com'
})

// get Device time
function getTime () {
  return Date.now()
}

// dictionary object with key as the worker's onmessage event data and value as
// function name
const requestFunctionCaller = {
  initializeIDB: initializeIDB

}

// when worker receives the request body from the main thread
self.onmessage = function (event) {
  if (firebase) {
    requestFunctionCaller[event.data.type](event.data.body)
  }
}

// Performs XMLHTTPRequest for the API's.

function http (method, url, data) {
  return new Promise(function (resolve, reject) {
    firebase
      .auth()
      .currentUser
      .getIdToken()
      .then(function (idToken) {
        const xhr = new XMLHttpRequest()

        xhr.open(method, url, true)

        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${idToken}`)

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status > 226) return reject(xhr)

            resolve(JSON.parse(xhr.responseText))
          }
        }

        xhr.send(data || null)
      }).catch(console.log)
  })
}

/**
 * Initialize the indexedDB with database of currently signed in user's uid.
 */
function initializeIDB () {
  // onAuthStateChanged is added because app is reinitialized
  firebase.auth().onAuthStateChanged(function (auth) {
    const request = indexedDB.open(auth.uid, 1)

    request.onupgradeneeded = function () {
      const db = request.result

      const activity = db.createObjectStore('activity', {
        keyPath: 'activityId'
      })

      activity.createIndex('timestamp', 'timestamp')

      const users = db.createObjectStore('users', {
        keyPath: 'mobile'
      })

      const addendum = db.createObjectStore('addendum', {
        autoIncrement: true
      })
      addendum.createIndex('activityId', 'activityId')

      const subscriptions = db.createObjectStore('subscriptions', {
        autoIncrement: true
      })

      subscriptions.createIndex('office', 'office')
      subscriptions.createIndex('template', 'template')

      const calendar = db.createObjectStore('calendar', {
        keyPath: 'date'
      })

      const map = db.createObjectStore('map', {
        keyPath: 'location'
      })

      const attachment = db.createObjectStore('attachment', {
        keyPath: 'activityId'
      })

      attachment.createIndex('template', 'template')
      attachment.createIndex('office', 'office')

      const root = db.createObjectStore('root', {
        keyPath: 'uid'
      })

      // add defaultFromTime value here in order to load it only once
      root.put({
        fromTime: 0,
        uid: auth.uid
      })
    }
    request.onsuccess = function () {
      // when Object stores are created, call the updateIDB() to update the data
      // in IDB
      updateIDB()
    }
  })
}

// helper function to get dates
function getDateRange (startTime, endTime) {
  const dates = []
  let start = new Date(startTime)
  const end = new Date(endTime)

  while (start <= end) {
    dates.push(start.toDateString())
    start = new Date(start.setDate(start.getDate() + 1))
  }

  dates.push(end.toDateString())

  return dates
}

// removes id from activityId array inside map object store
function popIdFromMapStore (db, venueArray, id) {
  const mapObjectStore = db.transaction('map', 'readwrite').objectStore('map')

  venueArray.forEach(function (venue) {
    if (!venue.location) return
    if (!venue.address) return
    if (!venue.geopoint) return

    mapObjectStore.get(venue.location).onsuccess = function (event) {
      const record = event.target.result

      const indexOfActivityId = record.activityId.indexOf(id)

      if (indexOfActivityId > -1) {
        record.activityId.splice(indexOfActivityId, 1)
      }
      mapObjectStore.put(record)
    }
  })
}

// removes id from activityId array inside calendar object store

function popIdFromCalendarStore (db, scheduleArray, id) {
  const calendarObjectStore = db
    .transaction('calendar', 'readwrite')
    .objectStore('calendar')

  let range

  scheduleArray.forEach(function (schedule) {
    if (!schedule.startTime) return
    if (!schedule.endTime) return

    range = getDateRange(schedule.startTime, schedule.endTime)

    range.forEach(function (date) {
      calendarObjectStore.get(date).onsuccess = function (event) {
        const record = event.target.result

        const indexOfActivityId = record.activityId.indexOf(id)

        if (indexOfActivityId > -1) {
          record.activityId.splice(indexOfActivityId, 1)
        }

        calendarObjectStore.put(record)
      }
    })
  })
}

// remove attachment from the attachment object store
function popAttachment (db, attachment, id) {
  const attachmentObjectStore = db
    .transaction('attachment', 'readwrite')
    .objectStore('attachment')

  if (Object.keys(attachment).length === 0) return

  attachmentObjectStore.get(id).onsuccess = function (event) {
    attachmentObjectStore.delete(id)
  }
}

// remove activity from the attachment activity store

function removeActivityFromRootStore (db, id) {
  const removeRequest = db
    .transaction('activity', 'readwrite')
    .objectStore('activity')
    .delete(id)
}

//  if location from venue array in read response matches the location present
//  inside map object then push the activityid inside the activityId array of
//  that record. else create a new record with that location

function pushIdIntoMapStore (db, venueArray, id) {
  const mapObjectStore = db
    .transaction('map', 'readwrite')
    .objectStore('map')

  venueArray.forEach(function (venue) {
    if (!venue.location) return
    if (!venue.address) return
    if (!venue.geopoint) return

    mapObjectStore.get(venue.location).onsuccess = function (event) {
      const record = event.target.result

      if (record) {
        record.activityId.push(id)
        record.activityId = [...new Set(record.activityId)]
        mapObjectStore.put(record)
        return
      }
      mapObjectStore.add({
        activityId: [
          id
        ],
        location: venue.location,
        address: venue.address,
        geopoint: venue.geopoint

      })
    }
  })
}
//  if date between startTime and endTime from schedule array in read response
//  matches the date present inside calendar object store then push the
//  activityid inside the activityId array of that record. else create a new
//  record with that date and activityId

function pushIdIntoCalendarStore (db, scheduleArray, id) {
  scheduleArray.forEach(function (schedule) {
    if (!schedule.startTime) return
    if (!schedule.endTime) return

    const dates = getDateRange(schedule.startTime, schedule.endTime)

    dates.forEach(function (date) {
      const calendarObjectStore = db
        .transaction('calendar', 'readwrite')
        .objectStore('calendar')

      calendarObjectStore.get(date).onsuccess = function (event) {
        const record = event.target.result

        if (record) {
          record.activityId.push(id)
          record.activityId = [...new Set(record.activityId)]
          calendarObjectStore.put(record)
          return
        }

        calendarObjectStore.add({
          date: date,
          activityId: [id]
        })
      }
    })
  })
}

// create attachment record with status,template and office values from activity
// present inside activity object store.

function addAttachment (db, record, activity) {
  if (Object.keys(record.attachment).length) return

  const attachmentObjectStore = db.transaction('attachment', 'readwrite').objectStore('attachment')

  const newAttachment = JSON.parse(JSON.stringify(record.attachment))
  newAttachment['activityId'] = activity.activityId
  newAttachment['status'] = record.status
  newAttachment['template'] = activity.template
  newAttachment['office'] = activity.office

  attachmentObjectStore.add(newAttachment)
}

// if an assugnee's phone number is present inside the users object store then
// return else  call the users api to get the profile info for the number

function writeAssigneeIntoUsers (db, assigneeArray) {
  if (assigneeArray.length === 0) return

  let assigneeString = ''

  // create a basic users api url
  const defaultReadUserString = `${apiUrl}services/users/read?q=`
  // iterate the assignee array and create a string with all the assignee's
  // phone number added into it.

  assigneeArray.forEach(function (assignee) {
    const assigneeFormat = `%2B${assignee}&q=`

    assigneeString += `${assigneeFormat.replace('+', '')}`
  })
  // concat the basic users api url with the assigneeString

  const fullReadUserString = `${defaultReadUserString}${assigneeString}`

  // pass the api string into the http fn and get the profile details of all the
  // assignees
  http(
    'GET',
    fullReadUserString
  )
    .then(function (userProfile) {
      const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')

      Object.keys(userProfile).forEach(function (number) {
        usersObjectStore.get(number).onsuccess = function (event) {
          if (event.target.result) return

          const usersObjectStore = db.transaction('users', 'readwrite').objectStore('users')

          usersObjectStore.add({
            mobile: number,
            photoURL: userProfile[number].photoURL,
            displayName: userProfile[number].displayName,
            lastSignInTime: userProfile[number].lastSignInTime
          })
        }
      })
    }).catch(console.log)
}

// insert activity into activityStore then check each object store's record if
// it consists of that activityId. if it does then push the activityId into the
// activityId array if not then create a new record with that activityId

function insertActivityIntoActivityStore (db, activity) {
  const activityObjectStore = db.transaction('activity', 'readwrite').objectStore('activity')

  activityObjectStore.add(activity)

  activityObjectStore.get(activity.activityId).onsuccess = function (event) {
    const venueArray = event.target.result.venue

    const scheduleArray = event.target.result.schedule

    const assigneeArray = event.target.result.assignees

    pushIdIntoMapStore(db, venueArray, activity.activityId)

    pushIdIntoCalendarStore(db, scheduleArray, activity.activityId)

    addAttachment(
      db,
      event.target.result,
      activity
    )

    writeAssigneeIntoUsers(db, assigneeArray)
  }
}

// if there is no activity present inside activity object store for which it is
// being checked , then insert the activity into the activity store. if it is
// present , then pop all instances of that activityId from all the object
// stores.

function PopIdFromObjectStores (db, activity) {
  const activityObjectStore = db.transaction('activity').objectStore('activity')

  activityObjectStore.get(activity.activityId).onsuccess = function (event) {
    if (!event.target.result) {
      insertActivityIntoActivityStore(db, activity)
      return
    }

    const venueArray = event.target.result.venue
    const scheduleArray = event.target.result.schedule
    const attachmentObject = event.target.result.attachment

    popIdFromMapStore(db, venueArray, activity.activityId)
    popIdFromCalendarStore(db, scheduleArray, activity.activityId)
    popAttachment(db, attachmentObject, attachmentObject.activityId)
    removeActivityFromRootStore(db, activity.activityId)

    insertActivityIntoActivityStore(db, activity)
  }
}

function updateSubscription (db, subscription) {
  const subscriptionObjectStore = db
    .transaction('subscriptions', 'readwrite')
    .objectStore('subscriptions')

  const templateIndex = subscriptionObjectStore.index('template')

  templateIndex.get(subscription.template).onsuccess = function (templateEvent) {
    if (!templateEvent.target.result) {
      subscriptionObjectStore.add(subscription)
      return
    }

    subscriptionObjectStore.openCursor().onsuccess = function (event) {
      const cursor = event.target.result
      if (subscription.office !== cursor.value.office) return
      subscriptionObjectStore.delete(cursor.primaryKey)
    }

    subscriptionObjectStore.add(subscription)
  }
}

// after getting the responseText from the read api , insert addendum into the
// corresponding object store. for each activity present inside the activities
// array in response perform the pop/put operation. for each template present
// inside the templates array in response perform the updat subscription logic.
// after every operation is done, update the root object sotre's from time value
// with the uptoTime received from response.

function successResponse (response) {
  const user = firebase.auth().currentUser
  const IDB_VERSION = 1

  const request = indexedDB.open(user.uid, IDB_VERSION)

  request.onsuccess = function () {
    const db = request.result
    const addendumObjectStore = db.transaction('addendum', 'readwrite').objectStore('addendum')
    const rootObjectStore = db.transaction('root', 'readwrite').objectStore('root')

    response.addendum.forEach(function (addendum) {
      addendumObjectStore.add(addendum)
    })

    response.activities.forEach(function (activity) {
      PopIdFromObjectStores(db, activity)
    })

    response.templates.forEach(function (subscription) {
      updateSubscription(db, subscription)
    })

    rootObjectStore.put({
      fromTime: Date.parse(new Date(response.upto)),
      uid: user.uid
    })

    // after the above operations are done , send a response message back to the requestCreator(main thread).
    const responseObject = {
      success: true,
      msg: 'IDB updated successfully',
      value: user.uid
    }

    self.postMessage(responseObject)
  }
}

function updateIDB () {
  const user = firebase.auth().currentUser

  const IDB_VERSION = 1

  const req = indexedDB.open(user.uid, IDB_VERSION)

  req.onsuccess = function () {
    const db = req.result
    // open root object store to read fromTime value.
    const rootObjectStore = db.transaction('root', 'readonly').objectStore('root')

    rootObjectStore.get(user.uid).onsuccess = function (root) {
      http(

        'GET',
        `${apiUrl}read?from=${root.target.result.fromTime}`

      )
        .then(function (response) {
          console.log(response)
          // adds template if template array is empty. FOR TESTING ONLY
          if (response.templates.length === 0) {
            response.templates.push({
              attachment: {},
              office: 'personal',
              schedule: ['where'],
              template: 'plan',
              venue: ['when']
            })
          }
          successResponse(response)
        })
        .catch(console.log)
    }
  }
}
