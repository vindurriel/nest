#requirejs中包路径的配置
requirejs.config 
	"baseUrl": '/js'
	"paths":
		'packery':'packery.pkgd.min'
		'jsc3d':'jsc3d.min' #jsc3d用于3d模型文件（.obj）的显示
		'jsc3d_touch':'jsc3d.touch'
		"jquery":"jquery"
		"dropimage":"dropimage" #拖放图片到某个位置就上传图片
		'noty': "jquery.noty.packaged.min" #jquery消息提示插件
		'draggabilly':'draggabilly.pkgd.min' #packery的页面元素拖拽插件
	#shim用于配置那些不支持amd加载方式的包	
	'shim':
		'noty':  
			"deps":['jquery']
		'd3':
			'exports': 'd3'

require ["jsc3d",'jsc3d_touch'], (a,b)->
	return
#packery用于页面布局
# require ['packery.pkgd.min','jquery'], (x,$)->
# 	require ['packery/js/packery','draggabilly'] ,(pack,Draggabilly)->
require ['packery'], (p)->
	require ['packery/js/packery','jquery'],(pack,$)->
		window.packery= new pack "#wrapper",
			'itemSelector':'.list-item'
			'columnWidth':200,
			'gutter':10,
		#让知识图谱能拖拽
		make_draggable $("#nest-container").parent().get()[0]
		return
	return
#找到所有url中的参数，并以一个object的方式返回
#输入：无（页面url），输出：object
url_params= ()->
	res={} 
	for x in window.location.search.substring(1).split('&')
		pair= x.split('=')
		res[pair[0]]= decodeURIComponent(pair[1])
	return res	
#让item能拖拽。必须先初始化window.packery。
#输入：dom element，输出：无
make_draggable= (item)->
	require ['packery'], (ignore)->
		require ['packery/js/packery','draggabilly'] ,(pack,Draggabilly)->
			draggie= new Draggabilly item,{
				handle: ".drag-handle"
			}
			window.packery.bindDraggabillyEvents draggie
			return
		return
require ['jquery','d3','nest','dropimage'] , ($,d3,Nest,dropimage)->
	#item的默认操作，出现在item的左上方，拖拽把手的后边
	#输入：无，输出：jquery对象
	t_item_action= ()->
		$("""
			<input type="button" class="btn-small fav top left" value="收藏">
			<input type="button" class="btn-small share top left" value="分享">
		""")
	#item的默认模板
	#输入：node data，输出：jquery对象
	t_list_item= (d)->
		color= window.nest.color d
		res=$("""
		<div class="list-item normal w2" data-nest-node="#{d.id}">
			<header class="drag-handle top left">|||</header>
			<input type="button" class="btn-close top right" value="关闭" />
			<input type="button" class="btn-resize top right" value="放大" />
			<div class='inner'>
				<h2 class="item-headline">
					<span style="border-color:#{color}">#{d.name}</span>
				</h2>
				<div class="item-prop"></div>
				<img class="item-image hidden"/>
				<div class="item-detail"></div>
			</div>
		</div>
		""")
		if d.img?
			res.addClass('h2')
			res.find('.item-image').removeClass('hidden').attr('src',d.img)
		return res
	#关闭.toggle-container
	close_toggle= ()-> 
		$('.toggle').removeClass('on')
		$(".toggle-container").slideUp 200
		return
	#加载model（.json格式的graph）。先访问/model/load/:id, 成功后调用window.nest.draw
	load_model= (id)->
		id= encodeURIComponent id
		close_toggle()
		$.getJSON "/model/load/#{id}", (d)->
			if not d or d.error?
				return
			window.nest.draw d
			$('#nest-container').parent().removeClass "hidden"
			click_handler(window.nest.root)
			return
		return
	#向wrapper中追加item。如果提供了after，则在after指定的元素之后插入item。
	add_widget = ($x, after=null)->
		if after?
			$x.insertAfter after
			window.packery.reloadItems()
			window.packery.layout()
		else
			$('#wrapper').append($x)
			window.packery.appended $x
		#为item添加拖拽功能
		make_draggable $x.get()[0]
		return
	#向wrapper中添加和当前节点相连的节点对应的item
	#实现了一个分批加载的功能，每次先加载部分item，用户浏览到底的时候（.load-more进入屏幕区域)，加载更多的item
	list= (d)-> 
		#删除所有.list-item.normal, 也就是除知识图谱、图谱碎片、.doc_info和.selected_info外的所有item
		if  $('.list-item.normal').length>0
			window.packery.remove $('.list-item.normal').get()
			window.packery.layout()
		related= []	
		window.nest.degree[d.id].map (link)->
			#滤掉target为当前节点的link
			if d==link.target then return
			n= link.target
			if n.type in "SearchProvider smartref_category query".split(" ") then return
			related.push n
			return
		if related.length>0
			#分批加载。window.loadFunc会在.load-more进入屏幕可视区域时被调用。
			window.loadFunc = load_more_docs related,10
			window.loadFunc()
		return
	#加载相关文档（type为referData）
	make_referData= (x,container)->
		docs= []
		window.nest.degree[x.id].map (link)->
			if x==link.target then return
			n= link.target
			if n.type!="referData" then return
			docs.push n
			return
		if docs.length==0 then return
		container.append("<h3>相关文档</h3>")
		for n in docs
			container.append("<span  data-doc-id='#{n.id}' class='doc_url'>#{n.name}</span>")
		return
	#对于输入的items，每次调用该函数，加载剩余的num个
	#输入：items是array，num是每次加载的item个数
	load_more_docs= (items,num=10)->
		#闭包是为了让items持久化
		return ()->
			window.packery.layout()
			#从items的前面去除num个元素，加到new_items中。如items不够num个，也能成功。
			new_items= items.splice 0,num
			new_items.map (x)->
				s= t_list_item(x)
				detail= s.find('.item-detail')
				#加载3d模型
				if x.obj?
					detail.append make_3d_obj(x.obj)
					s.addClass("h2")
				if x.content?
					detail.append("<p>#{x.content}</p>")
				#加载相关文档（type为referData）
				make_referData x, detail
				add_widget s
				return
			return 
	#10进制转16进制
	hex= (x)->
		hexDigits= ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"]
		if isNaN(x) then "00" else hexDigits[(x - x % 16) / 16] + hexDigits[x % 16]
	#rgb颜色转成hex颜色
	#输入："rgb(255,255,255)",输出："#ffffff"
	rgb2hex= (rgb)->
		m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
		"#" + hex(m[1]) + hex(m[2]) + hex(m[3])
	#读取并显示3d模型文件，格式.obj
	#输入：url（3d模型文件的地址）;输出：jquery element
	make_3d_obj= (url)->
			cv= $("""
				<canvas class="obj" width=380 height=300 ></canvas>
				""")
			viewer = new JSC3D.Viewer(cv.get()[0])
			viewer.setParameter('SceneUrl',	url)
			#模型颜色
			viewer.setParameter('ModelColor',   '#0088dd')
			#背景颜色
			bgcolor= rgb2hex($(".list-item").css("background-color")) 
			viewer.setParameter('BackgroundColor1', bgcolor)
			viewer.setParameter('BackgroundColor2', bgcolor)
			#渲染模式，可选择flat,wireframe,smooth,texture,point
			viewer.setParameter('RenderMode', 'wireframe')
			#角度
			viewer.setParameter('InitRotationX', '45')
			viewer.setParameter('InitRotationY', '45')
			viewer.init()
			viewer.update()
			return cv
	#处理类型为doc的node data
	#输入：nodedata，输出：无
	make_doc= (d,container)->
			$(".selected_info .item-headline a").attr('href',d.url)
			value= window.nest.degree[d.id][0].value
			container.append """<p>到聚类中心的距离：#{value}</p>"""
			container.append $("<p class='placeholder'>正在载入信息...</p>")
			$.getJSON "/keyword/#{d.name}", (res)->
				$(container).find(".placeholder").remove()
				data= []
				for x of res.keyword
					data.push {'k':x,'v':res.keyword[x]}
				container.append """<p>词频直方图：</p>"""
				require ['barchart'], (barchart)->
					barchart.render data, {
						"container":container,
					}
					container.append """<p>摘要：</p>"""
					container.append """<p>#{res.summary}</p>"""
					return
				return
	#负责将nest.clone生成的svg图包装成item加入到整体布局中
	window.clone_handler= (d,$svg)->
		$item= t_list_item(d).addClass("h2").removeClass('normal')
		#添加item actions（收藏、分享等
		$item.find('.drag-handle').after t_item_action()
		add_widget $item, $('.selected_info')
		$item.find('.inner').append $svg
		return
	#负责处理click事件，主要是.selected_info这个item的创建和更新
	window.click_handler= (d)->
		if not d? then return
		document.title= d.name
		if $(".selected_info").length==0
			#创建选中node信息的item
			$item=  t_list_item(d).attr('class',"selected_info list-item w2 h2")
			add_widget $item, $('#nest-container').parent()
		$(".selected_info .item-headline span").text(d.name)
		$(".selected_info .item-headline span").css("border-color",window.nest.color(d))
		$(".selected_info .item-prop").empty()
		$(".selected_info .item-image").attr('src',d.img or "")
		$(".selected_info .obj").remove()
		#3d模型的显示
		if d.obj?
			$('.selected_info .item-prop').after make_3d_obj(d.obj)
		props=$(".selected_info .item-prop")
		#动态添加一些选中节点支持的操作，key为显示的操作名，value为nest中支持的函数名
		actions= {
			'探索':"dblclick",
			'删除':"remove",
			'该节点为中心的子图':"clone",
		}
		for x of actions
			props.append $("<li/>").text(x)
			.addClass('item-action button')
			.data('nest-command',actions[x])
		detail=$(".selected_info .item-detail")
		if d.type=="doc"
			make_doc d, detail.empty()
		#在此可添加对其他type的node data的显示模板，例如：
		#else if d.type=="new_type"
		else #默认的显示模板
			detail.empty()
			t= d.type or "未知"
			$(".selected_info .item-headline").attr('title',"""类别:#{t} id:#{d.id}""")
			if d.content?
				detail.append("<p>#{d.content}</p>")
			#更新相关文档
			make_referData d,detail
		#加载选中节点相关的节点
		list d
		#高亮节点，主要是为了更新.marker的位置
		window.nest.highlight d
		return
	#负责处理打开referData和doc类型的操作
	window.doc_handler= (d)->
		$item= t_list_item(d).addClass('doc_info h2 expanded').removeClass('normal')
		url= d.url or d.name
		#通过一个iframe来打开node data中的url
		$item.find('.inner').append("""<iframe src="#{url}" ></iframe>""")
		$item.find('.drag-handle').after t_item_action()
		$item.find('.btn-resize').val('缩小') 
		#加到.selected_info后面
		add_widget $item, $(".selected_info")
		return
	#保存
	save = ()->
		res= {
			"nodes":[],
			"links":[],
			"blacklist":window.nest.blacklist,
		}
		close_toggle()
		#因为toggle-container中是clone的元素，所以window.save_name有两个，用户修改过的是第二个。
		save_file_name= window.save_name[1].value
		if not save_file_name? or save_file_name=="" then return
		save_file_name= encodeURIComponent save_file_name
		#需要储存的节点属性列表
		prop_node= "id name value index type url x y distance_rank img".split(" ")
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
		$.post "/model?id=#{save_file_name}", res, (d)->
			if d.error?
				notify "保存出现如下错误:"+ d.error
				return
			notify "已保存"
			#保存后需要重新获取model list
			list_model()
		return
	#使用jquery noty来显示
	#输入：string，输出:无
	notify = (what)->
		require ['noty'], (noty)->
			window.noty
				text: what
				type: 'error' #因为红色醒目~
				timeout:3000
				closeWith: ['click'] #点击关闭
				layout:'bottomRight'
			return
		return
	#通过显示.busy表明正在进行后台操作
	blockUI= ()->
		$('html, body').attr({"scrollTop":400}).animate({"scrollTop":0})
		$('.busy').fadeIn()
		return
	#通过隐藏.busy表明后台操作结束
	unblockUI= ()->
		$('html, body').animate({"scrollTop":400})
		$('.busy').fadeOut()
		return
	play_step= (direction)->
		if not window.current_step?
			window.current_step=-1
		if direction=="->" and window.current_step>=window.story.length-1 then return
		else if direction=="<-" and window.current_step<=0 then return
		$('#nest-container').parent().removeClass "hidden"
		$("#story-indicator,.btn-next,.btn-prev,.btn-automate").show()
		if direction=="->"
			current_step+=1
			s= window.story[window.current_step]
			if s.event=="draw"
				window.nest.draw s
			else
				window.nest.expand s
		else if direction=="<-"
			s= window.story[window.current_step]
			if s.modified == true
				return
			if s.event=="draw"
				window.nest.draw s
			else
				window.nest.rm s
			current_step-=1
			s= window.story[window.current_step]
		else
			return
		click_handler window.nest.hNode[s.current_node_id]
		$("#story-indicator").text("第#{window.current_step+1}步，共#{window.story.length}步  #{s.current_node_id}")
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
				$('#nest-container').parent().removeClass "hidden"
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
			graph=
				nodes:[] 
				links:[]
			#normalize node id, make all nodes available via index
			d.map (step)->
				step.nodes.map (n)->
					window.nest.normalize_id n
					graph.nodes.push n
					return
				return
			#normalize link, and make sure all link ids are not number
			len= graph.nodes.length
			d.map (step)->
				step.links.map (l)->
					f= (linknode)->
						if typeof(linknode)!="number"
							return linknode
						if linknode<0 or linknode>len-1
							return
						return graph.nodes[linknode]
					l.source=f l.source
					l.target=f l.target
					if not l.source? or not l.target?
						l.delete= "delete"
					return
				step.links= step.links.filter (l)->not l.delete?
				return
			d.map (step)->
				if not step.current_node_id?
					step.current_node_id= step.nodes[0].id
				window.story.push step
				return
			window.current_step=-1
			play_step("->")
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
				<li data-service-id="#{s.id}">
					<img src="#{s.img}"/>
					<strong>#{s.name}</strong>
					<label>
						<input type="checkbox" class="ios-switch   check-service"  #{checked}>
						<div><div></div></div>
					</label>
					<p>#{s.desc}</p>
				</li>
				""")
				if checked=="checked"
					$item.addClass('on')
				$('.services').append $item
			init_service(window.services)
			return
		return
	update_service= ()->
		r= window.service_nest
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
		# d3= window.d3
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
		window.service_nest= res
		update_service()
		return
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
		window.nest.events.on "explore_node", (e)->
			if window.story?
				window.story[window.current_step].modified= true
			return
		.on "remove_node", (e)->
			#选中root
			click_handler window.nest.root
			if window.story?
				window.story[window.current_step].modified= true
			return			
		.on("click_doc",(e,d)->doc_handler(d))
		.on("clone_graph",(e,d,$svg)->clone_handler(d,$svg))
		.on('click',(e,d)->click_handler(d))
		$(document).on "click", ".btn-close" , ()->
			ui= $(this).closest('div.list-item')
			window.packery.remove ui
			window.packery.layout()
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
		.on "click", ".fav", ()->
			notify "已收藏"
			return		
		.on "click", ".share", ()->
			notify "已分享"
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
			notify "宏 #{dic.out_fname} 已开始运行"
			$.post "/automate",	JSON.stringify(dic), (d)->
				if d.error?
					notify "宏 #{dic.out_fname} 运行出现如下错误 "+d.error
				else
					notify "宏 #{dic.out_fname} 已完成运行"
					list_automate()
				return
			return
		.on "click", ".btn-next", ()->
			play_step("->")
			return
		.on "click", ".btn-prev", ()->
			play_step("<-")
			return
		.on("click", '.btn-save', save)
		.on "click", ".automates li", ()->
			load_automate $(@).text()
			return
		.on "click", ".snapshots li", ()->
			load_model $(@).text()
			return
		.on 'click','.services li', (e)->
			checkbox=$(@).find('input[type=checkbox]')
			checkbox.prop("checked", !checkbox.prop("checked"))
			checked= checkbox.prop("checked")
			$(@).toggleClass('on')
			index=$(@).parent().find("li").index($(@))
			window.services[index].select= checked
			sid= $(@).attr('data-service-id')
			$('#service-list')
			.find("li[data-service-id=#{sid}]")
			.toggleClass('on')
			.find("input[type=checkbox]")
			.prop("checked",checked)
			update_service()
			return
		.on "click", ".btn-resize", ()->
			ui=$(@).closest('.list-item')
			ui.toggleClass('expanded')
			flag= ui.hasClass('expanded')
			if  flag
				$('body').animate({'scrollTop':ui.offset().top-80})
			$(@).val(if flag then "缩小" else  "放大")
			window.packery.layout()
			return
		.on "mouseenter",".drag-handle", ->
			$(this).attr('title',"按住拖动")
			return
		.on "click",".doc_url", ()->
			id= $(@).attr('data-doc-id')
			window.doc_handler window.nest.hNode[id]
			return
		$("#btn_search").click ->
			key=$('#q').val()
			services= window.services.filter((d)->d.select).map((d)->d.id)
			search(key,services)
			return
		$(window).scroll ->
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
		# 拖放图片来上传
		$(window).on "dragover", ->
			$('#dropimage-holder').addClass('dragover')
			false
		$(window).on "mouseup", ->
			$('#dropimage-holder').removeClass('dragover')
			return
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
						$('#nest-container').parent().removeClass "hidden"
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
		$(window).on "scroll", ()->
			if $(".load-more").offset().top<=$(window).scrollTop()+$(window).height()
				if window.loadFunc?
					window.loadFunc()
			return
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