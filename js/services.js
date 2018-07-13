function iconEditable () {

}

function getInputText (selector) {
  return mdc.textField.MDCTextField.attachTo(document.getElementById(selector))
}

function inputSelect () {

}

function inputTime () {

}

function inputFile (selector) {
  return document.getElementById(selector)
}

function requestCreator (requestType, requestBody) {
  // A request generator body with type of request to perform and the body/data to send to the api handler.
  // getGeoLocation method will be added later
  const requestGenerator = {
    type: requestType,
    body: requestBody
  }

  // spawn a new worker called apiHandler.

  const apiHandler = new Worker('js/apiHandler.js')

  // post the requestGenerator object to the apiHandler to perform IDB and api
  // operations

  apiHandler.postMessage(requestGenerator)

  // handle the response from apiHandler when operation is completed

  apiHandler.onmessage = onSuccessMessage
  apiHandler.onerror = onErrorMessage
}

function onSuccessMessage (response) {
  const IDB_VERSION = 1

  console.log(response)

  const req = window.indexedDB.open(response.data.value)

  console.log(req)

  req.onsuccess = function () {

  }
}

function onErrorMessage (error) {
  console.log(error)
  console.table({
    'line-number': error.lineno,
    'error': error.message,
    'file': error.filename
  })
}
