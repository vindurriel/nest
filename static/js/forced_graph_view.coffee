cacheIt = (e) ->
  r.ctrlPressed = e.ctrlKey
  r.altPressed = e.altKey
  r.shiftPressed = e.shiftKey
  return true
redraw = ->
  r.scale=d3.event.scale
  r.vis.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" + r.scale + ")"
  d3.selectAll("text").style("font-size", (1 / r.scale) + "em");
draw = (json) ->
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
    "translate(" + 10  + "," + (30+i*30) + ")"
  .classed('leg',true)
  
  r.legend.append("circle")
  .style("fill",color)
  .attr("r","10px")
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
  r.theFocus=r.root
  r.root.fixed = false
  r.root.isHigh= true
  r.force = d3.layout.force()
  .on("tick", tick)
  .charge (d)->
    if d.type=="referData" then -20 else -200
  .linkDistance(20)
  .linkStrength(.1)
  .size([r.w, r.h])
  .nodes(r.nodes)
  .links(r.links)
  n=r.nodes.length
  r.nodes.forEach (d,i)->
    if not d.id?
      d.id= d.name
    if '_' not in d.id
      d.id= "#{d.type}_#{d.id}"
    d.x=r.w*(i%10)/10
    d.y=i*r.h/n
  update()
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

  #update nodes
  # r.node.remove()
  r.node = r.vis.selectAll(".node").data(r.nodes,(d)->d.id)
  .classed("highlight",(d)->d.isHigh==true)

  #enter new nodes
  nodeEnter=r.node.enter()
  .append("g")
  .attr("class", "node")
  .on("click", click)
  .on('dblclick',dblclick)
  .classed("highlight",(d)->d.isHigh==true)
  .attr "transform", (d) ->
      "translate(" + d.x + "," + d.y + ")"
  .call(r.force.drag)
  
  nodeEnter.append("circle")
  .attr("cx",0)
  .attr("cy",0)
  .attr("r", getR)
  .style("fill", color)
  nodeEnter.append("text")
  .attr("class","notclickable desc")
  .text (d) ->
    d.name

  r.node.exit().remove()

  r.node.classed "highlight", (d)->d.isHigh==true
  r.link.classed "highlight", (d)->d.isHigh==true

  d3.selectAll(".node circle")
  .attr("r", getR)
  .style("fill", color)
  
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
  if i>=0
    return r.palette(i+1)
  return r.palette(0)
dblclick = (d)->
  if d.type=="referData"
    window.open if d.url? then d.url else d.name
    return
  if d.isSearching? and d.isSearching==true
    d.isSearching= false
  else 
    d.isSearching = true
  if not d.isSearching
    return
  t=d.type
  id=d.id
  url= "/roaming/#{id}"
  d3.json url , expand
  update()
click = (d) ->
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
    history.pushState {},d.name,"/model/#{d.id}"
    update()
expand = (data)->
  for id of data
    source=r.hNode[id]
    if not source?
      continue
    i=0
    for x in data[id]
      x.id= "#{x.type}_#{x.id}"
      if not x.id?
        x.id= x.name
      if r.blacklist.indexOf(x.id)>=0
        continue
      target=r.hNode[x.id]
      if not target?
        if i==5 then continue
        r.nodes.push x
        x.x=source.x+Math.random()*100-50
        x.y=source.y+Math.random()*100-50
        i+=1
        target=x
      if not r.matrix[source.index][target.index]?
        r.links.push {"source":source,"target":target }
    source.isSearching= false
  update()
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
  for x in r.nodes
    res.nodes.push 
      "id":x.id,
      "name":x.name,
      "value":x.value,
      "index":x.index,
      "type":x.type,
      "url":x.url,
  for x in r.links
    res.links.push
      "name":x.name,
      "source":x.source.index,
      "target":x.target.index,
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
    .call(d3.behavior.zoom().scaleExtent([0.1,10]).on("zoom", redraw)).on('dblclick.zoom',null)
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