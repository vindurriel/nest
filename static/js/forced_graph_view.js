// Generated by CoffeeScript 1.6.3
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
  return d3.selectAll("text").style("font-size", (1 / r.scale) + "em");
};

draw = function(json) {
  var n;
  if (json.blacklist != null) {
    r.blacklist = json.blacklist;
  }
  r.legend = r.vis.selectAll("rect.leg").data([
    {
      "type": "artist"
    }, {
      "type": "album"
    }, {
      "type": "song"
    }
  ]).enter().append('g').attr("transform", function(d, i) {
    return "translate(" + 100 + "," + (50 + i * 70) + ")";
  }).classed('leg', true);
  r.legend.append("circle").style("fill", color).attr("r", "10px").attr('cx', '0').attr('cy', '0');
  r.legend.append("text").text(function(d) {
    return d.type;
  }).attr("dx", '15').attr("dy", '3');
  r.nodes = json.nodes;
  r.links = json.links;
  r.root = json.nodes[0];
  r.theFocus = r.root;
  r.root.fixed = false;
  r.root.isHigh = true;
  r.force = d3.layout.force().on("tick", tick).charge(function(d) {
    if (d.type === "referData") {
      return -20;
    } else {
      return -200;
    }
  }).linkDistance(20).linkStrength(.1).size([r.w, r.h]).nodes(r.nodes).links(r.links);
  n = r.nodes.length;
  r.nodes.forEach(function(d, i) {
    if (d.id == null) {
      d.id = d.name;
    }
    d.x = i * r.w / n;
    return d.y = i * r.h / n;
  });
  return update();
};

getLinkName = function(source, target) {
  return "" + source.name + "->" + target.name;
};

update = function() {
  var i, j, n, nodeEnter, x, _i, _j, _k, _len, _ref, _ref1, _ref2, _results;
  r.link = r.link.data(r.links).classed("highlight", function(d) {
    return d.isHigh === true;
  });
  r.link.enter().insert("line", ".node").classed("link", true);
  r.link.exit().remove();
  r.node = r.vis.selectAll(".node").data(r.nodes, function(d) {
    return d.id;
  }).classed("highlight", function(d) {
    return d.isHigh === true;
  });
  nodeEnter = r.node.enter().append("g").attr("class", "node").on("click", click).on('dblclick', dblclick).classed("highlight", function(d) {
    return d.isHigh === true;
  }).attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  }).call(r.force.drag);
  nodeEnter.append("circle").attr("cx", 0).attr("cy", 0).attr("r", getR).style("fill", color);
  nodeEnter.append("text").attr("class", "notclickable desc").text(function(d) {
    return d.name;
  });
  r.node.exit().remove();
  d3.selectAll(".node circle").attr("r", getR).style("fill", color);
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
  r.link.attr("x1", function(d) {
    return d.source.x;
  }).attr("y1", function(d) {
    return d.source.y;
  }).attr("x2", function(d) {
    return d.target.x;
  }).attr("y2", function(d) {
    return d.target.y;
  });
  return r.node.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
};

color = function(d) {
  var i;
  i = r.colors.indexOf(d.type);
  if (i >= 0) {
    return r.palette(i + 1);
  }
  return r.palette(0);
};

dblclick = function(d) {
  var id, s, t, url;
  if (d.type === "referData") {
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
  t = d.type;
  id = d.id;
  if (d.type === "relationship") {
    s = d.id.split('_');
    t = s[0];
    id = s[1];
  }
  url = "/roaming/" + t + "s/" + id;
  d3.json(url, expand);
  return update();
};

click = function(d) {
  var i, link, n, _i, _len, _ref;
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
      return window.location.href = "/model/" + d.name;
    });
  } else if (r.ctrlPressed) {
    dblclick(d);
    return update();
  } else {
    highlight(d);
    if (d.type !== 'relationship') {
      history.pushState({}, d.name, "/model/" + d.type + "_" + d.id);
    }
    return update();
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
      if (x.id == null) {
        x.id = x.name;
      }
      if (r.blacklist.indexOf(x.id) >= 0) {
        continue;
      }
      if (x.type === "referData") {
        if (r.hNode[x.id] == null) {
          x.x = source.x + 10;
          x.y = source.y + 10;
          r.nodes.push(x);
          r.links.push({
            "source": source,
            "target": x
          });
        }
      } else {
        target = x;
        if (r.hNode[x.id] == null) {
          if (i === 5) {
            continue;
          }
          r.nodes.push(x);
          x.x = source.x + 10;
          x.y = source.y + 10;
          i += 1;
        } else {
          target = r.hNode[x.id];
        }
        if (r.matrix[source.index][target.index] == null) {
          r.links.push({
            "source": source,
            "target": target
          });
        }
      }
    }
    source.isSearching = false;
  }
  return update();
};

highlight = function(d) {
  var i, link, relationships, tmp, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2;
  _ref = r.links;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    x.isHigh = false;
  }
  tmp = [];
  relationships = [];
  _ref1 = r.nodes;
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    x = _ref1[_j];
    x.isHigh = false;
    if (x.type === "relationship") {
      relationships.push(x);
    }
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
  if (d.type === "artist") {
    r.nodes.push({
      'id': 'hotsong_' + d.id,
      'name': "热门歌曲",
      'type': 'relationship',
      'isHigh': true,
      'x': d.x + Math.random() * 100 - 50,
      'y': d.y + Math.random() * 100 - 50
    });
    r.links.push({
      'source': d,
      'target': r.nodes.slice(-1)[0],
      'isHigh': true
    });
    r.nodes.push({
      'id': 'similar_' + d.id,
      'name': "相似艺术家",
      'type': 'relationship',
      'isHigh': true,
      'x': d.x + 10,
      'y': d.y + 10
    });
    r.links.push({
      'source': d,
      'target': r.nodes.slice(-1)[0],
      'isHigh': true
    });
    for (_l = 0, _len3 = relationships.length; _l < _len3; _l++) {
      x = relationships[_l];
      r.nodes.remove(x);
      r.links.remove(r.degree[x.index][0]);
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
    "url": "/model/" + r.root.type + "_" + r.root.id,
    "type": "POST",
    "contentType": "json",
    "data": res
  });
};

r = typeof exports !== "undefined" && exports !== null ? exports : this;

r.hNode = {};

r.w = $(window).width();

r.h = $(window).height();

r.ctrlPressed = false;

r.altPressed = false;

r.shiftPressed = false;

r.blacklist = [];

Array.prototype.remove = function(b) {
  var a;
  a = this.indexOf(b);
  if (a >= 0) {
    this.splice(a, 1);
    return true;
  }
  return false;
};

r.scale = 1;

r.vis = d3.select("#container").append("svg:svg").attr("viewBox", "0 0 " + r.w + " " + r.h).attr("pointer-events", "all").call(d3.behavior.zoom().scaleExtent([0.5, 10]).on("zoom", redraw)).on('dblclick.zoom', null).append("svg:g");

r.link = r.vis.selectAll(".link");

r.node = r.vis.selectAll(".node");

$(document).ready(function() {
  var id, query, s, type;
  $(document).keydown(cacheIt);
  $(document).keyup(cacheIt);
  $("#btn_tip").click(function() {
    return $("#tip").slideToggle(200);
  });
  $("#btn_save").click(function() {
    return save().done(function() {
      return alert("保存完成");
    }).fail(function(d, e) {
      return alert(e);
    });
  });
  $("#btn_search").click(function() {
    var id, query, s, type;
    query = $("#q").val();
    if (__indexOf.call(query, ":") >= 0) {
      query = query.replace(":", "_");
    }
    id = query;
    type = "unknown";
    if (__indexOf.call(query, "_") >= 0) {
      s = query.split("_");
      type = s[0];
      id = s[1];
    }
    return $.getJSON("/model/load/" + query, function(d) {
      if (!d || (d.error != null)) {
        return $.getJSON("/info/" + type + "s/" + id, function(d) {
          if (!d || (d.error != null)) {
            alert(d.error);
            return;
          }
          return draw(d);
        });
      } else {
        return draw(d);
      }
    });
  });
  query = document.title;
  type = "unknown";
  if (__indexOf.call(query, ":") >= 0) {
    query = query.replace(":", "_");
  }
  if (__indexOf.call(query, "_") >= 0) {
    s = query.split("_");
    type = s[0];
    id = s[1];
  }
  return $.getJSON("/model/load/" + query, function(d) {
    if (!d || (d.error != null)) {
      return $.getJSON("/info/" + type + "s/" + id, function(d) {
        if (!d || (d.error != null)) {
          alert(d.error);
          return;
        }
        return draw(d);
      });
    } else {
      return draw(d);
    }
  });
});

r.palette = d3.scale.category20();

r.colors = ["baiduBaikeCrawler", "hudongBaikeCrawler", "referData", "song", "artist", "user", "album", 'relationship'];
