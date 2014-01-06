(function() {
  var nest,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  nest = (function() {
    nest.colors = ["song", "artist", "user", "album", 'relationship', "baiduBaikeCrawler", "hudongBaikeCrawler", "referData"];

    function nest(options) {
      this.update = __bind(this.update, this);
      this.highlight = __bind(this.highlight, this);
      this.expand = __bind(this.expand, this);
      this.explore = __bind(this.explore, this);
      this.click = __bind(this.click, this);
      this.remove = __bind(this.remove, this);
      this.dblclick = __bind(this.dblclick, this);
      this.color = __bind(this.color, this);
      this.toggle_doc = __bind(this.toggle_doc, this);
      this.tick = __bind(this.tick, this);
      this.getR = __bind(this.getR, this);
      this.draw = __bind(this.draw, this);
      this.focus = __bind(this.focus, this);
      this.zoom = __bind(this.zoom, this);
      this.cacheIt = __bind(this.cacheIt, this);
      this.recenterVoronoi = __bind(this.recenterVoronoi, this);
      this.normalize_link = __bind(this.normalize_link, this);
      this.convert_link_id = __bind(this.convert_link_id, this);
      var _t,
        _this = this;
      this.hNode = {};
      this.position_cache = {};
      this.palette = d3.scale.category20();
      this.container = options.container || "#container";
      this.w = options.width || 400;
      this.h = options.height || 400;
      this.ctrlPressed = false;
      this.altPressed = false;
      this.shiftPressed = false;
      this.blacklist = [];
      this.explored = [];
      _t = this;
      this.vis = d3.select(this.container).append("svg:svg").style('width', 'inherit').style('height', 'inherit').attr("viewBox", "0 0 " + this.w + " " + this.h).attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", this.zoom)).on('dblclick.zoom', null).append("svg:g").on('mousemove', function() {
        if (_t.timed != null) {
          clearTimeout(_t.timed);
        }
        _t.timed = setTimeout(_t.focus, 100, d3.mouse(this));
      }).on('mouseleave', function() {
        _this.mouse_on = true;
        if (_this.timed) {
          clearTimeout(_this.timed);
        }
      });
      this.voronoi = d3.geom.voronoi().x(function(d) {
        return d.x;
      }).y(function(d) {
        return d.y;
      });
      this.translate = [0, 0];
      this.scale = 1.0;
      this.link = this.vis.selectAll(".link");
      this.node = this.vis.selectAll(".node");
      this.text = this.vis.selectAll('text');
      this.clip = this.vis.selectAll('.clip');
      this.force = d3.layout.force().on("tick", this.tick).charge(function(d) {
        if (d.type === "referData") {
          return -200;
        } else {
          return -200;
        }
      }).linkDistance(function(d) {
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
      this.relationships = {
        'artist': [
          {
            "id": function(d) {
              return "hitsongs_of_" + d.id;
            },
            'name': function(d) {
              return "Artist's best songs";
            }
          }, {
            "id": function(d) {
              return "albums_of_" + d.id;
            },
            'name': function(d) {
              return "Artist's album(s)";
            }
          }
        ],
        'song': [
          {
            "id": function(d) {
              return "artist_of_" + d.id;
            },
            'name': function(d) {
              return "Song's artist(s)";
            }
          }, {
            "id": function(d) {
              return "album_of_" + d.id;
            },
            'name': function(d) {
              return "Song's album";
            }
          }
        ],
        'album': [
          {
            "id": function(d) {
              return "artist_of_" + d.id;
            },
            'name': function(d) {
              return "Album's artist";
            }
          }, {
            "id": function(d) {
              return "songs_of_" + d.id;
            },
            'name': function(d) {
              return "Album's songs";
            }
          }
        ],
        'collect': [
          {
            "id": function(d) {
              return "songs_of_" + d.id;
            },
            'name': function(d) {
              return "Collection's songs";
            }
          }
        ]
      };
      $(document).keydown(this.cacheIt);
      $(document).keyup(this.cacheIt);
      return;
    }

    nest.prototype.normalize_id = function(x) {
      x.name = x.name.replace(/^\s+|\s+$/, '');
      if (x.id == null) {
        x.id = "" + x.type + "_" + x.name;
      }
      x.id = x.id.replace(/^\s+|\s+$/, '');
    };

    nest.prototype.convert_link_id = function(x) {
      if (typeof x === "string") {
        x = x.replace(/^\s+|\s+$/g, '');
        if (this.hNode[x] != null) {
          return this.hNode[x];
        }
      }
      return x;
    };

    nest.prototype.normalize_link = function(l) {
      l.source = this.convert_link_id(l.source);
      l.target = this.convert_link_id(l.target);
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

    nest.prototype.cacheIt = function(e) {
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
      this.text.style("font-size", (1 / this.scale) + "em");
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
      this.ring.attr('r', 150.0 / this.scale);
      this.ring.attr('cx', this.center.x);
      this.ring.attr('cy', this.center.y);
      node_dist = [];
      this.node.each(function(d) {
        node_dist.push([d.id, Math.pow(d.x - _this.center.x, 2) + Math.pow(d.y - _this.center.y, 2)]);
      });
      node_dist.sort(function(a, b) {
        return a[1] - b[1];
      });
      threshold = Math.pow(150 / this.scale, 2);
      node_dist = node_dist.slice(0, 15);
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
      this.link.each(function(d) {
        d.isHigh = false;
        if ((hFocus[d.source.id] != null) && hFocus[d.target.id]) {
          d.isHigh = true;
        }
      });
      this.update(false);
    };

    nest.prototype.draw = function(json) {
      var d, i, n, _i, _j, _len, _len1, _ref, _ref1;
      if ((json.nodes == null) || json.nodes.length === 0) {
        return {
          'error': 'no nodes'
        };
      }
      if (json.blacklist != null) {
        this.blacklist = json.blacklist;
      }
      if (json.explored != null) {
        this.explored = json.explored;
      }
      i = 0;
      _ref = json.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        d = _ref[_i];
        this.normalize_id(d);
        d.x = this.w * (i % 10) / 10;
        d.y = i * this.h / n;
        i += 1;
      }
      _ref1 = json.links;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        d = _ref1[_j];
        d.source = this.normalize_text(d.source);
        d.target = this.normalize_text(d.target);
      }
      this.nodes = json.nodes;
      this.links = json.links;
      this.root = json.nodes[0];
      this.theFocus = this.root;
      this.root.isHigh = true;
      n = this.nodes.length;
      this.root.x = this.w / 2;
      this.root.y = this.h / 2;
      this.force.nodes(this.nodes).links(this.links);
      this.update();
    };

    nest.prototype.getR = function(d) {
      if (d.type === "SearchProvider") {
        return 15;
      }
      return 5;
    };

    nest.prototype.tick = function(e) {
      var _this = this;
      this.node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }).attr('clip-path', function(d) {
        return "url(#clip-" + d.index + ")";
      });
      this.vis.select('.marker').attr('x', this.theFocus.x - 22).attr({
        'y': this.theFocus.y - 45
      });
      this.link.attr("x1", function(d) {
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
        this.node.classed('hidden', function(d) {
          return d.type === "referData";
        });
        this.link.classed('hidden', function(d) {
          return d.target.type === "referData";
        });
        return this.text.classed('hidden', function(d) {
          return d.type === "referData";
        });
      } else {
        this.node.classed('hidden', false);
        this.link.classed('hidden', false);
        return this.text.classed('hidden', false);
      }
    };

    nest.prototype.color = function(d) {
      var i, res;
      i = nest.colors.indexOf(d.type);
      res = "black";
      if (d.type === "SearchProvider") {
        return "#dd0000";
      }
      res = this.palette(d.type);
      if (d.distance_rank != null) {
        res = d3.hsl(res).brighter(d.distance_rank * .1).toString();
      }
      return res;
    };

    nest.prototype.dblclick = function(d) {
      var data;
      if (d.type === "referData" || d.type === "doc") {
        if (window.doc_handler != null) {
          window.doc_handler(d);
        } else {
          window.open(d.url != null ? d.url : d.name);
        }
        return;
      }
      if (d.type === "doc") {
        window.open(d.url != null ? d.url : d.name);
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
      $.post("/explore/", JSON.stringify(data), this.expand, 'json');
    };

    nest.prototype.remove = function(d) {
      var link, _i, _len, _ref;
      if (d === this.root) {
        alert("不能删除根节点");
        this.shiftPressed = false;
        return;
      }
      _ref = this.degree[d.index];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        this.links.remove(link);
        if (this.degree[link.target.index].length === 1 && link.target !== this.root) {
          this.nodes.remove(link.target);
        }
        if (this.degree[link.source.index].length === 1 && link.source !== this.root) {
          this.nodes.remove(link.source);
        }
      }
      this.nodes.remove(d);
      this.blacklist.push(d.id);
      this.clip = this.clip.data([]);
      this.clip.exit().remove();
      if (window.click_handler != null) {
        window.click_handler(this.root);
      }
    };

    nest.prototype.click = function(d) {
      d.fixed = false;
      if (this.shiftPressed) {
        this.remove(d);
        this.update();
      } else if (this.ctrlPressed) {
        this.dblclick(d);
        this.update();
      } else {
        this.highlight(d);
        this.update(false);
        if (window.click_handler != null) {
          window.click_handler(d);
        }
      }
    };

    nest.prototype.explore = function(data) {
      var l, source, target, x, _i, _j, _len, _len1, _ref, _ref1;
      _ref = data.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        this.normalize_id(x);
        this.nodes.push(x);
      }
      _ref1 = data.links;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        l = _ref1[_j];
        this.links.push(l);
        source = this.nodes[l.source];
        target = this.nodes[l.target];
        target.x = source.x + Math.random() * 100 - 50;
        target.y = source.y + Math.random() * 100 - 50;
      }
      this.update();
    };

    nest.prototype.expand = function(data) {
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
          if (this.matrix[source.index][target.index] == null) {
            this.links.push({
              "source": source,
              "target": target
            });
          }
        }
        source.isSearching = false;
      }
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
    };

    nest.prototype.update = function(start_force) {
      var e, i, j, l, n, nod, nodeEnter, x, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2, _ref3,
        _this = this;
      if (start_force == null) {
        start_force = true;
      }
      this.matrix = [];
      this.degree = [];
      this.hNode = {};
      n = this.nodes.length;
      for (i = _i = 0, _ref = n - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.hNode[this.nodes[i].id] = this.nodes[i];
        this.degree.push([]);
        this.matrix.push([]);
        for (j = _j = 0, _ref1 = n - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
          this.matrix[i].push(null);
        }
      }
      _ref2 = this.links;
      for (_k = 0, _len = _ref2.length; _k < _len; _k++) {
        l = _ref2[_k];
        this.normalize_link(l);
      }
      this.link = this.link.data(this.links);
      this.link.enter().insert("line", ".node").classed("link", true);
      this.link.exit().remove();
      this.node = this.vis.selectAll(".node").data(this.nodes, function(d) {
        return d.id;
      });
      _this = this;
      nodeEnter = this.node.enter().append("g").attr("class", "node").on("click", this.click).on('dblclick', this.dblclick).classed("highlight", function(d) {
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
      this.node.exit().remove();
      this.vis.selectAll(".node path").attr("r", this.getR).style("fill", this.color);
      this.vis.selectAll(".search-img").remove();
      this.vis.selectAll(".node path").filter(function(d) {
        return d.isSearching;
      }).append("animate").attr("attributeName", 'cx').attr("begin", '0s').attr("dur", '0.1s').attr("from", '-5').attr("to", '5').attr("fill", 'remove').attr("repeatCount", 'indefinite').classed("search-img", true);
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
      }).style("font-size", (1 / this.scale) + "em").attr("transform", function(d) {
        var dx;
        dx = d.x + _this.getR(d) + 5 * _this.scale;
        return "translate(" + dx + "," + d.y + ")";
      });
      if (this.flag) {
        this.text.classed("hidden", function(d) {
          return d.type === "referData";
        });
      }
      this.text.exit().remove();
      if (start_force) {
        this.force.start();
      }
      _ref3 = this.links;
      for (_l = 0, _len1 = _ref3.length; _l < _len1; _l++) {
        x = _ref3[_l];
        try {
          this.degree[x.source.index].push(x);
          this.degree[x.target.index].push(x);
          this.matrix[x.source.index][x.target.index] = x;
        } catch (_error) {
          e = _error;
          console.log(x);
        }
      }
      this.node.classed("highlight", function(d) {
        return d.isHigh === true;
      });
      this.link.classed("highlight", function(d) {
        return d.isHigh === true;
      });
      for (nod in this.hNode) {
        this.position_cache[nod] = {
          'x': this.hNode[nod].x,
          'y': this.hNode[nod].y
        };
      }
    };

    return nest;

  })();

  Array.prototype.remove = function(b) {
    var a;
    a = this.indexOf(b);
    if (a >= 0) {
      this.splice(a, 1);
      return true;
    }
    return false;
  };

  String.prototype.hashCode = function() {
    var hash, i, _i, _ref;
    hash = 0.0;
    for (i = _i = 0, _ref = this.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (!isNaN(this.charCodeAt(i))) {
        hash += this.charCodeAt(i);
      }
    }
    return hash;
  };

  if (typeof define === "function" && (define.amd != null)) {
    define("nest", ['jquery', 'd3'], function($, ff) {
      return nest;
    });
  }

}).call(this);
