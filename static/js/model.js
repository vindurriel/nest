var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

requirejs.config({
  "baseUrl": '/js',
  "paths": {
    "jquery": "jquery",
    'blockUI': "jquery_blockUI"
  },
  'shim': {
    'blockUI': {
      "deps": ['jquery']
    }
  }
});

require(['packery.pkgd.min'], function(x) {
  require(['packery/js/packery'], function(pack) {
    window.packery = new pack("#wrapper", {
      'itemSelector': '.list-item',
      'columnWidth': 200,
      'gutter': 10
    });
  });
});

require(['jquery', 'd3', 'nest', 'blockUI'], function($, d3, Nest, bui) {
  var add_widget, blockUI, close_toggle, get_selected_services, init_service, list, list_automate, list_model, list_service, load_automate, load_model, play_step, save, search, snapshot, t_item_action, t_list_item, unblockUI, update_service, url_params;
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
  t_item_action = function(d) {
    return "<a class=\"button small\" href=\"#\">收藏</a>\n<a class=\"button small\" href=\"#\">分享</a>";
  };
  t_list_item = function(d) {
    var details, i, img_hide, imgurl;
    details = d.content != null ? d.content : "";
    i = Math.floor(Math.random() * (10 - 0 + 1));
    imgurl = "";
    img_hide = "hidden";
    if (d.img != null) {
      imgurl = d.img;
      img_hide = "";
    }
    return "<div class=\"list-item normal w2\" data-nest-node=\"" + d.id + "\">\n	<header class=\"drag-handle\">|||</header>\n	<div class=\"btn-close\">x</div>\n	<div class='inner'>\n		<h2 class=\"item-headline\">\n			<span>" + d.name + "</span>\n		</h2>\n		<div class=\"item-prop\">" + d.type + " </div>\n		<img class=\"item-image " + img_hide + "\" src=\"" + imgurl + "\"/>\n		<p class=\"item-detail\">" + details + "</p>\n	</div>\n</div>";
  };
  close_toggle = function() {
    $('.toggle').removeClass('on');
    $(".toggle-container").slideUp(200);
  };
  load_model = function(id) {
    id = encodeURIComponent(id);
    close_toggle();
    $.getJSON("/model/load/" + id, function(d) {
      if (!d || (d.error != null)) {
        return;
      }
      window.nest.draw(d);
      $('#nest-container').parent().removeClass("hidden");
      click_handler(window.nest.root);
    });
  };
  add_widget = function($x, after) {
    if (after == null) {
      after = null;
    }
    if (after != null) {
      $x.insertAfter(after);
      window.packery.reloadItems();
      window.packery.layout();
    } else {
      $('#wrapper').append($x);
      window.packery.appended($x);
    }
    require(['draggabilly.pkgd.min'], function(Draggabilly) {
      var draggie;
      draggie = new Draggabilly($x.get()[0], {
        handle: ".drag-handle"
      });
      window.packery.bindDraggabillyEvents(draggie);
    });
  };
  list = function(d) {
    var detail, docs, link, n, related, s, x, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2;
    if ($('.list-item.normal').length > 0) {
      window.packery.remove($('.list-item.normal').get());
      window.packery.layout();
    }
    related = [];
    _ref = window.nest.degree[d.index];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      if (d === link.target) {
        continue;
      }
      n = link.target;
      if (_ref1 = n.type, __indexOf.call("SearchProvider smartref_category query referData".split(" "), _ref1) >= 0) {
        continue;
      }
      related.push(n);
    }
    if (related.length === 0) {
      return;
    }
    related = related.slice(0, 50);
    for (_j = 0, _len1 = related.length; _j < _len1; _j++) {
      x = related[_j];
      s = $(t_list_item(x));
      detail = s.find('.item-detail');
      if (x.content != null) {
        detail.append("<p>" + x.content + "</p>");
      }
      docs = [];
      _ref2 = window.nest.degree[x.index];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        link = _ref2[_k];
        if (x === link.target) {
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
        for (_l = 0, _len3 = docs.length; _l < _len3; _l++) {
          n = docs[_l];
          detail.append("<span  data-doc-id='" + n.id + "' class='doc_url'>" + n.name + "</span>");
        }
      }
      add_widget(s);
    }
  };
  snapshot = function(d) {
    var $g, $item, $svg, svg;
    $item = $("<div class=\"list-item w2 h2\">\n	<header class=\"drag-handle\">|||</header>\n	<div class=\"btn-close\">x</div>\n	<div class='inner select_graph'>\n	</div>\n</div>");
    add_widget($item, $('.selected_info'));
    if (d3 == null) {
      d3 = window.d3;
    }
    $svg = $('#nest-container svg').clone();
    $item.find(".select_graph").append($svg);
    $g = $svg.find(">g");
    svg = d3.select($svg.get()[0]);
    svg.selectAll('.node').data(window.nest.nodes).filter(function(x) {
      return !x.isHigh;
    }).remove();
    svg.selectAll('.link').data(window.nest.links).filter(function(x) {
      return !x.isHigh;
    }).remove();
    svg.selectAll('.ring').remove();
    svg.selectAll('.marker').remove();
    svg.attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid meet").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", function() {
      $g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
      svg.selectAll('text').style("font-size", (1.0 / d3.event.scale) + "em");
    }));
  };
  window.click_handler = function(d) {
    var $item, actions, container, detail, docs, link, n, t, value, x, _i, _j, _len, _len1, _ref;
    if (d == null) {
      return;
    }
    document.title = d.name;
    list(d);
    window.nest.highlight(d);
    if ($(".selected_info").length === 0) {
      $item = $(t_list_item(d)).attr('class', "selected_info list-item w2 h2");
      add_widget($item, $('#nest-container').parent());
    }
    $(".selected_info .item-headline span").text(d.name);
    $(".selected_info .item-prop").empty();
    $(".selected_info .item-image").attr('src', d.img || "");
    if (!window.nest.snapshot) {
      window.nest.snapshot = snapshot;
    }
    actions = {
      '探索': "dblclick",
      '删除': "remove",
      '该节点为中心的子图': "snapshot"
    };
    for (x in actions) {
      $(".selected_info .item-prop").append($("<li/>").text(x).addClass('item-action button').data('nest-command', actions[x]));
    }
    if (d.type === "doc") {
      $(".selected_info .item-headline a").attr('href', d.url);
      container = ".selected_info .item-detail";
      value = window.nest.degree[d.index][0].value;
      $(container).empty().append("<p>到聚类中心的距离：" + value + "</p>");
      $(container).append($("<p class='placeholder'>正在载入信息...</p>"));
      $.getJSON("/keyword/" + d.name, function(res) {
        var data;
        $(container).find(".placeholder").remove();
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
      t = d.type || "未知";
      $(".selected_info .item-headline").attr('title', "类别:" + t + " id:" + d.id);
      if (d.content != null) {
        detail.append("<p>" + d.content + "</p>");
      }
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
          detail.append("<span data-doc-id='" + n.id + "'  class='doc_url' >" + n.name + "</span>");
        }
      }
    }
  };
  window.doc_handler = function(d) {
    var $item, text, url;
    url = d.url || d.name;
    text = d.name;
    $item = $("<div  class='doc_info list-item w2 h2 expanded'>\n	<header class=\"drag-handle\">|||</header>\n	<input type=\"button\" class=\"btn-resize\" value=\"缩小\">\n	<div  class=\"btn-close\">x</div>\n	<input type=\"button\" class=\"btn-small fav\"  style=\"left:3em;\"  value=\"收藏\">\n	<input type=\"button\" class=\"btn-small share\" style=\"left:6em;\"  value=\"分享\">\n	<div class='inner'>\n		<h2 class=\"item-headline\">\n			<span>" + text + "</span>\n		</h2>\n		<iframe src=\"" + url + "\" ></iframe>\n	</div>\n</div>");
    add_widget($item, $(".selected_info"));
  };
  get_selected_services = function() {
    return window.services.filter(function(d) {
      return d.select;
    }).map(function(d) {
      return d.id;
    });
  };
  save = function() {
    var fname, l, n, p, prop_node, res, x, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    res = {
      "nodes": [],
      "links": [],
      "blacklist": window.nest.blacklist
    };
    close_toggle();
    fname = window.save_name[1].value;
    if ((fname == null) || fname === "") {
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
      $.growlUI("", "已保存");
      return list_model();
    });
  };
  blockUI = function() {
    $('html, body').attr({
      "scrollTop": 400
    });
    $('html, body').animate({
      "scrollTop": 0
    });
    $('.busy').fadeIn();
  };
  unblockUI = function() {
    $('html, body').animate({
      "scrollTop": 400
    });
    $('.busy').fadeOut();
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
    $('#nest-container').parent().removeClass("hidden");
    window.nest.draw(s);
    click_handler(window.nest.hNode[s.current_node_id]);
  };
  search = function(key, services) {
    var data;
    data = {
      'keys': key,
      'services': services
    };
    close_toggle();
    blockUI();
    $.post("/search", JSON.stringify(data), function(d) {
      if (!d || (d.error != null)) {
        return;
      }
      window.nest.draw(d);
      $('#nest-container').parent().removeClass("hidden");
      click_handler(window.nest.root);
      unblockUI();
    }, 'json');
  };
  load_automate = function(scr) {
    scr = encodeURIComponent(scr);
    close_toggle();
    $.getJSON("/play/" + scr, function(d) {
      var cur, graph, s, _i, _len;
      console.log(d);
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
        graph.current_node_id = s.current_node_id || s.nodes[0].id;
        cur = {};
        $.extend(cur, graph);
        window.story.push(cur);
      }
      play_step();
    });
  };
  list_automate = function() {
    $.getJSON("/list?output=json&type=automate", function(d) {
      var x, _i, _len;
      if (!d || (d.error != null)) {
        console.log('error get services');
        return;
      }
      $('.automates').empty();
      for (_i = 0, _len = d.length; _i < _len; _i++) {
        x = d[_i];
        $('.automates').append($("<li class=\"list\" >" + x[0] + "</li>"));
      }
    });
  };
  list_model = function() {
    $.getJSON("/list?output=json&type=model", function(d) {
      var x, _i, _len;
      if (!d || (d.error != null)) {
        console.log('error get services');
        return;
      }
      $('.snapshots').empty();
      for (_i = 0, _len = d.length; _i < _len; _i++) {
        x = d[_i];
        $('.snapshots').append($("<li class=\"list\" >" + x[0] + "</li>"));
      }
      $("body").on("click", ".snapshots li", function() {
        load_model($(this).text());
      });
    });
  };
  list_service = function() {
    $.getJSON("/services", function(d) {
      var $item, checked, s, _i, _len, _ref;
      if (!d || (d.error != null)) {
        console.log('error get services');
        return;
      }
      window.services = d.services;
      $('.services').empty();
      _ref = d.services;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        checked = "";
        if ((s.select != null) && s.select === true) {
          checked = "checked";
        }
        $item = $("<li data-service-id=\"" + s.id + "\">\n	<img src=\"" + s.img + "\"/>\n	<strong>" + s.name + "</strong>\n	<label>\n		<input type=\"checkbox\" class=\"ios-switch   check-service\"  " + checked + ">\n		<div><div></div></div>\n	</label>\n	<p>" + s.desc + "</p>\n</li>");
        if (checked === "checked") {
          $item.addClass('on');
        }
        $('.services').append($item);
      }
      init_service(window.services);
    });
  };
  update_service = function() {
    var i, ls, ne, ns, o, r, _i, _ref;
    r = window.service_nest;
    ns = window.services.filter(function(x) {
      return x.select;
    });
    o = $('.logo').offset();
    ns.splice(0, 0, {
      'id': 'services_root',
      'name': "",
      'select': true,
      'desc': '',
      'img': '',
      'fixed': true,
      'x': o.left + 64,
      'y': o.top + 64
    });
    ls = [];
    i = 0;
    for (i = _i = 0, _ref = ns.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (i === 0) {
        continue;
      }
      ls.push({
        source: 0,
        target: i
      });
    }
    r.force.nodes(ns).links(ls).start();
    r.nodes = r.nodes.data(r.force.nodes(), function(d) {
      return d.id;
    });
    r.links = r.links.data(r.force.links());
    ne = r.nodes.enter().append('g').classed('node', true);
    ne.append('image').attr('width', 30).attr('height', 30).attr('xlink:href', function(d) {
      return d.img;
    }).call(r.force.drag);
    ne.append('title').text(function(d) {
      return d.desc;
    });
    ne.append('text').text(function(d) {
      return d.name;
    }).attr('dx', -10).attr('dy', 20).attr('text-anchor', 'end');
    r.nodes.exit().remove();
    r.links.enter().insert("line", ".node").classed('link', true);
    r.links.exit().remove();
  };
  init_service = function(services) {
    var res;
    res = {};
    d3 = window.d3;
    res.svg = d3.select('#banner .overlay').append("svg");
    res.nodes = res.svg.selectAll('.node');
    res.links = res.svg.selectAll('.link');
    res.force = d3.layout.force().charge(-1000).linkDistance(150).linkStrength(1).size([200, 200]).on('tick', function() {
      res.nodes.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
      return res.links.attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      });
    });
    window.service_nest = res;
    update_service();
  };
  $(function() {
    var key, needs_nest, params, services;
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
      load_model(params.id);
    } else if (params.automate != null) {
      load_automate(params.automate);
    }
    list_service();
    list_model();
    list_automate();
    window.nest = new Nest({
      "container": "#nest-container"
    });
    require(['draggabilly.pkgd.min'], function(Draggabilly) {
      var draggie;
      draggie = new Draggabilly($("#nest-container").parent().get()[0], {
        handle: ".drag-handle"
      });
      window.packery.bindDraggabillyEvents(draggie);
    });
    $(document).on("click", ".btn-close", function() {
      var ui;
      ui = $(this).closest('div.list-item');
      window.packery.remove(ui);
      window.packery.layout();
    });
    $("body").on("click", ".selected_info .item-action", function() {
      var cmd;
      cmd = $(this).data('nest-command');
      window.nest[cmd](window.nest.theFocus);
      window.nest.update();
    }).on("click", ".btn-no", function() {
      close_toggle();
    }).on("click", ".btn-automate-yes", function() {
      var dic, p, _i, _len, _ref;
      close_toggle();
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
        dic[p] = window[p][1].value;
      }
      console.log(dic);
      $.growlUI("", "宏 " + dic.out_fname + " 已开始运行");
      $.post("/automate", JSON.stringify(dic), function(d) {
        if (d.error != null) {
          $.growlUI("宏 " + dic.out_fname + " 运行出现如下错误", d.error);
        } else {
          $.growlUI("", "宏 " + dic.out_fname + " 已完成运行");
          list_automate();
        }
      });
    }).on("click", ".btn-next", function() {
      if (window.current_step === window.story.length - 1) {
        return;
      }
      window.current_step += 1;
      play_step();
    }).on("click", ".btn-prev", function() {
      if (window.current_step === 0) {
        return;
      }
      window.current_step -= 1;
      play_step();
    }).on("click", '.btn-save', save).on("click", ".automates li", function() {
      load_automate($(this).text());
    }).on("click", ".snapshots li", function() {
      load_model($(this).text());
    }).on('click', '.services li', function(e) {
      var checkbox, checked, index, sid;
      checkbox = $(this).find('input[type=checkbox]');
      checkbox.prop("checked", !checkbox.prop("checked"));
      checked = checkbox.prop("checked");
      $(this).toggleClass('on');
      index = $(this).parent().find("li").index($(this));
      window.services[index].select = checked;
      sid = $(this).attr('data-service-id');
      $('#service-list').find("li[data-service-id=" + sid + "]").toggleClass('on').find("input[type=checkbox]").prop("checked", checked);
      update_service();
    }).on("click", ".btn-resize", function() {
      var flag, ui;
      ui = $(this).closest('.list-item');
      ui.toggleClass('expanded');
      flag = ui.hasClass('expanded');
      if (flag) {
        $('body').animate({
          'scrollTop': ui.offset().top - 80
        });
      }
      $(this).val(flag ? "缩小" : "放大");
      window.packery.layout();
    }).on("mouseenter", ".drag-handle", function() {
      $(this).attr('title', "按住拖动");
    }).on("click", ".doc_url", function() {
      var id;
      id = $(this).attr('data-doc-id');
      window.doc_handler(window.nest.hNode[id]);
    });
    $("#btn_search").click(function() {
      key = $('#q').val();
      services = get_selected_services();
      search(key, services);
    });
    $(window).scroll(function() {
      if ($(window).scrollTop() > 400) {
        $("body").addClass("ready");
      } else {
        $("body").removeClass("ready");
      }
    });
    $('#q').keypress(function(e) {
      if (e.keyCode === 13) {
        $('#btn_search').click();
      }
    });
    $(".logo").on("click", function() {
      if ($('body').hasClass('ready')) {
        $("body").animate({
          'scrollTop': 0
        });
      }
    });
    require(['dropimage'], function(dropimage) {
      var $holder;
      $(window).on("dragover", function() {
        $('#dropimage-holder').addClass('dragover');
        return false;
      });
      $(window).on("mouseup", function() {
        $('#dropimage-holder').removeClass('dragover');
      });
      $holder = $('#dropimage-holder');
      if (dropimage.tests.dnd) {
        return $holder.on('drop', function(e) {
          var data, x, _i, _len, _ref;
          $(this).removeClass('dragover');
          e.preventDefault();
          data = new FormData();
          _ref = e.originalEvent.dataTransfer.files;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            x = _ref[_i];
            data.append("myfile", x);
          }
          blockUI();
          $.ajax({
            url: '/search',
            type: 'POST',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: function(d) {
              $('#nest-container').parent().removeClass("hidden");
              window.nest.draw(d);
              click_handler(window.nest.root);
              unblockUI();
            },
            error: function(d) {
              console.log(e);
              unblockUI();
            }
          }, "json");
          return false;
        });
      }
    });
    $("#nav-buttons .toggle").on("click", function() {
      var c, id;
      $("#nav-buttons .toggle").not($(this)).removeClass('on');
      $(this).toggleClass('on');
      c = $(".toggle-container");
      if ($(this).hasClass('on')) {
        id = $(this).data('toggleId');
        c.children(":first").empty().append($(id).clone().removeAttr('id').show());
        c.slideDown(200);
      } else {
        c.slideUp(200).children(":first").empty();
      }
    });
  });
});
