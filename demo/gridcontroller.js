/*Listens for and handles UI Interactions with the grid*/
function GridController(grid, points, numberOfGears, editable) {
    this.grid = grid;
    this.points = points;
    this.numberOfGears = numberOfGears;
    this.sim = new Simulator(grid, [], 1);
    this.changeHandlers = [];
    this.editable = editable !== undefined ? !!editable : true;

    this.showPoints = true;

    var gc = this;
    this.sim.addRenderStep(function(){
        if (gc.showPoints) {
            gc.drawPoints();
            gc.highlightPoints();
        }
    });

    //I don't want to make points into objects, so I keep their state in
    //a separate array. A bit hacky.
    this.pointState = [];
    this.points.forEach(function(point, i){
        gc.pointState[i] = {highlighted: false};
    });

    if (this.editable) {
        this.grid.canvas.addEventListener("mousemove", function(e){ gc.mouseMove(e) });
        this.grid.canvas.addEventListener("mousedown", function(e){
            gc.setDragging(true);
        });
        this.grid.canvas.addEventListener("contextmenu", function(e){
            e.preventDefault();
            gc.rightClick(e);
            return false;
        });
        window.addEventListener("mouseup", function(e){ 
            gc.setDragging(false);
        });
        this.grid.canvas.addEventListener("dblclick", function(e){ gc.dblclick(e) });
    }
}

GridController.prototype.addPointsChangedHandler = function(handler) {
    this.changeHandlers.push(handler);
};

GridController.prototype.pointsChanged = function(handler) {
    var self = this;
    this.points.forEach(function(point, i){
        self.pointState[i] = {highlighted: false};
    });
    this.changeHandlers.forEach(function(handler){handler(self.points);});
    this.refreshSim();
};

GridController.prototype.refreshSim = function(autoplay) {
    var autoplay = autoplay !== undefined ? !!autoplay : true;

    var gears = [];
    if (this.points.length > 0) {
        var gears = epicycles.calculateGears(this.points, this.numberOfGears);
    }

    var self = this;
    this.sim.setGears(gears);
    //controls.simulator.slider.setValue(0);
    if (autoplay) {
        setTimeout(function(){
            self.resumePlaying();
        }, 5);
    }
};

GridController.prototype.resumePlaying = function() {
    //Restarts sim if we are playing
    //if (controls.simulator.getPlayState()) {
    this.sim.play();
    //}
};

/*Events*/
GridController.prototype.setDragging = function(dragging) {
    if (dragging === !!this.dragging) {
        return;
    }
    this.dragging = dragging;
    //if we started dragging, pause
    //if we stopped dragging, refresh points
    if (this.dragging) {
        this.pausedStateToDrag = this.sim.playing;
    }

    if (!this.dragging) {
        if (this.pointsChangedWhileDragging) {
            this.refreshSim();
            this.pointsChangedWhileDragging = false;
        } else {
            if (this.pausedStateToDrag) {
                this.resumePlaying();
            }
            this.pausedStateToDrag = false;
        }
    }
};

GridController.prototype.rightClick = function(e) {
    //remove whatever is highlighted
    var self = this;
    var deletedPoint = this.points.some(function(point, i) {
        if (self.pointState[i].highlighted) {
            //remove the point
            self.points.splice(i, 1);
            self.pointState.splice(i, 1);
            return true;
        }
        return false;
    });
    if (deletedPoint) {
        this.pointsChanged();
    }
};

GridController.prototype.mouseMove = function(e) {
    if (!this.showPoints) {
        return;
    }

    var pointXY = this.eventToXY(e);
    var self = this;
    if (this.dragging) {
        //find first highlighted point, move it
        //some, unlike forEach, quits when it gets a true
        var gc =this;
        this.points.some(function(point, i) {
            if (self.pointState[i].highlighted) {
                self.sim.pause();
                point[0] = pointXY[0];
                point[1] = pointXY[1];
                self.pointsChangedWhileDragging = true;
                return true;
            }
            return false;
        });
    } else {
        this.points.some(function(point, i){
            if (!self.pointState[i]) {return false;}

            if (self.doPointsOverlap(pointXY, point)) {
                self.pointState[i].highlighted = true;
            } else {
                self.pointState[i].highlighted = false;
            }
            return self.pointState[i].highlighted;
        });
    }
};

GridController.prototype.dblclick = function(e) {
    var pointXY = this.eventToXY(e);
    //edge case: points array is <= 1 element
    if (this.points.length <= 1) {
        this.points.push(pointXY);
        this.pointState.push({highlighted: true});
    } else {
        //add point next to nearest neighbor. Whether adding before or after
        //depends on what the new point is "between"
        var nearest = this.nearestPoints(pointXY);
        var near_index = this.points.indexOf(nearest[0]);
        var before_index = (near_index + this.points.length - 1) % this.points.length;
        var after_index = (near_index + 1) % this.points.length;

        //Call the nearest point N, the one before B, the one after A, and where we clicked X.
        //We want to determine if X is "between" B and N, or "between" N and A
        //I use quotes because we're not looking for colinear, but instead what's expected
        //by the user as "closer". We can't actually use linear distance either, because
        //we could be colinear with B and N, but N and A are close together, so we're closer to A
        //The best way to calculate if X is "between" B and N vs N and A is determination of
        //angles. If Angle(B-X-N) > (N-X-A), we're between B and N, and visa-versa.
        //We calculate using dot products, given cos(theta) = (a * b)/(|a||b|)
        //We won't have anything > 180, so greater angle means smaller cosine
        //so we flip the > sign and don't take the arccos
        //Since we use XN in both, we don't need to divide by |N|, so we get
        //put_before = (XB*XN)/|XB| < (XA*XN)/|XA|
        var B = this.points[before_index];
        var N = nearest[0];
        var A = this.points[after_index];
        var XB = [B[0] - pointXY[0], B[1] - pointXY[1]];
        var XN = [N[0] - pointXY[0], N[1] - pointXY[1]];
        var XA = [A[0] - pointXY[0], A[1] - pointXY[1]];
        var cos_bxn = (XB[0]*XN[0] + XB[1]*XN[1])/Math.sqrt(XB[0]*XB[0]+XB[1]*XB[1]);
        var cos_axn = (XA[0]*XN[0] + XA[1]*XN[1])/Math.sqrt(XA[0]*XA[0]+XA[1]*XA[1]);

        var put_before = cos_bxn < cos_axn;
        if (put_before) {
            this.points.splice(near_index, 0, pointXY);
            //yuck
            this.pointState.splice(near_index, 0, {highlighted: true});
        } else {
            //We actually want to go after, as it feels more natural when editing
            //than putting the new point at the beginning
            this.points.splice(near_index + 1, 0, pointXY);
            this.pointState.splice(near_index + 1, 0, {highlighted: true});
        }
    }

    this.pointsChanged();
};

GridController.prototype.drawPoints = function() {
    var grid = this.grid;
    this.points.forEach(function(point, i) {
        grid.drawLabeledPoint(point, i + 1);
    });
};

GridController.prototype.highlightPoints = function() {
    var grid = this.grid;
    var self = this;
    this.points.forEach(function(point, i) {
        if (i in self.pointState && self.pointState[i].highlighted) {
            grid.highlightPoint(point);
        }
    });
};

/*Utilities*/
GridController.prototype.eventToXY = function(e) {
    var x = e.pageX - this.grid.canvas.offsetLeft;
    var y = e.pageY - this.grid.canvas.offsetTop;
    return this.grid.inverse([x, y]);
};

GridController.prototype.doPointsOverlap = function(point1, point2, epsilon) {
    var epsilon = epsilon || 6 / this.grid.scale;
    //just do square hitbox testing, no reason to get squareroots involved
    return Math.abs(point1[0] - point2[0]) <= epsilon &&
        Math.abs(point1[1] - point2[1]) <= epsilon;
};

GridController.prototype.nearestPoints = function(test_point) {
    //copy points, sort based on distance
    var copy = this.points.slice();
    var gc = this;
    copy.sort(function(a, b) {
        return gc.compareDistance(test_point, a, b);
    });
    return copy;
};

//Returns a negative number if test_point is closer to a then b, else a positive number. 0 if
//same distance
GridController.prototype.compareDistance = function(test_point, a, b) {
    var a_dx = a[0] - test_point[0];
    var a_dy = a[1] - test_point[1];
    var b_dx = b[0] - test_point[0];
    var b_dy = b[1] - test_point[1];
    //comparing, no need to sqrt
    return (a_dx*a_dx + a_dy*a_dy) - (b_dx*b_dx + b_dy*b_dy);
};
