var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

window.list = function(d) {
  var lorem, t_item_action, t_list_item, x, _i, _len, _ref;
  lorem = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod\ntempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\nquis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo\nconsequat.";
  $("#list-container").empty();
  t_list_item = function(d) {
    var details, x;
    details = "";
    for (x in d) {
      details += "" + x + ":" + d[x] + ";  ";
    }
    details += "<br>" + lorem;
    return "<div class=\"list-item\">\n  <h2 class=\"item-headline\"><a href=\"" + d.url + "\">" + d.name + "</a></h2>\n  <table>\n    <tr>\n      <td width=\"80\" valign=\"top\"> <img class=\"item-image\" src=\"http://lorempixel.com/80/80/city\"/> </td>\n      <td style=\"margin-left:1em;\">  \n          <span class=\"item-prop\">" + d.type + "</span> \n          <p class=\"item-detail\">" + details + "...</p>\n      </td>\n    </tr>\n  </table>\n</div>";
  };
  t_item_action = function(d) {
    return "<a class=\"button\" href=\"#\">收藏</a>\n<a class=\"button\" href=\"#\">分享</a>";
  };
  _ref = d.nodes;
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    $("#list-container").append(t_list_item(x));
  }
  return $(".item-prop").append(t_item_action(x));
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
    }, "fast");
    return $(this).val(toggle ? "收起" : "展开");
  });
  $("#btn_tip").click(function() {
    return $("#tip").slideToggle(200);
  });
  $("#btn_search").click(function() {
    var key;
    key = $('#q').val();
    return $.getJSON("/search/" + key, function(d) {
      if (!d || (d.error != null)) {
        return;
      }
      draw(d);
      return list(d);
    });
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
  return $.getJSON("/model/load/" + id, function(d) {
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
