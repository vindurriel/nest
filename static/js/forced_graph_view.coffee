cacheIt = (e) ->
  r.ctrlPressed = e.ctrlKey
  r.altPressed = e.altKey
  r.shiftPressed = e.shiftKey
  return true
redraw = ->
  r.vis.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")"
draw = (json) ->
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
    d.x=i*r.w/n
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
  r.node.remove()
  r.node = r.vis.selectAll(".node").data(r.nodes,(d)->(d.id))
  .classed("highlight",(d)->d.isHigh==true)

  nodeEnter=r.node.enter()
  .append("g")
  .attr("class", "node")
  .on("click", click)
  .classed("highlight",(d)->d.isHigh==true)
  .attr "transform", (d) ->
      "translate(" + d.x + "," + d.y + ")"
  .call(r.force.drag)

  nodeEnter.append("circle")
  .attr("cx",0)
  .attr("cy",0)
  .attr("r", getR)
  .style("fill", color)

  nodeEnter.append("title")
    .text (d) ->
      d.name

  nodeEnter.append("text")
  .attr("class","notclickable desc")
  .attr "dx", (d) ->
    getR(d)
  .text (d) ->
    if  d.type=="referData"
      return ""
    d.name

  r.node.exit().remove()

  d3.selectAll(".node circle")
  .attr("r", getR)
  .style("fill", color)
  
  d3.selectAll(".node text")
  .attr("dx", getR)
  .classed("show", (d)->d==r.theFocus)

  d3.selectAll(".search-img").remove()

  r.node.filter((d) ->
    d.isSelected
  ).append("image").attr("x", (d) ->
    -1.2 * 32 * getR(d) / 15.0
  ).attr("y", (d) ->
    -1.2 * 32 * getR(d) / 15.0
  ).attr("width", (d) ->
    1.2 * 64 * getR(d) / 15.0
  ).attr("height", (d) ->
    1.2 * 64 * getR(d) / 15.0
  ).attr("xlink:href", "/static/images/loader.gif")
  .classed("search-img",true)

  r.force.start()
  r.matrix=[]
  n = r.nodes.length
  for i in [0..n]
    r.matrix.push []
    for j in [0..n]
      r.matrix[i].push null
  for x in r.nodes
    if not r.hNode[x.name]?
      r.hNode[x.name]=x
  for x in r.links
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
click = (d) ->
  if r.shiftPressed
    if d==r.root
      alert "不能删除根节点"
      r.shiftPressed=false
      return
    n = r.nodes.length
    i= d.index
    for j in [0..n]
      link=r.matrix[i][j]
      if link?
       r.links.remove link
      link=r.matrix[j][i]
      if link?
       r.links.remove link
    r.nodes.splice i,1
    r.hNode[d.name]=undefined
    blacklist.push d.name
  else if r.altPressed
    save().done ->
      window.location.href = "/model/#{d.name}"
    return
  else if r.ctrlPressed
    if d.type=="referData"
      window.open if d.url? then d.url else d.name
      return
    if d.isSelected? and d.isSelected==true
      d.isSelected= false
    else 
      d.isSelected = true
    if not d.isSelected
      return
    url= "/roaming/#{d.type}s/#{d.id}"
    d3.json url , (data)-> 
      expand(d,data)
  else
    highlight d
    history.pushState {},d.name,"/model/#{d.id}"
  update()
expand = (d,data)->
  source=r.hNode[d.name]
  if not source?
    return
  i=0
  for x in data
    if r.blacklist.indexOf(x.name)>=0 then continue
    if x.type=="referData"
      if not r.hNode[x.name]?
        r.nodes.push x
        r.links.push {"source":source,"target":x }
    else 
      target=x
      if not r.hNode[x.name]?
        if i==5 then continue
        r.nodes.push x
        i+=1
      else
        target=r.hNode[x.name]
      if not r.matrix[source.index][target.index]?
        r.links.push {"source":source,"target":target }
  d.isSelected= false
  update()
highlight = (d)->
  for x in r.links
    x.isHigh= false
  for x in r.nodes
    x.isHigh= false
  d.isHigh=true
  r.theFocus = d
  i=d.index
  for j in [0..r.nodes.length]
    if r.matrix[i][j]?
      r.matrix[i][j].isHigh= true
      r.nodes[j].isHigh = true
    if r.matrix[j][i]?
      r.matrix[j][i].isHigh= true
      r.nodes[j].isHigh= true
  return
save = ->
  res=
    "id":r.root.id,
    "name":r.root.name,
    "type":r.root.type,
    "nodes":[],
    "links":[],
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
    "url":"/model",
    "type": "POST",
    "contentType": "json", 
    "data": res
r = exports ? this
r.hNode={}
r.w = $(this).width()
r.h = $(this).height()
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
r.vis = d3.select("#container")
  .append("svg:svg")
  .attr("width", r.w)
  .attr("height", r.h)
  .attr("viewBox","0 0 #{r.w} #{r.h}")
  .attr("pointer-events", "all")
  .attr("preserveAspectRatio","XMidYMid")
  .append("svg:g")
  .call(d3.behavior.zoom()
  .on("zoom", redraw))
  .append("svg:g")
r.link=r.vis.selectAll(".link")
r.node=r.vis.selectAll(".node")
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
    type=$("input[name='music_type']:checked").val()
    query=$("#q").val()
    if parseInt(query)==NaN 
      return
    $.getJSON "/model/load/#{query}", (d)->
      if not d or d.error?
        $.getJSON "/info/#{type}s/#{query}", (d)->
          if not d or d.error?
            alert d.error
            return
          draw d
      else
        draw d
  $.getJSON "/model/load/#{document.title}", (d)->
    if not d or d.error?
      draw {"nodes":[{"name":"Everybody","id":"1769077491","type":"song"}],"links":[]}
    else
      draw d
r.vis.append("svg:rect").attr("width", r.w).attr("height", r.h).attr "fill", "none"
r.palette= d3.scale.category10()
r.colors =[
   "baiduBaikeCrawler",
   "hudongBaikeCrawler",
   "referData",
   "song",
   "artist",
   "user",
   "album"
]
