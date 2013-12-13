var get_selected_services,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.t_item_action = function(d) {
  return "<a class=\"button small\" href=\"#\">收藏</a>\n<a class=\"button small\" href=\"#\">分享</a>";
};

window.list = function(d) {
  var a, color, err, s, t_list_item, x, _i, _len, _ref;
  t_list_item = function(d) {
    var color, details, i, imgurl;
    details = d.content != null ? d.content : "";
    i = Math.floor(Math.random() * (10 - 0 + 1));
    color = window.palette(d.type);
    imgurl = "";
    if (d.img != null) {
      imgurl = d.img;
    }
    return "<div class=\"list-item normal\">\n  <h2 class=\"item-headline\">\n    <span style=\"border-left:" + color + " solid 5px;\">&nbsp;</span>\n    <a href=\"" + d.url + "\">" + d.name + "</a>\n  </h2>\n  <span class=\"item-prop\">" + d.type + " </span>\n  <div>\n    <img class=\"item-image\" src=\"" + imgurl + "\"/>\n  </div>\n  <p class=\"item-detail\">" + details + "</p>\n</div>";
  };
  try {
    $("#list-container").masonry("destroy");
  } catch (_error) {
    err = _error;
    a = err;
  }
  $(".list-item.normal").remove();
  color = window.palette(d.type);
  $("#list-container").append(t_list_item(d));
  $("#list-container div:last-child").addClass('selected_info');
  if (d.nodes.length > 1) {
    return;
  }
  _ref = d.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    s = t_list_item(x);
    $("#list-container").append(s);
  }
  $("#list-container").masonry({
    'itemSelector': '.list-item'
  });
  $("#list-container").imagesLoaded().done(function() {
    $("#list-container").masonry({
      'itemSelector': '.list-item'
    });
  });
};

window.click_handler = function(d) {
  var container, detail, link, n, value, _i, _len, _ref;
  $(".selected_info .item-headline a").text(d.name);
  $(".selected_info .item-prop").text(d.type);
  if (d.type === "doc") {
    $(".selected_info .item-headline a").attr('href', d.url);
    container = ".selected_info .item-detail";
    value = window.degree[d.index][0].value;
    $(container).empty().append("<p>到聚类中心的距离：" + value + "</p>");
    $.getJSON("/keyword/" + d.name, function(res) {
      var data, x;
      data = [];
      for (x in res.keyword) {
        data.push({
          'k': x,
          'v': res.keyword[x]
        });
      }
      renderBarChart(data, {
        "container": container
      });
      $(container).append("<p>" + res.summary + "</p>");
    });
  } else {
    detail = $(".selected_info .item-detail");
    detail.empty();
    _ref = r.degree[d.index];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      if (d === link.target) {
        continue;
      }
      n = link.target;
      if (n.type !== "referData") {
        continue;
      }
      detail.append("<div><a href=" + n.url + " target='_blank' >" + n.name + "</a> " + (t_item_action(n)) + " </div>");
    }
  }
  $("#list-container").masonry();
};

get_selected_services = function() {
  var service_ids;
  service_ids = [];
  $('.check-service').each(function() {
    if (!this.checked) {
      return;
    }
    if ($(this).data('serviceId') != null) {
      return service_ids.push($(this).data('serviceId'));
    }
  });
  return service_ids;
};

$(document).ready(function() {
  var id, options, play_step, query, type;
  options = {
    "container": "#nest-container"
  };
  window.nest(options);
  $(document).keydown(cacheIt);
  $(document).keyup(cacheIt);
  $(".btn-toggle-nest").click(function() {
    var toggle, ui;
    ui = $(options.container);
    toggle = ui.height() <= 210;
    if (toggle) {
      ui.attr('style', '');
      ui.removeClass('list-item').addClass('fullscreen');
    } else {
      ui.removeClass('fullscreen').addClass('list-item');
      $("#list-container").masonry();
    }
    return $(this).val(toggle ? "收起" : "展开");
  });
  play_step = function() {
    var func, info, s;
    if (r.current_step >= r.story.length || r.current_step < 0) {
      return;
    }
    s = r.story[current_step];
    func = explore;
    if (s.event === "draw") {
      func = draw;
    }
    info = r.story[r.current_step];
    $("#story-indicator,.btn-next,.btn-prev,.btn-automate").show();
    $("#story-indicator").text("第" + (r.current_step + 1) + "步，共" + r.story.length + "步，节点数：" + info.nodes.length);
    draw(s);
  };
  $("#btn_tip").click(function() {
    var scr;
    scr = prompt("要打开的文件名", "default");
    return $.getJSON("/play/" + scr, function(d) {
      var cur, graph, s, _i, _len;
      r.story = [];
      r.current_step = 0;
      graph = {
        nodes: [],
        links: []
      };
      for (_i = 0, _len = d.length; _i < _len; _i++) {
        s = d[_i];
        if (s.event === "draw") {
          graph.nodes = s.nodes;
          graph.links = s.links;
        } else {
          graph.nodes = graph.nodes.concat(s.nodes);
          graph.links = graph.links.concat(s.links);
        }
        cur = {};
        $.extend(cur, graph);
        r.story.push(cur);
      }
      return play_step();
    });
  });
  $(".btn-next").click(function() {
    if (r.current_step === r.story.length - 1) {
      return;
    }
    r.current_step += 1;
    play_step();
  });
  $(".btn-prev").click(function() {
    if (r.current_step === 0) {
      return;
    }
    r.current_step -= 1;
    play_step();
  });
  $(".btn-automate-yes").click(function() {
    var dic, p, _i, _len, _ref;
    dic = {
      "nodes": r.nodes,
      "links": r.links.map(function(d) {
        return {
          "source": d.source.index,
          "target": d.target.index
        };
      })
    };
    console.log(dic);
    _ref = "max_total_node_num max_single_node_num timeout_seconds max_depth".split(" ");
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      p = _ref[_i];
      dic[p] = $("#" + p).val();
    }
    $.post("/automate", JSON.stringify(dic), function(d) {
      if (d.error != null) {
        console.log(d.error);
      }
      return $("#automate-form").slideToggle();
    });
  });
  $(".btn-automate-no").click(function() {
    $("#automate-form").slideToggle();
  });
  $(".btn-automate").click(function() {
    $("#automate-form").slideToggle();
  });
  $("#btn_search").click(function() {
    var data, key, keynode;
    key = $('#q').val();
    data = {
      'keys': key,
      'services': get_selected_services()
    };
    keynode = {
      'type': "baike",
      'name': key
    };
    $.post("/search", JSON.stringify(data), function(d) {
      var i, x, _i, _len, _ref;
      if (!d || (d.error != null)) {
        return;
      }
      d.nodes.splice(0, 0, keynode);
      i = 0;
      _ref = d.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        x.index = i;
        if (i > 0) {
          d.links.push({
            source: 0,
            target: i
          });
        }
        i += 1;
      }
      draw(d);
      list(d);
    }, 'json');
    $('html, body').animate({
      "scrollTop": 0
    });
  });
  $(window).scroll(function() {
    var toggle;
    toggle = $(this).scrollTop() > 100;
    if (toggle) {
      return $("#nav").addClass("fade");
    } else {
      return $("#nav").removeClass("fade");
    }
  });
  $('#q').keypress(function(e) {
    if (e.keyCode === 13) {
      return $('#btn_search').click();
    }
  });
  $("#btn_save").click(function() {
    return save().done(function() {
      return alert("保存完成");
    }).fail(function(d, e) {
      return alert(e);
    });
  });
  id = document.title;
  type = "unknown";
  if (__indexOf.call(id, ":") >= 0) {
    query = query.replace(":", "_");
  }
  $.getJSON("/model/load/" + id, function(d) {
    if (!d || (d.error != null)) {
      $.getJSON("/info/" + id, function(d) {
        if (!d || (d.error != null)) {
          return;
        }
        draw(d);
        return list(d);
      });
    } else {
      draw(d);
      list(d);
    }
    return click_handler(r.root);
  });
  $.getJSON("/services/", function(d) {
    var checked, s, _i, _len, _ref;
    if (!d || (d.error != null)) {
      log('error get services');
      return;
    }
    _ref = d.services;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      s = _ref[_i];
      checked = "";
      if ((s.select != null) && s.select === true) {
        checked = "checked";
      }
      $('.services').append("<li>\n  <input type=\"checkbox\"   data-service-id=\"" + s.id + "\" " + checked + " class=\"check-service\" id=\"" + s.id + "\"> <span>使用 " + s.name + " 搜索</span>\n</li>");
    }
  });
});
