requirejs.config
	"baseUrl": '/js'
	"paths":
		"jquery":"jquery"
		'blockUI': "jquery_blockUI"
	'shim':
		'blockUI':
			"deps":['jquery']
require ['packery.pkgd.min'], (x)->
	require ['packery/js/packery'] ,(pack)->
		window.packery= new pack "#wrapper",
			'itemSelector':'.list-item'
			'columnWidth':200,
			'gutter':10,
		return
	return
require ['jquery','d3','nest','blockUI'] , ($,d3,Nest,bui)->
	url_params= ()->
		res={} 
		for x in window.location.search.substring(1).split('&')
			pair= x.split('=')
			res[pair[0]]= decodeURIComponent(pair[1])
		return res
	t_item_action= (d)->
			"""
				<a class="button small" href="#">收藏</a>
				<a class="button small" href="#">分享</a>
			"""
	t_list_item= (d)->
		details= if d.content? then d.content else ""
		i= Math.floor(Math.random() * (10 - 0 + 1))
		# imgurl= "http://lorempixel.com/80/80/technics/#{i}"
		imgurl= ""
		if d.img?
			imgurl= d.img
		return """
		<div class="list-item normal w2" data-nest-node="#{d.id}">
			<header class="drag-handle">|||</header>
			<div class="btn-close">x</div>
			<div class='inner'>
				<h2 class="item-headline">
					<span>#{d.name}</span>
				</h2>
				<div class="item-prop">#{d.type} </div>
				<div>
					<img class="item-image" src="#{imgurl}"/>
				</div>
				<p class="item-detail">#{details}</p>
			</div>
		</div>
		"""
	close_toggle= ()->
		$('.toggle').removeClass('on')
		$(".toggle-container").slideUp 200
		return
	load_model= (id)->
		id= encodeURIComponent id
		close_toggle()
		$.getJSON "/model/load/#{id}", (d)->
			if not d or d.error?
				return
			window.nest.draw d
			$('#nest-column').removeClass "hidden"
			click_handler(window.nest.root)
			return
		return
	add_widget = ($x)->
		$('#wrapper').append($x)
		window.packery.appended $x
		require ['draggabilly.pkgd.min'], (Draggabilly)->
			draggie=new Draggabilly $x.get()[0],
				handle: ".drag-handle"
			window.packery.bindDraggabillyEvents draggie
			return
		return
	list= (d)->
		if  $('.list-item.normal').length>0
			window.packery.remove $('.list-item.normal').get()
			window.packery.layout()
		docs=[]	
		for link in window.nest.degree[d.index]
			if d==link.target then continue
			n= link.target
			docs.push n
		if docs.length==0
			return
		for x in docs
			# if x.type in "SearchProvider smartref_category query referData".split(" ") then continue
			s=$(t_list_item(x))
			add_widget s		
		return
	snapshot= (d)->
		$item= $("""
			<div class="list-item">
				<header class="drag-handle">|||</header>
				<div class="btn-close">x</div>
				<div class='inner select_graph'>
				</div>
			</div>
		""")
		# window.gridster[1].add_widget $item, 2,2
		if not d3?
			d3= window.d3
		$svg= $('#nest-container svg').clone()
		$item.find(".select_graph").append $svg
		$g= $svg.find(">g")
		svg= d3.select($svg.get()[0])
		svg.selectAll('.node').data(window.nest.nodes).filter((x)->not x.isHigh).remove()
		svg.selectAll('.link').data(window.nest.links).filter((x)->not x.isHigh).remove()
		svg.selectAll('.ring').remove()
		svg.selectAll('.marker').remove()
		svg.attr("pointer-events", "all")
		.attr("preserveAspectRatio","XMidYMid meet")
		.call(d3.behavior.zoom()
			.scaleExtent([0.01,10])
			.on("zoom",()->
				$g.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" +  d3.event.scale + ")"
				svg.selectAll('text').style("font-size", (1.0 / d3.event.scale) + "em")
				return
			))
		return
	window.click_handler= (d)->
		if not d? then return
		document.title= d.name
		list d
		if $(".selected_info").length==0
			$item= $(t_list_item(d)).addClass('selected_info')
			# window.gridster[0].add_widget $item, 4,2
		$(".selected_info .item-headline span").text(d.name)
		$(".selected_info .item-prop").empty()
		$(".selected_info .item-image").attr('src',d.img or "")
		if not window.nest.snapshot
			window.nest.snapshot= snapshot
		actions= {
			'探索':"dblclick",
			'删除':"remove",
			'该节点为中心的子图':"snapshot",
		}
		for x of actions
			$(".selected_info .item-prop").append $("<li/>").text(x)
			.addClass('item-action button')
			.data('nest-command',actions[x])
		if d.type=="doc"
			$(".selected_info .item-headline a").attr('href',d.url)
			container= ".selected_info .item-detail"
			value= window.nest.degree[d.index][0].value
			$(container).empty().append """<p>到聚类中心的距离：#{value}</p>"""
			$.getJSON "/keyword/#{d.name}", (res)->
				data= []
				for x of res.keyword
					data.push {'k':x,'v':res.keyword[x]}
				require ['barchart'], (barchart)->
					barchart.render data, {
						"container":container,
					}
					return
				$(container).append """<p>#{res.summary}</p>"""
				return
		else
			detail=$(".selected_info .item-detail")
			detail.empty()
			t= d.type or "未知"
			detail.append("<h3>类别：#{t}</h3>")
			detail.append("<h3>id: #{d.id}</h3>")
			if d.content?
				detail.append("<p>#{d.content}</p>")
			docs= []
			for link in window.nest.degree[d.index]
				if d==link.target then continue
				n= link.target
				if n.type!="referData" then continue
				docs.push n
			if docs.length>0
				detail.append("<h3>相关文档</h3>")
				for n in docs
					detail.append("<a href=#{n.url}  class='doc_url' target='_blank'>#{n.name}</a>")
		return
	get_selected_services = ->
		service_ids= []
		$('.check-service').each ->
			if not this.checked then return
			if $(this).data('serviceId')?
				service_ids.push $(this).data('serviceId')
		return service_ids
	save = ->
		res= {
			"nodes":[],
			"links":[],
			"blacklist":window.nest.blacklist,
		}
		close_toggle()
		fname= window.save_name[1].value
		if not fname? or fname=="" then return
		prop_node= "id name value index type url fixed distance_rank img".split(" ")
		for x in window.nest.nodes
			n= {}
			for p in prop_node
				if x[p]?
					n[p]=x[p]
			res.nodes.push n
		for x in window.nest.links
			l=
				"source":x.source.id
				"target":x.target.id
			res.links.push l
		res= JSON.stringify res
		$.post "/model?id=#{fname}", res, (d)->
			if d.error?
				$.growlUI "保存出现如下错误:", d.error
				return
			$.growlUI "","已保存"
			list_model()
		return
	blockUI= ()->
		$('html, body').attr({"scrollTop":400})
		$('html, body').animate({"scrollTop":0})
		$('.busy').fadeIn()
		return
	unblockUI= ()->
		$('html, body').animate({"scrollTop":400})
		$('.busy').fadeOut()
		return
	play_step= ->
		if window.current_step>=window.story.length or window.current_step<0 then return
		s= window.story[window.current_step]
		info= window.story[window.current_step]
		$("#story-indicator,.btn-next,.btn-prev,.btn-automate").show()
		$("#story-indicator").text("第#{window.current_step+1}步，共#{window.story.length}步， 节点数：#{info.nodes.length}")
		window.nest.draw s
		$('#nest-column').removeClass "hidden"
		return
	search= (key, services)->
		data= {
			'keys':key,
			'services':services,
		}
		close_toggle()
		blockUI()
		$.post "/search", JSON.stringify(data), (d)->
				if not d or d.error?
					return
				window.nest.draw d
				$('#nest-column').removeClass "hidden"
				click_handler (window.nest.root)
				unblockUI()
				return
			,'json'
		return
	load_automate= (scr)->
		scr= encodeURIComponent(scr)
		close_toggle()
		$.getJSON "/play/#{scr}", (d)->
			window.story= []
			window.current_step=0
			graph=
				nodes:[], 
				links:[]
			for s in d
				if s.event=="draw"
					graph.nodes= s.nodes
					graph.links= s.links
				else
					graph.nodes= graph.nodes.concat(s.nodes)
					graph.links= graph.links.concat(s.links)
				cur= {}
				$.extend(cur,graph)
				window.story.push cur
			play_step()
			click_handler (window.nest.root)
			return
		return
	list_automate= ()->
		$.getJSON "/list?output=json&type=automate", (d)->
			if not d or d.error?
				console.log('error get services')
				return
			$('.automates').empty()
			for x in d
				$('.automates').append $("""
					<li class="list" >#{x[0]}</li>
				""")
			return
		return
	list_model= ()->
		$.getJSON "/list?output=json&type=model", (d)->
			if not d or d.error?
				console.log('error get services')
				return
			$('.snapshots').empty()	
			for x in d
				$('.snapshots').append $("""
					<li class="list" >#{x[0]}</li>
				""")
			$("body").on "click", ".snapshots li", ()->
				load_model $(@).text()
				return
			return
		return
	list_service= ()->
		$.getJSON "/services",(d)->
			if not d or d.error?
				console.log('error get services')
				return
			window.services= d.services
			$('.services').empty()
			for s in d.services
				checked = ""
				if s.select? and s.select==true
					checked= "checked"
				$item= $("""
				<li>
					<img src="#{s.img}"/>
					<strong>#{s.name}</strong>
					<label>
						<input type="checkbox" class="ios-switch   check-service" data-service-id="#{s.id}" #{checked}  id="#{s.id}">
						<div><div></div></div>
					</label>
					<p>#{s.desc}</p>
				</li>
				""")
				if checked=="checked"
					$item.addClass('on')
				$('.services').append $item
			r= init_service(window.services)
			$('body').on 'click','.services li', (e)->
				checkbox=$(@).find('input[type=checkbox]')
				index=$(@).parent().find("li").index($(@))
				checkbox.prop("checked", !checkbox.prop("checked"))
				checked= checkbox.prop("checked")
				$(@).toggleClass('on')
				window.services[index].select= checked
				update_service(r)
				return
			return
		return
	update_service= (r)->
		ns= window.services.filter((x)->x.select)
		o=$('.logo').offset()
		ns.splice(0,0,
			'id':'services_root','name':"",'select':true,
			'desc':'',
			'img':'',
			'fixed':true,
			'x':o.left+64,
			'y':o.top+64,
		)
		ls= []
		i=0
		for i in [0..ns.length-1]
			if i==0 then  continue
			ls.push {source:0,target:i}
		r.force.nodes(ns).links(ls).start()
		r.nodes= r.nodes.data(r.force.nodes(),(d)->d.id)
		r.links= r.links.data(r.force.links())
		ne= r.nodes.enter().append('g').classed('node',true)
		ne.append('image')
		.attr('width',30)
		.attr('height',30)
		.attr('xlink:href',(d)->d.img)
		.call(r.force.drag)
		ne.append('title').text((d)->d.desc)
		ne.append('text').text((d)->d.name).attr('dx',-10).attr('dy',20).attr('text-anchor','end')
		r.nodes.exit().remove()

		r.links.enter().insert("line", ".node").classed('link',true)
		r.links.exit().remove()
		return
	init_service= (services)->
		res= {}
		d3= window.d3
		res.svg= d3.select('#banner .overlay').append("svg")
		res.nodes= res.svg.selectAll('.node')
		res.links= res.svg.selectAll('.link')
		res.force= d3.layout.force()
		.charge(-1000)
		.linkDistance(150)
		.linkStrength(1)
		.size([200,200])	
		.on('tick',()->
			res.nodes.attr "transform", (d) ->
				"translate(#{d.x},#{d.y})"
			res.links.attr("x1", (d) ->
				d.source.x
			).attr("y1", (d) ->
				d.source.y
			).attr("x2", (d) ->
				d.target.x
			).attr("y2", (d) ->
				d.target.y
			)
		)
		update_service(res)
		return res	
	$ ->
		params= url_params()
		if params.theme?
			$('body').addClass(params.theme)
		if params.no_nav?
			$('body').addClass("no-nav")
		needs_nest= false			
		if params.q?
			key= params.q
			services=  ['baike']
			if params.services?
				services= params.services.split('|')
			search(key,services)
		else if params.id?
			load_model params.id
		else if params.automate?
			load_automate params.automate
		list_service()
		list_model()
		list_automate()
		window.nest= new Nest ({
			"container":"#nest-container",
		})
		$(document).on "click", ".btn-close" , ()->
			ui= $(this).closest('div.list-item')
			# gridster.remove_widget ui
			return
		$("body")
		.on "click", ".selected_info .item-action", ()->
			cmd=$(@).data('nest-command')
			window.nest[cmd](window.nest.theFocus)
			window.nest.update()
			return
		.on "click", ".btn-no", ()->
			close_toggle()
			return			
		.on "click", ".btn-automate-yes", ()->
			close_toggle()
			dic=
				"nodes":window.nest.nodes,
				"links":window.nest.links.map((d)->{"source":d.source.index,"target":d.target.index}),
				"blacklist":window.nest.blacklist,
			for p in "max_total_node_num max_single_node_num timeout_seconds max_depth out_fname".split(" ")
				dic[p]=window[p][1].value
			console.log dic
			$.growlUI "", "宏 #{dic.out_fname} 已开始运行"
			$.post "/automate",	JSON.stringify(dic), (d)->
				if d.error?
					$.growlUI "宏 #{dic.out_fname} 运行出现如下错误",d.error
				else
					$.growlUI "","宏 #{dic.out_fname} 已完成运行"
					list_automate()
				return
			return
		.on "click", ".btn-next", ()->
			if window.current_step==window.story.length-1 then return
			window.current_step+=1
			play_step()
			return
		.on "click", ".btn-prev", ()->
			if window.current_step==0 then return
			window.current_step-=1
			play_step()
			return
		.on("click", '.btn-save', save)
		.on "click", ".automates li", ()->
			load_automate $(@).text()
			return
		.on "click", ".snapshots li", ()->
			load_model $(@).text()
			return		
		$(".btn-resize").click ->
			ui=$(@).closest('.list-item')
			ui.toggleClass('expanded')
			flag= ui.hasClass('expanded')
			if  flag
				# window.gridster[0].resize_widget ui, 6,4
				$('body').animate({'scrollTop':ui.offset().top-80})
			$(@).val(if flag then "缩小" else  "放大")
			window.packery.layout()
			return

		$("#btn_search").click ->
			key=$('#q').val()
			services= get_selected_services()
			search(key,services)
			return
		window.last_scroll=0
		$(window).scroll ->
			toggle= false
			if $(window).scrollTop()>400
				toggle= $(window).scrollTop()>window.last_scroll
			if $(window).scrollTop()>400
				$("body").addClass "ready"
			else
				$("body").removeClass "ready"
			return
		$('#q').keypress (e) ->
			if e.keyCode==13
				$('#btn_search').click()
			return
		$(".logo").on "click", ()->
			if $('body').hasClass('ready')
				$("body").animate({'scrollTop':0})
			return
		$('body').on "click",".doc_url", (e)->
			if $(".doc_info").length==0
				$item= $("""
				<div class='doc_info list-item normal'>
					<header class="drag-handle">|||</header>
					<input type="button"  class="btn-close"   value="X">
					<input type="button" class="btn-small fav" style="left:5em;"  value="收藏">
					<input type="button" class="btn-small share" style="left:9em;"  value="分享">
					<div class='inner'>
						<h2 class="item-headline">
							<span></span>
						</h2>
						<iframe  ></iframe>
					</div>
				</div>
				""")
				# window.gridster[1].add_widget $item, 4,2
			url=$(this).attr('href')
			text= $(this).text()
			$(".doc_info iframe").attr('src',url)
			$(".doc_info .item-headline span").text(text)
			e.preventDefault()
			return
		$(window).on "mouseenter",".drag-handle", ->
			$(this).attr('title',"按住拖动")
			return
		require ['dropimage'], (dropimage)->
			$(window).on "dragover", ->
				$('#dropimage-holder').addClass('dragover')
				false
			$holder=$('#dropimage-holder')
			if dropimage.tests.dnd
				$holder.on 'drop', (e)->
					$(this).removeClass('dragover')
					e.preventDefault()
					data= new FormData()
					for x in e.originalEvent.dataTransfer.files
						data.append "myfile",x
					blockUI()
					$.ajax
						url: '/search',
						type: 'POST',
						data: data,
						cache: false,
						contentType: false,
						processData: false,
						success: (d)->
							$('#nest-column').removeClass "hidden"
							window.nest.draw d
							click_handler (window.nest.root)
							unblockUI()
							return
						error: (d)->
							console.log e
							unblockUI()
							return
					,"json"
					return false

		$("#nav-buttons .toggle").on "click",()->
			$("#nav-buttons .toggle").not($(@)).removeClass 'on'
			$(@).toggleClass 'on'
			c=$(".toggle-container")
			if $(@).hasClass 'on'
				id=$(@).data('toggleId')
				c.children(":first").empty().append($(id).clone().removeAttr('id').show())
				c.slideDown 200
			else
				c.slideUp(200).children(":first").empty()
			return
		return
	return