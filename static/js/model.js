var get_selected_services,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.list = function(d) {
  var color, s, t_item_action, t_list_item, x, _i, _len, _ref;
  try {
    $("#list-container").masonry("destroy");
  } catch (_error) {}
  $(".list-item.normal").remove();
  color = window.palette(d.type);
  $("#list-container").append("<div class=\"list-item normal selected_info\">\n   <h2 class=\"item-headline\">\n      <span style=\"border-left:" + color + " solid 5px;\">&nbsp;</span>\n      <a href=\"\" target=\"_blank\"></a>\n    </h2>\n    <p class=\"item-detail\"></p>\n</div>");
  if (d.nodes.length > 100) {
    return;
  }
  t_list_item = function(d) {
    var details, i, imgurl;
    details = d.content != null ? d.content : "";
    i = Math.floor(Math.random() * (10 - 0 + 1));
    color = window.palette(d.type);
    imgurl = "http://lorempixel.com/80/80/technics/" + i;
    if (d.img != null) {
      imgurl = d.img;
    }
    return "<div class=\"list-item normal\">\n  <h2 class=\"item-headline\">\n    <span style=\"border-left:" + color + " solid 5px;\">&nbsp;</span>\n    <a href=\"" + d.url + "\">" + d.name + "</a>\n  </h2>\n  <span class=\"item-prop\">" + d.type + " </span>\n  <div>\n    <img class=\"item-image\" src=\"" + imgurl + "\"/>\n  </div>\n  <p class=\"item-detail\">" + details + "</p>\n</div>";
  };
  t_item_action = function(d) {
    return "<a class=\"button\" href=\"#\">收藏</a>\n<a class=\"button\" href=\"#\">分享</a>";
  };
  _ref = d.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    s = t_list_item(x);
    $("#list-container").append(s);
  }
  $(".item-prop").append(t_item_action(x));
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
  var container, value;
  $(".selected_info .item-headline a").text(d.name);
  if (d.type === "doc") {
    $(".selected_info .item-headline a").attr('href', d.url);
    container = ".selected_info .item-detail";
    value = window.degree[d.index][0].value;
    $(container).empty().append("<p>到聚类中心的距离：" + value + "</p>");
    $.getJSON("/keyword/" + d.name, function(res) {
      var data, x;
      $.get(d.url, function(res) {
        if (res.length > 1000) {
          res = res.slice(0, 1001) + "...";
        }
        return $(container).append("<p>" + res + "</p>");
      });
      if (res.error != null) {
        return;
      }
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
    });
  } else {
    $(".selected_info .item-detail").text("");
  }
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
  return service_ids.join("###");
};

$(document).ready(function() {
  var id, options, query, type;
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
    }
    return $(this).val(toggle ? "收起" : "展开");
  });
  $("#btn_tip").click(function() {
    return $("#tip").slideToggle(200);
  });
  $("#btn_search").click(function() {
    var data, key;
    key = $('#q').val();
    data = {
      'keys': key,
      'services': get_selected_services()
    };
    $.post("/search/", JSON.stringify(data), function(d) {
      if (!d || (d.error != null)) {
        return;
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
      return $.getJSON("/info/" + id, function(d) {
        if (!d || (d.error != null)) {
          return;
        }
        draw(d);
        return list(d);
      });
    } else {
      draw(d);
      return list(d);
    }
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
