var Custom = (function (exports) {
    'use strict';

    /*
     * Copyright (C) 2008 Apple Inc. All Rights Reserved.
     *
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions
     * are met:
     * 1. Redistributions of source code must retain the above copyright
     *    notice, this list of conditions and the following disclaimer.
     * 2. Redistributions in binary form must reproduce the above copyright
     *    notice, this list of conditions and the following disclaimer in the
     *    documentation and/or other materials provided with the distribution.
     *
     * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
     * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
     * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
     * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
     * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
     * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
     * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
     * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
     * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
     * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     *
     * Ported from Webkit
     * http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/UnitBezier.h
     */

    var unitbezier = UnitBezier;

    function UnitBezier(p1x, p1y, p2x, p2y) {
        // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
        this.cx = 3.0 * p1x;
        this.bx = 3.0 * (p2x - p1x) - this.cx;
        this.ax = 1.0 - this.cx - this.bx;

        this.cy = 3.0 * p1y;
        this.by = 3.0 * (p2y - p1y) - this.cy;
        this.ay = 1.0 - this.cy - this.by;

        this.p1x = p1x;
        this.p1y = p2y;
        this.p2x = p2x;
        this.p2y = p2y;
    }

    UnitBezier.prototype.sampleCurveX = function(t) {
        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        return ((this.ax * t + this.bx) * t + this.cx) * t;
    };

    UnitBezier.prototype.sampleCurveY = function(t) {
        return ((this.ay * t + this.by) * t + this.cy) * t;
    };

    UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
        return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
    };

    UnitBezier.prototype.solveCurveX = function(x, epsilon) {
        if (typeof epsilon === 'undefined') epsilon = 1e-6;

        var t0, t1, t2, x2, i;

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 8; i++) {

            x2 = this.sampleCurveX(t2) - x;
            if (Math.abs(x2) < epsilon) return t2;

            var d2 = this.sampleCurveDerivativeX(t2);
            if (Math.abs(d2) < 1e-6) break;

            t2 = t2 - x2 / d2;
        }

        // Fall back to the bisection method for reliability.
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0) return t0;
        if (t2 > t1) return t1;

        while (t0 < t1) {

            x2 = this.sampleCurveX(t2);
            if (Math.abs(x2 - x) < epsilon) return t2;

            if (x > x2) {
                t0 = t2;
            } else {
                t1 = t2;
            }

            t2 = (t1 - t0) * 0.5 + t0;
        }

        // Failure.
        return t2;
    };

    UnitBezier.prototype.solve = function(x, epsilon) {
        return this.sampleCurveY(this.solveCurveX(x, epsilon));
    };

    var pointGeometry = Point;

    /**
     * A standalone point geometry with useful accessor, comparison, and
     * modification methods.
     *
     * @class Point
     * @param {Number} x the x-coordinate. this could be longitude or screen
     * pixels, or any other sort of unit.
     * @param {Number} y the y-coordinate. this could be latitude or screen
     * pixels, or any other sort of unit.
     * @example
     * var point = new Point(-77, 38);
     */
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    Point.prototype = {

        /**
         * Clone this point, returning a new point that can be modified
         * without affecting the old one.
         * @return {Point} the clone
         */
        clone: function() { return new Point(this.x, this.y); },

        /**
         * Add this point's x & y coordinates to another point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        add:     function(p) { return this.clone()._add(p); },

        /**
         * Subtract this point's x & y coordinates to from point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        sub:     function(p) { return this.clone()._sub(p); },

        /**
         * Multiply this point's x & y coordinates by point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        multByPoint:    function(p) { return this.clone()._multByPoint(p); },

        /**
         * Divide this point's x & y coordinates by point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        divByPoint:     function(p) { return this.clone()._divByPoint(p); },

        /**
         * Multiply this point's x & y coordinates by a factor,
         * yielding a new point.
         * @param {Point} k factor
         * @return {Point} output point
         */
        mult:    function(k) { return this.clone()._mult(k); },

        /**
         * Divide this point's x & y coordinates by a factor,
         * yielding a new point.
         * @param {Point} k factor
         * @return {Point} output point
         */
        div:     function(k) { return this.clone()._div(k); },

        /**
         * Rotate this point around the 0, 0 origin by an angle a,
         * given in radians
         * @param {Number} a angle to rotate around, in radians
         * @return {Point} output point
         */
        rotate:  function(a) { return this.clone()._rotate(a); },

        /**
         * Rotate this point around p point by an angle a,
         * given in radians
         * @param {Number} a angle to rotate around, in radians
         * @param {Point} p Point to rotate around
         * @return {Point} output point
         */
        rotateAround:  function(a,p) { return this.clone()._rotateAround(a,p); },

        /**
         * Multiply this point by a 4x1 transformation matrix
         * @param {Array<Number>} m transformation matrix
         * @return {Point} output point
         */
        matMult: function(m) { return this.clone()._matMult(m); },

        /**
         * Calculate this point but as a unit vector from 0, 0, meaning
         * that the distance from the resulting point to the 0, 0
         * coordinate will be equal to 1 and the angle from the resulting
         * point to the 0, 0 coordinate will be the same as before.
         * @return {Point} unit vector point
         */
        unit:    function() { return this.clone()._unit(); },

        /**
         * Compute a perpendicular point, where the new y coordinate
         * is the old x coordinate and the new x coordinate is the old y
         * coordinate multiplied by -1
         * @return {Point} perpendicular point
         */
        perp:    function() { return this.clone()._perp(); },

        /**
         * Return a version of this point with the x & y coordinates
         * rounded to integers.
         * @return {Point} rounded point
         */
        round:   function() { return this.clone()._round(); },

        /**
         * Return the magitude of this point: this is the Euclidean
         * distance from the 0, 0 coordinate to this point's x and y
         * coordinates.
         * @return {Number} magnitude
         */
        mag: function() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },

        /**
         * Judge whether this point is equal to another point, returning
         * true or false.
         * @param {Point} other the other point
         * @return {boolean} whether the points are equal
         */
        equals: function(other) {
            return this.x === other.x &&
                   this.y === other.y;
        },

        /**
         * Calculate the distance from this point to another point
         * @param {Point} p the other point
         * @return {Number} distance
         */
        dist: function(p) {
            return Math.sqrt(this.distSqr(p));
        },

        /**
         * Calculate the distance from this point to another point,
         * without the square root step. Useful if you're comparing
         * relative distances.
         * @param {Point} p the other point
         * @return {Number} distance
         */
        distSqr: function(p) {
            var dx = p.x - this.x,
                dy = p.y - this.y;
            return dx * dx + dy * dy;
        },

        /**
         * Get the angle from the 0, 0 coordinate to this point, in radians
         * coordinates.
         * @return {Number} angle
         */
        angle: function() {
            return Math.atan2(this.y, this.x);
        },

        /**
         * Get the angle from this point to another point, in radians
         * @param {Point} b the other point
         * @return {Number} angle
         */
        angleTo: function(b) {
            return Math.atan2(this.y - b.y, this.x - b.x);
        },

        /**
         * Get the angle between this point and another point, in radians
         * @param {Point} b the other point
         * @return {Number} angle
         */
        angleWith: function(b) {
            return this.angleWithSep(b.x, b.y);
        },

        /*
         * Find the angle of the two vectors, solving the formula for
         * the cross product a x b = |a||b|sin(θ) for θ.
         * @param {Number} x the x-coordinate
         * @param {Number} y the y-coordinate
         * @return {Number} the angle in radians
         */
        angleWithSep: function(x, y) {
            return Math.atan2(
                this.x * y - this.y * x,
                this.x * x + this.y * y);
        },

        _matMult: function(m) {
            var x = m[0] * this.x + m[1] * this.y,
                y = m[2] * this.x + m[3] * this.y;
            this.x = x;
            this.y = y;
            return this;
        },

        _add: function(p) {
            this.x += p.x;
            this.y += p.y;
            return this;
        },

        _sub: function(p) {
            this.x -= p.x;
            this.y -= p.y;
            return this;
        },

        _mult: function(k) {
            this.x *= k;
            this.y *= k;
            return this;
        },

        _div: function(k) {
            this.x /= k;
            this.y /= k;
            return this;
        },

        _multByPoint: function(p) {
            this.x *= p.x;
            this.y *= p.y;
            return this;
        },

        _divByPoint: function(p) {
            this.x /= p.x;
            this.y /= p.y;
            return this;
        },

        _unit: function() {
            this._div(this.mag());
            return this;
        },

        _perp: function() {
            var y = this.y;
            this.y = this.x;
            this.x = -y;
            return this;
        },

        _rotate: function(angle) {
            var cos = Math.cos(angle),
                sin = Math.sin(angle),
                x = cos * this.x - sin * this.y,
                y = sin * this.x + cos * this.y;
            this.x = x;
            this.y = y;
            return this;
        },

        _rotateAround: function(angle, p) {
            var cos = Math.cos(angle),
                sin = Math.sin(angle),
                x = p.x + cos * (this.x - p.x) - sin * (this.y - p.y),
                y = p.y + sin * (this.x - p.x) + cos * (this.y - p.y);
            this.x = x;
            this.y = y;
            return this;
        },

        _round: function() {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        }
    };

    /**
     * Construct a point from an array if necessary, otherwise if the input
     * is already a Point, or an unknown type, return it unchanged
     * @param {Array<Number>|Point|*} a any kind of input value
     * @return {Point} constructed point, or passed-through value.
     * @example
     * // this
     * var point = Point.convert([0, 1]);
     * // is equivalent to
     * var point = new Point(0, 1);
     */
    Point.convert = function (a) {
        if (a instanceof Point) {
            return a;
        }
        if (Array.isArray(a)) {
            return new Point(a[0], a[1]);
        }
        return a;
    };

    //

    //      

    /**
     * Deeply compares two object literals.
     *
     * @private
     */
    function deepEqual(a        , b        )          {
        if (Array.isArray(a)) {
            if (!Array.isArray(b) || a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        if (typeof a === 'object' && a !== null && b !== null) {
            if (!(typeof b === 'object')) return false;
            const keys = Object.keys(a);
            if (keys.length !== Object.keys(b).length) return false;
            for (const key in a) {
                if (!deepEqual(a[key], b[key])) return false;
            }
            return true;
        }
        return a === b;
    }

    //      

    /**
     * constrain n to the given range via min + max
     *
     * @param n value
     * @param min the minimum value to be returned
     * @param max the maximum value to be returned
     * @returns the clamped value
     * @private
     */
    function clamp(n        , min        , max        )         {
        return Math.min(max, Math.max(min, n));
    }

    /**
     * constrain n to the given range, excluding the minimum, via modular arithmetic
     *
     * @param n value
     * @param min the minimum value to be returned, exclusive
     * @param max the maximum value to be returned, inclusive
     * @returns constrained number
     * @private
     */
    function wrap(n        , min        , max        )         {
        const d = max - min;
        const w = ((n - min) % d + d) % d + min;
        return (w === min) ? max : w;
    }

    let id = 1;

    /**
     * Return a unique numeric id, starting at 1 and incrementing with
     * each call.
     *
     * @returns unique numeric id.
     * @private
     */
    function uniqueId()         {
        return id++;
    }

    /**
     * Check if two arrays have at least one common element.
     *
     * @private
     */
    function arraysIntersect   (a          , b          )          {
        for (let l = 0; l < a.length; l++) {
            if (b.indexOf(a[l]) >= 0) return true;
        }
        return false;
    }

    /**
     * Print a warning message to the console and ensure duplicate warning messages
     * are not printed.
     *
     * @private
     */
    const warnOnceHistory                           = {};

    function warnOnce(message        )       {
        if (!warnOnceHistory[message]) {
            // console isn't defined in some WebWorkers, see #2558
            if (typeof console !== "undefined") console.warn(message);
            warnOnceHistory[message] = true;
        }
    }

    /**
     * Indicates if the provided Points are in a counter clockwise (true) or clockwise (false) order
     *
     * @private
     * @returns true for a counter clockwise set of points
     */
    // http://bryceboe.com/2006/10/23/line-segment-intersection-algorithm/
    function isCounterClockwise(a       , b       , c       )          {
        return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    }

    /**
     * Parses data from 'Cache-Control' headers.
     *
     * @private
     * @param cacheControl Value of 'Cache-Control' header
     * @return object containing parsed header info.
     */

    function parseCacheControl(cacheControl        )         {
        // Taken from [Wreck](https://github.com/hapijs/wreck)
        const re = /(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g;

        const header = {};
        cacheControl.replace(re, ($0, $1, $2, $3) => {
            const value = $2 || $3;
            header[$1] = value ? value.toLowerCase() : true;
            return '';
        });

        if (header['max-age']) {
            const maxAge = parseInt(header['max-age'], 10);
            if (isNaN(maxAge)) delete header['max-age'];
            else header['max-age'] = maxAge;
        }

        return header;
    }

    //      

                                              

    /**
     * A `LngLatBounds` object represents a geographical bounding box,
     * defined by its southwest and northeast points in longitude and latitude.
     *
     * If no arguments are provided to the constructor, a `null` bounding box is created.
     *
     * Note that any Mapbox GL method that accepts a `LngLatBounds` object as an argument or option
     * can also accept an `Array` of two {@link LngLatLike} constructs and will perform an implicit conversion.
     * This flexible type is documented as {@link LngLatBoundsLike}.
     *
     * @param {LngLatLike} [sw] The southwest corner of the bounding box.
     * @param {LngLatLike} [ne] The northeast corner of the bounding box.
     * @example
     * var sw = new mapboxgl.LngLat(-73.9876, 40.7661);
     * var ne = new mapboxgl.LngLat(-73.9397, 40.8002);
     * var llb = new mapboxgl.LngLatBounds(sw, ne);
     */
    class LngLatBounds {
                    
                    

        // This constructor is too flexible to type. It should not be so flexible.
        constructor(sw     , ne     ) {
            if (!sw) ; else if (ne) {
                this.setSouthWest(sw).setNorthEast(ne);
            } else if (sw.length === 4) {
                this.setSouthWest([sw[0], sw[1]]).setNorthEast([sw[2], sw[3]]);
            } else {
                this.setSouthWest(sw[0]).setNorthEast(sw[1]);
            }
        }

        /**
         * Set the northeast corner of the bounding box
         *
         * @param {LngLatLike} ne
         * @returns {LngLatBounds} `this`
         */
        setNorthEast(ne            ) {
            this._ne = ne instanceof LngLat ? new LngLat(ne.lng, ne.lat) : LngLat.convert(ne);
            return this;
        }

        /**
         * Set the southwest corner of the bounding box
         *
         * @param {LngLatLike} sw
         * @returns {LngLatBounds} `this`
         */
        setSouthWest(sw            ) {
            this._sw = sw instanceof LngLat ? new LngLat(sw.lng, sw.lat) : LngLat.convert(sw);
            return this;
        }

        /**
         * Extend the bounds to include a given LngLat or LngLatBounds.
         *
         * @param {LngLat|LngLatBounds} obj object to extend to
         * @returns {LngLatBounds} `this`
         */
        extend(obj                       ) {
            const sw = this._sw,
                ne = this._ne;
            let sw2, ne2;

            if (obj instanceof LngLat) {
                sw2 = obj;
                ne2 = obj;

            } else if (obj instanceof LngLatBounds) {
                sw2 = obj._sw;
                ne2 = obj._ne;

                if (!sw2 || !ne2) return this;

            } else {
                if (Array.isArray(obj)) {
                    if (obj.every(Array.isArray)) {
                        return this.extend(LngLatBounds.convert(obj));
                    } else {
                        return this.extend(LngLat.convert(obj));
                    }
                }
                return this;
            }

            if (!sw && !ne) {
                this._sw = new LngLat(sw2.lng, sw2.lat);
                this._ne = new LngLat(ne2.lng, ne2.lat);

            } else {
                sw.lng = Math.min(sw2.lng, sw.lng);
                sw.lat = Math.min(sw2.lat, sw.lat);
                ne.lng = Math.max(ne2.lng, ne.lng);
                ne.lat = Math.max(ne2.lat, ne.lat);
            }

            return this;
        }

        /**
         * Returns the geographical coordinate equidistant from the bounding box's corners.
         *
         * @returns {LngLat} The bounding box's center.
         * @example
         * var llb = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
         * llb.getCenter(); // = LngLat {lng: -73.96365, lat: 40.78315}
         */
        getCenter()         {
            return new LngLat((this._sw.lng + this._ne.lng) / 2, (this._sw.lat + this._ne.lat) / 2);
        }

        /**
         * Returns the southwest corner of the bounding box.
         *
         * @returns {LngLat} The southwest corner of the bounding box.
         */
        getSouthWest()         { return this._sw; }

        /**
        * Returns the northeast corner of the bounding box.
        *
        * @returns {LngLat} The northeast corner of the bounding box.
         */
        getNorthEast()         { return this._ne; }

        /**
        * Returns the northwest corner of the bounding box.
        *
        * @returns {LngLat} The northwest corner of the bounding box.
         */
        getNorthWest()         { return new LngLat(this.getWest(), this.getNorth()); }

        /**
        * Returns the southeast corner of the bounding box.
        *
        * @returns {LngLat} The southeast corner of the bounding box.
         */
        getSouthEast()         { return new LngLat(this.getEast(), this.getSouth()); }

        /**
        * Returns the west edge of the bounding box.
        *
        * @returns {number} The west edge of the bounding box.
         */
        getWest()         { return this._sw.lng; }

        /**
        * Returns the south edge of the bounding box.
        *
        * @returns {number} The south edge of the bounding box.
         */
        getSouth()         { return this._sw.lat; }

        /**
        * Returns the east edge of the bounding box.
        *
        * @returns {number} The east edge of the bounding box.
         */
        getEast()         { return this._ne.lng; }

        /**
        * Returns the north edge of the bounding box.
        *
        * @returns {number} The north edge of the bounding box.
         */
        getNorth()         { return this._ne.lat; }

        /**
         * Returns the bounding box represented as an array.
         *
         * @returns {Array<Array<number>>} The bounding box represented as an array, consisting of the
         *   southwest and northeast coordinates of the bounding represented as arrays of numbers.
         * @example
         * var llb = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
         * llb.toArray(); // = [[-73.9876, 40.7661], [-73.9397, 40.8002]]
         */
        toArray() {
            return [this._sw.toArray(), this._ne.toArray()];
        }

        /**
         * Return the bounding box represented as a string.
         *
         * @returns {string} The bounding box represents as a string of the format
         *   `'LngLatBounds(LngLat(lng, lat), LngLat(lng, lat))'`.
         * @example
         * var llb = new mapboxgl.LngLatBounds([-73.9876, 40.7661], [-73.9397, 40.8002]);
         * llb.toString(); // = "LngLatBounds(LngLat(-73.9876, 40.7661), LngLat(-73.9397, 40.8002))"
         */
        toString() {
            return `LngLatBounds(${this._sw.toString()}, ${this._ne.toString()})`;
        }

        /**
         * Check if the bounding box is an empty/`null`-type box.
         *
         * @returns {boolean} True if bounds have been defined, otherwise false.
         */
        isEmpty() {
            return !(this._sw && this._ne);
        }

        /**
         * Converts an array to a `LngLatBounds` object.
         *
         * If a `LngLatBounds` object is passed in, the function returns it unchanged.
         *
         * Internally, the function calls `LngLat#convert` to convert arrays to `LngLat` values.
         *
         * @param {LngLatBoundsLike} input An array of two coordinates to convert, or a `LngLatBounds` object to return.
         * @returns {LngLatBounds} A new `LngLatBounds` object, if a conversion occurred, or the original `LngLatBounds` object.
         * @example
         * var arr = [[-73.9876, 40.7661], [-73.9397, 40.8002]];
         * var llb = mapboxgl.LngLatBounds.convert(arr);
         * llb;   // = LngLatBounds {_sw: LngLat {lng: -73.9876, lat: 40.7661}, _ne: LngLat {lng: -73.9397, lat: 40.8002}}
         */
        static convert(input                  )               {
            if (!input || input instanceof LngLatBounds) return input;
            return new LngLatBounds(input);
        }
    }

    //      

    /**
     * A `LngLat` object represents a given longitude and latitude coordinate, measured in degrees.
     *
     * Mapbox GL uses longitude, latitude coordinate order (as opposed to latitude, longitude) to match GeoJSON.
     *
     * Note that any Mapbox GL method that accepts a `LngLat` object as an argument or option
     * can also accept an `Array` of two numbers and will perform an implicit conversion.
     * This flexible type is documented as {@link LngLatLike}.
     *
     * @param {number} lng Longitude, measured in degrees.
     * @param {number} lat Latitude, measured in degrees.
     * @example
     * var ll = new mapboxgl.LngLat(-73.9749, 40.7736);
     * @see [Get coordinates of the mouse pointer](https://www.mapbox.com/mapbox-gl-js/example/mouse-position/)
     * @see [Display a popup](https://www.mapbox.com/mapbox-gl-js/example/popup/)
     * @see [Highlight features within a bounding box](https://www.mapbox.com/mapbox-gl-js/example/using-box-queryrenderedfeatures/)
     * @see [Create a timeline animation](https://www.mapbox.com/mapbox-gl-js/example/timeline-animation/)
     */
    class LngLat {
                    
                    

        constructor(lng        , lat        ) {
            if (isNaN(lng) || isNaN(lat)) {
                throw new Error(`Invalid LngLat object: (${lng}, ${lat})`);
            }
            this.lng = +lng;
            this.lat = +lat;
            if (this.lat > 90 || this.lat < -90) {
                throw new Error('Invalid LngLat latitude value: must be between -90 and 90');
            }
        }

        /**
         * Returns a new `LngLat` object whose longitude is wrapped to the range (-180, 180).
         *
         * @returns {LngLat} The wrapped `LngLat` object.
         * @example
         * var ll = new mapboxgl.LngLat(286.0251, 40.7736);
         * var wrapped = ll.wrap();
         * wrapped.lng; // = -73.9749
         */
        wrap() {
            return new LngLat(wrap(this.lng, -180, 180), this.lat);
        }

        /**
         * Returns the coordinates represented as an array of two numbers.
         *
         * @returns {Array<number>} The coordinates represeted as an array of longitude and latitude.
         * @example
         * var ll = new mapboxgl.LngLat(-73.9749, 40.7736);
         * ll.toArray(); // = [-73.9749, 40.7736]
         */
        toArray() {
            return [this.lng, this.lat];
        }

        /**
         * Returns the coordinates represent as a string.
         *
         * @returns {string} The coordinates represented as a string of the format `'LngLat(lng, lat)'`.
         * @example
         * var ll = new mapboxgl.LngLat(-73.9749, 40.7736);
         * ll.toString(); // = "LngLat(-73.9749, 40.7736)"
         */
        toString() {
            return `LngLat(${this.lng}, ${this.lat})`;
        }

        /**
         * Returns a `LngLatBounds` from the coordinates extended by a given `radius`.
         *
         * @param {number} [radius=0] Distance in meters from the coordinates to extend the bounds.
         * @returns {LngLatBounds} A new `LngLatBounds` object representing the coordinates extended by the `radius`.
         * @example
         * var ll = new mapboxgl.LngLat(-73.9749, 40.7736);
         * ll.toBounds(100).toArray(); // = [[-73.97501862141328, 40.77351016847229], [-73.97478137858673, 40.77368983152771]]
         */
        toBounds(radius          = 0) {
            const earthCircumferenceInMetersAtEquator = 40075017;
            const latAccuracy = 360 * radius / earthCircumferenceInMetersAtEquator,
                lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

            return new LngLatBounds(new LngLat(this.lng - lngAccuracy, this.lat - latAccuracy),
                new LngLat(this.lng + lngAccuracy, this.lat + latAccuracy));
        }

        /**
         * Converts an array of two numbers or an object with `lng` and `lat` or `lon` and `lat` properties
         * to a `LngLat` object.
         *
         * If a `LngLat` object is passed in, the function returns it unchanged.
         *
         * @param {LngLatLike} input An array of two numbers or object to convert, or a `LngLat` object to return.
         * @returns {LngLat} A new `LngLat` object, if a conversion occurred, or the original `LngLat` object.
         * @example
         * var arr = [-73.9749, 40.7736];
         * var ll = mapboxgl.LngLat.convert(arr);
         * ll;   // = LngLat {lng: -73.9749, lat: 40.7736}
         */
        static convert(input            )         {
            if (input instanceof LngLat) {
                return input;
            }
            if (Array.isArray(input) && (input.length === 2 || input.length === 3)) {
                return new LngLat(Number(input[0]), Number(input[1]));
            }
            if (!Array.isArray(input) && typeof input === 'object' && input !== null) {
                return new LngLat(
                    // flow can't refine this to have one of lng or lat, so we have to cast to any
                    Number('lng' in input ? (input     ).lng : (input     ).lon),
                    Number(input.lat)
                );
            }
            throw new Error("`LngLatLike` argument must be specified as a LngLat instance, an object {lng: <lng>, lat: <lat>}, an object {lon: <lng>, lat: <lat>}, or an array of [<lng>, <lat>]");
        }
    }

    //      
                                                   

    /*
     * The circumference of the world in meters at the given latitude.
     */
    function circumferenceAtLatitude(latitude        ) {
        const circumference = 2 * Math.PI * 6378137;
        return circumference * Math.cos(latitude * Math.PI / 180);
    }

    function mercatorXfromLng(lng        ) {
        return (180 + lng) / 360;
    }

    function mercatorYfromLat(lat        ) {
        return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
    }

    function mercatorZfromAltitude(altitude        , lat        ) {
        return altitude / circumferenceAtLatitude(lat);
    }

    function lngFromMercatorX(x        ) {
        return x * 360 - 180;
    }

    function latFromMercatorY(y        ) {
        const y2 = 180 - y * 360;
        return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
    }

    function altitudeFromMercatorZ(z        , y        ) {
        return z * circumferenceAtLatitude(latFromMercatorY(y));
    }

    /**
     * A `MercatorCoordinate` object represents a projected three dimensional position.
     *
     * `MercatorCoordinate` uses the web mercator projection ([EPSG:3857](https://epsg.io/3857)) with slightly different units:
     * - the size of 1 unit is the width of the projected world instead of the "mercator meter"
     * - the origin of the coordinate space is at the north-west corner instead of the middle
     *
     * For example, `MercatorCoordinate(0, 0, 0)` is the north-west corner of the mercator world and
     * `MercatorCoordinate(1, 1, 0)` is the south-east corner. If you are familiar with
     * [vector tiles](https://github.com/mapbox/vector-tile-spec) it may be helpful to think
     * of the coordinate space as the `0/0/0` tile with an extent of `1`.
     *
     * The `z` dimension of `MercatorCoordinate` is conformal. A cube in the mercator coordinate space would be rendered as a cube.
     *
     * @param {number} x The x component of the position.
     * @param {number} y The y component of the position.
     * @param {number} z The z component of the position.
     * @example
     * var nullIsland = new mapboxgl.MercatorCoordinate(0.5, 0.5, 0);
     *
     * @see [Add a custom style layer](https://www.mapbox.com/mapbox-gl-js/example/custom-style-layer/)
     */
    class MercatorCoordinate {
                  
                  
                  

        constructor(x        , y        , z         = 0) {
            this.x = +x;
            this.y = +y;
            this.z = +z;
        }

        /**
         * Project a `LngLat` to a `MercatorCoordinate`.
         *
         * @param {LngLatLike} lngLatLike The location to project.
         * @param {number} altitude The altitude in meters of the position.
         * @returns {MercatorCoordinate} The projected mercator coordinate.
         * @example
         * var coord = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 0, lat: 0}, 0);
         * coord; // MercatorCoordinate(0.5, 0.5, 0)
         */
        static fromLngLat(lngLatLike            , altitude         = 0) {
            const lngLat = LngLat.convert(lngLatLike);

            return new MercatorCoordinate(
                    mercatorXfromLng(lngLat.lng),
                    mercatorYfromLat(lngLat.lat),
                    mercatorZfromAltitude(altitude, lngLat.lat));
        }

        /**
         * Returns the `LngLat` for the coordinate.
         *
         * @returns {LngLat} The `LngLat` object.
         * @example
         * var coord = new mapboxgl.MercatorCoordinate(0.5, 0.5, 0);
         * var latLng = coord.toLngLat(); // LngLat(0, 0)
         */
        toLngLat() {
            return new LngLat(
                    lngFromMercatorX(this.x),
                    latFromMercatorY(this.y));
        }

        /**
         * Returns the altitude in meters of the coordinate.
         *
         * @returns {number} The altitude in meters.
         * @example
         * var coord = new mapboxgl.MercatorCoordinate(0, 0, 0.02);
         * coord.toAltitude(); // 6914.281956295339
         */
        toAltitude() {
            return altitudeFromMercatorZ(this.z, this.y);
        }
    }

    /**
     * getTileBBox
     *
     * @param    {Number}  x  Tile coordinate x
     * @param    {Number}  y  Tile coordinate y
     * @param    {Number}  z  Tile zoom
     * @returns  {String}  String of the bounding box
     */
    function getTileBBox(x, y, z) {
        // for Google/OSM tile scheme we need to alter the y
        y = (Math.pow(2, z) - y - 1);

        var min = getMercCoords(x * 256, y * 256, z),
            max = getMercCoords((x + 1) * 256, (y + 1) * 256, z);

        return min[0] + ',' + min[1] + ',' + max[0] + ',' + max[1];
    }


    /**
     * getMercCoords
     *
     * @param    {Number}  x  Pixel coordinate x
     * @param    {Number}  y  Pixel coordinate y
     * @param    {Number}  z  Tile zoom
     * @returns  {Array}   [x, y]
     */
    function getMercCoords(x, y, z) {
        var resolution = (2 * Math.PI * 6378137 / 256) / Math.pow(2, z),
            merc_x = (x * resolution - 2 * Math.PI  * 6378137 / 2.0),
            merc_y = (y * resolution - 2 * Math.PI  * 6378137 / 2.0);

        return [merc_x, merc_y];
    }

    //      

    /**
     * The maximum value of a coordinate in the internal tile coordinate system. Coordinates of
     * all source features normalized to this extent upon load.
     *
     * The value is a consequence of the following:
     *
     * * Vertex buffer store positions as signed 16 bit integers.
     * * One bit is lost for signedness to support tile buffers.
     * * One bit is lost because the line vertex buffer used to pack 1 bit of other data into the int.
     *   This is no longer the case but we're reserving this bit anyway.
     * * One bit is lost to support features extending past the extent on the right edge of the tile.
     * * This leaves us with 2^13 = 8192
     *
     * @private
     * @readonly
     */
    var EXTENT = 8192;

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
    /* eslint-disable no-unused-vars */
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;

    function toObject(val) {
    	if (val === null || val === undefined) {
    		throw new TypeError('Object.assign cannot be called with null or undefined');
    	}

    	return Object(val);
    }

    function shouldUseNative() {
    	try {
    		if (!Object.assign) {
    			return false;
    		}

    		// Detect buggy property enumeration order in older V8 versions.

    		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
    		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    		test1[5] = 'de';
    		if (Object.getOwnPropertyNames(test1)[0] === '5') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test2 = {};
    		for (var i = 0; i < 10; i++) {
    			test2['_' + String.fromCharCode(i)] = i;
    		}
    		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
    			return test2[n];
    		});
    		if (order2.join('') !== '0123456789') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test3 = {};
    		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
    			test3[letter] = letter;
    		});
    		if (Object.keys(Object.assign({}, test3)).join('') !==
    				'abcdefghijklmnopqrst') {
    			return false;
    		}

    		return true;
    	} catch (err) {
    		// We don't expect any of the above to throw, but better to be safe.
    		return false;
    	}
    }

    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
    	var from;
    	var to = toObject(target);
    	var symbols;

    	for (var s = 1; s < arguments.length; s++) {
    		from = Object(arguments[s]);

    		for (var key in from) {
    			if (hasOwnProperty.call(from, key)) {
    				to[key] = from[key];
    			}
    		}

    		if (getOwnPropertySymbols) {
    			symbols = getOwnPropertySymbols(from);
    			for (var i = 0; i < symbols.length; i++) {
    				if (propIsEnumerable.call(from, symbols[i])) {
    					to[symbols[i]] = from[symbols[i]];
    				}
    			}
    		}
    	}

    	return to;
    };

    var isBufferBrowser = function isBuffer(arg) {
      return arg && typeof arg === 'object'
        && typeof arg.copy === 'function'
        && typeof arg.fill === 'function'
        && typeof arg.readUInt8 === 'function';
    };

    var inherits_browser = createCommonjsModule(function (module) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function () {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
    });

    var util = createCommonjsModule(function (module, exports) {
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    var formatRegExp = /%[sdj%]/g;
    exports.format = function(f) {
      if (!isString(f)) {
        var objects = [];
        for (var i = 0; i < arguments.length; i++) {
          objects.push(inspect(arguments[i]));
        }
        return objects.join(' ');
      }

      var i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(formatRegExp, function(x) {
        if (x === '%%') return '%';
        if (i >= len) return x;
        switch (x) {
          case '%s': return String(args[i++]);
          case '%d': return Number(args[i++]);
          case '%j':
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return '[Circular]';
            }
          default:
            return x;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (isNull(x) || !isObject(x)) {
          str += ' ' + x;
        } else {
          str += ' ' + inspect(x);
        }
      }
      return str;
    };


    // Mark that a method should not be used.
    // Returns a modified function which warns once by default.
    // If --no-deprecation is set, then it is a no-op.
    exports.deprecate = function(fn, msg) {
      // Allow for deprecating things in the process of starting up.
      if (isUndefined(global.process)) {
        return function() {
          return exports.deprecate(fn, msg).apply(this, arguments);
        };
      }

      if (process.noDeprecation === true) {
        return fn;
      }

      var warned = false;
      function deprecated() {
        if (!warned) {
          if (process.throwDeprecation) {
            throw new Error(msg);
          } else if (process.traceDeprecation) {
            console.trace(msg);
          } else {
            console.error(msg);
          }
          warned = true;
        }
        return fn.apply(this, arguments);
      }

      return deprecated;
    };


    var debugs = {};
    var debugEnviron;
    exports.debuglog = function(set) {
      if (isUndefined(debugEnviron))
        debugEnviron = process.env.NODE_DEBUG || '';
      set = set.toUpperCase();
      if (!debugs[set]) {
        if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
          var pid = process.pid;
          debugs[set] = function() {
            var msg = exports.format.apply(exports, arguments);
            console.error('%s %d: %s', set, pid, msg);
          };
        } else {
          debugs[set] = function() {};
        }
      }
      return debugs[set];
    };


    /**
     * Echos the value of a value. Trys to print the value out
     * in the best way possible given the different types.
     *
     * @param {Object} obj The object to print out.
     * @param {Object} opts Optional options object that alters the output.
     */
    /* legacy: obj, showHidden, depth, colors*/
    function inspect(obj, opts) {
      // default options
      var ctx = {
        seen: [],
        stylize: stylizeNoColor
      };
      // legacy...
      if (arguments.length >= 3) ctx.depth = arguments[2];
      if (arguments.length >= 4) ctx.colors = arguments[3];
      if (isBoolean(opts)) {
        // legacy...
        ctx.showHidden = opts;
      } else if (opts) {
        // got an "options" object
        exports._extend(ctx, opts);
      }
      // set default options
      if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
      if (isUndefined(ctx.depth)) ctx.depth = 2;
      if (isUndefined(ctx.colors)) ctx.colors = false;
      if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
      if (ctx.colors) ctx.stylize = stylizeWithColor;
      return formatValue(ctx, obj, ctx.depth);
    }
    exports.inspect = inspect;


    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    inspect.colors = {
      'bold' : [1, 22],
      'italic' : [3, 23],
      'underline' : [4, 24],
      'inverse' : [7, 27],
      'white' : [37, 39],
      'grey' : [90, 39],
      'black' : [30, 39],
      'blue' : [34, 39],
      'cyan' : [36, 39],
      'green' : [32, 39],
      'magenta' : [35, 39],
      'red' : [31, 39],
      'yellow' : [33, 39]
    };

    // Don't use 'blue' not visible on cmd.exe
    inspect.styles = {
      'special': 'cyan',
      'number': 'yellow',
      'boolean': 'yellow',
      'undefined': 'grey',
      'null': 'bold',
      'string': 'green',
      'date': 'magenta',
      // "name": intentionally not styling
      'regexp': 'red'
    };


    function stylizeWithColor(str, styleType) {
      var style = inspect.styles[styleType];

      if (style) {
        return '\u001b[' + inspect.colors[style][0] + 'm' + str +
               '\u001b[' + inspect.colors[style][1] + 'm';
      } else {
        return str;
      }
    }


    function stylizeNoColor(str, styleType) {
      return str;
    }


    function arrayToHash(array) {
      var hash = {};

      array.forEach(function(val, idx) {
        hash[val] = true;
      });

      return hash;
    }


    function formatValue(ctx, value, recurseTimes) {
      // Provide a hook for user-specified inspect functions.
      // Check that value is an object with an inspect function on it
      if (ctx.customInspect &&
          value &&
          isFunction(value.inspect) &&
          // Filter out the util module, it's inspect function is special
          value.inspect !== exports.inspect &&
          // Also filter out any prototype objects using the circular check.
          !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString(ret)) {
          ret = formatValue(ctx, ret, recurseTimes);
        }
        return ret;
      }

      // Primitive types cannot have properties
      var primitive = formatPrimitive(ctx, value);
      if (primitive) {
        return primitive;
      }

      // Look up the keys of the object.
      var keys = Object.keys(value);
      var visibleKeys = arrayToHash(keys);

      if (ctx.showHidden) {
        keys = Object.getOwnPropertyNames(value);
      }

      // IE doesn't make error fields non-enumerable
      // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
      if (isError(value)
          && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
        return formatError(value);
      }

      // Some type of object without properties can be shortcutted.
      if (keys.length === 0) {
        if (isFunction(value)) {
          var name = value.name ? ': ' + value.name : '';
          return ctx.stylize('[Function' + name + ']', 'special');
        }
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
        }
        if (isDate(value)) {
          return ctx.stylize(Date.prototype.toString.call(value), 'date');
        }
        if (isError(value)) {
          return formatError(value);
        }
      }

      var base = '', array = false, braces = ['{', '}'];

      // Make Array say that they are Array
      if (isArray(value)) {
        array = true;
        braces = ['[', ']'];
      }

      // Make functions say that they are functions
      if (isFunction(value)) {
        var n = value.name ? ': ' + value.name : '';
        base = ' [Function' + n + ']';
      }

      // Make RegExps say that they are RegExps
      if (isRegExp(value)) {
        base = ' ' + RegExp.prototype.toString.call(value);
      }

      // Make dates with properties first say the date
      if (isDate(value)) {
        base = ' ' + Date.prototype.toUTCString.call(value);
      }

      // Make error with message first say the error
      if (isError(value)) {
        base = ' ' + formatError(value);
      }

      if (keys.length === 0 && (!array || value.length == 0)) {
        return braces[0] + base + braces[1];
      }

      if (recurseTimes < 0) {
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
        } else {
          return ctx.stylize('[Object]', 'special');
        }
      }

      ctx.seen.push(value);

      var output;
      if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
      } else {
        output = keys.map(function(key) {
          return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
      }

      ctx.seen.pop();

      return reduceToSingleString(output, base, braces);
    }


    function formatPrimitive(ctx, value) {
      if (isUndefined(value))
        return ctx.stylize('undefined', 'undefined');
      if (isString(value)) {
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return ctx.stylize(simple, 'string');
      }
      if (isNumber(value))
        return ctx.stylize('' + value, 'number');
      if (isBoolean(value))
        return ctx.stylize('' + value, 'boolean');
      // For some reason typeof null is "object", so special case here.
      if (isNull(value))
        return ctx.stylize('null', 'null');
    }


    function formatError(value) {
      return '[' + Error.prototype.toString.call(value) + ']';
    }


    function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwnProperty(value, String(i))) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
              String(i), true));
        } else {
          output.push('');
        }
      }
      keys.forEach(function(key) {
        if (!key.match(/^\d+$/)) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
              key, true));
        }
      });
      return output;
    }


    function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
      if (desc.get) {
        if (desc.set) {
          str = ctx.stylize('[Getter/Setter]', 'special');
        } else {
          str = ctx.stylize('[Getter]', 'special');
        }
      } else {
        if (desc.set) {
          str = ctx.stylize('[Setter]', 'special');
        }
      }
      if (!hasOwnProperty(visibleKeys, key)) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
          if (isNull(recurseTimes)) {
            str = formatValue(ctx, desc.value, null);
          } else {
            str = formatValue(ctx, desc.value, recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (array) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = ctx.stylize('[Circular]', 'special');
        }
      }
      if (isUndefined(name)) {
        if (array && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = ctx.stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = ctx.stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    }


    function reduceToSingleString(output, base, braces) {
      var length = output.reduce(function(prev, cur) {
        if (cur.indexOf('\n') >= 0) ;
        return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
      }, 0);

      if (length > 60) {
        return braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];
      }

      return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }


    // NOTE: These type checking functions intentionally don't use `instanceof`
    // because it is fragile and can be easily faked with `Object.create()`.
    function isArray(ar) {
      return Array.isArray(ar);
    }
    exports.isArray = isArray;

    function isBoolean(arg) {
      return typeof arg === 'boolean';
    }
    exports.isBoolean = isBoolean;

    function isNull(arg) {
      return arg === null;
    }
    exports.isNull = isNull;

    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined;

    function isNumber(arg) {
      return typeof arg === 'number';
    }
    exports.isNumber = isNumber;

    function isString(arg) {
      return typeof arg === 'string';
    }
    exports.isString = isString;

    function isSymbol(arg) {
      return typeof arg === 'symbol';
    }
    exports.isSymbol = isSymbol;

    function isUndefined(arg) {
      return arg === void 0;
    }
    exports.isUndefined = isUndefined;

    function isRegExp(re) {
      return isObject(re) && objectToString(re) === '[object RegExp]';
    }
    exports.isRegExp = isRegExp;

    function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    }
    exports.isObject = isObject;

    function isDate(d) {
      return isObject(d) && objectToString(d) === '[object Date]';
    }
    exports.isDate = isDate;

    function isError(e) {
      return isObject(e) &&
          (objectToString(e) === '[object Error]' || e instanceof Error);
    }
    exports.isError = isError;

    function isFunction(arg) {
      return typeof arg === 'function';
    }
    exports.isFunction = isFunction;

    function isPrimitive(arg) {
      return arg === null ||
             typeof arg === 'boolean' ||
             typeof arg === 'number' ||
             typeof arg === 'string' ||
             typeof arg === 'symbol' ||  // ES6 symbol
             typeof arg === 'undefined';
    }
    exports.isPrimitive = isPrimitive;

    exports.isBuffer = isBufferBrowser;

    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }


    function pad(n) {
      return n < 10 ? '0' + n.toString(10) : n.toString(10);
    }


    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                  'Oct', 'Nov', 'Dec'];

    // 26 Feb 16:19:34
    function timestamp() {
      var d = new Date();
      var time = [pad(d.getHours()),
                  pad(d.getMinutes()),
                  pad(d.getSeconds())].join(':');
      return [d.getDate(), months[d.getMonth()], time].join(' ');
    }


    // log is just a thin wrapper to console.log that prepends a timestamp
    exports.log = function() {
      console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
    };


    /**
     * Inherit the prototype methods from one constructor into another.
     *
     * The Function.prototype.inherits from lang.js rewritten as a standalone
     * function (not on Function.prototype). NOTE: If this file is to be loaded
     * during bootstrapping this function needs to be rewritten using some native
     * functions as prototype setup using normal JavaScript does not work as
     * expected during bootstrapping (see mirror.js in r114903).
     *
     * @param {function} ctor Constructor function which needs to inherit the
     *     prototype.
     * @param {function} superCtor Constructor function to inherit prototype from.
     */
    exports.inherits = inherits_browser;

    exports._extend = function(origin, add) {
      // Don't do anything if add isn't an object
      if (!add || !isObject(add)) return origin;

      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    };

    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    });
    var util_1 = util.format;
    var util_2 = util.deprecate;
    var util_3 = util.debuglog;
    var util_4 = util.inspect;
    var util_5 = util.isArray;
    var util_6 = util.isBoolean;
    var util_7 = util.isNull;
    var util_8 = util.isNullOrUndefined;
    var util_9 = util.isNumber;
    var util_10 = util.isString;
    var util_11 = util.isSymbol;
    var util_12 = util.isUndefined;
    var util_13 = util.isRegExp;
    var util_14 = util.isObject;
    var util_15 = util.isDate;
    var util_16 = util.isError;
    var util_17 = util.isFunction;
    var util_18 = util.isPrimitive;
    var util_19 = util.isBuffer;
    var util_20 = util.log;
    var util_21 = util.inherits;
    var util_22 = util._extend;

    var assert_1 = createCommonjsModule(function (module) {



    // compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
    // original notice:

    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */
    function compare(a, b) {
      if (a === b) {
        return 0;
      }

      var x = a.length;
      var y = b.length;

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }

      if (x < y) {
        return -1;
      }
      if (y < x) {
        return 1;
      }
      return 0;
    }
    function isBuffer(b) {
      if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
        return global.Buffer.isBuffer(b);
      }
      return !!(b != null && b._isBuffer);
    }

    // based on node assert, original notice:
    // NB: The URL to the CommonJS spec is kept just for tradition.
    //     node-assert has evolved a lot since then, both in API and behavior.

    // http://wiki.commonjs.org/wiki/Unit_Testing/1.0
    //
    // THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
    //
    // Originally from narwhal.js (http://narwhaljs.org)
    // Copyright (c) 2009 Thomas Robinson <280north.com>
    //
    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the 'Software'), to
    // deal in the Software without restriction, including without limitation the
    // rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    // sell copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
    // ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
    // WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


    var hasOwn = Object.prototype.hasOwnProperty;
    var pSlice = Array.prototype.slice;
    var functionsHaveNames = (function () {
      return function foo() {}.name === 'foo';
    }());
    function pToString (obj) {
      return Object.prototype.toString.call(obj);
    }
    function isView(arrbuf) {
      if (isBuffer(arrbuf)) {
        return false;
      }
      if (typeof global.ArrayBuffer !== 'function') {
        return false;
      }
      if (typeof ArrayBuffer.isView === 'function') {
        return ArrayBuffer.isView(arrbuf);
      }
      if (!arrbuf) {
        return false;
      }
      if (arrbuf instanceof DataView) {
        return true;
      }
      if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
        return true;
      }
      return false;
    }
    // 1. The assert module provides functions that throw
    // AssertionError's when particular conditions are not met. The
    // assert module must conform to the following interface.

    var assert = module.exports = ok;

    // 2. The AssertionError is defined in assert.
    // new assert.AssertionError({ message: message,
    //                             actual: actual,
    //                             expected: expected })

    var regex = /\s*function\s+([^\(\s]*)\s*/;
    // based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
    function getName(func) {
      if (!util.isFunction(func)) {
        return;
      }
      if (functionsHaveNames) {
        return func.name;
      }
      var str = func.toString();
      var match = str.match(regex);
      return match && match[1];
    }
    assert.AssertionError = function AssertionError(options) {
      this.name = 'AssertionError';
      this.actual = options.actual;
      this.expected = options.expected;
      this.operator = options.operator;
      if (options.message) {
        this.message = options.message;
        this.generatedMessage = false;
      } else {
        this.message = getMessage(this);
        this.generatedMessage = true;
      }
      var stackStartFunction = options.stackStartFunction || fail;
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, stackStartFunction);
      } else {
        // non v8 browsers so we can have a stacktrace
        var err = new Error();
        if (err.stack) {
          var out = err.stack;

          // try to strip useless frames
          var fn_name = getName(stackStartFunction);
          var idx = out.indexOf('\n' + fn_name);
          if (idx >= 0) {
            // once we have located the function frame
            // we need to strip out everything before it (and its line)
            var next_line = out.indexOf('\n', idx + 1);
            out = out.substring(next_line + 1);
          }

          this.stack = out;
        }
      }
    };

    // assert.AssertionError instanceof Error
    util.inherits(assert.AssertionError, Error);

    function truncate(s, n) {
      if (typeof s === 'string') {
        return s.length < n ? s : s.slice(0, n);
      } else {
        return s;
      }
    }
    function inspect(something) {
      if (functionsHaveNames || !util.isFunction(something)) {
        return util.inspect(something);
      }
      var rawname = getName(something);
      var name = rawname ? ': ' + rawname : '';
      return '[Function' +  name + ']';
    }
    function getMessage(self) {
      return truncate(inspect(self.actual), 128) + ' ' +
             self.operator + ' ' +
             truncate(inspect(self.expected), 128);
    }

    // At present only the three keys mentioned above are used and
    // understood by the spec. Implementations or sub modules can pass
    // other keys to the AssertionError's constructor - they will be
    // ignored.

    // 3. All of the following functions must throw an AssertionError
    // when a corresponding condition is not met, with a message that
    // may be undefined if not provided.  All assertion methods provide
    // both the actual and expected values to the assertion error for
    // display purposes.

    function fail(actual, expected, message, operator, stackStartFunction) {
      throw new assert.AssertionError({
        message: message,
        actual: actual,
        expected: expected,
        operator: operator,
        stackStartFunction: stackStartFunction
      });
    }

    // EXTENSION! allows for well behaved errors defined elsewhere.
    assert.fail = fail;

    // 4. Pure assertion tests whether a value is truthy, as determined
    // by !!guard.
    // assert.ok(guard, message_opt);
    // This statement is equivalent to assert.equal(true, !!guard,
    // message_opt);. To test strictly for the value true, use
    // assert.strictEqual(true, guard, message_opt);.

    function ok(value, message) {
      if (!value) fail(value, true, message, '==', assert.ok);
    }
    assert.ok = ok;

    // 5. The equality assertion tests shallow, coercive equality with
    // ==.
    // assert.equal(actual, expected, message_opt);

    assert.equal = function equal(actual, expected, message) {
      if (actual != expected) fail(actual, expected, message, '==', assert.equal);
    };

    // 6. The non-equality assertion tests for whether two objects are not equal
    // with != assert.notEqual(actual, expected, message_opt);

    assert.notEqual = function notEqual(actual, expected, message) {
      if (actual == expected) {
        fail(actual, expected, message, '!=', assert.notEqual);
      }
    };

    // 7. The equivalence assertion tests a deep equality relation.
    // assert.deepEqual(actual, expected, message_opt);

    assert.deepEqual = function deepEqual(actual, expected, message) {
      if (!_deepEqual(actual, expected, false)) {
        fail(actual, expected, message, 'deepEqual', assert.deepEqual);
      }
    };

    assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
      if (!_deepEqual(actual, expected, true)) {
        fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
      }
    };

    function _deepEqual(actual, expected, strict, memos) {
      // 7.1. All identical values are equivalent, as determined by ===.
      if (actual === expected) {
        return true;
      } else if (isBuffer(actual) && isBuffer(expected)) {
        return compare(actual, expected) === 0;

      // 7.2. If the expected value is a Date object, the actual value is
      // equivalent if it is also a Date object that refers to the same time.
      } else if (util.isDate(actual) && util.isDate(expected)) {
        return actual.getTime() === expected.getTime();

      // 7.3 If the expected value is a RegExp object, the actual value is
      // equivalent if it is also a RegExp object with the same source and
      // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
      } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
        return actual.source === expected.source &&
               actual.global === expected.global &&
               actual.multiline === expected.multiline &&
               actual.lastIndex === expected.lastIndex &&
               actual.ignoreCase === expected.ignoreCase;

      // 7.4. Other pairs that do not both pass typeof value == 'object',
      // equivalence is determined by ==.
      } else if ((actual === null || typeof actual !== 'object') &&
                 (expected === null || typeof expected !== 'object')) {
        return strict ? actual === expected : actual == expected;

      // If both values are instances of typed arrays, wrap their underlying
      // ArrayBuffers in a Buffer each to increase performance
      // This optimization requires the arrays to have the same type as checked by
      // Object.prototype.toString (aka pToString). Never perform binary
      // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
      // bit patterns are not identical.
      } else if (isView(actual) && isView(expected) &&
                 pToString(actual) === pToString(expected) &&
                 !(actual instanceof Float32Array ||
                   actual instanceof Float64Array)) {
        return compare(new Uint8Array(actual.buffer),
                       new Uint8Array(expected.buffer)) === 0;

      // 7.5 For all other Object pairs, including Array objects, equivalence is
      // determined by having the same number of owned properties (as verified
      // with Object.prototype.hasOwnProperty.call), the same set of keys
      // (although not necessarily the same order), equivalent values for every
      // corresponding key, and an identical 'prototype' property. Note: this
      // accounts for both named and indexed properties on Arrays.
      } else if (isBuffer(actual) !== isBuffer(expected)) {
        return false;
      } else {
        memos = memos || {actual: [], expected: []};

        var actualIndex = memos.actual.indexOf(actual);
        if (actualIndex !== -1) {
          if (actualIndex === memos.expected.indexOf(expected)) {
            return true;
          }
        }

        memos.actual.push(actual);
        memos.expected.push(expected);

        return objEquiv(actual, expected, strict, memos);
      }
    }

    function isArguments(object) {
      return Object.prototype.toString.call(object) == '[object Arguments]';
    }

    function objEquiv(a, b, strict, actualVisitedObjects) {
      if (a === null || a === undefined || b === null || b === undefined)
        return false;
      // if one is a primitive, the other must be same
      if (util.isPrimitive(a) || util.isPrimitive(b))
        return a === b;
      if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;
      var aIsArgs = isArguments(a);
      var bIsArgs = isArguments(b);
      if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
        return false;
      if (aIsArgs) {
        a = pSlice.call(a);
        b = pSlice.call(b);
        return _deepEqual(a, b, strict);
      }
      var ka = objectKeys(a);
      var kb = objectKeys(b);
      var key, i;
      // having the same number of owned properties (keys incorporates
      // hasOwnProperty)
      if (ka.length !== kb.length)
        return false;
      //the same set of keys (although not necessarily the same order),
      ka.sort();
      kb.sort();
      //~~~cheap key test
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] !== kb[i])
          return false;
      }
      //equivalent values for every corresponding key, and
      //~~~possibly expensive deep test
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
          return false;
      }
      return true;
    }

    // 8. The non-equivalence assertion tests for any deep inequality.
    // assert.notDeepEqual(actual, expected, message_opt);

    assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
      if (_deepEqual(actual, expected, false)) {
        fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
      }
    };

    assert.notDeepStrictEqual = notDeepStrictEqual;
    function notDeepStrictEqual(actual, expected, message) {
      if (_deepEqual(actual, expected, true)) {
        fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
      }
    }


    // 9. The strict equality assertion tests strict equality, as determined by ===.
    // assert.strictEqual(actual, expected, message_opt);

    assert.strictEqual = function strictEqual(actual, expected, message) {
      if (actual !== expected) {
        fail(actual, expected, message, '===', assert.strictEqual);
      }
    };

    // 10. The strict non-equality assertion tests for strict inequality, as
    // determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

    assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
      if (actual === expected) {
        fail(actual, expected, message, '!==', assert.notStrictEqual);
      }
    };

    function expectedException(actual, expected) {
      if (!actual || !expected) {
        return false;
      }

      if (Object.prototype.toString.call(expected) == '[object RegExp]') {
        return expected.test(actual);
      }

      try {
        if (actual instanceof expected) {
          return true;
        }
      } catch (e) {
        // Ignore.  The instanceof check doesn't work for arrow functions.
      }

      if (Error.isPrototypeOf(expected)) {
        return false;
      }

      return expected.call({}, actual) === true;
    }

    function _tryBlock(block) {
      var error;
      try {
        block();
      } catch (e) {
        error = e;
      }
      return error;
    }

    function _throws(shouldThrow, block, expected, message) {
      var actual;

      if (typeof block !== 'function') {
        throw new TypeError('"block" argument must be a function');
      }

      if (typeof expected === 'string') {
        message = expected;
        expected = null;
      }

      actual = _tryBlock(block);

      message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
                (message ? ' ' + message : '.');

      if (shouldThrow && !actual) {
        fail(actual, expected, 'Missing expected exception' + message);
      }

      var userProvidedMessage = typeof message === 'string';
      var isUnwantedException = !shouldThrow && util.isError(actual);
      var isUnexpectedException = !shouldThrow && actual && !expected;

      if ((isUnwantedException &&
          userProvidedMessage &&
          expectedException(actual, expected)) ||
          isUnexpectedException) {
        fail(actual, expected, 'Got unwanted exception' + message);
      }

      if ((shouldThrow && actual && expected &&
          !expectedException(actual, expected)) || (!shouldThrow && actual)) {
        throw actual;
      }
    }

    // 11. Expected to throw an error:
    // assert.throws(block, Error_opt, message_opt);

    assert.throws = function(block, /*optional*/error, /*optional*/message) {
      _throws(true, block, error, message);
    };

    // EXTENSION! This is annoying to write outside this module.
    assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
      _throws(false, block, error, message);
    };

    assert.ifError = function(err) { if (err) throw err; };

    // Expose a strict only variant of assert
    function strict(value, message) {
      if (!value) fail(value, true, message, '==', strict);
    }
    assert.strict = objectAssign(strict, assert, {
      equal: assert.strictEqual,
      deepEqual: assert.deepStrictEqual,
      notEqual: assert.notStrictEqual,
      notDeepEqual: assert.notDeepStrictEqual
    });
    assert.strict.strict = assert.strict;

    var objectKeys = Object.keys || function (obj) {
      var keys = [];
      for (var key in obj) {
        if (hasOwn.call(obj, key)) keys.push(key);
      }
      return keys;
    };
    });

    var gridIndex = GridIndex;

    var NUM_PARAMS = 3;

    function GridIndex(extent, n, padding) {
        var cells = this.cells = [];

        if (extent instanceof ArrayBuffer) {
            this.arrayBuffer = extent;
            var array = new Int32Array(this.arrayBuffer);
            extent = array[0];
            n = array[1];
            padding = array[2];

            this.d = n + 2 * padding;
            for (var k = 0; k < this.d * this.d; k++) {
                var start = array[NUM_PARAMS + k];
                var end = array[NUM_PARAMS + k + 1];
                cells.push(start === end ?
                        null :
                        array.subarray(start, end));
            }
            var keysOffset = array[NUM_PARAMS + cells.length];
            var bboxesOffset = array[NUM_PARAMS + cells.length + 1];
            this.keys = array.subarray(keysOffset, bboxesOffset);
            this.bboxes = array.subarray(bboxesOffset);

            this.insert = this._insertReadonly;

        } else {
            this.d = n + 2 * padding;
            for (var i = 0; i < this.d * this.d; i++) {
                cells.push([]);
            }
            this.keys = [];
            this.bboxes = [];
        }

        this.n = n;
        this.extent = extent;
        this.padding = padding;
        this.scale = n / extent;
        this.uid = 0;

        var p = (padding / n) * extent;
        this.min = -p;
        this.max = extent + p;
    }


    GridIndex.prototype.insert = function(key, x1, y1, x2, y2) {
        this._forEachCell(x1, y1, x2, y2, this._insertCell, this.uid++);
        this.keys.push(key);
        this.bboxes.push(x1);
        this.bboxes.push(y1);
        this.bboxes.push(x2);
        this.bboxes.push(y2);
    };

    GridIndex.prototype._insertReadonly = function() {
        throw 'Cannot insert into a GridIndex created from an ArrayBuffer.';
    };

    GridIndex.prototype._insertCell = function(x1, y1, x2, y2, cellIndex, uid) {
        this.cells[cellIndex].push(uid);
    };

    GridIndex.prototype.query = function(x1, y1, x2, y2, intersectionTest) {
        var min = this.min;
        var max = this.max;
        if (x1 <= min && y1 <= min && max <= x2 && max <= y2 && !intersectionTest) {
            // We use `Array#slice` because `this.keys` may be a `Int32Array` and
            // some browsers (Safari and IE) do not support `TypedArray#slice`
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice#Browser_compatibility
            return Array.prototype.slice.call(this.keys);

        } else {
            var result = [];
            var seenUids = {};
            this._forEachCell(x1, y1, x2, y2, this._queryCell, result, seenUids, intersectionTest);
            return result;
        }
    };

    GridIndex.prototype._queryCell = function(x1, y1, x2, y2, cellIndex, result, seenUids, intersectionTest) {
        var cell = this.cells[cellIndex];
        if (cell !== null) {
            var keys = this.keys;
            var bboxes = this.bboxes;
            for (var u = 0; u < cell.length; u++) {
                var uid = cell[u];
                if (seenUids[uid] === undefined) {
                    var offset = uid * 4;
                    if (intersectionTest ?
                        intersectionTest(bboxes[offset + 0], bboxes[offset + 1], bboxes[offset + 2], bboxes[offset + 3]) :
                        ((x1 <= bboxes[offset + 2]) &&
                        (y1 <= bboxes[offset + 3]) &&
                        (x2 >= bboxes[offset + 0]) &&
                        (y2 >= bboxes[offset + 1]))) {
                        seenUids[uid] = true;
                        result.push(keys[uid]);
                    } else {
                        seenUids[uid] = false;
                    }
                }
            }
        }
    };

    GridIndex.prototype._forEachCell = function(x1, y1, x2, y2, fn, arg1, arg2, intersectionTest) {
        var cx1 = this._convertToCellCoord(x1);
        var cy1 = this._convertToCellCoord(y1);
        var cx2 = this._convertToCellCoord(x2);
        var cy2 = this._convertToCellCoord(y2);
        for (var x = cx1; x <= cx2; x++) {
            for (var y = cy1; y <= cy2; y++) {
                var cellIndex = this.d * y + x;
                if (intersectionTest && !intersectionTest(
                            this._convertFromCellCoord(x),
                            this._convertFromCellCoord(y),
                            this._convertFromCellCoord(x + 1),
                            this._convertFromCellCoord(y + 1))) continue;
                if (fn.call(this, x1, y1, x2, y2, cellIndex, arg1, arg2, intersectionTest)) return;
            }
        }
    };

    GridIndex.prototype._convertFromCellCoord = function(x) {
        return (x - this.padding) / this.scale;
    };

    GridIndex.prototype._convertToCellCoord = function(x) {
        return Math.max(0, Math.min(this.d - 1, Math.floor(x * this.scale) + this.padding));
    };

    GridIndex.prototype.toArrayBuffer = function() {
        if (this.arrayBuffer) return this.arrayBuffer;

        var cells = this.cells;

        var metadataLength = NUM_PARAMS + this.cells.length + 1 + 1;
        var totalCellLength = 0;
        for (var i = 0; i < this.cells.length; i++) {
            totalCellLength += this.cells[i].length;
        }

        var array = new Int32Array(metadataLength + totalCellLength + this.keys.length + this.bboxes.length);
        array[0] = this.extent;
        array[1] = this.n;
        array[2] = this.padding;

        var offset = metadataLength;
        for (var k = 0; k < cells.length; k++) {
            var cell = cells[k];
            array[NUM_PARAMS + k] = offset;
            array.set(cell, offset);
            offset += cell.length;
        }

        array[NUM_PARAMS + cells.length] = offset;
        array.set(this.keys, offset);
        offset += this.keys.length;

        array[NUM_PARAMS + cells.length + 1] = offset;
        array.set(this.bboxes, offset);
        offset += this.bboxes.length;

        return array.buffer;
    };

    var csscolorparser = createCommonjsModule(function (module, exports) {
    // (c) Dean McNamee <dean@gmail.com>, 2012.
    //
    // https://github.com/deanm/css-color-parser-js
    //
    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to
    // deal in the Software without restriction, including without limitation the
    // rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
    // sell copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in
    // all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    // FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    // IN THE SOFTWARE.

    // http://www.w3.org/TR/css3-color/
    var kCSSColorTable = {
      "transparent": [0,0,0,0], "aliceblue": [240,248,255,1],
      "antiquewhite": [250,235,215,1], "aqua": [0,255,255,1],
      "aquamarine": [127,255,212,1], "azure": [240,255,255,1],
      "beige": [245,245,220,1], "bisque": [255,228,196,1],
      "black": [0,0,0,1], "blanchedalmond": [255,235,205,1],
      "blue": [0,0,255,1], "blueviolet": [138,43,226,1],
      "brown": [165,42,42,1], "burlywood": [222,184,135,1],
      "cadetblue": [95,158,160,1], "chartreuse": [127,255,0,1],
      "chocolate": [210,105,30,1], "coral": [255,127,80,1],
      "cornflowerblue": [100,149,237,1], "cornsilk": [255,248,220,1],
      "crimson": [220,20,60,1], "cyan": [0,255,255,1],
      "darkblue": [0,0,139,1], "darkcyan": [0,139,139,1],
      "darkgoldenrod": [184,134,11,1], "darkgray": [169,169,169,1],
      "darkgreen": [0,100,0,1], "darkgrey": [169,169,169,1],
      "darkkhaki": [189,183,107,1], "darkmagenta": [139,0,139,1],
      "darkolivegreen": [85,107,47,1], "darkorange": [255,140,0,1],
      "darkorchid": [153,50,204,1], "darkred": [139,0,0,1],
      "darksalmon": [233,150,122,1], "darkseagreen": [143,188,143,1],
      "darkslateblue": [72,61,139,1], "darkslategray": [47,79,79,1],
      "darkslategrey": [47,79,79,1], "darkturquoise": [0,206,209,1],
      "darkviolet": [148,0,211,1], "deeppink": [255,20,147,1],
      "deepskyblue": [0,191,255,1], "dimgray": [105,105,105,1],
      "dimgrey": [105,105,105,1], "dodgerblue": [30,144,255,1],
      "firebrick": [178,34,34,1], "floralwhite": [255,250,240,1],
      "forestgreen": [34,139,34,1], "fuchsia": [255,0,255,1],
      "gainsboro": [220,220,220,1], "ghostwhite": [248,248,255,1],
      "gold": [255,215,0,1], "goldenrod": [218,165,32,1],
      "gray": [128,128,128,1], "green": [0,128,0,1],
      "greenyellow": [173,255,47,1], "grey": [128,128,128,1],
      "honeydew": [240,255,240,1], "hotpink": [255,105,180,1],
      "indianred": [205,92,92,1], "indigo": [75,0,130,1],
      "ivory": [255,255,240,1], "khaki": [240,230,140,1],
      "lavender": [230,230,250,1], "lavenderblush": [255,240,245,1],
      "lawngreen": [124,252,0,1], "lemonchiffon": [255,250,205,1],
      "lightblue": [173,216,230,1], "lightcoral": [240,128,128,1],
      "lightcyan": [224,255,255,1], "lightgoldenrodyellow": [250,250,210,1],
      "lightgray": [211,211,211,1], "lightgreen": [144,238,144,1],
      "lightgrey": [211,211,211,1], "lightpink": [255,182,193,1],
      "lightsalmon": [255,160,122,1], "lightseagreen": [32,178,170,1],
      "lightskyblue": [135,206,250,1], "lightslategray": [119,136,153,1],
      "lightslategrey": [119,136,153,1], "lightsteelblue": [176,196,222,1],
      "lightyellow": [255,255,224,1], "lime": [0,255,0,1],
      "limegreen": [50,205,50,1], "linen": [250,240,230,1],
      "magenta": [255,0,255,1], "maroon": [128,0,0,1],
      "mediumaquamarine": [102,205,170,1], "mediumblue": [0,0,205,1],
      "mediumorchid": [186,85,211,1], "mediumpurple": [147,112,219,1],
      "mediumseagreen": [60,179,113,1], "mediumslateblue": [123,104,238,1],
      "mediumspringgreen": [0,250,154,1], "mediumturquoise": [72,209,204,1],
      "mediumvioletred": [199,21,133,1], "midnightblue": [25,25,112,1],
      "mintcream": [245,255,250,1], "mistyrose": [255,228,225,1],
      "moccasin": [255,228,181,1], "navajowhite": [255,222,173,1],
      "navy": [0,0,128,1], "oldlace": [253,245,230,1],
      "olive": [128,128,0,1], "olivedrab": [107,142,35,1],
      "orange": [255,165,0,1], "orangered": [255,69,0,1],
      "orchid": [218,112,214,1], "palegoldenrod": [238,232,170,1],
      "palegreen": [152,251,152,1], "paleturquoise": [175,238,238,1],
      "palevioletred": [219,112,147,1], "papayawhip": [255,239,213,1],
      "peachpuff": [255,218,185,1], "peru": [205,133,63,1],
      "pink": [255,192,203,1], "plum": [221,160,221,1],
      "powderblue": [176,224,230,1], "purple": [128,0,128,1],
      "rebeccapurple": [102,51,153,1],
      "red": [255,0,0,1], "rosybrown": [188,143,143,1],
      "royalblue": [65,105,225,1], "saddlebrown": [139,69,19,1],
      "salmon": [250,128,114,1], "sandybrown": [244,164,96,1],
      "seagreen": [46,139,87,1], "seashell": [255,245,238,1],
      "sienna": [160,82,45,1], "silver": [192,192,192,1],
      "skyblue": [135,206,235,1], "slateblue": [106,90,205,1],
      "slategray": [112,128,144,1], "slategrey": [112,128,144,1],
      "snow": [255,250,250,1], "springgreen": [0,255,127,1],
      "steelblue": [70,130,180,1], "tan": [210,180,140,1],
      "teal": [0,128,128,1], "thistle": [216,191,216,1],
      "tomato": [255,99,71,1], "turquoise": [64,224,208,1],
      "violet": [238,130,238,1], "wheat": [245,222,179,1],
      "white": [255,255,255,1], "whitesmoke": [245,245,245,1],
      "yellow": [255,255,0,1], "yellowgreen": [154,205,50,1]};

    function clamp_css_byte(i) {  // Clamp to integer 0 .. 255.
      i = Math.round(i);  // Seems to be what Chrome does (vs truncation).
      return i < 0 ? 0 : i > 255 ? 255 : i;
    }

    function clamp_css_float(f) {  // Clamp to float 0.0 .. 1.0.
      return f < 0 ? 0 : f > 1 ? 1 : f;
    }

    function parse_css_int(str) {  // int or percentage.
      if (str[str.length - 1] === '%')
        return clamp_css_byte(parseFloat(str) / 100 * 255);
      return clamp_css_byte(parseInt(str));
    }

    function parse_css_float(str) {  // float or percentage.
      if (str[str.length - 1] === '%')
        return clamp_css_float(parseFloat(str) / 100);
      return clamp_css_float(parseFloat(str));
    }

    function css_hue_to_rgb(m1, m2, h) {
      if (h < 0) h += 1;
      else if (h > 1) h -= 1;

      if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
      if (h * 2 < 1) return m2;
      if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
      return m1;
    }

    function parseCSSColor(css_str) {
      // Remove all whitespace, not compliant, but should just be more accepting.
      var str = css_str.replace(/ /g, '').toLowerCase();

      // Color keywords (and transparent) lookup.
      if (str in kCSSColorTable) return kCSSColorTable[str].slice();  // dup.

      // #abc and #abc123 syntax.
      if (str[0] === '#') {
        if (str.length === 4) {
          var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
          if (!(iv >= 0 && iv <= 0xfff)) return null;  // Covers NaN.
          return [((iv & 0xf00) >> 4) | ((iv & 0xf00) >> 8),
                  (iv & 0xf0) | ((iv & 0xf0) >> 4),
                  (iv & 0xf) | ((iv & 0xf) << 4),
                  1];
        } else if (str.length === 7) {
          var iv = parseInt(str.substr(1), 16);  // TODO(deanm): Stricter parsing.
          if (!(iv >= 0 && iv <= 0xffffff)) return null;  // Covers NaN.
          return [(iv & 0xff0000) >> 16,
                  (iv & 0xff00) >> 8,
                  iv & 0xff,
                  1];
        }

        return null;
      }

      var op = str.indexOf('('), ep = str.indexOf(')');
      if (op !== -1 && ep + 1 === str.length) {
        var fname = str.substr(0, op);
        var params = str.substr(op+1, ep-(op+1)).split(',');
        var alpha = 1;  // To allow case fallthrough.
        switch (fname) {
          case 'rgba':
            if (params.length !== 4) return null;
            alpha = parse_css_float(params.pop());
            // Fall through.
          case 'rgb':
            if (params.length !== 3) return null;
            return [parse_css_int(params[0]),
                    parse_css_int(params[1]),
                    parse_css_int(params[2]),
                    alpha];
          case 'hsla':
            if (params.length !== 4) return null;
            alpha = parse_css_float(params.pop());
            // Fall through.
          case 'hsl':
            if (params.length !== 3) return null;
            var h = (((parseFloat(params[0]) % 360) + 360) % 360) / 360;  // 0 .. 1
            // NOTE(deanm): According to the CSS spec s/l should only be
            // percentages, but we don't bother and let float or percentage.
            var s = parse_css_float(params[1]);
            var l = parse_css_float(params[2]);
            var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            var m1 = l * 2 - m2;
            return [clamp_css_byte(css_hue_to_rgb(m1, m2, h+1/3) * 255),
                    clamp_css_byte(css_hue_to_rgb(m1, m2, h) * 255),
                    clamp_css_byte(css_hue_to_rgb(m1, m2, h-1/3) * 255),
                    alpha];
          default:
            return null;
        }
      }

      return null;
    }

    try { exports.parseCSSColor = parseCSSColor; } catch(e) { }
    });
    var csscolorparser_1 = csscolorparser.parseCSSColor;

    //      

    /**
     * An RGBA color value. Create instances from color strings using the static
     * method `Color.parse`. The constructor accepts RGB channel values in the range
     * `[0, 1]`, premultiplied by A.
     *
     * @param {number} r The red channel.
     * @param {number} g The green channel.
     * @param {number} b The blue channel.
     * @param {number} a The alpha channel.
     * @private
     */
    class Color {
                  
                  
                  
                  

        constructor(r        , g        , b        , a         = 1) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

                            
                            
                                  
                          

        /**
         * Parses valid CSS color strings and returns a `Color` instance.
         * @returns A `Color` instance, or `undefined` if the input is not a valid color string.
         */
        static parse(input         )               {
            if (!input) {
                return undefined;
            }

            if (input instanceof Color) {
                return input;
            }

            if (typeof input !== 'string') {
                return undefined;
            }

            const rgba = csscolorparser_1(input);
            if (!rgba) {
                return undefined;
            }

            return new Color(
                rgba[0] / 255 * rgba[3],
                rgba[1] / 255 * rgba[3],
                rgba[2] / 255 * rgba[3],
                rgba[3]
            );
        }

        /**
         * Returns an RGBA string representing the color value.
         *
         * @returns An RGBA string.
         * @example
         * var purple = new Color.parse('purple');
         * purple.toString; // = "rgba(128,0,128,1)"
         * var translucentGreen = new Color.parse('rgba(26, 207, 26, .73)');
         * translucentGreen.toString(); // = "rgba(26,207,26,0.73)"
         */
        toString()         {
            const [r, g, b, a] = this.toArray();
            return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
        }

        toArray()                                   {
            const {r, g, b, a} = this;
            return a === 0 ? [0, 0, 0, 0] : [
                r * 255 / a,
                g * 255 / a,
                b * 255 / a,
                a
            ];
        }
    }

    Color.black = new Color(0, 0, 0, 1);
    Color.white = new Color(1, 1, 1, 1);
    Color.transparent = new Color(0, 0, 0, 0);
    Color.red = new Color(1, 0, 0, 1);

    function extend (output, ...inputs) {
        for (const input of inputs) {
            for (const k in input) {
                output[k] = input[k];
            }
        }
        return output;
    }

    //      

    class ParsingError extends Error {
                    
                        
        constructor(key        , message        ) {
            super(message);
            this.message = message;
            this.key = key;
        }
    }

    //      

                                                 

    /**
     * Tracks `let` bindings during expression parsing.
     * @private
     */
    class Scope {
                       
                                         
        constructor(parent        , bindings                              = []) {
            this.parent = parent;
            this.bindings = {};
            for (const [name, expression] of bindings) {
                this.bindings[name] = expression;
            }
        }

        concat(bindings                             ) {
            return new Scope(this, bindings);
        }

        get(name        )             {
            if (this.bindings[name]) { return this.bindings[name]; }
            if (this.parent) { return this.parent.get(name); }
            throw new Error(`${name} not found in scope.`);
        }

        has(name        )          {
            if (this.bindings[name]) return true;
            return this.parent ? this.parent.has(name) : false;
        }
    }

    //      

                                             
                                                 
                                                 
                                                   
                                               
                                                 
                                               
                                               
                                                     
                                                       

                                                                                

                      
                   
                     
                     
                      
                    
                     
                    
                                                               
                    
                       
                      

                             
                      
                       
                  
     

    const NullType = { kind: 'null' };
    const NumberType = { kind: 'number' };
    const StringType = { kind: 'string' };
    const BooleanType = { kind: 'boolean' };
    const ColorType = { kind: 'color' };
    const ObjectType = { kind: 'object' };
    const ValueType = { kind: 'value' };
    const ErrorType = { kind: 'error' };
    const CollatorType = { kind: 'collator' };
    const FormattedType = { kind: 'formatted' };

    function array(itemType      , N         )            {
        return {
            kind: 'array',
            itemType,
            N
        };
    }

    function toString(type      )         {
        if (type.kind === 'array') {
            const itemType = toString(type.itemType);
            return typeof type.N === 'number' ?
                `array<${itemType}, ${type.N}>` :
                type.itemType.kind === 'value' ? 'array' : `array<${itemType}>`;
        } else {
            return type.kind;
        }
    }

    const valueMemberTypes = [
        NullType,
        NumberType,
        StringType,
        BooleanType,
        ColorType,
        FormattedType,
        ObjectType,
        array(ValueType)
    ];

    /**
     * Returns null if `t` is a subtype of `expected`; otherwise returns an
     * error message.
     * @private
     */
    function checkSubtype(expected      , t      )          {
        if (t.kind === 'error') {
            // Error is a subtype of every type
            return null;
        } else if (expected.kind === 'array') {
            if (t.kind === 'array' &&
                ((t.N === 0 && t.itemType.kind === 'value') || !checkSubtype(expected.itemType, t.itemType)) &&
                (typeof expected.N !== 'number' || expected.N === t.N)) {
                return null;
            }
        } else if (expected.kind === t.kind) {
            return null;
        } else if (expected.kind === 'value') {
            for (const memberType of valueMemberTypes) {
                if (!checkSubtype(memberType, t)) {
                    return null;
                }
            }
        }

        return `Expected ${toString(expected)} but found ${toString(t)} instead.`;
    }

    //      

    // Flow type declarations for Intl cribbed from
    // https://github.com/facebook/flow/issues/1270

                       
                                      
      

                                 
                     
                                        
                                     
                         

                
                                        
                                     
                         

                                               

                               
     

                            
                                              
                                  
                                                             
                                    
                          
                                               
     

    class Collator {
                              
                                                            
                                

        constructor(caseSensitive         , diacriticSensitive         , locale               ) {
            if (caseSensitive)
                this.sensitivity = diacriticSensitive ? 'variant' : 'case';
            else
                this.sensitivity = diacriticSensitive ? 'accent' : 'base';

            this.locale = locale;
            this.collator = new Intl.Collator(this.locale ? this.locale : [],
                { sensitivity: this.sensitivity, usage: 'search' });
        }

        compare(lhs        , rhs        )         {
            return this.collator.compare(lhs, rhs);
        }

        resolvedLocale()         {
            // We create a Collator without "usage: search" because we don't want
            // the search options encoded in our result (e.g. "en-u-co-search")
            return new Intl.Collator(this.locale ? this.locale : [])
                .resolvedOptions().locale;
        }
    }

    //      

    class FormattedSection {
                     
                             
                                 

        constructor(text        , scale               , fontStack               ) {
            this.text = text;
            this.scale = scale;
            this.fontStack = fontStack;
        }
    }

    class Formatted {
                                          

        constructor(sections                         ) {
            this.sections = sections;
        }

        static fromString(unformatted        )            {
            return new Formatted([new FormattedSection(unformatted, null, null)]);
        }

        toString()         {
            return this.sections.map(section => section.text).join('');
        }

        serialize() {
            const serialized = ["format"];
            for (const section of this.sections) {
                serialized.push(section.text);
                const options = {};
                if (section.fontStack) {
                    options["text-font"] = ["literal", section.fontStack.split(',')];
                }
                if (section.scale) {
                    options["font-scale"] = section.scale;
                }
                serialized.push(options);
            }
            return serialized;
        }
    }

    //      

                                        

    function validateRGBA(r       , g       , b       , a        )          {
        if (!(
            typeof r === 'number' && r >= 0 && r <= 255 &&
            typeof g === 'number' && g >= 0 && g <= 255 &&
            typeof b === 'number' && b >= 0 && b <= 255
        )) {
            const value = typeof a === 'number' ? [r, g, b, a] : [r, g, b];
            return `Invalid rgba value [${value.join(', ')}]: 'r', 'g', and 'b' must be between 0 and 255.`;
        }

        if (!(
            typeof a === 'undefined' || (typeof a === 'number' && a >= 0 && a <= 1)
        )) {
            return `Invalid rgba value [${[r, g, b, a].join(', ')}]: 'a' must be between 0 and 1.`;
        }

        return null;
    }

                                                                                                                                      

    function isValue(mixed       )          {
        if (mixed === null) {
            return true;
        } else if (typeof mixed === 'string') {
            return true;
        } else if (typeof mixed === 'boolean') {
            return true;
        } else if (typeof mixed === 'number') {
            return true;
        } else if (mixed instanceof Color) {
            return true;
        } else if (mixed instanceof Collator) {
            return true;
        } else if (mixed instanceof Formatted) {
            return true;
        } else if (Array.isArray(mixed)) {
            for (const item of mixed) {
                if (!isValue(item)) {
                    return false;
                }
            }
            return true;
        } else if (typeof mixed === 'object') {
            for (const key in mixed) {
                if (!isValue(mixed[key])) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    function typeOf(value       )       {
        if (value === null) {
            return NullType;
        } else if (typeof value === 'string') {
            return StringType;
        } else if (typeof value === 'boolean') {
            return BooleanType;
        } else if (typeof value === 'number') {
            return NumberType;
        } else if (value instanceof Color) {
            return ColorType;
        } else if (value instanceof Collator) {
            return CollatorType;
        } else if (value instanceof Formatted) {
            return FormattedType;
        } else if (Array.isArray(value)) {
            const length = value.length;
            let itemType       ;

            for (const item of value) {
                const t = typeOf(item);
                if (!itemType) {
                    itemType = t;
                } else if (itemType === t) {
                    continue;
                } else {
                    itemType = ValueType;
                    break;
                }
            }

            return array(itemType || ValueType, length);
        } else {
            assert_1(typeof value === 'object');
            return ObjectType;
        }
    }

    function toString$1(value       ) {
        const type = typeof value;
        if (value === null) {
            return '';
        } else if (type === 'string' || type === 'number' || type === 'boolean') {
            return String(value);
        } else if (value instanceof Color || value instanceof Formatted) {
            return value.toString();
        } else {
            return JSON.stringify(value);
        }
    }

    //      

                                         
                                            
                                                    
                                                         

    class Literal                       {
                   
                     

        constructor(type      , value       ) {
            this.type = type;
            this.value = value;
        }

        static parse(args              , context                ) {
            if (args.length !== 2)
                return context.error(`'literal' expression requires exactly one argument, but found ${args.length - 1} instead.`);

            if (!isValue(args[1]))
                return context.error(`invalid value`);

            const value = (args[1]     );
            let type = typeOf(value);

            // special case: infer the item type if possible for zero-length arrays
            const expected = context.expectedType;
            if (
                type.kind === 'array' &&
                type.N === 0 &&
                expected &&
                expected.kind === 'array' &&
                (typeof expected.N !== 'number' || expected.N === 0)
            ) {
                type = expected;
            }

            return new Literal(type, value);
        }

        evaluate() {
            return this.value;
        }

        eachChild() {}

        possibleOutputs() {
            return [this.value];
        }

        serialize()               {
            if (this.type.kind === 'array' || this.type.kind === 'object') {
                return ["literal", this.value];
            } else if (this.value instanceof Color) {
                // Constant-folding can generate Literal expressions that you
                // couldn't actually generate with a "literal" expression,
                // so we have to implement an equivalent serialization here
                return ["rgba"].concat(this.value.toArray());
            } else if (this.value instanceof Formatted) {
                // Same as Color
                return this.value.serialize();
            } else {
                assert_1(this.value === null ||
                    typeof this.value === 'string' ||
                    typeof this.value === 'number' ||
                    typeof this.value === 'boolean');
                return (this.value     );
            }
        }
    }

    //      

    class RuntimeError {
                     
                        

        constructor(message        ) {
            this.name = 'ExpressionEvaluationError';
            this.message = message;
        }

        toJSON() {
            return this.message;
        }
    }

    //      

                                                    
                                                         
                                                               
                                           
                                         

    const types = {
        string: StringType,
        number: NumberType,
        boolean: BooleanType,
        object: ObjectType
    };

    class Assertion                       {
                   
                                

        constructor(type      , args                   ) {
            this.type = type;
            this.args = args;
        }

        static parse(args              , context                )              {
            if (args.length < 2)
                return context.error(`Expected at least one argument.`);

            let i = 1;
            let type;

            const name         = (args[0]     );
            if (name === 'array') {
                let itemType;
                if (args.length > 2) {
                    const type = args[1];
                    if (typeof type !== 'string' || !(type in types) || type === 'object')
                        return context.error('The item type argument of "array" must be one of string, number, boolean', 1);
                    itemType = types[type];
                    i++;
                } else {
                    itemType = ValueType;
                }

                let N;
                if (args.length > 3) {
                    if (args[2] !== null &&
                        (typeof args[2] !== 'number' ||
                            args[2] < 0 ||
                            args[2] !== Math.floor(args[2]))
                    ) {
                        return context.error('The length argument to "array" must be a positive integer literal', 2);
                    }
                    N = args[2];
                    i++;
                }

                type = array(itemType, N);
            } else {
                assert_1(types[name], name);
                type = types[name];
            }

            const parsed = [];
            for (; i < args.length; i++) {
                const input = context.parse(args[i], i, ValueType);
                if (!input) return null;
                parsed.push(input);
            }

            return new Assertion(type, parsed);
        }

        evaluate(ctx                   ) {
            for (let i = 0; i < this.args.length; i++) {
                const value = this.args[i].evaluate(ctx);
                const error = checkSubtype(this.type, typeOf(value));
                if (!error) {
                    return value;
                } else if (i === this.args.length - 1) {
                    throw new RuntimeError(`Expected value to be of type ${toString(this.type)}, but found ${toString(typeOf(value))} instead.`);
                }
            }

            assert_1(false);
            return null;
        }

        eachChild(fn                      ) {
            this.args.forEach(fn);
        }

        possibleOutputs()                      {
            return [].concat(...this.args.map((arg) => arg.possibleOutputs()));
        }

        serialize()               {
            const type = this.type;
            const serialized = [type.kind];
            if (type.kind === 'array') {
                const itemType = type.itemType;
                if (itemType.kind === 'string' ||
                    itemType.kind === 'number' ||
                    itemType.kind === 'boolean') {
                    serialized.push(itemType.kind);
                    const N = type.N;
                    if (typeof N === 'number' || this.args.length > 1) {
                        serialized.push(N);
                    }
                }
            }
            return serialized.concat(this.args.map(arg => arg.serialize()));
        }
    }

    //      

                                                    
                                                               
                                                         
                                         

                                       
                         
                                 
                                
     

    class FormatExpression                       {
                   
                                                    

        constructor(sections                                   ) {
            this.type = FormattedType;
            this.sections = sections;
        }

        static parse(args              , context                )              {
            if (args.length < 3) {
                return context.error(`Expected at least two arguments.`);
            }

            if ((args.length - 1) % 2 !== 0) {
                return context.error(`Expected an even number of arguments.`);
            }

            const sections                                    = [];
            for (let i = 1; i < args.length - 1; i += 2) {
                const text = context.parse(args[i], 1, ValueType);
                if (!text) return null;
                const kind = text.type.kind;
                if (kind !== 'string' && kind !== 'value' && kind !== 'null')
                    return context.error(`Formatted text type must be 'string', 'value', or 'null'.`);

                const options = (args[i + 1]     );
                if (typeof options !== "object" || Array.isArray(options))
                    return context.error(`Format options argument must be an object.`);

                let scale = null;
                if (options['font-scale']) {
                    scale = context.parse(options['font-scale'], 1, NumberType);
                    if (!scale) return null;
                }

                let font = null;
                if (options['text-font']) {
                    font = context.parse(options['text-font'], 1, array(StringType));
                    if (!font) return null;
                }
                sections.push({text, scale, font});
            }

            return new FormatExpression(sections);
        }

        evaluate(ctx                   ) {
            return new Formatted(
                this.sections.map(section =>
                    new FormattedSection(
                        toString$1(section.text.evaluate(ctx)),
                        section.scale ? section.scale.evaluate(ctx) : null,
                        section.font ? section.font.evaluate(ctx).join(',') : null
                    )
                )
            );
        }

        eachChild(fn                      ) {
            for (const section of this.sections) {
                fn(section.text);
                if (section.scale) {
                    fn(section.scale);
                }
                if (section.font) {
                    fn(section.font);
                }
            }
        }

        possibleOutputs() {
            // Technically the combinatoric set of all children
            // Usually, this.text will be undefined anyway
            return [undefined];
        }

        serialize() {
            const serialized = ["format"];
            for (const section of this.sections) {
                serialized.push(section.text.serialize());
                const options = {};
                if (section.scale) {
                    options['font-scale'] = section.scale.serialize();
                }
                if (section.font) {
                    options['text-font'] = section.font.serialize();
                }
                serialized.push(options);
            }
            return serialized;
        }
    }

    //      

                                                    
                                                         
                                                               
                                           
                                         

    const types$1 = {
        'to-boolean': BooleanType,
        'to-color': ColorType,
        'to-number': NumberType,
        'to-string': StringType
    };

    /**
     * Special form for error-coalescing coercion expressions "to-number",
     * "to-color".  Since these coercions can fail at runtime, they accept multiple
     * arguments, only evaluating one at a time until one succeeds.
     *
     * @private
     */
    class Coercion                       {
                   
                                

        constructor(type      , args                   ) {
            this.type = type;
            this.args = args;
        }

        static parse(args              , context                )              {
            if (args.length < 2)
                return context.error(`Expected at least one argument.`);

            const name         = (args[0]     );
            assert_1(types$1[name], name);

            if ((name === 'to-boolean' || name === 'to-string') && args.length !== 2)
                return context.error(`Expected one argument.`);

            const type = types$1[name];

            const parsed = [];
            for (let i = 1; i < args.length; i++) {
                const input = context.parse(args[i], i, ValueType);
                if (!input) return null;
                parsed.push(input);
            }

            return new Coercion(type, parsed);
        }

        evaluate(ctx                   ) {
            if (this.type.kind === 'boolean') {
                return Boolean(this.args[0].evaluate(ctx));
            } else if (this.type.kind === 'color') {
                let input;
                let error;
                for (const arg of this.args) {
                    input = arg.evaluate(ctx);
                    error = null;
                    if (input instanceof Color) {
                        return input;
                    } else if (typeof input === 'string') {
                        const c = ctx.parseColor(input);
                        if (c) return c;
                    } else if (Array.isArray(input)) {
                        if (input.length < 3 || input.length > 4) {
                            error = `Invalid rbga value ${JSON.stringify(input)}: expected an array containing either three or four numeric values.`;
                        } else {
                            error = validateRGBA(input[0], input[1], input[2], input[3]);
                        }
                        if (!error) {
                            return new Color((input[0]     ) / 255, (input[1]     ) / 255, (input[2]     ) / 255, (input[3]     ));
                        }
                    }
                }
                throw new RuntimeError(error || `Could not parse color from value '${typeof input === 'string' ? input : String(JSON.stringify(input))}'`);
            } else if (this.type.kind === 'number') {
                let value = null;
                for (const arg of this.args) {
                    value = arg.evaluate(ctx);
                    if (value === null) return 0;
                    const num = Number(value);
                    if (isNaN(num)) continue;
                    return num;
                }
                throw new RuntimeError(`Could not convert ${JSON.stringify(value)} to number.`);
            } else if (this.type.kind === 'formatted') {
                // There is no explicit 'to-formatted' but this coercion can be implicitly
                // created by properties that expect the 'formatted' type.
                return Formatted.fromString(toString$1(this.args[0].evaluate(ctx)));
            } else {
                return toString$1(this.args[0].evaluate(ctx));
            }
        }

        eachChild(fn                      ) {
            this.args.forEach(fn);
        }

        possibleOutputs()                      {
            return [].concat(...this.args.map((arg) => arg.possibleOutputs()));
        }

        serialize() {
            if (this.type.kind === 'formatted') {
                return new FormatExpression([{text: this.args[0], scale: null, font: null}]).serialize();
            }
            const serialized = [`to-${this.type.kind}`];
            this.eachChild(child => { serialized.push(child.serialize()); });
            return serialized;
        }
    }

    //      

                                                                           

    const geometryTypes = ['Unknown', 'Point', 'LineString', 'Polygon'];

    class EvaluationContext {
                                  
                          
                                    

                                             

        constructor() {
            this.globals = (null     );
            this.feature = null;
            this.featureState = null;
            this._parseColorCache = {};
        }

        id() {
            return this.feature && 'id' in this.feature ? this.feature.id : null;
        }

        geometryType() {
            return this.feature ? typeof this.feature.type === 'number' ? geometryTypes[this.feature.type] : this.feature.type : null;
        }

        properties() {
            return this.feature && this.feature.properties || {};
        }

        parseColor(input        )         {
            let cached = this._parseColorCache[input];
            if (!cached) {
                cached = this._parseColorCache[input] = Color.parse(input);
            }
            return cached;
        }
    }

    //      

                                                                       
                                        
                                          

                                           
                                           
                                                                    
                                                   
                                                                

    class CompoundExpression                       {
                     
                   
                            
                                

                                                     

        constructor(name        , type      , evaluate          , args                   ) {
            this.name = name;
            this.type = type;
            this._evaluate = evaluate;
            this.args = args;
        }

        evaluate(ctx                   ) {
            return this._evaluate(ctx, this.args);
        }

        eachChild(fn                      ) {
            this.args.forEach(fn);
        }

        possibleOutputs() {
            return [undefined];
        }

        serialize()               {
            return [this.name].concat(this.args.map(arg => arg.serialize()));
        }

        static parse(args              , context                )              {
            const op         = (args[0]     );
            const definition = CompoundExpression.definitions[op];
            if (!definition) {
                return context.error(`Unknown expression "${op}". If you wanted a literal array, use ["literal", [...]].`, 0);
            }

            // Now check argument types against each signature
            const type = Array.isArray(definition) ?
                definition[0] : definition.type;

            const availableOverloads = Array.isArray(definition) ?
                [[definition[1], definition[2]]] :
                definition.overloads;

            const overloads = availableOverloads.filter(([signature]) => (
                !Array.isArray(signature) || // varags
                signature.length === args.length - 1 // correct param count
            ));

            let signatureContext                 = (null     );

            for (const [params, evaluate] of overloads) {
                // Use a fresh context for each attempted signature so that, if
                // we eventually succeed, we haven't polluted `context.errors`.
                signatureContext = new ParsingContext(context.registry, context.path, null, context.scope);

                // First parse all the args, potentially coercing to the
                // types expected by this overload.
                const parsedArgs                    = [];
                let argParseFailed = false;
                for (let i = 1; i < args.length; i++) {
                    const arg = args[i];
                    const expectedType = Array.isArray(params) ?
                        params[i - 1] :
                        params.type;

                    const parsed = signatureContext.parse(arg, 1 + parsedArgs.length, expectedType);
                    if (!parsed) {
                        argParseFailed = true;
                        break;
                    }
                    parsedArgs.push(parsed);
                }
                if (argParseFailed) {
                    // Couldn't coerce args of this overload to expected type, move
                    // on to next one.
                    continue;
                }

                if (Array.isArray(params)) {
                    if (params.length !== parsedArgs.length) {
                        signatureContext.error(`Expected ${params.length} arguments, but found ${parsedArgs.length} instead.`);
                        continue;
                    }
                }

                for (let i = 0; i < parsedArgs.length; i++) {
                    const expected = Array.isArray(params) ? params[i] : params.type;
                    const arg = parsedArgs[i];
                    signatureContext.concat(i + 1).checkSubtype(expected, arg.type);
                }

                if (signatureContext.errors.length === 0) {
                    return new CompoundExpression(op, type, evaluate, parsedArgs);
                }
            }

            assert_1(!signatureContext || signatureContext.errors.length > 0);

            if (overloads.length === 1) {
                context.errors.push(...signatureContext.errors);
            } else {
                const expected = overloads.length ? overloads : availableOverloads;
                const signatures = expected
                    .map(([params]) => stringifySignature(params))
                    .join(' | ');

                const actualTypes = [];
                // For error message, re-parse arguments without trying to
                // apply any coercions
                for (let i = 1; i < args.length; i++) {
                    const parsed = context.parse(args[i], 1 + actualTypes.length);
                    if (!parsed) return null;
                    actualTypes.push(toString(parsed.type));
                }
                context.error(`Expected arguments of type ${signatures}, but found (${actualTypes.join(', ')}) instead.`);
            }

            return null;
        }

        static register(
            registry                    ,
            definitions                          
        ) {
            assert_1(!CompoundExpression.definitions);
            CompoundExpression.definitions = definitions;
            for (const name in definitions) {
                registry[name] = CompoundExpression;
            }
        }
    }

    function stringifySignature(signature           )         {
        if (Array.isArray(signature)) {
            return `(${signature.map(toString).join(', ')})`;
        } else {
            return `(${toString(signature.type)}...)`;
        }
    }

    //      

                                                    
                                                               
                                                         
                                         

    class CollatorExpression                       {
                   
                                  
                                       
                                  

        constructor(caseSensitive            , diacriticSensitive            , locale                   ) {
            this.type = CollatorType;
            this.locale = locale;
            this.caseSensitive = caseSensitive;
            this.diacriticSensitive = diacriticSensitive;
        }

        static parse(args              , context                )              {
            if (args.length !== 2)
                return context.error(`Expected one argument.`);

            const options = (args[1]     );
            if (typeof options !== "object" || Array.isArray(options))
                return context.error(`Collator options argument must be an object.`);

            const caseSensitive = context.parse(
                options['case-sensitive'] === undefined ? false : options['case-sensitive'], 1, BooleanType);
            if (!caseSensitive) return null;

            const diacriticSensitive = context.parse(
                options['diacritic-sensitive'] === undefined ? false : options['diacritic-sensitive'], 1, BooleanType);
            if (!diacriticSensitive) return null;

            let locale = null;
            if (options['locale']) {
                locale = context.parse(options['locale'], 1, StringType);
                if (!locale) return null;
            }

            return new CollatorExpression(caseSensitive, diacriticSensitive, locale);
        }

        evaluate(ctx                   ) {
            return new Collator(this.caseSensitive.evaluate(ctx), this.diacriticSensitive.evaluate(ctx), this.locale ? this.locale.evaluate(ctx) : null);
        }

        eachChild(fn                      ) {
            fn(this.caseSensitive);
            fn(this.diacriticSensitive);
            if (this.locale) {
                fn(this.locale);
            }
        }

        possibleOutputs() {
            // Technically the set of possible outputs is the combinatoric set of Collators produced
            // by all possibleOutputs of locale/caseSensitive/diacriticSensitive
            // But for the primary use of Collators in comparison operators, we ignore the Collator's
            // possibleOutputs anyway, so we can get away with leaving this undefined for now.
            return [undefined];
        }

        serialize() {
            const options = {};
            options['case-sensitive'] = this.caseSensitive.serialize();
            options['diacritic-sensitive'] = this.diacriticSensitive.serialize();
            if (this.locale) {
                options['locale'] = this.locale.serialize();
            }
            return ["collator", options];
        }
    }

    //      

                                                      

    function isFeatureConstant(e            ) {
        if (e instanceof CompoundExpression) {
            if (e.name === 'get' && e.args.length === 1) {
                return false;
            } else if (e.name === 'feature-state') {
                return false;
            } else if (e.name === 'has' && e.args.length === 1) {
                return false;
            } else if (
                e.name === 'properties' ||
                e.name === 'geometry-type' ||
                e.name === 'id'
            ) {
                return false;
            } else if (/^filter-/.test(e.name)) {
                return false;
            }
        }

        let result = true;
        e.eachChild(arg => {
            if (result && !isFeatureConstant(arg)) { result = false; }
        });
        return result;
    }

    function isStateConstant(e            ) {
        if (e instanceof CompoundExpression) {
            if (e.name === 'feature-state') {
                return false;
            }
        }
        let result = true;
        e.eachChild(arg => {
            if (result && !isStateConstant(arg)) { result = false; }
        });
        return result;
    }

    function isGlobalPropertyConstant(e            , properties               ) {
        if (e instanceof CompoundExpression && properties.indexOf(e.name) >= 0) { return false; }
        let result = true;
        e.eachChild((arg) => {
            if (result && !isGlobalPropertyConstant(arg, properties)) { result = false; }
        });
        return result;
    }

    //      

                                         
                                                    
                                                         
                                                                

    class Var                       {
                   
                     
                                    

        constructor(name        , boundExpression            ) {
            this.type = boundExpression.type;
            this.name = name;
            this.boundExpression = boundExpression;
        }

        static parse(args              , context                ) {
            if (args.length !== 2 || typeof args[1] !== 'string')
                return context.error(`'var' expression requires exactly one string literal argument.`);

            const name = args[1];
            if (!context.scope.has(name)) {
                return context.error(`Unknown variable "${name}". Make sure "${name}" has been bound in an enclosing "let" expression before using it.`, 1);
            }

            return new Var(name, context.scope.get(name));
        }

        evaluate(ctx                   ) {
            return this.boundExpression.evaluate(ctx);
        }

        eachChild() {}

        possibleOutputs() {
            return [undefined];
        }

        serialize() {
            return ["var", this.name];
        }
    }

    //      


                                                                     
                                      

    /**
     * State associated parsing at a given point in an expression tree.
     * @private
     */
    class ParsingContext {
                                     
                            
                    
                     
                                    

        // The expected type of this expression. Provided only to allow Expression
        // implementations to infer argument types: Expression#parse() need not
        // check that the output type of the parsed expression matches
        // `expectedType`.
                            

        constructor(
            registry                    ,
            path                = [],
            expectedType       ,
            scope        = new Scope(),
            errors                      = []
        ) {
            this.registry = registry;
            this.path = path;
            this.key = path.map(part => `[${part}]`).join('');
            this.scope = scope;
            this.errors = errors;
            this.expectedType = expectedType;
        }

        /**
         * @param expr the JSON expression to parse
         * @param index the optional argument index if this expression is an argument of a parent expression that's being parsed
         * @param options
         * @param options.omitTypeAnnotations set true to omit inferred type annotations.  Caller beware: with this option set, the parsed expression's type will NOT satisfy `expectedType` if it would normally be wrapped in an inferred annotation.
         * @private
         */
        parse(
            expr       ,
            index         ,
            expectedType        ,
            bindings                              ,
            options                                                  = {}
        )              {
            if (index) {
                return this.concat(index, expectedType, bindings)._parse(expr, options);
            }
            return this._parse(expr, options);
        }

        _parse(expr       , options                                                 )              {
            if (expr === null || typeof expr === 'string' || typeof expr === 'boolean' || typeof expr === 'number') {
                expr = ['literal', expr];
            }

            function annotate(parsed, type, typeAnnotation                              ) {
                if (typeAnnotation === 'assert') {
                    return new Assertion(type, [parsed]);
                } else if (typeAnnotation === 'coerce') {
                    return new Coercion(type, [parsed]);
                } else {
                    return parsed;
                }
            }

            if (Array.isArray(expr)) {
                if (expr.length === 0) {
                    return this.error(`Expected an array with at least one element. If you wanted a literal array, use ["literal", []].`);
                }

                const op = expr[0];
                if (typeof op !== 'string') {
                    this.error(`Expression name must be a string, but found ${typeof op} instead. If you wanted a literal array, use ["literal", [...]].`, 0);
                    return null;
                }

                const Expr = this.registry[op];
                if (Expr) {
                    let parsed = Expr.parse(expr, this);
                    if (!parsed) return null;

                    if (this.expectedType) {
                        const expected = this.expectedType;
                        const actual = parsed.type;

                        // When we expect a number, string, boolean, or array but have a value, wrap it in an assertion.
                        // When we expect a color or formatted string, but have a string or value, wrap it in a coercion.
                        // Otherwise, we do static type-checking.
                        //
                        // These behaviors are overridable for:
                        //   * The "coalesce" operator, which needs to omit type annotations.
                        //   * String-valued properties (e.g. `text-field`), where coercion is more convenient than assertion.
                        //
                        if ((expected.kind === 'string' || expected.kind === 'number' || expected.kind === 'boolean' || expected.kind === 'object' || expected.kind === 'array') && actual.kind === 'value') {
                            parsed = annotate(parsed, expected, options.typeAnnotation || 'assert');
                        } else if ((expected.kind === 'color' || expected.kind === 'formatted') && (actual.kind === 'value' || actual.kind === 'string')) {
                            parsed = annotate(parsed, expected, options.typeAnnotation || 'coerce');
                        } else if (this.checkSubtype(expected, actual)) {
                            return null;
                        }
                    }

                    // If an expression's arguments are all literals, we can evaluate
                    // it immediately and replace it with a literal value in the
                    // parsed/compiled result.
                    if (!(parsed instanceof Literal) && isConstant(parsed)) {
                        const ec = new EvaluationContext();
                        try {
                            parsed = new Literal(parsed.type, parsed.evaluate(ec));
                        } catch (e) {
                            this.error(e.message);
                            return null;
                        }
                    }

                    return parsed;
                }

                return this.error(`Unknown expression "${op}". If you wanted a literal array, use ["literal", [...]].`, 0);
            } else if (typeof expr === 'undefined') {
                return this.error(`'undefined' value invalid. Use null instead.`);
            } else if (typeof expr === 'object') {
                return this.error(`Bare objects invalid. Use ["literal", {...}] instead.`);
            } else {
                return this.error(`Expected an array, but found ${typeof expr} instead.`);
            }
        }

        /**
         * Returns a copy of this context suitable for parsing the subexpression at
         * index `index`, optionally appending to 'let' binding map.
         *
         * Note that `errors` property, intended for collecting errors while
         * parsing, is copied by reference rather than cloned.
         * @private
         */
        concat(index        , expectedType        , bindings                              ) {
            const path = typeof index === 'number' ? this.path.concat(index) : this.path;
            const scope = bindings ? this.scope.concat(bindings) : this.scope;
            return new ParsingContext(
                this.registry,
                path,
                expectedType || null,
                scope,
                this.errors
            );
        }

        /**
         * Push a parsing (or type checking) error into the `this.errors`
         * @param error The message
         * @param keys Optionally specify the source of the error at a child
         * of the current expression at `this.key`.
         * @private
         */
        error(error        , ...keys               ) {
            const key = `${this.key}${keys.map(k => `[${k}]`).join('')}`;
            this.errors.push(new ParsingError(key, error));
        }

        /**
         * Returns null if `t` is a subtype of `expected`; otherwise returns an
         * error message and also pushes it to `this.errors`.
         */
        checkSubtype(expected      , t      )          {
            const error = checkSubtype(expected, t);
            if (error) this.error(error);
            return error;
        }
    }

    function isConstant(expression            ) {
        if (expression instanceof Var) {
            return isConstant(expression.boundExpression);
        } else if (expression instanceof CompoundExpression && expression.name === 'error') {
            return false;
        } else if (expression instanceof CollatorExpression) {
            // Although the results of a Collator expression with fixed arguments
            // generally shouldn't change between executions, we can't serialize them
            // as constant expressions because results change based on environment.
            return false;
        }

        const isTypeAnnotation = expression instanceof Coercion ||
            expression instanceof Assertion;

        let childrenConstant = true;
        expression.eachChild(child => {
            // We can _almost_ assume that if `expressions` children are constant,
            // they would already have been evaluated to Literal values when they
            // were parsed.  Type annotations are the exception, because they might
            // have been inferred and added after a child was parsed.

            // So we recurse into isConstant() for the children of type annotations,
            // but otherwise simply check whether they are Literals.
            if (isTypeAnnotation) {
                childrenConstant = childrenConstant && isConstant(child);
            } else {
                childrenConstant = childrenConstant && child instanceof Literal;
            }
        });
        if (!childrenConstant) {
            return false;
        }

        return isFeatureConstant(expression) &&
            isGlobalPropertyConstant(expression, ['zoom', 'heatmap-density', 'line-progress', 'accumulated', 'is-supported-script']);
    }

    //      

                                                   

                                                    

    /**
     * Returns the index of the last stop <= input, or 0 if it doesn't exist.
     * @private
     */
    function findStopLessThanOrEqualTo(stops               , input        ) {
        const n = stops.length;
        let lowerIndex = 0;
        let upperIndex = n - 1;
        let currentIndex = 0;
        let currentValue, upperValue;

        while (lowerIndex <= upperIndex) {
            currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
            currentValue = stops[currentIndex];
            upperValue = stops[currentIndex + 1];
            if (input === currentValue || input > currentValue && input < upperValue) { // Search complete
                return currentIndex;
            } else if (currentValue < input) {
                lowerIndex = currentIndex + 1;
            } else if (currentValue > input) {
                upperIndex = currentIndex - 1;
            } else {
                throw new RuntimeError('Input is not a number.');
            }
        }

        return Math.max(currentIndex - 1, 0);
    }

    //      

                                          
                                                    
                                                         
                                                               
                                           
                                         

    class Step                       {
                   

                          
                              
                                   

        constructor(type      , input            , stops       ) {
            this.type = type;
            this.input = input;

            this.labels = [];
            this.outputs = [];
            for (const [label, expression] of stops) {
                this.labels.push(label);
                this.outputs.push(expression);
            }
        }

        static parse(args              , context                ) {
            let [ , input, ...rest] = args;

            if (args.length - 1 < 4) {
                return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
            }

            if ((args.length - 1) % 2 !== 0) {
                return context.error(`Expected an even number of arguments.`);
            }

            input = context.parse(input, 1, NumberType);
            if (!input) return null;

            const stops        = [];

            let outputType       = (null     );
            if (context.expectedType && context.expectedType.kind !== 'value') {
                outputType = context.expectedType;
            }

            rest.unshift(-Infinity);

            for (let i = 0; i < rest.length; i += 2) {
                const label = rest[i];
                const value = rest[i + 1];

                const labelKey = i + 1;
                const valueKey = i + 2;

                if (typeof label !== 'number') {
                    return context.error('Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
                }

                if (stops.length && stops[stops.length - 1][0] >= label) {
                    return context.error('Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.', labelKey);
                }

                const parsed = context.parse(value, valueKey, outputType);
                if (!parsed) return null;
                outputType = outputType || parsed.type;
                stops.push([label, parsed]);
            }

            return new Step(outputType, input, stops);
        }

        evaluate(ctx                   ) {
            const labels = this.labels;
            const outputs = this.outputs;

            if (labels.length === 1) {
                return outputs[0].evaluate(ctx);
            }

            const value = ((this.input.evaluate(ctx)     )        );
            if (value <= labels[0]) {
                return outputs[0].evaluate(ctx);
            }

            const stopCount = labels.length;
            if (value >= labels[stopCount - 1]) {
                return outputs[stopCount - 1].evaluate(ctx);
            }

            const index = findStopLessThanOrEqualTo(labels, value);
            return outputs[index].evaluate(ctx);
        }

        eachChild(fn                      ) {
            fn(this.input);
            for (const expression of this.outputs) {
                fn(expression);
            }
        }

        possibleOutputs()                      {
            return [].concat(...this.outputs.map((output) => output.possibleOutputs()));
        }

        serialize() {
            const serialized = ["step", this.input.serialize()];
            for (let i = 0; i < this.labels.length; i++) {
                if (i > 0) {
                    serialized.push(this.labels[i]);
                }
                serialized.push(this.outputs[i].serialize());
            }
            return serialized;
        }
    }

    //      

    function number(a        , b        , t        ) {
        return (a * (1 - t)) + (b * t);
    }

    function color(from       , to       , t        ) {
        return new Color(
            number(from.r, to.r, t),
            number(from.g, to.g, t),
            number(from.b, to.b, t),
            number(from.a, to.a, t)
        );
    }

    function array$1(from               , to               , t        )                {
        return from.map((d, i) => {
            return number(d, to[i], t);
        });
    }

    var interpolate = /*#__PURE__*/Object.freeze({
        number: number,
        color: color,
        array: array$1
    });

    //      

                     
                  
                  
                  
                     
      

                     
                  
                  
                  
                     
      

    // Constants
    const Xn = 0.950470, // D65 standard referent
        Yn = 1,
        Zn = 1.088830,
        t0 = 4 / 29,
        t1 = 6 / 29,
        t2 = 3 * t1 * t1,
        t3 = t1 * t1 * t1,
        deg2rad = Math.PI / 180,
        rad2deg = 180 / Math.PI;

    // Utilities
    function xyz2lab(t) {
        return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
    }

    function lab2xyz(t) {
        return t > t1 ? t * t * t : t2 * (t - t0);
    }

    function xyz2rgb(x) {
        return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
    }

    function rgb2xyz(x) {
        x /= 255;
        return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }

    // LAB
    function rgbToLab(rgbColor       )           {
        const b = rgb2xyz(rgbColor.r),
            a = rgb2xyz(rgbColor.g),
            l = rgb2xyz(rgbColor.b),
            x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
            y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
            z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);

        return {
            l: 116 * y - 16,
            a: 500 * (x - y),
            b: 200 * (y - z),
            alpha: rgbColor.a
        };
    }

    function labToRgb(labColor          )        {
        let y = (labColor.l + 16) / 116,
            x = isNaN(labColor.a) ? y : y + labColor.a / 500,
            z = isNaN(labColor.b) ? y : y - labColor.b / 200;
        y = Yn * lab2xyz(y);
        x = Xn * lab2xyz(x);
        z = Zn * lab2xyz(z);
        return new Color(
            xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
            xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
            xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
            labColor.alpha
        );
    }

    function interpolateLab(from          , to          , t        ) {
        return {
            l: number(from.l, to.l, t),
            a: number(from.a, to.a, t),
            b: number(from.b, to.b, t),
            alpha: number(from.alpha, to.alpha, t)
        };
    }

    // HCL
    function rgbToHcl(rgbColor       )           {
        const {l, a, b} = rgbToLab(rgbColor);
        const h = Math.atan2(b, a) * rad2deg;
        return {
            h: h < 0 ? h + 360 : h,
            c: Math.sqrt(a * a + b * b),
            l,
            alpha: rgbColor.a
        };
    }

    function hclToRgb(hclColor          )        {
        const h = hclColor.h * deg2rad,
            c = hclColor.c,
            l = hclColor.l;
        return labToRgb({
            l,
            a: Math.cos(h) * c,
            b: Math.sin(h) * c,
            alpha: hclColor.alpha
        });
    }

    function interpolateHue(a        , b        , t        ) {
        const d = b - a;
        return a + t * (d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d);
    }

    function interpolateHcl(from          , to          , t        ) {
        return {
            h: interpolateHue(from.h, to.h, t),
            c: number(from.c, to.c, t),
            l: number(from.l, to.l, t),
            alpha: number(from.alpha, to.alpha, t)
        };
    }

    const lab = {
        forward: rgbToLab,
        reverse: labToRgb,
        interpolate: interpolateLab
    };

    const hcl = {
        forward: rgbToHcl,
        reverse: hclToRgb,
        interpolate: interpolateHcl
    };

    var colorSpaces = /*#__PURE__*/Object.freeze({
        lab: lab,
        hcl: hcl
    });

    //      

                                          
                                                    
                                                         
                                                               
                                           
                                         

                                   
                            
                                               
                                                                                  

    class Interpolate                       {
                   

                                                                        
                                         
                          
                              
                                   

        constructor(type      , operator                                                       , interpolation                   , input            , stops       ) {
            this.type = type;
            this.operator = operator;
            this.interpolation = interpolation;
            this.input = input;

            this.labels = [];
            this.outputs = [];
            for (const [label, expression] of stops) {
                this.labels.push(label);
                this.outputs.push(expression);
            }
        }

        static interpolationFactor(interpolation                   , input        , lower        , upper        ) {
            let t = 0;
            if (interpolation.name === 'exponential') {
                t = exponentialInterpolation(input, interpolation.base, lower, upper);
            } else if (interpolation.name === 'linear') {
                t = exponentialInterpolation(input, 1, lower, upper);
            } else if (interpolation.name === 'cubic-bezier') {
                const c = interpolation.controlPoints;
                const ub = new unitbezier(c[0], c[1], c[2], c[3]);
                t = ub.solve(exponentialInterpolation(input, 1, lower, upper));
            }
            return t;
        }

        static parse(args              , context                ) {
            let [operator, interpolation, input, ...rest] = args;

            if (!Array.isArray(interpolation) || interpolation.length === 0) {
                return context.error(`Expected an interpolation type expression.`, 1);
            }

            if (interpolation[0] === 'linear') {
                interpolation = { name: 'linear' };
            } else if (interpolation[0] === 'exponential') {
                const base = interpolation[1];
                if (typeof base !== 'number')
                    return context.error(`Exponential interpolation requires a numeric base.`, 1, 1);
                interpolation = {
                    name: 'exponential',
                    base
                };
            } else if (interpolation[0] === 'cubic-bezier') {
                const controlPoints = interpolation.slice(1);
                if (
                    controlPoints.length !== 4 ||
                    controlPoints.some(t => typeof t !== 'number' || t < 0 || t > 1)
                ) {
                    return context.error('Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.', 1);
                }

                interpolation = {
                    name: 'cubic-bezier',
                    controlPoints: (controlPoints     )
                };
            } else {
                return context.error(`Unknown interpolation type ${String(interpolation[0])}`, 1, 0);
            }

            if (args.length - 1 < 4) {
                return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
            }

            if ((args.length - 1) % 2 !== 0) {
                return context.error(`Expected an even number of arguments.`);
            }

            input = context.parse(input, 2, NumberType);
            if (!input) return null;

            const stops        = [];

            let outputType       = (null     );
            if (operator === 'interpolate-hcl' || operator === 'interpolate-lab') {
                outputType = ColorType;
            } else if (context.expectedType && context.expectedType.kind !== 'value') {
                outputType = context.expectedType;
            }

            for (let i = 0; i < rest.length; i += 2) {
                const label = rest[i];
                const value = rest[i + 1];

                const labelKey = i + 3;
                const valueKey = i + 4;

                if (typeof label !== 'number') {
                    return context.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
                }

                if (stops.length && stops[stops.length - 1][0] >= label) {
                    return context.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.', labelKey);
                }

                const parsed = context.parse(value, valueKey, outputType);
                if (!parsed) return null;
                outputType = outputType || parsed.type;
                stops.push([label, parsed]);
            }

            if (outputType.kind !== 'number' &&
                outputType.kind !== 'color' &&
                !(
                    outputType.kind === 'array' &&
                    outputType.itemType.kind === 'number' &&
                    typeof outputType.N === 'number'
                )
            ) {
                return context.error(`Type ${toString(outputType)} is not interpolatable.`);
            }

            return new Interpolate(outputType, (operator     ), interpolation, input, stops);
        }

        evaluate(ctx                   ) {
            const labels = this.labels;
            const outputs = this.outputs;

            if (labels.length === 1) {
                return outputs[0].evaluate(ctx);
            }

            const value = ((this.input.evaluate(ctx)     )        );
            if (value <= labels[0]) {
                return outputs[0].evaluate(ctx);
            }

            const stopCount = labels.length;
            if (value >= labels[stopCount - 1]) {
                return outputs[stopCount - 1].evaluate(ctx);
            }

            const index = findStopLessThanOrEqualTo(labels, value);
            const lower = labels[index];
            const upper = labels[index + 1];
            const t = Interpolate.interpolationFactor(this.interpolation, value, lower, upper);

            const outputLower = outputs[index].evaluate(ctx);
            const outputUpper = outputs[index + 1].evaluate(ctx);

            if (this.operator === 'interpolate') {
                return (interpolate[this.type.kind.toLowerCase()]     )(outputLower, outputUpper, t); // eslint-disable-line import/namespace
            } else if (this.operator === 'interpolate-hcl') {
                return hcl.reverse(hcl.interpolate(hcl.forward(outputLower), hcl.forward(outputUpper), t));
            } else {
                return lab.reverse(lab.interpolate(lab.forward(outputLower), lab.forward(outputUpper), t));
            }
        }

        eachChild(fn                      ) {
            fn(this.input);
            for (const expression of this.outputs) {
                fn(expression);
            }
        }

        possibleOutputs()                      {
            return [].concat(...this.outputs.map((output) => output.possibleOutputs()));
        }

        serialize()               {
            let interpolation;
            if (this.interpolation.name === 'linear') {
                interpolation = ["linear"];
            } else if (this.interpolation.name === 'exponential') {
                if  (this.interpolation.base === 1) {
                    interpolation = ["linear"];
                } else {
                    interpolation = ["exponential", this.interpolation.base];
                }
            } else {
                interpolation = ["cubic-bezier" ].concat(this.interpolation.controlPoints);
            }

            const serialized = [this.operator, interpolation, this.input.serialize()];

            for (let i = 0; i < this.labels.length; i++) {
                serialized.push(
                    this.labels[i],
                    this.outputs[i].serialize()
                );
            }
            return serialized;
        }
    }

    /**
     * Returns a ratio that can be used to interpolate between exponential function
     * stops.
     * How it works: Two consecutive stop values define a (scaled and shifted) exponential function `f(x) = a * base^x + b`, where `base` is the user-specified base,
     * and `a` and `b` are constants affording sufficient degrees of freedom to fit
     * the function to the given stops.
     *
     * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
     * values without explicitly solving for `a` and `b`:
     *
     * First stop value: `f(x0) = y0 = a * base^x0 + b`
     * Second stop value: `f(x1) = y1 = a * base^x1 + b`
     * => `y1 - y0 = a(base^x1 - base^x0)`
     * => `a = (y1 - y0)/(base^x1 - base^x0)`
     *
     * Desired value: `f(x) = y = a * base^x + b`
     * => `f(x) = y0 + a * (base^x - base^x0)`
     *
     * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
     * little algebra:
     * ```
     * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
     *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
     * ```
     *
     * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
     * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
     * an interpolation factor between the two stops' output values.
     *
     * (Note: a slightly different form for `ratio`,
     * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
     * expensive `Math.pow()` operations.)
     *
     * @private
    */
    function exponentialInterpolation(input, base, lowerValue, upperValue) {
        const difference = upperValue - lowerValue;
        const progress = input - lowerValue;

        if (difference === 0) {
            return 0;
        } else if (base === 1) {
            return progress / difference;
        } else {
            return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
        }
    }

    //      

                                                    
                                                         
                                                               
                                           
                                         

    class Coalesce                       {
                   
                                

        constructor(type      , args                   ) {
            this.type = type;
            this.args = args;
        }

        static parse(args              , context                ) {
            if (args.length < 2) {
                return context.error("Expectected at least one argument.");
            }
            let outputType       = (null     );
            const expectedType = context.expectedType;
            if (expectedType && expectedType.kind !== 'value') {
                outputType = expectedType;
            }
            const parsedArgs = [];

            for (const arg of args.slice(1)) {
                const parsed = context.parse(arg, 1 + parsedArgs.length, outputType, undefined, {typeAnnotation: 'omit'});
                if (!parsed) return null;
                outputType = outputType || parsed.type;
                parsedArgs.push(parsed);
            }
            assert_1(outputType);

            // Above, we parse arguments without inferred type annotation so that
            // they don't produce a runtime error for `null` input, which would
            // preempt the desired null-coalescing behavior.
            // Thus, if any of our arguments would have needed an annotation, we
            // need to wrap the enclosing coalesce expression with it instead.
            const needsAnnotation = expectedType &&
                parsedArgs.some(arg => checkSubtype(expectedType, arg.type));

            return needsAnnotation ?
                new Coalesce(ValueType, parsedArgs) :
                new Coalesce((outputType     ), parsedArgs);
        }

        evaluate(ctx                   ) {
            let result = null;
            for (const arg of this.args) {
                result = arg.evaluate(ctx);
                if (result !== null) break;
            }
            return result;
        }

        eachChild(fn                      ) {
            this.args.forEach(fn);
        }

        possibleOutputs()                      {
            return [].concat(...this.args.map((arg) => arg.possibleOutputs()));
        }

        serialize() {
            const serialized = ["coalesce"];
            this.eachChild(child => { serialized.push(child.serialize()); });
            return serialized;
        }
    }

    //      

                                         
                                                    
                                                         
                                                                

    class Let                       {
                   
                                              
                           

        constructor(bindings                             , result            ) {
            this.type = result.type;
            this.bindings = [].concat(bindings);
            this.result = result;
        }

        evaluate(ctx                   ) {
            return this.result.evaluate(ctx);
        }

        eachChild(fn                      ) {
            for (const binding of this.bindings) {
                fn(binding[1]);
            }
            fn(this.result);
        }

        static parse(args              , context                ) {
            if (args.length < 4)
                return context.error(`Expected at least 3 arguments, but found ${args.length - 1} instead.`);

            const bindings                              = [];
            for (let i = 1; i < args.length - 1; i += 2) {
                const name = args[i];

                if (typeof name !== 'string') {
                    return context.error(`Expected string, but found ${typeof name} instead.`, i);
                }

                if (/[^a-zA-Z0-9_]/.test(name)) {
                    return context.error(`Variable names must contain only alphanumeric characters or '_'.`, i);
                }

                const value = context.parse(args[i + 1], i + 1);
                if (!value) return null;

                bindings.push([name, value]);
            }

            const result = context.parse(args[args.length - 1], args.length - 1, context.expectedType, bindings);
            if (!result) return null;

            return new Let(bindings, result);
        }

        possibleOutputs() {
            return this.result.possibleOutputs();
        }

        serialize() {
            const serialized = ["let"];
            for (const [name, expr] of this.bindings) {
                serialized.push(name, expr.serialize());
            }
            serialized.push(this.result.serialize());
            return serialized;
        }
    }

    //      

                                                    
                                                         
                                                               
                                                    
                                           

    class At                       {
                   
                          
                          

        constructor(type      , index            , input            ) {
            this.type = type;
            this.index = index;
            this.input = input;
        }

        static parse(args              , context                ) {
            if (args.length !== 3)
                return context.error(`Expected 2 arguments, but found ${args.length - 1} instead.`);

            const index = context.parse(args[1], 1, NumberType);
            const input = context.parse(args[2], 2, array(context.expectedType || ValueType));

            if (!index || !input) return null;

            const t            = (input.type     );
            return new At(t.itemType, index, input);
        }

        evaluate(ctx                   ) {
            const index = ((this.index.evaluate(ctx)     )        );
            const array = ((this.input.evaluate(ctx)     )              );

            if (index < 0) {
                throw new RuntimeError(`Array index out of bounds: ${index} < 0.`);
            }

            if (index >= array.length) {
                throw new RuntimeError(`Array index out of bounds: ${index} > ${array.length - 1}.`);
            }

            if (index !== Math.floor(index)) {
                throw new RuntimeError(`Array index must be an integer, but found ${index} instead.`);
            }

            return array[index];
        }

        eachChild(fn                      ) {
            fn(this.index);
            fn(this.input);
        }

        possibleOutputs() {
            return [undefined];
        }

        serialize() {
            return ["at", this.index.serialize(), this.input.serialize()];
        }
    }

    //      

                                                    
                                                         
                                                               
                                           

    // Map input label values to output expression index
                                             

    class Match                       {
                   
                        

                          
                     
                                   
                              

        constructor(inputType      , outputType      , input            , cases       , outputs                   , otherwise            ) {
            this.inputType = inputType;
            this.type = outputType;
            this.input = input;
            this.cases = cases;
            this.outputs = outputs;
            this.otherwise = otherwise;
        }

        static parse(args              , context                ) {
            if (args.length < 5)
                return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
            if (args.length % 2 !== 1)
                return context.error(`Expected an even number of arguments.`);

            let inputType;
            let outputType;
            if (context.expectedType && context.expectedType.kind !== 'value') {
                outputType = context.expectedType;
            }
            const cases = {};
            const outputs = [];
            for (let i = 2; i < args.length - 1; i += 2) {
                let labels = args[i];
                const value = args[i + 1];

                if (!Array.isArray(labels)) {
                    labels = [labels];
                }

                const labelContext = context.concat(i);
                if (labels.length === 0) {
                    return labelContext.error('Expected at least one branch label.');
                }

                for (const label of labels) {
                    if (typeof label !== 'number' && typeof label !== 'string') {
                        return labelContext.error(`Branch labels must be numbers or strings.`);
                    } else if (typeof label === 'number' && Math.abs(label) > Number.MAX_SAFE_INTEGER) {
                        return labelContext.error(`Branch labels must be integers no larger than ${Number.MAX_SAFE_INTEGER}.`);

                    } else if (typeof label === 'number' && Math.floor(label) !== label) {
                        return labelContext.error(`Numeric branch labels must be integer values.`);

                    } else if (!inputType) {
                        inputType = typeOf(label);
                    } else if (labelContext.checkSubtype(inputType, typeOf(label))) {
                        return null;
                    }

                    if (typeof cases[String(label)] !== 'undefined') {
                        return labelContext.error('Branch labels must be unique.');
                    }

                    cases[String(label)] = outputs.length;
                }

                const result = context.parse(value, i, outputType);
                if (!result) return null;
                outputType = outputType || result.type;
                outputs.push(result);
            }

            const input = context.parse(args[1], 1, ValueType);
            if (!input) return null;

            const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
            if (!otherwise) return null;

            assert_1(inputType && outputType);

            if (input.type.kind !== 'value' && context.concat(1).checkSubtype((inputType     ), input.type)) {
                return null;
            }

            return new Match((inputType     ), (outputType     ), input, cases, outputs, otherwise);
        }

        evaluate(ctx                   ) {
            const input = (this.input.evaluate(ctx)     );
            const output = (typeOf(input) === this.inputType && this.outputs[this.cases[input]]) || this.otherwise;
            return output.evaluate(ctx);
        }

        eachChild(fn                      ) {
            fn(this.input);
            this.outputs.forEach(fn);
            fn(this.otherwise);
        }

        possibleOutputs()                      {
            return []
                .concat(...this.outputs.map((out) => out.possibleOutputs()))
                .concat(this.otherwise.possibleOutputs());
        }

        serialize()               {
            const serialized = ["match", this.input.serialize()];

            // Sort so serialization has an arbitrary defined order, even though
            // branch order doesn't affect evaluation
            const sortedLabels = Object.keys(this.cases).sort();

            // Group branches by unique match expression to support condensed
            // serializations of the form [case1, case2, ...] -> matchExpression
            const groupedByOutput                                          = [];
            const outputLookup                            = {}; // lookup index into groupedByOutput for a given output expression
            for (const label of sortedLabels) {
                const outputIndex = outputLookup[this.cases[label]];
                if (outputIndex === undefined) {
                    // First time seeing this output, add it to the end of the grouped list
                    outputLookup[this.cases[label]] = groupedByOutput.length;
                    groupedByOutput.push([this.cases[label], [label]]);
                } else {
                    // We've seen this expression before, add the label to that output's group
                    groupedByOutput[outputIndex][1].push(label);
                }
            }

            const coerceLabel = (label) => this.inputType.kind === 'number' ? Number(label) : label;

            for (const [outputIndex, labels] of groupedByOutput) {
                if (labels.length === 1) {
                    // Only a single label matches this output expression
                    serialized.push(coerceLabel(labels[0]));
                } else {
                    // Array of literal labels pointing to this output expression
                    serialized.push(labels.map(coerceLabel));
                }
                serialized.push(this.outputs[outputIndex].serialize());
            }
            serialized.push(this.otherwise.serialize());
            return serialized;
        }
    }

    //      

                                                    
                                                         
                                                               
                                           
                                         

                                                    

    class Case                       {
                   

                           
                              

        constructor(type      , branches          , otherwise            ) {
            this.type = type;
            this.branches = branches;
            this.otherwise = otherwise;
        }

        static parse(args              , context                ) {
            if (args.length < 4)
                return context.error(`Expected at least 3 arguments, but found only ${args.length - 1}.`);
            if (args.length % 2 !== 0)
                return context.error(`Expected an odd number of arguments.`);

            let outputType       ;
            if (context.expectedType && context.expectedType.kind !== 'value') {
                outputType = context.expectedType;
            }

            const branches = [];
            for (let i = 1; i < args.length - 1; i += 2) {
                const test = context.parse(args[i], i, BooleanType);
                if (!test) return null;

                const result = context.parse(args[i + 1], i + 1, outputType);
                if (!result) return null;

                branches.push([test, result]);

                outputType = outputType || result.type;
            }

            const otherwise = context.parse(args[args.length - 1], args.length - 1, outputType);
            if (!otherwise) return null;

            assert_1(outputType);
            return new Case((outputType     ), branches, otherwise);
        }

        evaluate(ctx                   ) {
            for (const [test, expression] of this.branches) {
                if (test.evaluate(ctx)) {
                    return expression.evaluate(ctx);
                }
            }
            return this.otherwise.evaluate(ctx);
        }

        eachChild(fn                      ) {
            for (const [test, expression] of this.branches) {
                fn(test);
                fn(expression);
            }
            fn(this.otherwise);
        }

        possibleOutputs()                      {
            return []
                .concat(...this.branches.map(([_, out]) => out.possibleOutputs()))
                .concat(this.otherwise.possibleOutputs());
        }

        serialize() {
            const serialized = ["case"];
            this.eachChild(child => { serialized.push(child.serialize()); });
            return serialized;
        }
    }

    //      

                                                    
                                                               
                                                         
                                         

                                                                     

    function isComparableType(op                    , type      ) {
        if (op === '==' || op === '!=') {
            // equality operator
            return type.kind === 'boolean' ||
                type.kind === 'string' ||
                type.kind === 'number' ||
                type.kind === 'null' ||
                type.kind === 'value';
        } else {
            // ordering operator
            return type.kind === 'string' ||
                type.kind === 'number' ||
                type.kind === 'value';
        }
    }


    function eq(ctx, a, b) { return a === b; }
    function neq(ctx, a, b) { return a !== b; }
    function lt(ctx, a, b) { return a < b; }
    function gt(ctx, a, b) { return a > b; }
    function lteq(ctx, a, b) { return a <= b; }
    function gteq(ctx, a, b) { return a >= b; }

    function eqCollate(ctx, a, b, c) { return c.compare(a, b) === 0; }
    function neqCollate(ctx, a, b, c) { return !eqCollate(ctx, a, b, c); }
    function ltCollate(ctx, a, b, c) { return c.compare(a, b) < 0; }
    function gtCollate(ctx, a, b, c) { return c.compare(a, b) > 0; }
    function lteqCollate(ctx, a, b, c) { return c.compare(a, b) <= 0; }
    function gteqCollate(ctx, a, b, c) { return c.compare(a, b) >= 0; }

    /**
     * Special form for comparison operators, implementing the signatures:
     * - (T, T, ?Collator) => boolean
     * - (T, value, ?Collator) => boolean
     * - (value, T, ?Collator) => boolean
     *
     * For inequalities, T must be either value, string, or number. For ==/!=, it
     * can also be boolean or null.
     *
     * Equality semantics are equivalent to Javascript's strict equality (===/!==)
     * -- i.e., when the arguments' types don't match, == evaluates to false, != to
     * true.
     *
     * When types don't match in an ordering comparison, a runtime error is thrown.
     *
     * @private
     */
    function makeComparison(op                    , compareBasic, compareWithCollator) {
        const isOrderComparison = op !== '==' && op !== '!=';

        return class Comparison                       {
                       
                            
                            
                                  
                                        

            constructor(lhs            , rhs            , collator             ) {
                this.type = BooleanType;
                this.lhs = lhs;
                this.rhs = rhs;
                this.collator = collator;
                this.hasUntypedArgument = lhs.type.kind === 'value' || rhs.type.kind === 'value';
            }

            static parse(args              , context                )              {
                if (args.length !== 3 && args.length !== 4)
                    return context.error(`Expected two or three arguments.`);

                const op                     = (args[0]     );

                let lhs = context.parse(args[1], 1, ValueType);
                if (!lhs) return null;
                if (!isComparableType(op, lhs.type)) {
                    return context.concat(1).error(`"${op}" comparisons are not supported for type '${toString(lhs.type)}'.`);
                }
                let rhs = context.parse(args[2], 2, ValueType);
                if (!rhs) return null;
                if (!isComparableType(op, rhs.type)) {
                    return context.concat(2).error(`"${op}" comparisons are not supported for type '${toString(rhs.type)}'.`);
                }

                if (
                    lhs.type.kind !== rhs.type.kind &&
                    lhs.type.kind !== 'value' &&
                    rhs.type.kind !== 'value'
                ) {
                    return context.error(`Cannot compare types '${toString(lhs.type)}' and '${toString(rhs.type)}'.`);
                }

                if (isOrderComparison) {
                    // typing rules specific to less/greater than operators
                    if (lhs.type.kind === 'value' && rhs.type.kind !== 'value') {
                        // (value, T)
                        lhs = new Assertion(rhs.type, [lhs]);
                    } else if (lhs.type.kind !== 'value' && rhs.type.kind === 'value') {
                        // (T, value)
                        rhs = new Assertion(lhs.type, [rhs]);
                    }
                }

                let collator = null;
                if (args.length === 4) {
                    if (
                        lhs.type.kind !== 'string' &&
                        rhs.type.kind !== 'string' &&
                        lhs.type.kind !== 'value' &&
                        rhs.type.kind !== 'value'
                    ) {
                        return context.error(`Cannot use collator to compare non-string types.`);
                    }
                    collator = context.parse(args[3], 3, CollatorType);
                    if (!collator) return null;
                }

                return new Comparison(lhs, rhs, collator);
            }

            evaluate(ctx                   ) {
                const lhs = this.lhs.evaluate(ctx);
                const rhs = this.rhs.evaluate(ctx);

                if (isOrderComparison && this.hasUntypedArgument) {
                    const lt = typeOf(lhs);
                    const rt = typeOf(rhs);
                    // check that type is string or number, and equal
                    if (lt.kind !== rt.kind || !(lt.kind === 'string' || lt.kind === 'number')) {
                        throw new RuntimeError(`Expected arguments for "${op}" to be (string, string) or (number, number), but found (${lt.kind}, ${rt.kind}) instead.`);
                    }
                }

                if (this.collator && !isOrderComparison && this.hasUntypedArgument) {
                    const lt = typeOf(lhs);
                    const rt = typeOf(rhs);
                    if (lt.kind !== 'string' || rt.kind !== 'string') {
                        return compareBasic(ctx, lhs, rhs);
                    }
                }

                return this.collator ?
                    compareWithCollator(ctx, lhs, rhs, this.collator.evaluate(ctx)) :
                    compareBasic(ctx, lhs, rhs);
            }

            eachChild(fn                      ) {
                fn(this.lhs);
                fn(this.rhs);
                if (this.collator) {
                    fn(this.collator);
                }
            }

            possibleOutputs() {
                return [true, false];
            }

            serialize() {
                const serialized = [op];
                this.eachChild(child => { serialized.push(child.serialize()); });
                return serialized;
            }
        };
    }

    const Equals = makeComparison('==', eq, eqCollate);
    const NotEquals = makeComparison('!=', neq, neqCollate);
    const LessThan = makeComparison('<', lt, ltCollate);
    const GreaterThan = makeComparison('>', gt, gtCollate);
    const LessThanOrEqual = makeComparison('<=', lteq, lteqCollate);
    const GreaterThanOrEqual = makeComparison('>=', gteq, gteqCollate);

    //      

                                                    
                                                               
                                                         
                                         

                       
                                              
      

                                     
                     
                                        
                                         
                             

                
                                        
                                         
                             

                                  

                               
     

                                
                                                   
                                 
                                              
                                              
      

    class NumberFormat                       {
                   
                           
                                     // BCP 47 language tag
                                     // ISO 4217 currency code, required if style=currency
                                              // Default 0
                                              // Default 3

        constructor(number            ,
                    locale                   ,
                    currency                   ,
                    minFractionDigits                   ,
                    maxFractionDigits                   ) {
            this.type = StringType;
            this.number = number;
            this.locale = locale;
            this.currency = currency;
            this.minFractionDigits = minFractionDigits;
            this.maxFractionDigits = maxFractionDigits;
        }

        static parse(args              , context                )              {
            if (args.length !== 3)
                return context.error(`Expected two arguments.`);

            const number = context.parse(args[1], 1, NumberType);
            if (!number) return null;

            const options = (args[2]     );
            if (typeof options !== "object" || Array.isArray(options))
                return context.error(`NumberFormat options argument must be an object.`);

            let locale = null;
            if (options['locale']) {
                locale = context.parse(options['locale'], 1, StringType);
                if (!locale) return null;
            }

            let currency = null;
            if (options['currency']) {
                currency = context.parse(options['currency'], 1, StringType);
                if (!currency) return null;
            }

            let minFractionDigits = null;
            if (options['min-fraction-digits']) {
                minFractionDigits = context.parse(options['min-fraction-digits'], 1, NumberType);
                if (!minFractionDigits) return null;
            }

            let maxFractionDigits = null;
            if (options['max-fraction-digits']) {
                maxFractionDigits = context.parse(options['max-fraction-digits'], 1, NumberType);
                if (!maxFractionDigits) return null;
            }

            return new NumberFormat(number, locale, currency, minFractionDigits, maxFractionDigits);
        }

        evaluate(ctx                   ) {
            return new Intl.NumberFormat(this.locale ? this.locale.evaluate(ctx) : [],
                {
                    style: this.currency ? "currency" : "decimal",
                    currency: this.currency ? this.currency.evaluate(ctx) : undefined,
                    minimumFractionDigits: this.minFractionDigits ? this.minFractionDigits.evaluate(ctx) : undefined,
                    maximumFractionDigits: this.maxFractionDigits ? this.maxFractionDigits.evaluate(ctx) : undefined,
                }).format(this.number.evaluate(ctx));
        }

        eachChild(fn                      ) {
            fn(this.number);
            if (this.locale) {
                fn(this.locale);
            }
            if (this.currency) {
                fn(this.currency);
            }
            if (this.minFractionDigits) {
                fn(this.minFractionDigits);
            }
            if (this.maxFractionDigits) {
                fn(this.maxFractionDigits);
            }
        }

        possibleOutputs() {
            return [undefined];
        }

        serialize() {
            const options = {};
            if (this.locale) {
                options['locale'] = this.locale.serialize();
            }
            if (this.currency) {
                options['currency'] = this.currency.serialize();
            }
            if (this.minFractionDigits) {
                options['min-fraction-digits'] = this.minFractionDigits.serialize();
            }
            if (this.maxFractionDigits) {
                options['max-fraction-digits'] = this.maxFractionDigits.serialize();
            }
            return ["number-format", this.number.serialize(), options];
        }
    }

    //      

                                                    
                                                         
                                                               
                                         

    class Length                       {
                   
                          

        constructor(input            ) {
            this.type = NumberType;
            this.input = input;
        }

        static parse(args              , context                ) {
            if (args.length !== 2)
                return context.error(`Expected 1 argument, but found ${args.length - 1} instead.`);

            const input = context.parse(args[1], 1);
            if (!input) return null;

            if (input.type.kind !== 'array' && input.type.kind !== 'string' && input.type.kind !== 'value')
                return context.error(`Expected argument of type string or array, but found ${toString(input.type)} instead.`);

            return new Length(input);
        }

        evaluate(ctx                   ) {
            const input = this.input.evaluate(ctx);
            if (typeof input === 'string') {
                return input.length;
            } else if (Array.isArray(input)) {
                return input.length;
            } else {
                throw new RuntimeError(`Expected value to be of type string or array, but found ${toString(typeOf(input))} instead.`);
            }
        }

        eachChild(fn                      ) {
            fn(this.input);
        }

        possibleOutputs() {
            return [undefined];
        }

        serialize() {
            const serialized = ["length"];
            this.eachChild(child => { serialized.push(child.serialize()); });
            return serialized;
        }
    }

    //      

                                                          
                                                            

    const expressions                     = {
        // special forms
        '==': Equals,
        '!=': NotEquals,
        '>': GreaterThan,
        '<': LessThan,
        '>=': GreaterThanOrEqual,
        '<=': LessThanOrEqual,
        'array': Assertion,
        'at': At,
        'boolean': Assertion,
        'case': Case,
        'coalesce': Coalesce,
        'collator': CollatorExpression,
        'format': FormatExpression,
        'interpolate': Interpolate,
        'interpolate-hcl': Interpolate,
        'interpolate-lab': Interpolate,
        'length': Length,
        'let': Let,
        'literal': Literal,
        'match': Match,
        'number': Assertion,
        'number-format': NumberFormat,
        'object': Assertion,
        'step': Step,
        'string': Assertion,
        'to-boolean': Coercion,
        'to-color': Coercion,
        'to-number': Coercion,
        'to-string': Coercion,
        'var': Var
    };

    function rgba(ctx, [r, g, b, a]) {
        r = r.evaluate(ctx);
        g = g.evaluate(ctx);
        b = b.evaluate(ctx);
        const alpha = a ? a.evaluate(ctx) : 1;
        const error = validateRGBA(r, g, b, alpha);
        if (error) throw new RuntimeError(error);
        return new Color(r / 255 * alpha, g / 255 * alpha, b / 255 * alpha, alpha);
    }

    function has(key, obj) {
        return key in obj;
    }

    function get(key, obj) {
        const v = obj[key];
        return typeof v === 'undefined' ? null : v;
    }

    function binarySearch(v, a, i, j) {
        while (i <= j) {
            const m = (i + j) >> 1;
            if (a[m] === v)
                return true;
            if (a[m] > v)
                j = m - 1;
            else
                i = m + 1;
        }
        return false;
    }

    function varargs(type      )          {
        return { type };
    }

    CompoundExpression.register(expressions, {
        'error': [
            ErrorType,
            [StringType],
            (ctx, [v]) => { throw new RuntimeError(v.evaluate(ctx)); }
        ],
        'typeof': [
            StringType,
            [ValueType],
            (ctx, [v]) => toString(typeOf(v.evaluate(ctx)))
        ],
        'to-rgba': [
            array(NumberType, 4),
            [ColorType],
            (ctx, [v]) => {
                return v.evaluate(ctx).toArray();
            }
        ],
        'rgb': [
            ColorType,
            [NumberType, NumberType, NumberType],
            rgba
        ],
        'rgba': [
            ColorType,
            [NumberType, NumberType, NumberType, NumberType],
            rgba
        ],
        'has': {
            type: BooleanType,
            overloads: [
                [
                    [StringType],
                    (ctx, [key]) => has(key.evaluate(ctx), ctx.properties())
                ], [
                    [StringType, ObjectType],
                    (ctx, [key, obj]) => has(key.evaluate(ctx), obj.evaluate(ctx))
                ]
            ]
        },
        'get': {
            type: ValueType,
            overloads: [
                [
                    [StringType],
                    (ctx, [key]) => get(key.evaluate(ctx), ctx.properties())
                ], [
                    [StringType, ObjectType],
                    (ctx, [key, obj]) => get(key.evaluate(ctx), obj.evaluate(ctx))
                ]
            ]
        },
        'feature-state': [
            ValueType,
            [StringType],
            (ctx, [key]) => get(key.evaluate(ctx), ctx.featureState || {})
        ],
        'properties': [
            ObjectType,
            [],
            (ctx) => ctx.properties()
        ],
        'geometry-type': [
            StringType,
            [],
            (ctx) => ctx.geometryType()
        ],
        'id': [
            ValueType,
            [],
            (ctx) => ctx.id()
        ],
        'zoom': [
            NumberType,
            [],
            (ctx) => ctx.globals.zoom
        ],
        'heatmap-density': [
            NumberType,
            [],
            (ctx) => ctx.globals.heatmapDensity || 0
        ],
        'line-progress': [
            NumberType,
            [],
            (ctx) => ctx.globals.lineProgress || 0
        ],
        'accumulated': [
            ValueType,
            [],
            (ctx) => ctx.globals.accumulated === undefined ? null : ctx.globals.accumulated
        ],
        '+': [
            NumberType,
            varargs(NumberType),
            (ctx, args) => {
                let result = 0;
                for (const arg of args) {
                    result += arg.evaluate(ctx);
                }
                return result;
            }
        ],
        '*': [
            NumberType,
            varargs(NumberType),
            (ctx, args) => {
                let result = 1;
                for (const arg of args) {
                    result *= arg.evaluate(ctx);
                }
                return result;
            }
        ],
        '-': {
            type: NumberType,
            overloads: [
                [
                    [NumberType, NumberType],
                    (ctx, [a, b]) => a.evaluate(ctx) - b.evaluate(ctx)
                ], [
                    [NumberType],
                    (ctx, [a]) => -a.evaluate(ctx)
                ]
            ]
        },
        '/': [
            NumberType,
            [NumberType, NumberType],
            (ctx, [a, b]) => a.evaluate(ctx) / b.evaluate(ctx)
        ],
        '%': [
            NumberType,
            [NumberType, NumberType],
            (ctx, [a, b]) => a.evaluate(ctx) % b.evaluate(ctx)
        ],
        'ln2': [
            NumberType,
            [],
            () => Math.LN2
        ],
        'pi': [
            NumberType,
            [],
            () => Math.PI
        ],
        'e': [
            NumberType,
            [],
            () => Math.E
        ],
        '^': [
            NumberType,
            [NumberType, NumberType],
            (ctx, [b, e]) => Math.pow(b.evaluate(ctx), e.evaluate(ctx))
        ],
        'sqrt': [
            NumberType,
            [NumberType],
            (ctx, [x]) => Math.sqrt(x.evaluate(ctx))
        ],
        'log10': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.log(n.evaluate(ctx)) / Math.LN10
        ],
        'ln': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.log(n.evaluate(ctx))
        ],
        'log2': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.log(n.evaluate(ctx)) / Math.LN2
        ],
        'sin': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.sin(n.evaluate(ctx))
        ],
        'cos': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.cos(n.evaluate(ctx))
        ],
        'tan': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.tan(n.evaluate(ctx))
        ],
        'asin': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.asin(n.evaluate(ctx))
        ],
        'acos': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.acos(n.evaluate(ctx))
        ],
        'atan': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.atan(n.evaluate(ctx))
        ],
        'min': [
            NumberType,
            varargs(NumberType),
            (ctx, args) => Math.min(...args.map(arg => arg.evaluate(ctx)))
        ],
        'max': [
            NumberType,
            varargs(NumberType),
            (ctx, args) => Math.max(...args.map(arg => arg.evaluate(ctx)))
        ],
        'abs': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.abs(n.evaluate(ctx))
        ],
        'round': [
            NumberType,
            [NumberType],
            (ctx, [n]) => {
                const v = n.evaluate(ctx);
                // Javascript's Math.round() rounds towards +Infinity for halfway
                // values, even when they're negative. It's more common to round
                // away from 0 (e.g., this is what python and C++ do)
                return v < 0 ? -Math.round(-v) : Math.round(v);
            }
        ],
        'floor': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.floor(n.evaluate(ctx))
        ],
        'ceil': [
            NumberType,
            [NumberType],
            (ctx, [n]) => Math.ceil(n.evaluate(ctx))
        ],
        'filter-==': [
            BooleanType,
            [StringType, ValueType],
            (ctx, [k, v]) => ctx.properties()[(k     ).value] === (v     ).value
        ],
        'filter-id-==': [
            BooleanType,
            [ValueType],
            (ctx, [v]) => ctx.id() === (v     ).value
        ],
        'filter-type-==': [
            BooleanType,
            [StringType],
            (ctx, [v]) => ctx.geometryType() === (v     ).value
        ],
        'filter-<': [
            BooleanType,
            [StringType, ValueType],
            (ctx, [k, v]) => {
                const a = ctx.properties()[(k     ).value];
                const b = (v     ).value;
                return typeof a === typeof b && a < b;
            }
        ],
        'filter-id-<': [
            BooleanType,
            [ValueType],
            (ctx, [v]) => {
                const a = ctx.id();
                const b = (v     ).value;
                return typeof a === typeof b && a < b;
            }
        ],
        'filter->': [
            BooleanType,
            [StringType, ValueType],
            (ctx, [k, v]) => {
                const a = ctx.properties()[(k     ).value];
                const b = (v     ).value;
                return typeof a === typeof b && a > b;
            }
        ],
        'filter-id->': [
            BooleanType,
            [ValueType],
            (ctx, [v]) => {
                const a = ctx.id();
                const b = (v     ).value;
                return typeof a === typeof b && a > b;
            }
        ],
        'filter-<=': [
            BooleanType,
            [StringType, ValueType],
            (ctx, [k, v]) => {
                const a = ctx.properties()[(k     ).value];
                const b = (v     ).value;
                return typeof a === typeof b && a <= b;
            }
        ],
        'filter-id-<=': [
            BooleanType,
            [ValueType],
            (ctx, [v]) => {
                const a = ctx.id();
                const b = (v     ).value;
                return typeof a === typeof b && a <= b;
            }
        ],
        'filter->=': [
            BooleanType,
            [StringType, ValueType],
            (ctx, [k, v]) => {
                const a = ctx.properties()[(k     ).value];
                const b = (v     ).value;
                return typeof a === typeof b && a >= b;
            }
        ],
        'filter-id->=': [
            BooleanType,
            [ValueType],
            (ctx, [v]) => {
                const a = ctx.id();
                const b = (v     ).value;
                return typeof a === typeof b && a >= b;
            }
        ],
        'filter-has': [
            BooleanType,
            [ValueType],
            (ctx, [k]) => (k     ).value in ctx.properties()
        ],
        'filter-has-id': [
            BooleanType,
            [],
            (ctx) => ctx.id() !== null
        ],
        'filter-type-in': [
            BooleanType,
            [array(StringType)],
            (ctx, [v]) => (v     ).value.indexOf(ctx.geometryType()) >= 0
        ],
        'filter-id-in': [
            BooleanType,
            [array(ValueType)],
            (ctx, [v]) => (v     ).value.indexOf(ctx.id()) >= 0
        ],
        'filter-in-small': [
            BooleanType,
            [StringType, array(ValueType)],
            // assumes v is an array literal
            (ctx, [k, v]) => (v     ).value.indexOf(ctx.properties()[(k     ).value]) >= 0
        ],
        'filter-in-large': [
            BooleanType,
            [StringType, array(ValueType)],
            // assumes v is a array literal with values sorted in ascending order and of a single type
            (ctx, [k, v]) => binarySearch(ctx.properties()[(k     ).value], (v     ).value, 0, (v     ).value.length - 1)
        ],
        'all': {
            type: BooleanType,
            overloads: [
                [
                    [BooleanType, BooleanType],
                    (ctx, [a, b]) => a.evaluate(ctx) && b.evaluate(ctx)
                ],
                [
                    varargs(BooleanType),
                    (ctx, args) => {
                        for (const arg of args) {
                            if (!arg.evaluate(ctx))
                                return false;
                        }
                        return true;
                    }
                ]
            ]
        },
        'any': {
            type: BooleanType,
            overloads: [
                [
                    [BooleanType, BooleanType],
                    (ctx, [a, b]) => a.evaluate(ctx) || b.evaluate(ctx)
                ],
                [
                    varargs(BooleanType),
                    (ctx, args) => {
                        for (const arg of args) {
                            if (arg.evaluate(ctx))
                                return true;
                        }
                        return false;
                    }
                ]
            ]
        },
        '!': [
            BooleanType,
            [BooleanType],
            (ctx, [b]) => !b.evaluate(ctx)
        ],
        'is-supported-script': [
            BooleanType,
            [StringType],
            // At parse time this will always return true, so we need to exclude this expression with isGlobalPropertyConstant
            (ctx, [s]) => {
                const isSupportedScript = ctx.globals && ctx.globals.isSupportedScript;
                if (isSupportedScript) {
                    return isSupportedScript(s.evaluate(ctx));
                }
                return true;
            }
        ],
        'upcase': [
            StringType,
            [StringType],
            (ctx, [s]) => s.evaluate(ctx).toUpperCase()
        ],
        'downcase': [
            StringType,
            [StringType],
            (ctx, [s]) => s.evaluate(ctx).toLowerCase()
        ],
        'concat': [
            StringType,
            varargs(ValueType),
            (ctx, args) => args.map(arg => toString$1(arg.evaluate(ctx))).join('')
        ],
        'resolved-locale': [
            StringType,
            [CollatorType],
            (ctx, [collator]) => collator.evaluate(ctx).resolvedLocale()
        ]
    });

    //      

    /**
     * A type used for returning and propagating errors. The first element of the union
     * represents success and contains a value, and the second represents an error and
     * contains an error value.
     * @private
     */
                              
                                           
                                          

    function success      (value   )               {
        return { result: 'success', value };
    }

    function error      (value   )               {
        return { result: 'error', value };
    }

    //      

                                                                  

    function supportsPropertyExpression(spec                            )          {
        return spec['property-type'] === 'data-driven' || spec['property-type'] === 'cross-faded-data-driven';
    }

    function supportsInterpolation(spec                            )          {
        return !!spec.expression && spec.expression.interpolated;
    }

    function getType(val) {
        if (val instanceof Number) {
            return 'number';
        } else if (val instanceof String) {
            return 'string';
        } else if (val instanceof Boolean) {
            return 'boolean';
        } else if (Array.isArray(val)) {
            return 'array';
        } else if (val === null) {
            return 'null';
        } else {
            return typeof val;
        }
    }

    function isFunction(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    function identityFunction(x) {
        return x;
    }

    function createFunction(parameters, propertySpec) {
        const isColor = propertySpec.type === 'color';
        const zoomAndFeatureDependent = parameters.stops && typeof parameters.stops[0][0] === 'object';
        const featureDependent = zoomAndFeatureDependent || parameters.property !== undefined;
        const zoomDependent = zoomAndFeatureDependent || !featureDependent;
        const type = parameters.type || (supportsInterpolation(propertySpec) ? 'exponential' : 'interval');

        if (isColor) {
            parameters = extend({}, parameters);

            if (parameters.stops) {
                parameters.stops = parameters.stops.map((stop) => {
                    return [stop[0], Color.parse(stop[1])];
                });
            }

            if (parameters.default) {
                parameters.default = Color.parse(parameters.default);
            } else {
                parameters.default = Color.parse(propertySpec.default);
            }
        }

        if (parameters.colorSpace && parameters.colorSpace !== 'rgb' && !colorSpaces[parameters.colorSpace]) { // eslint-disable-line import/namespace
            throw new Error(`Unknown color space: ${parameters.colorSpace}`);
        }

        let innerFun;
        let hashedStops;
        let categoricalKeyType;
        if (type === 'exponential') {
            innerFun = evaluateExponentialFunction;
        } else if (type === 'interval') {
            innerFun = evaluateIntervalFunction;
        } else if (type === 'categorical') {
            innerFun = evaluateCategoricalFunction;

            // For categorical functions, generate an Object as a hashmap of the stops for fast searching
            hashedStops = Object.create(null);
            for (const stop of parameters.stops) {
                hashedStops[stop[0]] = stop[1];
            }

            // Infer key type based on first stop key-- used to encforce strict type checking later
            categoricalKeyType = typeof parameters.stops[0][0];

        } else if (type === 'identity') {
            innerFun = evaluateIdentityFunction;
        } else {
            throw new Error(`Unknown function type "${type}"`);
        }

        if (zoomAndFeatureDependent) {
            const featureFunctions = {};
            const zoomStops = [];
            for (let s = 0; s < parameters.stops.length; s++) {
                const stop = parameters.stops[s];
                const zoom = stop[0].zoom;
                if (featureFunctions[zoom] === undefined) {
                    featureFunctions[zoom] = {
                        zoom,
                        type: parameters.type,
                        property: parameters.property,
                        default: parameters.default,
                        stops: []
                    };
                    zoomStops.push(zoom);
                }
                featureFunctions[zoom].stops.push([stop[0].value, stop[1]]);
            }

            const featureFunctionStops = [];
            for (const z of zoomStops) {
                featureFunctionStops.push([featureFunctions[z].zoom, createFunction(featureFunctions[z], propertySpec)]);
            }

            return {
                kind: 'composite',
                interpolationFactor: Interpolate.interpolationFactor.bind(undefined, {name: 'linear'}),
                zoomStops: featureFunctionStops.map(s => s[0]),
                evaluate({zoom}, properties) {
                    return evaluateExponentialFunction({
                        stops: featureFunctionStops,
                        base: parameters.base
                    }, propertySpec, zoom).evaluate(zoom, properties);
                }
            };
        } else if (zoomDependent) {
            return {
                kind: 'camera',
                interpolationFactor: type === 'exponential' ?
                    Interpolate.interpolationFactor.bind(undefined, {name: 'exponential', base: parameters.base !== undefined ? parameters.base : 1}) :
                    () => 0,
                zoomStops: parameters.stops.map(s => s[0]),
                evaluate: ({zoom}) => innerFun(parameters, propertySpec, zoom, hashedStops, categoricalKeyType)
            };
        } else {
            return {
                kind: 'source',
                evaluate(_, feature) {
                    const value = feature && feature.properties ? feature.properties[parameters.property] : undefined;
                    if (value === undefined) {
                        return coalesce(parameters.default, propertySpec.default);
                    }
                    return innerFun(parameters, propertySpec, value, hashedStops, categoricalKeyType);
                }
            };
        }
    }

    function coalesce(a, b, c) {
        if (a !== undefined) return a;
        if (b !== undefined) return b;
        if (c !== undefined) return c;
    }

    function evaluateCategoricalFunction(parameters, propertySpec, input, hashedStops, keyType) {
        const evaluated = typeof input === keyType ? hashedStops[input] : undefined; // Enforce strict typing on input
        return coalesce(evaluated, parameters.default, propertySpec.default);
    }

    function evaluateIntervalFunction(parameters, propertySpec, input) {
        // Edge cases
        if (getType(input) !== 'number') return coalesce(parameters.default, propertySpec.default);
        const n = parameters.stops.length;
        if (n === 1) return parameters.stops[0][1];
        if (input <= parameters.stops[0][0]) return parameters.stops[0][1];
        if (input >= parameters.stops[n - 1][0]) return parameters.stops[n - 1][1];

        const index = findStopLessThanOrEqualTo$1(parameters.stops, input);

        return parameters.stops[index][1];
    }

    function evaluateExponentialFunction(parameters, propertySpec, input) {
        const base = parameters.base !== undefined ? parameters.base : 1;

        // Edge cases
        if (getType(input) !== 'number') return coalesce(parameters.default, propertySpec.default);
        const n = parameters.stops.length;
        if (n === 1) return parameters.stops[0][1];
        if (input <= parameters.stops[0][0]) return parameters.stops[0][1];
        if (input >= parameters.stops[n - 1][0]) return parameters.stops[n - 1][1];

        const index = findStopLessThanOrEqualTo$1(parameters.stops, input);
        const t = interpolationFactor(
            input, base,
            parameters.stops[index][0],
            parameters.stops[index + 1][0]);

        const outputLower = parameters.stops[index][1];
        const outputUpper = parameters.stops[index + 1][1];
        let interp = interpolate[propertySpec.type] || identityFunction; // eslint-disable-line import/namespace

        if (parameters.colorSpace && parameters.colorSpace !== 'rgb') {
            const colorspace = colorSpaces[parameters.colorSpace]; // eslint-disable-line import/namespace
            interp = (a, b) => colorspace.reverse(colorspace.interpolate(colorspace.forward(a), colorspace.forward(b), t));
        }

        if (typeof outputLower.evaluate === 'function') {
            return {
                evaluate(...args) {
                    const evaluatedLower = outputLower.evaluate.apply(undefined, args);
                    const evaluatedUpper = outputUpper.evaluate.apply(undefined, args);
                    // Special case for fill-outline-color, which has no spec default.
                    if (evaluatedLower === undefined || evaluatedUpper === undefined) {
                        return undefined;
                    }
                    return interp(evaluatedLower, evaluatedUpper, t);
                }
            };
        }

        return interp(outputLower, outputUpper, t);
    }

    function evaluateIdentityFunction(parameters, propertySpec, input) {
        if (propertySpec.type === 'color') {
            input = Color.parse(input);
        } else if (propertySpec.type === 'formatted') {
            input = Formatted.fromString(input.toString());
        } else if (getType(input) !== propertySpec.type && (propertySpec.type !== 'enum' || !propertySpec.values[input])) {
            input = undefined;
        }
        return coalesce(input, parameters.default, propertySpec.default);
    }

    /**
     * Returns the index of the last stop <= input, or 0 if it doesn't exist.
     *
     * @private
     */
    function findStopLessThanOrEqualTo$1(stops, input) {
        const n = stops.length;
        let lowerIndex = 0;
        let upperIndex = n - 1;
        let currentIndex = 0;
        let currentValue, upperValue;

        while (lowerIndex <= upperIndex) {
            currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
            currentValue = stops[currentIndex][0];
            upperValue = stops[currentIndex + 1][0];
            if (input === currentValue || input > currentValue && input < upperValue) { // Search complete
                return currentIndex;
            } else if (currentValue < input) {
                lowerIndex = currentIndex + 1;
            } else if (currentValue > input) {
                upperIndex = currentIndex - 1;
            }
        }

        return Math.max(currentIndex - 1, 0);
    }

    /**
     * Returns a ratio that can be used to interpolate between exponential function
     * stops.
     *
     * How it works:
     * Two consecutive stop values define a (scaled and shifted) exponential
     * function `f(x) = a * base^x + b`, where `base` is the user-specified base,
     * and `a` and `b` are constants affording sufficient degrees of freedom to fit
     * the function to the given stops.
     *
     * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
     * values without explicitly solving for `a` and `b`:
     *
     * First stop value: `f(x0) = y0 = a * base^x0 + b`
     * Second stop value: `f(x1) = y1 = a * base^x1 + b`
     * => `y1 - y0 = a(base^x1 - base^x0)`
     * => `a = (y1 - y0)/(base^x1 - base^x0)`
     *
     * Desired value: `f(x) = y = a * base^x + b`
     * => `f(x) = y0 + a * (base^x - base^x0)`
     *
     * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
     * little algebra:
     * ```
     * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
     *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
     * ```
     *
     * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
     * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
     * an interpolation factor between the two stops' output values.
     *
     * (Note: a slightly different form for `ratio`,
     * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
     * expensive `Math.pow()` operations.)
     *
     * @private
     */
    function interpolationFactor(input, base, lowerValue, upperValue) {
        const difference = upperValue - lowerValue;
        const progress = input - lowerValue;

        if (difference === 0) {
            return 0;
        } else if (base === 1) {
            return progress / difference;
        } else {
            return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
        }
    }

    //      

                                                      
                                        
                                                 
                                                                  
                                               
                                                                     
                                                             

                           
                                                                                                                              
                  
                                     
                                                                             
      

                                               

                                              
                     
                                
                              
                                                
                           
       

    class StyleExpression {
                               

                                      
                             
                                                  
                                      

        constructor(expression            , propertySpec                             ) {
            this.expression = expression;
            this._warningHistory = {};
            this._evaluator = new EvaluationContext();
            this._defaultValue = propertySpec ? getDefaultValue(propertySpec) : null;
            this._enumValues = propertySpec && propertySpec.type === 'enum' ? propertySpec.values : null;
        }

        evaluateWithoutErrorHandling(globals                  , feature          , featureState               )      {
            this._evaluator.globals = globals;
            this._evaluator.feature = feature;
            this._evaluator.featureState = featureState;

            return this.expression.evaluate(this._evaluator);
        }

        evaluate(globals                  , feature          , featureState               )      {
            this._evaluator.globals = globals;
            this._evaluator.feature = feature || null;
            this._evaluator.featureState = featureState || null;

            try {
                const val = this.expression.evaluate(this._evaluator);
                if (val === null || val === undefined) {
                    return this._defaultValue;
                }
                if (this._enumValues && !(val in this._enumValues)) {
                    throw new RuntimeError(`Expected value to be one of ${Object.keys(this._enumValues).map(v => JSON.stringify(v)).join(', ')}, but found ${JSON.stringify(val)} instead.`);
                }
                return val;
            } catch (e) {
                if (!this._warningHistory[e.message]) {
                    this._warningHistory[e.message] = true;
                    if (typeof console !== 'undefined') {
                        console.warn(e.message);
                    }
                }
                return this._defaultValue;
            }
        }
    }

    /**
     * Parse and typecheck the given style spec JSON expression.  If
     * options.defaultValue is provided, then the resulting StyleExpression's
     * `evaluate()` method will handle errors by logging a warning (once per
     * message) and returning the default value.  Otherwise, it will throw
     * evaluation errors.
     *
     * @private
     */
    function createExpression(expression       , propertySpec                             )                                               {
        const parser = new ParsingContext(expressions, [], propertySpec ? getExpectedType(propertySpec) : undefined);

        // For string-valued properties, coerce to string at the top level rather than asserting.
        const parsed = parser.parse(expression, undefined, undefined, undefined,
            propertySpec && propertySpec.type === 'string' ? {typeAnnotation: 'coerce'} : undefined);

        if (!parsed) {
            assert_1(parser.errors.length > 0);
            return error(parser.errors);
        }

        return success(new StyleExpression(parsed, propertySpec));
    }

    class ZoomConstantExpression                       {
                   
                                  
                                          

        constructor(kind      , expression                 ) {
            this.kind = kind;
            this._styleExpression = expression;
            this.isStateDependent = kind !== ('constant'                ) && !isStateConstant(expression.expression);
        }

        evaluateWithoutErrorHandling(globals                  , feature          , featureState               )      {
            return this._styleExpression.evaluateWithoutErrorHandling(globals, feature, featureState);
        }

        evaluate(globals                  , feature          , featureState               )      {
            return this._styleExpression.evaluate(globals, feature, featureState);
        }
    }

    class ZoomDependentExpression                       {
                   
                                 
                                  

                                          
                                               

        constructor(kind      , expression                 , zoomCurve                    ) {
            this.kind = kind;
            this.zoomStops = zoomCurve.labels;
            this._styleExpression = expression;
            this.isStateDependent = kind !== ('camera'                ) && !isStateConstant(expression.expression);
            if (zoomCurve instanceof Interpolate) {
                this._interpolationType = zoomCurve.interpolation;
            }
        }

        evaluateWithoutErrorHandling(globals                  , feature          , featureState               )      {
            return this._styleExpression.evaluateWithoutErrorHandling(globals, feature, featureState);
        }

        evaluate(globals                  , feature          , featureState               )      {
            return this._styleExpression.evaluate(globals, feature, featureState);
        }

        interpolationFactor(input        , lower        , upper        )         {
            if (this._interpolationType) {
                return Interpolate.interpolationFactor(this._interpolationType, input, lower, upper);
            } else {
                return 0;
            }
        }
    }

    // serialization wrapper for old-style stop functions normalized to the
    // expression interface
    class StylePropertyFunction    {
                                                   
                                                   

                             
                                                                        
                                                                                      
                                  

        constructor(parameters                               , specification                            ) {
            this._parameters = parameters;
            this._specification = specification;
            extend(this, createFunction(this._parameters, this._specification));
        }

        static deserialize(serialized                                                                                          ) {
            return ((new StylePropertyFunction(serialized._parameters, serialized._specification))                          );
        }

        static serialize(input                          ) {
            return {
                _parameters: input._parameters,
                _specification: input._specification
            };
        }
    }

    function getExpectedType(spec                            )       {
        const types = {
            color: ColorType,
            string: StringType,
            number: NumberType,
            enum: StringType,
            boolean: BooleanType,
            formatted: FormattedType
        };

        if (spec.type === 'array') {
            return array(types[spec.value] || ValueType, spec.length);
        }

        return types[spec.type];
    }

    function getDefaultValue(spec                            )        {
        if (spec.type === 'color' && isFunction(spec.default)) {
            // Special case for heatmap-color: it uses the 'default:' to define a
            // default color ramp, but createExpression expects a simple value to fall
            // back to in case of runtime errors
            return new Color(0, 0, 0, 0);
        } else if (spec.type === 'color') {
            return Color.parse(spec.default) || null;
        } else if (spec.default === undefined) {
            return null;
        } else {
            return spec.default;
        }
    }

    //      
    const { ImageData } = self;

                                                            

                                                      // eslint-disable-line
                            
              
              
                 
                
                
                 
                
                
              
                
                     
                          
                   
                           
                           

                     
                   
                              
                                         
                                           
         
      

                               
                                        
                                          
     

    const registry           = {};

    /**
     * Register the given class as serializable.
     *
     * @param options
     * @param options.omit List of properties to omit from serialization (e.g., cached/computed properties)
     * @param options.shallow List of properties that should be serialized by a simple shallow copy, rather than by a recursive call to serialize().
     *
     * @private
     */
    function register        (name        , klass          , options                     = {}) {
        assert_1(!registry[name], `${name} is already registered.`);
        (Object.defineProperty     )(klass, '_classRegistryKey', {
            value: name,
            writeable: false
        });
        registry[name] = {
            klass,
            omit: options.omit || [],
            shallow: options.shallow || []
        };
    }

    register('Object', Object);

                                                  

    gridIndex.serialize = function serialize(grid      , transferables                      )                 {
        const buffer = grid.toArrayBuffer();
        if (transferables) {
            transferables.push(buffer);
        }
        return {buffer};
    };

    gridIndex.deserialize = function deserialize(serialized                )       {
        return new gridIndex(serialized.buffer);
    };
    register('Grid', gridIndex);

    register('Color', Color);
    register('Error', Error);

    register('StylePropertyFunction', StylePropertyFunction);
    register('StyleExpression', StyleExpression, {omit: ['_evaluator']});

    register('ZoomDependentExpression', ZoomDependentExpression);
    register('ZoomConstantExpression', ZoomConstantExpression);
    register('CompoundExpression', CompoundExpression, {omit: ['_evaluate']});
    for (const name in expressions) {
        if ((expressions[name]     )._classRegistryKey) continue;
        register(`Expression_${name}`, expressions[name]);
    }

    /**
     * Serialize the given object for transfer to or from a web worker.
     *
     * For non-builtin types, recursively serialize each property (possibly
     * omitting certain properties - see register()), and package the result along
     * with the constructor's `name` so that the appropriate constructor can be
     * looked up in `deserialize()`.
     *
     * If a `transferables` array is provided, add any transferable objects (i.e.,
     * any ArrayBuffers or ArrayBuffer views) to the list. (If a copy is needed,
     * this should happen in the client code, before using serialize().)
     *
     * @private
     */
    function serialize(input       , transferables                      )             {
        if (input === null ||
            input === undefined ||
            typeof input === 'boolean' ||
            typeof input === 'number' ||
            typeof input === 'string' ||
            input instanceof Boolean ||
            input instanceof Number ||
            input instanceof String ||
            input instanceof Date ||
            input instanceof RegExp) {
            return input;
        }

        if (input instanceof ArrayBuffer) {
            if (transferables) {
                transferables.push(input);
            }
            return input;
        }

        if (ArrayBuffer.isView(input)) {
            const view                   = (input     );
            if (transferables) {
                transferables.push(view.buffer);
            }
            return view;
        }

        if (input instanceof ImageData) {
            if (transferables) {
                transferables.push(input.data.buffer);
            }
            return input;
        }

        if (Array.isArray(input)) {
            const serialized                    = [];
            for (const item of input) {
                serialized.push(serialize(item, transferables));
            }
            return serialized;
        }

        if (typeof input === 'object') {
            const klass = (input.constructor     );
            const name = klass._classRegistryKey;
            if (!name) {
                throw new Error(`can't serialize object of unregistered class`);
            }
            assert_1(registry[name]);

            const properties                   = klass.serialize ?
                // (Temporary workaround) allow a class to provide static
                // `serialize()` and `deserialize()` methods to bypass the generic
                // approach.
                // This temporary workaround lets us use the generic serialization
                // approach for objects whose members include instances of dynamic
                // StructArray types. Once we refactor StructArray to be static,
                // we can remove this complexity.
                (klass.serialize(input, transferables)                  ) : {};

            if (!klass.serialize) {
                for (const key in input) {
                    // any cast due to https://github.com/facebook/flow/issues/5393
                    if (!(input     ).hasOwnProperty(key)) continue;
                    if (registry[name].omit.indexOf(key) >= 0) continue;
                    const property = (input     )[key];
                    properties[key] = registry[name].shallow.indexOf(key) >= 0 ?
                        property :
                        serialize(property, transferables);
                }
                if (input instanceof Error) {
                    properties.message = input.message;
                }
            } else {
                // make sure statically serialized object survives transfer of $name property
                assert_1(!transferables || properties !== transferables[transferables.length - 1]);
            }

            if (properties.$name) {
                throw new Error('$name property is reserved for worker serialization logic.');
            }
            if (name !== 'Object') {
                properties.$name = name;
            }

            return properties;
        }

        throw new Error(`can't serialize object of type ${typeof input}`);
    }

    function deserialize(input            )        {
        if (input === null ||
            input === undefined ||
            typeof input === 'boolean' ||
            typeof input === 'number' ||
            typeof input === 'string' ||
            input instanceof Boolean ||
            input instanceof Number ||
            input instanceof String ||
            input instanceof Date ||
            input instanceof RegExp ||
            input instanceof ArrayBuffer ||
            ArrayBuffer.isView(input) ||
            input instanceof ImageData) {
            return input;
        }

        if (Array.isArray(input)) {
            return input.map(deserialize);
        }

        if (typeof input === 'object') {
            const name = (input     ).$name || 'Object';

            const {klass} = registry[name];
            if (!klass) {
                throw new Error(`can't deserialize unregistered class ${name}`);
            }

            if (klass.deserialize) {
                return (klass.deserialize                    )(input);
            }

            const result = Object.create(klass.prototype);

            for (const key of Object.keys(input)) {
                if (key === '$name') continue;
                const value = (input                  )[key];
                result[key] = registry[name].shallow.indexOf(key) >= 0 ? value : deserialize(value);
            }

            return result;
        }

        throw new Error(`can't deserialize object of type ${typeof input}`);
    }

    //      

    class CanonicalTileID {
                  
                  
                  
                    

        constructor(z        , x        , y        ) {
            assert_1(z >= 0 && z <= 25);
            assert_1(x >= 0 && x < Math.pow(2, z));
            assert_1(y >= 0 && y < Math.pow(2, z));
            this.z = z;
            this.x = x;
            this.y = y;
            this.key = calculateKey(0, z, x, y);
        }

        equals(id                 ) {
            return this.z === id.z && this.x === id.x && this.y === id.y;
        }

        // given a list of urls, choose a url template and return a tile URL
        url(urls               , scheme         ) {
            const bbox = getTileBBox(this.x, this.y, this.z);
            const quadkey = getQuadkey(this.z, this.x, this.y);

            return urls[(this.x + this.y) % urls.length]
                .replace('{prefix}', (this.x % 16).toString(16) + (this.y % 16).toString(16))
                .replace('{z}', String(this.z))
                .replace('{x}', String(this.x))
                .replace('{y}', String(scheme === 'tms' ? (Math.pow(2, this.z) - this.y - 1) : this.y))
                .replace('{quadkey}', quadkey)
                .replace('{bbox-epsg-3857}', bbox);
        }

        getTilePoint(coord                    ) {
            const tilesAtZoom = Math.pow(2, this.z);
            return new pointGeometry(
                (coord.x * tilesAtZoom - this.x) * EXTENT,
                (coord.y * tilesAtZoom - this.y) * EXTENT);
        }
    }

    class UnwrappedTileID {
                     
                                   
                    

        constructor(wrap        , canonical                 ) {
            this.wrap = wrap;
            this.canonical = canonical;
            this.key = calculateKey(wrap, canonical.z, canonical.x, canonical.y);
        }
    }

    class OverscaledTileID {
                            
                     
                                   
                    
                                

        constructor(overscaledZ        , wrap        , z        , x        , y        ) {
            assert_1(overscaledZ >= z);
            this.overscaledZ = overscaledZ;
            this.wrap = wrap;
            this.canonical = new CanonicalTileID(z, +x, +y);
            this.key = calculateKey(wrap, overscaledZ, x, y);
        }

        equals(id                  ) {
            return this.overscaledZ === id.overscaledZ && this.wrap === id.wrap && this.canonical.equals(id.canonical);
        }

        scaledTo(targetZ        ) {
            assert_1(targetZ <= this.overscaledZ);
            const zDifference = this.canonical.z - targetZ;
            if (targetZ > this.canonical.z) {
                return new OverscaledTileID(targetZ, this.wrap, this.canonical.z, this.canonical.x, this.canonical.y);
            } else {
                return new OverscaledTileID(targetZ, this.wrap, targetZ, this.canonical.x >> zDifference, this.canonical.y >> zDifference);
            }
        }

        isChildOf(parent                  ) {
            if (parent.wrap !== this.wrap) {
                // We can't be a child if we're in a different world copy
                return false;
            }
            const zDifference = this.canonical.z - parent.canonical.z;
            // We're first testing for z == 0, to avoid a 32 bit shift, which is undefined.
            return parent.overscaledZ === 0 || (
                parent.overscaledZ < this.overscaledZ &&
                    parent.canonical.x === (this.canonical.x >> zDifference) &&
                    parent.canonical.y === (this.canonical.y >> zDifference));
        }

        children(sourceMaxZoom        ) {
            if (this.overscaledZ >= sourceMaxZoom) {
                // return a single tile coord representing a an overscaled tile
                return [new OverscaledTileID(this.overscaledZ + 1, this.wrap, this.canonical.z, this.canonical.x, this.canonical.y)];
            }

            const z = this.canonical.z + 1;
            const x = this.canonical.x * 2;
            const y = this.canonical.y * 2;
            return [
                new OverscaledTileID(z, this.wrap, z, x, y),
                new OverscaledTileID(z, this.wrap, z, x + 1, y),
                new OverscaledTileID(z, this.wrap, z, x, y + 1),
                new OverscaledTileID(z, this.wrap, z, x + 1, y + 1)
            ];
        }

        isLessThan(rhs                  ) {
            if (this.wrap < rhs.wrap) return true;
            if (this.wrap > rhs.wrap) return false;

            if (this.overscaledZ < rhs.overscaledZ) return true;
            if (this.overscaledZ > rhs.overscaledZ) return false;

            if (this.canonical.x < rhs.canonical.x) return true;
            if (this.canonical.x > rhs.canonical.x) return false;

            if (this.canonical.y < rhs.canonical.y) return true;
            return false;
        }

        wrapped() {
            return new OverscaledTileID(this.overscaledZ, 0, this.canonical.z, this.canonical.x, this.canonical.y);
        }

        unwrapTo(wrap        ) {
            return new OverscaledTileID(this.overscaledZ, wrap, this.canonical.z, this.canonical.x, this.canonical.y);
        }

        overscaleFactor() {
            return Math.pow(2, this.overscaledZ - this.canonical.z);
        }

        toUnwrapped() {
            return new UnwrappedTileID(this.wrap, this.canonical);
        }

        toString() {
            return `${this.overscaledZ}/${this.canonical.x}/${this.canonical.y}`;
        }

        getTilePoint(coord                    ) {
            return this.canonical.getTilePoint(new MercatorCoordinate(coord.x - this.wrap, coord.y));
        }
    }

    function calculateKey(wrap        , z        , x        , y        ) {
        wrap *= 2;
        if (wrap < 0) wrap = wrap * -1 - 1;
        const dim = 1 << z;
        return ((dim * dim * wrap + dim * y + x) * 32) + z;
    }


    function getQuadkey(z, x, y) {
        let quadkey = '', mask;
        for (let i = z; i > 0; i--) {
            mask = 1 << (i - 1);
            quadkey += ((x & mask ? 1 : 0) + (y & mask ? 2 : 0));
        }
        return quadkey;
    }

    register('CanonicalTileID', CanonicalTileID);
    register('OverscaledTileID', OverscaledTileID, {omit: ['posMatrix']});

    //      

    function tileCover(z        , bounds                                                                                  ,
        actualZ        , renderWorldCopies                )                          {
        if (renderWorldCopies === undefined) {
            renderWorldCopies = true;
        }
        const tiles = 1 << z;
        const t = {};

        function scanLine(x0, x1, y) {
            let x, w, wx, coord;
            if (y >= 0 && y <= tiles) {
                for (x = x0; x < x1; x++) {
                    w = Math.floor(x / tiles);
                    wx = (x % tiles + tiles) % tiles;
                    if (w === 0 || renderWorldCopies === true) {
                        coord = new OverscaledTileID(actualZ, w, z, wx, y);
                        t[coord.key] = coord;
                    }
                }
            }
        }

        const zoomedBounds = bounds.map((coord) => new pointGeometry(coord.x, coord.y)._mult(tiles));

        // Divide the screen up in two triangles and scan each of them:
        // +---/
        // | / |
        // /---+
        scanTriangle(zoomedBounds[0], zoomedBounds[1], zoomedBounds[2], 0, tiles, scanLine);
        scanTriangle(zoomedBounds[2], zoomedBounds[3], zoomedBounds[0], 0, tiles, scanLine);

        return Object.keys(t).map((id) => {
            return t[id];
        });
    }


    // Taken from polymaps src/Layer.js
    // https://github.com/simplegeo/polymaps/blob/master/src/Layer.js#L333-L383

    function edge(a       , b       ) {
        if (a.y > b.y) { const t = a; a = b; b = t; }
        return {
            x0: a.x,
            y0: a.y,
            x1: b.x,
            y1: b.y,
            dx: b.x - a.x,
            dy: b.y - a.y
        };
    }

    function scanSpans(e0, e1, ymin, ymax, scanLine) {
        const y0 = Math.max(ymin, Math.floor(e1.y0));
        const y1 = Math.min(ymax, Math.ceil(e1.y1));

        // sort edges by x-coordinate
        if ((e0.x0 === e1.x0 && e0.y0 === e1.y0) ?
            (e0.x0 + e1.dy / e0.dy * e0.dx < e1.x1) :
            (e0.x1 - e1.dy / e0.dy * e0.dx < e1.x0)) {
            const t = e0; e0 = e1; e1 = t;
        }

        // scan lines!
        const m0 = e0.dx / e0.dy;
        const m1 = e1.dx / e1.dy;
        const d0 = e0.dx > 0; // use y + 1 to compute x0
        const d1 = e1.dx < 0; // use y + 1 to compute x1
        for (let y = y0; y < y1; y++) {
            const x0 = m0 * Math.max(0, Math.min(e0.dy, y + d0 - e0.y0)) + e0.x0;
            const x1 = m1 * Math.max(0, Math.min(e1.dy, y + d1 - e1.y0)) + e1.x0;
            scanLine(Math.floor(x1), Math.ceil(x0), y);
        }
    }

    function scanTriangle(a       , b       , c       , ymin, ymax, scanLine) {
        let ab = edge(a, b),
            bc = edge(b, c),
            ca = edge(c, a);

        let t;

        // sort edges by y-length
        if (ab.dy > bc.dy) { t = ab; ab = bc; bc = t; }
        if (ab.dy > ca.dy) { t = ab; ab = ca; ca = t; }
        if (bc.dy > ca.dy) { t = bc; bc = ca; ca = t; }

        // scan span! scan span!
        if (ab.dy) scanSpans(ca, ab, ymin, ymax, scanLine);
        if (bc.dy) scanSpans(ca, bc, ymin, ymax, scanLine);
    }

    //      

                                                         
                                            
                                                                                
                                                    
                                             
                                                              
                                                             

                                                            
                      
                             
                     
                           
                            
                                             
                                 
                        
     

                                      
                                   
                             
                                
                             
     

                                  
                                   
                      
                                 
     

                                  
                      
                                 
                                      
                           
                        
                 
                                                                            
       

    /**
     * The `Bucket` interface is the single point of knowledge about turning vector
     * tiles into WebGL buffers.
     *
     * `Bucket` is an abstract interface. An implementation exists for each style layer type.
     * Create a bucket via the `StyleLayer#createBucket` method.
     *
     * The concrete bucket types, using layout options from the style layer,
     * transform feature geometries into vertex and index data for use by the
     * vertex shader.  They also (via `ProgramConfiguration`) use feature
     * properties and the zoom level to populate the attributes needed for
     * data-driven styling.
     *
     * Buckets are designed to be built on a worker thread and then serialized and
     * transferred back to the main thread for rendering.  On the worker side, a
     * bucket's vertex, index, and attribute data is stored in `bucket.arrays:
     * ArrayGroup`.  When a bucket's data is serialized and sent back to the main
     * thread, is gets deserialized (using `new Bucket(serializedBucketData)`, with
     * the array data now stored in `bucket.buffers: BufferGroup`.  BufferGroups
     * hold the same data as ArrayGroups, but are tuned for consumption by WebGL.
     *
     * @private
     */
                             
                                
                            
                            
                                          
                                               
                                                                                     
                                                                                                                 
                           

                                       
                                 

           
                                                                                     
                                                                                    
                                                                                       
          
                   
           
                        
     

    function deserialize$1(input               , style       )                     {
        const output = {};

        // Guard against the case where the map's style has been set to null while
        // this bucket has been parsing.
        if (!style) return output;

        for (const bucket of input) {
            const layers = bucket.layerIds
                .map((id) => style.getLayer(id))
                .filter(Boolean);

            if (layers.length === 0) {
                continue;
            }

            // look up StyleLayer objects from layer ids (since we don't
            // want to waste time serializing/copying them from the worker)
            (bucket     ).layers = layers;
            if ((bucket     ).stateDependentLayerIds) {
                (bucket     ).stateDependentLayers = (bucket     ).stateDependentLayerIds.map((lId) => layers.filter((l) => l.id === lId)[0]);
            }
            for (const layer of layers) {
                output[layer.id] = bucket;
            }
        }

        return output;
    }

    //      

                                                    

    // These bounds define the minimum and maximum supported coordinate values.
    // While visible coordinates are within [0, EXTENT], tiles may theoretically
    // contain cordinates within [-Infinity, Infinity]. Our range is limited by the
    // number of bits used to represent the coordinate.
    function createBounds(bits) {
        return {
            min: -1 * Math.pow(2, bits - 1),
            max: Math.pow(2, bits - 1) - 1
        };
    }

    const bounds = createBounds(16);

    /**
     * Loads a geometry from a VectorTileFeature and scales it to the common extent
     * used internally.
     * @param {VectorTileFeature} feature
     * @private
     */
    function loadGeometry(feature                   )                      {
        const scale = EXTENT / feature.extent;
        const geometry = feature.loadGeometry();
        for (let r = 0; r < geometry.length; r++) {
            const ring = geometry[r];
            for (let p = 0; p < ring.length; p++) {
                const point = ring[p];
                // round here because mapbox-gl-native uses integers to represent
                // points and we need to do the same to avoid renering differences.
                point.x = Math.round(point.x * scale);
                point.y = Math.round(point.y * scale);

                if (point.x < bounds.min || point.x > bounds.max || point.y < bounds.min || point.y > bounds.max) {
                    warnOnce('Geometry exceeds allowed extent, reduce your vector tile buffer size');
                }
            }
        }
        return geometry;
    }

    //      

    function isExpressionFilter(filter     ) {
        if (filter === true || filter === false) {
            return true;
        }

        if (!Array.isArray(filter) || filter.length === 0) {
            return false;
        }
        switch (filter[0]) {
        case 'has':
            return filter.length >= 2 && filter[1] !== '$id' && filter[1] !== '$type';

        case 'in':
        case '!in':
        case '!has':
        case 'none':
            return false;

        case '==':
        case '!=':
        case '>':
        case '>=':
        case '<':
        case '<=':
            return filter.length !== 3 || (Array.isArray(filter[1]) || Array.isArray(filter[2]));

        case 'any':
        case 'all':
            for (const f of filter.slice(1)) {
                if (!isExpressionFilter(f) && typeof f !== 'boolean') {
                    return false;
                }
            }
            return true;

        default:
            return true;
        }
    }

    const filterSpec = {
        'type': 'boolean',
        'default': false,
        'transition': false,
        'property-type': 'data-driven',
        'expression': {
            'interpolated': false,
            'parameters': ['zoom', 'feature']
        }
    };

    /**
     * Given a filter expressed as nested arrays, return a new function
     * that evaluates whether a given feature (with a .properties or .tags property)
     * passes its test.
     *
     * @private
     * @param {Array} filter mapbox gl filter
     * @returns {Function} filter-evaluating function
     */
    function createFilter(filter     )                {
        if (filter === null || filter === undefined) {
            return () => true;
        }

        if (!isExpressionFilter(filter)) {
            filter = convertFilter(filter);
        }

        const compiled = createExpression(filter, filterSpec);
        if (compiled.result === 'error') {
            throw new Error(compiled.value.map(err => `${err.key}: ${err.message}`).join(', '));
        } else {
            return (globalProperties                  , feature                   ) => compiled.value.evaluate(globalProperties, feature);
        }
    }

    // Comparison function to sort numbers and strings
    function compare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    function convertFilter(filter             )        {
        if (!filter) return true;
        const op = filter[0];
        if (filter.length <= 1) return (op !== 'any');
        const converted =
            op === '==' ? convertComparisonOp(filter[1], filter[2], '==') :
            op === '!=' ? convertNegation(convertComparisonOp(filter[1], filter[2], '==')) :
            op === '<' ||
            op === '>' ||
            op === '<=' ||
            op === '>=' ? convertComparisonOp(filter[1], filter[2], op) :
            op === 'any' ? convertDisjunctionOp(filter.slice(1)) :
            op === 'all' ? ['all'].concat(filter.slice(1).map(convertFilter)) :
            op === 'none' ? ['all'].concat(filter.slice(1).map(convertFilter).map(convertNegation)) :
            op === 'in' ? convertInOp(filter[1], filter.slice(2)) :
            op === '!in' ? convertNegation(convertInOp(filter[1], filter.slice(2))) :
            op === 'has' ? convertHasOp(filter[1]) :
            op === '!has' ? convertNegation(convertHasOp(filter[1])) :
            true;
        return converted;
    }

    function convertComparisonOp(property        , value     , op        ) {
        switch (property) {
        case '$type':
            return [`filter-type-${op}`, value];
        case '$id':
            return [`filter-id-${op}`, value];
        default:
            return [`filter-${op}`, property, value];
        }
    }

    function convertDisjunctionOp(filters                   ) {
        return ['any'].concat(filters.map(convertFilter));
    }

    function convertInOp(property        , values            ) {
        if (values.length === 0) { return false; }
        switch (property) {
        case '$type':
            return [`filter-type-in`, ['literal', values]];
        case '$id':
            return [`filter-id-in`, ['literal', values]];
        default:
            if (values.length > 200 && !values.some(v => typeof v !== typeof values[0])) {
                return ['filter-in-large', property, ['literal', values.sort(compare)]];
            } else {
                return ['filter-in-small', property, ['literal', values]];
            }
        }
    }

    function convertHasOp(property        ) {
        switch (property) {
        case '$type':
            return true;
        case '$id':
            return [`filter-has-id`];
        default:
            return [`filter-has`, property];
        }
    }

    function convertNegation(filter       ) {
        return ['!', filter];
    }

    //      

    class DictionaryCoder {
                                              
                                       

        constructor(strings               ) {
            this._stringToNumber = {};
            this._numberToString = [];
            for (let i = 0; i < strings.length; i++) {
                const string = strings[i];
                this._stringToNumber[string] = i;
                this._numberToString[i] = string;
            }
        }

        encode(string        ) {
            assert_1(string in this._stringToNumber);
            return this._stringToNumber[string];
        }

        decode(n        ) {
            assert_1(n < this._numberToString.length);
            return this._numberToString[n];
        }
    }

    var vectortilefeature = VectorTileFeature;

    function VectorTileFeature(pbf, end, extent, keys, values) {
        // Public
        this.properties = {};
        this.extent = extent;
        this.type = 0;

        // Private
        this._pbf = pbf;
        this._geometry = -1;
        this._keys = keys;
        this._values = values;

        pbf.readFields(readFeature, this, end);
    }

    function readFeature(tag, feature, pbf) {
        if (tag == 1) feature.id = pbf.readVarint();
        else if (tag == 2) readTag(pbf, feature);
        else if (tag == 3) feature.type = pbf.readVarint();
        else if (tag == 4) feature._geometry = pbf.pos;
    }

    function readTag(pbf, feature) {
        var end = pbf.readVarint() + pbf.pos;

        while (pbf.pos < end) {
            var key = feature._keys[pbf.readVarint()],
                value = feature._values[pbf.readVarint()];
            feature.properties[key] = value;
        }
    }

    VectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon'];

    VectorTileFeature.prototype.loadGeometry = function() {
        var pbf = this._pbf;
        pbf.pos = this._geometry;

        var end = pbf.readVarint() + pbf.pos,
            cmd = 1,
            length = 0,
            x = 0,
            y = 0,
            lines = [],
            line;

        while (pbf.pos < end) {
            if (length <= 0) {
                var cmdLen = pbf.readVarint();
                cmd = cmdLen & 0x7;
                length = cmdLen >> 3;
            }

            length--;

            if (cmd === 1 || cmd === 2) {
                x += pbf.readSVarint();
                y += pbf.readSVarint();

                if (cmd === 1) { // moveTo
                    if (line) lines.push(line);
                    line = [];
                }

                line.push(new pointGeometry(x, y));

            } else if (cmd === 7) {

                // Workaround for https://github.com/mapbox/mapnik-vector-tile/issues/90
                if (line) {
                    line.push(line[0].clone()); // closePolygon
                }

            } else {
                throw new Error('unknown command ' + cmd);
            }
        }

        if (line) lines.push(line);

        return lines;
    };

    VectorTileFeature.prototype.bbox = function() {
        var pbf = this._pbf;
        pbf.pos = this._geometry;

        var end = pbf.readVarint() + pbf.pos,
            cmd = 1,
            length = 0,
            x = 0,
            y = 0,
            x1 = Infinity,
            x2 = -Infinity,
            y1 = Infinity,
            y2 = -Infinity;

        while (pbf.pos < end) {
            if (length <= 0) {
                var cmdLen = pbf.readVarint();
                cmd = cmdLen & 0x7;
                length = cmdLen >> 3;
            }

            length--;

            if (cmd === 1 || cmd === 2) {
                x += pbf.readSVarint();
                y += pbf.readSVarint();
                if (x < x1) x1 = x;
                if (x > x2) x2 = x;
                if (y < y1) y1 = y;
                if (y > y2) y2 = y;

            } else if (cmd !== 7) {
                throw new Error('unknown command ' + cmd);
            }
        }

        return [x1, y1, x2, y2];
    };

    VectorTileFeature.prototype.toGeoJSON = function(x, y, z) {
        var size = this.extent * Math.pow(2, z),
            x0 = this.extent * x,
            y0 = this.extent * y,
            coords = this.loadGeometry(),
            type = VectorTileFeature.types[this.type],
            i, j;

        function project(line) {
            for (var j = 0; j < line.length; j++) {
                var p = line[j], y2 = 180 - (p.y + y0) * 360 / size;
                line[j] = [
                    (p.x + x0) * 360 / size - 180,
                    360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90
                ];
            }
        }

        switch (this.type) {
        case 1:
            var points = [];
            for (i = 0; i < coords.length; i++) {
                points[i] = coords[i][0];
            }
            coords = points;
            project(coords);
            break;

        case 2:
            for (i = 0; i < coords.length; i++) {
                project(coords[i]);
            }
            break;

        case 3:
            coords = classifyRings(coords);
            for (i = 0; i < coords.length; i++) {
                for (j = 0; j < coords[i].length; j++) {
                    project(coords[i][j]);
                }
            }
            break;
        }

        if (coords.length === 1) {
            coords = coords[0];
        } else {
            type = 'Multi' + type;
        }

        var result = {
            type: "Feature",
            geometry: {
                type: type,
                coordinates: coords
            },
            properties: this.properties
        };

        if ('id' in this) {
            result.id = this.id;
        }

        return result;
    };

    // classifies an array of rings into polygons with outer rings and holes

    function classifyRings(rings) {
        var len = rings.length;

        if (len <= 1) return [rings];

        var polygons = [],
            polygon,
            ccw;

        for (var i = 0; i < len; i++) {
            var area = signedArea(rings[i]);
            if (area === 0) continue;

            if (ccw === undefined) ccw = area < 0;

            if (ccw === area < 0) {
                if (polygon) polygons.push(polygon);
                polygon = [rings[i]];

            } else {
                polygon.push(rings[i]);
            }
        }
        if (polygon) polygons.push(polygon);

        return polygons;
    }

    function signedArea(ring) {
        var sum = 0;
        for (var i = 0, len = ring.length, j = len - 1, p1, p2; i < len; j = i++) {
            p1 = ring[i];
            p2 = ring[j];
            sum += (p2.x - p1.x) * (p1.y + p2.y);
        }
        return sum;
    }

    var vectortilelayer = VectorTileLayer;

    function VectorTileLayer(pbf, end) {
        // Public
        this.version = 1;
        this.name = null;
        this.extent = 4096;
        this.length = 0;

        // Private
        this._pbf = pbf;
        this._keys = [];
        this._values = [];
        this._features = [];

        pbf.readFields(readLayer, this, end);

        this.length = this._features.length;
    }

    function readLayer(tag, layer, pbf) {
        if (tag === 15) layer.version = pbf.readVarint();
        else if (tag === 1) layer.name = pbf.readString();
        else if (tag === 5) layer.extent = pbf.readVarint();
        else if (tag === 2) layer._features.push(pbf.pos);
        else if (tag === 3) layer._keys.push(pbf.readString());
        else if (tag === 4) layer._values.push(readValueMessage(pbf));
    }

    function readValueMessage(pbf) {
        var value = null,
            end = pbf.readVarint() + pbf.pos;

        while (pbf.pos < end) {
            var tag = pbf.readVarint() >> 3;

            value = tag === 1 ? pbf.readString() :
                tag === 2 ? pbf.readFloat() :
                tag === 3 ? pbf.readDouble() :
                tag === 4 ? pbf.readVarint64() :
                tag === 5 ? pbf.readVarint() :
                tag === 6 ? pbf.readSVarint() :
                tag === 7 ? pbf.readBoolean() : null;
        }

        return value;
    }

    // return feature `i` from this layer as a `VectorTileFeature`
    VectorTileLayer.prototype.feature = function(i) {
        if (i < 0 || i >= this._features.length) throw new Error('feature index out of bounds');

        this._pbf.pos = this._features[i];

        var end = this._pbf.readVarint() + this._pbf.pos;
        return new vectortilefeature(this._pbf, end, this.extent, this._keys, this._values);
    };

    var vectortile = VectorTile;

    function VectorTile(pbf, end) {
        this.layers = pbf.readFields(readTile, {}, end);
    }

    function readTile(tag, layers, pbf) {
        if (tag === 3) {
            var layer = new vectortilelayer(pbf, pbf.readVarint() + pbf.pos);
            if (layer.length) layers[layer.name] = layer;
        }
    }

    var VectorTile$1 = vectortile;
    var VectorTileFeature$1 = vectortilefeature;
    var VectorTileLayer$1 = vectortilelayer;

    var vectorTile = {
    	VectorTile: VectorTile$1,
    	VectorTileFeature: VectorTileFeature$1,
    	VectorTileLayer: VectorTileLayer$1
    };

    var read = function (buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = (nBytes * 8) - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? (nBytes - 1) : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];

      i += d;

      e = s & ((1 << (-nBits)) - 1);
      s >>= (-nBits);
      nBits += eLen;
      for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

      m = e & ((1 << (-nBits)) - 1);
      e >>= (-nBits);
      nBits += mLen;
      for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    };

    var write = function (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = (nBytes * 8) - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
      var i = isLE ? 0 : (nBytes - 1);
      var d = isLE ? 1 : -1;
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

      value = Math.abs(value);

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }

        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = ((value * c) - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

      e = (e << mLen) | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

      buffer[offset + i - d] |= s * 128;
    };

    var ieee754 = {
    	read: read,
    	write: write
    };

    var pbf = Pbf;



    function Pbf(buf) {
        this.buf = ArrayBuffer.isView && ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf || 0);
        this.pos = 0;
        this.type = 0;
        this.length = this.buf.length;
    }

    Pbf.Varint  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
    Pbf.Fixed64 = 1; // 64-bit: double, fixed64, sfixed64
    Pbf.Bytes   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
    Pbf.Fixed32 = 5; // 32-bit: float, fixed32, sfixed32

    var SHIFT_LEFT_32 = (1 << 16) * (1 << 16),
        SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;

    Pbf.prototype = {

        destroy: function() {
            this.buf = null;
        },

        // === READING =================================================================

        readFields: function(readField, result, end) {
            end = end || this.length;

            while (this.pos < end) {
                var val = this.readVarint(),
                    tag = val >> 3,
                    startPos = this.pos;

                this.type = val & 0x7;
                readField(tag, result, this);

                if (this.pos === startPos) this.skip(val);
            }
            return result;
        },

        readMessage: function(readField, result) {
            return this.readFields(readField, result, this.readVarint() + this.pos);
        },

        readFixed32: function() {
            var val = readUInt32(this.buf, this.pos);
            this.pos += 4;
            return val;
        },

        readSFixed32: function() {
            var val = readInt32(this.buf, this.pos);
            this.pos += 4;
            return val;
        },

        // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

        readFixed64: function() {
            var val = readUInt32(this.buf, this.pos) + readUInt32(this.buf, this.pos + 4) * SHIFT_LEFT_32;
            this.pos += 8;
            return val;
        },

        readSFixed64: function() {
            var val = readUInt32(this.buf, this.pos) + readInt32(this.buf, this.pos + 4) * SHIFT_LEFT_32;
            this.pos += 8;
            return val;
        },

        readFloat: function() {
            var val = ieee754.read(this.buf, this.pos, true, 23, 4);
            this.pos += 4;
            return val;
        },

        readDouble: function() {
            var val = ieee754.read(this.buf, this.pos, true, 52, 8);
            this.pos += 8;
            return val;
        },

        readVarint: function(isSigned) {
            var buf = this.buf,
                val, b;

            b = buf[this.pos++]; val  =  b & 0x7f;        if (b < 0x80) return val;
            b = buf[this.pos++]; val |= (b & 0x7f) << 7;  if (b < 0x80) return val;
            b = buf[this.pos++]; val |= (b & 0x7f) << 14; if (b < 0x80) return val;
            b = buf[this.pos++]; val |= (b & 0x7f) << 21; if (b < 0x80) return val;
            b = buf[this.pos];   val |= (b & 0x0f) << 28;

            return readVarintRemainder(val, isSigned, this);
        },

        readVarint64: function() { // for compatibility with v2.0.1
            return this.readVarint(true);
        },

        readSVarint: function() {
            var num = this.readVarint();
            return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
        },

        readBoolean: function() {
            return Boolean(this.readVarint());
        },

        readString: function() {
            var end = this.readVarint() + this.pos,
                str = readUtf8(this.buf, this.pos, end);
            this.pos = end;
            return str;
        },

        readBytes: function() {
            var end = this.readVarint() + this.pos,
                buffer = this.buf.subarray(this.pos, end);
            this.pos = end;
            return buffer;
        },

        // verbose for performance reasons; doesn't affect gzipped size

        readPackedVarint: function(arr, isSigned) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readVarint(isSigned));
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readVarint(isSigned));
            return arr;
        },
        readPackedSVarint: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readSVarint());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readSVarint());
            return arr;
        },
        readPackedBoolean: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readBoolean());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readBoolean());
            return arr;
        },
        readPackedFloat: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readFloat());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readFloat());
            return arr;
        },
        readPackedDouble: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readDouble());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readDouble());
            return arr;
        },
        readPackedFixed32: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readFixed32());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readFixed32());
            return arr;
        },
        readPackedSFixed32: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readSFixed32());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readSFixed32());
            return arr;
        },
        readPackedFixed64: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readFixed64());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readFixed64());
            return arr;
        },
        readPackedSFixed64: function(arr) {
            if (this.type !== Pbf.Bytes) return arr.push(this.readSFixed64());
            var end = readPackedEnd(this);
            arr = arr || [];
            while (this.pos < end) arr.push(this.readSFixed64());
            return arr;
        },

        skip: function(val) {
            var type = val & 0x7;
            if (type === Pbf.Varint) while (this.buf[this.pos++] > 0x7f) {}
            else if (type === Pbf.Bytes) this.pos = this.readVarint() + this.pos;
            else if (type === Pbf.Fixed32) this.pos += 4;
            else if (type === Pbf.Fixed64) this.pos += 8;
            else throw new Error('Unimplemented type: ' + type);
        },

        // === WRITING =================================================================

        writeTag: function(tag, type) {
            this.writeVarint((tag << 3) | type);
        },

        realloc: function(min) {
            var length = this.length || 16;

            while (length < this.pos + min) length *= 2;

            if (length !== this.length) {
                var buf = new Uint8Array(length);
                buf.set(this.buf);
                this.buf = buf;
                this.length = length;
            }
        },

        finish: function() {
            this.length = this.pos;
            this.pos = 0;
            return this.buf.subarray(0, this.length);
        },

        writeFixed32: function(val) {
            this.realloc(4);
            writeInt32(this.buf, val, this.pos);
            this.pos += 4;
        },

        writeSFixed32: function(val) {
            this.realloc(4);
            writeInt32(this.buf, val, this.pos);
            this.pos += 4;
        },

        writeFixed64: function(val) {
            this.realloc(8);
            writeInt32(this.buf, val & -1, this.pos);
            writeInt32(this.buf, Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
            this.pos += 8;
        },

        writeSFixed64: function(val) {
            this.realloc(8);
            writeInt32(this.buf, val & -1, this.pos);
            writeInt32(this.buf, Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
            this.pos += 8;
        },

        writeVarint: function(val) {
            val = +val || 0;

            if (val > 0xfffffff || val < 0) {
                writeBigVarint(val, this);
                return;
            }

            this.realloc(4);

            this.buf[this.pos++] =           val & 0x7f  | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
            this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
            this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
            this.buf[this.pos++] =   (val >>> 7) & 0x7f;
        },

        writeSVarint: function(val) {
            this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
        },

        writeBoolean: function(val) {
            this.writeVarint(Boolean(val));
        },

        writeString: function(str) {
            str = String(str);
            this.realloc(str.length * 4);

            this.pos++; // reserve 1 byte for short string length

            var startPos = this.pos;
            // write the string directly to the buffer and see how much was written
            this.pos = writeUtf8(this.buf, str, this.pos);
            var len = this.pos - startPos;

            if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

            // finally, write the message length in the reserved place and restore the position
            this.pos = startPos - 1;
            this.writeVarint(len);
            this.pos += len;
        },

        writeFloat: function(val) {
            this.realloc(4);
            ieee754.write(this.buf, val, this.pos, true, 23, 4);
            this.pos += 4;
        },

        writeDouble: function(val) {
            this.realloc(8);
            ieee754.write(this.buf, val, this.pos, true, 52, 8);
            this.pos += 8;
        },

        writeBytes: function(buffer) {
            var len = buffer.length;
            this.writeVarint(len);
            this.realloc(len);
            for (var i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
        },

        writeRawMessage: function(fn, obj) {
            this.pos++; // reserve 1 byte for short message length

            // write the message directly to the buffer and see how much was written
            var startPos = this.pos;
            fn(obj, this);
            var len = this.pos - startPos;

            if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

            // finally, write the message length in the reserved place and restore the position
            this.pos = startPos - 1;
            this.writeVarint(len);
            this.pos += len;
        },

        writeMessage: function(tag, fn, obj) {
            this.writeTag(tag, Pbf.Bytes);
            this.writeRawMessage(fn, obj);
        },

        writePackedVarint:   function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedVarint, arr);   },
        writePackedSVarint:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedSVarint, arr);  },
        writePackedBoolean:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedBoolean, arr);  },
        writePackedFloat:    function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedFloat, arr);    },
        writePackedDouble:   function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedDouble, arr);   },
        writePackedFixed32:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedFixed32, arr);  },
        writePackedSFixed32: function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedSFixed32, arr); },
        writePackedFixed64:  function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedFixed64, arr);  },
        writePackedSFixed64: function(tag, arr) { if (arr.length) this.writeMessage(tag, writePackedSFixed64, arr); },

        writeBytesField: function(tag, buffer) {
            this.writeTag(tag, Pbf.Bytes);
            this.writeBytes(buffer);
        },
        writeFixed32Field: function(tag, val) {
            this.writeTag(tag, Pbf.Fixed32);
            this.writeFixed32(val);
        },
        writeSFixed32Field: function(tag, val) {
            this.writeTag(tag, Pbf.Fixed32);
            this.writeSFixed32(val);
        },
        writeFixed64Field: function(tag, val) {
            this.writeTag(tag, Pbf.Fixed64);
            this.writeFixed64(val);
        },
        writeSFixed64Field: function(tag, val) {
            this.writeTag(tag, Pbf.Fixed64);
            this.writeSFixed64(val);
        },
        writeVarintField: function(tag, val) {
            this.writeTag(tag, Pbf.Varint);
            this.writeVarint(val);
        },
        writeSVarintField: function(tag, val) {
            this.writeTag(tag, Pbf.Varint);
            this.writeSVarint(val);
        },
        writeStringField: function(tag, str) {
            this.writeTag(tag, Pbf.Bytes);
            this.writeString(str);
        },
        writeFloatField: function(tag, val) {
            this.writeTag(tag, Pbf.Fixed32);
            this.writeFloat(val);
        },
        writeDoubleField: function(tag, val) {
            this.writeTag(tag, Pbf.Fixed64);
            this.writeDouble(val);
        },
        writeBooleanField: function(tag, val) {
            this.writeVarintField(tag, Boolean(val));
        }
    };

    function readVarintRemainder(l, s, p) {
        var buf = p.buf,
            h, b;

        b = buf[p.pos++]; h  = (b & 0x70) >> 4;  if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 3;  if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 10; if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 17; if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 24; if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x01) << 31; if (b < 0x80) return toNum(l, h, s);

        throw new Error('Expected varint not more than 10 bytes');
    }

    function readPackedEnd(pbf) {
        return pbf.type === Pbf.Bytes ?
            pbf.readVarint() + pbf.pos : pbf.pos + 1;
    }

    function toNum(low, high, isSigned) {
        if (isSigned) {
            return high * 0x100000000 + (low >>> 0);
        }

        return ((high >>> 0) * 0x100000000) + (low >>> 0);
    }

    function writeBigVarint(val, pbf) {
        var low, high;

        if (val >= 0) {
            low  = (val % 0x100000000) | 0;
            high = (val / 0x100000000) | 0;
        } else {
            low  = ~(-val % 0x100000000);
            high = ~(-val / 0x100000000);

            if (low ^ 0xffffffff) {
                low = (low + 1) | 0;
            } else {
                low = 0;
                high = (high + 1) | 0;
            }
        }

        if (val >= 0x10000000000000000 || val < -0x10000000000000000) {
            throw new Error('Given varint doesn\'t fit into 10 bytes');
        }

        pbf.realloc(10);

        writeBigVarintLow(low, high, pbf);
        writeBigVarintHigh(high, pbf);
    }

    function writeBigVarintLow(low, high, pbf) {
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos]   = low & 0x7f;
    }

    function writeBigVarintHigh(high, pbf) {
        var lsb = (high & 0x07) << 4;

        pbf.buf[pbf.pos++] |= lsb         | ((high >>>= 3) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f;
    }

    function makeRoomForExtraLength(startPos, len, pbf) {
        var extraLen =
            len <= 0x3fff ? 1 :
            len <= 0x1fffff ? 2 :
            len <= 0xfffffff ? 3 : Math.floor(Math.log(len) / (Math.LN2 * 7));

        // if 1 byte isn't enough for encoding message length, shift the data to the right
        pbf.realloc(extraLen);
        for (var i = pbf.pos - 1; i >= startPos; i--) pbf.buf[i + extraLen] = pbf.buf[i];
    }

    function writePackedVarint(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);   }
    function writePackedSVarint(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);  }
    function writePackedFloat(arr, pbf)    { for (var i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);    }
    function writePackedDouble(arr, pbf)   { for (var i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);   }
    function writePackedBoolean(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);  }
    function writePackedFixed32(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);  }
    function writePackedSFixed32(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]); }
    function writePackedFixed64(arr, pbf)  { for (var i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);  }
    function writePackedSFixed64(arr, pbf) { for (var i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]); }

    // Buffer code below from https://github.com/feross/buffer, MIT-licensed

    function readUInt32(buf, pos) {
        return ((buf[pos]) |
            (buf[pos + 1] << 8) |
            (buf[pos + 2] << 16)) +
            (buf[pos + 3] * 0x1000000);
    }

    function writeInt32(buf, val, pos) {
        buf[pos] = val;
        buf[pos + 1] = (val >>> 8);
        buf[pos + 2] = (val >>> 16);
        buf[pos + 3] = (val >>> 24);
    }

    function readInt32(buf, pos) {
        return ((buf[pos]) |
            (buf[pos + 1] << 8) |
            (buf[pos + 2] << 16)) +
            (buf[pos + 3] << 24);
    }

    function readUtf8(buf, pos, end) {
        var str = '';
        var i = pos;

        while (i < end) {
            var b0 = buf[i];
            var c = null; // codepoint
            var bytesPerSequence =
                b0 > 0xEF ? 4 :
                b0 > 0xDF ? 3 :
                b0 > 0xBF ? 2 : 1;

            if (i + bytesPerSequence > end) break;

            var b1, b2, b3;

            if (bytesPerSequence === 1) {
                if (b0 < 0x80) {
                    c = b0;
                }
            } else if (bytesPerSequence === 2) {
                b1 = buf[i + 1];
                if ((b1 & 0xC0) === 0x80) {
                    c = (b0 & 0x1F) << 0x6 | (b1 & 0x3F);
                    if (c <= 0x7F) {
                        c = null;
                    }
                }
            } else if (bytesPerSequence === 3) {
                b1 = buf[i + 1];
                b2 = buf[i + 2];
                if ((b1 & 0xC0) === 0x80 && (b2 & 0xC0) === 0x80) {
                    c = (b0 & 0xF) << 0xC | (b1 & 0x3F) << 0x6 | (b2 & 0x3F);
                    if (c <= 0x7FF || (c >= 0xD800 && c <= 0xDFFF)) {
                        c = null;
                    }
                }
            } else if (bytesPerSequence === 4) {
                b1 = buf[i + 1];
                b2 = buf[i + 2];
                b3 = buf[i + 3];
                if ((b1 & 0xC0) === 0x80 && (b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
                    c = (b0 & 0xF) << 0x12 | (b1 & 0x3F) << 0xC | (b2 & 0x3F) << 0x6 | (b3 & 0x3F);
                    if (c <= 0xFFFF || c >= 0x110000) {
                        c = null;
                    }
                }
            }

            if (c === null) {
                c = 0xFFFD;
                bytesPerSequence = 1;

            } else if (c > 0xFFFF) {
                c -= 0x10000;
                str += String.fromCharCode(c >>> 10 & 0x3FF | 0xD800);
                c = 0xDC00 | c & 0x3FF;
            }

            str += String.fromCharCode(c);
            i += bytesPerSequence;
        }

        return str;
    }

    function writeUtf8(buf, str, pos) {
        for (var i = 0, c, lead; i < str.length; i++) {
            c = str.charCodeAt(i); // code point

            if (c > 0xD7FF && c < 0xE000) {
                if (lead) {
                    if (c < 0xDC00) {
                        buf[pos++] = 0xEF;
                        buf[pos++] = 0xBF;
                        buf[pos++] = 0xBD;
                        lead = c;
                        continue;
                    } else {
                        c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
                        lead = null;
                    }
                } else {
                    if (c > 0xDBFF || (i + 1 === str.length)) {
                        buf[pos++] = 0xEF;
                        buf[pos++] = 0xBF;
                        buf[pos++] = 0xBD;
                    } else {
                        lead = c;
                    }
                    continue;
                }
            } else if (lead) {
                buf[pos++] = 0xEF;
                buf[pos++] = 0xBF;
                buf[pos++] = 0xBD;
                lead = null;
            }

            if (c < 0x80) {
                buf[pos++] = c;
            } else {
                if (c < 0x800) {
                    buf[pos++] = c >> 0x6 | 0xC0;
                } else {
                    if (c < 0x10000) {
                        buf[pos++] = c >> 0xC | 0xE0;
                    } else {
                        buf[pos++] = c >> 0x12 | 0xF0;
                        buf[pos++] = c >> 0xC & 0x3F | 0x80;
                    }
                    buf[pos++] = c >> 0x6 & 0x3F | 0x80;
                }
                buf[pos++] = c & 0x3F | 0x80;
            }
        }
        return pos;
    }

    //      
                                                               

    class Feature {
                        
                                    
                       
                                   

                                              

        constructor(vectorTileFeature                   , z        , x        , y        ) {
            this.type = 'Feature';

            this._vectorTileFeature = vectorTileFeature;
            (vectorTileFeature     )._z = z;
            (vectorTileFeature     )._x = x;
            (vectorTileFeature     )._y = y;

            this.properties = vectorTileFeature.properties;

            if (vectorTileFeature.id != null) {
                this.id = vectorTileFeature.id;
            }
        }

        get geometry()                   {
            if (this._geometry === undefined) {
                this._geometry = this._vectorTileFeature.toGeoJSON(
                    (this._vectorTileFeature     )._x,
                    (this._vectorTileFeature     )._y,
                    (this._vectorTileFeature     )._z).geometry;
            }
            return this._geometry;
        }

        set geometry(g                  ) {
            this._geometry = g;
        }

        toJSON() {
            const json = {
                geometry: this.geometry
            };
            for (const i in this) {
                if (i === '_geometry' || i === '_vectorTileFeature') continue;
                json[i] = (this     )[i];
            }
            return json;
        }
    }

    //      

    class ZoomHistory {
                         
                              
                                
                                    
                       

        constructor() {
            this.first = true;
        }

        update(z        , now        ) {
            const floorZ = Math.floor(z);

            if (this.first) {
                this.first = false;
                this.lastIntegerZoom = floorZ;
                this.lastIntegerZoomTime = 0;
                this.lastZoom = z;
                this.lastFloorZoom = floorZ;
                return true;
            }

            if (this.lastFloorZoom > floorZ) {
                this.lastIntegerZoom = floorZ + 1;
                this.lastIntegerZoomTime = now;
            } else if (this.lastFloorZoom < floorZ) {
                this.lastIntegerZoom = floorZ;
                this.lastIntegerZoomTime = now;
            }

            if (z !== this.lastZoom) {
                this.lastZoom = z;
                this.lastFloorZoom = floorZ;
                return true;
            }

            return false;
        }
    }

    //      

    // The following table comes from <http://www.unicode.org/Public/11.0.0/ucd/Blocks.txt>.
    // Keep it synchronized with <http://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt>.

                                                                         

    const unicodeBlockLookup                     = {
        // 'Basic Latin': (char) => char >= 0x0000 && char <= 0x007F,
        'Latin-1 Supplement': (char) => char >= 0x0080 && char <= 0x00FF,
        // 'Latin Extended-A': (char) => char >= 0x0100 && char <= 0x017F,
        // 'Latin Extended-B': (char) => char >= 0x0180 && char <= 0x024F,
        // 'IPA Extensions': (char) => char >= 0x0250 && char <= 0x02AF,
        // 'Spacing Modifier Letters': (char) => char >= 0x02B0 && char <= 0x02FF,
        // 'Combining Diacritical Marks': (char) => char >= 0x0300 && char <= 0x036F,
        // 'Greek and Coptic': (char) => char >= 0x0370 && char <= 0x03FF,
        // 'Cyrillic': (char) => char >= 0x0400 && char <= 0x04FF,
        // 'Cyrillic Supplement': (char) => char >= 0x0500 && char <= 0x052F,
        // 'Armenian': (char) => char >= 0x0530 && char <= 0x058F,
        //'Hebrew': (char) => char >= 0x0590 && char <= 0x05FF,
        'Arabic': (char) => char >= 0x0600 && char <= 0x06FF,
        //'Syriac': (char) => char >= 0x0700 && char <= 0x074F,
        'Arabic Supplement': (char) => char >= 0x0750 && char <= 0x077F,
        // 'Thaana': (char) => char >= 0x0780 && char <= 0x07BF,
        // 'NKo': (char) => char >= 0x07C0 && char <= 0x07FF,
        // 'Samaritan': (char) => char >= 0x0800 && char <= 0x083F,
        // 'Mandaic': (char) => char >= 0x0840 && char <= 0x085F,
        // 'Syriac Supplement': (char) => char >= 0x0860 && char <= 0x086F,
        'Arabic Extended-A': (char) => char >= 0x08A0 && char <= 0x08FF,
        // 'Devanagari': (char) => char >= 0x0900 && char <= 0x097F,
        // 'Bengali': (char) => char >= 0x0980 && char <= 0x09FF,
        // 'Gurmukhi': (char) => char >= 0x0A00 && char <= 0x0A7F,
        // 'Gujarati': (char) => char >= 0x0A80 && char <= 0x0AFF,
        // 'Oriya': (char) => char >= 0x0B00 && char <= 0x0B7F,
        // 'Tamil': (char) => char >= 0x0B80 && char <= 0x0BFF,
        // 'Telugu': (char) => char >= 0x0C00 && char <= 0x0C7F,
        // 'Kannada': (char) => char >= 0x0C80 && char <= 0x0CFF,
        // 'Malayalam': (char) => char >= 0x0D00 && char <= 0x0D7F,
        // 'Sinhala': (char) => char >= 0x0D80 && char <= 0x0DFF,
        // 'Thai': (char) => char >= 0x0E00 && char <= 0x0E7F,
        // 'Lao': (char) => char >= 0x0E80 && char <= 0x0EFF,
        // 'Tibetan': (char) => char >= 0x0F00 && char <= 0x0FFF,
        // 'Myanmar': (char) => char >= 0x1000 && char <= 0x109F,
        // 'Georgian': (char) => char >= 0x10A0 && char <= 0x10FF,
        'Hangul Jamo': (char) => char >= 0x1100 && char <= 0x11FF,
        // 'Ethiopic': (char) => char >= 0x1200 && char <= 0x137F,
        // 'Ethiopic Supplement': (char) => char >= 0x1380 && char <= 0x139F,
        // 'Cherokee': (char) => char >= 0x13A0 && char <= 0x13FF,
        'Unified Canadian Aboriginal Syllabics': (char) => char >= 0x1400 && char <= 0x167F,
        // 'Ogham': (char) => char >= 0x1680 && char <= 0x169F,
        // 'Runic': (char) => char >= 0x16A0 && char <= 0x16FF,
        // 'Tagalog': (char) => char >= 0x1700 && char <= 0x171F,
        // 'Hanunoo': (char) => char >= 0x1720 && char <= 0x173F,
        // 'Buhid': (char) => char >= 0x1740 && char <= 0x175F,
        // 'Tagbanwa': (char) => char >= 0x1760 && char <= 0x177F,
        'Khmer': (char) => char >= 0x1780 && char <= 0x17FF,
        // 'Mongolian': (char) => char >= 0x1800 && char <= 0x18AF,
        'Unified Canadian Aboriginal Syllabics Extended': (char) => char >= 0x18B0 && char <= 0x18FF,
        // 'Limbu': (char) => char >= 0x1900 && char <= 0x194F,
        // 'Tai Le': (char) => char >= 0x1950 && char <= 0x197F,
        // 'New Tai Lue': (char) => char >= 0x1980 && char <= 0x19DF,
        // 'Khmer Symbols': (char) => char >= 0x19E0 && char <= 0x19FF,
        // 'Buginese': (char) => char >= 0x1A00 && char <= 0x1A1F,
        // 'Tai Tham': (char) => char >= 0x1A20 && char <= 0x1AAF,
        // 'Combining Diacritical Marks Extended': (char) => char >= 0x1AB0 && char <= 0x1AFF,
        // 'Balinese': (char) => char >= 0x1B00 && char <= 0x1B7F,
        // 'Sundanese': (char) => char >= 0x1B80 && char <= 0x1BBF,
        // 'Batak': (char) => char >= 0x1BC0 && char <= 0x1BFF,
        // 'Lepcha': (char) => char >= 0x1C00 && char <= 0x1C4F,
        // 'Ol Chiki': (char) => char >= 0x1C50 && char <= 0x1C7F,
        // 'Cyrillic Extended-C': (char) => char >= 0x1C80 && char <= 0x1C8F,
        // 'Georgian Extended': (char) => char >= 0x1C90 && char <= 0x1CBF,
        // 'Sundanese Supplement': (char) => char >= 0x1CC0 && char <= 0x1CCF,
        // 'Vedic Extensions': (char) => char >= 0x1CD0 && char <= 0x1CFF,
        // 'Phonetic Extensions': (char) => char >= 0x1D00 && char <= 0x1D7F,
        // 'Phonetic Extensions Supplement': (char) => char >= 0x1D80 && char <= 0x1DBF,
        // 'Combining Diacritical Marks Supplement': (char) => char >= 0x1DC0 && char <= 0x1DFF,
        // 'Latin Extended Additional': (char) => char >= 0x1E00 && char <= 0x1EFF,
        // 'Greek Extended': (char) => char >= 0x1F00 && char <= 0x1FFF,
        'General Punctuation': (char) => char >= 0x2000 && char <= 0x206F,
        // 'Superscripts and Subscripts': (char) => char >= 0x2070 && char <= 0x209F,
        // 'Currency Symbols': (char) => char >= 0x20A0 && char <= 0x20CF,
        // 'Combining Diacritical Marks for Symbols': (char) => char >= 0x20D0 && char <= 0x20FF,
        'Letterlike Symbols': (char) => char >= 0x2100 && char <= 0x214F,
        'Number Forms': (char) => char >= 0x2150 && char <= 0x218F,
        // 'Arrows': (char) => char >= 0x2190 && char <= 0x21FF,
        // 'Mathematical Operators': (char) => char >= 0x2200 && char <= 0x22FF,
        'Miscellaneous Technical': (char) => char >= 0x2300 && char <= 0x23FF,
        'Control Pictures': (char) => char >= 0x2400 && char <= 0x243F,
        'Optical Character Recognition': (char) => char >= 0x2440 && char <= 0x245F,
        'Enclosed Alphanumerics': (char) => char >= 0x2460 && char <= 0x24FF,
        // 'Box Drawing': (char) => char >= 0x2500 && char <= 0x257F,
        // 'Block Elements': (char) => char >= 0x2580 && char <= 0x259F,
        'Geometric Shapes': (char) => char >= 0x25A0 && char <= 0x25FF,
        'Miscellaneous Symbols': (char) => char >= 0x2600 && char <= 0x26FF,
        // 'Dingbats': (char) => char >= 0x2700 && char <= 0x27BF,
        // 'Miscellaneous Mathematical Symbols-A': (char) => char >= 0x27C0 && char <= 0x27EF,
        // 'Supplemental Arrows-A': (char) => char >= 0x27F0 && char <= 0x27FF,
        // 'Braille Patterns': (char) => char >= 0x2800 && char <= 0x28FF,
        // 'Supplemental Arrows-B': (char) => char >= 0x2900 && char <= 0x297F,
        // 'Miscellaneous Mathematical Symbols-B': (char) => char >= 0x2980 && char <= 0x29FF,
        // 'Supplemental Mathematical Operators': (char) => char >= 0x2A00 && char <= 0x2AFF,
        'Miscellaneous Symbols and Arrows': (char) => char >= 0x2B00 && char <= 0x2BFF,
        // 'Glagolitic': (char) => char >= 0x2C00 && char <= 0x2C5F,
        // 'Latin Extended-C': (char) => char >= 0x2C60 && char <= 0x2C7F,
        // 'Coptic': (char) => char >= 0x2C80 && char <= 0x2CFF,
        // 'Georgian Supplement': (char) => char >= 0x2D00 && char <= 0x2D2F,
        // 'Tifinagh': (char) => char >= 0x2D30 && char <= 0x2D7F,
        // 'Ethiopic Extended': (char) => char >= 0x2D80 && char <= 0x2DDF,
        // 'Cyrillic Extended-A': (char) => char >= 0x2DE0 && char <= 0x2DFF,
        // 'Supplemental Punctuation': (char) => char >= 0x2E00 && char <= 0x2E7F,
        'CJK Radicals Supplement': (char) => char >= 0x2E80 && char <= 0x2EFF,
        'Kangxi Radicals': (char) => char >= 0x2F00 && char <= 0x2FDF,
        'Ideographic Description Characters': (char) => char >= 0x2FF0 && char <= 0x2FFF,
        'CJK Symbols and Punctuation': (char) => char >= 0x3000 && char <= 0x303F,
        'Hiragana': (char) => char >= 0x3040 && char <= 0x309F,
        'Katakana': (char) => char >= 0x30A0 && char <= 0x30FF,
        'Bopomofo': (char) => char >= 0x3100 && char <= 0x312F,
        'Hangul Compatibility Jamo': (char) => char >= 0x3130 && char <= 0x318F,
        'Kanbun': (char) => char >= 0x3190 && char <= 0x319F,
        'Bopomofo Extended': (char) => char >= 0x31A0 && char <= 0x31BF,
        'CJK Strokes': (char) => char >= 0x31C0 && char <= 0x31EF,
        'Katakana Phonetic Extensions': (char) => char >= 0x31F0 && char <= 0x31FF,
        'Enclosed CJK Letters and Months': (char) => char >= 0x3200 && char <= 0x32FF,
        'CJK Compatibility': (char) => char >= 0x3300 && char <= 0x33FF,
        'CJK Unified Ideographs Extension A': (char) => char >= 0x3400 && char <= 0x4DBF,
        'Yijing Hexagram Symbols': (char) => char >= 0x4DC0 && char <= 0x4DFF,
        'CJK Unified Ideographs': (char) => char >= 0x4E00 && char <= 0x9FFF,
        'Yi Syllables': (char) => char >= 0xA000 && char <= 0xA48F,
        'Yi Radicals': (char) => char >= 0xA490 && char <= 0xA4CF,
        // 'Lisu': (char) => char >= 0xA4D0 && char <= 0xA4FF,
        // 'Vai': (char) => char >= 0xA500 && char <= 0xA63F,
        // 'Cyrillic Extended-B': (char) => char >= 0xA640 && char <= 0xA69F,
        // 'Bamum': (char) => char >= 0xA6A0 && char <= 0xA6FF,
        // 'Modifier Tone Letters': (char) => char >= 0xA700 && char <= 0xA71F,
        // 'Latin Extended-D': (char) => char >= 0xA720 && char <= 0xA7FF,
        // 'Syloti Nagri': (char) => char >= 0xA800 && char <= 0xA82F,
        // 'Common Indic Number Forms': (char) => char >= 0xA830 && char <= 0xA83F,
        // 'Phags-pa': (char) => char >= 0xA840 && char <= 0xA87F,
        // 'Saurashtra': (char) => char >= 0xA880 && char <= 0xA8DF,
        // 'Devanagari Extended': (char) => char >= 0xA8E0 && char <= 0xA8FF,
        // 'Kayah Li': (char) => char >= 0xA900 && char <= 0xA92F,
        // 'Rejang': (char) => char >= 0xA930 && char <= 0xA95F,
        'Hangul Jamo Extended-A': (char) => char >= 0xA960 && char <= 0xA97F,
        // 'Javanese': (char) => char >= 0xA980 && char <= 0xA9DF,
        // 'Myanmar Extended-B': (char) => char >= 0xA9E0 && char <= 0xA9FF,
        // 'Cham': (char) => char >= 0xAA00 && char <= 0xAA5F,
        // 'Myanmar Extended-A': (char) => char >= 0xAA60 && char <= 0xAA7F,
        // 'Tai Viet': (char) => char >= 0xAA80 && char <= 0xAADF,
        // 'Meetei Mayek Extensions': (char) => char >= 0xAAE0 && char <= 0xAAFF,
        // 'Ethiopic Extended-A': (char) => char >= 0xAB00 && char <= 0xAB2F,
        // 'Latin Extended-E': (char) => char >= 0xAB30 && char <= 0xAB6F,
        // 'Cherokee Supplement': (char) => char >= 0xAB70 && char <= 0xABBF,
        // 'Meetei Mayek': (char) => char >= 0xABC0 && char <= 0xABFF,
        'Hangul Syllables': (char) => char >= 0xAC00 && char <= 0xD7AF,
        'Hangul Jamo Extended-B': (char) => char >= 0xD7B0 && char <= 0xD7FF,
        // 'High Surrogates': (char) => char >= 0xD800 && char <= 0xDB7F,
        // 'High Private Use Surrogates': (char) => char >= 0xDB80 && char <= 0xDBFF,
        // 'Low Surrogates': (char) => char >= 0xDC00 && char <= 0xDFFF,
        'Private Use Area': (char) => char >= 0xE000 && char <= 0xF8FF,
        'CJK Compatibility Ideographs': (char) => char >= 0xF900 && char <= 0xFAFF,
        // 'Alphabetic Presentation Forms': (char) => char >= 0xFB00 && char <= 0xFB4F,
        'Arabic Presentation Forms-A': (char) => char >= 0xFB50 && char <= 0xFDFF,
        // 'Variation Selectors': (char) => char >= 0xFE00 && char <= 0xFE0F,
        'Vertical Forms': (char) => char >= 0xFE10 && char <= 0xFE1F,
        // 'Combining Half Marks': (char) => char >= 0xFE20 && char <= 0xFE2F,
        'CJK Compatibility Forms': (char) => char >= 0xFE30 && char <= 0xFE4F,
        'Small Form Variants': (char) => char >= 0xFE50 && char <= 0xFE6F,
        'Arabic Presentation Forms-B': (char) => char >= 0xFE70 && char <= 0xFEFF,
        'Halfwidth and Fullwidth Forms': (char) => char >= 0xFF00 && char <= 0xFFEF
        // 'Specials': (char) => char >= 0xFFF0 && char <= 0xFFFF,
        // 'Linear B Syllabary': (char) => char >= 0x10000 && char <= 0x1007F,
        // 'Linear B Ideograms': (char) => char >= 0x10080 && char <= 0x100FF,
        // 'Aegean Numbers': (char) => char >= 0x10100 && char <= 0x1013F,
        // 'Ancient Greek Numbers': (char) => char >= 0x10140 && char <= 0x1018F,
        // 'Ancient Symbols': (char) => char >= 0x10190 && char <= 0x101CF,
        // 'Phaistos Disc': (char) => char >= 0x101D0 && char <= 0x101FF,
        // 'Lycian': (char) => char >= 0x10280 && char <= 0x1029F,
        // 'Carian': (char) => char >= 0x102A0 && char <= 0x102DF,
        // 'Coptic Epact Numbers': (char) => char >= 0x102E0 && char <= 0x102FF,
        // 'Old Italic': (char) => char >= 0x10300 && char <= 0x1032F,
        // 'Gothic': (char) => char >= 0x10330 && char <= 0x1034F,
        // 'Old Permic': (char) => char >= 0x10350 && char <= 0x1037F,
        // 'Ugaritic': (char) => char >= 0x10380 && char <= 0x1039F,
        // 'Old Persian': (char) => char >= 0x103A0 && char <= 0x103DF,
        // 'Deseret': (char) => char >= 0x10400 && char <= 0x1044F,
        // 'Shavian': (char) => char >= 0x10450 && char <= 0x1047F,
        // 'Osmanya': (char) => char >= 0x10480 && char <= 0x104AF,
        // 'Osage': (char) => char >= 0x104B0 && char <= 0x104FF,
        // 'Elbasan': (char) => char >= 0x10500 && char <= 0x1052F,
        // 'Caucasian Albanian': (char) => char >= 0x10530 && char <= 0x1056F,
        // 'Linear A': (char) => char >= 0x10600 && char <= 0x1077F,
        // 'Cypriot Syllabary': (char) => char >= 0x10800 && char <= 0x1083F,
        // 'Imperial Aramaic': (char) => char >= 0x10840 && char <= 0x1085F,
        // 'Palmyrene': (char) => char >= 0x10860 && char <= 0x1087F,
        // 'Nabataean': (char) => char >= 0x10880 && char <= 0x108AF,
        // 'Hatran': (char) => char >= 0x108E0 && char <= 0x108FF,
        // 'Phoenician': (char) => char >= 0x10900 && char <= 0x1091F,
        // 'Lydian': (char) => char >= 0x10920 && char <= 0x1093F,
        // 'Meroitic Hieroglyphs': (char) => char >= 0x10980 && char <= 0x1099F,
        // 'Meroitic Cursive': (char) => char >= 0x109A0 && char <= 0x109FF,
        // 'Kharoshthi': (char) => char >= 0x10A00 && char <= 0x10A5F,
        // 'Old South Arabian': (char) => char >= 0x10A60 && char <= 0x10A7F,
        // 'Old North Arabian': (char) => char >= 0x10A80 && char <= 0x10A9F,
        // 'Manichaean': (char) => char >= 0x10AC0 && char <= 0x10AFF,
        // 'Avestan': (char) => char >= 0x10B00 && char <= 0x10B3F,
        // 'Inscriptional Parthian': (char) => char >= 0x10B40 && char <= 0x10B5F,
        // 'Inscriptional Pahlavi': (char) => char >= 0x10B60 && char <= 0x10B7F,
        // 'Psalter Pahlavi': (char) => char >= 0x10B80 && char <= 0x10BAF,
        // 'Old Turkic': (char) => char >= 0x10C00 && char <= 0x10C4F,
        // 'Old Hungarian': (char) => char >= 0x10C80 && char <= 0x10CFF,
        // 'Hanifi Rohingya': (char) => char >= 0x10D00 && char <= 0x10D3F,
        // 'Rumi Numeral Symbols': (char) => char >= 0x10E60 && char <= 0x10E7F,
        // 'Old Sogdian': (char) => char >= 0x10F00 && char <= 0x10F2F,
        // 'Sogdian': (char) => char >= 0x10F30 && char <= 0x10F6F,
        // 'Brahmi': (char) => char >= 0x11000 && char <= 0x1107F,
        // 'Kaithi': (char) => char >= 0x11080 && char <= 0x110CF,
        // 'Sora Sompeng': (char) => char >= 0x110D0 && char <= 0x110FF,
        // 'Chakma': (char) => char >= 0x11100 && char <= 0x1114F,
        // 'Mahajani': (char) => char >= 0x11150 && char <= 0x1117F,
        // 'Sharada': (char) => char >= 0x11180 && char <= 0x111DF,
        // 'Sinhala Archaic Numbers': (char) => char >= 0x111E0 && char <= 0x111FF,
        // 'Khojki': (char) => char >= 0x11200 && char <= 0x1124F,
        // 'Multani': (char) => char >= 0x11280 && char <= 0x112AF,
        // 'Khudawadi': (char) => char >= 0x112B0 && char <= 0x112FF,
        // 'Grantha': (char) => char >= 0x11300 && char <= 0x1137F,
        // 'Newa': (char) => char >= 0x11400 && char <= 0x1147F,
        // 'Tirhuta': (char) => char >= 0x11480 && char <= 0x114DF,
        // 'Siddham': (char) => char >= 0x11580 && char <= 0x115FF,
        // 'Modi': (char) => char >= 0x11600 && char <= 0x1165F,
        // 'Mongolian Supplement': (char) => char >= 0x11660 && char <= 0x1167F,
        // 'Takri': (char) => char >= 0x11680 && char <= 0x116CF,
        // 'Ahom': (char) => char >= 0x11700 && char <= 0x1173F,
        // 'Dogra': (char) => char >= 0x11800 && char <= 0x1184F,
        // 'Warang Citi': (char) => char >= 0x118A0 && char <= 0x118FF,
        // 'Zanabazar Square': (char) => char >= 0x11A00 && char <= 0x11A4F,
        // 'Soyombo': (char) => char >= 0x11A50 && char <= 0x11AAF,
        // 'Pau Cin Hau': (char) => char >= 0x11AC0 && char <= 0x11AFF,
        // 'Bhaiksuki': (char) => char >= 0x11C00 && char <= 0x11C6F,
        // 'Marchen': (char) => char >= 0x11C70 && char <= 0x11CBF,
        // 'Masaram Gondi': (char) => char >= 0x11D00 && char <= 0x11D5F,
        // 'Gunjala Gondi': (char) => char >= 0x11D60 && char <= 0x11DAF,
        // 'Makasar': (char) => char >= 0x11EE0 && char <= 0x11EFF,
        // 'Cuneiform': (char) => char >= 0x12000 && char <= 0x123FF,
        // 'Cuneiform Numbers and Punctuation': (char) => char >= 0x12400 && char <= 0x1247F,
        // 'Early Dynastic Cuneiform': (char) => char >= 0x12480 && char <= 0x1254F,
        // 'Egyptian Hieroglyphs': (char) => char >= 0x13000 && char <= 0x1342F,
        // 'Anatolian Hieroglyphs': (char) => char >= 0x14400 && char <= 0x1467F,
        // 'Bamum Supplement': (char) => char >= 0x16800 && char <= 0x16A3F,
        // 'Mro': (char) => char >= 0x16A40 && char <= 0x16A6F,
        // 'Bassa Vah': (char) => char >= 0x16AD0 && char <= 0x16AFF,
        // 'Pahawh Hmong': (char) => char >= 0x16B00 && char <= 0x16B8F,
        // 'Medefaidrin': (char) => char >= 0x16E40 && char <= 0x16E9F,
        // 'Miao': (char) => char >= 0x16F00 && char <= 0x16F9F,
        // 'Ideographic Symbols and Punctuation': (char) => char >= 0x16FE0 && char <= 0x16FFF,
        // 'Tangut': (char) => char >= 0x17000 && char <= 0x187FF,
        // 'Tangut Components': (char) => char >= 0x18800 && char <= 0x18AFF,
        // 'Kana Supplement': (char) => char >= 0x1B000 && char <= 0x1B0FF,
        // 'Kana Extended-A': (char) => char >= 0x1B100 && char <= 0x1B12F,
        // 'Nushu': (char) => char >= 0x1B170 && char <= 0x1B2FF,
        // 'Duployan': (char) => char >= 0x1BC00 && char <= 0x1BC9F,
        // 'Shorthand Format Controls': (char) => char >= 0x1BCA0 && char <= 0x1BCAF,
        // 'Byzantine Musical Symbols': (char) => char >= 0x1D000 && char <= 0x1D0FF,
        // 'Musical Symbols': (char) => char >= 0x1D100 && char <= 0x1D1FF,
        // 'Ancient Greek Musical Notation': (char) => char >= 0x1D200 && char <= 0x1D24F,
        // 'Mayan Numerals': (char) => char >= 0x1D2E0 && char <= 0x1D2FF,
        // 'Tai Xuan Jing Symbols': (char) => char >= 0x1D300 && char <= 0x1D35F,
        // 'Counting Rod Numerals': (char) => char >= 0x1D360 && char <= 0x1D37F,
        // 'Mathematical Alphanumeric Symbols': (char) => char >= 0x1D400 && char <= 0x1D7FF,
        // 'Sutton SignWriting': (char) => char >= 0x1D800 && char <= 0x1DAAF,
        // 'Glagolitic Supplement': (char) => char >= 0x1E000 && char <= 0x1E02F,
        // 'Mende Kikakui': (char) => char >= 0x1E800 && char <= 0x1E8DF,
        // 'Adlam': (char) => char >= 0x1E900 && char <= 0x1E95F,
        // 'Indic Siyaq Numbers': (char) => char >= 0x1EC70 && char <= 0x1ECBF,
        // 'Arabic Mathematical Alphabetic Symbols': (char) => char >= 0x1EE00 && char <= 0x1EEFF,
        // 'Mahjong Tiles': (char) => char >= 0x1F000 && char <= 0x1F02F,
        // 'Domino Tiles': (char) => char >= 0x1F030 && char <= 0x1F09F,
        // 'Playing Cards': (char) => char >= 0x1F0A0 && char <= 0x1F0FF,
        // 'Enclosed Alphanumeric Supplement': (char) => char >= 0x1F100 && char <= 0x1F1FF,
        // 'Enclosed Ideographic Supplement': (char) => char >= 0x1F200 && char <= 0x1F2FF,
        // 'Miscellaneous Symbols and Pictographs': (char) => char >= 0x1F300 && char <= 0x1F5FF,
        // 'Emoticons': (char) => char >= 0x1F600 && char <= 0x1F64F,
        // 'Ornamental Dingbats': (char) => char >= 0x1F650 && char <= 0x1F67F,
        // 'Transport and Map Symbols': (char) => char >= 0x1F680 && char <= 0x1F6FF,
        // 'Alchemical Symbols': (char) => char >= 0x1F700 && char <= 0x1F77F,
        // 'Geometric Shapes Extended': (char) => char >= 0x1F780 && char <= 0x1F7FF,
        // 'Supplemental Arrows-C': (char) => char >= 0x1F800 && char <= 0x1F8FF,
        // 'Supplemental Symbols and Pictographs': (char) => char >= 0x1F900 && char <= 0x1F9FF,
        // 'Chess Symbols': (char) => char >= 0x1FA00 && char <= 0x1FA6F,
        // 'CJK Unified Ideographs Extension B': (char) => char >= 0x20000 && char <= 0x2A6DF,
        // 'CJK Unified Ideographs Extension C': (char) => char >= 0x2A700 && char <= 0x2B73F,
        // 'CJK Unified Ideographs Extension D': (char) => char >= 0x2B740 && char <= 0x2B81F,
        // 'CJK Unified Ideographs Extension E': (char) => char >= 0x2B820 && char <= 0x2CEAF,
        // 'CJK Unified Ideographs Extension F': (char) => char >= 0x2CEB0 && char <= 0x2EBEF,
        // 'CJK Compatibility Ideographs Supplement': (char) => char >= 0x2F800 && char <= 0x2FA1F,
        // 'Tags': (char) => char >= 0xE0000 && char <= 0xE007F,
        // 'Variation Selectors Supplement': (char) => char >= 0xE0100 && char <= 0xE01EF,
        // 'Supplementary Private Use Area-A': (char) => char >= 0xF0000 && char <= 0xFFFFF,
        // 'Supplementary Private Use Area-B': (char) => char >= 0x100000 && char <= 0x10FFFF,
    };

    //      

    function allowsVerticalWritingMode(chars        ) {
        for (const char of chars) {
            if (charHasUprightVerticalOrientation(char.charCodeAt(0))) return true;
        }
        return false;
    }

    // The following logic comes from
    // <http://www.unicode.org/Public/vertical/revision-17/VerticalOrientation-17.txt>.
    // The data file denotes with “U” or “Tu” any codepoint that may be drawn
    // upright in vertical text but does not distinguish between upright and
    // “neutral” characters.

    // Blocks in the Unicode supplementary planes are excluded from this module due
    // to <https://github.com/mapbox/mapbox-gl/issues/29>.

    /**
     * Returns true if the given Unicode codepoint identifies a character with
     * upright orientation.
     *
     * A character has upright orientation if it is drawn upright (unrotated)
     * whether the line is oriented horizontally or vertically, even if both
     * adjacent characters can be rotated. For example, a Chinese character is
     * always drawn upright. An uprightly oriented character causes an adjacent
     * “neutral” character to be drawn upright as well.
     * @private
     */
    function charHasUprightVerticalOrientation(char        ) {
        if (char === 0x02EA /* modifier letter yin departing tone mark */ ||
            char === 0x02EB /* modifier letter yang departing tone mark */) {
            return true;
        }

        // Return early for characters outside all ranges whose characters remain
        // upright in vertical writing mode.
        if (char < 0x1100) return false;

        if (unicodeBlockLookup['Bopomofo Extended'](char)) return true;
        if (unicodeBlockLookup['Bopomofo'](char)) return true;
        if (unicodeBlockLookup['CJK Compatibility Forms'](char)) {
            if (!((char >= 0xFE49 /* dashed overline */ && char <= 0xFE4F) /* wavy low line */)) {
                return true;
            }
        }
        if (unicodeBlockLookup['CJK Compatibility Ideographs'](char)) return true;
        if (unicodeBlockLookup['CJK Compatibility'](char)) return true;
        if (unicodeBlockLookup['CJK Radicals Supplement'](char)) return true;
        if (unicodeBlockLookup['CJK Strokes'](char)) return true;
        if (unicodeBlockLookup['CJK Symbols and Punctuation'](char)) {
            if (!((char >= 0x3008 /* left angle bracket */ && char <= 0x3011) /* right black lenticular bracket */) &&
                !((char >= 0x3014 /* left tortoise shell bracket */ && char <= 0x301F) /* low double prime quotation mark */) &&
                char !== 0x3030 /* wavy dash */) {
                return true;
            }
        }
        if (unicodeBlockLookup['CJK Unified Ideographs Extension A'](char)) return true;
        if (unicodeBlockLookup['CJK Unified Ideographs'](char)) return true;
        if (unicodeBlockLookup['Enclosed CJK Letters and Months'](char)) return true;
        if (unicodeBlockLookup['Hangul Compatibility Jamo'](char)) return true;
        if (unicodeBlockLookup['Hangul Jamo Extended-A'](char)) return true;
        if (unicodeBlockLookup['Hangul Jamo Extended-B'](char)) return true;
        if (unicodeBlockLookup['Hangul Jamo'](char)) return true;
        if (unicodeBlockLookup['Hangul Syllables'](char)) return true;
        if (unicodeBlockLookup['Hiragana'](char)) return true;
        if (unicodeBlockLookup['Ideographic Description Characters'](char)) return true;
        if (unicodeBlockLookup['Kanbun'](char)) return true;
        if (unicodeBlockLookup['Kangxi Radicals'](char)) return true;
        if (unicodeBlockLookup['Katakana Phonetic Extensions'](char)) return true;
        if (unicodeBlockLookup['Katakana'](char)) {
            if (char !== 0x30FC /* katakana-hiragana prolonged sound mark */) {
                return true;
            }
        }
        if (unicodeBlockLookup['Halfwidth and Fullwidth Forms'](char)) {
            if (char !== 0xFF08 /* fullwidth left parenthesis */ &&
                char !== 0xFF09 /* fullwidth right parenthesis */ &&
                char !== 0xFF0D /* fullwidth hyphen-minus */ &&
                !((char >= 0xFF1A /* fullwidth colon */ && char <= 0xFF1E) /* fullwidth greater-than sign */) &&
                char !== 0xFF3B /* fullwidth left square bracket */ &&
                char !== 0xFF3D /* fullwidth right square bracket */ &&
                char !== 0xFF3F /* fullwidth low line */ &&
                !(char >= 0xFF5B /* fullwidth left curly bracket */ && char <= 0xFFDF) &&
                char !== 0xFFE3 /* fullwidth macron */ &&
                !(char >= 0xFFE8 /* halfwidth forms light vertical */ && char <= 0xFFEF)) {
                return true;
            }
        }
        if (unicodeBlockLookup['Small Form Variants'](char)) {
            if (!((char >= 0xFE58 /* small em dash */ && char <= 0xFE5E) /* small right tortoise shell bracket */) &&
                !((char >= 0xFE63 /* small hyphen-minus */ && char <= 0xFE66) /* small equals sign */)) {
                return true;
            }
        }
        if (unicodeBlockLookup['Unified Canadian Aboriginal Syllabics'](char)) return true;
        if (unicodeBlockLookup['Unified Canadian Aboriginal Syllabics Extended'](char)) return true;
        if (unicodeBlockLookup['Vertical Forms'](char)) return true;
        if (unicodeBlockLookup['Yijing Hexagram Symbols'](char)) return true;
        if (unicodeBlockLookup['Yi Syllables'](char)) return true;
        if (unicodeBlockLookup['Yi Radicals'](char)) return true;

        return false;
    }

    function charInSupportedScript(char        , canRenderRTL         ) {
        // This is a rough heuristic: whether we "can render" a script
        // actually depends on the properties of the font being used
        // and whether differences from the ideal rendering are considered
        // semantically significant.

        // Even in Latin script, we "can't render" combinations such as the fi
        // ligature, but we don't consider that semantically significant.
        if (!canRenderRTL &&
            ((char >= 0x0590 && char <= 0x08FF) ||
             unicodeBlockLookup['Arabic Presentation Forms-A'](char) ||
             unicodeBlockLookup['Arabic Presentation Forms-B'](char))) {
            // Main blocks for Hebrew, Arabic, Thaana and other RTL scripts
            return false;
        }
        if ((char >= 0x0900 && char <= 0x0DFF) ||
            // Main blocks for Indic scripts and Sinhala
            (char >= 0x0F00 && char <= 0x109F) ||
            // Main blocks for Tibetan and Myanmar
            unicodeBlockLookup['Khmer'](char)) {
            // These blocks cover common scripts that require
            // complex text shaping, based on unicode script metadata:
            // http://www.unicode.org/repos/cldr/trunk/common/properties/scriptMetadata.txt
            // where "Web Rank <= 32" "Shaping Required = YES"
            return false;
        }
        return true;
    }

    function isStringInSupportedScript(chars        , canRenderRTL         ) {
        for (const char of chars) {
            if (!charInSupportedScript(char.charCodeAt(0), canRenderRTL)) {
                return false;
            }
        }
        return true;
    }

    //      
                                                          

    const now = self.performance && self.performance.now ?
        self.performance.now.bind(self.performance) :
        Date.now.bind(Date);

    const raf = self.requestAnimationFrame ||
        self.mozRequestAnimationFrame ||
        self.webkitRequestAnimationFrame ||
        self.msRequestAnimationFrame;

    const cancel = self.cancelAnimationFrame ||
        self.mozCancelAnimationFrame ||
        self.webkitCancelAnimationFrame ||
        self.msCancelAnimationFrame;

    let linkEl;

    /**
     * @private
     */
    const exported = {
        /**
         * Provides a function that outputs milliseconds: either performance.now()
         * or a fallback to Date.now()
         */
        now,

        frame(fn          )             {
            const frame = raf(fn);
            return { cancel: () => cancel(frame) };
        },

        getImageData(img                   )            {
            const canvas = self.document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('failed to create canvas 2d context');
            }
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            return context.getImageData(0, 0, img.width, img.height);
        },

        resolveURL(path        ) {
            if (!linkEl) linkEl = self.document.createElement('a');
            linkEl.href = path;
            return linkEl.href;
        },

        hardwareConcurrency: self.navigator.hardwareConcurrency || 4,
        get devicePixelRatio() { return self.devicePixelRatio; }
    };

    //      
    let foregroundLoadComplete = false;

    const plugin   
                                      
                                                                            
                                                                                                                  
                               
      = {
        applyArabicShaping: null,
        processBidirectionalText: null,
        processStyledBidirectionalText: null,
        isLoaded() {
            return foregroundLoadComplete ||       // Foreground: loaded if the completion callback returned successfully
                plugin.applyArabicShaping != null; // Background: loaded if the plugin functions have been compiled
        }
    };

    //      

                                                                     

                                       
                          
                        
                 
      

    class EvaluationParameters {
                     
                    
                             
                                 
                                            

        // "options" may also be another EvaluationParameters to copy, see CrossFadedProperty.possiblyEvaluate
        constructor(zoom        , options    ) {
            this.zoom = zoom;

            if (options) {
                this.now = options.now;
                this.fadeDuration = options.fadeDuration;
                this.zoomHistory = options.zoomHistory;
                this.transition = options.transition;
            } else {
                this.now = 0;
                this.fadeDuration = 0;
                this.zoomHistory = new ZoomHistory();
                this.transition = {};
            }
        }

        isSupportedScript(str        )          {
            return isStringInSupportedScript(str, plugin.isLoaded());
        }

        crossFadingFactor() {
            if (this.fadeDuration === 0) {
                return 1;
            } else {
                return Math.min((this.now - this.zoomHistory.lastIntegerZoomTime) / this.fadeDuration, 1);
            }
        }

        getCrossfadeParameters()                      {
            const z = this.zoom;
            const fraction = z - Math.floor(z);
            const t = this.crossFadingFactor();

            return z > this.zoomHistory.lastIntegerZoom ?
                { fromScale: 2, toScale: 1, t: fraction + (1 - fraction) * t } :
                { fromScale: 0.5, toScale: 1, t: 1 - (1 - t) * fraction };
        }
    }

    //      

    function polygonContainsPoint(ring      , p       ) {
        let c = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const p1 = ring[i];
            const p2 = ring[j];
            if (((p1.y > p.y) !== (p2.y > p.y)) && (p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x)) {
                c = !c;
            }
        }
        return c;
    }

    function polygonIntersectsBox(ring      , boxX1        , boxY1        , boxX2        , boxY2        ) {
        for (const p of ring) {
            if (boxX1 <= p.x &&
                boxY1 <= p.y &&
                boxX2 >= p.x &&
                boxY2 >= p.y) return true;
        }

        const corners = [
            new pointGeometry(boxX1, boxY1),
            new pointGeometry(boxX1, boxY2),
            new pointGeometry(boxX2, boxY2),
            new pointGeometry(boxX2, boxY1)];

        if (ring.length > 2) {
            for (const corner of corners) {
                if (polygonContainsPoint(ring, corner)) return true;
            }
        }

        for (let i = 0; i < ring.length - 1; i++) {
            const p1 = ring[i];
            const p2 = ring[i + 1];
            if (edgeIntersectsBox(p1, p2, corners)) return true;
        }

        return false;
    }

    function edgeIntersectsBox(e1       , e2       , corners              ) {
        const tl = corners[0];
        const br = corners[2];
        // the edge and box do not intersect in either the x or y dimensions
        if (((e1.x < tl.x) && (e2.x < tl.x)) ||
            ((e1.x > br.x) && (e2.x > br.x)) ||
            ((e1.y < tl.y) && (e2.y < tl.y)) ||
            ((e1.y > br.y) && (e2.y > br.y))) return false;

        // check if all corners of the box are on the same side of the edge
        const dir = isCounterClockwise(e1, e2, corners[0]);
        return dir !== isCounterClockwise(e1, e2, corners[1]) ||
            dir !== isCounterClockwise(e1, e2, corners[2]) ||
            dir !== isCounterClockwise(e1, e2, corners[3]);
    }

    //      

                                                            

    const viewTypes = {
        'Int8': Int8Array,
        'Uint8': Uint8Array,
        'Int16': Int16Array,
        'Uint16': Uint16Array,
        'Int32': Int32Array,
        'Uint32': Uint32Array,
        'Float32': Float32Array
    };

                                                   

    /**
     * @private
     */
    class Struct {
                      
                      
                      
                      
                                   

        // The following properties are defined on the prototype of sub classes.
                     

        /**
         * @param {StructArray} structArray The StructArray the struct is stored in
         * @param {number} index The index of the struct in the StructArray.
         * @private
         */
        constructor(structArray             , index        ) {
            (this     )._structArray = structArray;
            this._pos1 = index * this.size;
            this._pos2 = this._pos1 / 2;
            this._pos4 = this._pos1 / 4;
            this._pos8 = this._pos1 / 8;
        }
    }

    const DEFAULT_CAPACITY = 128;
    const RESIZE_MULTIPLIER = 5;

                                     
                     
                       
                           
                      
      

                                     
                                          
                     
                          
     

                                         
                       
                                
      

    /**
     * `StructArray` provides an abstraction over `ArrayBuffer` and `TypedArray`
     * making it behave like an array of typed structs.
     *
     * Conceptually, a StructArray is comprised of elements, i.e., instances of its
     * associated struct type. Each particular struct type, together with an
     * alignment size, determines the memory layout of a StructArray whose elements
     * are of that type.  Thus, for each such layout that we need, we have
     * a corrseponding StructArrayLayout class, inheriting from StructArray and
     * implementing `emplaceBack()` and `_refreshViews()`.
     *
     * In some cases, where we need to access particular elements of a StructArray,
     * we implement a more specific subclass that inherits from one of the
     * StructArrayLayouts and adds a `get(i): T` accessor that returns a structured
     * object whose properties are proxies into the underlying memory space for the
     * i-th element.  This affords the convience of working with (seemingly) plain
     * Javascript objects without the overhead of serializing/deserializing them
     * into ArrayBuffers for efficient web worker transfer.
     *
     * @private
     */
    class StructArray {
                         
                       
                               
                                 
                          

        // The following properties are defined on the prototype.
                                          
                                
                               
                           

        constructor() {
            this.isTransferred = false;
            this.capacity = -1;
            this.resize(0);
        }

        /**
         * Serialize a StructArray instance.  Serializes both the raw data and the
         * metadata needed to reconstruct the StructArray base class during
         * deserialization.
         */
        static serialize(array             , transferables                      )                        {
            assert_1(!array.isTransferred);

            array._trim();

            if (transferables) {
                array.isTransferred = true;
                transferables.push(array.arrayBuffer);
            }

            return {
                length: array.length,
                arrayBuffer: array.arrayBuffer,
            };
        }

        static deserialize(input                       ) {
            const structArray = Object.create(this.prototype);
            structArray.arrayBuffer = input.arrayBuffer;
            structArray.length = input.length;
            structArray.capacity = input.arrayBuffer.byteLength / structArray.bytesPerElement;
            structArray._refreshViews();
            return structArray;
        }

        /**
         * Resize the array to discard unused capacity.
         */
        _trim() {
            if (this.length !== this.capacity) {
                this.capacity = this.length;
                this.arrayBuffer = this.arrayBuffer.slice(0, this.length * this.bytesPerElement);
                this._refreshViews();
            }
        }

        /**
         * Resets the the length of the array to 0 without de-allocating capcacity.
         */
        clear() {
            this.length = 0;
        }

        /**
         * Resize the array.
         * If `n` is greater than the current length then additional elements with undefined values are added.
         * If `n` is less than the current length then the array will be reduced to the first `n` elements.
         * @param {number} n The new size of the array.
         */
        resize(n        ) {
            assert_1(!this.isTransferred);
            this.reserve(n);
            this.length = n;
        }

        /**
         * Indicate a planned increase in size, so that any necessary allocation may
         * be done once, ahead of time.
         * @param {number} n The expected size of the array.
         */
        reserve(n        ) {
            if (n > this.capacity) {
                this.capacity = Math.max(n, Math.floor(this.capacity * RESIZE_MULTIPLIER), DEFAULT_CAPACITY);
                this.arrayBuffer = new ArrayBuffer(this.capacity * this.bytesPerElement);

                const oldUint8Array = this.uint8;
                this._refreshViews();
                if (oldUint8Array) this.uint8.set(oldUint8Array);
            }
        }

        /**
         * Create TypedArray views for the current ArrayBuffer.
         */
        _refreshViews() {
            throw new Error('_refreshViews() must be implemented by each concrete StructArray layout');
        }
    }

    /**
     * Given a list of member fields, create a full StructArrayLayout, in
     * particular calculating the correct byte offset for each field.  This data
     * is used at build time to generate StructArrayLayout_*#emplaceBack() and
     * other accessors, and at runtime for binding vertex buffer attributes.
     *
     * @private
     */
    function createLayout(
        members                                                                ,
        alignment         = 1
    )                    {

        let offset = 0;
        let maxSize = 0;
        const layoutMembers = members.map((member) => {
            assert_1(member.name.length);
            const typeSize = sizeOf(member.type);
            const memberOffset = offset = align(offset, Math.max(alignment, typeSize));
            const components = member.components || 1;

            maxSize = Math.max(maxSize, typeSize);
            offset += typeSize * components;

            return {
                name: member.name,
                type: member.type,
                components,
                offset: memberOffset,
            };
        });

        const size = align(offset, Math.max(maxSize, alignment));

        return {
            members: layoutMembers,
            size,
            alignment
        };
    }

    function sizeOf(type          )         {
        return viewTypes[type].BYTES_PER_ELEMENT;
    }

    function align(offset        , size        )         {
        return Math.ceil(offset / size) * size;
    }

    // This file is generated. Edit build/generate-struct-arrays.js, then run `yarn run codegen`.


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[2]
     *
     * @private
     */
    class StructArrayLayout2i4 extends StructArray {
                          
                          

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1);
        }

        emplace(i        , v0        , v1        ) {
            const o2 = i * 2;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            return i;
        }
    }

    StructArrayLayout2i4.prototype.bytesPerElement = 4;
    register('StructArrayLayout2i4', StructArrayLayout2i4);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[4]
     *
     * @private
     */
    class StructArrayLayout4i8 extends StructArray {
                          
                          

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3);
        }

        emplace(i        , v0        , v1        , v2        , v3        ) {
            const o2 = i * 4;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            return i;
        }
    }

    StructArrayLayout4i8.prototype.bytesPerElement = 8;
    register('StructArrayLayout4i8', StructArrayLayout4i8);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[2]
     * [4]: Int16[4]
     *
     * @private
     */
    class StructArrayLayout2i4i12 extends StructArray {
                          
                          

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        ) {
            const o2 = i * 6;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            this.int16[o2 + 4] = v4;
            this.int16[o2 + 5] = v5;
            return i;
        }
    }

    StructArrayLayout2i4i12.prototype.bytesPerElement = 12;
    register('StructArrayLayout2i4i12', StructArrayLayout2i4i12);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[4]
     * [8]: Uint8[4]
     *
     * @private
     */
    class StructArrayLayout4i4ub12 extends StructArray {
                          
                          

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5, v6, v7);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        ) {
            const o2 = i * 6;
            const o1 = i * 12;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            this.uint8[o1 + 8] = v4;
            this.uint8[o1 + 9] = v5;
            this.uint8[o1 + 10] = v6;
            this.uint8[o1 + 11] = v7;
            return i;
        }
    }

    StructArrayLayout4i4ub12.prototype.bytesPerElement = 12;
    register('StructArrayLayout4i4ub12', StructArrayLayout4i4ub12);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint16[8]
     *
     * @private
     */
    class StructArrayLayout8ui16 extends StructArray {
                          
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5, v6, v7);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        ) {
            const o2 = i * 8;
            this.uint16[o2 + 0] = v0;
            this.uint16[o2 + 1] = v1;
            this.uint16[o2 + 2] = v2;
            this.uint16[o2 + 3] = v3;
            this.uint16[o2 + 4] = v4;
            this.uint16[o2 + 5] = v5;
            this.uint16[o2 + 6] = v6;
            this.uint16[o2 + 7] = v7;
            return i;
        }
    }

    StructArrayLayout8ui16.prototype.bytesPerElement = 16;
    register('StructArrayLayout8ui16', StructArrayLayout8ui16);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[4]
     * [8]: Uint16[4]
     *
     * @private
     */
    class StructArrayLayout4i4ui16 extends StructArray {
                          
                          
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5, v6, v7);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        ) {
            const o2 = i * 8;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            this.uint16[o2 + 4] = v4;
            this.uint16[o2 + 5] = v5;
            this.uint16[o2 + 6] = v6;
            this.uint16[o2 + 7] = v7;
            return i;
        }
    }

    StructArrayLayout4i4ui16.prototype.bytesPerElement = 16;
    register('StructArrayLayout4i4ui16', StructArrayLayout4i4ui16);


    /**
     * Implementation of the StructArray layout:
     * [0]: Float32[3]
     *
     * @private
     */
    class StructArrayLayout3f12 extends StructArray {
                          
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2);
        }

        emplace(i        , v0        , v1        , v2        ) {
            const o4 = i * 3;
            this.float32[o4 + 0] = v0;
            this.float32[o4 + 1] = v1;
            this.float32[o4 + 2] = v2;
            return i;
        }
    }

    StructArrayLayout3f12.prototype.bytesPerElement = 12;
    register('StructArrayLayout3f12', StructArrayLayout3f12);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint32[1]
     *
     * @private
     */
    class StructArrayLayout1ul4 extends StructArray {
                          
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.uint32 = new Uint32Array(this.arrayBuffer);
        }

        emplaceBack(v0        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0);
        }

        emplace(i        , v0        ) {
            const o4 = i * 1;
            this.uint32[o4 + 0] = v0;
            return i;
        }
    }

    StructArrayLayout1ul4.prototype.bytesPerElement = 4;
    register('StructArrayLayout1ul4', StructArrayLayout1ul4);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[6]
     * [12]: Uint32[1]
     * [16]: Uint16[2]
     * [20]: Int16[2]
     *
     * @private
     */
    class StructArrayLayout6i1ul2ui2i24 extends StructArray {
                          
                          
                            
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
            this.uint32 = new Uint32Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        , v8        , v9        , v10        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        , v8        , v9        , v10        ) {
            const o2 = i * 12;
            const o4 = i * 6;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            this.int16[o2 + 4] = v4;
            this.int16[o2 + 5] = v5;
            this.uint32[o4 + 3] = v6;
            this.uint16[o2 + 8] = v7;
            this.uint16[o2 + 9] = v8;
            this.int16[o2 + 10] = v9;
            this.int16[o2 + 11] = v10;
            return i;
        }
    }

    StructArrayLayout6i1ul2ui2i24.prototype.bytesPerElement = 24;
    register('StructArrayLayout6i1ul2ui2i24', StructArrayLayout6i1ul2ui2i24);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[2]
     * [4]: Int16[2]
     * [8]: Int16[2]
     *
     * @private
     */
    class StructArrayLayout2i2i2i12 extends StructArray {
                          
                          

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        ) {
            const o2 = i * 6;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            this.int16[o2 + 4] = v4;
            this.int16[o2 + 5] = v5;
            return i;
        }
    }

    StructArrayLayout2i2i2i12.prototype.bytesPerElement = 12;
    register('StructArrayLayout2i2i2i12', StructArrayLayout2i2i2i12);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint8[2]
     * [4]: Float32[2]
     *
     * @private
     */
    class StructArrayLayout2ub2f12 extends StructArray {
                          
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3);
        }

        emplace(i        , v0        , v1        , v2        , v3        ) {
            const o1 = i * 12;
            const o4 = i * 3;
            this.uint8[o1 + 0] = v0;
            this.uint8[o1 + 1] = v1;
            this.float32[o4 + 1] = v2;
            this.float32[o4 + 2] = v3;
            return i;
        }
    }

    StructArrayLayout2ub2f12.prototype.bytesPerElement = 12;
    register('StructArrayLayout2ub2f12', StructArrayLayout2ub2f12);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[2]
     * [4]: Uint16[2]
     * [8]: Uint32[3]
     * [20]: Uint16[3]
     * [28]: Float32[2]
     * [36]: Uint8[2]
     * [40]: Uint32[1]
     *
     * @private
     */
    class StructArrayLayout2i2ui3ul3ui2f2ub1ul44 extends StructArray {
                          
                          
                            
                            
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
            this.uint32 = new Uint32Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        , v8        , v9        , v10        , v11        , v12        , v13        , v14        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        , v8        , v9        , v10        , v11        , v12        , v13        , v14        ) {
            const o2 = i * 22;
            const o4 = i * 11;
            const o1 = i * 44;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.uint16[o2 + 2] = v2;
            this.uint16[o2 + 3] = v3;
            this.uint32[o4 + 2] = v4;
            this.uint32[o4 + 3] = v5;
            this.uint32[o4 + 4] = v6;
            this.uint16[o2 + 10] = v7;
            this.uint16[o2 + 11] = v8;
            this.uint16[o2 + 12] = v9;
            this.float32[o4 + 7] = v10;
            this.float32[o4 + 8] = v11;
            this.uint8[o1 + 36] = v12;
            this.uint8[o1 + 37] = v13;
            this.uint32[o4 + 10] = v14;
            return i;
        }
    }

    StructArrayLayout2i2ui3ul3ui2f2ub1ul44.prototype.bytesPerElement = 44;
    register('StructArrayLayout2i2ui3ul3ui2f2ub1ul44', StructArrayLayout2i2ui3ul3ui2f2ub1ul44);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[6]
     * [12]: Uint16[9]
     * [32]: Uint32[1]
     * [36]: Float32[2]
     *
     * @private
     */
    class StructArrayLayout6i9ui1ul2f44 extends StructArray {
                          
                          
                            
                            
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
            this.uint32 = new Uint32Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        , v8        , v9        , v10        , v11        , v12        , v13        , v14        , v15        , v16        , v17        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17);
        }

        emplace(i        , v0        , v1        , v2        , v3        , v4        , v5        , v6        , v7        , v8        , v9        , v10        , v11        , v12        , v13        , v14        , v15        , v16        , v17        ) {
            const o2 = i * 22;
            const o4 = i * 11;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            this.int16[o2 + 3] = v3;
            this.int16[o2 + 4] = v4;
            this.int16[o2 + 5] = v5;
            this.uint16[o2 + 6] = v6;
            this.uint16[o2 + 7] = v7;
            this.uint16[o2 + 8] = v8;
            this.uint16[o2 + 9] = v9;
            this.uint16[o2 + 10] = v10;
            this.uint16[o2 + 11] = v11;
            this.uint16[o2 + 12] = v12;
            this.uint16[o2 + 13] = v13;
            this.uint16[o2 + 14] = v14;
            this.uint32[o4 + 8] = v15;
            this.float32[o4 + 9] = v16;
            this.float32[o4 + 10] = v17;
            return i;
        }
    }

    StructArrayLayout6i9ui1ul2f44.prototype.bytesPerElement = 44;
    register('StructArrayLayout6i9ui1ul2f44', StructArrayLayout6i9ui1ul2f44);


    /**
     * Implementation of the StructArray layout:
     * [0]: Float32[1]
     *
     * @private
     */
    class StructArrayLayout1f4 extends StructArray {
                          
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0);
        }

        emplace(i        , v0        ) {
            const o4 = i * 1;
            this.float32[o4 + 0] = v0;
            return i;
        }
    }

    StructArrayLayout1f4.prototype.bytesPerElement = 4;
    register('StructArrayLayout1f4', StructArrayLayout1f4);


    /**
     * Implementation of the StructArray layout:
     * [0]: Int16[3]
     *
     * @private
     */
    class StructArrayLayout3i6 extends StructArray {
                          
                          

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.int16 = new Int16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2);
        }

        emplace(i        , v0        , v1        , v2        ) {
            const o2 = i * 3;
            this.int16[o2 + 0] = v0;
            this.int16[o2 + 1] = v1;
            this.int16[o2 + 2] = v2;
            return i;
        }
    }

    StructArrayLayout3i6.prototype.bytesPerElement = 6;
    register('StructArrayLayout3i6', StructArrayLayout3i6);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint32[1]
     * [4]: Uint16[2]
     *
     * @private
     */
    class StructArrayLayout1ul2ui8 extends StructArray {
                          
                            
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.uint32 = new Uint32Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2);
        }

        emplace(i        , v0        , v1        , v2        ) {
            const o4 = i * 2;
            const o2 = i * 4;
            this.uint32[o4 + 0] = v0;
            this.uint16[o2 + 2] = v1;
            this.uint16[o2 + 3] = v2;
            return i;
        }
    }

    StructArrayLayout1ul2ui8.prototype.bytesPerElement = 8;
    register('StructArrayLayout1ul2ui8', StructArrayLayout1ul2ui8);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint16[3]
     *
     * @private
     */
    class StructArrayLayout3ui6 extends StructArray {
                          
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2);
        }

        emplace(i        , v0        , v1        , v2        ) {
            const o2 = i * 3;
            this.uint16[o2 + 0] = v0;
            this.uint16[o2 + 1] = v1;
            this.uint16[o2 + 2] = v2;
            return i;
        }
    }

    StructArrayLayout3ui6.prototype.bytesPerElement = 6;
    register('StructArrayLayout3ui6', StructArrayLayout3ui6);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint16[2]
     *
     * @private
     */
    class StructArrayLayout2ui4 extends StructArray {
                          
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1);
        }

        emplace(i        , v0        , v1        ) {
            const o2 = i * 2;
            this.uint16[o2 + 0] = v0;
            this.uint16[o2 + 1] = v1;
            return i;
        }
    }

    StructArrayLayout2ui4.prototype.bytesPerElement = 4;
    register('StructArrayLayout2ui4', StructArrayLayout2ui4);


    /**
     * Implementation of the StructArray layout:
     * [0]: Uint16[1]
     *
     * @private
     */
    class StructArrayLayout1ui2 extends StructArray {
                          
                            

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.uint16 = new Uint16Array(this.arrayBuffer);
        }

        emplaceBack(v0        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0);
        }

        emplace(i        , v0        ) {
            const o2 = i * 1;
            this.uint16[o2 + 0] = v0;
            return i;
        }
    }

    StructArrayLayout1ui2.prototype.bytesPerElement = 2;
    register('StructArrayLayout1ui2', StructArrayLayout1ui2);


    /**
     * Implementation of the StructArray layout:
     * [0]: Float32[2]
     *
     * @private
     */
    class StructArrayLayout2f8 extends StructArray {
                          
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1);
        }

        emplace(i        , v0        , v1        ) {
            const o4 = i * 2;
            this.float32[o4 + 0] = v0;
            this.float32[o4 + 1] = v1;
            return i;
        }
    }

    StructArrayLayout2f8.prototype.bytesPerElement = 8;
    register('StructArrayLayout2f8', StructArrayLayout2f8);


    /**
     * Implementation of the StructArray layout:
     * [0]: Float32[4]
     *
     * @private
     */
    class StructArrayLayout4f16 extends StructArray {
                          
                              

        _refreshViews() {
            this.uint8 = new Uint8Array(this.arrayBuffer);
            this.float32 = new Float32Array(this.arrayBuffer);
        }

        emplaceBack(v0        , v1        , v2        , v3        ) {
            const i = this.length;
            this.resize(i + 1);
            return this.emplace(i, v0, v1, v2, v3);
        }

        emplace(i        , v0        , v1        , v2        , v3        ) {
            const o4 = i * 4;
            this.float32[o4 + 0] = v0;
            this.float32[o4 + 1] = v1;
            this.float32[o4 + 2] = v2;
            this.float32[o4 + 3] = v3;
            return i;
        }
    }

    StructArrayLayout4f16.prototype.bytesPerElement = 16;
    register('StructArrayLayout4f16', StructArrayLayout4f16);


    class CollisionBoxStruct extends Struct {
                                        
                             
                             
                   
                   
                   
                   
                             
                                 
                            
                       
                                         
                           
        get anchorPointX() { return this._structArray.int16[this._pos2 + 0]; }
        set anchorPointX(x) { this._structArray.int16[this._pos2 + 0] = x; }
        get anchorPointY() { return this._structArray.int16[this._pos2 + 1]; }
        set anchorPointY(x) { this._structArray.int16[this._pos2 + 1] = x; }
        get x1() { return this._structArray.int16[this._pos2 + 2]; }
        set x1(x) { this._structArray.int16[this._pos2 + 2] = x; }
        get y1() { return this._structArray.int16[this._pos2 + 3]; }
        set y1(x) { this._structArray.int16[this._pos2 + 3] = x; }
        get x2() { return this._structArray.int16[this._pos2 + 4]; }
        set x2(x) { this._structArray.int16[this._pos2 + 4] = x; }
        get y2() { return this._structArray.int16[this._pos2 + 5]; }
        set y2(x) { this._structArray.int16[this._pos2 + 5] = x; }
        get featureIndex() { return this._structArray.uint32[this._pos4 + 3]; }
        set featureIndex(x) { this._structArray.uint32[this._pos4 + 3] = x; }
        get sourceLayerIndex() { return this._structArray.uint16[this._pos2 + 8]; }
        set sourceLayerIndex(x) { this._structArray.uint16[this._pos2 + 8] = x; }
        get bucketIndex() { return this._structArray.uint16[this._pos2 + 9]; }
        set bucketIndex(x) { this._structArray.uint16[this._pos2 + 9] = x; }
        get radius() { return this._structArray.int16[this._pos2 + 10]; }
        set radius(x) { this._structArray.int16[this._pos2 + 10] = x; }
        get signedDistanceFromAnchor() { return this._structArray.int16[this._pos2 + 11]; }
        set signedDistanceFromAnchor(x) { this._structArray.int16[this._pos2 + 11] = x; }
        get anchorPoint() { return new pointGeometry(this.anchorPointX, this.anchorPointY); }
    }

    CollisionBoxStruct.prototype.size = 24;

                                                  


    /**
     * @private
     */
    class CollisionBoxArray extends StructArrayLayout6i1ul2ui2i24 {
        /**
         * Return the CollisionBoxStruct at the given location in the array.
         * @param {number} index The index of the element.
         */
        get(index        )                     {
            assert_1(!this.isTransferred);
            return new CollisionBoxStruct(this, index);
        }
    }

    register('CollisionBoxArray', CollisionBoxArray);

    class PlacedSymbolStruct extends Struct {
                                        
                        
                        
                                
                          
                                 
                               
                           
                        
                          
                          
                            
                            
                            
                       
                            
        get anchorX() { return this._structArray.int16[this._pos2 + 0]; }
        set anchorX(x) { this._structArray.int16[this._pos2 + 0] = x; }
        get anchorY() { return this._structArray.int16[this._pos2 + 1]; }
        set anchorY(x) { this._structArray.int16[this._pos2 + 1] = x; }
        get glyphStartIndex() { return this._structArray.uint16[this._pos2 + 2]; }
        set glyphStartIndex(x) { this._structArray.uint16[this._pos2 + 2] = x; }
        get numGlyphs() { return this._structArray.uint16[this._pos2 + 3]; }
        set numGlyphs(x) { this._structArray.uint16[this._pos2 + 3] = x; }
        get vertexStartIndex() { return this._structArray.uint32[this._pos4 + 2]; }
        set vertexStartIndex(x) { this._structArray.uint32[this._pos4 + 2] = x; }
        get lineStartIndex() { return this._structArray.uint32[this._pos4 + 3]; }
        set lineStartIndex(x) { this._structArray.uint32[this._pos4 + 3] = x; }
        get lineLength() { return this._structArray.uint32[this._pos4 + 4]; }
        set lineLength(x) { this._structArray.uint32[this._pos4 + 4] = x; }
        get segment() { return this._structArray.uint16[this._pos2 + 10]; }
        set segment(x) { this._structArray.uint16[this._pos2 + 10] = x; }
        get lowerSize() { return this._structArray.uint16[this._pos2 + 11]; }
        set lowerSize(x) { this._structArray.uint16[this._pos2 + 11] = x; }
        get upperSize() { return this._structArray.uint16[this._pos2 + 12]; }
        set upperSize(x) { this._structArray.uint16[this._pos2 + 12] = x; }
        get lineOffsetX() { return this._structArray.float32[this._pos4 + 7]; }
        set lineOffsetX(x) { this._structArray.float32[this._pos4 + 7] = x; }
        get lineOffsetY() { return this._structArray.float32[this._pos4 + 8]; }
        set lineOffsetY(x) { this._structArray.float32[this._pos4 + 8] = x; }
        get writingMode() { return this._structArray.uint8[this._pos1 + 36]; }
        set writingMode(x) { this._structArray.uint8[this._pos1 + 36] = x; }
        get hidden() { return this._structArray.uint8[this._pos1 + 37]; }
        set hidden(x) { this._structArray.uint8[this._pos1 + 37] = x; }
        get crossTileID() { return this._structArray.uint32[this._pos4 + 10]; }
        set crossTileID(x) { this._structArray.uint32[this._pos4 + 10] = x; }
    }

    PlacedSymbolStruct.prototype.size = 44;

                                                  


    /**
     * @private
     */
    class PlacedSymbolArray extends StructArrayLayout2i2ui3ul3ui2f2ub1ul44 {
        /**
         * Return the PlacedSymbolStruct at the given location in the array.
         * @param {number} index The index of the element.
         */
        get(index        )                     {
            assert_1(!this.isTransferred);
            return new PlacedSymbolStruct(this, index);
        }
    }

    register('PlacedSymbolArray', PlacedSymbolArray);

    class SymbolInstanceStruct extends Struct {
                                          
                        
                        
                                              
                                               
                                             
                                              
                    
                                  
                                
                                  
                                
                             
                                           
                                         
                                
                            
                             
                                 
        get anchorX() { return this._structArray.int16[this._pos2 + 0]; }
        set anchorX(x) { this._structArray.int16[this._pos2 + 0] = x; }
        get anchorY() { return this._structArray.int16[this._pos2 + 1]; }
        set anchorY(x) { this._structArray.int16[this._pos2 + 1] = x; }
        get rightJustifiedTextSymbolIndex() { return this._structArray.int16[this._pos2 + 2]; }
        set rightJustifiedTextSymbolIndex(x) { this._structArray.int16[this._pos2 + 2] = x; }
        get centerJustifiedTextSymbolIndex() { return this._structArray.int16[this._pos2 + 3]; }
        set centerJustifiedTextSymbolIndex(x) { this._structArray.int16[this._pos2 + 3] = x; }
        get leftJustifiedTextSymbolIndex() { return this._structArray.int16[this._pos2 + 4]; }
        set leftJustifiedTextSymbolIndex(x) { this._structArray.int16[this._pos2 + 4] = x; }
        get verticalPlacedTextSymbolIndex() { return this._structArray.int16[this._pos2 + 5]; }
        set verticalPlacedTextSymbolIndex(x) { this._structArray.int16[this._pos2 + 5] = x; }
        get key() { return this._structArray.uint16[this._pos2 + 6]; }
        set key(x) { this._structArray.uint16[this._pos2 + 6] = x; }
        get textBoxStartIndex() { return this._structArray.uint16[this._pos2 + 7]; }
        set textBoxStartIndex(x) { this._structArray.uint16[this._pos2 + 7] = x; }
        get textBoxEndIndex() { return this._structArray.uint16[this._pos2 + 8]; }
        set textBoxEndIndex(x) { this._structArray.uint16[this._pos2 + 8] = x; }
        get iconBoxStartIndex() { return this._structArray.uint16[this._pos2 + 9]; }
        set iconBoxStartIndex(x) { this._structArray.uint16[this._pos2 + 9] = x; }
        get iconBoxEndIndex() { return this._structArray.uint16[this._pos2 + 10]; }
        set iconBoxEndIndex(x) { this._structArray.uint16[this._pos2 + 10] = x; }
        get featureIndex() { return this._structArray.uint16[this._pos2 + 11]; }
        set featureIndex(x) { this._structArray.uint16[this._pos2 + 11] = x; }
        get numHorizontalGlyphVertices() { return this._structArray.uint16[this._pos2 + 12]; }
        set numHorizontalGlyphVertices(x) { this._structArray.uint16[this._pos2 + 12] = x; }
        get numVerticalGlyphVertices() { return this._structArray.uint16[this._pos2 + 13]; }
        set numVerticalGlyphVertices(x) { this._structArray.uint16[this._pos2 + 13] = x; }
        get numIconVertices() { return this._structArray.uint16[this._pos2 + 14]; }
        set numIconVertices(x) { this._structArray.uint16[this._pos2 + 14] = x; }
        get crossTileID() { return this._structArray.uint32[this._pos4 + 8]; }
        set crossTileID(x) { this._structArray.uint32[this._pos4 + 8] = x; }
        get textBoxScale() { return this._structArray.float32[this._pos4 + 9]; }
        set textBoxScale(x) { this._structArray.float32[this._pos4 + 9] = x; }
        get radialTextOffset() { return this._structArray.float32[this._pos4 + 10]; }
        set radialTextOffset(x) { this._structArray.float32[this._pos4 + 10] = x; }
    }

    SymbolInstanceStruct.prototype.size = 44;

                                                      


    /**
     * @private
     */
    class SymbolInstanceArray extends StructArrayLayout6i9ui1ul2f44 {
        /**
         * Return the SymbolInstanceStruct at the given location in the array.
         * @param {number} index The index of the element.
         */
        get(index        )                       {
            assert_1(!this.isTransferred);
            return new SymbolInstanceStruct(this, index);
        }
    }

    register('SymbolInstanceArray', SymbolInstanceArray);

    class GlyphOffsetStruct extends Struct {
                                       
                        
        get offsetX() { return this._structArray.float32[this._pos4 + 0]; }
        set offsetX(x) { this._structArray.float32[this._pos4 + 0] = x; }
    }

    GlyphOffsetStruct.prototype.size = 4;

                                                


    /**
     * @private
     */
    class GlyphOffsetArray extends StructArrayLayout1f4 {
        getoffsetX(index        ) { return this.float32[index * 1 + 0]; }
        /**
         * Return the GlyphOffsetStruct at the given location in the array.
         * @param {number} index The index of the element.
         */
        get(index        )                    {
            assert_1(!this.isTransferred);
            return new GlyphOffsetStruct(this, index);
        }
    }

    register('GlyphOffsetArray', GlyphOffsetArray);

    class SymbolLineVertexStruct extends Struct {
                                            
                  
                  
                                           
        get x() { return this._structArray.int16[this._pos2 + 0]; }
        set x(x) { this._structArray.int16[this._pos2 + 0] = x; }
        get y() { return this._structArray.int16[this._pos2 + 1]; }
        set y(x) { this._structArray.int16[this._pos2 + 1] = x; }
        get tileUnitDistanceFromAnchor() { return this._structArray.int16[this._pos2 + 2]; }
        set tileUnitDistanceFromAnchor(x) { this._structArray.int16[this._pos2 + 2] = x; }
    }

    SymbolLineVertexStruct.prototype.size = 6;

                                                          


    /**
     * @private
     */
    class SymbolLineVertexArray extends StructArrayLayout3i6 {
        getx(index        ) { return this.int16[index * 3 + 0]; }
        gety(index        ) { return this.int16[index * 3 + 1]; }
        gettileUnitDistanceFromAnchor(index        ) { return this.int16[index * 3 + 2]; }
        /**
         * Return the SymbolLineVertexStruct at the given location in the array.
         * @param {number} index The index of the element.
         */
        get(index        )                         {
            assert_1(!this.isTransferred);
            return new SymbolLineVertexStruct(this, index);
        }
    }

    register('SymbolLineVertexArray', SymbolLineVertexArray);

    class FeatureIndexStruct extends Struct {
                                        
                             
                                 
                            
        get featureIndex() { return this._structArray.uint32[this._pos4 + 0]; }
        set featureIndex(x) { this._structArray.uint32[this._pos4 + 0] = x; }
        get sourceLayerIndex() { return this._structArray.uint16[this._pos2 + 2]; }
        set sourceLayerIndex(x) { this._structArray.uint16[this._pos2 + 2] = x; }
        get bucketIndex() { return this._structArray.uint16[this._pos2 + 3]; }
        set bucketIndex(x) { this._structArray.uint16[this._pos2 + 3] = x; }
    }

    FeatureIndexStruct.prototype.size = 8;

                                                  


    /**
     * @private
     */
    class FeatureIndexArray extends StructArrayLayout1ul2ui8 {
        /**
         * Return the FeatureIndexStruct at the given location in the array.
         * @param {number} index The index of the element.
         */
        get(index        )                     {
            assert_1(!this.isTransferred);
            return new FeatureIndexStruct(this, index);
        }
    }

    register('FeatureIndexArray', FeatureIndexArray);

    //      

                            
                      
                                     
                             
                         
                                    
                                          
                             
                 
                                        
                                  
         
     

    class FeatureIndex {
                                 
                  
                  
                  
                   
                     
                                             

                                 
                                             

                                              
                                          

        constructor(tileID                  ,
                    grid       ,
                    featureIndexArray                    ) {
            this.tileID = tileID;
            this.x = tileID.canonical.x;
            this.y = tileID.canonical.y;
            this.z = tileID.canonical.z;
            this.grid = grid || new gridIndex(EXTENT, 16, 0);
            this.grid3D = new gridIndex(EXTENT, 16, 0);
            this.featureIndexArray = featureIndexArray || new FeatureIndexArray();
        }

        insert(feature                   , geometry                     , featureIndex        , sourceLayerIndex        , bucketIndex        , is3D          ) {
            const key = this.featureIndexArray.length;
            this.featureIndexArray.emplaceBack(featureIndex, sourceLayerIndex, bucketIndex);

            const grid = is3D ? this.grid3D : this.grid;

            for (let r = 0; r < geometry.length; r++) {
                const ring = geometry[r];

                const bbox = [Infinity, Infinity, -Infinity, -Infinity];
                for (let i = 0; i < ring.length; i++) {
                    const p = ring[i];
                    bbox[0] = Math.min(bbox[0], p.x);
                    bbox[1] = Math.min(bbox[1], p.y);
                    bbox[2] = Math.max(bbox[2], p.x);
                    bbox[3] = Math.max(bbox[3], p.y);
                }

                if (bbox[0] < EXTENT &&
                    bbox[1] < EXTENT &&
                    bbox[2] >= 0 &&
                    bbox[3] >= 0) {
                    grid.insert(key, bbox[0], bbox[1], bbox[2], bbox[3]);
                }
            }
        }

        loadVTLayers()                              {
            if (!this.vtLayers) {
                this.vtLayers = new vectorTile.VectorTile(new pbf(this.rawTileData)).layers;
                this.sourceLayerCoder = new DictionaryCoder(this.vtLayers ? Object.keys(this.vtLayers).sort() : ['_geojsonTileLayer']);
            }
            return this.vtLayers;
        }

        // Finds non-symbol features in this tile at a particular position.
        query(args                 , styleLayers                        , sourceFeatureState                    )                                                                       {
            this.loadVTLayers();

            const params = args.params || {},
                pixelsToTileUnits = EXTENT / args.tileSize / args.scale,
                filter = createFilter(params.filter);

            const queryGeometry = args.queryGeometry;
            const queryPadding = args.queryPadding * pixelsToTileUnits;

            const bounds = getBounds(queryGeometry);
            const matching = this.grid.query(bounds.minX - queryPadding, bounds.minY - queryPadding, bounds.maxX + queryPadding, bounds.maxY + queryPadding);

            const cameraBounds = getBounds(args.cameraQueryGeometry);
            const matching3D = this.grid3D.query(
                    cameraBounds.minX - queryPadding, cameraBounds.minY - queryPadding, cameraBounds.maxX + queryPadding, cameraBounds.maxY + queryPadding,
                    (bx1, by1, bx2, by2) => {
                        return polygonIntersectsBox(args.cameraQueryGeometry, bx1 - queryPadding, by1 - queryPadding, bx2 + queryPadding, by2 + queryPadding);
                    });

            for (const key of matching3D) {
                matching.push(key);
            }

            matching.sort(topDownFeatureComparator);

            const result = {};
            let previousIndex;
            for (let k = 0; k < matching.length; k++) {
                const index = matching[k];

                // don't check the same feature more than once
                if (index === previousIndex) continue;
                previousIndex = index;

                const match = this.featureIndexArray.get(index);
                let featureGeometry = null;
                this.loadMatchingFeature(
                    result,
                    match.bucketIndex,
                    match.sourceLayerIndex,
                    match.featureIndex,
                    filter,
                    params.layers,
                    styleLayers,
                    (feature                   , styleLayer            ) => {
                        if (!featureGeometry) {
                            featureGeometry = loadGeometry(feature);
                        }
                        let featureState = {};
                        if (feature.id) {
                            // `feature-state` expression evaluation requires feature state to be available
                            featureState = sourceFeatureState.getState(styleLayer.sourceLayer || '_geojsonTileLayer', feature.id);
                        }
                        return styleLayer.queryIntersectsFeature(queryGeometry, feature, featureState, featureGeometry, this.z, args.transform, pixelsToTileUnits, args.pixelPosMatrix);
                    }
                );
            }

            return result;
        }

        loadMatchingFeature(
            result                                                                      ,
            bucketIndex        ,
            sourceLayerIndex        ,
            featureIndex        ,
            filter               ,
            filterLayerIDs               ,
            styleLayers                        ,
            intersectionTest                                                                           ) {

            const layerIDs = this.bucketLayerIDs[bucketIndex];
            if (filterLayerIDs && !arraysIntersect(filterLayerIDs, layerIDs))
                return;

            const sourceLayerName = this.sourceLayerCoder.decode(sourceLayerIndex);
            const sourceLayer = this.vtLayers[sourceLayerName];
            const feature = sourceLayer.feature(featureIndex);

            if (!filter(new EvaluationParameters(this.tileID.overscaledZ), feature))
                return;

            for (let l = 0; l < layerIDs.length; l++) {
                const layerID = layerIDs[l];

                if (filterLayerIDs && filterLayerIDs.indexOf(layerID) < 0) {
                    continue;
                }

                const styleLayer = styleLayers[layerID];
                if (!styleLayer) continue;

                const intersectionZ = !intersectionTest || intersectionTest(feature, styleLayer);
                if (!intersectionZ) {
                    // Only applied for non-symbol features
                    continue;
                }

                const geojsonFeature = new Feature(feature, this.z, this.x, this.y);
                (geojsonFeature     ).layer = styleLayer.serialize();
                let layerResult = result[layerID];
                if (layerResult === undefined) {
                    layerResult = result[layerID] = [];
                }
                layerResult.push({ featureIndex, feature: geojsonFeature, intersectionZ });
            }
        }

        // Given a set of symbol indexes that have already been looked up,
        // return a matching set of GeoJSONFeatures
        lookupSymbolFeatures(symbolFeatureIndexes               ,
                             bucketIndex        ,
                             sourceLayerIndex        ,
                             filterSpec                     ,
                             filterLayerIDs               ,
                             styleLayers                        ) {
            const result = {};
            this.loadVTLayers();

            const filter = createFilter(filterSpec);

            for (const symbolFeatureIndex of symbolFeatureIndexes) {
                this.loadMatchingFeature(
                    result,
                    bucketIndex,
                    sourceLayerIndex,
                    symbolFeatureIndex,
                    filter,
                    filterLayerIDs,
                    styleLayers
                );

            }
            return result;
        }

        hasLayer(id        ) {
            for (const layerIDs of this.bucketLayerIDs) {
                for (const layerID of layerIDs) {
                    if (id === layerID) return true;
                }
            }

            return false;
        }
    }

    register(
        'FeatureIndex',
        FeatureIndex,
        { omit: ['rawTileData', 'sourceLayerCoder'] }
    );

    function getBounds(geometry              ) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const p of geometry) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        return { minX, minY, maxX, maxY };
    }

    function topDownFeatureComparator(a, b) {
        return b - a;
    }

    //      

    const symbolLayoutAttributes = createLayout([
        {name: 'a_pos_offset',  components: 4, type: 'Int16'},
        {name: 'a_data',        components: 4, type: 'Uint16'}
    ]);

    const dynamicLayoutAttributes = createLayout([
        { name: 'a_projected_pos', components: 3, type: 'Float32' }
    ], 4);

    const placementOpacityAttributes = createLayout([
        { name: 'a_fade_opacity', components: 1, type: 'Uint32' }
    ], 4);

    const collisionVertexAttributes = createLayout([
        { name: 'a_placed', components: 2, type: 'Uint8' },
        { name: 'a_shift', components: 2, type: 'Float32'}
    ]);

    const collisionBox = createLayout([
        // the box is centered around the anchor point
        { type: 'Int16', name: 'anchorPointX' },
        { type: 'Int16', name: 'anchorPointY' },

        // distances to the edges from the anchor
        { type: 'Int16', name: 'x1' },
        { type: 'Int16', name: 'y1' },
        { type: 'Int16', name: 'x2' },
        { type: 'Int16', name: 'y2' },

        // the index of the feature in the original vectortile
        { type: 'Uint32', name: 'featureIndex' },
        // the source layer the feature appears in
        { type: 'Uint16', name: 'sourceLayerIndex' },
        // the bucket the feature appears in
        { type: 'Uint16', name: 'bucketIndex' },

        // collision circles for lines store their distance to the anchor in tile units
        // so that they can be ignored if the projected label doesn't extend into
        // the box area
        { type: 'Int16', name: 'radius' },
        { type: 'Int16', name: 'signedDistanceFromAnchor' }
    ]);

    const collisionBoxLayout = createLayout([ // used to render collision boxes for debugging purposes
        {name: 'a_pos',        components: 2, type: 'Int16'},
        {name: 'a_anchor_pos', components: 2, type: 'Int16'},
        {name: 'a_extrude',    components: 2, type: 'Int16'}
    ], 4);

    const collisionCircleLayout = createLayout([ // used to render collision circles for debugging purposes
        {name: 'a_pos',        components: 2, type: 'Int16'},
        {name: 'a_anchor_pos', components: 2, type: 'Int16'},
        {name: 'a_extrude',    components: 2, type: 'Int16'}
    ], 4);

    const placement = createLayout([
        { type: 'Int16', name: 'anchorX' },
        { type: 'Int16', name: 'anchorY' },
        { type: 'Uint16', name: 'glyphStartIndex' },
        { type: 'Uint16', name: 'numGlyphs' },
        { type: 'Uint32', name: 'vertexStartIndex' },
        { type: 'Uint32', name: 'lineStartIndex' },
        { type: 'Uint32', name: 'lineLength' },
        { type: 'Uint16', name: 'segment' },
        { type: 'Uint16', name: 'lowerSize' },
        { type: 'Uint16', name: 'upperSize' },
        { type: 'Float32', name: 'lineOffsetX' },
        { type: 'Float32', name: 'lineOffsetY' },
        { type: 'Uint8', name: 'writingMode' },
        { type: 'Uint8', name: 'hidden' },
        { type: 'Uint32', name: 'crossTileID'}
    ]);

    const symbolInstance = createLayout([
        { type: 'Int16', name: 'anchorX' },
        { type: 'Int16', name: 'anchorY' },
        { type: 'Int16', name: 'rightJustifiedTextSymbolIndex' },
        { type: 'Int16', name: 'centerJustifiedTextSymbolIndex' },
        { type: 'Int16', name: 'leftJustifiedTextSymbolIndex' },
        { type: 'Int16', name: 'verticalPlacedTextSymbolIndex' },
        { type: 'Uint16', name: 'key' },
        { type: 'Uint16', name: 'textBoxStartIndex' },
        { type: 'Uint16', name: 'textBoxEndIndex' },
        { type: 'Uint16', name: 'iconBoxStartIndex' },
        { type: 'Uint16', name: 'iconBoxEndIndex' },
        { type: 'Uint16', name: 'featureIndex' },
        { type: 'Uint16', name: 'numHorizontalGlyphVertices' },
        { type: 'Uint16', name: 'numVerticalGlyphVertices' },
        { type: 'Uint16', name: 'numIconVertices' },
        { type: 'Uint32', name: 'crossTileID' },
        { type: 'Float32', name: 'textBoxScale'},
        { type: 'Float32', name: 'radialTextOffset'}
    ]);

    const glyphOffset = createLayout([
        { type: 'Float32', name: 'offsetX' }
    ]);

    const lineVertex = createLayout([
        { type: 'Int16', name: 'x' },
        { type: 'Int16', name: 'y' },
        { type: 'Int16', name: 'tileUnitDistanceFromAnchor' }
    ]);

    //      

                                                                       
                                                          

                           
                               
                             
                                
                             
                                
                                           
     

    class SegmentVector {
                                               
                                 

        constructor(segments                  = []) {
            this.segments = segments;
        }

        prepareSegment(numVertices        , layoutVertexArray             , indexArray             , sortKey         )          {
            let segment          = this.segments[this.segments.length - 1];
            if (numVertices > SegmentVector.MAX_VERTEX_ARRAY_LENGTH) warnOnce(`Max vertices per segment is ${SegmentVector.MAX_VERTEX_ARRAY_LENGTH}: bucket requested ${numVertices}`);
            if (!segment || segment.vertexLength + numVertices > SegmentVector.MAX_VERTEX_ARRAY_LENGTH || segment.sortKey !== sortKey) {
                segment = ({
                    vertexOffset: layoutVertexArray.length,
                    primitiveOffset: indexArray.length,
                    vertexLength: 0,
                    primitiveLength: 0
                }     );
                if (sortKey !== undefined) segment.sortKey = sortKey;
                this.segments.push(segment);
            }
            return segment;
        }

        get() {
            return this.segments;
        }

        destroy() {
            for (const segment of this.segments) {
                for (const k in segment.vaos) {
                    segment.vaos[k].destroy();
                }
            }
        }

        static simpleSegment(vertexOffset        , primitiveOffset        , vertexLength        , primitiveLength        )                {
            return new SegmentVector([{
                vertexOffset,
                primitiveOffset,
                vertexLength,
                primitiveLength,
                vaos: {},
                sortKey: 0
            }]);
        }
    }

    /*
     * The maximum size of a vertex array. This limit is imposed by WebGL's 16 bit
     * addressing of vertex buffers.
     * @private
     * @readonly
     */
    SegmentVector.MAX_VERTEX_ARRAY_LENGTH = Math.pow(2, 16) - 1;

    register('SegmentVector', SegmentVector);

    //      

    /**
     * Packs two numbers, interpreted as 8-bit unsigned integers, into a single
     * float.  Unpack them in the shader using the `unpack_float()` function,
     * defined in _prelude.vertex.glsl
     *
     * @private
     */
    function packUint8ToFloat(a        , b        ) {
        // coerce a and b to 8-bit ints
        a = clamp(Math.floor(a), 0, 255);
        b = clamp(Math.floor(b), 0, 255);
        return 256 * a + b;
    }

    //      

    // ------- PossiblyEvaluated -------

    /**
     * "Possibly evaluated value" is an intermediate stage in the evaluation chain for both paint and layout property
     * values. The purpose of this stage is to optimize away unnecessary recalculations for data-driven properties. Code
     * which uses data-driven property values must assume that the value is dependent on feature data, and request that it
     * be evaluated for each feature. But when that property value is in fact a constant or camera function, the calculation
     * will not actually depend on the feature, and we can benefit from returning the prior result of having done the
     * evaluation once, ahead of time, in an intermediate step whose inputs are just the value and "global" parameters
     * such as current zoom level.
     *
     * `PossiblyEvaluatedValue` represents the three possible outcomes of this step: if the input value was a constant or
     * camera expression, then the "possibly evaluated" result is a constant value. Otherwise, the input value was either
     * a source or composite expression, and we must defer final evaluation until supplied a feature. We separate
     * the source and composite cases because they are handled differently when generating GL attributes, buffers, and
     * uniforms.
     *
     * Note that `PossiblyEvaluatedValue` (and `PossiblyEvaluatedPropertyValue`, below) are _not_ used for properties that
     * do not allow data-driven values. For such properties, we know that the "possibly evaluated" result is always a constant
     * scalar value. See below.
     *
     * @private
     */
                                    
                                      
                          
                              

    /**
     * `PossiblyEvaluatedPropertyValue` is used for data-driven paint and layout property values. It holds a
     * `PossiblyEvaluatedValue` and the `GlobalProperties` that were used to generate it. You're not allowed to supply
     * a different set of `GlobalProperties` when performing the final evaluation because they would be ignored in the
     * case where the input value was a constant or camera function.
     *
     * @private
     */
    class PossiblyEvaluatedPropertyValue    {
                                        
                                         
                                         

        constructor(property                       , value                           , parameters                      ) {
            this.property = property;
            this.value = value;
            this.parameters = parameters;
        }

        isConstant()          {
            return this.value.kind === 'constant';
        }

        constantOr(value   )    {
            if (this.value.kind === 'constant') {
                return this.value.value;
            } else {
                return value;
            }
        }

        evaluate(feature         , featureState              )    {
            return this.property.evaluate(this.value, this.parameters, feature, featureState);
        }
    }

    /**
     * An implementation of `Property` for properties that do not permit data-driven (source or composite) expressions.
     * This restriction allows us to declare statically that the result of possibly evaluating this kind of property
     * is in fact always the scalar type `T`, and can be used without further evaluating the value on a per-feature basis.
     *
     * @private
     */
    class DataConstantProperty                              {
                                                  

        constructor(specification                            ) {
            this.specification = specification;
        }

        possiblyEvaluate(value                     , parameters                      )    {
            assert_1(!value.isDataDriven());
            return value.expression.evaluate(parameters);
        }

        interpolate(a   , b   , t        )    {
            const interp                                = (interpolate     )[this.specification.type];
            if (interp) {
                return interp(a, b, t);
            } else {
                return a;
            }
        }
    }

    /**
     * An implementation of `Property` for properties that permit data-driven (source or composite) expressions.
     * The result of possibly evaluating this kind of property is `PossiblyEvaluatedPropertyValue<T>`; obtaining
     * a scalar value `T` requires further evaluation on a per-feature basis.
     *
     * @private
     */
    class DataDrivenProperty                                                              {
                                                  

        constructor(specification                            ) {
            this.specification = specification;
        }

        possiblyEvaluate(value                                                     , parameters                      )                                    {
            if (value.expression.kind === 'constant' || value.expression.kind === 'camera') {
                return new PossiblyEvaluatedPropertyValue(this, {kind: 'constant', value: value.expression.evaluate(parameters)}, parameters);
            } else {
                return new PossiblyEvaluatedPropertyValue(this, value.expression, parameters);
            }
        }

        interpolate(a                                   ,
                    b                                   ,
                    t        )                                    {
            // If either possibly-evaluated value is non-constant, give up: we aren't able to interpolate data-driven values.
            if (a.value.kind !== 'constant' || b.value.kind !== 'constant') {
                return a;
            }

            // Special case hack solely for fill-outline-color. The undefined value is subsequently handled in
            // FillStyleLayer#recalculate, which sets fill-outline-color to the fill-color value if the former
            // is a PossiblyEvaluatedPropertyValue containing a constant undefined value. In addition to the
            // return value here, the other source of a PossiblyEvaluatedPropertyValue containing a constant
            // undefined value is the "default value" for fill-outline-color held in
            // `Properties#defaultPossiblyEvaluatedValues`, which serves as the prototype of
            // `PossiblyEvaluated#_values`.
            if (a.value.value === undefined || b.value.value === undefined) {
                return new PossiblyEvaluatedPropertyValue(this, {kind: 'constant', value: (undefined     )}, a.parameters);
            }

            const interp                                = (interpolate     )[this.specification.type];
            if (interp) {
                return new PossiblyEvaluatedPropertyValue(this, {kind: 'constant', value: interp(a.value.value, b.value.value, t)}, a.parameters);
            } else {
                return a;
            }
        }

        evaluate(value                           , parameters                      , feature         , featureState              )    {
            if (value.kind === 'constant') {
                return value.value;
            } else {
                return value.evaluate(parameters, feature, featureState);
            }
        }
    }

    /**
     * An implementation of `Property` for  data driven `line-pattern` which are transitioned by cross-fading
     * rather than interpolation.
     *
     * @private
     */

    class CrossFadedDataDrivenProperty    extends DataDrivenProperty                 {

        possiblyEvaluate(value                                                                               , parameters                      )                                                 {
            if (value.value === undefined) {
                return new PossiblyEvaluatedPropertyValue(this, {kind: 'constant', value: undefined}, parameters);
            } else if (value.expression.kind === 'constant') {
                const constantValue = value.expression.evaluate(parameters);
                const constant = this._calculate(constantValue, constantValue, constantValue, parameters);
                return new PossiblyEvaluatedPropertyValue(this, {kind: 'constant', value: constant}, parameters);
            } else if (value.expression.kind === 'camera') {
                const cameraVal = this._calculate(
                        value.expression.evaluate({zoom: parameters.zoom - 1.0}),
                        value.expression.evaluate({zoom: parameters.zoom}),
                        value.expression.evaluate({zoom: parameters.zoom + 1.0}),
                        parameters);
                return new PossiblyEvaluatedPropertyValue(this, {kind: 'constant', value: cameraVal}, parameters);
            } else {
                // source or composite expression
                return new PossiblyEvaluatedPropertyValue(this, value.expression, parameters);
            }
        }


        evaluate(value                                        , globals                      , feature         , featureState              )                 {
            if (value.kind === 'source') {
                const constant = value.evaluate(globals, feature, featureState);
                return this._calculate(constant, constant, constant, globals);
            } else if (value.kind === 'composite') {
                return this._calculate(
                    value.evaluate({zoom: Math.floor(globals.zoom) - 1.0}, feature, featureState),
                    value.evaluate({zoom: Math.floor(globals.zoom)}, feature, featureState),
                    value.evaluate({zoom: Math.floor(globals.zoom) + 1.0}, feature, featureState),
                    globals);
            } else {
                return value.value;
            }
        }

        _calculate(min   , mid   , max   , parameters                      )                {
            const z = parameters.zoom;
            return z > parameters.zoomHistory.lastIntegerZoom ? { from: min, to: mid } : { from: max, to: mid };
        }

        interpolate(a                                                )                                                 {
            return a;
        }
    }
    /**
     * An implementation of `Property` for `*-pattern` and `line-dasharray`, which are transitioned by cross-fading
     * rather than interpolation.
     *
     * @private
     */
    class CrossFadedProperty                                           {
                                                  

        constructor(specification                            ) {
            this.specification = specification;
        }

        possiblyEvaluate(value                                  , parameters                      )                 {
            if (value.value === undefined) {
                return undefined;
            } else if (value.expression.kind === 'constant') {
                const constant = value.expression.evaluate(parameters);
                return this._calculate(constant, constant, constant, parameters);
            } else {
                assert_1(!value.isDataDriven());
                return this._calculate(
                    value.expression.evaluate(new EvaluationParameters(Math.floor(parameters.zoom - 1.0), parameters)),
                    value.expression.evaluate(new EvaluationParameters(Math.floor(parameters.zoom), parameters)),
                    value.expression.evaluate(new EvaluationParameters(Math.floor(parameters.zoom + 1.0), parameters)),
                    parameters);
            }
        }

        _calculate(min   , mid   , max   , parameters                      )                 {
            const z = parameters.zoom;
            return z > parameters.zoomHistory.lastIntegerZoom ? { from: min, to: mid } : { from: max, to: mid };
        }

        interpolate(a                )                 {
            return a;
        }
    }

    /**
     * An implementation of `Property` for `heatmap-color` and `line-gradient`. Interpolation is a no-op, and
     * evaluation returns a boolean value in order to indicate its presence, but the real
     * evaluation happens in StyleLayer classes.
     *
     * @private
     */

    class ColorRampProperty                                     {
                                                  

        constructor(specification                            ) {
            this.specification = specification;
        }

        possiblyEvaluate(value                               , parameters                      )          {
            return !!value.expression.evaluate(parameters);
        }

        interpolate()          { return false; }
    }

    register('DataDrivenProperty', DataDrivenProperty);
    register('DataConstantProperty', DataConstantProperty);
    register('CrossFadedDataDrivenProperty', CrossFadedDataDrivenProperty);
    register('CrossFadedProperty', CrossFadedProperty);
    register('ColorRampProperty', ColorRampProperty);

    //      

                                         
                          
                               
      

                            
                      
                      
                    
      

    // A transferable data structure that maps feature ids to their indices and buffer offsets
    class FeaturePositionMap {
                           
                                 
                         

        constructor() {
            this.ids = [];
            this.positions = [];
            this.indexed = false;
        }

        add(id        , index        , start        , end        ) {
            this.ids.push(id);
            this.positions.push(index, start, end);
        }

        getPositions(id        )                         {
            assert_1(this.indexed);

            // binary search for the first occurrence of id in this.ids;
            // relies on ids/positions being sorted by id, which happens in serialization
            let i = 0;
            let j = this.ids.length - 1;
            while (i < j) {
                const m = (i + j) >> 1;
                if (this.ids[m] >= id) {
                    j = m;
                } else {
                    i = m + 1;
                }
            }
            const positions = [];
            while (this.ids[i] === id) {
                const index = this.positions[3 * i];
                const start = this.positions[3 * i + 1];
                const end = this.positions[3 * i + 2];
                positions.push({index, start, end});
                i++;
            }
            return positions;
        }

        static serialize(map                    , transferables                    )                               {
            const ids = new Float64Array(map.ids);
            const positions = new Uint32Array(map.positions);

            sort(ids, positions, 0, ids.length - 1);

            transferables.push(ids.buffer, positions.buffer);

            return {ids, positions};
        }

        static deserialize(obj                              )                     {
            const map = new FeaturePositionMap();
            // after transferring, we only use these arrays statically (no pushes),
            // so TypedArray vs Array distinction that flow points out doesn't matter
            map.ids = (obj.ids     );
            map.positions = (obj.positions     );
            map.indexed = true;
            return map;
        }
    }

    // custom quicksort that sorts ids, indices and offsets together (by ids)
    function sort(ids, positions, left, right) {
        if (left >= right) return;

        const pivot = ids[(left + right) >> 1];
        let i = left - 1;
        let j = right + 1;

        while (true) {
            do i++; while (ids[i] < pivot);
            do j--; while (ids[j] > pivot);
            if (i >= j) break;
            swap(ids, i, j);
            swap(positions, 3 * i, 3 * j);
            swap(positions, 3 * i + 1, 3 * j + 1);
            swap(positions, 3 * i + 2, 3 * j + 2);
        }

        sort(ids, positions, left, j);
        sort(ids, positions, j + 1, right);
    }

    function swap(arr, i, j) {
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    register('FeaturePositionMap', FeaturePositionMap);

    //      

                                             

                                         
                                                       
                                                                    

    class Uniform    {
                                  
                                        
                   

        constructor(context         , location                      ) {
            this.gl = context.gl;
            this.location = location;
        }

                             
    }

    class Uniform1f extends Uniform         {
        constructor(context         , location                      ) {
            super(context, location);
            this.current = 0;
        }

        set(v        )       {
            if (this.current !== v) {
                this.current = v;
                this.gl.uniform1f(this.location, v);
            }
        }
    }

    class Uniform4f extends Uniform                                   {
        constructor(context         , location                      ) {
            super(context, location);
            this.current = [0, 0, 0, 0];
        }

        set(v                                  )       {
            if (v[0] !== this.current[0] || v[1] !== this.current[1] ||
                v[2] !== this.current[2] || v[3] !== this.current[3]) {
                this.current = v;
                this.gl.uniform4f(this.location, v[0], v[1], v[2], v[3]);
            }
        }
    }

    class UniformColor extends Uniform        {
        constructor(context         , location                      ) {
            super(context, location);
            this.current = Color.transparent;
        }

        set(v       )       {
            if (v.r !== this.current.r || v.g !== this.current.g ||
                v.b !== this.current.b || v.a !== this.current.a) {
                this.current = v;
                this.gl.uniform4f(this.location, v.r, v.g, v.b, v.a);
            }
        }
    }

    //      

                                             
                                                                                
                                                                            
                                                                             
                                                        
                                                             
                 
                
                     
                         
                         
                           
                                      
                                                               
                                                              

                                 
                     
                         
                             
      

    function packColor(color       )                   {
        return [
            packUint8ToFloat(255 * color.r, 255 * color.g),
            packUint8ToFloat(255 * color.b, 255 * color.a)
        ];
    }

    /**
     *  `Binder` is the interface definition for the strategies for constructing,
     *  uploading, and binding paint property data as GLSL attributes. Most style-
     *  spec properties have a 1:1 relationship to shader attribute/uniforms, but
     *  some require multliple values per feature to be passed to the GPU, and in
     *  those cases we bind multiple attributes/uniforms.
     *
     *  It has three implementations, one for each of the three strategies we use:
     *
     *  * For _constant_ properties -- those whose value is a constant, or the constant
     *    result of evaluating a camera expression at a particular camera position -- we
     *    don't need a vertex attribute buffer, and instead use a uniform.
     *  * For data expressions, we use a vertex buffer with a single attribute value,
     *    the evaluated result of the source function for the given feature.
     *  * For composite expressions, we use a vertex buffer with two attributes: min and
     *    max values covering the range of zooms at which we expect the tile to be
     *    displayed. These values are calculated by evaluating the composite expression for
     *    the given feature at strategically chosen zoom levels. In addition to this
     *    attribute data, we also use a uniform value which the shader uses to interpolate
     *    between the min and max value at the final displayed zoom level. The use of a
     *    uniform allows us to cheaply update the value on every frame.
     *
     *  Note that the shader source varies depending on whether we're using a uniform or
     *  attribute. We dynamically compile shaders at runtime to accomodate this.
     *
     * @private
     */

                         
                         
                                    

                                                                                                              
                                                                                                                                                       
                              
                        

                                 
                                                                                        

                                                                                     
                                                                                        

                                                                                           
     

    class ConstantBinder                         {
                 
                             
                         
                     
                                    

        constructor(value   , names               , type        ) {
            this.value = value;
            this.names = names;
            this.uniformNames = this.names.map(name => `u_${name}`);
            this.type = type;
            this.maxValue = -Infinity;
        }

        defines() {
            return this.names.map(name => `#define HAS_UNIFORM_u_${name}`);
        }
        setConstantPatternPositions() {}
        populatePaintArray() {}
        updatePaintArray() {}
        upload() {}
        destroy() {}

        setUniforms(context         , uniform            , globals                  ,
                    currentValue                                   )       {
            uniform.set(currentValue.constantOr(this.value));
        }

        getBinding(context         , location                      )                         {
            return (this.type === 'color') ?
                new UniformColor(context, location) :
                new Uniform1f(context, location);
        }

        static serialize(binder                   ) {
            const {value, names, type} = binder;
            return {value: serialize(value), names, type};
        }

        static deserialize(serialized                                                ) {
            const {value, names, type} = serialized;
            return new ConstantBinder(deserialize(value), names, type);
        }
    }

    class CrossFadedConstantBinder                         {
                 
                             
                                    
                                                     
                     
                         

        constructor(value   , names               , type        ) {
            this.value = value;
            this.names = names;
            this.uniformNames = this.names.map(name => `u_${name}`);
            this.type = type;
            this.maxValue = -Infinity;
            this.patternPositions = {patternTo: null, patternFrom: null};
        }

        defines() {
            return this.names.map(name => `#define HAS_UNIFORM_u_${name}`);
        }

        populatePaintArray() {}
        updatePaintArray() {}
        upload() {}
        destroy() {}

        setConstantPatternPositions(posTo               , posFrom               ) {
            this.patternPositions.patternTo = posTo.tlbr;
            this.patternPositions.patternFrom = posFrom.tlbr;
        }

        setUniforms(context         , uniform            , globals                  ,
                    currentValue                                   , uniformName        ) {
            const pos = this.patternPositions;
            if (uniformName === "u_pattern_to" && pos.patternTo) uniform.set(pos.patternTo);
            if (uniformName === "u_pattern_from" && pos.patternFrom) uniform.set(pos.patternFrom);
        }

        getBinding(context         , location                      )                         {
            return new Uniform4f(context, location);
        }
    }

    class SourceExpressionBinder                         {
                                     
                             
                                    
                     
                         

                                      
                                                        
                                         

        constructor(expression                  , names               , type        , PaintVertexArray                    ) {
            this.expression = expression;
            this.names = names;
            this.type = type;
            this.uniformNames = this.names.map(name => `a_${name}`);
            this.maxValue = -Infinity;
            this.paintVertexAttributes = names.map((name) =>
                ({
                    name: `a_${name}`,
                    type: 'Float32',
                    components: type === 'color' ? 2 : 1,
                    offset: 0
                })
            );
            this.paintVertexArray = new PaintVertexArray();
        }

        defines() {
            return [];
        }

        setConstantPatternPositions() {}

        populatePaintArray(newLength        , feature         ) {
            const paintArray = this.paintVertexArray;

            const start = paintArray.length;
            paintArray.reserve(newLength);

            const value = this.expression.evaluate(new EvaluationParameters(0), feature, {});

            if (this.type === 'color') {
                const color = packColor(value);
                for (let i = start; i < newLength; i++) {
                    paintArray.emplaceBack(color[0], color[1]);
                }
            } else {
                for (let i = start; i < newLength; i++) {
                    paintArray.emplaceBack(value);
                }

                this.maxValue = Math.max(this.maxValue, value);
            }
        }

        updatePaintArray(start        , end        , feature         , featureState              ) {
            const paintArray = this.paintVertexArray;
            const value = this.expression.evaluate({zoom: 0}, feature, featureState);

            if (this.type === 'color') {
                const color = packColor(value);
                for (let i = start; i < end; i++) {
                    paintArray.emplace(i, color[0], color[1]);
                }
            } else {
                for (let i = start; i < end; i++) {
                    paintArray.emplace(i, value);
                }

                this.maxValue = Math.max(this.maxValue, value);
            }
        }

        upload(context         ) {
            if (this.paintVertexArray && this.paintVertexArray.arrayBuffer) {
                if (this.paintVertexBuffer && this.paintVertexBuffer.buffer) {
                    this.paintVertexBuffer.updateData(this.paintVertexArray);
                } else {
                    this.paintVertexBuffer = context.createVertexBuffer(this.paintVertexArray, this.paintVertexAttributes, this.expression.isStateDependent);
                }
            }
        }

        destroy() {
            if (this.paintVertexBuffer) {
                this.paintVertexBuffer.destroy();
            }
        }

        setUniforms(context         , uniform            )       {
            uniform.set(0);
        }

        getBinding(context         , location                      )            {
            return new Uniform1f(context, location);
        }
    }

    class CompositeExpressionBinder                         {
                                        
                             
                                    
                     
                                
                     
                         

                                      
                                                        
                                         

        constructor(expression                     , names               , type        , useIntegerZoom         , zoom        , layout                    ) {
            this.expression = expression;
            this.names = names;
            this.uniformNames = this.names.map(name => `a_${name}_t`);
            this.type = type;
            this.useIntegerZoom = useIntegerZoom;
            this.zoom = zoom;
            this.maxValue = -Infinity;
            const PaintVertexArray = layout;
            this.paintVertexAttributes = names.map((name) => {
                return {
                    name: `a_${name}`,
                    type: 'Float32',
                    components: type === 'color' ? 4 : 2,
                    offset: 0
                };
            });
            this.paintVertexArray = new PaintVertexArray();
        }

        defines() {
            return [];
        }

        setConstantPatternPositions() {}

        populatePaintArray(newLength        , feature         ) {
            const paintArray = this.paintVertexArray;

            const start = paintArray.length;
            paintArray.reserve(newLength);

            const min = this.expression.evaluate(new EvaluationParameters(this.zoom), feature, {});
            const max = this.expression.evaluate(new EvaluationParameters(this.zoom + 1), feature, {});

            if (this.type === 'color') {
                const minColor = packColor(min);
                const maxColor = packColor(max);
                for (let i = start; i < newLength; i++) {
                    paintArray.emplaceBack(minColor[0], minColor[1], maxColor[0], maxColor[1]);
                }
            } else {
                for (let i = start; i < newLength; i++) {
                    paintArray.emplaceBack(min, max);
                }
                this.maxValue = Math.max(this.maxValue, min, max);
            }
        }

        updatePaintArray(start        , end        , feature         , featureState              ) {
            const paintArray = this.paintVertexArray;

            const min = this.expression.evaluate({zoom: this.zoom    }, feature, featureState);
            const max = this.expression.evaluate({zoom: this.zoom + 1}, feature, featureState);

            if (this.type === 'color') {
                const minColor = packColor(min);
                const maxColor = packColor(max);
                for (let i = start; i < end; i++) {
                    paintArray.emplace(i, minColor[0], minColor[1], maxColor[0], maxColor[1]);
                }
            } else {
                for (let i = start; i < end; i++) {
                    paintArray.emplace(i, min, max);
                }
                this.maxValue = Math.max(this.maxValue, min, max);
            }
        }

        upload(context         ) {
            if (this.paintVertexArray && this.paintVertexArray.arrayBuffer) {
                if (this.paintVertexBuffer && this.paintVertexBuffer.buffer) {
                    this.paintVertexBuffer.updateData(this.paintVertexArray);
                } else {
                    this.paintVertexBuffer = context.createVertexBuffer(this.paintVertexArray, this.paintVertexAttributes, this.expression.isStateDependent);
                }
            }
        }

        destroy() {
            if (this.paintVertexBuffer) {
                this.paintVertexBuffer.destroy();
            }
        }

        interpolationFactor(currentZoom        ) {
            if (this.useIntegerZoom) {
                return this.expression.interpolationFactor(Math.floor(currentZoom), this.zoom, this.zoom + 1);
            } else {
                return this.expression.interpolationFactor(currentZoom, this.zoom, this.zoom + 1);
            }
        }

        setUniforms(context         , uniform            ,
                    globals                  )       {
            uniform.set(this.interpolationFactor(globals.zoom));
        }

        getBinding(context         , location                      )            {
            return new Uniform1f(context, location);
        }
    }

    class CrossFadedCompositeBinder                         {
                                        
                             
                                    
                     
                                
                     
                         
                        

                                            
                                             
                                               
                                                
                                                        

        constructor(expression                     , names               , type        , useIntegerZoom         , zoom        , PaintVertexArray                    , layerId        ) {

            this.expression = expression;
            this.names = names;
            this.type = type;
            this.uniformNames = this.names.map(name => `a_${name}_t`);
            this.useIntegerZoom = useIntegerZoom;
            this.zoom = zoom;
            this.maxValue = -Infinity;
            this.layerId = layerId;

            this.paintVertexAttributes = names.map((name) =>
                ({
                    name: `a_${name}`,
                    type: 'Uint16',
                    components: 4,
                    offset: 0
                })
            );

            this.zoomInPaintVertexArray = new PaintVertexArray();
            this.zoomOutPaintVertexArray = new PaintVertexArray();
        }

        defines() {
            return [];
        }

        setConstantPatternPositions() {}

        populatePaintArray(length        , feature         , imagePositions                           ) {
            // We populate two paint arrays because, for cross-faded properties, we don't know which direction
            // we're cross-fading to at layout time. In order to keep vertex attributes to a minimum and not pass
            // unnecessary vertex data to the shaders, we determine which to upload at draw time.

            const zoomInArray = this.zoomInPaintVertexArray;
            const zoomOutArray = this.zoomOutPaintVertexArray;
            const { layerId } = this;
            const start = zoomInArray.length;

            zoomInArray.reserve(length);
            zoomOutArray.reserve(length);

            if (imagePositions && feature.patterns && feature.patterns[layerId]) {
                const { min, mid, max } = feature.patterns[layerId];

                const imageMin = imagePositions[min];
                const imageMid = imagePositions[mid];
                const imageMax = imagePositions[max];

                if (!imageMin || !imageMid || !imageMax) return;

                for (let i = start; i < length; i++) {
                    zoomInArray.emplaceBack(
                        imageMid.tl[0], imageMid.tl[1], imageMid.br[0], imageMid.br[1],
                        imageMin.tl[0], imageMin.tl[1], imageMin.br[0], imageMin.br[1]
                    );

                    zoomOutArray.emplaceBack(
                        imageMid.tl[0], imageMid.tl[1], imageMid.br[0], imageMid.br[1],
                        imageMax.tl[0], imageMax.tl[1], imageMax.br[0], imageMax.br[1]
                    );
                }
            }
        }

        updatePaintArray(start        , end        , feature         , featureState              , imagePositions                           ) {
            // We populate two paint arrays because, for cross-faded properties, we don't know which direction
            // we're cross-fading to at layout time. In order to keep vertex attributes to a minimum and not pass
            // unnecessary vertex data to the shaders, we determine which to upload at draw time.

            const zoomInArray = this.zoomInPaintVertexArray;
            const zoomOutArray = this.zoomOutPaintVertexArray;
            const { layerId } = this;

            if (imagePositions && feature.patterns && feature.patterns[layerId]) {
                const {min, mid, max} = feature.patterns[layerId];
                const imageMin = imagePositions[min];
                const imageMid = imagePositions[mid];
                const imageMax = imagePositions[max];

                if (!imageMin || !imageMid || !imageMax) return;
                for (let i = start; i < end; i++) {
                    zoomInArray.emplace(i,
                        imageMid.tl[0], imageMid.tl[1], imageMid.br[0], imageMid.br[1],
                        imageMin.tl[0], imageMin.tl[1], imageMin.br[0], imageMin.br[1]
                    );

                    zoomOutArray.emplace(i,
                        imageMid.tl[0], imageMid.tl[1], imageMid.br[0], imageMid.br[1],
                        imageMax.tl[0], imageMax.tl[1], imageMax.br[0], imageMax.br[1]
                    );
                }
            }
        }

        upload(context         ) {
            if (this.zoomInPaintVertexArray && this.zoomInPaintVertexArray.arrayBuffer && this.zoomOutPaintVertexArray && this.zoomOutPaintVertexArray.arrayBuffer) {
                this.zoomInPaintVertexBuffer = context.createVertexBuffer(this.zoomInPaintVertexArray, this.paintVertexAttributes, this.expression.isStateDependent);
                this.zoomOutPaintVertexBuffer = context.createVertexBuffer(this.zoomOutPaintVertexArray, this.paintVertexAttributes, this.expression.isStateDependent);
            }
        }

        destroy() {
            if (this.zoomOutPaintVertexBuffer) this.zoomOutPaintVertexBuffer.destroy();
            if (this.zoomInPaintVertexBuffer) this.zoomInPaintVertexBuffer.destroy();

        }

        setUniforms(context         , uniform            )       {
            uniform.set(0);
        }

        getBinding(context         , location                      )                         {
            return new Uniform1f(context, location);
        }
    }

    /**
     * ProgramConfiguration contains the logic for binding style layer properties and tile
     * layer feature data into GL program uniforms and vertex attributes.
     *
     * Non-data-driven property values are bound to shader uniforms. Data-driven property
     * values are bound to vertex attributes. In order to support a uniform GLSL syntax over
     * both, [Mapbox GL Shaders](https://github.com/mapbox/mapbox-gl-shaders) defines a `#pragma`
     * abstraction, which ProgramConfiguration is responsible for implementing. At runtime,
     * it examines the attributes of a particular layer, combines this with fixed knowledge
     * about how layers of the particular type are implemented, and determines which uniforms
     * and vertex attributes will be required. It can then substitute the appropriate text
     * into the shader source code, create and link a program, and bind the uniforms and
     * vertex attributes in preparation for drawing.
     *
     * When a vector tile is parsed, this same configuration information is used to
     * populate the attribute buffers needed for data-driven styling using the zoom
     * level and feature property data.
     *
     * @private
     */
    class ProgramConfiguration {
                                           
                         
                                                   

                                      
                                        
                              

        constructor() {
            this.binders = {};
            this.cacheKey = '';
            this._buffers = [];
            this._featureMap = new FeaturePositionMap();
            this._bufferOffset = 0;
        }

        static createDynamic                        (layer       , zoom        , filterProperties                     ) {
            const self = new ProgramConfiguration();
            const keys = [];

            for (const property in layer.paint._values) {
                if (!filterProperties(property)) continue;
                const value = layer.paint.get(property);
                if (!(value instanceof PossiblyEvaluatedPropertyValue) || !supportsPropertyExpression(value.property.specification)) {
                    continue;
                }
                const names = paintAttributeNames(property, layer.type);
                const type = value.property.specification.type;
                const useIntegerZoom = value.property.useIntegerZoom;
                const isCrossFaded = value.property.specification['property-type'] === 'cross-faded' ||
                                     value.property.specification['property-type'] === 'cross-faded-data-driven';

                if (isCrossFaded) {
                    if (value.value.kind === 'constant') {
                        self.binders[property] = new CrossFadedConstantBinder(value.value.value, names, type);
                        keys.push(`/u_${property}`);
                    } else {
                        const StructArrayLayout = layoutType(property, type, 'source');
                        self.binders[property] = new CrossFadedCompositeBinder(value.value, names, type, useIntegerZoom, zoom, StructArrayLayout, layer.id);
                        keys.push(`/a_${property}`);
                    }
                } else if (value.value.kind === 'constant') {
                    self.binders[property] = new ConstantBinder(value.value.value, names, type);
                    keys.push(`/u_${property}`);
                } else if (value.value.kind === 'source') {
                    const StructArrayLayout = layoutType(property, type, 'source');
                    self.binders[property] = new SourceExpressionBinder(value.value, names, type, StructArrayLayout);
                    keys.push(`/a_${property}`);
                } else {
                    const StructArrayLayout = layoutType(property, type, 'composite');
                    self.binders[property] = new CompositeExpressionBinder(value.value, names, type, useIntegerZoom, zoom, StructArrayLayout);
                    keys.push(`/z_${property}`);
                }
            }

            self.cacheKey = keys.sort().join('');

            return self;
        }

        populatePaintArrays(newLength        , feature         , index        , imagePositions                           ) {
            for (const property in this.binders) {
                const binder = this.binders[property];
                binder.populatePaintArray(newLength, feature, imagePositions);
            }
            if (feature.id !== undefined) {
                this._featureMap.add(+feature.id, index, this._bufferOffset, newLength);
            }
            this._bufferOffset = newLength;
        }
        setConstantPatternPositions(posTo               , posFrom               ) {
            for (const property in this.binders) {
                const binder = this.binders[property];
                binder.setConstantPatternPositions(posTo, posFrom);
            }
        }

        updatePaintArrays(featureStates               , vtLayer                 , layer                 , imagePositions                           )          {
            let dirty          = false;
            for (const id in featureStates) {
                const positions = this._featureMap.getPositions(+id);

                for (const pos of positions) {
                    const feature = vtLayer.feature(pos.index);

                    for (const property in this.binders) {
                        const binder = this.binders[property];
                        if (binder instanceof ConstantBinder || binder instanceof CrossFadedConstantBinder) continue;
                        if ((binder     ).expression.isStateDependent === true) {
                            //AHM: Remove after https://github.com/mapbox/mapbox-gl-js/issues/6255
                            const value = layer.paint.get(property);
                            (binder     ).expression = value.value;
                            binder.updatePaintArray(pos.start, pos.end, feature, featureStates[id], imagePositions);
                            dirty = true;
                        }
                    }
                }
            }
            return dirty;
        }

        defines()                {
            const result = [];
            for (const property in this.binders) {
                result.push(...this.binders[property].defines());
            }
            return result;
        }

        getPaintVertexBuffers()                      {
            return this._buffers;
        }

        getUniforms(context         , locations                  )                       {
            const uniforms = [];
            for (const property in this.binders) {
                const binder = this.binders[property];
                for (const name of binder.uniformNames) {
                    if (locations[name]) {
                        const binding = binder.getBinding(context, locations[name]);
                        uniforms.push({name, property, binding});
                    }
                }
            }
            return uniforms;
        }

        setUniforms                    (context         , binderUniforms                      , properties                               , globals                  ) {
            // Uniform state bindings are owned by the Program, but we set them
            // from within the ProgramConfiguraton's binder members.
            for (const {name, property, binding} of binderUniforms) {
                this.binders[property].setUniforms(context, binding, globals, properties.get(property), name);
            }
        }

        updatePatternPaintBuffers(crossfade                     ) {
            const buffers = [];

            for (const property in this.binders) {
                const binder = this.binders[property];
                if (binder instanceof CrossFadedCompositeBinder) {
                    const patternVertexBuffer = crossfade.fromScale === 2 ? binder.zoomInPaintVertexBuffer : binder.zoomOutPaintVertexBuffer;
                    if (patternVertexBuffer) buffers.push(patternVertexBuffer);
                } else if ((binder instanceof SourceExpressionBinder ||
                    binder instanceof CompositeExpressionBinder) &&
                    binder.paintVertexBuffer
                ) {
                    buffers.push(binder.paintVertexBuffer);
                }
            }

            this._buffers = buffers;
        }

        upload(context         ) {
            for (const property in this.binders) {
                this.binders[property].upload(context);
            }

            const buffers = [];
            for (const property in this.binders) {
                const binder = this.binders[property];
                if ((binder instanceof SourceExpressionBinder ||
                    binder instanceof CompositeExpressionBinder) &&
                    binder.paintVertexBuffer
                ) {
                    buffers.push(binder.paintVertexBuffer);
                }
            }
            this._buffers = buffers;
        }

        destroy() {
            for (const property in this.binders) {
                this.binders[property].destroy();
            }
        }
    }

    class ProgramConfigurationSet                         {
                                                                
                             

        constructor(layoutAttributes                          , layers                       , zoom        , filterProperties                      = () => true) {
            this.programConfigurations = {};
            for (const layer of layers) {
                this.programConfigurations[layer.id] = ProgramConfiguration.createDynamic(layer, zoom, filterProperties);
                this.programConfigurations[layer.id].layoutAttributes = layoutAttributes;
            }
            this.needsUpload = false;
        }

        populatePaintArrays(length        , feature         , index        , imagePositions                           ) {
            for (const key in this.programConfigurations) {
                this.programConfigurations[key].populatePaintArrays(length, feature, index, imagePositions);
            }
            this.needsUpload = true;
        }

        updatePaintArrays(featureStates               , vtLayer                 , layers                                 , imagePositions                           ) {
            for (const layer of layers) {
                this.needsUpload = this.programConfigurations[layer.id].updatePaintArrays(featureStates, vtLayer, layer, imagePositions) || this.needsUpload;
            }
        }

        get(layerId        ) {
            return this.programConfigurations[layerId];
        }

        upload(context         ) {
            if (!this.needsUpload) return;
            for (const layerId in this.programConfigurations) {
                this.programConfigurations[layerId].upload(context);
            }
            this.needsUpload = false;
        }

        destroy() {
            for (const layerId in this.programConfigurations) {
                this.programConfigurations[layerId].destroy();
            }
        }
    }

    function paintAttributeNames(property, type) {
        const attributeNameExceptions = {
            'text-opacity': ['opacity'],
            'icon-opacity': ['opacity'],
            'text-color': ['fill_color'],
            'icon-color': ['fill_color'],
            'text-halo-color': ['halo_color'],
            'icon-halo-color': ['halo_color'],
            'text-halo-blur': ['halo_blur'],
            'icon-halo-blur': ['halo_blur'],
            'text-halo-width': ['halo_width'],
            'icon-halo-width': ['halo_width'],
            'line-gap-width': ['gapwidth'],
            'line-pattern': ['pattern_to', 'pattern_from'],
            'fill-pattern': ['pattern_to', 'pattern_from'],
            'fill-extrusion-pattern': ['pattern_to', 'pattern_from'],
        };

        return attributeNameExceptions[property] ||
            [property.replace(`${type}-`, '').replace(/-/g, '_')];
    }

    function getLayoutException(property) {
        const propertyExceptions = {
            'line-pattern':{
                'source': StructArrayLayout8ui16,
                'composite': StructArrayLayout8ui16
            },
            'fill-pattern': {
                'source': StructArrayLayout8ui16,
                'composite': StructArrayLayout8ui16
            },
            'fill-extrusion-pattern':{
                'source': StructArrayLayout8ui16,
                'composite': StructArrayLayout8ui16
            }
        };

        return propertyExceptions[property];
    }

    function layoutType(property, type, binderType) {
        const defaultLayouts = {
            'color': {
                'source': StructArrayLayout2f8,
                'composite': StructArrayLayout4f16
            },
            'number': {
                'source': StructArrayLayout1f4,
                'composite': StructArrayLayout2f8
            }
        };

        const layoutException = getLayoutException(property);
        return  layoutException && layoutException[binderType] ||
            defaultLayouts[type][binderType];
    }

    register('ConstantBinder', ConstantBinder);
    register('CrossFadedConstantBinder', CrossFadedConstantBinder);
    register('SourceExpressionBinder', SourceExpressionBinder);
    register('CrossFadedCompositeBinder', CrossFadedCompositeBinder);
    register('CompositeExpressionBinder', CompositeExpressionBinder);
    register('ProgramConfiguration', ProgramConfiguration, {omit: ['_buffers']});
    register('ProgramConfigurationSet', ProgramConfigurationSet);

    //      

    function transformText(text        , layer                  , feature         ) {
        const transform = layer.layout.get('text-transform').evaluate(feature, {});
        if (transform === 'uppercase') {
            text = text.toLocaleUpperCase();
        } else if (transform === 'lowercase') {
            text = text.toLocaleLowerCase();
        }

        return text;
    }


    function transformText$1(text           , layer                  , feature         )            {
        text.sections.forEach(section => {
            section.text = transformText(section.text, layer, feature);
        });
        return text;
    }

    //      

                                                                    

    function mergeLines (features                      )                       {
        const leftIndex                     = {};
        const rightIndex                     = {};
        const mergedFeatures = [];
        let mergedIndex = 0;

        function add(k) {
            mergedFeatures.push(features[k]);
            mergedIndex++;
        }

        function mergeFromRight(leftKey        , rightKey        , geom) {
            const i = rightIndex[leftKey];
            delete rightIndex[leftKey];
            rightIndex[rightKey] = i;

            mergedFeatures[i].geometry[0].pop();
            mergedFeatures[i].geometry[0] = mergedFeatures[i].geometry[0].concat(geom[0]);
            return i;
        }

        function mergeFromLeft(leftKey        , rightKey        , geom) {
            const i = leftIndex[rightKey];
            delete leftIndex[rightKey];
            leftIndex[leftKey] = i;

            mergedFeatures[i].geometry[0].shift();
            mergedFeatures[i].geometry[0] = geom[0].concat(mergedFeatures[i].geometry[0]);
            return i;
        }

        function getKey(text, geom, onRight) {
            const point = onRight ? geom[0][geom[0].length - 1] : geom[0][0];
            return `${text}:${point.x}:${point.y}`;
        }

        for (let k = 0; k < features.length; k++) {
            const feature = features[k];
            const geom = feature.geometry;
            const text = feature.text ? feature.text.toString() : null;

            if (!text) {
                add(k);
                continue;
            }

            const leftKey = getKey(text, geom),
                rightKey = getKey(text, geom, true);

            if ((leftKey in rightIndex) && (rightKey in leftIndex) && (rightIndex[leftKey] !== leftIndex[rightKey])) {
                // found lines with the same text adjacent to both ends of the current line, merge all three
                const j = mergeFromLeft(leftKey, rightKey, geom);
                const i = mergeFromRight(leftKey, rightKey, mergedFeatures[j].geometry);

                delete leftIndex[leftKey];
                delete rightIndex[rightKey];

                rightIndex[getKey(text, mergedFeatures[i].geometry, true)] = i;
                mergedFeatures[j].geometry = (null     );

            } else if (leftKey in rightIndex) {
                // found mergeable line adjacent to the start of the current line, merge
                mergeFromRight(leftKey, rightKey, geom);

            } else if (rightKey in leftIndex) {
                // found mergeable line adjacent to the end of the current line, merge
                mergeFromLeft(leftKey, rightKey, geom);

            } else {
                // no adjacent lines, add as a new item
                add(k);
                leftIndex[leftKey] = mergedIndex - 1;
                rightIndex[rightKey] = mergedIndex - 1;
            }
        }

        return mergedFeatures.filter((f) => f.geometry);
    }

    //      

    const verticalizedCharacterMap = {
        '!': '︕',
        '#': '＃',
        '$': '＄',
        '%': '％',
        '&': '＆',
        '(': '︵',
        ')': '︶',
        '*': '＊',
        '+': '＋',
        ',': '︐',
        '-': '︲',
        '.': '・',
        '/': '／',
        ':': '︓',
        ';': '︔',
        '<': '︿',
        '=': '＝',
        '>': '﹀',
        '?': '︖',
        '@': '＠',
        '[': '﹇',
        '\\': '＼',
        ']': '﹈',
        '^': '＾',
        '_': '︳',
        '`': '｀',
        '{': '︷',
        '|': '―',
        '}': '︸',
        '~': '～',
        '¢': '￠',
        '£': '￡',
        '¥': '￥',
        '¦': '￤',
        '¬': '￢',
        '¯': '￣',
        '–': '︲',
        '—': '︱',
        '‘': '﹃',
        '’': '﹄',
        '“': '﹁',
        '”': '﹂',
        '…': '︙',
        '‧': '・',
        '₩': '￦',
        '、': '︑',
        '。': '︒',
        '〈': '︿',
        '〉': '﹀',
        '《': '︽',
        '》': '︾',
        '「': '﹁',
        '」': '﹂',
        '『': '﹃',
        '』': '﹄',
        '【': '︻',
        '】': '︼',
        '〔': '︹',
        '〕': '︺',
        '〖': '︗',
        '〗': '︘',
        '！': '︕',
        '（': '︵',
        '）': '︶',
        '，': '︐',
        '－': '︲',
        '．': '・',
        '：': '︓',
        '；': '︔',
        '＜': '︿',
        '＞': '﹀',
        '？': '︖',
        '［': '﹇',
        '］': '﹈',
        '＿': '︳',
        '｛': '︷',
        '｜': '―',
        '｝': '︸',
        '｟': '︵',
        '｠': '︶',
        '｡': '︒',
        '｢': '﹁',
        '｣': '﹂'
    };

    //      

    class Anchor extends pointGeometry {
                   
                               

        constructor(x        , y        , angle        , segment         ) {
            super(x, y);
            this.angle = angle;
            if (segment !== undefined) {
                this.segment = segment;
            }
        }

        clone() {
            return new Anchor(this.x, this.y, this.angle, this.segment);
        }
    }

    register('Anchor', Anchor);

    //      

                            
                                 
                          
         
                              
         
                               
                           
                                              
                                              
                                                         
         
                                  
                                              
                                                         
      

    // For {text,icon}-size, get the bucket-level data that will be needed by
    // the painter to set symbol-size-related uniforms
    function getSizeData(tileZoom        , value                                                               )           {
        const {expression} = value;
        if (expression.kind === 'constant') {
            return {
                functionType: 'constant',
                layoutSize: expression.evaluate(new EvaluationParameters(tileZoom + 1))
            };
        } else if (expression.kind === 'source') {
            return {
                functionType: 'source'
            };
        } else {
            // calculate covering zoom stops for zoom-dependent values
            const levels = expression.zoomStops;

            let lower = 0;
            while (lower < levels.length && levels[lower] <= tileZoom) lower++;
            lower = Math.max(0, lower - 1);
            let upper = lower;
            while (upper < levels.length && levels[upper] < tileZoom + 1) upper++;
            upper = Math.min(levels.length - 1, upper);

            const zoomRange = {
                min: levels[lower],
                max: levels[upper]
            };

            // We'd like to be able to use CameraExpression or CompositeExpression in these
            // return types rather than ExpressionSpecification, but the former are not
            // transferrable across Web Worker boundaries.
            if (expression.kind === 'composite') {
                return {
                    functionType: 'composite',
                    zoomRange,
                    propertyValue: (value.value     )
                };
            } else {
                // for camera functions, also save off the function values
                // evaluated at the covering zoom levels
                return {
                    functionType: 'camera',
                    layoutSize: expression.evaluate(new EvaluationParameters(tileZoom + 1)),
                    zoomRange,
                    sizeRange: {
                        min: expression.evaluate(new EvaluationParameters(zoomRange.min)),
                        max: expression.evaluate(new EvaluationParameters(zoomRange.max))
                    },
                    propertyValue: (value.value     )
                };
            }
        }
    }

    //      
    const vectorTileFeatureTypes = vectorTile.VectorTileFeature.types;


                 
               
                         
                       
                          
                       
                                                                                        
                                                                                  
                                                                                   
                                                
                                                         
                                                           
                                                       
                                                           
                                                                 
                                                                

                                      
                   
                   
                   
                   
                             
                             
      

                                   
                                     
                                     
                                    
                                  
                                  
      

                                  
                               
                               
                            
                      
                                 
                                      
                           
                                                 
                
       

    // Opacity arrays are frequently updated but don't contain a lot of information, so we pack them
    // tight. Each Uint32 is actually four duplicate Uint8s for the four corners of a glyph
    // 7 bits are for the current opacity, and the lowest bit is the target opacity

    // actually defined in symbol_attributes.js
    // const placementOpacityAttributes = [
    //     { name: 'a_fade_opacity', components: 1, type: 'Uint32' }
    // ];
    const shaderOpacityAttributes = [
        { name: 'a_fade_opacity', components: 1, type: 'Uint8', offset: 0 }
    ];

    function addVertex(array, anchorX, anchorY, ox, oy, tx, ty, sizeVertex) {
        array.emplaceBack(
            // a_pos_offset
            anchorX,
            anchorY,
            Math.round(ox * 32),
            Math.round(oy * 32),

            // a_data
            tx, // x coordinate of symbol on glyph atlas texture
            ty, // y coordinate of symbol on glyph atlas texture
            sizeVertex ? sizeVertex[0] : 0,
            sizeVertex ? sizeVertex[1] : 0
        );
    }

    function addDynamicAttributes(dynamicLayoutVertexArray             , p       , angle        ) {
        dynamicLayoutVertexArray.emplaceBack(p.x, p.y, angle);
        dynamicLayoutVertexArray.emplaceBack(p.x, p.y, angle);
        dynamicLayoutVertexArray.emplaceBack(p.x, p.y, angle);
        dynamicLayoutVertexArray.emplaceBack(p.x, p.y, angle);
    }

    class SymbolBuffers {
                                             
                                         

                                       
                                 

                                                                         
                                

                                                           
                                                

                                               
                                          

                                                   
                                            

                                             

        constructor(programConfigurations                                           ) {
            this.layoutVertexArray = new StructArrayLayout4i4ui16();
            this.indexArray = new StructArrayLayout3ui6();
            this.programConfigurations = programConfigurations;
            this.segments = new SegmentVector();
            this.dynamicLayoutVertexArray = new StructArrayLayout3f12();
            this.opacityVertexArray = new StructArrayLayout1ul4();
            this.placedSymbolArray = new PlacedSymbolArray();
        }

        upload(context         , dynamicIndexBuffer         , upload          , update          ) {
            if (upload) {
                this.layoutVertexBuffer = context.createVertexBuffer(this.layoutVertexArray, symbolLayoutAttributes.members);
                this.indexBuffer = context.createIndexBuffer(this.indexArray, dynamicIndexBuffer);
                this.dynamicLayoutVertexBuffer = context.createVertexBuffer(this.dynamicLayoutVertexArray, dynamicLayoutAttributes.members, true);
                this.opacityVertexBuffer = context.createVertexBuffer(this.opacityVertexArray, shaderOpacityAttributes, true);
                // This is a performance hack so that we can write to opacityVertexArray with uint32s
                // even though the shaders read uint8s
                this.opacityVertexBuffer.itemSize = 1;
            }
            if (upload || update) {
                this.programConfigurations.upload(context);
            }
        }

        destroy() {
            if (!this.layoutVertexBuffer) return;
            this.layoutVertexBuffer.destroy();
            this.indexBuffer.destroy();
            this.programConfigurations.destroy();
            this.segments.destroy();
            this.dynamicLayoutVertexBuffer.destroy();
            this.opacityVertexBuffer.destroy();
        }
    }

    register('SymbolBuffers', SymbolBuffers);

    class CollisionBuffers {
                                       
                                                   
                                         

                                                        
                                 

                                

                                                   
                                            

        constructor(LayoutArray                    ,
                    layoutAttributes                          ,
                    IndexArray                                            ) {
            this.layoutVertexArray = new LayoutArray();
            this.layoutAttributes = layoutAttributes;
            this.indexArray = new IndexArray();
            this.segments = new SegmentVector();
            this.collisionVertexArray = new StructArrayLayout2ub2f12();
        }

        upload(context         ) {
            this.layoutVertexBuffer = context.createVertexBuffer(this.layoutVertexArray, this.layoutAttributes);
            this.indexBuffer = context.createIndexBuffer(this.indexArray);
            this.collisionVertexBuffer = context.createVertexBuffer(this.collisionVertexArray, collisionVertexAttributes.members, true);
        }

        destroy() {
            if (!this.layoutVertexBuffer) return;
            this.layoutVertexBuffer.destroy();
            this.indexBuffer.destroy();
            this.segments.destroy();
            this.collisionVertexBuffer.destroy();
        }
    }

    register('CollisionBuffers', CollisionBuffers);

    /**
     * Unlike other buckets, which simply implement #addFeature with type-specific
     * logic for (essentially) triangulating feature geometries, SymbolBucket
     * requires specialized behavior:
     *
     * 1. WorkerTile#parse(), the logical owner of the bucket creation process,
     *    calls SymbolBucket#populate(), which resolves text and icon tokens on
     *    each feature, adds each glyphs and symbols needed to the passed-in
     *    collections options.glyphDependencies and options.iconDependencies, and
     *    stores the feature data for use in subsequent step (this.features).
     *
     * 2. WorkerTile asynchronously requests from the main thread all of the glyphs
     *    and icons needed (by this bucket and any others). When glyphs and icons
     *    have been received, the WorkerTile creates a CollisionIndex and invokes:
     *
     * 3. performSymbolLayout(bucket, stacks, icons) perform texts shaping and
     *    layout on a Symbol Bucket. This step populates:
     *      `this.symbolInstances`: metadata on generated symbols
     *      `this.collisionBoxArray`: collision data for use by foreground
     *      `this.text`: SymbolBuffers for text symbols
     *      `this.icons`: SymbolBuffers for icons
     *      `this.collisionBox`: Debug SymbolBuffers for collision boxes
     *      `this.collisionCircle`: Debug SymbolBuffers for collision circles
     *    The results are sent to the foreground for rendering
     *
     * 4. performSymbolPlacement(bucket, collisionIndex) is run on the foreground,
     *    and uses the CollisionIndex along with current camera settings to determine
     *    which symbols can actually show on the map. Collided symbols are hidden
     *    using a dynamic "OpacityVertexArray".
     *
     * @private
     */
    class SymbolBucket                   {
                                  
                                                                 

                                             
                     
                            
                                        
                                
                                                      
                                              

                      
                          
                                 
                                 
                              
                            

                               
                               

                                           
                                               
                                       
                                             
                                                
                           
                               
                                              
                              
                                   
                                 
                            
                                        

                            
                            
                                       
                                          
                          
                                 
                         

        constructor(options                                    ) {
            this.collisionBoxArray = options.collisionBoxArray;
            this.zoom = options.zoom;
            this.overscaling = options.overscaling;
            this.layers = options.layers;
            this.layerIds = this.layers.map(layer => layer.id);
            this.index = options.index;
            this.pixelRatio = options.pixelRatio;
            this.sourceLayerIndex = options.sourceLayerIndex;
            this.hasPattern = false;

            const layer = this.layers[0];
            const unevaluatedLayoutValues = layer._unevaluatedLayout._values;

            this.textSizeData = getSizeData(this.zoom, unevaluatedLayoutValues['text-size']);
            this.iconSizeData = getSizeData(this.zoom, unevaluatedLayoutValues['icon-size']);

            const layout = this.layers[0].layout;
            const sortKey = layout.get('symbol-sort-key');
            const zOrder = layout.get('symbol-z-order');
            this.sortFeaturesByKey = zOrder !== 'viewport-y' && sortKey.constantOr(1) !== undefined;
            const zOrderByViewportY = zOrder === 'viewport-y' || (zOrder === 'auto' && !this.sortFeaturesByKey);
            this.sortFeaturesByY = zOrderByViewportY && (layout.get('text-allow-overlap') || layout.get('icon-allow-overlap') ||
                layout.get('text-ignore-placement') || layout.get('icon-ignore-placement'));

            this.stateDependentLayerIds = this.layers.filter((l) => l.isStateDependent()).map((l) => l.id);

            this.sourceID = options.sourceID;
        }

        createArrays() {
            this.text = new SymbolBuffers(new ProgramConfigurationSet(symbolLayoutAttributes.members, this.layers, this.zoom, property => /^text/.test(property)));
            this.icon = new SymbolBuffers(new ProgramConfigurationSet(symbolLayoutAttributes.members, this.layers, this.zoom, property => /^icon/.test(property)));

            this.collisionBox = new CollisionBuffers(StructArrayLayout2i2i2i12, collisionBoxLayout.members, StructArrayLayout2ui4);
            this.collisionCircle = new CollisionBuffers(StructArrayLayout2i2i2i12, collisionCircleLayout.members, StructArrayLayout3ui6);

            this.glyphOffsetArray = new GlyphOffsetArray();
            this.lineVertexArray = new SymbolLineVertexArray();
            this.symbolInstances = new SymbolInstanceArray();
        }

        calculateGlyphDependencies(text        , stack                     , textAlongLine         , doesAllowVerticalWritingMode         ) {
            for (let i = 0; i < text.length; i++) {
                stack[text.charCodeAt(i)] = true;
                if (textAlongLine && doesAllowVerticalWritingMode) {
                    const verticalChar = verticalizedCharacterMap[text.charAt(i)];
                    if (verticalChar) {
                        stack[verticalChar.charCodeAt(0)] = true;
                    }
                }
            }
        }

        populate(features                       , options                    ) {
            const layer = this.layers[0];
            const layout = layer.layout;

            const textFont = layout.get('text-font');
            const textField = layout.get('text-field');
            const iconImage = layout.get('icon-image');
            const hasText =
                (textField.value.kind !== 'constant' || textField.value.value.toString().length > 0) &&
                (textFont.value.kind !== 'constant' || textFont.value.value.length > 0);
            const hasIcon = iconImage.value.kind !== 'constant' || iconImage.value.value && iconImage.value.value.length > 0;
            const symbolSortKey = layout.get('symbol-sort-key');

            this.features = [];

            if (!hasText && !hasIcon) {
                return;
            }

            const icons = options.iconDependencies;
            const stacks = options.glyphDependencies;
            const globalProperties = new EvaluationParameters(this.zoom);

            for (const {feature, index, sourceLayerIndex} of features) {
                if (!layer._featureFilter(globalProperties, feature)) {
                    continue;
                }

                let text                  ;
                if (hasText) {
                    // Expression evaluation will automatically coerce to Formatted
                    // but plain string token evaluation skips that pathway so do the
                    // conversion here.
                    const resolvedTokens = layer.getValueAndResolveTokens('text-field', feature);
                    text = transformText$1(resolvedTokens instanceof Formatted ?
                        resolvedTokens :
                        Formatted.fromString(resolvedTokens),
                        layer, feature);
                }

                let icon;
                if (hasIcon) {
                    icon = layer.getValueAndResolveTokens('icon-image', feature);
                }

                if (!text && !icon) {
                    continue;
                }

                const sortKey = this.sortFeaturesByKey ?
                    symbolSortKey.evaluate(feature, {}) :
                    undefined;

                const symbolFeature                = {
                    text,
                    icon,
                    index,
                    sourceLayerIndex,
                    geometry: loadGeometry(feature),
                    properties: feature.properties,
                    type: vectorTileFeatureTypes[feature.type],
                    sortKey
                };
                if (typeof feature.id !== 'undefined') {
                    symbolFeature.id = feature.id;
                }
                this.features.push(symbolFeature);

                if (icon) {
                    icons[icon] = true;
                }

                if (text) {
                    const fontStack = textFont.evaluate(feature, {}).join(',');
                    const textAlongLine = layout.get('text-rotation-alignment') === 'map' && layout.get('symbol-placement') !== 'point';
                    for (const section of text.sections) {
                        const doesAllowVerticalWritingMode = allowsVerticalWritingMode(text.toString());
                        const sectionFont = section.fontStack || fontStack;
                        const sectionStack = stacks[sectionFont] = stacks[sectionFont] || {};
                        this.calculateGlyphDependencies(section.text, sectionStack, textAlongLine, doesAllowVerticalWritingMode);
                    }
                }
            }

            if (layout.get('symbol-placement') === 'line') {
                // Merge adjacent lines with the same text to improve labelling.
                // It's better to place labels on one long line than on many short segments.
                this.features = mergeLines(this.features);
            }

            if (this.sortFeaturesByKey) {
                this.features.sort((a, b) => {
                    // a.sortKey is always a number when sortFeaturesByKey is true
                    return ((a.sortKey     )        ) - ((b.sortKey     )        );
                });
            }
        }

        update(states               , vtLayer                 , imagePositions                           ) {
            if (!this.stateDependentLayers.length) return;
            this.text.programConfigurations.updatePaintArrays(states, vtLayer, this.layers, imagePositions);
            this.icon.programConfigurations.updatePaintArrays(states, vtLayer, this.layers, imagePositions);
        }

        isEmpty() {
            return this.symbolInstances.length === 0;
        }

        uploadPending() {
            return !this.uploaded || this.text.programConfigurations.needsUpload || this.icon.programConfigurations.needsUpload;
        }

        upload(context         ) {
            if (!this.uploaded) {
                this.collisionBox.upload(context);
                this.collisionCircle.upload(context);
            }
            this.text.upload(context, this.sortFeaturesByY, !this.uploaded, this.text.programConfigurations.needsUpload);
            this.icon.upload(context, this.sortFeaturesByY, !this.uploaded, this.icon.programConfigurations.needsUpload);
            this.uploaded = true;
        }

        destroy() {
            this.text.destroy();
            this.icon.destroy();
            this.collisionBox.destroy();
            this.collisionCircle.destroy();
        }

        addToLineVertexArray(anchor        , line     ) {
            const lineStartIndex = this.lineVertexArray.length;
            if (anchor.segment !== undefined) {
                let sumForwardLength = anchor.dist(line[anchor.segment + 1]);
                let sumBackwardLength = anchor.dist(line[anchor.segment]);
                const vertices = {};
                for (let i = anchor.segment + 1; i < line.length; i++) {
                    vertices[i] = { x: line[i].x, y: line[i].y, tileUnitDistanceFromAnchor: sumForwardLength };
                    if (i < line.length - 1) {
                        sumForwardLength += line[i + 1].dist(line[i]);
                    }
                }
                for (let i = anchor.segment || 0; i >= 0; i--) {
                    vertices[i] = { x: line[i].x, y: line[i].y, tileUnitDistanceFromAnchor: sumBackwardLength };
                    if (i > 0) {
                        sumBackwardLength += line[i - 1].dist(line[i]);
                    }
                }
                for (let i = 0; i < line.length; i++) {
                    const vertex = vertices[i];
                    this.lineVertexArray.emplaceBack(vertex.x, vertex.y, vertex.tileUnitDistanceFromAnchor);
                }
            }
            return {
                lineStartIndex,
                lineLength: this.lineVertexArray.length - lineStartIndex
            };
        }

        addSymbols(arrays               ,
                   quads                   ,
                   sizeVertex     ,
                   lineOffset                  ,
                   alongLine         ,
                   feature               ,
                   writingMode     ,
                   labelAnchor        ,
                   lineStartIndex        ,
                   lineLength        ) {
            const indexArray = arrays.indexArray;
            const layoutVertexArray = arrays.layoutVertexArray;
            const dynamicLayoutVertexArray = arrays.dynamicLayoutVertexArray;

            const segment = arrays.segments.prepareSegment(4 * quads.length, arrays.layoutVertexArray, arrays.indexArray, feature.sortKey);
            const glyphOffsetArrayStart = this.glyphOffsetArray.length;
            const vertexStartIndex = segment.vertexLength;

            for (const symbol of quads) {

                const tl = symbol.tl,
                    tr = symbol.tr,
                    bl = symbol.bl,
                    br = symbol.br,
                    tex = symbol.tex;

                const index = segment.vertexLength;

                const y = symbol.glyphOffset[1];
                addVertex(layoutVertexArray, labelAnchor.x, labelAnchor.y, tl.x, y + tl.y, tex.x, tex.y, sizeVertex);
                addVertex(layoutVertexArray, labelAnchor.x, labelAnchor.y, tr.x, y + tr.y, tex.x + tex.w, tex.y, sizeVertex);
                addVertex(layoutVertexArray, labelAnchor.x, labelAnchor.y, bl.x, y + bl.y, tex.x, tex.y + tex.h, sizeVertex);
                addVertex(layoutVertexArray, labelAnchor.x, labelAnchor.y, br.x, y + br.y, tex.x + tex.w, tex.y + tex.h, sizeVertex);

                addDynamicAttributes(dynamicLayoutVertexArray, labelAnchor, 0);

                indexArray.emplaceBack(index, index + 1, index + 2);
                indexArray.emplaceBack(index + 1, index + 2, index + 3);

                segment.vertexLength += 4;
                segment.primitiveLength += 2;

                this.glyphOffsetArray.emplaceBack(symbol.glyphOffset[0]);
            }

            arrays.placedSymbolArray.emplaceBack(labelAnchor.x, labelAnchor.y,
                glyphOffsetArrayStart, this.glyphOffsetArray.length - glyphOffsetArrayStart, vertexStartIndex,
                lineStartIndex, lineLength, (labelAnchor.segment     ),
                sizeVertex ? sizeVertex[0] : 0, sizeVertex ? sizeVertex[1] : 0,
                lineOffset[0], lineOffset[1],
                writingMode, (false     ),
                // The crossTileID is only filled/used on the foreground for dynamic text anchors
                0);

            arrays.programConfigurations.populatePaintArrays(arrays.layoutVertexArray.length, feature, feature.index, {});
        }

        _addCollisionDebugVertex(layoutVertexArray             , collisionVertexArray             , point       , anchorX        , anchorY        , extrude       ) {
            collisionVertexArray.emplaceBack(0, 0);
            return layoutVertexArray.emplaceBack(
                // pos
                point.x,
                point.y,
                // a_anchor_pos
                anchorX,
                anchorY,
                // extrude
                Math.round(extrude.x),
                Math.round(extrude.y));
        }


        addCollisionDebugVertices(x1        , y1        , x2        , y2        , arrays                  , boxAnchorPoint       , symbolInstance                , isCircle         ) {
            const segment = arrays.segments.prepareSegment(4, arrays.layoutVertexArray, arrays.indexArray);
            const index = segment.vertexLength;

            const layoutVertexArray = arrays.layoutVertexArray;
            const collisionVertexArray = arrays.collisionVertexArray;

            const anchorX = symbolInstance.anchorX;
            const anchorY = symbolInstance.anchorY;

            this._addCollisionDebugVertex(layoutVertexArray, collisionVertexArray, boxAnchorPoint, anchorX, anchorY, new pointGeometry(x1, y1));
            this._addCollisionDebugVertex(layoutVertexArray, collisionVertexArray, boxAnchorPoint, anchorX, anchorY, new pointGeometry(x2, y1));
            this._addCollisionDebugVertex(layoutVertexArray, collisionVertexArray, boxAnchorPoint, anchorX, anchorY, new pointGeometry(x2, y2));
            this._addCollisionDebugVertex(layoutVertexArray, collisionVertexArray, boxAnchorPoint, anchorX, anchorY, new pointGeometry(x1, y2));

            segment.vertexLength += 4;
            if (isCircle) {
                const indexArray                     = (arrays.indexArray     );
                indexArray.emplaceBack(index, index + 1, index + 2);
                indexArray.emplaceBack(index, index + 2, index + 3);

                segment.primitiveLength += 2;
            } else {
                const indexArray                 = (arrays.indexArray     );
                indexArray.emplaceBack(index, index + 1);
                indexArray.emplaceBack(index + 1, index + 2);
                indexArray.emplaceBack(index + 2, index + 3);
                indexArray.emplaceBack(index + 3, index);

                segment.primitiveLength += 4;
            }
        }

        addDebugCollisionBoxes(startIndex        , endIndex        , symbolInstance                ) {
            for (let b = startIndex; b < endIndex; b++) {
                const box               = (this.collisionBoxArray.get(b)     );
                const x1 = box.x1;
                const y1 = box.y1;
                const x2 = box.x2;
                const y2 = box.y2;

                // If the radius > 0, this collision box is actually a circle
                // The data we add to the buffers is exactly the same, but we'll render with a different shader.
                const isCircle = box.radius > 0;
                this.addCollisionDebugVertices(x1, y1, x2, y2, isCircle ? this.collisionCircle : this.collisionBox, box.anchorPoint, symbolInstance, isCircle);
            }
        }

        generateCollisionDebugBuffers() {
            for (let i = 0; i < this.symbolInstances.length; i++) {
                const symbolInstance = this.symbolInstances.get(i);
                this.addDebugCollisionBoxes(symbolInstance.textBoxStartIndex, symbolInstance.textBoxEndIndex, symbolInstance);
                this.addDebugCollisionBoxes(symbolInstance.iconBoxStartIndex, symbolInstance.iconBoxEndIndex, symbolInstance);
            }
        }

        // These flat arrays are meant to be quicker to iterate over than the source
        // CollisionBoxArray
        _deserializeCollisionBoxesForSymbol(collisionBoxArray                   , textStartIndex        , textEndIndex        , iconStartIndex        , iconEndIndex        )                  {
            const collisionArrays = {};
            for (let k = textStartIndex; k < textEndIndex; k++) {
                const box               = (collisionBoxArray.get(k)     );
                if (box.radius === 0) {
                    collisionArrays.textBox = { x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2, anchorPointX: box.anchorPointX, anchorPointY: box.anchorPointY };
                    collisionArrays.textFeatureIndex = box.featureIndex;
                    break; // Only one box allowed per instance
                } else {
                    if (!collisionArrays.textCircles) {
                        collisionArrays.textCircles = [];
                        collisionArrays.textFeatureIndex = box.featureIndex;
                    }
                    const used = 1; // May be updated at collision detection time
                    collisionArrays.textCircles.push(box.anchorPointX, box.anchorPointY, box.radius, box.signedDistanceFromAnchor, used);
                }
            }
            for (let k = iconStartIndex; k < iconEndIndex; k++) {
                // An icon can only have one box now, so this indexing is a bit vestigial...
                const box               = (collisionBoxArray.get(k)     );
                if (box.radius === 0) {
                    collisionArrays.iconBox = { x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2, anchorPointX: box.anchorPointX, anchorPointY: box.anchorPointY };
                    collisionArrays.iconFeatureIndex = box.featureIndex;
                    break; // Only one box allowed per instance
                }
            }
            return collisionArrays;
        }

        deserializeCollisionBoxes(collisionBoxArray                   ) {
            this.collisionArrays = [];
            for (let i = 0; i < this.symbolInstances.length; i++) {
                const symbolInstance = this.symbolInstances.get(i);
                this.collisionArrays.push(this._deserializeCollisionBoxesForSymbol(
                    collisionBoxArray,
                    symbolInstance.textBoxStartIndex,
                    symbolInstance.textBoxEndIndex,
                    symbolInstance.iconBoxStartIndex,
                    symbolInstance.iconBoxEndIndex
                ));
            }
        }

        hasTextData() {
            return this.text.segments.get().length > 0;
        }

        hasIconData() {
            return this.icon.segments.get().length > 0;
        }

        hasCollisionBoxData() {
            return this.collisionBox.segments.get().length > 0;
        }

        hasCollisionCircleData() {
            return this.collisionCircle.segments.get().length > 0;
        }

        addIndicesForPlacedTextSymbol(placedTextSymbolIndex        ) {
            const placedSymbol = this.text.placedSymbolArray.get(placedTextSymbolIndex);

            const endIndex = placedSymbol.vertexStartIndex + placedSymbol.numGlyphs * 4;
            for (let vertexIndex = placedSymbol.vertexStartIndex; vertexIndex < endIndex; vertexIndex += 4) {
                this.text.indexArray.emplaceBack(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                this.text.indexArray.emplaceBack(vertexIndex + 1, vertexIndex + 2, vertexIndex + 3);
            }
        }

        sortFeatures(angle        ) {
            if (!this.sortFeaturesByY) return;

            if (this.sortedAngle === angle) return;
            this.sortedAngle = angle;

            // The current approach to sorting doesn't sort across segments so don't try.
            // Sorting within segments separately seemed not to be worth the complexity.
            if (this.text.segments.get().length > 1 || this.icon.segments.get().length > 1) return;

            // If the symbols are allowed to overlap sort them by their vertical screen position.
            // The index array buffer is rewritten to reference the (unchanged) vertices in the
            // sorted order.

            // To avoid sorting the actual symbolInstance array we sort an array of indexes.
            const symbolInstanceIndexes = [];
            for (let i = 0; i < this.symbolInstances.length; i++) {
                symbolInstanceIndexes.push(i);
            }

            const sin = Math.sin(angle),
                cos = Math.cos(angle);

            const rotatedYs = [];
            const featureIndexes = [];
            for (let i = 0; i < this.symbolInstances.length; i++) {
                const symbolInstance = this.symbolInstances.get(i);
                rotatedYs.push(Math.round(sin * symbolInstance.anchorX + cos * symbolInstance.anchorY) | 0);
                featureIndexes.push(symbolInstance.featureIndex);
            }

            symbolInstanceIndexes.sort((aIndex, bIndex) => {
                return (rotatedYs[aIndex] - rotatedYs[bIndex]) ||
                       (featureIndexes[bIndex] - featureIndexes[aIndex]);
            });

            this.text.indexArray.clear();
            this.icon.indexArray.clear();

            this.featureSortOrder = [];

            for (const i of symbolInstanceIndexes) {
                const symbolInstance = this.symbolInstances.get(i);
                this.featureSortOrder.push(symbolInstance.featureIndex);

                [
                    symbolInstance.rightJustifiedTextSymbolIndex,
                    symbolInstance.centerJustifiedTextSymbolIndex,
                    symbolInstance.leftJustifiedTextSymbolIndex
                ].forEach((index, i, array) => {
                    // Only add a given index the first time it shows up,
                    // to avoid duplicate opacity entries when multiple justifications
                    // share the same glyphs.
                    if (index >= 0 && array.indexOf(index) === i) {
                        this.addIndicesForPlacedTextSymbol(index);
                    }
                });

                if (symbolInstance.verticalPlacedTextSymbolIndex >= 0) {
                    this.addIndicesForPlacedTextSymbol(symbolInstance.verticalPlacedTextSymbolIndex);
                }

                const placedIcon = this.icon.placedSymbolArray.get(i);
                if (placedIcon.numGlyphs) {
                    const vertexIndex = placedIcon.vertexStartIndex;
                    this.icon.indexArray.emplaceBack(vertexIndex, vertexIndex + 1, vertexIndex + 2);
                    this.icon.indexArray.emplaceBack(vertexIndex + 1, vertexIndex + 2, vertexIndex + 3);
                }
            }

            if (this.text.indexBuffer) this.text.indexBuffer.updateData(this.text.indexArray);
            if (this.icon.indexBuffer) this.icon.indexBuffer.updateData(this.icon.indexArray);
        }
    }

    register('SymbolBucket', SymbolBucket, {
        omit: ['layers', 'collisionBoxArray', 'features', 'compareText']
    });

    // this constant is based on the size of StructArray indexes used in a symbol
    // bucket--namely, glyphOffsetArrayStart
    // eg the max valid UInt16 is 65,535
    // See https://github.com/mapbox/mapbox-gl-js/issues/2907 for motivation
    // lineStartIndex and textBoxStartIndex could potentially be concerns
    // but we expect there to be many fewer boxes/lines than glyphs
    SymbolBucket.MAX_GLYPHS = 65535;

    SymbolBucket.addDynamicAttributes = addDynamicAttributes;

    //      

    var rasterBoundsAttributes = createLayout([
        { name: 'a_pos', type: 'Int16', components: 2 },
        { name: 'a_texture_pos', type: 'Int16', components: 2 }
    ]);

    //      
    const { HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData: ImageData$1 } = self;

                                             
                                                             

                               
                                                      
                                                        
                               
                                                        
                                                                       
                                                          
                             
                                                        
                                                               
                                                                  

                       
                      
                       
                  
     

                              
                   
                    
                          
                           
                          
                   
                     

    class Texture {
                         
                               
                              
                              
                               
                           
                           

        constructor(context         , image              , format               , options                                                 ) {
            this.context = context;
            this.format = format;
            this.texture = context.gl.createTexture();
            this.update(image, options);
        }

        update(image              , options                                               , position                           ) {
            const {width, height} = image;
            const resize = (!this.size || this.size[0] !== width || this.size[1] !== height) && !position;
            const {context} = this;
            const {gl} = context;

            this.useMipmap = Boolean(options && options.useMipmap);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            context.pixelStoreUnpackFlipY.set(false);
            context.pixelStoreUnpack.set(1);
            context.pixelStoreUnpackPremultiplyAlpha.set(this.format === gl.RGBA && (!options || options.premultiply !== false));

            if (resize) {
                this.size = [width, height];

                if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof HTMLVideoElement || image instanceof ImageData$1) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.format, gl.UNSIGNED_BYTE, image);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, gl.UNSIGNED_BYTE, image.data);
                }

            } else {
                const {x, y} = position || { x: 0, y: 0};
                if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof HTMLVideoElement || image instanceof ImageData$1) {
                    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, image);
                } else {
                    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, image.data);
                }
            }

            if (this.useMipmap && this.isSizePowerOfTwo()) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        }

        bind(filter               , wrap             , minFilter                ) {
            const {context} = this;
            const {gl} = context;
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            if (minFilter === gl.LINEAR_MIPMAP_NEAREST && !this.isSizePowerOfTwo()) {
                minFilter = gl.LINEAR;
            }

            if (filter !== this.filter) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter || filter);
                this.filter = filter;
            }

            if (wrap !== this.wrap) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
                this.wrap = wrap;
            }
        }

        isSizePowerOfTwo() {
            return this.size[0] === this.size[1] && (Math.log(this.size[0]) / Math.LN2) % 1 === 0;
        }

        destroy() {
            const {gl} = this.context;
            gl.deleteTexture(this.texture);
            this.texture = (null     );
        }
    }

    //      

    const CLOCK_SKEW_RETRY_TIMEOUT = 30000;

                                               
                                                       
                                                          
                                                
                                                  
                                                        
                                                            
                                                
                                             
                                                      
                                                        
                                                    
                                                     
                                                                                        
                                                  
                                                           
                                                        
                                                                 

                           
                                                                
                                                                         
                                                                                              
                                                    
                                                                      
                      /* Tile data was previously loaded, but has expired per its
                       * HTTP headers and is in the process of refreshing. */

    /**
     * A tile object is the combination of a Coordinate, which defines
     * its place, as well as a unique ID and data tracking for its content
     *
     * @private
     */
    class Tile {
                                 
                    
                     
                         
                                    
                                          
                                        
                                
                                   
                                     
                                   
                            
                                    
                         
                       
                         
                                              
                              
                                    
                             
                                
                                              
                   

                                  
                      
                          
                                          
                                        
                                 
                                        
                             
                     
                          
                             
                                         
                            
                                                          
                             

                                     
                                  

        /**
         * @param {OverscaledTileID} tileID
         * @param size
         */
        constructor(tileID                  , size        ) {
            this.tileID = tileID;
            this.uid = uniqueId();
            this.uses = 0;
            this.tileSize = size;
            this.buckets = {};
            this.expirationTime = null;
            this.queryPadding = 0;
            this.hasSymbolBuckets = false;

            // Counts the number of times a response was already expired when
            // received. We're using this to add a delay when making a new request
            // so we don't have to keep retrying immediately in case of a server
            // serving expired tiles.
            this.expiredRequestCount = 0;

            this.state = 'loading';
        }

        registerFadeDuration(duration        ) {
            const fadeEndTime = duration + this.timeAdded;
            if (fadeEndTime < exported.now()) return;
            if (this.fadeEndTime && fadeEndTime < this.fadeEndTime) return;

            this.fadeEndTime = fadeEndTime;
        }

        wasRequested() {
            return this.state === 'errored' || this.state === 'loaded' || this.state === 'reloading';
        }

        /**
         * Given a data object with a 'buffers' property, load it into
         * this tile's elementGroups and buffers properties and set loaded
         * to true. If the data is null, like in the case of an empty
         * GeoJSON tile, no-op but still set loaded to true.
         * @param {Object} data
         * @param painter
         * @returns {undefined}
         * @private
         */
        loadVectorData(data                  , painter     , justReloaded          ) {
            if (this.hasData()) {
                this.unloadVectorData();
            }

            this.state = 'loaded';

            // empty GeoJSON tile
            if (!data) {
                this.collisionBoxArray = new CollisionBoxArray();
                return;
            }

            if (data.featureIndex) {
                this.latestFeatureIndex = data.featureIndex;
                if (data.rawTileData) {
                    // Only vector tiles have rawTileData, and they won't update it for
                    // 'reloadTile'
                    this.latestRawTileData = data.rawTileData;
                    this.latestFeatureIndex.rawTileData = data.rawTileData;
                } else if (this.latestRawTileData) {
                    // If rawTileData hasn't updated, hold onto a pointer to the last
                    // one we received
                    this.latestFeatureIndex.rawTileData = this.latestRawTileData;
                }
            }
            this.collisionBoxArray = data.collisionBoxArray;
            this.buckets = deserialize$1(data.buckets, painter.style);

            this.hasSymbolBuckets = false;
            for (const id in this.buckets) {
                const bucket = this.buckets[id];
                if (bucket instanceof SymbolBucket) {
                    this.hasSymbolBuckets = true;
                    if (justReloaded) {
                        bucket.justReloaded = true;
                    } else {
                        break;
                    }
                }
            }

            this.queryPadding = 0;
            for (const id in this.buckets) {
                const bucket = this.buckets[id];
                this.queryPadding = Math.max(this.queryPadding, painter.style.getLayer(id).queryRadius(bucket));
            }

            if (data.imageAtlas) {
                this.imageAtlas = data.imageAtlas;
            }
            if (data.glyphAtlasImage) {
                this.glyphAtlasImage = data.glyphAtlasImage;
            }
        }

        /**
         * Release any data or WebGL resources referenced by this tile.
         * @returns {undefined}
         * @private
         */
        unloadVectorData() {
            for (const id in this.buckets) {
                this.buckets[id].destroy();
            }
            this.buckets = {};

            if (this.imageAtlasTexture) {
                this.imageAtlasTexture.destroy();
            }

            if (this.imageAtlas) {
                this.imageAtlas = null;
            }

            if (this.glyphAtlasTexture) {
                this.glyphAtlasTexture.destroy();
            }

            this.latestFeatureIndex = null;
            this.state = 'unloaded';
        }

        unloadDEMData() {
            this.dem = null;
            this.neighboringTiles = null;
            this.state = 'unloaded';
        }

        getBucket(layer            ) {
            return this.buckets[layer.id];
        }

        upload(context         ) {
            for (const id in this.buckets) {
                const bucket = this.buckets[id];
                if (bucket.uploadPending()) {
                    bucket.upload(context);
                }
            }

            const gl = context.gl;
            if (this.imageAtlas && !this.imageAtlas.uploaded) {
                this.imageAtlasTexture = new Texture(context, this.imageAtlas.image, gl.RGBA);
                this.imageAtlas.uploaded = true;
            }

            if (this.glyphAtlasImage) {
                this.glyphAtlasTexture = new Texture(context, this.glyphAtlasImage, gl.ALPHA);
                this.glyphAtlasImage = null;
            }
        }

        prepare(imageManager              ) {
            if (this.imageAtlas) {
                this.imageAtlas.patchUpdatedImages(imageManager, this.imageAtlasTexture);
            }
        }

        // Queries non-symbol features rendered for this tile.
        // Symbol features are queried globally
        queryRenderedFeatures(layers                        ,
                              sourceFeatureState                    ,
                              queryGeometry              ,
                              cameraQueryGeometry              ,
                              scale        ,
                              params                                                        ,
                              transform           ,
                              maxPitchScaleFactor        ,
                              pixelPosMatrix              )                                                                       {
            if (!this.latestFeatureIndex || !this.latestFeatureIndex.rawTileData)
                return {};

            return this.latestFeatureIndex.query({
                queryGeometry,
                cameraQueryGeometry,
                scale,
                tileSize: this.tileSize,
                pixelPosMatrix,
                transform,
                params,
                queryPadding: this.queryPadding * maxPitchScaleFactor
            }, layers, sourceFeatureState);
        }

        querySourceFeatures(result                       , params     ) {
            if (!this.latestFeatureIndex || !this.latestFeatureIndex.rawTileData) return;

            const vtLayers = this.latestFeatureIndex.loadVTLayers();

            const sourceLayer = params ? params.sourceLayer : '';
            const layer = vtLayers._geojsonTileLayer || vtLayers[sourceLayer];

            if (!layer) return;

            const filter = createFilter(params && params.filter);
            const {z, x, y} = this.tileID.canonical;
            const coord = {z, x, y};

            for (let i = 0; i < layer.length; i++) {
                const feature = layer.feature(i);
                if (filter(new EvaluationParameters(this.tileID.overscaledZ), feature)) {
                    const geojsonFeature = new Feature(feature, z, x, y);
                    (geojsonFeature     ).tile = coord;
                    result.push(geojsonFeature);
                }
            }
        }

        clearMask() {
            if (this.segments) {
                this.segments.destroy();
                delete this.segments;
            }
            if (this.maskedBoundsBuffer) {
                this.maskedBoundsBuffer.destroy();
                delete this.maskedBoundsBuffer;
            }
            if (this.maskedIndexBuffer) {
                this.maskedIndexBuffer.destroy();
                delete this.maskedIndexBuffer;
            }
        }

        setMask(mask      , context         ) {

            // don't redo buffer work if the mask is the same;
            if (deepEqual(this.mask, mask)) return;

            this.mask = mask;
            this.clearMask();

            // We want to render the full tile, and keeping the segments/vertices/indices empty means
            // using the global shared buffers for covering the entire tile.
            if (deepEqual(mask, {'0': true})) return;

            const maskedBoundsArray = new StructArrayLayout4i8();
            const indexArray = new StructArrayLayout3ui6();

            this.segments = new SegmentVector();
            // Create a new segment so that we will upload (empty) buffers even when there is nothing to
            // draw for this tile.
            this.segments.prepareSegment(0, maskedBoundsArray, indexArray);

            const maskArray = Object.keys(mask);
            for (let i = 0; i < maskArray.length; i++) {
                const maskCoord = mask[maskArray[i]];
                const vertexExtent = EXTENT >> maskCoord.z;
                const tlVertex = new pointGeometry(maskCoord.x * vertexExtent, maskCoord.y * vertexExtent);
                const brVertex = new pointGeometry(tlVertex.x + vertexExtent, tlVertex.y + vertexExtent);

                // not sure why flow is complaining here because it doesn't complain at L401
                const segment = (this.segments     ).prepareSegment(4, maskedBoundsArray, indexArray);

                maskedBoundsArray.emplaceBack(tlVertex.x, tlVertex.y, tlVertex.x, tlVertex.y);
                maskedBoundsArray.emplaceBack(brVertex.x, tlVertex.y, brVertex.x, tlVertex.y);
                maskedBoundsArray.emplaceBack(tlVertex.x, brVertex.y, tlVertex.x, brVertex.y);
                maskedBoundsArray.emplaceBack(brVertex.x, brVertex.y, brVertex.x, brVertex.y);

                const offset = segment.vertexLength;
                // 0, 1, 2
                // 1, 2, 3
                indexArray.emplaceBack(offset, offset + 1, offset + 2);
                indexArray.emplaceBack(offset + 1, offset + 2, offset + 3);

                segment.vertexLength += 4;
                segment.primitiveLength += 2;
            }

            this.maskedBoundsBuffer = context.createVertexBuffer(maskedBoundsArray, rasterBoundsAttributes.members);
            this.maskedIndexBuffer = context.createIndexBuffer(indexArray);
        }

        hasData() {
            return this.state === 'loaded' || this.state === 'reloading' || this.state === 'expired';
        }

        patternsLoaded() {
            return this.imageAtlas && !!Object.keys(this.imageAtlas.patternPositions).length;
        }

        setExpiryData(data     ) {
            const prior = this.expirationTime;

            if (data.cacheControl) {
                const parsedCC = parseCacheControl(data.cacheControl);
                if (parsedCC['max-age']) this.expirationTime = Date.now() + parsedCC['max-age'] * 1000;
            } else if (data.expires) {
                this.expirationTime = new Date(data.expires).getTime();
            }

            if (this.expirationTime) {
                const now = Date.now();
                let isExpired = false;

                if (this.expirationTime > now) {
                    isExpired = false;
                } else if (!prior) {
                    isExpired = true;
                } else if (this.expirationTime < prior) {
                    // Expiring date is going backwards:
                    // fall back to exponential backoff
                    isExpired = true;

                } else {
                    const delta = this.expirationTime - prior;

                    if (!delta) {
                        // Server is serving the same expired resource over and over: fall
                        // back to exponential backoff.
                        isExpired = true;

                    } else {
                        // Assume that either the client or the server clock is wrong and
                        // try to interpolate a valid expiration date (from the client POV)
                        // observing a minimum timeout.
                        this.expirationTime = now + Math.max(delta, CLOCK_SKEW_RETRY_TIMEOUT);

                    }
                }

                if (isExpired) {
                    this.expiredRequestCount++;
                    this.state = 'expired';
                } else {
                    this.expiredRequestCount = 0;
                }
            }
        }

        getExpiryTimeout() {
            if (this.expirationTime) {
                if (this.expiredRequestCount) {
                    return 1000 * (1 << Math.min(this.expiredRequestCount - 1, 31));
                } else {
                    // Max value for `setTimeout` implementations is a 32 bit integer; cap this accordingly
                    return Math.min(this.expirationTime - new Date().getTime(), Math.pow(2, 31) - 1);
                }
            }
        }

        setFeatureState(states                    , painter     ) {
            if (!this.latestFeatureIndex ||
                !this.latestFeatureIndex.rawTileData ||
                Object.keys(states).length === 0) {
                return;
            }

            const vtLayers = this.latestFeatureIndex.loadVTLayers();

            for (const id in this.buckets) {
                const bucket = this.buckets[id];
                // Buckets are grouped by common source-layer
                const sourceLayerId = bucket.layers[0]['sourceLayer'] || '_geojsonTileLayer';
                const sourceLayer = vtLayers[sourceLayerId];
                const sourceLayerStates = states[sourceLayerId];
                if (!sourceLayer || !sourceLayerStates || Object.keys(sourceLayerStates).length === 0) continue;

                bucket.update(sourceLayerStates, sourceLayer, this.imageAtlas && this.imageAtlas.patternPositions || {});
                if (painter && painter.style) {
                    this.queryPadding = Math.max(this.queryPadding, painter.style.getLayer(id).queryRadius(bucket));
                }
            }
        }

        holdingForFade()          {
            return this.symbolFadeHoldUntil !== undefined;
        }

        symbolFadeFinished()          {
            return !this.symbolFadeHoldUntil || this.symbolFadeHoldUntil < exported.now();
        }

        clearFadeHold() {
            this.symbolFadeHoldUntil = undefined;
        }

        setHoldDuration(duration        ) {
            this.symbolFadeHoldUntil = exported.now() + duration;
        }
    }

    class CustomRasterLayer {
        constructor(options) {
            this.map = null;
            this.source = null;
            this.id = options.id;
            this.type = 'custom';
            this.tileUrls = options.tiles;
            this.sourceName = null;
            this.options = options;
            this.loadedTiles = [];
            this.tileCount = 0;
        }
        _init() {
            this.map.addSource(this.sourceName, { 'type': 'raster', 'tiles': this.tileUrls });
            this.source = this.map.getSource(this.sourceName);

            this.source.on('data', (e) => {
                if (e.sourceDataType == 'content')
                    this.loadTiles();
            });
        }
        loadTiles() {
            const currentZoomLevel = this.map.getZoom();
            const flooredZoom = Math.floor(currentZoomLevel);
        
            let bounds = map.getBounds();

            let tiles = tileCover(flooredZoom, [
                MercatorCoordinate.fromLngLat(bounds.getSouthWest()),
                MercatorCoordinate.fromLngLat(bounds.getNorthEast()),
                MercatorCoordinate.fromLngLat(bounds.getNorthWest()),
                MercatorCoordinate.fromLngLat(bounds.getSouthEast())
            ], flooredZoom, false );
            this.tileCount = tiles.length;

            tiles.forEach(tile => {
                let inTile = new Tile(tile, this.source.tileSize);
                this.source.loadTile(inTile, () => {
                    this.tileLoaded(inTile);
                });
            });
        }
        tileLoaded(tile) {
            this.loadedTiles.push(tile);
        }
        onAdd(map, gl) {
            this.map = map;
            this.gl = gl;
            this.sourceName = this.id + 'Source';

            this._init();
        }
        render(gl, matrix) {
            
        }
    }

    exports.CustomRasterLayer = CustomRasterLayer;

    return exports;

}({}));
