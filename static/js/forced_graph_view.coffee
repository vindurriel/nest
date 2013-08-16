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
  r.legend=r.vis
  .selectAll("rect.leg")
  .data([
    {"type":"artist",},
    {"type":"album",},
    {"type":"song",}
  ])
  .enter()
  .append('g')
  .attr "transform", (d,i) ->
    "translate(" + 100 + "," + (50+i*70) + ")"
  .classed('leg',true)
  
  r.legend.append("circle")
  .style("fill",color)
  .attr("r","10px")
  .attr('cx','0')
  .attr('cy','0')

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
    d.x=r.w*(i%10)/10
    d.y=i*r.h/n
  update()
getLinkName= (source,target)->
  return "#{source.name}->#{target.name}"
update = ->
  # Update the links…
  r.link = r.link.data(r.links)
  .classed "highlight", (d)->d.isHigh==true
  
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
  r.link.attr("x1", (d) ->
    d.source.x
  ).attr("y1", (d) ->
    d.source.y
  ).attr("x2", (d) ->
    d.target.x
  ).attr("y2", (d) ->
    d.target.y
  )
  r.node.attr "transform", (d) ->
    "translate(" + d.x + "," + d.y + ")"
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
  if d.type=="relationship"
    s=d.id.split('_')
    t=s[0]
  url= "/roaming/#{t}/#{id}"
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
      window.location.href = "/model/#{d.name}"
  else if r.ctrlPressed
    dblclick d
    update()
  else
    highlight d
    if d.type!='relationship'
      history.pushState {},d.name,"/model/#{d.type}_#{d.id}"
    update()
expand = (data)->
  for id of data
    source=r.hNode[id]
    if not source?
      continue
    i=0
    for x in data[id]
      if not x.id?
        x.id= x.name
      if r.blacklist.indexOf(x.id)>=0
        continue
      if x.type=="referData"
        if not r.hNode[x.id]?
          x.x=source.x+10
          x.y=source.y+10
          r.nodes.push x
          r.links.push {"source":source,"target":x }
      else 
        target=x
        if not r.hNode[x.id]?
          if i==5 then continue
          r.nodes.push x
          x.x=source.x+10
          x.y=source.y+10
          i+=1
        else
          target=r.hNode[x.id]
        if not r.matrix[source.index][target.index]?
          r.links.push {"source":source,"target":target }
    source.isSearching= false
  update()
highlight = (d)->
  for x in r.links
    x.isHigh= false
  relationships=[]
  for x in r.nodes
    x.isHigh= false
    if x.type=="relationship"
        relationships.push x
  d.isHigh=true
  r.theFocus = d
  i=d.index
  for link in r.degree[d.index]
    link.isHigh= true
    link.target.isHigh=true
    link.source.isHigh=true
  if d.type == "artist"
    if not r.hNode['hitsongs_'+d.id]?
      r.nodes.push {
        'id':'hitsongs_'+d.id,
        'name':"#{d.name}的热门歌曲",
        'type':'relationship',
        'isHigh':true,
        'x':d.x+Math.random()*100-50,
        'y':d.y+Math.random()*100-50,
      }
      r.links.push {
        'source':d,
        'target':r.nodes.slice(-1)[0],
        'isHigh':true,
      }
    if not r.hNode['albums_'+d.id]?
      r.nodes.push {
        'id':'albums_'+d.id,
        'name':"#{d.name}的专辑",
        'type':'relationship',
        'isHigh':true,
        'x':d.x+Math.random()*100-50,
        'y':d.y+Math.random()*100-50,
      }
      r.links.push {
        'source':d,
        'target':r.nodes.slice(-1)[0],
        'isHigh':true,
      }
    for x in relationships
      if r.degree[x.index].length==1 and r.degree[x.index][0].source!=d
        r.nodes.remove x
        r.links.remove r.degree[x.index][0]
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
    "url":"/model/#{r.root.type}_#{r.root.id}",
    "type": "POST",
    "contentType": "json", 
    "data": res
r = exports ? this
r.hNode={}
r.w = $(window).width()
r.h = $(window).height()
r.ctrlPressed = false
r.altPressed = false
r.shiftPressed = false
r.blacklist= []
Array::remove = (b) ->
  a = @indexOf(b)
  if a >= 0
    @splice a, 1
    return true
  false
r.scale=1
r.vis = d3.select("#container")
  .append("svg:svg")
  .attr("viewBox","0 0 #{r.w} #{r.h}")
  .attr("pointer-events", "all")
  # .attr("preserveAspectRatio","XMidYMid")
  .call(d3.behavior.zoom().scaleExtent([0.5,10]).on("zoom", redraw)).on('dblclick.zoom',null)
  .append("svg:g")
r.link = r.vis.selectAll(".link")
r.node = r.vis.selectAll(".node")
$(document).ready ->
  $(document).keydown cacheIt
  $(document).keyup cacheIt
  $("#btn_tip").click ->
    $("#tip").slideToggle 200
  $("#btn_save").click ->
    save()
    .done ->
      alert "保存完成"
    .fail (d,e)->
      alert e
  $("#btn_search").click ->
    query=$("#q").val()
    if ":" in query
      query = query.replace ":","_"
    id= query
    type= "unknown"
    if "_" in query
      s= query.split "_"
      type= s[0]
      id=s[1]
    $.getJSON "/model/load/#{query}", (d)->
      if not d or d.error?
        $.getJSON "/info/#{type}s/#{id}", (d)->
          if not d or d.error?
            alert d.error
            return
          draw d
      else
        draw d
  query= document.title
  type= "unknown"
  if ":" in query
    query = query.replace ":","_"
  if "_" in query
    s= query.split "_"
    type= s[0]
    id= s[1]
  $.getJSON "/model/load/#{query}", (d)->
    if not d or d.error?
      $.getJSON "/info/#{type}s/#{id}", (d)->
          if not d or d.error?
            alert d.error
            return
          draw d
    else
      draw d
# r.vis.append("svg:rect").attr("width", r.w).attr("height", r.h).attr "fill", "#33ffff"
r.palette= d3.scale.category20()
r.colors =[
  "referData",
  "song",
  "artist",
  "user",
  "album",
  'relationship',
  "baiduBaikeCrawler",
  "hudongBaikeCrawler"
]
