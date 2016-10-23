/**
 * @public
 * @constructor
 * @param {Object[]} dataSet
 */
function CarEnginesChart(dataSet) {
    /**
     *
     */
    this._dataSet = dataSet;
    /**
     *
     */
    this._width;
    /**
     *
     */
    this._height;
    /**
     *
     */
    this._circles;
    /**
     *
     */
    this._labels;
    /**
     *
     */
    this._padding = 0;
    /**
     *
     */
    this._scale = 1;
    /**
     *
     */
    this._margin = {
        top : 0,
        bottom: 25,
        left: 0,
        right: 0
    }
    this._force = d3.layout.force()
        .gravity(0)
        .charge(0)
};


/**
 * Force layout tick event handler.
 * @private
 * @param {Object} d
 */
CarEnginesChart.prototype._tickEventHandler = function(d) {
    /*
     * Visit all nodes and recalculate coordinates.
     */
    var q = d3.geom.quadtree(this._dataSet);
    for (var i = 0; i < this._dataSet.length; i ++) {
        q.visit(this._getCollider(this._dataSet[i]))
    };
    /*
     * Move bubbles.
     */
    this._circles.each(this._gravity(d.alpha * 0.1))
        .attr("cx", function(d) {
            return d.x;
        }).attr("cy", function(d) {
        return d.y;
    })
    /*
     * Move labels.
     */
    this._labels.attr("x", function(d) {
        return d.x;
    }).attr("y", function(d) {
        return d.y;
    });
};


/**
 * Collision detection function.
 * @private
 * @param {Object} d
 * @returns {Function}
 */
CarEnginesChart.prototype._getCollider = function(d) {
    /*
     * Bounce from borders.
     */
    d.y = Math.max(d.r, Math.min(this._height - this._margin.bottom - d.r, d.y))
    d.x = Math.max(d.r, Math.min(this._width - d.r, d.x))
    /*
     * Calculate necessary values.
     */
    var r = d.r;
    var nx1 = d.x - r;
    var nx2 = d.x + r;
    var ny1 = d.y - r;
    var ny2 = d.y + r;
    /*
     * Stash reference object.
     */
    var self = this;
    /*
     * Return collision function.
     */
    return function(quad, x1, y1, x2, y2) {

        if (quad.point && (quad.point !== d)) {

            var x = d.x - quad.point.x;
            var y = d.y - quad.point.y;
            var l = Math.sqrt(x * x + y * y);
            var r = d.r + quad.point.r + self._padding;

            if (l < r) {

                l = (l - r) / l * .5;
                d.x -= x *= l;
                d.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
            }
        }

        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
}


/**
 * Set bubbles padding.
 * @param {Number} padding
 * @returns {CarEnginesChart}
 */
CarEnginesChart.prototype.setPadding = function(padding) {

    this._padding = padding;
    return this;
}


/**
 * Set bubbles scale factor.
 * @param {Number} scale
 * @returns {CarEnginesChart}
 */
CarEnginesChart.prototype.setScale = function(scale) {

    this._scale = scale;
    return this;
}


/**
 * Render chart.
 * @public
 * @param {String} selector
 * @returns {CarEnginesChart}
 */
CarEnginesChart.prototype.render = function(selector) {
    /*
     * Select chart container.
     */
    var container = d3.select(selector);
    /*
     * Set chart width and height.
     */
    this._width = container.node().getBoundingClientRect().width;
    this._height = container.node().getBoundingClientRect().height;
    /*
     * Set force layout size.
     */
    this._force.size([ this._width, this._height ])
    /*
     * Get date extent.
     */
    var dateExtent = d3.extent(this._dataSet, function(d) {
        return d.date;
    });
    /*
     * Set up x scale function.
     */
    //this.xScale = d3.scale.linear()
    //    .range([0, this._width])
    //    .domain(dateExtent);

    this.xScale = d3.time.scale()
        .range([0, this._width])
        .domain(dateExtent);


    /*
     * Set up x axis.
     */
    var xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient("bottom");
    /*
     * Transform data set.
     */
    this._dataSet = this._dataSet.map(function(d) {
        d.r = d.frequency * this._scale;
        d.x = this.xScale(d.date);
        return d;
    }, this);
    /*
     * Get frequency extent.
     */
    var frequencyExtent = d3.extent(this._dataSet, function(d) {
        return d.frequency;
    })
    /*
     * Set up color scale function.
     */
    var date_arry = [];
    for(var i =1; i<=12; i++){
        date_arry.push(new Date(2014,i));
    }
    this.colorScale = d3.scale.linear()
        .domain(date_arry)
        .range(["#2ca25f", "#8856a7", "#43a2ca", '#e34a33','#a6bddb','#ece7f2',
        '#dd1c77','#f7fcb9','#2c7fb8','#fec44f','#756bb1','#bdbdbd']);
    /*
     * Append SVG to container.
     */
    var svg = container.append("svg")
        .attr("width", this._width)
        .attr("height", this._height);
    /*
     * Append chart canvas to SVG.
     */
    var canvas = svg.append("g")
        .attr("class", "canvas");
    /*
     * Append x axis to canvas.
     */
    canvas.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (this._height - this._margin.bottom) + ")")
        .call(xAxis);
    /*
     * Stash reference object.
     */
    var self = this;
    /*
     * Render bubble's containers.
     */
    this._bubbles = canvas.selectAll(".bubbles")
        .data(this._dataSet)
        .enter()
        .append("g")
        .on("mouseover", function(d) {
            var dimension = d3.select(this).node().getBoundingClientRect();
            var x = dimension.x || dimension.left;
            var y = dimension.y || dimension.top;

            var dateFormat = d3.time.format("%Y-%m");
            nv.tooltip.show([x + d.r, y], "<p>" +
                "<span><b>" + d["word"] + "</b></span><br />" +
                "<span>date: " + dateFormat(d.date) + "</span><br />" +
                "<span>freq: " + d.frequency + "</span><br />" +
                "</p>");
        }).on("mouseout", function(d) {
            nv.tooltip.cleanup();
        });
    /*
     * Render bubbles.
     */
    this._circles = this._bubbles.append("circle")
        .attr("class", "bubble-node")
        .style("fill", function(d) {
            return self.colorScale(d.date);
        }).attr("r", function(d) {
            return d.r;
        }).attr("cx", function(d) {
            return self.xScale(d.date);
        }).attr("cy", function() {
            return self._height / 2;
        }).on("mousedown", requestSubjects(d.word));
    /*
     * Render bubble's labels.
     */
    this._labels = this._bubbles.append("text")
        .attr("class", "text-cursor")
        .attr("text-anchor", "middle")
        .attr("font-size", function(d) {
            return Math.sqrt(d.r) * 2.4;
        }).attr("transform", function(d) {
            return "translate(0, " + (Math.sqrt(d.r) * 2.5 / 4) + ")";
        }).text(function(d) {
            return d.word;
        });
    /*
     * Trim bubble's labels.
     */
    this._labels.text(function(d) {
        var word = d.word;
        var symbolSize = this.getBBox().width / word.length + 1;
        var diameter = d.r * 2;

        while (word.length * symbolSize > diameter) {
            word = word.slice(0, -1);
        }

        return word.slice(0, -1);
    });
    /*
     * Returns this object.
     */
    return this;
}


/**
 * Run animation.
 * @public
 */
CarEnginesChart.prototype.run = function() {
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Run force layout animation.
     */
    this._force.on("tick", function(d) {
        self._tickEventHandler(d);
    }).nodes(this._dataSet)
        .start();
};


/**
 * Gravity function.
 * @private
 * @param {Number} alpha
 * @returns {Function}
 */
CarEnginesChart.prototype._gravity = function(alpha) {
    /*
     * Calculate necessary values.
     */
    var cx = this._width / 2;
    var cy = this._height / 2;
    /*
     * Stash reference to this object.
     */
    var self = this;
    /*
     * Return custom gravity function.
     */
    return function(d) {
        d.x += (self.xScale(d.date) - d.x) * alpha;
        d.y += (cy - d.y) * alpha;
    };
};