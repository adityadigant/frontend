function jobView() {
    const parent = document.getElementById('app-current-panel')
    parent.innerHTML = ''
 
    const oldJob = JSON.parse(localStorage.getItem('duty'));
    if (newJob) {
        showPreviousJobPopUp(oldJob)
        return
    }
    parent.appendChild(constructJoBView(oldJob));
}

function showPreviousJobPopUp(oldJo) {
    const heading = createElement('div', {
        className: 'mdc-typography--headline5',
        textContent: 'Your last job is not finished. Please finish or skip it now'
    })
    getTimelineAddendum(oldJob.geopoint).then(function(addendums){
        return getTimelineActivityData(addendums,oldJob.geopoint)
    }).then(function(timelineData){
        const dialog = new Dialog(heading, constructJoBView(timelineData), 'job-popup').create('simple');
        dialog.open();
        //dialog button click;
        //new job start
        
        //skip
    
    });

    

}

function getOldLocation() {
    return JSON.parse(localStorage.getItem('ApplicationState')).location
}

function getDutyCoordinates(location) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('map');
        const store = tx.objectStore('map');
        let record;
        store.index('location').get(location).onsuccess = function (evt) {
            record = evt.target.result;
        }
        tx.oncomplete = function () {
            resolve(record)
        }
    })
}

function getSupervisorContact(phoneNumber) {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction('users');
        const store = tx.objectStore('users');

        store.get(phoneNumber).onsuccess = function (evt) {
            record = evt.target.result;
        }
        tx.oncomplete = function () {
            resolve(record)
        }
    })
}

function showUpcomingDuty(duty, currentGeopoint) {

    const cont = createElement("div", {
        className: 'duty-pop--container'
    })
    const heading = createElement('div', {
        className: 'inline-flex'
    })
    const reject = createElement("button", {
        className: 'mdc-theme--error',
        textContent: 'Reject',
        style: 'margin-left:auto'
    })
    const close = createElement('i', {
        className: 'material-icons',
        textContent: 'close'
    })
    heading.appendChild(reject)
    heading.appendChild(close)

    const details = createElement('div', {
        className: 'duty-popup--details'
    })
    details.innerHTML = `
    <div class='details'>
        <span>
            <i class='material-icons'>bike</i>
            <span>${calculateDistanceBetweenTwoPoints(duty.dutyGeopoint,currentGeopoint)}</span>
        </span>
        <hr>
        <div class='customer'>
            ${duty.attachment['Duty Type'].value ?`<span>
                <i class='material-icons'>assignment</i>
                <span>${duty.attachment['Duty Type'].value} </span>
            </span>` :''}
            <span>
                <i class='material-icons'>location_on</i>
                <span>${duty.attachment.Location.value} </span>
             </span>
        </div>
        <hr>
        <div class='supervisior'>
            <ul class='mdc-list mdc-list--two-line mdc-list--avatar-list'>
                <li class='mdc-list-item'>
                    <span class='mdc-list-item__graphic'>
                        <img src='${duty.supervisior.photoURL || './img/empty-user.jpg'}'>
                        <span class='mdc-list-item__text'>
                            <span class='mdc-list-item__primary-text'>${duty.supervisior.displayName}</span>
                            <span class='mdc-list-item__secondary-text'>Customer</span>
                        </span>
                    </span>
                </li>
            </ul>
            <span>
                <i class='material-icons'>time</i>
                <span>${moment(duty.schedule[0].startTime).format('hh:mm A')} To ${moment(duty.schedule[0].endTime).format('hh:mm A')} </span>
            </span>
            <hr>
        </div>
        <div class='staff'>
            <span>
                <i class='material-icons'>people_add</i>
                <span>Staff</span>
            </span>
            <div class='mdc-chip-set'>
                ${duty.assigness.map(function(contact,index){
                    const image = createElement('img', {
                        className: 'mdc-chip__icon mdc-chip__icon--leading',
                        src: contact.photoURL || './img/empty-user.jpg'
                    })
                    returncreateDynamicChips(contact.displayName || contact.mobile, index, image).outerHTML;
                }).join("")}
            </div>
        </div>
        <hr>
        <div class='products'>
            <span>
                <i class='material-icons'>settings</i>
                <span>Products</span>
            </span>
            <ul class='mdc-list mdc-list--two-line'>
            ${duty.attachment.Products.value.map(function(product){
                return `<li class='mdc-list-item'>
                    <span class='mdc-list-item__text'>
                        <span class='mdc-list-item__primary-text'>${product.name}</span>
                        <span class='mdc-list-item__secondary-text'>Quantity : ${product.quanity}</span>
                    </span>
                    <span class='mdc-list-item__meta'>${convertNumberToInr(Number(product.rate))}</span>
                </li>`

            })}
            </ul>
        </div>
    </div>
    <div class='navigate'>
        ${createExtendedFab('navigation','Navigate','navigate').outerHTML}
    </div>
    `
    cont.appendChild(heading)
    cont.appendChild(details)

    const dialog = new Dialog('', cont, 'duty-dialog').create('simple')
    dialog.open();
}




function constructJoBView(timelineData) {

        const el = createElement('div', {
            className: 'mdc-layout-grid'
        })
        el.innerHTML = `
            <div class='duty-container'>
            ${duty ? `<div class='mdc-card duty-overview'>
                <div class='duty-details'>
    
                
                    <div class='products'></div>
                    <div class='expand'></div>
                </div>
    
            </div>` :''}
                
                <div class='mdc-card timeline-overview'>
                    <div class='timeline set-size charts-container'>
                        <div class="pie-wrapper progress-45 style-2" id='pie'>
                           
                            <div class="pie">
                                <div class="left-side half-circle"></div>
                                <div class="right-side half-circle"></div>
                            </div>
                            <div class="shadow"></div>
                        </div>
                    </div>
                    ${createExtendedFab('add_a_photo','Take a photo','take-job-photo').outerHTML}
                  
                </div>
            </div>`
    
        const photoBtn = el.querySelector('#take-job-photo');
        photoBtn.addEventListener('click', function () {
            history.pushState(['cameraView'], null, null)
            openCamera()
        });
        el.querySelector('#pie').addEventListener('click',function(){
            createTimeLapse(timelineData)
        })
    

    return el;
}


function getTimelineAddendum(geopoint) {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('addendum');
        const store = tx.objectStore('addendum');

        const result = []
        //const bound = IDBKeyRange.bound(moment().startOf('day').valueOf(),moment().endOf('day').valueOf())
        // const bound = IDBKeyRange.bound(1565549625746, 1580385787130)
        store.index('timestamp').openCursor(bound).onsuccess = function (evt) {
            const cursor = evt.target.value;
            if (!cursor) return;
            if (isLocationMoreThanThreshold(calculateDistanceBetweenTwoPoints(cursor.value.geopoint, geopoint))) {
                cursor.continue();
                return
            }
            result.push(cursor.value)
            cursor.continue();
        }
        tx.oncomplete = function () {
            const sorted = result.reduce(function (first, second) {
                return first.timestamp - second.timestamp
            })
            resolve(sorted)
        }
    })
}


function getTimelineActivityData(addendums) {
    return new Promise(function (resolve, reject) {


        const tx = db.transaction('activity');
        const store = tx.objectStore('activity');
        const filteredResult = [];
        const dutyTemplates = {
            'duty': true,
            'customer': true,
            'check-in': true,
            'product': true,
            'employee': true,
            'duty-type': true
        }
        addendums.forEach(function (addendum) {
            store.get(addendum.activityId).onsuccess = function (evt) {
                const record = evt.target.result;
                if (!record) return;
                if (dutyTemplates[record.template]) {
                    record.geopoint = addendum.geopoint
                    filteredResult.push(record);
                }
            }
        })
        tx.oncomplete = function () {
            resolve(filteredResult)
        }
    })
}



function createTimeLapse(timelineData) {

    const timeLine = createElement('div', {
        className: 'timeline'
    })
    const historyCont = createElement('div', {
        className: 'history-tl-container'
    })

    const ul = createElement('ul', {
        className: 'tl'
    })
    let firstActivityTimestamp = timelineData[0].timestamp
    let lastActivityTimestamp = timelineData[timelineData.length - 1].timestamp;
    let totalCheckins = 0;
    let totalPhotoCheckins = 0;

    timelineData.forEach(function (activity) {
        if (activity.template === 'check-in') {
            totalCheckins++
            if (activity.attachment.Photo.value) {
                totalPhotoCheckins++
            }
        }
        ul.appendChild(createTimelineLi(activity))
    })


    const timelineDuration = moment.duration(moment(lastActivityTimestamp).diff(moment(firstActivityTimestamp)))
    console.log(timelineDuration)
    const screen = createElement('div', {
        className: 'timeline--container',
    })
    screen.innerHTML = `
        <div class='timeline--header'>
            <h3 class='mdc-typography--headline5 mdc-theme--primary mb-0 mt-10'>
                ${timelineDuration._data.hours} Hours ${timelineDuration._data.minutes} Minutes worked
            </h3>
            ${totalCheckins ? 
                `<ul class='mdc-list'>
                    ${totalCheckins ? 
                        `<li class='mdc-list-item  pl-0 pr-0 mdc-typography--headline6'>
                            <span class='mdc-list-item__graphic material-icons mdc-theme--primary'>check_circle</span>
                                ${totalCheckins} Check-Ins
                        </li>` 
                    :''}
                    ${totalPhotoCheckins  ? 
                        `<li class='mdc-list-item pl-0 pr-0 mdc-typography--headline6'>
                                <span class='mdc-list-item__graphic material-icons'>done</span>
                                ${totalPhotoCheckins} Photos uploaded
                        </li>`
                    :''}
                </ul>`
                : '' } 
        </div>
        `

    if (totalCheckins) {
        // ul.style.paddingTop = '80px';
    }
    if (timelineDuration.asMilliseconds()) {
        historyCont.appendChild(ul);
    } else {
        const emptyCont = createElement('div', {
            className: 'width-100 veritical-horizontal-center'
        })
        historyCont.classList.add('empty-list')

        emptyCont.appendChild(createElement('img', {
            src: './img/empty-list.svg',
            className: 'svg-list-empty'
        }))
        emptyCont.appendChild(createElement('p', {
            className: 'text-center  mdc-typography--headline5',
            textContent: 'No details found'
        }))

        historyCont.appendChild(emptyCont)
    }
    timeLine.appendChild(historyCont);

    document.getElementById('app-current-panel').innerHTML = '';
    screen.appendChild(timeLine);
    const bottomContainer = createElement('div', {
        className: 'timeline--footer'
    })

    const close = createButton('close')
    close.classList.add("mdc-button--raised");
    close.addEventListener('click', function () {
        history.back();
    })
    bottomContainer.appendChild(close);
    screen.appendChild(bottomContainer)

    document.getElementById('app-current-panel').appendChild(screen);

}




function createTimelineLi(activity) {
    const li = createElement("li", {
        className: 'tl-item ' + activity.template
    })
    li.dataset.activity = JSON.stringify(activity);

    const div = createElement('div', {
        className: 'item-title',
        textContent: mapTemplateNameToTimelineEvent(activity)
    })
    const span = createElement('span', {
        className: 'event-time mdc-typography--caption',
        textContent: moment(activity.timestamp).format('hh:mm A')
    })
    li.addEventListener('click', function () {
        const activity = JSON.parse(li.dataset.activity)
        const heading = createActivityHeading(activity)
        showViewDialog(heading, activity, 'view-form')
    })
    li.appendChild(div);
    li.appendChild(span);
    return li
}

function mapTemplateNameToTimelineEvent(activity) {
    if (activity.template === 'check-in') {
        if (activity.attachment.Photo.value) return 'Uploaded photo'
        return 'Check-In'
    }
    if (activity.template === 'Customer') {
        return "Reached customer's location";
    }
    if (activity.template === 'leave') {
        return "On leave"
    }
    return 'Created ' + activity.template;
}

function checkForDuty(duty) {

    Promise.all([getDutyCoordinates(duty.attachment.Location.value), getSupervisorContact(duty.attachment.Supervisor.value)]).then(function (response) {
        let dutyGeopoint;
        if (response[0]) {
            dutyGeopoint = {
                latitude: response[0].latitude,
                longitude: response[0].longitude
            }
        }
        duty.dutyGeopoint = dutyGeopoint;
        duty.supervisiorContact = response[1]
        showUpcomingDuty(duty, ApplicationState.location)
    })
}

function getFirstActivity()

function getTimelineProgressBarValue() {

}