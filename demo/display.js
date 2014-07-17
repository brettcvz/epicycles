/*Renders the epicycle grid, simulator, and controls based on a div element like:
<div class="example epicycle-display" id="circle" data-points="600000400000"
    data-simulator-controls="true" data-grid-controls="true" data-show-grid="false" data-show-points="false">
</div>
*/
function GridDisplay(config) {
    var config = config || {};
    this.rendered = false;

    var getDefault = function(obj, base, param, fallback) {
        obj[param] = base[param] !== undefined ? base[param] : fallback;
    }

    this.config = {};
    getDefault(this.config, config, "name", "default");
    getDefault(this.config, config, "points", []);
    getDefault(this.config, config, "showGridControls", true);
    getDefault(this.config, config, "showSimulatorControls", true);
    getDefault(this.config, config, "showGrid", true);
    getDefault(this.config, config, "showAxes", true);
    getDefault(this.config, config, "showPoints", true);
    getDefault(this.config, config, "showPath", true);
    getDefault(this.config, config, "editable", true);
    getDefault(this.config, config, "autoplay", true);
    getDefault(this.config, config, "width", 600);
    getDefault(this.config, config, "height", 500);
    getDefault(this.config, config, "numGears", 10);
    getDefault(this.config, config, "scale", 70);
}

GridDisplay.prototype.loadAndRenderInto = function(elem) {
    this.load(elem);
    elem.appendChild(this.render());
};

GridDisplay.prototype.load = function(elem) {
    var mapping = {
        "grid-controls": "showGridControls",
        "simulator-controls": "showSimulatorControls",
        "show-grid": "showGrid",
        "show-axes": "showAxes",
        "show-points": "showPoints",
        "show-path": "showPath",
        "editable": "editable",
        "autoplay": "autoplay",
        "name": "name",
        "width": "width",
        "height": "height",
        "num-gears": "numGears",
        "scale": "scale",
    }
    var config = this.config;

    var loadAttribute = function(attr) {
        var lookup = "data-" + attr;
        if (elem.hasAttribute(lookup)) {
            //mutate in place
            config[mapping[attr]] = elem.getAttribute(lookup);
        }
    };

    var loadBooleanAttribute = function(attr) {
        var lookup = "data-" + attr;
        if (elem.hasAttribute(lookup)) {
            //mutate in place
            config[mapping[attr]] = elem.getAttribute(lookup) === "true";
        }
    };

    for (var attr in mapping) {
        loadBooleanAttribute(attr);
    }

    loadAttribute("name");
    loadAttribute("width");
    loadAttribute("height");
    loadAttribute("num-gears");
    loadAttribute("scale");

    if (elem.hasAttribute("data-points")) {
        this.config.points = this.parsePoints(elem.getAttribute("data-points"));
    }
};

GridDisplay.prototype.parsePoints = function(string) {
    var points = [];
    string = string.replace(/\s/g,'');
    for (var i = 0; i <= string.length - 6; i += 6) {
        digits = string.slice(i, i + 6);
        var X = Math.floor(digits/1000);
        var Y = digits % 1000;
        points.push([(X - 500)/100, (Y - 500)/100]);
    }
    return points;
}

GridDisplay.prototype.render = function() {
    var curr = this;
    var container = document.createElement("div");
    container.className = "applet-container";
    container.style.width = this.config.width + "px";

    var canvas = document.createElement("canvas");
    canvas.className = "slate";
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    canvas.innerText = "Your browser doesn't support canvas, try using a more up-to-date browser.";

    //TODO: pull out scale (70)
    var scale = parseInt(this.config.scale, 10);
    var grid = new Grid(canvas, scale);
    grid.showGrid = this.config.showGrid;
    grid.showAxes = this.config.showAxes;

    if (this.config.showGridControls) {
        //TODO: separate function
        var gridControls = this.createGridControls(grid);
        container.appendChild(gridControls);
    }

    var numberOfGears = parseInt(this.config.numGears, 10);
    console.log(this.config);
    var controller = new GridController(grid, this.config.points, numberOfGears, this.config.editable);
    controller.sim.showPath = this.config.showPath;
    controller.showPoints = this.config.showPoints;

    container.appendChild(canvas);

    if (this.config.showSimulatorControls) {
        var simControls = this.createSimulatorControls(controller.sim);
        container.appendChild(simControls);

        controller.sim.addRenderStep(function(){
            if (controller.sim.playing) {
                curr.simulator.slider.setValue(controller.sim.t / (2 * Math.PI) * 100);
            }
        });
    }

    controller.refreshSim(this.config.autoplay);
    return container;
}

GridDisplay.prototype.createGridControls = function(grid){
    var gridControls = document.createElement("div");
    gridControls.className = "grid-controls";

    //TODO: examples
    //<p>Example Configurations: <select id="example-select"></select></p>

    var controlsMapping = { 
        "show-grid": "showGrid",
        "show-axes": "showAxes",
        "show-points": "showPoints",
        "show-path": "showPath",
    };
    var labelsMapping = { 
        "show-grid": "Show Grid",
        "show-axes": "Show Axes",
        "show-points": "Show Points",
        "show-path": "Show Path",
    };

    for (var prop in controlsMapping) {
        var id = this.config.name + "-" + prop;
        var p = document.createElement("p");
        var l = document.createElement("label");

        l.setAttribute("for", id);
        l.innerText = labelsMapping[prop];
        var i = document.createElement("input");
        i.setAttribute("type", "checkbox");
        i.id = id;

        if (this.config[controlsMapping[prop]]) {
            i.setAttribute("checked", "checked");
        }

        p.appendChild(l);
        p.appendChild(i);
        gridControls.appendChild(p);
    };
    return gridControls;
}

GridDisplay.prototype.createSimulatorControls = function(sim) {
    var simControls = document.createElement("div");
    simControls.className = "simulator-controls";

    this.simulator = {};

    var createElement = function(type, className, text) {
        var e = document.createElement(type);
        e.className = className;
        if (text) {
            e.innerText = text;
        }
        return e;
    }

    var slider = createElement("div", "slider");
    var sliderBar = createElement("div", "slider-bar");
    var sliderButton = createElement("div", "slider-button");
    slider.appendChild(sliderBar);
    slider.appendChild(sliderButton);

    simControls.appendChild(slider);
    this.simulator.slider = this.createSlider(slider, {
        onchange: function(percent) {
            sim.pause();
            sim.t = Math.PI * 2 * percent / 100;
            sim.render();
            setPlayState(false);
        }
    });

    var buttons = createElement("div", "buttons");

    var stepBack = createElement("button", "", "Step Back");
    var pausePlay = createElement("button", "pause", "Pause");
    var stepForward = createElement("button", "", "Step Forward");
    var fastForward = createElement("button", "", "Fast Forward");

    buttons.appendChild(stepBack);
    buttons.appendChild(pausePlay);
    buttons.appendChild(stepForward);
    buttons.appendChild(fastForward);

    var getPlayState = function() {
        return pausePlay.className.indexOf("pause") >= 0;
    };

    var setPlayState = function(play) {
        //button is opposite of what is currently occuring (i.e. show pause button
        //when playing, play button when paused)
        if (play) {
            pausePlay.textContent = "Pause";
            pausePlay.className = pausePlay.className.replace("play", "pause");
        } else {
            pausePlay.textContent = "Play";
            pausePlay.className = pausePlay.className.replace("pause", "play");
        }
    };
    setPlayState(this.config.autoplay);
    
    var curr = this;
    var actions = {
        play: function(){sim.speed = 1; sim.play();},
        pause: function(){sim.pause();},
        stepForward: function(){
            sim.pause();
            sim.step(.1);
            curr.simulator.slider.setValue(sim.t / (2 * Math.PI) * 100);
        },
        stepBackward: function(){
            sim.pause();
            sim.step(-.1);
            curr.simulator.slider.setValue(sim.t / (2 * Math.PI) * 100);
        },
        fastForward: function() {
            sim.speed *= 1.5;
            sim.play();
        }
    };

    pausePlay.addEventListener("click", function(){
        var playing = getPlayState();

        if (playing) {
            actions.pause();
            setPlayState(false);
        } else {
            actions.play();
            setPlayState(true);
        }
    });
    stepForward.addEventListener("click", function(){
        actions.stepForward();
        setPlayState(false);
    });
    stepBack.addEventListener("click", function(){
        actions.stepBackward();
        setPlayState(false);
    });

    fastForward.addEventListener("click", function(){
        actions.fastForward();
        setPlayState(true);
    });

    simControls.appendChild(buttons);
    return simControls;
};

GridDisplay.prototype.createSlider = function(element, options) {
    var bar = element.querySelector(".slider-bar");
    var button = element.querySelector(".slider-button");
    var dragging = false;
    var onchange = options.onchange || function(){};

    var moveToClientX = function(clientX) {
        var oLeft = element.offsetLeft, width = element.offsetWidth;
        setValue((clientX - oLeft) / width * 100, true);
    };
    var setValue = function(percent, do_callback) {
        percent = Math.max(0, Math.min(percent, 100));
        button.style.left = percent + "%";
        if (do_callback) { onchange.call(element, percent); }
    };

    element.addEventListener("mousedown", function(e) {
        dragging = true;
        moveToClientX(e.clientX);
    });
    window.addEventListener("mouseup", function(e) {
        dragging = false;
    });
    window.addEventListener("mousemove", function(e) {
        if (dragging) { moveToClientX(e.clientX); }
    });

    return {
        setValue: setValue
    }
};
