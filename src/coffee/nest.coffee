class nest
	## ->和=>的区别：=>会把函数的this变量绑定到class对象本身,相当于调用func.bind(class_name)
	## 字符@全等于this,后边跟变量名则代表this. 如 @foo代表this.foo
	#构造函数
	constructor: (options)->
		@container= options.container or "#container"
		@w = options.width or 400
		@h = options.height or 400
		#nodes的字典
		@hNode= {}
		#颜色跳板，根据node type确定颜色，见color函数
		@palette= d3.scale.category20()
		@blacklist= []
		_t=@ #以便匿名函数引用
		#画布，是svg下的一个g
		@vis = d3.select(@container)
			.append("svg:svg")
			.style('width','inherit')
			.style('height','inherit')
			.attr("viewBox","0 0 #{@w} #{@h}")	
			.attr("pointer-events", "all")
			.attr("preserveAspectRatio","XMidYMid")
			.call(d3.behavior.zoom().scaleExtent([0.01,10]).on("zoom", @zoom)).on('dblclick.zoom',null)
			.append("svg:g")
			.on 'mousemove',()->
				#focus函数有100ms的延迟；若在100ms内鼠标再次移动，则取消执行focus
				if _t.timed?
					clearTimeout _t.timed
				_t.timed= setTimeout _t.focus, 100, d3.mouse(@)
				return
			.on 'mouseleave',()->
				#鼠标移出画布则取消
				if _t.timed?
					clearTimeout _t.timed
				return
		#使用jquery的event trigger机制
		@events=$(@vis[0])
		#voronoi图用于节点边界的分割，tick时更新
		@voronoi = d3.geom.voronoi()
		.x((d)->d.x)
		.y((d)->d.y)
		#画布的平移和缩放
		@translate= [0,0]
		@scale=1.0
		#各种元素的选择器
		@svg_link = @vis.selectAll(".link")
		@svg_node = @vis.selectAll(".node")
		@text=@vis.selectAll('text')
		@clip=@vis.selectAll('.clip')
		@marker=@vis.selectAll('.marker')
		#force，用于动态更新node和link的位置
		@force = d3.layout.force()
		.on("tick", @tick)
		#node的“电荷”，负值意思是彼此相斥，
		#node在电荷库仑力和link的拉力下移动并达到平衡位置
		.charge(-200)
		#link的长短（把link想象成相当于小棍）
		.linkDistance (d)->
			if d.target.distance_rank?
				return d.target.distance_rank*20
			if d.target.type=="referData" then 5 else 20
		#link的张力（把ling想象成弹簧），取值0-1，1无弹性
		.linkStrength (d)->
			if d.value? then 1.0-d.value else 0.1
		#force的力场大小要和画布相适应
		.size([@w, @h])
		#键盘按下ctrl、shift、alt时的处理函数
		$(document).keydown @onKey
		$(document).keyup @onKey
		return
	#使node data的name和id符合标准
	#输入：node_data，输出：无
	normalize_id: (d)->
		d.name=d.name.replace(/^\s+|\s+$/, '')
		if not d.id?
			d.id= "#{d.type}_#{d.name}"
		d.id= d.id.replace(/^\s+|\s+$/, '')
		return
	#如果link的source和target的id是string，那么根据id从hNode中找到对应的node
	#输入：object（可能是string、object或int，只处理string），输出：object（node_data对象或者输入原样返回）
	_convert_link_id:  (x)=>
		## x is string
		if typeof(x)=="string"
			x= x.replace(/^\s+|\s+$/g, '')
			if @hNode[x]?
				return @hNode[x]
		return x
	#处理link的source和target：如果是string，替换成对应id的node data。
	#输入：link data，输出：无
	##_convert_link_id中引用了hNode,所以需要在hNode更新完成后调用（见update函数）
	normalize_link: (l)=>
		l.source = @_convert_link_id l.source
		l.target = @_convert_link_id l.target
		return
	#正规化data中name、id等字符串
	#输入：object（只处理string），输出：object（string）
	normalize_text: (x)->
		if typeof(x)=="string"
			x = x.replace(/^\s+|\s+$/g, '')
		return x
	#生成voronoi的函数，用于平面分割，方便点选
	#输入：node data的array，输出：voronoi所需的shapes array
	recenterVoronoi: (nodes) =>
		shapes = []
		@voronoi(nodes).forEach (d)->
			if not d.length then return
			n = []
			d.forEach (c)->
				n.push [ c[0] - d.point.x, c[1] - d.point.y ] 
				return
			n.point = d.point
			shapes.push n
			return
		return shapes
	#处理键盘事件
	onKey : (e) =>
		@ctrlPressed = e.ctrlKey
		@altPressed = e.altKey
		@shiftPressed = e.shiftKey
		if e.type=="keydown" and e.keyCode==68 #“d”
			@toggle_doc()
		return true
	#处理平移和缩放事件
	zoom : () =>
		@scale = d3.event.scale
		@translate=d3.event.translate
		@vis.attr "transform", "translate(" + @translate + ")" + " scale(" + @scale + ")"
		#根据缩放调整text大小，在一定区间内保持文字大小不变;如果缩放值太小，则不显示text
		@text.style("font-size", if @scale<0.5 then "0em" else (1 / @scale) + "em")
		return
	#鼠标悬停时显示区域中节点的text
	focus : (e)=>
		@center = {x:e[0],y:e[1]}
		if not @ring?
			#在vis的第一位插入circle，用于指示高亮区域
			@ring=@vis.insert("circle",":first-child").classed('ring',true)
		@ring.attr('r',150.0/@scale)
		.attr('cx',@center.x)
		.attr('cy',@center.y)
		#节点到鼠标中心的距离
		node_dist= []
		@nodes.map (d)=>
			node_dist.push [d.id, Math.pow((d.x-@center.x),2)+Math.pow((d.y-@center.y),2)]
			return
		#根据距离排序
		node_dist.sort (a,b)-> a[1]-b[1]
		#选取点的总数不超过15个
		node_dist= node_dist.slice(0,15)
		#选取距离在150以内的点
		threshold= Math.pow((150/@scale),2)
		node_dist= node_dist.filter((d)->d[1]<threshold)
		#高亮点的字典
		hFocus= {}
		#所有点(除选中的点外)取消高亮
		@nodes.map (d)-> 
			if d!=@theFocus then d.isHigh= false
			return
		node_dist.map (d)=>
			hFocus[d[0]]=true
			@hNode[d[0]].isHigh= true
			return
		#source和target都被高亮的link，也被高亮
		@links.map (d)=>
			d.isHigh= false
			if hFocus[d.source.id]? and hFocus[d.target.id]
				d.isHigh= true
			return
		@update(false)
		return
	#清空节点数据，初始化
	#输入：由nodes和links组成的graph，输出：无
	draw : (json) =>
		if not json.nodes? or json.nodes.length==0
			return {'error':'no nodes'}
		if json.blacklist?
			@blacklist= json.blacklist
		#正规化node的id和name
		json.nodes.map (d)=> 
			@normalize_id d
			return
		json.links.map (d)=>
			d.source= @normalize_text d.source
			d.target= @normalize_text d.target
			return
		#nodes和links进行浅拷贝
		@nodes= json.nodes.slice()
		@links= json.links.slice()
		@root = @nodes[0]
		#选中root
		@theFocus= @root
		@root.isHigh= true
		@root.x =@w /2
		@root.y =@h /2
		#为force提供数据
		@force.nodes(@nodes).links(@links)
		@update(true,true) 
		return
	#node circle的半径
	getR : (d) =>
		if d.type=="SearchProvider" then 15 else 5
	#负责迭代更新node和link的位置、生成clip
	#由update函数调用
	tick : ()=>
		#node位置更新
		@svg_node.attr "transform", (d) ->
			"translate(#{d.x},#{d.y})"
		#node clip更新
		.attr('clip-path',(d)->"url(#clip-#{d.index})")
		#marker位置更新
		@marker
		.attr('x',@theFocus.x-22)
		.attr('y':@theFocus.y-45)		
		#link位置更新
		@svg_link.attr("x1", (d) -> d.source.x)
		.attr("y1", (d) -> d.source.y)
		.attr("x2", (d) -> d.target.x)
		.attr("y2", (d) -> d.target.y)
		#text位置更新
		@text.attr "transform", (d)=>
			dx=d.x+@.getR(d)+5*@scale
			"translate(#{dx},#{d.y})"
		#生成clip，便于更好的点选
		@clip = @clip.data(@recenterVoronoi(@nodes), (d)->d.point.index)
		@clip.enter().append('clipPath').classed('clip', true)
		.attr('id', (d) -> 'clip-'+d.point.index)
		@clip.exit().remove()
		@clip.selectAll('path').remove()
		@clip.append('path')
		.attr('d', (d)-> 'M'+d.join(',')+'Z')
		return
	#显示或不显示type为referData的node或type为referData的link
	toggle_doc : ()=>
		@flag= not @flag
		if  @flag
			@svg_node.classed('hidden',(d)->d.type=="referData" )
			@svg_link.classed('hidden',(d)->d.target.type=="referData" )		
			@text.classed('hidden',(d)->d.type=="referData" )
		else
			@svg_node.classed('hidden',false)
			@svg_link.classed('hidden',false)		
			@text.classed('hidden',false)
	#可自定义type对应的颜色，使用者可通过nest_instance.colors来修改
	colors:
			'referData':'#aaaaaa'
			'relationship':'#0088ff'
			'SearchProvider':'dd0000'
	#根据type决定颜色
	#输入：node data，输出：css支持的颜色字符串
	color : (d) =>
		if @colors[d.type]?
			return @colors[d.type]
		res= "#0088ff" 
		# res= @palette(d.type)
		if d.distance_rank?
			res= d3.hsl(res).brighter(d.distance_rank*.1).toString()
		return res
	#处理节点的单击事件
	click : (d) =>
		if @shiftPressed
			@remove d
			@update()
		else if @ctrlPressed
			@dblclick d
			@update()
		else
			@highlight d
			@events.trigger "click_node", [d]
		return
	#通过id查找node data，id可以是string、object或number
	#hNode必须先在update中初始化
	#输入：id（可以是string、object或number），输出：node data
	find_node: (linknode)=>
		t= typeof(linknode)
		if t=="string"
			n=@hNode[@normalize_text linknode]
			return n
		else if t=="object"
			n=@hNode[linknode.id]
			return n
		else if t=="number"
			i= linknode
			if i>@nodes.length-1 or i<0
				return
			return @nodes[i]
		return
	#通过source和target查找link data，source和target可以是string、object或number
	#hNode必须先在update中初始化
	#输入：link data（可能是服务传过来的、未图形化），输出：link data（经过图形化的）
	find_link : (l)=>
		source_node= @find_node l.source
		target_node= @find_node l.target
		if not source_node? or not target_node?
			return
		return @matrix[source_node.id][target_node.id]
	#扩展节点，用于automate中增加节点, 见model.coffee中的play_step
	#输入：有node和link的graph，输出：无
	expand : (data)=>
		data.nodes.map (x)=>
			@normalize_id x
			if not @hNode[x.id]?
				@nodes.push x
				#在此加入hNode是为了下面link查找source和target时使用
				@hNode[x.id]=x
			return
		data.links.map (x)=>
			source= @find_node(x.source)
			target= @find_node(x.target)
			if not source? or not target?
				return
			@links.push x
			target.x= source.x+Math.random()*50-25
			target.y= source.y+Math.random()*50-25
			return
		@update()
		return
	#删除节点，用于automate中减少节点，见model.coffee中的play_step
	#输入：有node和link的graph，输出：无
	rm :(data)=>
		data.nodes.map (x)=>
			@nodes.remove  @hNode[x.id]
			return
		data.links.map (x)=>
			#source and target must not be number, but object or string id
			#or it may delete wrong links.
			@links.remove @find_link(x)
			return
		@update()
		return
	#处理用户双击事件，如果是doc节点则访问url，如果是普通节点则explore该节点
	#输入：node data，输出：无
	dblclick : (d)=>
		#处理doc
		if d.type=="referData" or d.type=="doc"
			@events.trigger "click_doc", [d]
			return
		#如果当前node正在搜索则返回，避免多次调用explore
		if d.isSearching? and d.isSearching==true
			d.isSearching= false
			return
		d.isSearching = true
		@events.trigger 'dblclick_node', [d]
		return
	#处理/explore服务返回的json，过滤新的节点后加入nodes
	explore : (data)=>
		for id of data
			source=@hNode[id]
			if not source?
				continue
			i=0
			for x in data[id]
				##有些浏览器会出现错误，x=="[" 或 "]"
				# if typeof(x)=="string" then continue
				@normalize_id x
				if @blacklist.indexOf(x.id)>=0
					continue
				target=@hNode[x.id]
				if not target?
					if i==5 and x.type!="referData" then continue
					@nodes.push x
					x.x= source.x+Math.random()*100-50
					x.y= source.y+Math.random()*100-50
					i+=1
					target=x
				if not @matrix[source.id][target.id]?
					@links.push {"source":source,"target":target }
			source.isSearching= false
		@events.trigger 'explore_node'
		@update()
		return
	#用户操作删除节点
	remove : (d) =>
		if d==@root
			alert "不能删除根节点"
			@shiftPressed=false
			return
		#删除与node相连的所有link，如果相连node只有一条link，那么也删除该node（避免孤立节点出现）
		for link in @degree[d.id]
			@links.remove link
			if @degree[link.target.id].length==1 and link.target!=@root
				@nodes.remove link.target
			if @degree[link.source.id].length==1 and link.source!=@root
				@nodes.remove link.source
		@nodes.remove d
		#将node id加入blacklist，下次在explore的时候就不会再返回该node
		@blacklist.push d.id
		#删除clip数据，然后在update中重建clip
		@clip=@clip.data([])
		@clip.exit().remove()
		@events.trigger "remove_node"
		@update()
		return
	#高亮用户选中的节点，并一次性生成marker
	highlight : (d)=>
		for x in @links 
			x.isHigh= false
		for x in @nodes
			x.isHigh= false
		d.isHigh= true
		@theFocus = d
		@marker=@vis.selectAll('.marker').data([d],(x)->x.id)
		@marker.exit().remove()
		@marker.enter().append('image').classed('marker',true)
			.attr('xlink:href',"/img/marker.svg")
			.attr('width',50)
			.attr('height',50)
			.attr('x',@theFocus.x-22)
			.attr('y':@theFocus.y-45)
		@update(false)
		return
	#创建知识图的片段拷贝
	clone: (d)=>
		#克隆#nest-container,然后删除多余的东西
		$svg= $('#nest-container svg').clone()
		$g= $svg.find(">g")
		svg= d3.select($svg.get()[0])
		#删除非高亮的节点
		svg.selectAll('.node').data(window.nest.nodes).filter((x)->not x.isHigh).remove()
		svg.selectAll('.link').data(window.nest.links).filter((x)->not x.isHigh).remove()
		#删除所有多余的视觉元素
		svg.selectAll('.ring').remove()
		svg.selectAll('.marker').remove()
		svg.selectAll('.selection-helper').remove()
		#添加平移和缩放功能
		svg.attr("pointer-events", "all")
		.attr("preserveAspectRatio","XMidYMid meet")
		.call(d3.behavior.zoom()
			.scaleExtent([0.01,10])
			.on("zoom",()->
				scale= d3.event.scale
				$g.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" +  scale + ")"
				svg.selectAll('text').style("font-size", if scale<0.5 then "0em" else (1 / scale) + "em")
				return
			))
		@events.trigger "clone_graph",[d,$svg]
		return
	#负责更新视图，包括节点highlight状况、force layout等
	#start_force为true会调用force.start，更新node和link的位置
	update : (start_force=true,fast_forward=false)=>
		#将link source和target中的string替换成node data object
		@hNode= {}
		@nodes.forEach (d,i)=>
			@hNode[d.id]=d
			d.index=i
			return
		for l in @links
			@normalize_link l
		#更新svg link的data
		@svg_link = @svg_link.data(@links)
		#添加data中有而svg中没有的link
		@svg_link.enter()
		.insert("line", ".node")
		.classed("link",true)
		#删除data中没有而svg中有的link
		@svg_link.exit().remove()
		#更新svg node的data
		@svg_node = @svg_node.data(@nodes,(d)->d.id)
		_this=@
		#添加data中有而svg中没有的node
		#nodeEnter对应的元素是svg:g
		nodeEnter=@svg_node.enter()
		.append("g")
		.attr("class", "node")
		.on("click", @click)
		.on('dblclick',@dblclick)
		.classed("highlight",(d)->d.isHigh==true)
		# .call(@force.drag())
		#添加用于选择的大圆
		nodeEnter.append('circle')
		.classed('selection-helper',true)
		.attr('r',50)
		.style("fill", "#0088ff")
		#添加表示节点的小圆
		nodeEnter.append("circle")
		.style("fill", @color)
		.attr('r',@getR)
		#类型为SearchProvider的node，需要添加img
		nodeEnter.filter((d)->d.img? and d.type=="SearchProvider")
		.append('image')
		.attr('xlink:href',(d)->d.img)
		.attr('width',20)
		.attr('height',20)
		.attr('x',-10)
		.attr('y',-10) 
		#添加节点的tooltip（鼠标悬浮时可见）
		nodeEnter.append('title')
		.text((d)->d.name)
		#删除data中没有而svg中有的link
		@svg_node.exit().remove()
		#更新text的data,只在isHigh的节点上有text
		@text= @text.data(@nodes.filter((d)->d.isHigh),(d)->d.id)
		#添加data中有而svg中没有的text
		@text.enter().append('text')
		.text((d)-> if d.name.length <=5 then d.name else d.name.slice(0,5)+"...")
		.style("font-size", if @scale<0.5 then "0em" else (1 / @scale) + "em")
		.attr "transform", (d)=>
			dx= d.x+@.getR(d)+5*@scale
			"translate(#{dx},#{d.y})"
		if @flag
			@text.classed("hidden",(d)->d.type=="referData")
		@svg_node.classed "highlight", (d)->d.isHigh==true
		@svg_link.classed "highlight", (d)->d.isHigh==true
		#删除data中没有而svg中有的text
		@text.exit().remove()
		if start_force
			@force.start()
			maxIter= 100
			minAlpha=0.05
			#不显示节点前先快速迭代，保证图在出现时是接近稳定的
			if fast_forward
				$(@container).css('opacity','.2')
				for i in [0..maxIter]
					if @force.alpha()<minAlpha
						break
					document.title= "正在加载 #{i}%"
					@force.tick()
				$(@container).css('opacity','1')
			#重新计算link的信息
			@matrix={}
			@degree={}
			n= @nodes.length
			for x in @nodes
				@degree[x.id]=[]
				@matrix[x.id]={}
				for y in @nodes
					@matrix[x.id][y.id]=null
			@links.map (x)=>
				try
					@degree[x.source.id].push x
					@degree[x.target.id].push x
					@matrix[x.source.id][x.target.id]=x
				catch e
					console.log @degree
				return
		return
Array::remove = (b) ->
	if not b?
		return false
	a = @indexOf(b)
	if a >= 0
		@splice a, 1
		return true
	return false
#用于和amd标准的module loader集成，例如requirejs
if typeof(define)=="function" and define.amd?
	define "nest", ['jquery','d3'], ($,ff)-> 
		return nest