/*
Functions for calculating the epicycle parameters
to fit a given set of points. Based on mapping the points
into the complex domain and them applying a discrete Fourier transform.
*/

epicycles = {};

//Note, the coeffs returned are _not_ normalized
epicycles.fft = function(points) {
    if (!FFT) {
        throw new Error("Must include fft.js");
    }
    //points is an array of pairs [x, y] to be treated as complex coordinates
    //(x, y) => x + yj
    var n = points.length;
    var input = new Float64Array(2 * n), output = new Float64Array(2 * n);
    var fft = new FFT.complex(n, false);
    for (var i = 0; i < n; i++) {
        input[2*i] = points[i][0];
        input[2*i + 1] = points[i][1];
    }
    fft.simple(output, input, "complex");
    //return array of pairs
    var ret = [];
    for (var i = 0; i < n; i++) {
        ret.push([output[2*i], output[2*i+1]]);
    }
    return ret;
};

epicycles.calculateGears = function(points, maxNumber, unidirectional) {
    maxNumber = maxNumber || points.length;
    unidirectional = !!unidirectional;

    var coeffs = epicycles.fft(points);
    var n = coeffs.length;
    var e = 1e-6;
    var gears = [];

    var addGear = function(omega, coords) {
        var mag = coords[0]/n;
        if (mag > e) {
            gears.push([omega, mag, coords[1]]);
        }
    };

    if (unidirectional) {
        for (var i = 1; i < n; i++) {
            addGear(i, epicycles.toPolar(coeffs[i]));
        }
    } else {
        for (var i = 1; i <= n/2; i++) {
            //positive gear
            addGear(i, epicycles.toPolar(coeffs[i]));

            if (i == n - i) { 
                //midway case
                continue;
            }
            //negative gear, coefficients are periodic in n
            addGear(-i, epicycles.toPolar(coeffs[n - i]));
        }
    }
    console.log(gears);
    //sort by magnitude
    gears.sort(function(a, b) {
        return b[1] - a[1];
    });

    //find the most significent (largest length) gears so
    //that we're <= maxNumber
    if (gears.length > maxNumber) {
       gears = gears.slice(0, maxNumber); 
    }

    //you get the "0" gear for free, if it's interesting
    var coords = epicycles.toPolar(coeffs[0]);
    if (coords[0]/n > e) {
        //add to beginning
        gears.unshift([0, coords[0]/n, coords[1]]);
    }
    return gears;
};

epicycles.toPolar = function(rect) {
    var a = rect[0], b = rect[1];
    return [Math.sqrt(a*a + b*b), Math.atan2(b,a)];
}
