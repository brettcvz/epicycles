var controls = {};

//simulator controls
controls.simulator = {};
controls.simulator.createButtons = function(actions) {
    document.getElementById("pause-play").addEventListener("click", function(){
        var playing = controls.simulator.getPlayState();

        if (playing) {
            actions.pause();
            controls.simulator.setPlayState(false);
        } else {
            actions.play();
            controls.simulator.setPlayState(true);
        }
    });
    document.getElementById("step-forward").addEventListener("click", function(){
        actions.stepForward();
        controls.simulator.setPlayState(false);
    });
    document.getElementById("step-backward").addEventListener("click", function(){
        actions.stepBackward();
        controls.simulator.setPlayState(false);
    });
    document.getElementById("fast-forward").addEventListener("click", function(){
        actions.fastForward();
        controls.simulator.setPlayState(true);
    });
};

controls.simulator.getPlayState = function() {
    //true if playing, false if paused
    var pausePlay = document.getElementById("pause-play");
    return pausePlay.className.indexOf("pause") >= 0;
};
controls.simulator.setPlayState = function(play) {
    var pausePlay = document.getElementById("pause-play");
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
