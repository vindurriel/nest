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
    this.tick = __bind(this.tick, this);
    this.getR = __bind(this.getR, this);
    this.normalize_link = __bind(this.normalize_link, this);
    this.normalize = __bind(this.normalize, this);
    this.draw = __bind(this.draw, this);
    this.zoom = __bind(this.zoom, this);
    this.cacheIt = __bind(this.cacheIt, this);
    this.highlighted = __bind(this.highlighted, this);
    var _this = this;
    this.shapes = d3.svg.symbolTypes;
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
    this.vis = d3.select(this.container).append("svg:svg").style('width', 'inherit').style('height', 'inherit').attr("viewBox", "0 0 " + this.w + " " + this.h).attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", this.zoom)).on('dblclick.zoom', null).append("svg:g");
    this.link = this.vis.selectAll(".link");
    this.node = this.vis.selectAll(".node");
    this.force = d3.layout.force().on("tick", this.tick).on('start', function() {
      return _this.start_time = new Date();
    }).on('end', function() {
      return console.log(new Date() - _this.start_time);
    }).charge(function(d) {
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

  nest.prototype.highlighted = function() {
    console.log(this.node.filter(function(d) {
      return d.isHigh;
    }));
    console.log(this.link.filter(function(d) {
      return d.isHigh;
    }));
  };

  nest.prototype.cacheIt = function(e) {
    this.ctrlPressed = e.ctrlKey;
    this.altPressed = e.altKey;
    this.shiftPressed = e.shiftKey;
    return true;
  };

  nest.prototype.zoom = function() {
    this.scale = d3.event.scale;
    this.vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + this.scale + ")");
    return this.vis.selectAll("text").style("font-size", (1 / this.scale) + "em");
  };

  nest.prototype.draw = function(json) {
    var n,
      _this = this;
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
    this.nodes = json.nodes;
    this.links = json.links;
    this.root = json.nodes[0];
    this.theFocus = this.root;
    this.root.isHigh = true;
    this.force.nodes(this.nodes).links(this.links);
    n = this.nodes.length;
    this.nodes.forEach(function(d, i) {
      _this.normalize_id(d);
      d.x = _this.w * (i % 10) / 10;
      d.y = i * _this.h / n;
    });
    this.root.x = this.w / 2;
    this.root.y = this.h / 2;
    this.force.nodes(this.nodes).links(this.links);
    this.update();
  };

  nest.prototype.normalize = function(x) {
    if (typeof x === "string" && (this.hNode[x] != null)) {
      return this.hNode[x];
    }
    return x;
  };

  nest.prototype.normalize_link = function(l) {
    l.source = this.normalize(l.source);
    l.target = this.normalize(l.target);
  };

  nest.prototype.getR = function(d) {
    if (d === this.theFocus) {
      return 5;
    }
    if (d.isHigh) {
      return 5;
    } else {
      return 5;
    }
  };

  nest.prototype.tick = function(e) {
    var cx, cy, k,
      _this = this;
    cx = this.theFocus.x;
    cy = this.theFocus.y;
    k = .05 * e.alpha;
    this.node.attr("transform", function(d) {
      d.x += (d.x - cx) * k;
      d.y += (d.y - cy) * k;
      return "translate(" + d.x + "," + d.y + ")";
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
    return this.text.attr("transform", function(d) {
      var angle, dx;
      angle = 10 * ((d.id.length + d.index) % 10 - 2);
      dx = d.x + _this.getR(d) + 5 * _this.scale;
      return "translate(" + dx + "," + d.y + ")rotate(" + angle + ")";
    });
  };

  nest.prototype.color = function(d) {
    var i, res;
    i = nest.colors.indexOf(d.type);
    res = "black";
    if (i >= 0) {
      res = this.palette(i + 1);
    } else {
      res = this.palette(d.type);
    }
    if (d.distance_rank != null) {
      res = d3.hsl(res).brighter(d.distance_rank * .1).toString();
    }
    return "#5297ee";
  };

  nest.prototype.dblclick = function(d) {
    var data;
    if (d.type === "referData") {
      window.open(d.url != null ? d.url : d.name);
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
      keys: d.id
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
    var i, link, n, _i, _len, _ref;
    if (d === this.root) {
      alert("不能删除根节点");
      this.shiftPressed = false;
      return;
    }
    n = this.nodes.length;
    i = d.index;
    _ref = this.degree[d.index];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      this.links.remove(link);
      if (this.degree[link.target.index].length === 1) {
        this.nodes.remove(link.target);
      }
      if (this.degree[link.source.index].length === 1) {
        this.nodes.remove(link.source);
      }
    }
    this.nodes.remove(d);
    this.blacklist.push(d.id);
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
      this.update();
      if (window.click_handler != null) {
        window.click_handler(d);
      }
    }
  };

  nest.prototype.normalize_id = function(x) {
    if (x.id == null) {
      x.id = "" + x.type + "_" + x.name;
    }
    return x;
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
    var i, id, l, link, n, rel, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4;
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
    i = d.index;
    _ref2 = this.degree[d.index];
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      link = _ref2[_k];
      link.isHigh = true;
      link.target.isHigh = true;
      link.source.isHigh = true;
    }
    if (this.existing_relation_links == null) {
      this.existing_relation_links = [];
    }
    if (this.relationships[d.type] != null) {
      _ref3 = this.relationships[d.type];
      for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
        rel = _ref3[_l];
        id = rel.id(d);
        if (this.hNode[id] == null) {
          n = {
            'id': id,
            'name': rel.name(d),
            'type': "relationship",
            'isHigh': true,
            'x': d.x + Math.random() * 100 - 50,
            'y': d.y + Math.random() * 100 - 50
          };
          this.nodes.push(n);
          l = {
            'source': d,
            'target': n,
            'isHigh': true
          };
          this.links.push(l);
          this.existing_relation_links.push(l);
        }
      }
      _ref4 = this.existing_relation_links;
      for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
        link = _ref4[_m];
        if (link.source === d) {
          continue;
        }
        if ((this.degree[link.target.index] != null) && this.degree[link.target.index].length > 1) {
          continue;
        }
        this.links.remove(link);
        this.nodes.remove(link.target);
      }
    }
  };

  nest.prototype.update = function(start_force) {
    var i, j, l, n, nod, nodeEnter, x, _i, _j, _k, _l, _len, _len1, _ref, _ref1, _ref2, _ref3,
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
    nodeEnter.append("path").attr('d', d3.svg.symbol().size(100).type(function(d) {
      return "circle";
      return _this.shapes[d.type.hashCode() % _this.shapes.length];
    })).style("fill", this.color);
    nodeEnter.append('title').text(function(d) {
      return d.name;
    });
    this.node.exit().remove();
    this.vis.selectAll(".node path").attr("r", this.getR).style("fill", this.color);
    this.vis.selectAll(".search-img").remove();
    this.vis.selectAll(".node path").filter(function(d) {
      return d.isSearching;
    }).append("animate").attr("attributeName", 'cx').attr("begin", '0s').attr("dur", '0.1s').attr("from", '-5').attr("to", '5').attr("fill", 'remove').attr("repeatCount", 'indefinite').classed("search-img", true);
    this.text = this.vis.selectAll('text').data(this.nodes.filter(function(d) {
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
    }).style("font-size", (1 / this.scale) + "em");
    this.text.exit().remove();
    if (start_force) {
      this.force.start();
    }
    _ref3 = this.links;
    for (_l = 0, _len1 = _ref3.length; _l < _len1; _l++) {
      x = _ref3[_l];
      this.degree[x.source.index].push(x);
      this.degree[x.target.index].push(x);
      this.matrix[x.source.index][x.target.index] = x;
    }
    this.node.classed("highlight", function(d) {
      return d.isHigh === true;
    });
    this.node.classed("focus", function(d) {
      return d === _this.theFocus;
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
