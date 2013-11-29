var cacheIt, click, color, dblclick, draw, expand, getLinkName, getR, highlight, r, redraw, save, tick, update,
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
  r.root.fixed = false;
  r.root.isHigh = true;
  r.force = d3.layout.force().on("end", function(d) {
    return r.root.fixed = true;
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
  r.nodes.forEach(function(d, i) {
    if (d.id == null) {
      d.id = d.name;
    }
    if (__indexOf.call(d.id, '_') < 0) {
      d.id = "" + d.type + "_" + d.id;
    }
    d.x = r.w * (i % 10) / 10;
    return d.y = i * r.h / n;
  });
  return update();
};

getLinkName = function(source, target) {
  return "" + source.name + "->" + target.name;
};

update = function() {
  var drag, i, j, n, nodeEnter, x, _i, _j, _k, _len, _ref, _ref1, _ref2, _results;
  r.link = r.link.data(r.links);
  r.link.enter().insert("line", ".node").classed("link", true);
  r.link.exit().remove();
  r.node = r.vis.selectAll(".node").data(r.nodes, function(d) {
    return d.id;
  }).classed("highlight", function(d) {
    return d.isHigh === true;
  });
  drag = r.force.drag().on('dragstart', function(d) {
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
  r.node.classed("highlight", function(d) {
    return d.isHigh === true;
  });
  r.link.classed("highlight", function(d) {
    return d.isHigh === true;
  });
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
  _results = [];
  for (_k = 0, _len = _ref2.length; _k < _len; _k++) {
    x = _ref2[_k];
    r.degree[x.source.index].push(x);
    r.degree[x.target.index].push(x);
    _results.push(r.matrix[x.source.index][x.target.index] = x);
  }
  return _results;
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
    res = d3.hsl(res).brighter(d.distance_rank).toString();
  }
  return res;
};

dblclick = function(d) {
  var id, url;
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
  } else {
    d.isSearching = true;
  }
  if (!d.isSearching) {
    return;
  }
  id = d.id;
  url = "/roaming/" + id;
  if ((d.url != null) && d.url.indexOf("/subview/") >= 0) {
    url += "?url=" + encodeURIComponent(d.url);
  }
  d3.json(url, expand);
  return update();
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
    return update();
  } else if (r.altPressed) {
    return save().done(function() {
      return window.location.href = "/model/" + d.id;
    });
  } else if (r.ctrlPressed) {
    dblclick(d);
    return update();
  } else {
    highlight(d);
    update();
    if (r.click_handler != null) {
      return r.click_handler(d);
    }
  }
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
      x.id = "" + x.type + "_" + x.id;
      if (x.id == null) {
        x.id = x.name;
      }
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
  return update();
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
  var res, x, _i, _j, _len, _len1, _ref, _ref1;
  res = {
    "id": r.root.id,
    "name": r.root.name,
    "type": r.root.type,
    "nodes": [],
    "links": [],
    "blacklist": r.blacklist
  };
  _ref = r.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    res.nodes.push({
      "id": x.id,
      "name": x.name,
      "value": x.value,
      "index": x.index,
      "type": x.type,
      "url": x.url
    });
  }
  _ref1 = r.links;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    x = _ref1[_j];
    res.links.push({
      "name": x.name,
      "source": x.source.index,
      "target": x.target.index
    });
  }
  res = JSON.stringify(res);
  return $.ajax({
    "url": "/model/" + r.root.id,
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
  r.vis = d3.select(container).append("svg:svg").attr("viewBox", "0 0 " + r.w + " " + r.h).attr("pointer-events", "all").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", redraw)).on('dblclick.zoom', null).append("svg:g");
  r.link = r.vis.selectAll(".link");
  r.node = r.vis.selectAll(".node");
  r.palette = d3.scale.category10();
  r.colors = ["song", "artist", "user", "album", 'relationship', "baiduBaikeCrawler", "hudongBaikeCrawler", "referData"];
  r.highlighted = function() {
    return r.node.filter(function(d) {
      return d.isHigh;
    });
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
