cacheIt = (e) ->
  r.ctrlPressed = e.ctrlKey
  r.altPressed = e.altKey
  r.shiftPressed = e.shiftKey
redraw = ->
  r.vis.attr "transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")"
draw = (json) ->
  r.root = json
  r.root.fixed = true
  r.root.x = r.w / 2
  r.root.y = r.h / 2 - 80
  r.force = d3.layout.force().on("tick", tick).charge((d) ->
    (if d._children then -d.size / 50 else -120)
  ).linkDistance((d) ->
    (if d.target._children then 100 else 50)
  ).size([r.w, r.h - 160])
  update()
update = ->
  r.vis.selectAll(".node").remove()
  nodes = flatten(r.root)
  links = d3.layout.tree().links(nodes)
  
  # Update the links…
  r.link = r.vis.selectAll(".link").data(links, (d) ->
    d.target.id
  )
  
  # Enter any new links.
  r.link.enter().insert("path", ".node").attr "class", "link"
  
  # Exit any old links.
  r.link.exit().remove()
  
  # Update the nodes…
  r.node = r.vis.selectAll(".node").data(nodes, (d) ->
    d.id
  ).enter().append("g").attr("class", "node").on("click", click).call(r.force.drag)
  r.node.append("circle").attr("cx", (d) ->
    0
  ).attr("cy", (d) ->
    0
  ).attr("r", getR).style("fill", color).style("stroke-width", stroke_width).transition().attr "r", getR
  
  r.node.append("title")
    .text (d) ->
      d.name
  # r.node.append("text")
  #   .style "font-size", (d) ->
  #     getR(d)
  #   .style "opacity", (d) ->
  #     if d.type=="expandRead" or d.type=="referData"
  #       return 0
  #     return 1
  #   .attr "dx", (d) ->
  #     getR(d)
  #   .text (d) ->
  #     d.name

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
  ).attr "xlink:href", "/static/images/loader.gif"

  r.force.nodes(nodes).links(links).start()
getR = (d) ->
  if  d.type=="referData" or d.type=="expandRead"
    return 2
  return 10
  x = d.level
  x = 4  if x > 4
  15 - x * 3
tick = ->
  r.link.attr("x1", (d) ->
    d.source.x
  ).attr("y1", (d) ->
    d.source.y
  ).attr("x2", (d) ->
    d.target.x
  ).attr("y2", (d) ->
    d.target.y
  ).attr "d", r.diag
  r.node.attr "transform", (d) ->
    "translate(" + d.x + "," + d.y + ")"
# Color leaf nodes orange, and packages white or blue.
color = (d) ->
  if r.colors[d.type] then r.colors[d.type] else "black"

stroke_width = (d) ->
  (if d._children? then "2px" else ".5px")

click = (d) ->
  if d.type=="expandRead" or d.type=="referData"
    window.open if d.url? then d.url else d.name
    return
  if r.shiftPressed
    d.parent.children.remove d  if d.parent?
  else if r.altPressed
    if d.children
      d._children = d.children
      d.children = null
    else
      d.children = d._children
      d._children = null
  else if r.ctrlPressed
    d.isSelected = false  if not d.isSelected
    d.isSelected = not d.isSelected
    if d.isSelected
      children= [d.name]
      if d.children
        for x in d.children
          children.push x.name
      children= children.join("||")
      url= "/search/#{d.name}?children=#{children}"
      console.log url
      d3.json url , (data) ->
          d.children = []  unless d.children
          i=0
          for x in data
            d.children.push x
            i+=1
            if i==5 then break
          d.isSelected= false
          update()
  update()
# Returns a list of all nodes under the root.
flatten = (root) ->
  recurse = (node, level,parent) ->
    node.level = level
    node.parent= parent
    if node.children
      node.size = node.children.reduce((p, v) ->
        p + recurse(v, level + 1, node)
      , 0)
    
    # if (!node.id) 
    node.id = ++i
    nodes.push node
    node.size
  nodes = []
  i = 0
  root.size = recurse(root, 0, null)
  nodes

r = exports ? this
r.w = $(this).width()
r.h = $(this).height()
r.diag = d3.svg.diagonal().projection((d) ->
  [d.x, d.y]
)
r.ctrlPressed = false
r.altPressed = false
r.shiftPressed = false
Array::remove = (b) ->
  a = @indexOf(b)
  if a >= 0
    @splice a, 1
    return true
  false

document.onkeydown = cacheIt
document.onkeyup = cacheIt
r.vis = d3.select("body")
  .insert("svg:svg", "#tip")
  .attr("width", r.w)
  .attr("height", r.h)
  .attr("viewBox","0 0 #{r.w} #{r.h}")
  .attr("pointer-events", "all")
  .attr("stroke","black")
  .attr("preserveAspectRatio","XMidYMid")
  .append("svg:g")
  .call(d3.behavior.zoom()
  .on("zoom", redraw))
  .append("svg:g")
$(document).ready ->
  $(window).resize ->
    r.w = $(this).width()
    r.h = $(this).height()
    r.vis
    .attr("width", r.w)
    .attr("height", r.h)
r.vis.append("svg:rect").attr("width", r.w).attr("height", r.h).attr "fill", "none"
r.colors =
   "baiduBaikeCrawler":"#2f5d8c",
   "expandRead":"#ad89cb",
   "hudongBaikeCrawler":"#6a895c",
   "referData":"#98c73c",
draw
  "name":document.title,
  "size":100,