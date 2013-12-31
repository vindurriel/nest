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
	constructor: (options)->
		@hNode= {}
		@position_cache={}
		@palette= d3.scale.category20()
		@container= options.container or "#container"
		@w = options.width or 400
		@h = options.height or 400
		@ctrlPressed = false
		@altPressed = false
		@shiftPressed = false
		@blacklist= []
		@explored= []
		_t=@
		@vis = d3.select(@container)
			.append("svg:svg")
			.style('width','inherit')
			.style('height','inherit')
			.attr("viewBox","0 0 #{@w} #{@h}")	
			.attr("pointer-events", "all")
			.attr("preserveAspectRatio","XMidYMid")
			.call(d3.behavior.zoom().scaleExtent([0.01,10]).on("zoom", @zoom)).on('dblclick.zoom',null)
			.append("svg:g")
			.on('mousemove',()->
				if _t.timed?
					clearTimeout _t.timed
				_t.timed= setTimeout _t.focus, 100, d3.mouse(@)
				return
			).on('mouseleave',()=>
				@mouse_on=true
				if @timed
					clearTimeout @timed
				return
			)
		@voronoi = d3.geom.voronoi()
		.x((d)->d.x)
		.y((d)->d.y)
		# .clipExtent([[-10, -10], [@w+10, @h+10]])

		@translate= [0,0]
		@scale=1.0
		@link = @vis.selectAll(".link")
		@node = @vis.selectAll(".node")
		@text=@vis.selectAll('text')
		@clip=@vis.selectAll('.clip')
		@force = d3.layout.force()
		.on("tick", @tick)
		.charge (d)->
			if d.type=="referData" then -200 else -200
		.linkDistance((d)->if d.target.type=="referData" then 5 else 20)
		.linkStrength((d)->if d.value? then 1.0-d.value else 0.1)
		.size([@w, @h])
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
	cacheIt : (e) =>
		@ctrlPressed = e.ctrlKey
		@altPressed = e.altKey
		@shiftPressed = e.shiftKey
		return true
	zoom : () =>
		@scale = d3.event.scale
		@translate=d3.event.translate
		@vis.attr "transform", "translate(" + @translate + ")" + " scale(" + @scale + ")"
		@text.style("font-size", (1 / @scale) + "em")

		return
	focus :(e)=>
		@center = {x:e[0],y:e[1]}
		if not @ring?
			@ring=@vis.insert("circle",":first-child").classed('ring',true)
		@ring.attr('r',150.0/@scale)
		@ring.attr('cx',@center.x)
		@ring.attr('cy',@center.y)
		node_dist= []
		@node.each (d)=>
			node_dist.push [d.id, Math.pow((d.x-@center.x),2)+Math.pow((d.y-@center.y),2)]
			return
		node_dist.sort (a,b)-> a[1]-b[1]
		threshold= Math.pow((150/@scale),2)
		# node_dist= node_dist.slice(0,10)
		node_dist= node_dist.filter((d)->d[1]<threshold)
		hFocus= {}
		@nodes.map (d)-> 
			if d!=@theFocus then d.isHigh= false
			return
		node_dist.map (d)=>
			hFocus[d[0]]=true
			@hNode[d[0]].isHigh= true
			return
		@link.each (d)=>
			d.isHigh= false
			if hFocus[d.source.id]? and hFocus[d.target.id]
				d.isHigh= true
			return
		@update(false)
		return
	draw : (json) =>
		if not json.nodes? or json.nodes.length==0
			return {'error':'no nodes'}
		if json.blacklist?
			@blacklist= json.blacklist
		if json.explored?
			@explored= json.explored
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
			d.x=@w*(i%10)/10
			d.y=i*@h/n
			return
		@root.x =@w /2
		@root.y =@h /2
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
	getR : (d) =>
		if d==@theFocus then 10 else 5
	tick : (e)=>
		k= .05*e.alpha
		@node.attr("transform", (d) ->
			"translate(#{d.x},#{d.y})"
		).attr('clip-path',(d)->"url(#clip-#{d.index})")
		
		@link.attr("x1", (d) ->
			d.source.x
		).attr("y1", (d) ->
			d.source.y
		).attr("x2", (d) ->
			d.target.x
		).attr("y2", (d) ->
			d.target.y
		)
		@text.attr "transform", (d)=>
			angle=10*((d.id.length+d.index)%10-2)
			dx=d.x+@.getR(d)+5*@scale
			"translate(#{dx},#{d.y})"
		@clip = @clip.data( @recenterVoronoi(@nodes), (d)->d.point.index )
		@clip.enter().append('clipPath').classed('clip', true)
		.attr('id', (d) -> 'clip-'+d.point.index)
		@clip.exit().remove()
		@clip.selectAll('path').remove();
		@clip.append('path')
		.attr('d', (d)-> 'M'+d.join(',')+'Z')
		return
	color : (d) =>
		i= nest.colors.indexOf(d.type)
		res= "black"
		if i>=0
			res= @palette(i+1)
		else res= @palette(d.type)
		if d.distance_rank?
			res= d3.hsl(res).brighter(d.distance_rank*.1).toString()
		return "#5297ee"
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
		if d.url?
			data.url= d.url
			if d.url.indexOf("/subview/")>=0
				data.is_subview= true
		$.post "/explore/", JSON.stringify(data), @expand, 'json'
		return
	remove : (d) =>
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
		if window.click_handler?
			window.click_handler @root
		return
	click : (d) =>
		d.fixed= false
		if @shiftPressed
			@remove d
			@update()
		else if @ctrlPressed
			@dblclick d
			@update()
		else
			@highlight d
			@update()
			if window.click_handler?
				window.click_handler(d)
		return
	normalize_id: (x)->
		if not x.id?
			x.id= "#{x.type}_#{x.name}"
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
		@vis.selectAll(".marker").remove()
		@node.filter((x)->x==d).append('image').classed('marker',true)
		.attr('xlink:href',"/img/marker.svg")
		.attr('width',50)
		.attr('height',50)
		.attr('x',-22)
		.attr('y',-45)
		return
	update : (start_force=true)=>
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
		.on('dblclick',@dblclick)
		.classed("highlight",(d)->d.isHigh==true)
		.call(@force.drag())

		nodeEnter.append('circle')
		.classed('selection-helper',true)
		.attr('r',50)

		nodeEnter.append("circle")
		.style("fill", @color)
		.attr('r',@getR)



		nodeEnter.append('title')
		.text((d)->d.name)

		@node.exit().remove()

		@vis.selectAll(".node path")
		.attr("r", @getR)
		.style("fill", @color)
		
		@vis.selectAll(".search-img").remove()
		@vis.selectAll(".node path").filter((d) ->d.isSearching)
		.append("animate")
		.attr("attributeName",'cx')
		.attr("begin",'0s')
		.attr("dur",'0.1s')
		.attr("from",'-5')
		.attr("to",'5')
		.attr("fill",'remove')
		.attr("repeatCount",'indefinite')
		.classed("search-img",true)

		@text= @text.data(@nodes.filter((d)->d.isHigh),(d)->d.id)
		@text.enter().append('text')
		.text((d)-> if d.name.length <=5 then d.name else d.name.slice(0,5)+"...")
		.style("font-size", (1 / @scale) + "em")
		.attr "transform", (d)=>
			dx= d.x+@.getR(d)+5*@scale
			"translate(#{dx},#{d.y})"

		@text.exit().remove()
		if start_force
			@force.start()

		# calculate graph info
		for x in @links
			@degree[x.source.index].push x
			@degree[x.target.index].push x
			@matrix[x.source.index][x.target.index]=x
		@node.classed "highlight", (d)->d.isHigh==true
		@node.classed "focus", (d)=>d==@theFocus
		@link.classed "highlight", (d)->d.isHigh==true
		# @node.classed('hidden',(d)->d.type=="referData" )
		# @link.classed('hidden',(d)->d.target.type=="referData"  )		
		for nod of @hNode
			@position_cache[nod]= 
				'x':@hNode[nod].x
				'y':@hNode[nod].y
		return
Array::remove = (b) ->
	a = @indexOf(b)
	if a >= 0
		@splice a, 1
		return true
	false
String.prototype.hashCode = ()->
	hash = 0.0
	for i in [0..this.length]
		if not isNaN this.charCodeAt(i)
			hash += this.charCodeAt(i)
	return hash 
if typeof(define)=="function" and define.amd?
	define "nest", ['jquery','d3'], ($,ff)-> 
		return nest