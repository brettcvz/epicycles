function Simulator(grid, gears, speed) {
    this.grid = grid;
    this.gears = gears;
    this.speed = speed || 1;
    this.reset();

    this.renderSteps = [];
    this.showPath = true;

    this.renderLoop();
};

Simulator.prototype.addRenderStep = function(cb) {
    this.renderSteps.push(cb);
};

Simulator.prototype.renderLoop = function(){
    //Not re-entrant, should only be called once
    var TWO_PI = 2*Math.PI;

    var last = null;
    var sim = this;
    var step = function(now) {
        if (sim.playing) {
            if (last !== null) {
                sim.t = (sim.t + ((now - last) / 1000 * sim.speed)) % TWO_PI;
                last = now;
            }
            last = now;
        } else {
            last = null;
        }
        sim.render();

        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

Simulator.prototype.play = function(){
    this.playing = true;
};

Simulator.prototype.pause = function(){
    this.playing = false;
};

Simulator.prototype.step = function(dt){
    var TWO_PI = Math.PI * 2;
    this.t = (this.t + dt) % TWO_PI;
    if (this.t < 0) { this.t += TWO_PI;}
    this.render();
};

Simulator.prototype.setGears = function(gears){
    this.pause();
    this.gears = gears;
    this.reset();
    this.render();
};

Simulator.prototype.reset = function(){
    this.t = 0;
    this.playing = false;
    this.path = [];
};

Simulator.prototype.render = function() {
    this.grid.clear();
    this.renderSteps.forEach(function(cb){cb();});

    var offsetX = 0, offsetY = 0;
    var t = t || 0;
    var colors = ["#33CC33", "#CC3333", "#3333CC",
            "#0066CC", "#CC0066", "#66CC00",
            "#00CC66", "#CC6600", "#6600CC"];
    for (var i = 0; i < this.gears.length; i++) {
        var gear = this.gears[i];
        var endX = offsetX + gear[1] * Math.cos(gear[0] * this.t + gear[2]);
        var endY = offsetY + gear[1] * Math.sin(gear[0] * this.t + gear[2]);
        this.grid.drawCircle(offsetX, offsetY, gear[1], colors[i % colors.length]);
        this.grid.drawStick(offsetX, offsetY, endX, endY, colors[i % colors.length]);
        offsetX = endX;
        offsetY = endY;
    }

    //Save the final point for drawing later
    this.path.push([offsetX, offsetY]);

    if (this.showPath) {
        this.drawPath();
    }
};

Simulator.prototype.drawPath = function(){
    var grid = this.grid;
    this.path.forEach(function(point) {
        grid.drawPoint(point, 1, "#A66");
    });
};


