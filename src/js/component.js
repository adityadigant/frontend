function createElement(tagName, attrs) {
    const el = document.createElement(tagName)
    Object.keys(attrs).forEach(function (attr) {
        el[attr] = attrs[attr]
    })
    return el;
}

function InputField() {}
InputField.prototype.base = function () {
    return createElement('div', {
        className: 'mdc-text-field filled-background data--value-list mdc-text-field--fullwidth',
    });
}
InputField.prototype.input = function () {
    return createElement('input', {
        className: 'mdc-text-field__input'
    });
}
InputField.prototype.ripple = function () {
    return createElement('div', {
        className: 'mdc-line-ripple'
    })
}
InputField.prototype.label = function(){
    return createElement('label',{className:'mdc-floating-label'})
}
InputField.prototype.withoutLabel = function () {
    const field = this.base();
    const input = this.input();
    field.appendChild(input);
    field.appendChild(this.ripple())
    return new mdc.textField.MDCTextField(field)
}
InputField.prototype.withLabel = function () {
    const field = this.base();
    const input = this.input();
    field.appendChild(input);
    field.appendChild(this.label())
    field.appendChild(this.ripple())
    return new mdc.textField.MDCTextField(field)
}

function textAreaField(attrs) {
    const textArea = createElement('textarea', {
        className: 'text-area-basic mdc-text-field__input',
        rows: attrs.rows
    })
    textArea.value = attrs.value
    if (!attrs.readonly) {
        textArea.setAttribute('readonly', 'true');
    }
    return textArea
}

function selectMenu(attr) {
    const div = createElement('div', {
        className: 'mdc-select data--value-list'
    })
    div.id = attr.id
    const select = createElement('select', {
        className: 'mdc-select__native-control'
    })

    for (var i = 0; i < attr.data.length; i++) {
        select.appendChild(createElement('option', {
            textContent: attr.data[i],
            vale: attr.data[i]
        }));
    }
    const label = createElement('label', {
        className: 'mdc-floating-label'
    })
    label.textContent = ''
    div.appendChild(label)
    div.appendChild(select)
    const rippleField =  new InputField();
    div.appendChild(rippleField.ripple())
    return new mdc.select.MDCSelect(div)
}

function notchedOultine() {
    const outline = createElement('div', {
        className: 'mdc-notched-outline'
    })
    const leading = createElement('div', {
        className: 'mdc-notched-outline__leading'
    })
    const trialing = createElement('div', {
        className: 'mdc-notched-outline__trailing'
    })
    outline.appendChild(leading)
    outline.appendChild(trialing)
    return outline
}
function Button(name){
    this.name = name
    var button = createElement('button',{className:'mdc-button'})
    button.appendChild(createElement('span',{className:'mdc-button__label',textContent:this.name}))
    this.base = button;
}
Button.prototype.getButton = function(){
    return new mdc.ripple.MDCRipple(this.base)
}
Button.prototype.disabled = function(value){
    this.base.disabled = value
}
Button.prototype.raised = function(){
    this.base.classList.add('mdc-button--raised');
}
Button.prototype.shaped = function(){
    this.base.classList.add('shaped')
}
Button.prototype.selectorButton = function(){
    this.base.classList.add('selector-send','selector-submit--button')
}

function Fab(name){
    this.fabName = name
    var button = createElement('button',{className:'mdc-fab'})
    this.span = createElement('span',{className:'mdc-fab__icon material-icons',textContent:this.fabName})
    button.appendChild(this.span)
    this.base = button;
}
Fab.prototype =  Object.create(new Button())
Fab.prototype.extended = function(labelName){
    this.base.classList.add('mdc-fab-extended')
    const label = createElement('label',{className:'mdc-fab__label',textContent:labelName})
    this.base.appendChild(label);
}

function AppendMap(location, el) {
    this.location = location
    this.options = {
        zoom: 16,
        center: this.location,
        disableDefaultUI: true,
    };
    this.map = new google.maps.Map(el, this.options);
}
AppendMap.prototype.withCustomControl = function () {
    var customControlDiv = document.createElement('div');
    var customControl = new MapsCustomControl(customControlDiv, map, this.location.lat, this.location.lng);
    customControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(customControlDiv);
}
AppendMap.prototype.getMarker = function (extras) {
    var markerConfig = {
        position: this.location,
        map: this.map,
    }
    Object.keys(extras).forEach(function (extra) {
        markerConfig[extra] = extras[extra]
    })
    return new google.maps.Marker(markerConfig);
}

function ImageComponent(){

}