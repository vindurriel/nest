var make_draggable, url_params,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

requirejs.config({
  "baseUrl": '/js',
  "paths": {
    'packery': 'packery.pkgd.min',
    'jsc3d': 'jsc3d.min',
    'jsc3d_touch': 'jsc3d.touch',
    "jquery": "jquery",
    "dropimage": "dropimage",
    'noty': "jquery.noty.packaged.min",
    'draggabilly': 'draggabilly.pkgd.min'
  },
  'shim': {
    'noty': {
      "deps": ['jquery']
    },
    'd3': {
      'exports': 'd3'
    }
  }
});

require(["jsc3d", 'jsc3d_touch'], function(a, b) {});

require(['packery'], function(p) {
  require(['packery/js/packery', 'jquery'], function(pack, $) {
    window.packery = new pack("#wrapper", {
      'itemSelector': '.list-item',
      'columnWidth': 200,
      'gutter': 10
    });
    make_draggable($("#nest-container").parent().get()[0]);
  });
});

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

make_draggable = function(item) {
  return require(['packery'], function(ignore) {
    require(['packery/js/packery', 'draggabilly'], function(pack, Draggabilly) {
      var draggie;
      draggie = new Draggabilly(item, {
        handle: ".drag-handle"
      });
      window.packery.bindDraggabillyEvents(draggie);
    });
  });
};

require(['jquery', 'd3', 'nest', 'dropimage'], function($, d3, Nest, dropimage) {
  var add_widget, blockUI, close_toggle, hex, init_service, list, list_automate, list_model, list_service, load_automate, load_model, load_more_docs, make_3d_obj, make_doc, make_referData, notify, play_step, rgb2hex, save, search, t_item_action, t_list_item, unblockUI, update_service;
  t_item_action = function() {
    return $("<input type=\"button\" class=\"btn-small fav top left\" value=\"收藏\">\n<input type=\"button\" class=\"btn-small share top left\" value=\"分享\">");
  };
  t_list_item = function(d) {
    var color, res;
    color = window.nest.color(d);
    res = $("<div class=\"list-item normal w2\" data-nest-node=\"" + d.id + "\">\n	<header class=\"drag-handle top left\">|||</header>\n	<input type=\"button\" class=\"btn-close top right\" value=\"关闭\" />\n	<input type=\"button\" class=\"btn-resize top right\" value=\"放大\" />\n	<div class='inner'>\n		<h2 class=\"item-headline\">\n			<span style=\"border-color:" + color + "\">" + d.name + "</span>\n		</h2>\n		<div class=\"item-prop\"></div>\n		<img class=\"item-image hidden\"/>\n		<div class=\"item-detail\"></div>\n	</div>\n</div>");
    if (d.img != null) {
      res.addClass('h2');
      res.find('.item-image').removeClass('hidden').attr('src', d.img);
    }
    return res;
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
    make_draggable($x.get()[0]);
  };
  list = function(d) {
    var related;
    if ($('.list-item.normal').length > 0) {
      window.packery.remove($('.list-item.normal').get());
      window.packery.layout();
    }
    related = [];
    window.nest.degree[d.id].map(function(link) {
      var n, _ref;
      if (d === link.target) {
        return;
      }
      n = link.target;
      if (_ref = n.type, __indexOf.call("SearchProvider smartref_category query".split(" "), _ref) >= 0) {
        return;
      }
      related.push(n);
    });
    if (related.length > 0) {
      window.loadFunc = load_more_docs(related, 10);
      window.loadFunc();
    }
  };
  make_referData = function(x, container) {
    var docs, n, _i, _len;
    docs = [];
    window.nest.degree[x.id].map(function(link) {
      var n;
      if (x === link.target) {
        return;
      }
      n = link.target;
      if (n.type !== "referData") {
        return;
      }
      docs.push(n);
    });
    if (docs.length === 0) {
      return;
    }
    container.append("<h3>相关文档</h3>");
    for (_i = 0, _len = docs.length; _i < _len; _i++) {
      n = docs[_i];
      container.append("<span  data-doc-id='" + n.id + "' class='doc_url'>" + n.name + "</span>");
    }
  };
  load_more_docs = function(items, num) {
    if (num == null) {
      num = 10;
    }
    return function() {
      var new_items;
      window.packery.layout();
      new_items = items.splice(0, num);
      new_items.map(function(x) {
        var detail, s;
        s = t_list_item(x);
        detail = s.find('.item-detail');
        if (x.obj != null) {
          detail.append(make_3d_obj(x.obj));
          s.addClass("h2");
        }
        if (x.content != null) {
          detail.append("<p>" + x.content + "</p>");
        }
        make_referData(x, detail);
        add_widget(s);
      });
    };
  };
  hex = function(x) {
    var hexDigits;
    hexDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    if (isNaN(x)) {
      return "00";
    } else {
      return hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
    }
  };
  rgb2hex = function(rgb) {
    var m;
    m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return "#" + hex(m[1]) + hex(m[2]) + hex(m[3]);
  };
  make_3d_obj = function(url) {
    var bgcolor, cv, viewer;
    cv = $("<canvas class=\"obj\" width=380 height=300 ></canvas>");
    viewer = new JSC3D.Viewer(cv.get()[0]);
    viewer.setParameter('SceneUrl', url);
    viewer.setParameter('ModelColor', '#0088dd');
    bgcolor = rgb2hex($(".list-item").css("background-color"));
    viewer.setParameter('BackgroundColor1', bgcolor);
    viewer.setParameter('BackgroundColor2', bgcolor);
    viewer.setParameter('RenderMode', 'wireframe');
    viewer.setParameter('InitRotationX', '45');
    viewer.setParameter('InitRotationY', '45');
    viewer.init();
    viewer.update();
    return cv;
  };
  make_doc = function(d, container) {
    var value;
    $(".selected_info .item-headline a").attr('href', d.url);
    value = window.nest.degree[d.id][0].value;
    container.append("<p>到聚类中心的距离：" + value + "</p>");
    container.append($("<p class='placeholder'>正在载入信息...</p>"));
    return $.getJSON("/keyword/" + d.name, function(res) {
      var data, x;
      $(container).find(".placeholder").remove();
      data = [];
      for (x in res.keyword) {
        data.push({
          'k': x,
          'v': res.keyword[x]
        });
      }
      container.append("<p>词频直方图：</p>");
      require(['barchart'], function(barchart) {
        barchart.render(data, {
          "container": container
        });
        container.append("<p>摘要：</p>");
        container.append("<p>" + res.summary + "</p>");
      });
    });
  };
  window.clone_handler = function(d, $svg) {
    var $item;
    $item = t_list_item(d).addClass("h2").removeClass('normal');
    $item.find('.drag-handle').after(t_item_action());
    add_widget($item, $('.selected_info'));
    $item.find('.inner').append($svg);
  };
  window.click_handler = function(d) {
    var $item, actions, detail, props, t, x;
    if (d == null) {
      return;
    }
    document.title = d.name;
    if ($(".selected_info").length === 0) {
      $item = t_list_item(d).attr('class', "selected_info list-item w2 h2");
      add_widget($item, $('#nest-container').parent());
    }
    $(".selected_info .item-headline span").text(d.name);
    $(".selected_info .item-headline span").css("border-color", window.nest.color(d));
    $(".selected_info .item-prop").empty();
    $(".selected_info .item-image").attr('src', d.img || "");
    $(".selected_info .obj").remove();
    if (d.obj != null) {
      $('.selected_info .item-prop').after(make_3d_obj(d.obj));
    }
    props = $(".selected_info .item-prop");
    actions = {
      '探索': "dblclick",
      '删除': "remove",
      '该节点为中心的子图': "clone"
    };
    for (x in actions) {
      props.append($("<li/>").text(x).addClass('item-action button').data('nest-command', actions[x]));
    }
    detail = $(".selected_info .item-detail");
    if (d.type === "doc") {
      make_doc(d, detail.empty());
    } else {
      detail.empty();
      t = d.type || "未知";
      $(".selected_info .item-headline").attr('title', "类别:" + t + " id:" + d.id);
      if (d.content != null) {
        detail.append("<p>" + d.content + "</p>");
      }
      make_referData(d, detail);
    }
    list(d);
    window.nest.highlight(d);
  };
  window.doc_handler = function(d) {
    var $item, url;
    $item = t_list_item(d).addClass('doc_info h2 expanded').removeClass('normal');
    url = d.url || d.name;
    $item.find('.inner').append("<iframe src=\"" + url + "\" ></iframe>");
    $item.find('.drag-handle').after(t_item_action());
    $item.find('.btn-resize').val('缩小');
    add_widget($item, $(".selected_info"));
  };
  save = function() {
    var l, n, p, prop_node, res, save_file_name, x, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    res = {
      "nodes": [],
      "links": [],
      "blacklist": window.nest.blacklist
    };
    close_toggle();
    save_file_name = window.save_name[1].value;
    if ((save_file_name == null) || save_file_name === "") {
      return;
    }
    save_file_name = encodeURIComponent(save_file_name);
    prop_node = "id name value index type url x y distance_rank img".split(" ");
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
    $.post("/model?id=" + save_file_name, res, function(d) {
      if (d.error != null) {
        notify("保存出现如下错误:" + d.error);
        return;
      }
      notify("已保存");
      return list_model();
    });
  };
  notify = function(what) {
    require(['noty'], function(noty) {
      window.noty({
        text: what,
        type: 'error',
        timeout: 3000,
        closeWith: ['click'],
        layout: 'bottomRight'
      });
    });
  };
  blockUI = function() {
    $('html, body').attr({
      "scrollTop": 400
    }).animate({
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
  play_step = function(direction) {
    var s;
    if (window.current_step == null) {
      window.current_step = -1;
    }
    if (direction === "->" && window.current_step >= window.story.length - 1) {
      return;
    } else if (direction === "<-" && window.current_step <= 0) {
      return;
    }
    $('#nest-container').parent().removeClass("hidden");
    $("#story-indicator,.btn-next,.btn-prev,.btn-automate").show();
    if (direction === "->") {
      current_step += 1;
      s = window.story[window.current_step];
      if (s.event === "draw") {
        window.nest.draw(s);
      } else {
        window.nest.expand(s);
      }
    } else if (direction === "<-") {
      s = window.story[window.current_step];
      if (s.modified === true) {
        return;
      }
      if (s.event === "draw") {
        window.nest.draw(s);
      } else {
        window.nest.rm(s);
      }
      current_step -= 1;
      s = window.story[window.current_step];
    } else {
      return;
    }
    click_handler(window.nest.hNode[s.current_node_id]);
    $("#story-indicator").text("第" + (window.current_step + 1) + "步，共" + window.story.length + "步  " + s.current_node_id);
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
      var graph, len;
      window.story = [];
      graph = {
        nodes: [],
        links: []
      };
      d.map(function(step) {
        step.nodes.map(function(n) {
          window.nest.normalize_id(n);
          graph.nodes.push(n);
        });
      });
      len = graph.nodes.length;
      d.map(function(step) {
        step.links.map(function(l) {
          var f;
          f = function(linknode) {
            if (typeof linknode !== "number") {
              return linknode;
            }
            if (linknode < 0 || linknode > len - 1) {
              return;
            }
            return graph.nodes[linknode];
          };
          l.source = f(l.source);
          l.target = f(l.target);
          if ((l.source == null) || (l.target == null)) {
            l["delete"] = "delete";
          }
        });
        step.links = step.links.filter(function(l) {
          return l["delete"] == null;
        });
      });
      d.map(function(step) {
        if (step.current_node_id == null) {
          step.current_node_id = step.nodes[0].id;
        }
        window.story.push(step);
      });
      window.current_step = -1;
      play_step("->");
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
    var $holder, key, needs_nest, params, services;
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
    window.nest.events.on("explore_node", function(e) {
      if (window.story != null) {
        window.story[window.current_step].modified = true;
      }
    }).on("remove_node", function(e) {
      click_handler(window.nest.root);
      if (window.story != null) {
        window.story[window.current_step].modified = true;
      }
    }).on("click_doc", function(e, d) {
      return doc_handler(d);
    }).on("clone_graph", function(e, d, $svg) {
      return clone_handler(d, $svg);
    }).on('click', function(e, d) {
      return click_handler(d);
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
    }).on("click", ".fav", function() {
      notify("已收藏");
    }).on("click", ".share", function() {
      notify("已分享");
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
      notify("宏 " + dic.out_fname + " 已开始运行");
      $.post("/automate", JSON.stringify(dic), function(d) {
        if (d.error != null) {
          notify(("宏 " + dic.out_fname + " 运行出现如下错误 ") + d.error);
        } else {
          notify("宏 " + dic.out_fname + " 已完成运行");
          list_automate();
        }
      });
    }).on("click", ".btn-next", function() {
      play_step("->");
    }).on("click", ".btn-prev", function() {
      play_step("<-");
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
      services = window.services.filter(function(d) {
        return d.select;
      }).map(function(d) {
        return d.id;
      });
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
    $(window).on("dragover", function() {
      $('#dropimage-holder').addClass('dragover');
      return false;
    });
    $(window).on("mouseup", function() {
      $('#dropimage-holder').removeClass('dragover');
    });
    $holder = $('#dropimage-holder');
    if (dropimage.tests.dnd) {
      $holder.on('drop', function(e) {
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
    $(window).on("scroll", function() {
      if ($(".load-more").offset().top <= $(window).scrollTop() + $(window).height()) {
        if (window.loadFunc != null) {
          window.loadFunc();
        }
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
