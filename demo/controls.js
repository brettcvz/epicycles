//GridControlsUI
//ExampleControlsUI
function ExampleControlsUI(controller, examples, defaultExample) {
    this.controller = controller;
    this.examples = examples;
    this.defaultExample = defaultExample;
}

ExampleControlsUI.prototype.render = function(){
    var p = document.createElement("p");
    var l = document.createElement("l");
    l.innerText = "Pick an Example: ";
    p.appendChild(l);

    var exampleSelect = document.createElement("select");
    var ui = this;

    exampleSelect.addEventListener("change", function(){
        var code = ui.examples[exampleSelect.value];
        if (code) {
            ui.controller.loadPointsFromCode(code);
        }
    });

    /*exampleSelect.options[0] = new Option("Custom", "Custom");
    var i = 1;
    */
    var i = 0;
    for (var name in this.examples) {
        exampleSelect.options[i++] = new Option(name, name);
        if (name == this.defaultExample) {
            exampleSelect.selectedIndex = exampleSelect.options.length - 1;
        }
    }
    p.appendChild(exampleSelect);
    return p;
};

function GridControlsUI(controller, displayConfig) {
    this.controller = controller;
    this.displayConfig = displayConfig;
}

GridControlsUI.prototype.controlsMapping = { 
    "show-grid": "showGrid",
    "show-axes": "showAxes",
    "show-points": "showPoints",
    "show-path": "showPath",
    "show-disks": "showDisks",
};
GridControlsUI.prototype.labelsMapping = { 
    "show-grid": "Show Grid",
    "show-axes": "Show Axes",
    "show-points": "Show Points",
    "show-path": "Show Path",
    "show-disks": "Show Disks",
};

GridControlsUI.prototype.showGrid = function(show){
    this.controller.grid.showGrid = show;
};

GridControlsUI.prototype.showAxes = function(show){
    this.controller.grid.showAxes = show;
};

GridControlsUI.prototype.showPath = function(show){
    this.controller.sim.showPath = show;
};

GridControlsUI.prototype.showDisks = function(show){
    this.controller.sim.showDisks = show;
};

GridControlsUI.prototype.showPoints = function(show){
    this.controller.showPoints = show;
};

GridControlsUI.prototype.render = function(){
    var container = document.createElement("div");

    var checkboxes = document.createElement("div");
    checkboxes.className = "checkbox-controls";
    var actionFor = function(ui, domId) {
        var fnName = ui.controlsMapping[domId];
        var action = ui[fnName] || function(){};
        return function(){action.call(ui, this.checked);};
    }

    for (var prop in this.controlsMapping) {
        //need closure to bind prop variable
        checkboxes.appendChild(this.renderCheckbox(prop, actionFor(this, prop)));
    }
    container.appendChild(checkboxes);

    container.appendChild(this.renderDiskSelect());
    return container;
};

GridControlsUI.prototype.renderCheckbox = function(prop, onChange){
    var id = this.displayConfig.name + "-" + prop;
    var p = document.createElement("p");
    var l = document.createElement("label");

    l.setAttribute("for", id);
    l.innerText = this.labelsMapping[prop];
    var i = document.createElement("input");
    i.setAttribute("type", "checkbox");
    i.id = id;

    if (this.displayConfig[this.controlsMapping[prop]]) {
        i.setAttribute("checked", "checked");
    }

    i.addEventListener("change", onChange);

    p.appendChild(l);
    p.appendChild(i);
    return p;
};

GridControlsUI.prototype.renderDiskSelect = function(){
    var p = document.createElement("p");
    var l = document.createElement("l");
    l.innerText = "Maximum number of disks:";
    p.appendChild(l);

    //TODO: update gear select when # of points change
    var gearSelect = document.createElement("select");
    var defaultSelection = this.displayConfig.points.length;
    for (var i = 1; i <= this.displayConfig.points.length; i++) {
        var option = document.createElement("option");
        option.innerText = i;
        option.value = i;
        if (i == defaultSelection) {
            option.setAttribute("selected", "selected");
        }
        gearSelect.appendChild(option);
    }

    var ui = this;
    gearSelect.addEventListener("change", function(){
        ui.controller.numberOfGears = parseInt(gearSelect.value, 10);
        ui.controller.refreshSim();
    });
    p.appendChild(gearSelect);
    return p;
};
