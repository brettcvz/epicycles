var controls = {};

//simulator controls
controls.simulator = {};
controls.simulator.createSlider = function(options) {
    var sliderDom = document.getElementById("time-slider");
    var bar = sliderDom.querySelector(".slider-bar");
    var button = sliderDom.querySelector(".slider-button");
    var dragging = false;
    var onchange = options.onchange || function(){};

    var moveToClientX = function(clientX) {
        var oLeft = sliderDom.offsetLeft, width = sliderDom.offsetWidth;
        setValue((clientX - oLeft) / width * 100, true);
    };
    var setValue = function(percent, do_callback) {
        percent = Math.max(0, Math.min(percent, 100));
        button.style.left = percent + "%";
        if (do_callback) { onchange.call(sliderDom, percent); }
    };

    sliderDom.addEventListener("mousedown", function(e) {
            dragging = true;
            moveToClientX(e.clientX);
            });
    window.addEventListener("mouseup", function(e) {
            dragging = false;
            });
    window.addEventListener("mousemove", function(e) {
            if (dragging) { moveToClientX(e.clientX); }
            });

    return controls.simulator.slider = {
        setValue: setValue
    }
};
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
