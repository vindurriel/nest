var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

requirejs.config({
  "baseUrl": '/js',
  "paths": {
    "jquery": "jquery",
    'qtip': 'jquery.qtip',
    'imagesLoaded': 'imagesLoaded',
    'gridster': 'jquery.gridster.with-extras'
  },
  "shim": {
    'gridster': {
      'deps': ['jquery']
    },
    'qtip': {
      'deps': ['jquery']
    },
    'imagesLoaded': {
      'deps': ['jquery']
    }
  }
});

require(['jquery', 'd3', 'nest', 'jquery_blockUI', 'imagesLoaded', 'qtip', 'gridster'], function($, d3, Nest, blockUI, imagesLoaded, qtip, gridster) {
  var get_selected_services, list, load_automate, play_step, save, search, snapshot, t_item_action, t_list_item, unblockUI, url_params;
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
    var details, i, imgurl;
    details = d.content != null ? d.content : "";
    i = Math.floor(Math.random() * (10 - 0 + 1));
    imgurl = "";
    if (d.img != null) {
      imgurl = d.img;
    }
    return "<div class=\"list-item normal\" data-nest-node=\"" + d.id + "\">\n	<header class=\"drag-handle\">|||</header>\n	<div class=\"btn-close\">x</div>\n	<div class='inner'>\n		<h2 class=\"item-headline\">\n			<span>" + d.name + "</span>\n		</h2>\n		<div class=\"item-prop\">" + d.type + " </div>\n		<div>\n			<img class=\"item-image\" src=\"" + imgurl + "\"/>\n		</div>\n		<p class=\"item-detail\">" + details + "</p>\n	</div>\n</div>";
  };
  list = function(d) {
    var add_widget, docs, i, interval, link, n, _i, _len, _ref;
    window.gridster[1].remove_all_widgets();
    docs = [];
    _ref = window.nest.degree[d.index];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      if (d === link.target) {
        continue;
      }
      n = link.target;
      docs.push(n);
    }
    if (docs.length === 0) {
      return;
    }
    i = 0;
    add_widget = function(l) {
      var s, t, x, _ref1;
      if (l.length === 0 || i === 20) {
        clearInterval(interval);
        return;
      }
      x = l.pop();
      if (_ref1 = x.type, __indexOf.call("SearchProvider smartref_category query referData".split(" "), _ref1) >= 0) {
        return;
      }
      s = $(t_list_item(x));
      t = i % 3 > 0 ? 2 : 1;
      window.gridster[1].add_widget(s, t, 1);
      i += 1;
    };
    interval = setInterval(add_widget, 10, docs);
  };
  snapshot = function(d) {
    var $g, $item, $svg, link, links, nodes, svg, _i, _len, _ref;
    $item = $("<div class=\"list-item\">\n	<header class=\"drag-handle\">|||</header>\n	<div class=\"btn-close\">x</div>\n	<div class='inner select_graph'>\n	</div>\n</div>");
    window.gridster[1].add_widget($item, 2, 2);
    nodes = [];
    links = [];
    _ref = window.nest.degree[d.index];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      link = _ref[_i];
      links.push(link);
      nodes.push(link.source);
      nodes.push(link.target);
    }
    $svg = $('#nest-container svg').clone();
    $item.find(".select_graph").append($svg);
    $g = $svg.find(">g");
    $g.find('.node').remove();
    $g.find('.link').remove();
    if (d3 == null) {
      d3 = window.d3;
    }
    d3.select($svg[0]).attr("pointer-events", "all").attr("preserveAspectRatio", "XMidYMid meet").call(d3.behavior.zoom().scaleExtent([0.01, 10]).on("zoom", function() {
      $g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }));
    svg = d3.select($g.get()[0]);
    svg.selectAll('.node').data(nodes).enter().append('circle').attr("class", "node").attr('r', window.nest.getR).attr('cx', function(d) {
      return d.x;
    }).attr('cy', function(d) {
      return d.y;
    }).style("fill", window.nest.color);
    svg.selectAll('.link').data(links).enter().insert("line", ".node").classed('link', true).classed('highlight', true).attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    });
    $('circle').qtip({
      style: {
        classes: 'qtip-dark qtip-info',
        tip: false
      },
      content: {
        text: function(e, a) {
          return d3.select(e.target).data()[0].name;
        }
      },
      position: {
        at: "top left",
        my: "bottom right"
      }
    });
  };
  window.click_handler = function(d) {
    var $item, actions, container, detail, docs, link, n, t, value, x, _i, _j, _len, _len1, _ref;
    if (d == null) {
      return;
    }
    document.title = d.name;
    list(d);
    if ($(".selected_info").length === 0) {
      $item = $(t_list_item(d)).addClass('selected_info');
      window.gridster[0].add_widget($item, 4, 2);
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
      $.getJSON("/keyword/" + d.name, function(res) {
        var data;
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
      detail.append("<h3>类别：" + t + "</h3>");
      detail.append("<h3>id: " + d.id + "</h3>");
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
          detail.append("<a href=" + n.url + "  class='doc_url' target='_blank'>" + n.name + "</a>");
        }
      }
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
    window.nest.draw(s);
    $('#nest-column').removeClass("hidden");
  };
  search = function(key, services) {
    var data;
    data = {
      'keys': key,
      'services': services
    };
    blockUI();
    $.post("/search", JSON.stringify(data), function(d) {
      if (!d || (d.error != null)) {
        return;
      }
      window.nest.draw(d);
      $('#nest-column').removeClass("hidden");
      click_handler(window.nest.root);
      unblockUI();
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
      return click_handler(window.nest.root);
    });
  };
  $(function() {
    var id, init_service, key, needs_nest, params, services, update_service;
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
        $('#nest-column').removeClass("hidden");
        click_handler(window.nest.root);
      });
    } else if (params.automate != null) {
      load_automate(params.automate);
    }
    $.getJSON("/services/", function(d) {
      var $item, checked, r, s, _i, _len, _ref;
      if (!d || (d.error != null)) {
        console.log('error get services');
        return;
      }
      window.services = d.services;
      _ref = d.services;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        s = _ref[_i];
        checked = "";
        if ((s.select != null) && s.select === true) {
          checked = "checked";
        }
        $item = $("<li>\n	<img src=\"" + s.img + "\"/>\n	<strong>" + s.name + "</strong>\n	<label>\n		<input type=\"checkbox\" class=\"ios-switch   check-service\" data-service-id=\"" + s.id + "\" " + checked + "  id=\"" + s.id + "\">\n		<div><div></div></div>\n	</label>\n	<p>" + s.desc + "</p>\n</li>");
        if (checked === "checked") {
          $item.addClass('on');
        }
        $('.services').append($item);
      }
      r = init_service(window.services);
      $('.services').on('click', 'li', function() {
        var checkbox, index;
        checkbox = $(this).find('input[type=checkbox]');
        index = $(".services li").index($(this));
        checkbox.prop("checked", !checkbox.prop("checked"));
        checked = checkbox.prop("checked");
        $(this).toggleClass('on');
        window.services[index].select = checked;
        update_service(r);
      });
    });
    update_service = function(r) {
      var i, ls, ne, ns, o, _i, _ref;
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
      res.force = d3.layout.force().charge(-800).linkDistance(150).linkStrength(1).size([200, 200]).on('tick', function() {
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
      update_service(res);
      return res;
    };
    window.nest = new Nest({
      "container": "#nest-container"
    });
    $(document).on("click", ".btn-close", function() {
      var get_grister_instance, ui;
      ui = $(this).closest('div.list-item');
      get_grister_instance = function(ui) {
        var x, _i, _len, _ref;
        _ref = window.gridster;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          if (x.$widgets.index(ui) >= 0) {
            return x;
          }
        }
        return null;
      };
      gridster = get_grister_instance(ui);
      if (gridster == null) {
        return;
      }
      gridster.remove_widget(ui);
    });
    $("body").on("click", ".selected_info .item-action", function() {
      var cmd;
      cmd = $(this).data('nest-command');
      window.nest[cmd](window.nest.theFocus);
      window.nest.update();
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
      $("#tip").slideUp(200);
    });
    window.last_scroll = 0;
    $(window).scroll(function() {
      var toggle;
      toggle = false;
      if ($(window).scrollTop() > 400) {
        toggle = $(window).scrollTop() > window.last_scroll;
      }
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
    $("#btn_save").on("click", save);
    $(".logo").on("click", function() {
      if ($('body').hasClass('ready')) {
        $("body").animate({
          'scrollTop': 0
        });
      }
    });
    $('body').on("click", ".doc_url", function(e) {
      var $item, text, url;
      if ($(".doc_info").length === 0) {
        $item = $("<div class='doc_info list-item normal'>\n	<header class=\"drag-handle\">|||</header>\n	<input type=\"button\"  class=\"btn-close\"   value=\"X\">\n	<input type=\"button\" class=\"btn-small fav\" style=\"left:5em;\"  value=\"收藏\">\n	<input type=\"button\" class=\"btn-small share\" style=\"left:9em;\"  value=\"分享\">\n	<div class='inner'>\n		<h2 class=\"item-headline\">\n			<span></span>\n		</h2>\n		<iframe  ></iframe>\n	</div>\n</div>");
        window.gridster[1].add_widget($item, 4, 2);
      }
      url = $(this).attr('href');
      text = $(this).text();
      $(".doc_info iframe").attr('src', url);
      $(".doc_info .item-headline span").text(text);
      e.preventDefault();
    });
    window.gridster = [];
    window.gridster.push($("#nest-column").gridster({
      widget_selector: ".list-item",
      widget_margins: [5, 5],
      max_cols: 6,
      widget_base_dimensions: [200, 200],
      draggable: {
        handle: '.drag-handle'
      },
      resize: {
        enabled: true
      }
    }).data('gridster'));
    window.gridster.push($("#list-column").gridster({
      widget_selector: ".list-item",
      widget_margins: [5, 5],
      max_cols: 6,
      widget_base_dimensions: [200, 200],
      resize: {
        enabled: true
      }
    }).data('gridster'));
    $(window).on("mouseenter", ".drag-handle", function() {
      $(this).attr('title', "按住拖动");
    });
    require(['dropimage'], function(dropimage) {
      var $holder;
      $(window).on("dragover", function() {
        $('#dropimage-holder').addClass('dragover');
        return false;
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
              $('#nest-column').removeClass("hidden");
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
  });
});
