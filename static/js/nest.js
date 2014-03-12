var nest,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

nest = (function() {
  function nest(options) {
    this.update = __bind(this.update, this);
    this.clone = __bind(this.clone, this);
    this.highlight = __bind(this.highlight, this);
    this.remove = __bind(this.remove, this);
    this.explore = __bind(this.explore, this);
    this.dblclick = __bind(this.dblclick, this);
    this.rm = __bind(this.rm, this);
    this.expand = __bind(this.expand, this);
    this.find_link = __bind(this.find_link, this);
    this.find_node = __bind(this.find_node, this);
    this.click = __bind(this.click, this);
    this.color = __bind(this.color, this);
    this.toggle_doc = __bind(this.toggle_doc, this);
    this.tick = __bind(this.tick, this);
    this.getR = __bind(this.getR, this);
    this.draw = __bind(this.draw, this);
    this.focus = __bind(this.focus, this);
    this.zoom = __bind(this.zoom, this);
    this.onKey = __bind(this.onKey, this);
    this.recenterVoronoi = __bind(this.recenterVoronoi, this);
    this.normalize_link = __bind(this.normalize_link, this);
    this._convert_link_id = __bind(this._convert_link_id, this);
    var _t;
    this.container = options.container || "#container";
    this.w = options.width || 400;
    this.h = options.height || 400;
    this.hNode = {};
    this.palette = d3.scale.category20();
    this.blacklist = [];
    _t = this;
    this.vis = d3.select(this.container).append("svg:svg").style('width', 'inherit').style('height', 'inherit').attr("viewBox", "0 0 " + this.w + " " + this.h).attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", this.zoom)).on('dblclick.zoom', null).append("svg:g").on('mousemove', function() {
      if (_t.timed != null) {
        clearTimeout(_t.timed);
      }
      _t.timed = setTimeout(_t.focus, 100, d3.mouse(this));
    }).on('mouseleave', function() {
      if (_t.timed != null) {
        clearTimeout(_t.timed);
      }
    });
    this.events = $(this.vis[0]);
    this.voronoi = d3.geom.voronoi().x(function(d) {
      return d.x;
    }).y(function(d) {
      return d.y;
    });
    this.translate = [0, 0];
    this.scale = 1.0;
    this.svg_link = this.vis.selectAll(".link");
    this.svg_node = this.vis.selectAll(".node");
    this.text = this.vis.selectAll('text');
    this.clip = this.vis.selectAll('.clip');
    this.force = d3.layout.force().on("tick", this.tick).charge(-200).linkDistance(function(d) {
      if (d.target.distance_rank != null) {
        return d.target.distance_rank * 20;
      }
      if (d.target.type === "referData") {
        return 5;
      } else {
        return 20;
      }
    }).linkStrength(function(d) {
      if (d.value != null) {
        return 1.0 - d.value;
      } else {
        return 0.1;
      }
    }).size([this.w, this.h]);
    $(document).keydown(this.onKey);
    $(document).keyup(this.onKey);
    return;
  }

  nest.prototype.normalize_id = function(d) {
    d.name = d.name.replace(/^\s+|\s+$/, '');
    if (d.id == null) {
      d.id = "" + d.type + "_" + d.name;
    }
    d.id = d.id.replace(/^\s+|\s+$/, '');
  };

  nest.prototype._convert_link_id = function(x) {
    if (typeof x === "string") {
      x = x.replace(/^\s+|\s+$/g, '');
      if (this.hNode[x] != null) {
        return this.hNode[x];
      }
    }
    return x;
  };

  nest.prototype.normalize_link = function(l) {
    l.source = this._convert_link_id(l.source);
    l.target = this._convert_link_id(l.target);
  };

  nest.prototype.normalize_text = function(x) {
    if (typeof x === "string") {
      x = x.replace(/^\s+|\s+$/g, '');
    }
    return x;
  };

  nest.prototype.recenterVoronoi = function(nodes) {
    var shapes;
    shapes = [];
    this.voronoi(nodes).forEach(function(d) {
      var n;
      if (!d.length) {
        return;
      }
      n = [];
      d.forEach(function(c) {
        n.push([c[0] - d.point.x, c[1] - d.point.y]);
      });
      n.point = d.point;
      shapes.push(n);
    });
    return shapes;
  };

  nest.prototype.onKey = function(e) {
    this.ctrlPressed = e.ctrlKey;
    this.altPressed = e.altKey;
    this.shiftPressed = e.shiftKey;
    if (e.type === "keydown" && e.keyCode === 68) {
      this.toggle_doc();
    }
    return true;
  };

  nest.prototype.zoom = function() {
    this.scale = d3.event.scale;
    this.translate = d3.event.translate;
    this.vis.attr("transform", "translate(" + this.translate + ")" + " scale(" + this.scale + ")");
    this.text.style("font-size", this.scale < 0.5 ? "0em" : (1 / this.scale) + "em");
  };

  nest.prototype.focus = function(e) {
    var hFocus, node_dist, threshold,
      _this = this;
    this.center = {
      x: e[0],
      y: e[1]
    };
    if (this.ring == null) {
      this.ring = this.vis.insert("circle", ":first-child").classed('ring', true);
    }
    this.ring.attr('r', 150.0 / this.scale).attr('cx', this.center.x).attr('cy', this.center.y);
    node_dist = [];
    this.nodes.map(function(d) {
      node_dist.push([d.id, Math.pow(d.x - _this.center.x, 2) + Math.pow(d.y - _this.center.y, 2)]);
    });
    node_dist.sort(function(a, b) {
      return a[1] - b[1];
    });
    node_dist = node_dist.slice(0, 15);
    threshold = Math.pow(150 / this.scale, 2);
    node_dist = node_dist.filter(function(d) {
      return d[1] < threshold;
    });
    hFocus = {};
    this.nodes.map(function(d) {
      if (d !== this.theFocus) {
        d.isHigh = false;
      }
    });
    node_dist.map(function(d) {
      hFocus[d[0]] = true;
      _this.hNode[d[0]].isHigh = true;
    });
    this.links.map(function(d) {
      d.isHigh = false;
      if ((hFocus[d.source.id] != null) && hFocus[d.target.id]) {
        d.isHigh = true;
      }
    });
    this.update(false);
  };

  nest.prototype.draw = function(json) {
    var _this = this;
    if ((json.nodes == null) || json.nodes.length === 0) {
      return {
        'error': 'no nodes'
      };
    }
    if (json.blacklist != null) {
      this.blacklist = json.blacklist;
    }
    json.nodes.map(function(d) {
      _this.normalize_id(d);
    });
    json.links.map(function(d) {
      d.source = _this.normalize_text(d.source);
      d.target = _this.normalize_text(d.target);
    });
    this.nodes = json.nodes.slice();
    this.links = json.links.slice();
    this.root = this.nodes[0];
    this.theFocus = this.root;
    this.root.isHigh = true;
    this.root.x = this.w / 2;
    this.root.y = this.h / 2;
    this.force.nodes(this.nodes).links(this.links);
    this.update();
  };

  nest.prototype.getR = function(d) {
    if (d.type === "SearchProvider") {
      return 15;
    } else {
      return 5;
    }
  };

  nest.prototype.tick = function() {
    var _this = this;
    this.svg_node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }).attr('clip-path', function(d) {
      return "url(#clip-" + d.index + ")";
    });
    this.vis.select('.marker').attr('x', this.theFocus.x - 22).attr({
      'y': this.theFocus.y - 45
    });
    this.svg_link.attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    });
    this.text.attr("transform", function(d) {
      var dx;
      dx = d.x + _this.getR(d) + 5 * _this.scale;
      return "translate(" + dx + "," + d.y + ")";
    });
    this.clip = this.clip.data(this.recenterVoronoi(this.nodes), function(d) {
      return d.point.index;
    });
    this.clip.enter().append('clipPath').classed('clip', true).attr('id', function(d) {
      return 'clip-' + d.point.index;
    });
    this.clip.exit().remove();
    this.clip.selectAll('path').remove();
    this.clip.append('path').attr('d', function(d) {
      return 'M' + d.join(',') + 'Z';
    });
  };

  nest.prototype.toggle_doc = function() {
    this.flag = !this.flag;
    if (this.flag) {
      this.svg_node.classed('hidden', function(d) {
        return d.type === "referData";
      });
      this.svg_link.classed('hidden', function(d) {
        return d.target.type === "referData";
      });
      return this.text.classed('hidden', function(d) {
        return d.type === "referData";
      });
    } else {
      this.svg_node.classed('hidden', false);
      this.svg_link.classed('hidden', false);
      return this.text.classed('hidden', false);
    }
  };

  nest.prototype.colors = {
    'referData': '#aaaaaa',
    'relationship': '#0088ff',
    'SearchProvider': 'dd0000'
  };

  nest.prototype.color = function(d) {
    var res;
    if (this.colors[d.type] != null) {
      return this.colors[d.type];
    }
    res = "#0088ff";
    if (d.distance_rank != null) {
      res = d3.hsl(res).brighter(d.distance_rank * .1).toString();
    }
    return res;
  };

  nest.prototype.click = function(d) {
    if (this.shiftPressed) {
      this.remove(d);
      this.update();
    } else if (this.ctrlPressed) {
      this.dblclick(d);
      this.update();
    } else {
      this.highlight(d);
      this.events.trigger("click", [d]);
    }
  };

  nest.prototype.find_node = function(linknode) {
    var i, n, t;
    t = typeof linknode;
    if (t === "string") {
      n = this.hNode[this.normalize_text(linknode)];
      return n;
    } else if (t === "object") {
      n = this.hNode[linknode.id];
      return n;
    } else if (t === "number") {
      i = linknode;
      if (i > this.nodes.length - 1 || i < 0) {
        return;
      }
      return this.nodes[i];
    }
  };

  nest.prototype.find_link = function(l) {
    var source_node, target_node;
    source_node = this.find_node(l.source);
    target_node = this.find_node(l.target);
    if ((source_node == null) || (target_node == null)) {
      return;
    }
    return this.matrix[source_node.id][target_node.id];
  };

  nest.prototype.expand = function(data) {
    var _this = this;
    data.nodes.map(function(x) {
      _this.normalize_id(x);
      if (_this.hNode[x.id] == null) {
        _this.nodes.push(x);
        _this.hNode[x.id] = x;
      }
    });
    data.links.map(function(x) {
      var source, target;
      source = _this.find_node(x.source);
      target = _this.find_node(x.target);
      if ((source == null) || (target == null)) {
        return;
      }
      _this.links.push(x);
      target.x = source.x + Math.random() * 50 - 25;
      target.y = source.y + Math.random() * 50 - 25;
    });
    this.update();
  };

  nest.prototype.rm = function(data) {
    var _this = this;
    data.nodes.map(function(x) {
      _this.nodes.remove(_this.hNode[x.id]);
    });
    data.links.map(function(x) {
      _this.links.remove(_this.find_link(x));
    });
    this.update();
  };

  nest.prototype.dblclick = function(d) {
    var data;
    if (d.type === "referData" || d.type === "doc") {
      this.events.trigger("click_doc", [d]);
      return;
    }
    if ((d.isSearching != null) && d.isSearching === true) {
      d.isSearching = false;
      return;
    }
    d.isSearching = true;
    data = {
      keys: d.name,
      return_id: d.id
    };
    if (d.url != null) {
      data.url = d.url;
      if (d.url.indexOf("/subview/") >= 0) {
        data.is_subview = true;
      }
    }
    $.post("/explore/", JSON.stringify(data), this.explore, 'json');
  };

  nest.prototype.explore = function(data) {
    var i, id, source, target, x, _i, _len, _ref;
    for (id in data) {
      source = this.hNode[id];
      if (source == null) {
        continue;
      }
      i = 0;
      _ref = data[id];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        this.normalize_id(x);
        if (this.blacklist.indexOf(x.id) >= 0) {
          continue;
        }
        target = this.hNode[x.id];
        if (target == null) {
          if (i === 5 && x.type !== "referData") {
            continue;
          }
          this.nodes.push(x);
          x.x = source.x + Math.random() * 100 - 50;
          x.y = source.y + Math.random() * 100 - 50;
          i += 1;
          target = x;
        }
        if (this.matrix[source.id][target.id] == null) {
          this.links.push({
            "source": source,
            "target": target
          });
        }
      }
      source.isSearching = false;
    }
    this.events.trigger('explore_node');
    this.update();
  };

  nest.prototype.remove = function(d) {
    var link, _i, _len, _ref;
    if (d === this.root) {
      alert("不能删除根节点");
      this.shiftPressed = false;
      return;
    }
    _ref = this.degree[d.id];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      this.links.remove(link);
      if (this.degree[link.target.id].length === 1 && link.target !== this.root) {
        this.nodes.remove(link.target);
      }
      if (this.degree[link.source.id].length === 1 && link.source !== this.root) {
        this.nodes.remove(link.source);
      }
    }
    this.nodes.remove(d);
    this.blacklist.push(d.id);
    this.clip = this.clip.data([]);
    this.clip.exit().remove();
    this.events.trigger("remove_node");
    this.update();
  };

  nest.prototype.highlight = function(d) {
    var x, _i, _j, _len, _len1, _ref, _ref1;
    _ref = this.links;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      x.isHigh = false;
    }
    _ref1 = this.nodes;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      x = _ref1[_j];
      x.isHigh = false;
    }
    d.isHigh = true;
    this.theFocus = d;
    if ($(".marker").length === 0) {
      this.vis.append('image').classed('marker', true).attr('xlink:href', "/img/marker.svg").attr('width', 50).attr('height', 50).attr('x', this.theFocus.x - 22).attr({
        'y': this.theFocus.y - 45
      });
    }
    $('.marker').remove().appendTo($(this.vis[0][0]));
    this.update(false);
  };

  nest.prototype.clone = function(d) {
    var $g, $svg, svg;
    $svg = $('#nest-container svg').clone();
    $g = $svg.find(">g");
    svg = d3.select($svg.get()[0]);
    svg.selectAll('.node').data(window.nest.nodes).filter(function(x) {
      return !x.isHigh;
    }).remove();
    svg.selectAll('.link').data(window.nest.links).filter(function(x) {
      return !x.isHigh;
    }).remove();
    svg.selectAll('.ring').remove();
    svg.selectAll('.marker').remove();
    svg.selectAll('.selection-helper').remove();
    svg.attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid meet").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", function() {
      var scale;
      scale = d3.event.scale;
      $g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + scale + ")");
      svg.selectAll('text').style("font-size", scale < 0.5 ? "0em" : (1 / scale) + "em");
    }));
    this.events.trigger("clone_graph", [d, $svg]);
  };

  nest.prototype.update = function(start_force) {
    var l, n, nodeEnter, x, y, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2,
      _this = this;
    if (start_force == null) {
      start_force = true;
    }
    this.hNode = {};
    this.nodes.forEach(function(d, i) {
      _this.hNode[d.id] = d;
      d.index = i;
    });
    _ref = this.links;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      l = _ref[_i];
      this.normalize_link(l);
    }
    this.svg_link = this.svg_link.data(this.links);
    this.svg_link.enter().insert("line", ".node").classed("link", true);
    this.svg_link.exit().remove();
    this.svg_node = this.svg_node.data(this.nodes, function(d) {
      return d.id;
    });
    _this = this;
    nodeEnter = this.svg_node.enter().append("g").attr("class", "node").on("click", this.click).on('dblclick', this.dblclick).classed("highlight", function(d) {
      return d.isHigh === true;
    }).call(this.force.drag());
    nodeEnter.append('circle').classed('selection-helper', true).attr('r', 50).style("fill", "#0088ff");
    nodeEnter.append("circle").style("fill", this.color).attr('r', this.getR);
    nodeEnter.filter(function(d) {
      return (d.img != null) && d.type === "SearchProvider";
    }).append('image').attr('xlink:href', function(d) {
      return d.img;
    }).attr('width', 20).attr('height', 20).attr('x', -10).attr('y', -10);
    nodeEnter.append('title').text(function(d) {
      return d.name;
    });
    this.svg_node.exit().remove();
    this.text = this.text.data(this.nodes.filter(function(d) {
      return d.isHigh;
    }), function(d) {
      return d.id;
    });
    this.text.enter().append('text').text(function(d) {
      if (d.name.length <= 5) {
        return d.name;
      } else {
        return d.name.slice(0, 5) + "...";
      }
    }).style("font-size", this.scale < 0.5 ? "0em" : (1 / this.scale) + "em").attr("transform", function(d) {
      var dx;
      dx = d.x + _this.getR(d) + 5 * _this.scale;
      return "translate(" + dx + "," + d.y + ")";
    });
    if (this.flag) {
      this.text.classed("hidden", function(d) {
        return d.type === "referData";
      });
    }
    this.svg_node.classed("highlight", function(d) {
      return d.isHigh === true;
    });
    this.svg_link.classed("highlight", function(d) {
      return d.isHigh === true;
    });
    this.text.exit().remove();
    if (start_force) {
      this.force.start();
      this.matrix = {};
      this.degree = {};
      n = this.nodes.length;
      _ref1 = this.nodes;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        x = _ref1[_j];
        this.degree[x.id] = [];
        this.matrix[x.id] = {};
        _ref2 = this.nodes;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          y = _ref2[_k];
          this.matrix[x.id][y.id] = null;
        }
      }
      this.links.map(function(x) {
        var e;
        try {
          _this.degree[x.source.id].push(x);
          _this.degree[x.target.id].push(x);
          _this.matrix[x.source.id][x.target.id] = x;
        } catch (_error) {
          e = _error;
          console.log(_this.degree);
        }
      });
    }
  };

  return nest;

})();

Array.prototype.remove = function(b) {
  var a;
  if (b == null) {
    return false;
  }
  a = this.indexOf(b);
  if (a >= 0) {
    this.splice(a, 1);
    return true;
  }
  return false;
};

if (typeof define === "function" && (define.amd != null)) {
  define("nest", ['jquery', 'd3'], function($, ff) {
    return nest;
  });
}
