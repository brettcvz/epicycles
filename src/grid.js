/*drawing functions*/
//Nomenclature: X and Y are in Grid coordinate system, u and v are in context coordinate system
function Grid(canvas, scale) {
    this.scale = scale || 10;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.originU = canvas.width/2;
    this.originV = canvas.height/2;

    this.path = [];

    this.showAxes = true;
    this.showGrid = true;

    this.drawGrid();
};

Grid.prototype.drawGrid = function() {
    var ctx = this.context;
    ctx.strokeStyle = "#000000";
    ctx.beginPath();

    //Axes
    if (this.showAxes) {
        ctx.moveTo(this.originU, 0);
        ctx.lineTo(this.originU, this.height);
        ctx.moveTo(0, this.originV);
        ctx.lineTo(this.width, this.originV);
    }

    if (this.showGrid) {
        var grid = this;
        var plusSign = function(u, v) {
            //should always be same size relative to grid
            size = 5;
            ctx.moveTo(u - size, v);
            ctx.lineTo(u + size, v);
            ctx.moveTo(u, v - size);
            ctx.lineTo(u, v + size);
        };

        for (var x = 0; (x * this.scale) + this.originU < this.width; x++) {
            for (var y = 0; (y * this.scale) + this.originV < this.height; y++) {
                //All 4 intersections [we double up on the axes, but who cares]
                plusSign(x * this.scale + this.originU, y * this.scale + this.originV);
                plusSign(-x * this.scale + this.originU, y * this.scale + this.originV);
                plusSign(x * this.scale + this.originU, -y * this.scale + this.originV);
                plusSign(-x * this.scale + this.originU, -y * this.scale + this.originV);
            }
        }
    }

    this.context.stroke();
};

Grid.prototype.drawLabeledPoint = function(point, label) {
    this.drawPoint(point);
    var uvPoint = this.transform(point);
    //offset down and to the right
    this.context.fillText(label, uvPoint[0] + 5, uvPoint[1] + 10);
};

Grid.prototype.drawPoint = function(point, size, color) {
    var uvSize = size || 4; //points should always be the same size relative to grid
    color = color || "#000000";
    this.context.beginPath();
    this.context.fillStyle = color;
    var uvPoint = this.transform(point);
    var u = uvPoint[0];
    var v = uvPoint[1];
    /*x, y, radius, startAngle, endAngle*/
    this.context.arc(u, v, uvSize, 0, 2*Math.PI);
    this.context.fill();
};

Grid.prototype.highlightPoint = function(point, color) {
    var size = 6;
    color = color || "#3F3";
    this.context.beginPath();
    this.context.strokeStyle = color;
    var uvPoint = this.transform(point);
    var u = uvPoint[0];
    var v = uvPoint[1];
    /*x, y, radius, startAngle, endAngle*/
    this.context.arc(u, v, size, 0, 2*Math.PI);
    this.context.stroke();
};

Grid.prototype.transform = function(pointXY) {
    return [pointXY[0] * this.scale + this.originU,
            pointXY[1] * -1 * this.scale + this.originV];

};

Grid.prototype.inverse = function(pointUV) {
    return [(pointUV[0] - this.originU) / this.scale,
            (this.originV - pointUV[1]) / this.scale];

};

Grid.prototype.clear = function() {
    this.context.clearRect(0, 0, this.width, this.height);
    this.drawGrid();
};

//(x1,y1) - starting coordinates
//(x2,y2) - ending coordinates
//color - color
Grid.prototype.drawStick = function(x1, y1, x2, y2, color) {
    color = color || "#33CC33";
    var ctx = this.context
    //line
    ctx.beginPath();
    ctx.strokeStyle = color;
    var start = this.transform([x1,y1]);
    var end = this.transform([x2, y2]);
    ctx.moveTo(start[0],start[1]);
    ctx.lineTo(end[0],end[1]);
    ctx.stroke();

    //dot at tip
    ctx.beginPath();
    ctx.fillStyle = color;
    /*x, y, radius, startAngle, endAngle*/
    this.context.arc(end[0], end[1], 4, 0, 2*Math.PI);
    ctx.fill();
};

//(x1,y1) - center coordinates
//r - radius
//color - color
Grid.prototype.drawCircle = function(x1, y1, r, color) {
    color = color || "#33CC33";
    var ctx = this.context
    //line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    var center = this.transform([x1,y1]);
    ctx.arc(center[0],center[1], r * this.scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 1;
};
