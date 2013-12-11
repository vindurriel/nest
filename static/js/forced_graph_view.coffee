cacheIt = (e) ->
	r.ctrlPressed = e.ctrlKey
	r.altPressed = e.altKey
	r.shiftPressed = e.shiftKey
	return true
redraw = ->
	r.scale=d3.event.scale
	r.vis.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" + r.scale + ")"
	r.vis.selectAll("text").style("font-size", (1 / r.scale) + "em");
draw = (json) ->
	if not json.nodes? or json.nodes.length==0
		return
	if json.blacklist?
		r.blacklist=json.blacklist
	r.legend= d3.select("#tip")
	.insert("svg")
	.selectAll("rect.leg")
	.data([
		{"type":"artist",},
		{"type":"album",},
		{"type":"song",}
		{"type":"relationship",}
	])
	.enter()
	.append('g')
	.attr "transform", (d,i) ->
		"translate(" + 10	+ "," + (30+i*30) + ")"
	.classed('leg',true)
	
	r.legend.append("circle")
	.style("fill",color)
	.style("r","10px")
	.attr('cx','0')
	.attr('cy','0')
	.attr('stroke-width','1px')

	r.legend.append("text")
	.text((d)->d.type)
	.attr("dx",'15')
	.attr("dy",'3')

	r.nodes= json.nodes
	r.links= json.links
	r.root = json.nodes[0]
	r.theFocus= r.root
	r.root.isHigh= true
	r.force = d3.layout.force()
	.on("end",(d)->
		r.nodes.forEach (n)->
			if n._fixed? then n.fixed= true
			return
		return
	).on("tick", tick)
	.charge (d)->
		if d.type=="referData" then -20 else -200
	.linkDistance(20)
	.linkStrength((d)->if d.value? then 1.0-d.value else 0.1)
	.size([r.w, r.h])
	.nodes(r.nodes)
	.links(r.links)
	n=r.nodes.length
	#init node position for faster stablization
	if not json.no_position_init?
		r.nodes.forEach (d,i)->
			if not d.id?
				d.id= d.name
			if '_' not in d.id
				d.id= "#{d.type}_#{d.id}"
			if d.fixed?
				d.fixed= undefined
				d._fixed= true
			if position_cache[d.id]?
					pos= position_cache[d.id]
					d.x= pos.x
					d.y= pos.y
			else
					d.x=r.w*(i%10)/10
					d.y=i*r.h/n
			return
		r.root.x =r.w /2
		r.root.y =r.h /2
		r.root.fixed= true
	update()
	return
getLinkName= (source,target)->
	return "#{source.name}->#{target.name}"
update = ->
	# Update the links…
	r.link = r.link.data(r.links)

	# Enter any new links.
	r.link.enter()
	.insert("line", ".node")
	.classed("link",true)

	# Exit any old links.
	r.link.exit().remove()

	r.node = r.vis.selectAll(".node").data(r.nodes,(d)->d.id)

	drag= r.force.drag().on('dragend', (d)->
		d.fixed= true
		return
	)

	#enter new nodes
	nodeEnter=r.node.enter()
	.append("g")
	.attr("class", "node")
	.on("click", click)
	.on('mouseover',(d)->
		d3.select(this).select('circle').attr("r",'13px')
		return
	)
	.on('mouseout',(d)->
		d3.select(this).select('circle').attr("r",getR(d))
		return
	)
	.on('dblclick',dblclick)
	.classed("highlight",(d)->d.isHigh==true)
	.attr "transform", (d) ->
			"translate(" + d.x + "," + d.y + ")"
	.call(drag)

	nodeEnter.append("circle")
	.attr("cx",0)
	.attr("cy",0)
	.attr("r", getR)
	.style("fill", color)

	# nodeEnter.append("text")
	# .attr("class","notclickable desc")
	# .text (d) ->
	#	 d.name

	r.node.exit().remove()



	d3.selectAll(".node circle")
	.attr("r", getR)
	.style("fill", color)
	
	d3.selectAll(".node text").remove()
	r.node.filter((d)->d.isHigh)
	.append('text')
	.attr("class","notclickable desc")
	.text (d)->d.name

	d3.selectAll(".node text")
	.attr("dx", (d)->getR(d)+5)
	.classed("show", (d)->d==r.theFocus)
	.attr("font-size", (1 / r.scale) + "em")

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
	r.force.start()
	# calculate graph info
	r.matrix=[]
	r.degree=[]
	r.hNode={}
	n=r.nodes.length
	for i in [0..n-1]
		r.hNode[r.nodes[i].id]=r.nodes[i]
		r.degree.push []
		r.matrix.push []
		for j in [0..n-1]
			r.matrix[i].push null
	for x in r.links
		r.degree[x.source.index].push x
		r.degree[x.target.index].push x
		r.matrix[x.source.index][x.target.index]=x
	r.node.classed "highlight", (d)->d.isHigh==true
	r.link.classed "highlight", (d)->d.isHigh==true
	r.node.classed('hidden',(d)->d.type=="referData")
	r.link.classed('hidden',(d)->d.target.type=="referData")
	for nod of r.hNode
			position_cache[nod]={
					'x':r.hNode[nod].x
					'y':r.hNode[nod].y
			}
	return

getR = (d) ->
	if d == r.theFocus
		return 15
	if d.isHigh then 10 else 5
tick = ->
	r.node.attr "transform", (d) ->
		radius= getR(d)
		"translate(" + d.x + "," + d.y + ")"
	r.link.attr("x1", (d) ->
		d.source.x
	).attr("y1", (d) ->
		d.source.y
	).attr("x2", (d) ->
		d.target.x
	).attr("y2", (d) ->
		d.target.y
	)		
color = (d) ->
	i=r.colors.indexOf(d.type)
	res= "black"
	if i>=0
		res= r.palette(i+1)
	else res= r.palette(d.type)
	if d.distance_rank?
		res= d3.hsl(res).brighter(d.distance_rank).toString()
	return res
dblclick = (d)->
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
	$.post "/explore/", JSON.stringify(data), expand, 'json'
	return
click = (d) ->
	d.fixed= false
	if r.shiftPressed
		if d==r.root
			alert "不能删除根节点"
			r.shiftPressed=false
			return
		n = r.nodes.length
		i= d.index
		for link in r.degree[d.index]
			r.links.remove link
			if r.degree[link.target.index].length==1
				r.nodes.remove link.target
			if r.degree[link.source.index].length==1
				r.nodes.remove link.source
		r.nodes.remove d
		r.blacklist.push d.id
		update()
	else if r.altPressed
		save().done ->
			window.location.href = "/model/#{d.id}"
	else if r.ctrlPressed
		dblclick d
		update()
	else
		highlight d
		# history.pushState {},d.name,"/model/#{d.id}"
		update()
		if r.click_handler?
			r.click_handler(d)
	return
expand = (data)->
	for id of data
		source=r.hNode[id]
		if not source?
			continue
		i=0
		for x in data[id]
			if not d.id?
				d.id= x.name
			x.id= "#{x.type}_#{x.id}"
			if r.blacklist.indexOf(x.id)>=0
				continue
			target=r.hNode[x.id]
			if not target?
				if i==5 and x.type!="referData" then continue
				r.nodes.push x
				x.x=source.x+Math.random()*100-50
				x.y=source.y+Math.random()*100-50
				i+=1
				target=x
			if not r.matrix[source.index][target.index]?
				r.links.push {"source":source,"target":target }
		source.isSearching= false
	update()
	return
highlight = (d)->
	for x in r.links
		x.isHigh= false
	for x in r.nodes
		x.isHigh= false
	d.isHigh=true
	r.theFocus = d
	i=d.index
	for link in r.degree[d.index]
		link.isHigh= true
		link.target.isHigh=true
		link.source.isHigh=true
	if not r.existing_relation_links?
		r.existing_relation_links=[]
	if r.relationships[d.type]?
		for rel in r.relationships[d.type]
			id= rel.id d
			if not r.hNode[id]?
				n= {
					'id':id,
					'name': rel.name(d),
					'type':"relationship",
					'isHigh':true,
					'x':d.x+Math.random()*100-50,
					'y':d.y+Math.random()*100-50,
				}
				r.nodes.push n
				l= {
					'source':d,
					'target':n,
					'isHigh':true,
				}
				r.links.push l
				r.existing_relation_links.push l
		for link in r.existing_relation_links
			if link.source==d
				continue
			if r.degree[link.target.index]? and r.degree[link.target.index].length>1
				continue
			r.links.remove link
			r.nodes.remove link.target
	return
save = ->
	res={
		"id":r.root.id,
		"name":r.root.name,
		"type":r.root.type,
		"nodes":[],
		"links":[],
		"blacklist":r.blacklist,
	}
	prop_node= "id name value index type url fixed".split(" ")
	for x in r.nodes
		n= {}
		for p in prop_node
			n[p]=x[p]
		res.nodes.push n
	for x in r.links
		l=
			"source":x.source.index
			"target":x.target.index
		res.links.push l
	res= JSON.stringify res
	return $.ajax
		"url":"/model/#{r.root.id}",
		"type": "POST",
		"contentType": "json", 
		"data": res
Array::remove = (b) ->
	a = @indexOf(b)
	if a >= 0
		@splice a, 1
		return true
	false

r = exports ? this
r.nest= (options)->
	r.hNode= {}
	container= options.container or "#container"
	r.w = options.width or $(container).width()
	r.h = options.height or $(container).height()
	r.ctrlPressed = false
	r.altPressed = false
	r.shiftPressed = false
	r.blacklist= []
	r.vis = d3.select(container)
		.append("svg:svg")
		.attr("viewBox","0 0 #{r.w} #{r.h}")	
		.attr("pointer-events", "all")
		# .attr("preserveAspectRatio","XMidYMid")
		.call(d3.behavior.zoom().scaleExtent([0.01,10]).on("zoom", redraw)).on('dblclick.zoom',null)
		.append("svg:g")
	r.link = r.vis.selectAll(".link")
	r.node = r.vis.selectAll(".node")
	r.palette= d3.scale.category10()
	r.colors =[
		"song",
		"artist",
		"user",
		"album",
		'relationship',
		"baiduBaikeCrawler",
		"hudongBaikeCrawler",
		"referData",
	]
	r.position_cache= {}
	r.highlighted= -> 
		r.node.filter((d)->d.isHigh)
	r.relationships={
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