var cacheIt, click, color, draw, flatten, getR, r, redraw, stroke_width, tick, update;

cacheIt = function(e) {
  r.ctrlPressed = e.ctrlKey;
  r.altPressed = e.altKey;
  return r.shiftPressed = e.shiftKey;
};

redraw = function() {
  return r.vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
};

draw = function(json) {
  r.root = json;
  r.root.fixed = true;
  r.root.x = r.w / 2;
  r.root.y = r.h / 2 - 80;
  r.force = d3.layout.force().on("tick", tick).charge(function(d) {
    if (d._children) {
      return -d.size / 50;
    } else {
      return -120;
    }
  }).linkDistance(function(d) {
    if (d.target._children) {
      return 100;
    } else {
      return 50;
    }
  }).size([r.w, r.h - 160]);
  return update();
};

update = function() {
  var links, nodes;
  r.vis.selectAll(".node").remove();
  nodes = flatten(r.root);
  links = d3.layout.tree().links(nodes);
  r.link = r.vis.selectAll(".link").data(links, function(d) {
    return d.target.id;
  });
  r.link.enter().insert("path", ".node").attr("class", "link");
  r.link.exit().remove();
  r.node = r.vis.selectAll(".node").data(nodes, function(d) {
    return d.id;
  }).enter().append("g").attr("class", "node").on("click", click).call(r.force.drag);
  r.node.append("circle").attr("cx", function(d) {
    return 0;
  }).attr("cy", function(d) {
    return 0;
  }).attr("r", getR).style("fill", color).style("stroke-width", stroke_width).transition().attr("r", getR);
  r.node.append("title").text(function(d) {
    return d.name;
  });
  r.node.filter(function(d) {
    return d.isSelected;
  }).append("image").attr("x", function(d) {
    return -1.2 * 32 * getR(d) / 15.0;
  }).attr("y", function(d) {
    return -1.2 * 32 * getR(d) / 15.0;
  }).attr("width", function(d) {
    return 1.2 * 64 * getR(d) / 15.0;
  }).attr("height", function(d) {
    return 1.2 * 64 * getR(d) / 15.0;
  }).attr("xlink:href", "/static/images/loader.gif");
  return r.force.nodes(nodes).links(links).start();
};

getR = function(d) {
  var x;
  if (d.type === "referData" || d.type === "expandRead") {
    return 2;
  }
  return 10;
  x = d.level;
  if (x > 4) {
    x = 4;
  }
  return 15 - x * 3;
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
  }).attr("d", r.diag);
  return r.node.attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  });
};

color = function(d) {
  if (r.colors[d.type]) {
    return r.colors[d.type];
  } else {
    return "black";
  }
};

stroke_width = function(d) {
  if (d._children != null) {
    return "2px";
  } else {
    return ".5px";
  }
};

click = function(d) {
  var children, url, x, _i, _len, _ref;
  if (d.type === "expandRead" || d.type === "referData") {
    window.open(d.url != null ? d.url : d.name);
    return;
  }
  if (r.shiftPressed) {
    if (d.parent != null) {
      d.parent.children.remove(d);
    }
  } else if (r.altPressed) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  } else if (r.ctrlPressed) {
    if (!d.isSelected) {
      d.isSelected = false;
    }
    d.isSelected = !d.isSelected;
    if (d.isSelected) {
      children = [d.name];
      if (d.children) {
        _ref = d.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          children.push(x.name);
        }
      }
      children = children.join("||");
      url = "/search/" + d.name + "?children=" + children;
      console.log(url);
      d3.json(url, function(data) {
        var i, _j, _len1;
        if (!d.children) {
          d.children = [];
        }
        i = 0;
        for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
          x = data[_j];
          d.children.push(x);
          i += 1;
          if (i === 5) {
            break;
          }
        }
        d.isSelected = false;
        return update();
      });
    }
  }
  return update();
};

flatten = function(root) {
  var i, nodes, recurse;
  recurse = function(node, level, parent) {
    node.level = level;
    node.parent = parent;
    if (node.children) {
      node.size = node.children.reduce(function(p, v) {
        return p + recurse(v, level + 1, node);
      }, 0);
    }
    node.id = ++i;
    nodes.push(node);
    return node.size;
  };
  nodes = [];
  i = 0;
  root.size = recurse(root, 0, null);
  return nodes;
};

r = typeof exports !== "undefined" && exports !== null ? exports : this;

r.w = $(this).width();

r.h = $(this).height();

r.diag = d3.svg.diagonal().projection(function(d) {
  return [d.x, d.y];
});

r.ctrlPressed = false;

r.altPressed = false;

r.shiftPressed = false;

Array.prototype.remove = function(b) {
  var a;
  a = this.indexOf(b);
  if (a >= 0) {
    this.splice(a, 1);
    return true;
  }
  return false;
};

document.onkeydown = cacheIt;

document.onkeyup = cacheIt;

r.vis = d3.select("body").insert("svg:svg", "#tip").attr("width", r.w).attr("height", r.h).attr("viewBox", "0 0 " + r.w + " " + r.h).attr("pointer-events", "all").attr("stroke", "black").attr("preserveAspectRatio", "XMidYMid").append("svg:g").call(d3.behavior.zoom().on("zoom", redraw)).append("svg:g");

$(document).ready(function() {
  return $(window).resize(function() {
    r.w = $(this).width();
    r.h = $(this).height();
    return r.vis.attr("width", r.w).attr("height", r.h);
  });
});

r.vis.append("svg:rect").attr("width", r.w).attr("height", r.h).attr("fill", "none");

r.colors = {
  "baiduBaikeCrawler": "#2f5d8c",
  "expandRead": "#ad89cb",
  "hudongBaikeCrawler": "#6a895c",
  "referData": "#98c73c"
};

draw({
  "name": document.title,
  "size": 100
});
