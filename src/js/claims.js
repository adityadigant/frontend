function expenseView(sectionContent) {
    sectionContent.innerHTML = reimDom();
    sectionContent.dataset.view = 'reimbursements'
    getSubscription('', 'claim').then(function (subs) {
        if (!subs.length) return;
        document.getElementById('reim-view').appendChild(createTemplateButton(subs))
    }).catch(function (error) {
        console.log(error)
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
                error: error
            }
        })
    })

    getReimMonthlyData().then(function (reimbursementData) {
        console.log(reimbursementData)
        const parent = document.getElementById('reimbursement-cards')
        const keys = Object.keys(reimbursementData);
        if (!keys.length) {
            parent.innerHTML = `<h5 class='mdc-typography--headline5 mdc-layout-grid__cell--span-12 text-center'>No reimbursements found</h5>`
            return;
        }

        let month = monthlyString = '';
        keys.forEach(function (key) {
            const timestamp = Number(key)
            if (month !== new Date(timestamp).getMonth()) {
                monthlyString += `<div class="hr-sect hr-sect mdc-theme--primary mdc-typography--headline5 mdc-layout-grid__cell--span-12-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet">${moment(`${new Date(timestamp).getMonth() + 1}-${new Date(timestamp).getFullYear()}`,'MM-YYYY').format('MMMM YYYY')}</div>`;
            };
            month = new Date(timestamp).getMonth();
            const offices = Object.keys(reimbursementData[key]);
            offices.forEach(function (office) {
                monthlyString += reimbursementCard(timestamp, office, reimbursementData);
            })
        });
        if (!parent) return
        parent.innerHTML = monthlyString;
        toggleReportCard('.reim-card');

        [].map.call(document.querySelectorAll(`[data-claimId]`), function (el) {
            el.addEventListener('click', function () {
                const id = el.dataset.claimId;
                db.transaction('activity').objectStore('activity').get(id).onsuccess = function (event) {
                    const activity = event.target.result;
                    if (activity) {
                        const heading = createActivityHeading(activity)
                        showViewDialog(heading, activity, 'view-form');
                    }
                }
            })
        });

        [].map.call(document.querySelectorAll(`[data-claimdata]`), function (el) {
            el.addEventListener('click', function () {
                const data = JSON.parse(el.dataset.claimdata);
                const dialog = new Dialog(claimViewHeading(data), claimViewContent(data), 'claim-dialog').create('simple')
                dialog.open();
            })
        })
    }).catch(function (error) {
        handleError({
            message: error.message,
            body: {
                stack: error.stack || '',
            }
        })
    })
}

function claimViewHeading(data) {
    return `${data.reimbursementType}
    <p class="mdc-typography mdc-typography--subtitle2 mt-0 mb-0">${data.reimbursementName}</span>
    <div class='card-time mdc-typography--subtitle1'>Created On ${formatCreatedTime(data.details.checkInTimestamp)}</p>
    `
}

function claimViewContent(data) {
    return `<div class=claim-view'> 
        ${data.amount ? `Amount : ${convertAmountToCurrency(Number(data.amount),data.currency)}` : ''}
        ${data.details.status ? `<h3 class='mdc-typography--body1 info-heading mt-0'>
           Status : ${data.details.status} 
        </h3>` : ''}
        ${data.details.rate ? `<h3 class='mdc-typography--body1 info-heading'>
            Rate : ${data.details.rate} 
        </h3>` : ''}
        ${data.details.distanceTravelled ? `<h3 class='mdc-typography--body1 info-heading'>
            Distance travelled : ${data.details.distanceTravelled} KM
        </h3>` :''}
        ${data.details.photoURL  ? `<div class='photo-container'>
            <img src='${data.details.photoURL}'>
        </div>` :''}
    </div>`
}


function reimbursementCard(timestamp, office, data) {
    return `<div class='mdc-card report-card mdc-card--outlined reim-card mdc-layout-grid__cell--span-6-desktop mdc-layout-grid__cell--span-4-phone mdc-layout-grid__cell--span-8-tablet'>
    <div class='mdc-card__primary-action'>
      <div class="demo-card__primary">
      <div class='left'>
          <div class="month-date-cont">
            <div class="day">${cardDate({
                date:new Date(timestamp).getDate(),
                month:new Date(timestamp).getMonth(),
                year:new Date(timestamp).getFullYear()
            })}</div>
            <div class="date">${new Date(timestamp).getDate()}</div>
          </div>
          <div class="heading-container">
            <span class="demo-card__title mdc-typography">${calculateTotalReim(data[timestamp][office])}</span>
            <h3 class="demo-card__subtitle mdc-typography mdc-typography--subtitle2 mb-0 card-office-title">${office}</h3>
          </div>
      </div>
      <div class='right'>
        <div class="dropdown-container dropdown">
          <i class="material-icons">keyboard_arrow_down</i>
        </div>
      </div>
      </div>
      <div class='detail-container hidden'>
      <div class='text-container'></div>
      <div class='amount-container'>
        ${data[timestamp][office].map(function(value){
            return `
                <div class='amount mdc-typography--headline6 ${value.details.status === 'CANCELLED' ? 'mdc-theme--error' : value.details.status === 'CONFIRMED' ? 'mdc-theme--success' : ''}' ${value.details.claimId ? `data-claim-id="${value.details.claimId}"` :`data-claimData='${JSON.stringify(value)}'`}>
                    <div class='mdc-typography--caption'>${value.reimbursementType}</div>
                    ${value.details.status === 'CANCELLED' ? 0 : convertAmountToCurrency(value.amount,value.currency)}
                    <div class='mdc-typography--caption'>${value.details.status}</div>
                    <div class='mdc-typography--subtitle2'>${value.reimbursementName}</div>
                </div>
            `
        }).join("")}
        </div>
      </div>
      </div>
    </div>
</div>`
}

function calculateTotalReim(data) {
    let total = 0;
    let currency = ''

    data.forEach(function (value) {

        if (value.details.status !== 'CANCELLED') {
            total += Number(value.amount)
            currency = value.currency
        }
    })
    return convertAmountToCurrency(total, currency)
}



function convertAmountToCurrency(amount, currency) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR'
    }).format(amount)
}



function reimDom() {
    return `<div class='reim-section' id='reim-view'>
        <div id='reimbursement-cards' class='mdc-layout-grid__inner'></div>
    `
}

function getReimMonthlyData() {
    return new Promise(function (resolve, reject) {

        const tx = db.transaction('reimbursement')
        const index = tx.objectStore('reimbursement').index('month')

        const dateObject = {}
        index.openCursor(null, 'prev').onsuccess = function (event) {
            const cursor = event.target.result;
            if (!cursor) return;
            const officeObject = {}
            if (!dateObject[cursor.value.key]) {
                officeObject[cursor.value.office] = [cursor.value]
                dateObject[cursor.value.key] = officeObject;
                cursor.continue();
                return
            }
            if (dateObject[cursor.value.key][cursor.value.office]) {
                dateObject[cursor.value.key][cursor.value.office].push(cursor.value)
            } else {
                dateObject[cursor.value.key][cursor.value.office] = [cursor.value]
            }

            cursor.continue();
        }
        tx.oncomplete = function () {
            // Object.key(dateObject).forEach(function(k) {
            //     new Date(console.log(k))
            // })
            return resolve(dateObject)
        }
        tx.onerror = function () {
            return reject(tx.error)
        }
    })
}