function reportView() {
  const backIcon = `<a class='mdc-top-app-bar__navigation-icon'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></a>`
  const header = getHeader('app-header', backIcon, '');

  document.getElementById('tabs').innerHTML = showTabs()
  const tabList = new mdc.tabBar.MDCTabBar(document.querySelector('#tabs .mdc-tab-bar'))
  setTimeout(function () {
    tabList.activateTab(0);
  }, 0)

  tabList.listen('MDCTabBar:activated', function (evt) {
    document.getElementById('app-current-panel').innerHTML = `<div class='tabs-section pt-20 mdc-top-app-bar--fixed-adjust-with-tabs'>
    <div class='content'>
    </div>
    </div>`
    const sectionContent = document.querySelector('.tabs-section .content');
    if (!evt.detail.index) {

      getSubscription(ApplicationState.office, 'leave').then(function (result) {
        console.log(result);
        sectionContent.innerHTML = templateList(result);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)
      }).catch(console.log)
      return
    }
    if (evt.detail.index == 1) {


      getSubscription(ApplicationState.office, 'expense claim').then(function (result) {
        if (!result.length) {
          sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You Cannot Apply For Expense Claim</h3>'
          return
        }
        sectionContent.innerHTML = templateList(result);
        const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
        handleTemplateListClick(listInit)

      })
      return;
    }
    const promiseArray = []
    const incentives = ['customer', 'order', 'collection']
    incentives.forEach(function (name) {
      promiseArray.push(getSubscription(ApplicationState.office, name))
    });

    Promise.all(promiseArray).then(function (incentiveSubs) {
      console.log(incentiveSubs);

      const subs = incentiveSubs.filter(function (item) {
        return item.length > 0
      });

      if (!subs.length) {
        sectionContent.innerHTML = '<h3 class="info-text mdc-typography--headline4 mdc-theme--secondary">You are not eligible for incentives</h3>'
        return
      }
      const merged = [].concat.apply([], subs)
      sectionContent.innerHTML = templateList(merged);

      const listInit = new mdc.list.MDCList(document.getElementById('suggested-list'))
      handleTemplateListClick(listInit)

    }).catch(console.log)
  })

}





function showTabs() {



  return `<div class="mdc-tab-bar" role="tablist">
    <div class="mdc-tab-scroller">
      <div class="mdc-tab-scroller__scroll-area">
        <div class="mdc-tab-scroller__scroll-content">
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
            <span class="mdc-tab__content">
              <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">fingerprint</span>
              <span class="mdc-tab__text-label mdc-theme--on-primary">Attendence</span>
            </span>
            <span class="mdc-tab-indicator">
              <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
            </span>
            <span class="mdc-tab__ripple"></span>
          </button>
          <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
          <span class="mdc-tab__content">
            <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">assignment</span>
            <span class="mdc-tab__text-label mdc-theme--on-primary">Reimbursement</span>
          </span>
          <span class="mdc-tab-indicator">
            <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
          </span>
          <span class="mdc-tab__ripple"></span>
        </button>
        <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
        <span class="mdc-tab__content">
        <span class="mdc-tab__icon material-icons mdc-theme--on-primary" aria-hidden="true">payment</span>

          <span class="mdc-tab__text-label mdc-theme--on-primary">Incentives</span>
        </span>
        <span class="mdc-tab-indicator">
          <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
        </span>
        <span class="mdc-tab__ripple"></span>
      </button>
   
        </div>
      </div>
    </div>
  </div>`
}