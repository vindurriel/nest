var cacheIt, click, color, dblclick, draw, expand, explore, getLinkName, getR, highlight, r, redraw, save, tick, update,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

cacheIt = function(e) {
  r.ctrlPressed = e.ctrlKey;
  r.altPressed = e.altKey;
  r.shiftPressed = e.shiftKey;
  return true;
};

redraw = function() {
  r.scale = d3.event.scale;
  r.vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + r.scale + ")");
  return r.vis.selectAll("text").style("font-size", (1 / r.scale) + "em");
};

draw = function(json) {
  var n;
  if ((json.nodes == null) || json.nodes.length === 0) {
    return;
  }
  if (json.blacklist != null) {
    r.blacklist = json.blacklist;
  }
  if (json.explored != null) {
    r.explored = json.explored;
  }
  r.legend = d3.select("#tip").insert("svg").selectAll("rect.leg").data([
    {
      "type": "artist"
    }, {
      "type": "album"
    }, {
      "type": "song"
    }, {
      "type": "relationship"
    }
  ]).enter().append('g').attr("transform", function(d, i) {
    return "translate(" + 10 + "," + (30 + i * 30) + ")";
  }).classed('leg', true);
  r.legend.append("circle").style("fill", color).style("r", "10px").attr('cx', '0').attr('cy', '0').attr('stroke-width', '1px');
  r.legend.append("text").text(function(d) {
    return d.type;
  }).attr("dx", '15').attr("dy", '3');
  r.nodes = json.nodes;
  r.links = json.links;
  r.root = json.nodes[0];
  r.theFocus = r.root;
  r.root.isHigh = true;
  r.force = d3.layout.force().on("end", function(d) {
    r.nodes.forEach(function(n) {
      if (n._fixed != null) {
        n.fixed = true;
      }
    });
  }).on("tick", tick).charge(function(d) {
    if (d.type === "referData") {
      return -20;
    } else {
      return -200;
    }
  }).linkDistance(20).linkStrength(function(d) {
    if (d.value != null) {
      return 1.0 - d.value;
    } else {
      return 0.1;
    }
  }).size([r.w, r.h]).nodes(r.nodes).links(r.links);
  n = r.nodes.length;
  if (json.no_position_init == null) {
    r.nodes.forEach(function(d, i) {
      var pos;
      if (d.id == null) {
        d.id = d.name;
      }
      if (__indexOf.call(d.id, '_') < 0) {
        d.id = "" + d.type + "_" + d.id;
      }
      if (d.fixed != null) {
        d.fixed = void 0;
        d._fixed = true;
      }
      if (position_cache[d.id] != null) {
        pos = position_cache[d.id];
        d.x = pos.x;
        d.y = pos.y;
      } else {
        d.x = r.w * (i % 10) / 10;
        d.y = i * r.h / n;
      }
    });
    r.root.x = r.w / 2;
    r.root.y = r.h / 2;
    r.root.fixed = true;
  }
  update();
};

getLinkName = function(source, target) {
  return "" + source.name + "->" + target.name;
};

update = function() {
  var drag, i, j, n, nod, nodeEnter, x, _i, _j, _k, _len, _ref, _ref1, _ref2;
  r.link = r.link.data(r.links);
  r.link.enter().insert("line", ".node").classed("link", true);
  r.link.exit().remove();
  r.node = r.vis.selectAll(".node").data(r.nodes, function(d) {
    return d.id;
  });
  drag = r.force.drag().on('dragend', function(d) {
    d.fixed = true;
  });
  nodeEnter = r.node.enter().append("g").attr("class", "node").on("click", click).on('mouseover', function(d) {
    d3.select(this).select('circle').attr("r", '13px');
  }).on('mouseout', function(d) {
    d3.select(this).select('circle').attr("r", getR(d));
  }).on('dblclick', dblclick).classed("highlight", function(d) {
    return d.isHigh === true;
  }).attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }).call(drag);
  nodeEnter.append("circle").attr("cx", 0).attr("cy", 0).attr("r", getR).style("fill", color);
  r.node.exit().remove();
  d3.selectAll(".node circle").attr("r", getR).style("fill", color);
  d3.selectAll(".node text").remove();
  r.node.filter(function(d) {
    return d.isHigh;
  }).append('text').attr("class", "notclickable desc").text(function(d) {
    return d.name;
  });
  d3.selectAll(".node text").attr("dx", function(d) {
    return getR(d) + 5;
  }).classed("show", function(d) {
    return d === r.theFocus;
  }).attr("font-size", (1 / r.scale) + "em");
  d3.selectAll(".search-img").remove();
  d3.selectAll(".node circle").filter(function(d) {
    return d.isSearching;
  }).append("animate").attr("attributeName", 'cx').attr("begin", '0s').attr("dur", '0.1s').attr("from", '-5').attr("to", '5').attr("fill", 'remove').attr("repeatCount", 'indefinite').classed("search-img", true);
  r.force.start();
  r.matrix = [];
  r.degree = [];
  r.hNode = {};
  n = r.nodes.length;
  for (i = _i = 0, _ref = n - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
    r.hNode[r.nodes[i].id] = r.nodes[i];
    r.degree.push([]);
    r.matrix.push([]);
    for (j = _j = 0, _ref1 = n - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; j = 0 <= _ref1 ? ++_j : --_j) {
      r.matrix[i].push(null);
    }
  }
  _ref2 = r.links;
  for (_k = 0, _len = _ref2.length; _k < _len; _k++) {
    x = _ref2[_k];
    r.degree[x.source.index].push(x);
    r.degree[x.target.index].push(x);
    r.matrix[x.source.index][x.target.index] = x;
  }
  r.node.classed("highlight", function(d) {
    return d.isHigh === true;
  });
  r.link.classed("highlight", function(d) {
    return d.isHigh === true;
  });
  r.node.classed('hidden', function(d) {
    return d.type === "referData";
  });
  r.link.classed('hidden', function(d) {
    return d.target.type === "referData";
  });
  for (nod in r.hNode) {
    position_cache[nod] = {
      'x': r.hNode[nod].x,
      'y': r.hNode[nod].y
    };
  }
};

getR = function(d) {
  if (d === r.theFocus) {
    return 15;
  }
  if (d.isHigh) {
    return 10;
  } else {
    return 5;
  }
};

tick = function() {
  r.node.attr("transform", function(d) {
    var radius;
    radius = getR(d);
    return "translate(" + d.x + "," + d.y + ")";
  });
  return r.link.attr("x1", function(d) {
    return d.source.x;
  }).attr("y1", function(d) {
    return d.source.y;
  }).attr("x2", function(d) {
    return d.target.x;
  }).attr("y2", function(d) {
    return d.target.y;
  });
};

color = function(d) {
  var i, res;
  i = r.colors.indexOf(d.type);
  res = "black";
  if (i >= 0) {
    res = r.palette(i + 1);
  } else {
    res = r.palette(d.type);
  }
  if (d.distance_rank != null) {
    res = d3.hsl(res).brighter(d.distance_rank * .8).toString();
  }
  return res;
};

dblclick = function(d) {
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
  if ((d.url != null) && d.url.indexOf("/subview/") >= 0) {
    data.url = d.url;
    data.is_subview = true;
  }
  $.post("/explore/", JSON.stringify(data), expand, 'json');
};

click = function(d) {
  var i, link, n, _i, _len, _ref;
  d.fixed = false;
  if (r.shiftPressed) {
    if (d === r.root) {
      alert("不能删除根节点");
      r.shiftPressed = false;
      return;
    }
    n = r.nodes.length;
    i = d.index;
    _ref = r.degree[d.index];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      r.links.remove(link);
      if (r.degree[link.target.index].length === 1) {
        r.nodes.remove(link.target);
      }
      if (r.degree[link.source.index].length === 1) {
        r.nodes.remove(link.source);
      }
    }
    r.nodes.remove(d);
    r.blacklist.push(d.id);
    update();
  } else if (r.altPressed) {
    save().done(function() {
      return window.location.href = "/model/" + d.id;
    });
  } else if (r.ctrlPressed) {
    dblclick(d);
    update();
  } else {
    highlight(d);
    update();
    if (r.click_handler != null) {
      r.click_handler(d);
    }
  }
};

explore = function(data) {
  var l, source, target, x, _i, _j, _len, _len1, _ref, _ref1;
  _ref = data.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    if (x.id == null) {
      x.id = x.name;
    }
    if (x.id.indexOf('_') < 0) {
      x.id = "" + x.type + "_" + x.id;
    }
    r.nodes.push(x);
  }
  _ref1 = data.links;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    l = _ref1[_j];
    r.links.push(l);
    source = r.nodes[l.source];
    target = r.nodes[l.target];
    target.x = source.x + Math.random() * 100 - 50;
    target.y = source.y + Math.random() * 100 - 50;
  }
  update();
};

expand = function(data) {
  var i, id, source, target, x, _i, _len, _ref;
  for (id in data) {
    source = r.hNode[id];
    if (source == null) {
      continue;
    }
    i = 0;
    _ref = data[id];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      if (x.id == null) {
        x.id = x.name;
      }
      x.id = "" + x.type + "_" + x.id;
      if (r.blacklist.indexOf(x.id) >= 0) {
        continue;
      }
      target = r.hNode[x.id];
      if (target == null) {
        if (i === 5 && x.type !== "referData") {
          continue;
        }
        r.nodes.push(x);
        x.x = source.x + Math.random() * 100 - 50;
        x.y = source.y + Math.random() * 100 - 50;
        i += 1;
        target = x;
      }
      if (r.matrix[source.index][target.index] == null) {
        r.links.push({
          "source": source,
          "target": target
        });
      }
    }
    source.isSearching = false;
  }
  update();
};

highlight = function(d) {
  var i, id, l, link, n, rel, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4;
  _ref = r.links;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    x.isHigh = false;
  }
  _ref1 = r.nodes;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    x = _ref1[_j];
    x.isHigh = false;
  }
  d.isHigh = true;
  r.theFocus = d;
  i = d.index;
  _ref2 = r.degree[d.index];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    link = _ref2[_k];
    link.isHigh = true;
    link.target.isHigh = true;
    link.source.isHigh = true;
  }
  if (r.existing_relation_links == null) {
    r.existing_relation_links = [];
  }
  if (r.relationships[d.type] != null) {
    _ref3 = r.relationships[d.type];
    for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
      rel = _ref3[_l];
      id = rel.id(d);
      if (r.hNode[id] == null) {
        n = {
          'id': id,
          'name': rel.name(d),
          'type': "relationship",
          'isHigh': true,
          'x': d.x + Math.random() * 100 - 50,
          'y': d.y + Math.random() * 100 - 50
        };
        r.nodes.push(n);
        l = {
          'source': d,
          'target': n,
          'isHigh': true
        };
        r.links.push(l);
        r.existing_relation_links.push(l);
      }
    }
    _ref4 = r.existing_relation_links;
    for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
      link = _ref4[_m];
      if (link.source === d) {
        continue;
      }
      if ((r.degree[link.target.index] != null) && r.degree[link.target.index].length > 1) {
        continue;
      }
      r.links.remove(link);
      r.nodes.remove(link.target);
    }
  }
};

save = function() {
  var fname, l, n, p, prop_node, res, x, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
  res = {
    "nodes": [],
    "links": [],
    "blacklist": r.blacklist
  };
  fname = prompt("请输入要保存的名字", r.root.id);
  prop_node = "id name value index type url fixed distance_rank img".split(" ");
  _ref = r.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    n = {};
    for (_j = 0, _len1 = prop_node.length; _j < _len1; _j++) {
      p = prop_node[_j];
      if (x[p] != null) {
        n[p] = x[p];
      }
    }
    res.nodes.push(n);
  }
  _ref1 = r.links;
  for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
    x = _ref1[_k];
    l = {
      "source": x.source.index,
      "target": x.target.index
    };
    res.links.push(l);
  }
  res = JSON.stringify(res);
  return $.ajax({
    "url": "/model/" + fname,
    "type": "POST",
    "contentType": "json",
    "data": res
  });
};

Array.prototype.remove = function(b) {
  var a;
  a = this.indexOf(b);
  if (a >= 0) {
    this.splice(a, 1);
    return true;
  }
  return false;
};

r = typeof exports !== "undefined" && exports !== null ? exports : this;

r.nest = function(options) {
  var container;
  r.hNode = {};
  container = options.container || "#container";
  r.w = options.width || $(container).width();
  r.h = options.height || $(container).height();
  r.ctrlPressed = false;
  r.altPressed = false;
  r.shiftPressed = false;
  r.blacklist = [];
  r.explored = [];
  r.vis = d3.select(container).append("svg:svg").attr("viewBox", "0 0 " + r.w + " " + r.h).attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", redraw)).on('dblclick.zoom', null).append("svg:g");
  r.link = r.vis.selectAll(".link");
  r.node = r.vis.selectAll(".node");
  r.palette = d3.scale.category20();
  r.colors = ["song", "artist", "user", "album", 'relationship', "baiduBaikeCrawler", "hudongBaikeCrawler", "referData"];
  r.position_cache = {};
  r.highlighted = function() {
    console.log(r.node.filter(function(d) {
      return d.isHigh;
    }));
    console.log(r.link.filter(function(d) {
      return d.isHigh;
    }));
  };
  return r.relationships = {
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
};
