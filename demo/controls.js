var controls = {};
//Grid controls
controls.grid = {};
controls.grid.createButtons = function(actions) {
    var actionMap = {
        "show-grid": 'showGrid',
        "show-axes": 'showAxes',
        "show-path": 'showPath',
        "show-points": 'showPoints'
    };
    //need closure to bind variable
    var actionFor = function(domId) {
        return function(){(actions[actionMap[domId]] || function(){})(this.checked);};
    }
    for (var domId in actionMap) {
        document.getElementById(domId).addEventListener("change", actionFor(domId));
    }
};
