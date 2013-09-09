var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.list = function(d) {
  var lorem, s, t_item_action, t_list_item, x, _i, _len, _ref;
  lorem = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod\ntempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\nquis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo\nconsequat.";
  $("#list-container").masonry("destroy");
  $(".list-item.normal").remove();
  t_list_item = function(d) {
    var color, details, i, x;
    details = "";
    for (x in d) {
      details += "" + x + ":" + d[x] + ";  ";
    }
    details += "<br>" + lorem;
    i = Math.floor(Math.random() * (10 - 0 + 1));
    color = window.palette(d.type);
    return "<div class=\"list-item normal\">\n  <h2 class=\"item-headline\">\n    <span style=\"border-left:" + color + " solid 5px;\">&nbsp;</span>\n    <a href=\"" + d.url + "\">" + d.name + "</a>\n  </h2>\n  <table>\n    <tr>\n      <td width=\"80\" valign=\"top\"> <img class=\"item-image\" src=\"http://lorempixel.com/80/80/technics/" + i + "\"/> </td>\n      <td style=\"margin-left:1em;\">  \n        <span class=\"item-prop\">" + d.type + " </span> \n        <p class=\"item-detail\">" + details + "...</p>\n      </td>\n    </tr>\n  </table>\n</div>";
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
    itemSelector: '.list-item'
  });
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
    var toH, toggle, ui;
    ui = $(options.container);
    toggle = ui.height() <= 210;
    toH = toggle ? $(window).height() * .8 : 200;
    ui.animate({
      "height": toH
    }, 200);
    setTimeout(function() {
      return $("#list-container").masonry();
    }, 200);
    return $(this).val(toggle ? "收起" : "展开");
  });
  $("#btn_tip").click(function() {
    return $("#tip").slideToggle(200);
  });
  $("#btn_search").click(function() {
    var key;
    key = $('#q').val();
    $('html, body').animate({
      "scrollTop": 0
    });
    return $.getJSON("/search/" + key, function(d) {
      if (!d || (d.error != null)) {
        return;
      }
      draw(d);
      return list(d);
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
});
