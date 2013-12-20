require(['jquery', 'd3', 'nest', 'masonry', 'jquery_blockUI', 'imageloaded'], function($, d3, Nest, Masonry, blockUI, imagesLoaded) {
  var get_selected_services, list, load_automate, play_step, save, search, t_item_action, url_params;
  url_params = function() {
    var pair, res, x, _i, _len, _ref;
    res = {};
    _ref = window.location.search.substring(1).split('&');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      pair = x.split('=');
      res[pair[0]] = decodeURIComponent(pair[1]);
    }
    return res;
  };
  requirejs.onError = function(err) {
    console.log(err);
    throw err;
  };
  t_item_action = function(d) {
    return "<a class=\"button small\" href=\"#\">收藏</a>\n<a class=\"button small\" href=\"#\">分享</a>";
  };
  list = function(d) {
    var $item, s, t_list_item, x, _i, _len, _ref;
    t_list_item = function(d) {
      var details, i, imgurl;
      details = d.content != null ? d.content : "";
      i = Math.floor(Math.random() * (10 - 0 + 1));
      imgurl = "";
      if (d.img != null) {
        imgurl = d.img;
      }
      return "<div class=\"list-item normal\">\n	<h2 class=\"item-headline\">\n		<span>" + d.name + "</span>\n	</h2>\n	<span class=\"item-prop\">" + d.type + " </span>\n	<div>\n		<img class=\"item-image\" src=\"" + imgurl + "\"/>\n	</div>\n	<p class=\"item-detail\">" + details + "</p>\n</div>";
    };
    if (window.masonry == null) {
      window.masonry = new Masonry('#list-container', {
        "transitionDuration": "0.2s",
        "itemSelector": ".list-item"
      });
    }
    window.masonry.remove($(".list-item.normal").get());
    window.masonry.layout();
    $item = $(t_list_item(d));
    $("#list-container").append($item);
    window.masonry.appended($item.get());
    $("#list-container div:last-child").addClass('selected_info');
    if (d.nodes.length > 10) {
      return;
    }
    _ref = d.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      if (x.type === "referData") {
        continue;
      }
      s = $(t_list_item(x));
      $("#list-container").append(s);
      window.masonry.appended(s.get());
    }
    imagesLoaded(document.querySelector("#list-container"), function() {
      window.masonry.layout();
    });
  };
  window.click_handler = function(d) {
    var container, detail, docs, link, n, value, _i, _j, _len, _len1, _ref;
    if (d == null) {
      return;
    }
    $(".selected_info .item-headline span").text(d.name);
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
        require(['barchart'], function(barchart) {
          barchart.render(data, {
            "container": container
          });
        });
        $(container).append("<p>" + res.summary + "</p>");
      });
    } else {
      detail = $(".selected_info .item-detail");
      detail.empty();
      docs = [];
      _ref = window.nest.degree[d.index];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        if (d === link.target) {
          continue;
        }
        n = link.target;
        if (n.type !== "referData") {
          continue;
        }
        docs.push(n);
      }
      if (docs.length > 0) {
        detail.append("<h3>相关文档</h3>");
        for (_j = 0, _len1 = docs.length; _j < _len1; _j++) {
          n = docs[_j];
          detail.append("<a href=" + n.url + "  class='doc_url' target='_blank'>" + n.name + "</a>");
        }
      }
    }
    if (window.masonry != null) {
      window.masonry.layout();
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
    return service_ids;
  };
  save = function() {
    var fname, l, n, p, prop_node, res, x, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    res = {
      "nodes": [],
      "links": [],
      "blacklist": window.nest.blacklist
    };
    fname = prompt("请输入要保存的名字", window.nest.root.id);
    if (fname == null) {
      return;
    }
    prop_node = "id name value index type url fixed distance_rank img".split(" ");
    _ref = window.nest.nodes;
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
    _ref1 = window.nest.links;
    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
      x = _ref1[_k];
      l = {
        "source": x.source.id,
        "target": x.target.id
      };
      res.links.push(l);
    }
    res = JSON.stringify(res);
    $.post("/model?id=" + fname, res, function(d) {
      if (d.error != null) {
        $.growlUI("保存出现如下错误:", d.error);
        return;
      }
      return $.growlUI("", "已保存");
    });
  };
  play_step = function() {
    var info, s;
    if (window.current_step >= window.story.length || window.current_step < 0) {
      return;
    }
    s = window.story[window.current_step];
    info = window.story[window.current_step];
    $("#story-indicator,.btn-next,.btn-prev,.btn-automate").show();
    $("#story-indicator").text("第" + (window.current_step + 1) + "步，共" + window.story.length + "步， 节点数：" + info.nodes.length);
    window.nest.draw(s);
  };
  search = function(key, services) {
    var data, keynode;
    data = {
      'keys': key,
      'services': services
    };
    keynode = {
      'type': "query",
      'name': key
    };
    $.blockUI({
      message: "正在搜索"
    });
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
      window.nest.draw(d);
      list(d);
      click_handler(window.nest.root);
      $.unblockUI();
    }, 'json');
  };
  load_automate = function(scr) {
    scr = encodeURIComponent(scr);
    return $.getJSON("/play/" + scr, function(d) {
      var cur, graph, s, _i, _len;
      window.story = [];
      window.current_step = 0;
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
        window.story.push(cur);
      }
      play_step();
      list(window.story[0]);
      return click_handler(window.nest.root);
    });
  };
  $(function() {
    var id, key, needs_nest, params, services;
    params = url_params();
    if (params.theme != null) {
      $('body').addClass(params.theme);
    }
    if (params.no_nav != null) {
      $('body').addClass("no-nav");
    }
    needs_nest = false;
    if (params.q != null) {
      key = params.q;
      services = ['baike'];
      if (params.services != null) {
        services = params.services.split('|');
      }
      search(key, services);
    } else if (params.id != null) {
      id = encodeURIComponent(params.id);
      $.getJSON("/model/load/" + id, function(d) {
        if (!d || (d.error != null)) {
          return;
        }
        window.nest.draw(d);
        list(d);
        click_handler(window.nest.root);
      });
    } else if (params.automate != null) {
      load_automate(params.automate);
    }
    $.getJSON("/services/", function(d) {
      var checked, s, _i, _len, _ref;
      if (!d || (d.error != null)) {
        console.log('error get services');
        return;
      }
      _ref = d.services;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        checked = "";
        if ((s.select != null) && s.select === true) {
          checked = "checked";
        }
        $('.services').append("<li>\n	<input type=\"checkbox\"	 data-service-id=\"" + s.id + "\" " + checked + " class=\"check-service\" id=\"" + s.id + "\"> <span>使用 " + s.name + " 搜索</span>\n</li>");
      }
    });
    window.nest = new Nest({
      "container": "#nest-container",
      "width": "400",
      "height": "200"
    });
    $(document).on("click", ".btn-toggle-fullscreen", function() {
      var toggle, ui;
      ui = $(this).closest('div');
      toggle = ui.hasClass('list-item');
      if (toggle) {
        ui.attr('style', "");
        ui.removeClass('list-item').addClass('fullscreen');
      } else {
        ui.removeClass('fullscreen').addClass('list-item');
        window.masonry.layout();
      }
      return $(this).val(toggle ? "收起" : "展开");
    });
    $("#btn_load").click(function() {
      var scr;
      scr = prompt("要打开的文件名", "default");
      if (scr == null) {
        return;
      }
      return load_automate(scr);
    });
    $("#btn_tip").click(function() {
      $("#tip").slideToggle(200);
    });
    $(".btn-next").click(function() {
      if (window.current_step === window.story.length - 1) {
        return;
      }
      window.current_step += 1;
      play_step();
    });
    $(".btn-prev").click(function() {
      if (window.current_step === 0) {
        return;
      }
      window.current_step -= 1;
      play_step();
    });
    $(".btn-automate-yes").click(function() {
      var dic, p, _i, _len, _ref;
      dic = {
        "nodes": window.nest.nodes,
        "links": window.nest.links.map(function(d) {
          return {
            "source": d.source.index,
            "target": d.target.index
          };
        }),
        "blacklist": window.nest.blacklist
      };
      _ref = "max_total_node_num max_single_node_num timeout_seconds max_depth out_fname".split(" ");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        dic[p] = $("#" + p).val();
      }
      console.log(dic);
      $("#automate-form").slideToggle();
      $.growlUI("", "宏 " + dic.out_fname + " 已开始运行");
      $.post("/automate", JSON.stringify(dic), function(d) {
        if (d.error != null) {
          $.growlUI("宏 " + dic.out_fname + " 运行出现如下错误", d.error);
        } else {
          $.growlUI("", "宏 " + dic.out_fname + " 已完成运行");
        }
      });
    });
    $(".btn-automate-no").click(function() {
      $("#automate-form").slideToggle();
    });
    $(".btn-automate").click(function() {
      $("#automate-form").slideToggle();
    });
    $("#btn_search").click(function() {
      key = $('#q').val();
      services = get_selected_services();
      search(key, services);
      $('html, body').animate({
        "scrollTop": 0
      });
    });
    $(window).scroll(function() {
      var toggle;
      toggle = $(this).scrollTop() > 100;
      if (toggle) {
        $("#nav").addClass("fade");
      } else {
        $("#nav").removeClass("fade");
      }
    });
    $('#q').keypress(function(e) {
      if (e.keyCode === 13) {
        $('#btn_search').click();
      }
    });
    $("#btn_save").on("click", save);
    $('body').on("click", ".doc_url", function(e) {
      var $item, text, url;
      e.preventDefault();
      if ($(".doc_info").length === 0) {
        $item = $("<div class='doc_info list-item normal'>\n	<input type=\"button\"  class=\"btn-toggle-fullscreen\"   value=\"展开\">\n	<input type=\"button\" class=\"btn-small fav\" style=\"left:5em;\"  value=\"收藏\">\n	<input type=\"button\" class=\"btn-small share\" style=\"left:9em;\"  value=\"分享\">\n	<h2 class=\"item-headline\">\n		<span></span>\n	</h2>\n	<iframe></iframe>\n</div>");
        $(".selected_info").after($item);
        window.masonry.reloadItems();
        window.masonry.layout();
      }
      url = $(this).attr('href');
      text = $(this).text();
      $(".doc_info iframe").attr('src', url);
      $(".doc_info .item-headline span").text(text);
    });
  });
});
