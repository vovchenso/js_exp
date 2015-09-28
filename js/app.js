"use strict";

/**
 * Point constructor
 * @param {Number} x
 * @param {Number} y
 * @constructor
 */
function Point(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5.5;
};
Point.prototype = {

    /**
     * Draw the point to given context
     * @param {CanvasRenderingContext2D} ctx
     */
    draw: function(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
    },

    /**
     * Check if given coordinates are inside point
     * @param {Number} x
     * @param {Number} y
     * @returns {boolean}
     */
    contains: function(x, y) {
        return (this.x - this.radius <= x) && (this.x + this.radius >= x) &&
            (this.y - this.radius <= y) && (this.y + this.radius >= y);
    }

};

/**
 * Stage constructor
 * @param {Element} canvas
 * @constructor
 */
function Stage(canvas) {
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.points = [];
    this.center = null;
    this.area = null;
};
Stage.prototype = {

    /**
     * Adds point to stage
     * @param point
     */
    addPoint: function(point) {
        this.points.push(point);
        point.draw(this.ctx);
        this._check();
    },

    /**
     * Draw points and parallelogram
     */
    draw: function() {
        var i,
            length = this.points.length;

        this._clear();

        for (i = 0; i < length; i++) {
            this.points[i].draw(this.ctx);
        }

        this._check();
    },

    /**
     * Reset stage
     */
    reset: function() {
        this._clear();
        this.points = [];
        this.center = null;
        this.area = null;
    },

    /**
     * Clear the full area
     * @private
     */
    _clear: function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    /**
     * Check the number of point and call function to draw
     * @private
     */
    _check: function() {
        if (3 === this.points.length) {
            this._calculate();
            this._draw();
        }
    },

    /**
     * Calculate the center and area of the parallelogram
     * @private
     */
    _calculate: function() {
        var p1 = this.points[0];
        var p2 = this.points[2];

        // calculate the center of parallelogram
        this.center = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };

        this._calculateArea();
    },

    /**
     * Calculate the area of parallelogram
     * @private
     */
    _calculateArea: function() {
        var p1 = this.points[0],
            p2 = this.points[1],
            p3 = this.points[2];

        // calculate the angle using the Dot Product of two vectors
        var x1 = p1.x - p2.x,
            x2 = p3.x - p2.x,
            y1 = p1.y - p2.y,
            y2 = p3.y - p2.y,
            d1 = Math.sqrt(x1 * x1 + y1 * y1),
            d2 = Math.sqrt(x2 * x2 + y2 * y2),
            a = (d1 && d2)
                ? Math.acos((x1 * x2 + y1 * y2) / (d1 * d2))
                : 0;

        // calculate the area of parallelogram
        this.area = d1 * d2 * Math.sin(a);
    },

    /**
     * Draw parallelogram and circle
     * @private
     */
    _draw: function() {
        var p1 = this.points[0],
            p2 = this.points[1],
            p3 = this.points[2];

        // calculate coordinates for fourths point of parallelogram
        var p4 = {
            x: p3.x - (p2.x - p1.x),
            y: p1.y + (p3.y - p2.y)
        };

        // draw parallelogram
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.lineTo(p4.x, p4.y);
        this.ctx.closePath();
        this.ctx.strokeStyle = '#0000ff';
        this.ctx.stroke();

        // get the radius for circle from area of the parallelogram
        var r = Math.sqrt(this.area / Math.PI);

        // draw circle
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, r, 0, 2 * Math.PI, false);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.stroke();
    }

};

/**
 * View constructor
 * Present info from Stage
 * @param {Stage} stage
 * @param {Element} area
 * @constructor
 */
function View(stage, area) {
    this.stage = stage;
    this._elements = {};

    ['point1', 'point2', 'point3', 'area'].forEach(function(item) {
        this._elements[item] = area.querySelector('[data-element="' + item + '"]');
    }.bind(this));
};
View.prototype = {

    /**
     * Update coordinates for each point and area
     */
    update: function() {
        var points = this.stage.points,
            area = this.stage.area,
            i, j;

        for (i = 0, j = i + 1; i < points.length; i++, j++) {
            this._elements['point' + j].textContent = 'x: ' + points[i].x + ' y: ' + points[i].y;
        }

        this._elements.area.textContent = area && Math.round(area);
    },

    /**
     * Reset labels
     */
    reset: function() {
        for (var elem in this._elements) {
            this._elements[elem].textContent = '';
        }
    }
};

// init and run app
(function() {

    var canvas, stage, view;
    var point = null;
    var dx, dy;

    /**
     * Calculate the mouse coordinates for the canvas
     * @param {Event} e
     * @returns {{x: Number, y: Number}}
     * @private
     */
    function _getCoords(e) {
        var x = e.pageX,
            y = e.pageY;

        if (canvas.offsetParent !== undefined) {
            x -= canvas.offsetLeft;
            y -= canvas.offsetTop;
        }

        return {
            x: x,
            y: y
        }
    };

    /**
     * Adds Point to the Stage
     * @param {Event} e
     * @private
     */
    function _addPoint(e) {
        var coords = _getCoords(e);
        var point = new Point(coords.x, coords.y);
        stage.addPoint(point);
        view.update();

        if (3 === stage.points.length) {
            canvas.removeEventListener('click', _addPoint);
            canvas.addEventListener('mousedown', _startMove);
            canvas.addEventListener('mouseup', _stopMove);
            canvas.addEventListener('mousemove', _move);
        }
    };

    /**
     * Start dragging the point
     * @param {Event} e
     * @private
     */
    function _startMove(e) {
        var coords = _getCoords(e),
            points = stage.points,
            length = points.length;

        for (var i = length - 1; i >= 0; i--) {
            if (points[i].contains(coords.x, coords.y)) {
                point = points[i];
                dx = coords.x - point.x;
                dy = coords.y - point.y;
            }
        }

    };

    /**
     * Stop dragging the point
     * @param {Event} e
     * @private
     */
    function _stopMove(e) {
        point = null;
    };

    /**
     * Dragging the point
     * @param {Event} e
     * @private
     */
    function _move(e) {
        if (null !== point) {
            var coords = _getCoords(e);
            point.x = coords.x - dx;
            point.y = coords.y - dy;
            stage.draw();
            view.update();
        }
    };

    /**
     * Show active page
     * @param {String} active
     * @private
     */
    function _showActivePage(active) {
        var pages = document.querySelectorAll('.page');
        for (var j = 0; j < pages.length; j++) {
            pages[j].classList.remove('active');
        }
        document.getElementById(active).classList.add('active');
    }

    /**
     * Init navigation links handlers
     * @private
     */
    function _navInit() {
        var links = document.querySelectorAll('header .nav');
        for (var i = 0; i< links.length; i++) {
            links[i].addEventListener('click', function(e) {
                e.preventDefault();

                var j,
                    active = this.getAttribute('href').substring(1);

                // active link
                for (j = 0; j < links.length; j++) {
                    links[j].classList.remove('active');
                }window.addEventListener();document.getElementById('canvas')
                this.classList.add('active');

                _showActivePage(active);
            });
        }
    };

    /**
     * Init the application
     * @private
     */
    function _init() {
        canvas = document.getElementById('canvas');
        stage = new Stage(canvas);
        view = new View(
            stage,
            document.getElementById('info')
        );

        document.getElementById('reset').addEventListener('click', _reset);

        _navInit();
        _reset();
    };

    /**
     * Reset the stage
     * @private
     */
    function _reset() {
        stage.reset();
        view.reset();

        canvas.addEventListener('click', _addPoint);
        canvas.removeEventListener('mousedown', _startMove);
        canvas.removeEventListener('mouseup', _stopMove);
        canvas.removeEventListener('mousemove', _move);
    };

    return {
        run: function() {
            window.addEventListener('load', _init, false);
        }
    };

})().run();