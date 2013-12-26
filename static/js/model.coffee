requirejs.config
	"baseUrl": '/js'
	"paths":
		"jquery":"jquery"
		'qtip':'jquery.qtip'
		'imagesLoaded':'imagesLoaded'
		'gridster':'jquery.gridster.with-extras'
	"shim":
		'gridster':
			'deps':['jquery']
		'qtip':
			'deps':['jquery']
		'imagesLoaded':
			'deps':['jquery']
require ['jquery','d3','nest' ,'jquery_blockUI','imagesLoaded','qtip','gridster'] , ($,d3,Nest,blockUI,imagesLoaded,qtip,gridster)->
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
		<div class="list-item normal" data-nest-node="#{d.id}">
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
	list= (d)->
		window.gridster[1].remove_all_widgets()
		docs=[]
		for link in window.nest.degree[d.index]
			if d==link.target then continue
			n= link.target
			docs.push n
		if docs.length==0
			return
		i=0
		add_widget= (l)->
			if l.length==0 or i==20
				clearInterval interval
				return
			x=l.pop()
			if x.type in "SearchProvider smartref_category query referData".split(" ") then return
			s=$(t_list_item(x))
			t= if i%3>0 then 2 else 1
			window.gridster[1].add_widget s, t,1
			i+=1
			return
		interval= setInterval add_widget, 5, docs
		return
	window.click_handler= (d)->
		if not d? then return
		document.title= d.name
		list d
		if $(".selected_info").length==0
			$item= $(t_list_item(d)).addClass('selected_info')
			window.gridster[0].add_widget $item, 3,2
		$(".selected_info .item-headline span").text(d.name)
		$(".selected_info .item-prop").empty()
		$(".selected_info .item-image").attr('src',d.img or "")
		actions= {
			'探索':"dblclick",
			'删除':"remove",
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
		fname= prompt "请输入要保存的名字",window.nest.root.id
		if not fname? then return
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
		$.blockUI({message:"正在搜索"})
		$.post "/search", JSON.stringify(data), (d)->
				if not d or d.error?
					return
				window.nest.draw d
				$('#nest-column').removeClass "hidden"
				click_handler (window.nest.root)
				$.unblockUI()
				return
			,'json'
		return
	load_automate= (scr)->
		scr= encodeURIComponent(scr)
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
			id= encodeURIComponent params.id
			$.getJSON "/model/load/#{id}", (d)->
				if not d or d.error?
					return
				window.nest.draw d
				$('#nest-column').removeClass "hidden"
				click_handler(window.nest.root)
				return
		else if params.automate?
			load_automate params.automate
		$.getJSON "/services/",(d)->
			if not d or d.error?
				console.log('error get services')
				return
			for s in d.services
				checked = ""
				if s.select? and s.select==true
					checked= "checked"
				$('.services').append """
				<li>
					<input type="checkbox"	 data-service-id="#{s.id}" #{checked} class="check-service" id="#{s.id}"> <span>使用 #{s.name} 搜索</span>
				</li>
				"""
			return
		window.nest= new Nest ({
			"container":"#nest-container",
		})
		$(document).on "click", ".btn-toggle-fullscreen" , ()->
			ui= $(this).closest('div.list-item')
			toggle= ui.attr('data-sizey')<=2
			$(this).val(if toggle then "收起" else "展开")
			if toggle
				window.gridster[0].resize_widget ui,5,5
				$('html, body').animate({"scrollTop":ui.offset().top-40})
			else
				window.gridster[0].resize_widget ui,2,2
			return
		$("body").on "click", ".selected_info .item-action", ()->
			cmd=$(@).data('nest-command')
			window.nest[cmd](window.nest.theFocus)
			window.nest.update()
			return
		$("#btn_load").click ->
			scr= prompt "要打开的文件名","default"
			if not scr?
				return
			load_automate scr
		$("#btn_tip").click ->
			$("#tip").slideToggle 200
			return
			
		$(".btn-next").click ->
			if window.current_step==window.story.length-1 then return
			window.current_step+=1
			play_step()
			return
		$(".btn-prev").click ->
			if window.current_step==0 then return
			window.current_step-=1
			play_step()
			return
		$(".btn-automate-yes").click ->
			dic=
				"nodes":window.nest.nodes,
				"links":window.nest.links.map((d)->{"source":d.source.index,"target":d.target.index}),
				"blacklist":window.nest.blacklist,
			for p in "max_total_node_num max_single_node_num timeout_seconds max_depth out_fname".split(" ")
				dic[p]=$("#"+p).val()
			console.log dic
			$("#automate-form").slideToggle()
			$.growlUI "", "宏 #{dic.out_fname} 已开始运行"
			$.post "/automate",	JSON.stringify(dic), (d)->
				if d.error?
					$.growlUI "宏 #{dic.out_fname} 运行出现如下错误",d.error
				else
					$.growlUI "","宏 #{dic.out_fname} 已完成运行"
				return
			return
		$(".btn-automate-no").click ->
			$("#automate-form").slideToggle()
			return
		$(".btn-automate").click ->
			$("#automate-form").slideToggle()
			return
		$("#btn_search").click ->
			key=$('#q').val()
			services= get_selected_services()
			search(key,services)
			$('html, body').animate({"scrollTop":0})
			return
		$('#nav').on 'mouseenter', ->
			$("#nav").removeClass("fade")
			return
		$('#nav').on 'mouseleave', ->
			if $(window).scrollTop()>0
				$("#nav").addClass("fade")
			return	
		$(window).scroll ->
			toggle= $(this).scrollTop()>0
			if toggle
				$("#nav").addClass("fade")
			else
				$("#nav").removeClass("fade")
			return
		$('#q').keypress (e) ->
			if e.keyCode==13
				$('#btn_search').click()
			return
		$("#btn_save").on "click",save
		$('body').on "click",".doc_url", (e)->
			if $(".doc_info").length==0
				$item= $("""
				<div class='doc_info list-item normal'>
					<input type="button"  class="btn-toggle-fullscreen"   value="展开">
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
				window.gridster[0].add_widget $item, 2,2
			url=$(this).attr('href')
			text= $(this).text()
			$(".doc_info iframe").attr('src',url)
			$(".doc_info .item-headline span").text(text)
			e.preventDefault()
			return
		window.gridster= []
		window.gridster.push $("#nest-column").gridster({
			widget_selector:".list-item",
			widget_margins: [5,5],
			max_cols:5,
			widget_base_dimensions: [190, 190],
			resize:
				enabled:true
		}).data('gridster')
		window.gridster[0].disable()
		window.gridster.push $("#list-column").gridster({
			widget_selector:".list-item",
			widget_margins: [5,5],
			max_cols:5,
			widget_base_dimensions: [190, 190],
			resize:
				enabled:true
		}).data('gridster')
		return
	return