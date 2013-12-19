class nest
	@colors :[
			"song",
			"artist",
			"user",
			"album",
			'relationship',
			"baiduBaikeCrawler",
			"hudongBaikeCrawler",
			"referData",
		]
	palette: d3.scale.category20()
	constructor: (options)->
		@hNode= {}
		@position_cache={}
		@container= options.container or "#container"
		@w = options.width or 400
		@h = options.height or 200
		@ctrlPressed = false
		@altPressed = false
		@shiftPressed = false
		@blacklist= []
		@explored= []
		@vis = d3.select(@container)
			.append("svg:svg")
			.attr("viewBox","0 0 #{@w} #{@h}")	
			.attr("pointer-events", "all")
			.attr("preserveAspectRatio","XMidYMid")
			.call(d3.behavior.zoom().scaleExtent([0.01,10]).on("zoom", @zoom)).on('dblclick.zoom',null)
			.append("svg:g")
		@link = @vis.selectAll(".link")
		@node = @vis.selectAll(".node")
		@force = d3.layout.force()
		.on("end",(d)=>
			@nodes.forEach (n)->
				if n._fixed? then n.fixed= true
				return
			return
		).on("tick", @tick)
		.charge (d)->
			if d.type=="referData" then -20 else -200
		.linkDistance(20)
		.linkStrength((d)->if d.value? then 1.0-d.value else 0.1)
		.size([@w, @h])
		@drag= @force.drag().on 'dragend', (d)->
			d.fixed= true
			return
		@relationships={
			'artist':[{
					"id": (d)-> "hitsongs_of_#{d.id}",
					'name': (d)->"Artist's best songs",
				},{
					"id": (d)-> "albums_of_#{d.id}",
					'name': (d)->"Artist's album(s)",
				}
			],
			'song':[{
					"id": (d)-> "artist_of_#{d.id}",
					'name': (d)->"Song's artist(s)",
				},{
					"id": (d)-> "album_of_#{d.id}",
					'name': (d)->"Song's album",			
				}
			],
			'album':[{
					"id": (d)-> "artist_of_#{d.id}",
					'name': (d)->"Album's artist",
				},{
					"id": (d)-> "songs_of_#{d.id}",
					'name': (d)->"Album's songs",			
				}
			],
			'collect':[{
					"id": (d)-> "songs_of_#{d.id}",
					'name': (d)->"Collection's songs",			
				}
			],
		}
		$(document).keydown @cacheIt
		$(document).keyup @cacheIt
		return
	highlighted: () => 
		console.log @node.filter((d)->d.isHigh)
		console.log @link.filter((d)->d.isHigh)
		return
	cacheIt : (e) =>
		@ctrlPressed = e.ctrlKey
		@altPressed = e.altKey
		@shiftPressed = e.shiftKey
		return true
	zoom : () =>
		@scale= d3.event.scale
		@vis.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" + @scale + ")"
		@vis.selectAll("text").style("font-size", (1 / @scale) + "em");
	draw : (json) =>
		if not json.nodes? or json.nodes.length==0
			return {'error':'no nodes'}
		if json.blacklist?
			@blacklist= json.blacklist
		if json.explored?
			@explored= json.explored
		$(@container).show()
		@nodes= json.nodes
		@links= json.links
		@root = json.nodes[0]
		@theFocus= @root
		@root.isHigh= true
		@force.nodes(@nodes).links(@links)
		n=@nodes.length
		#init node position for faster stablization
		@nodes.forEach (d,i)=>
			@normalize_id d
			if d.fixed?
				d.fixed= undefined
				d._fixed= true
			else
				d.x=@w*(i%10)/10
				d.y=i*@h/n
			return
		@root.x =@w /2
		@root.y =@h /2
		@root.fixed= true
		@force.nodes(@nodes).links(@links)
		@update() 
		return
	normalize:  (x)=>
		## x is string
		if typeof(x)=="string" and @hNode[x]?
			return @hNode[x]
		return x
	normalize_link: (l)=>
		l.source = @normalize(l.source)
		l.target = @normalize(l.target)
		return
	update : ()=>
		#init graph info
		@matrix=[]
		@degree=[]
		@hNode={}
		n= @nodes.length
		for i in [0..n-1]
			@hNode[@nodes[i].id]=@nodes[i]
			@degree.push []
			@matrix.push []
			for j in [0..n-1]
				@matrix[i].push null
		for l in @links
			@normalize_link l 
		# Update the links…
		@link = @link.data(@links)

		# Enter any new links.
		@link.enter()
		.insert("line", ".node")
		.classed("link",true)

		# Exit any old links.
		@link.exit().remove()

		@node = @vis.selectAll(".node").data(@nodes,(d)->d.id)

		_this=@
		#enter new nodes
		nodeEnter=@node.enter()
		.append("g")
		.attr("class", "node")
		.on("click", @click)
		.on('mouseover',(d)->
			d3.select(@).select('circle').attr("r",'13px')
			return
		)
		.on('mouseout',(d)->
			d3.select(@).select('circle').attr("r",_this.getR(d))
			return
		)
		.on('dblclick',@dblclick)
		.classed("highlight",(d)->d.isHigh==true)
		.attr("transform", (d) ->
			"translate(" + d.x + "," + d.y + ")"
		).call(@drag)

		nodeEnter.append("circle")
		.attr("cx",0)
		.attr("cy",0)
		.attr("r", @getR)
		.style("fill", @color)

		# nodeEnter.append("text")
		# .attr("class","notclickable desc")
		# .text (d) ->
		#	 d.name

		@node.exit().remove()

		d3.selectAll(".node circle")
		.attr("r", @getR)
		.style("fill", @color)
		
		d3.selectAll(".node text").remove()
		@node.filter((d)->d.isHigh)
		.append('text')
		.attr("class","notclickable desc")
		.text (d)->d.name

		d3.selectAll(".node text")
		.attr("dx", (d)=>@getR(d)+5)
		.classed("show", (d)->d==@theFocus)
		.attr("font-size", (1 / @scale) + "em")

		d3.selectAll(".search-img").remove()
		d3.selectAll(".node circle").filter((d) ->d.isSearching)
		.append("animate")
		.attr("attributeName",'cx')
		.attr("begin",'0s')
		.attr("dur",'0.1s')
		.attr("from",'-5')
		.attr("to",'5')
		.attr("fill",'remove')
		.attr("repeatCount",'indefinite')
		.classed("search-img",true)

		@force.start()

		# calculate graph info
		for x in @links
			@degree[x.source.index].push x
			@degree[x.target.index].push x
			@matrix[x.source.index][x.target.index]=x
		@node.classed "highlight", (d)->d.isHigh==true
		@link.classed "highlight", (d)->d.isHigh==true
		@node.classed('hidden',(d)->d.type=="referData")
		@link.classed('hidden',(d)->d.target.type=="referData")
		for nod of @hNode
			@position_cache[nod]={
				'x':@hNode[nod].x
				'y':@hNode[nod].y
			}
		return

	getR : (d) =>
		if d == @theFocus
			return 15
		if d.isHigh then 10 else 5
	tick : ()=>
		@node.attr "transform", (d) =>
			radius= @getR(d)
			"translate(" + d.x + "," + d.y + ")"
		@link.attr("x1", (d) ->
			d.source.x
		).attr("y1", (d) ->
			d.source.y
		).attr("x2", (d) ->
			d.target.x
		).attr("y2", (d) ->
			d.target.y
		)		
	color : (d) =>
		i= nest.colors.indexOf(d.type)
		res= "black"
		if i>=0
			res= @palette(i+1)
		else res= @palette(d.type)
		if d.distance_rank?
			res= d3.hsl(res).brighter(d.distance_rank).toString()
		return res
	dblclick : (d)=>
		if d.type=="referData"
			window.open if d.url? then d.url else d.name
			return
		if d.type=="doc"
			window.open if d.url? then d.url else d.name
			return
		if d.isSearching? and d.isSearching==true
			d.isSearching= false
			return
		d.isSearching = true
		data={
			keys:d.id,
		}
		if d.url? and d.url.indexOf("/subview/")>=0
			data.url= d.url
			data.is_subview= true
		$.post "/explore/", JSON.stringify(data), @expand, 'json'
		return
	click : (d) =>
		d.fixed= false
		if @shiftPressed
			if d==@root
				alert "不能删除根节点"
				@shiftPressed=false
				return
			n = @nodes.length
			i= d.index
			for link in @degree[d.index]
				@links.remove link
				if @degree[link.target.index].length==1
					@nodes.remove link.target
				if @degree[link.source.index].length==1
					@nodes.remove link.source
			@nodes.remove d
			@blacklist.push d.id
			@update()
		else if @ctrlPressed
			@dblclick d
			@update()
		else
			@highlight d
			# history.pushState {},d.name,"/model/#{d.id}"
			@update()
			if window.click_handler?
				window.click_handler(d)
		return
	normalize_id: (x)->
		if not x.id?
			x.id= x.name
		if x.id.indexOf('_')<0
			x.id= "#{x.type}_#{x.id}"
		return x
	explore : (data)=>
		for x in data.nodes
			@normalize_id x
			@nodes.push x
		for l in data.links
			@links.push l
			source= @nodes[l.source]
			target= @nodes[l.target]
			target.x= source.x+Math.random()*100-50
			target.y= source.y+Math.random()*100-50
		@update()
		return
	expand : (data)=>
		for id of data
			source=@hNode[id]
			if not source?
				continue
			i=0
			for x in data[id]
				@normalize_id x
				if @blacklist.indexOf(x.id)>=0
					continue
				target=@hNode[x.id]
				if not target?
					if i==5 and x.type!="referData" then continue
					@nodes.push x
					x.x=source.x+Math.random()*100-50
					x.y=source.y+Math.random()*100-50
					i+=1
					target=x
				if not @matrix[source.index][target.index]?
					@links.push {"source":source,"target":target }
			source.isSearching= false
		@update()
		return
	highlight : (d)=>
		for x in @links
			x.isHigh= false
		for x in @nodes
			x.isHigh= false
		d.isHigh= true
		@theFocus = d
		i=d.index
		for link in @degree[d.index]
			link.isHigh= true
			link.target.isHigh=true
			link.source.isHigh=true
		if not @existing_relation_links?
			@existing_relation_links=[]
		if @relationships[d.type]?
			for rel in @relationships[d.type]
				id= rel.id d
				if not @hNode[id]?
					n= {
						'id':id,
						'name': rel.name(d),
						'type':"relationship",
						'isHigh':true,
						'x':d.x+Math.random()*100-50,
						'y':d.y+Math.random()*100-50,
					}
					@nodes.push n
					l= {
						'source':d,
						'target':n,
						'isHigh':true,
					}
					@links.push l
					@existing_relation_links.push l
			for link in @existing_relation_links
				if link.source==d
					continue
				if @degree[link.target.index]? and @degree[link.target.index].length>1
					continue
				@links.remove link
				@nodes.remove link.target
		return
Array::remove = (b) ->
	a = @indexOf(b)
	if a >= 0
		@splice a, 1
		return true
	false
if typeof(define)=="function" and define.amd?
	define "nest", ['jquery','d3'], ($,d3)-> {
		"nest":nest,
	}