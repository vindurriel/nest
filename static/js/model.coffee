window.t_item_action= (d)->
    """
      <a class="button small" href="#">收藏</a>
      <a class="button small" href="#">分享</a>
    """
window.list= (d)->
  t_list_item= (d)->
    details= if d.content? then d.content else ""
    i= Math.floor(Math.random() * (10 - 0 + 1))
    color= window.palette(d.type)
    # imgurl= "http://lorempixel.com/80/80/technics/#{i}"
    imgurl= ""
    if d.img?
      imgurl= d.img
    return """
    <div class="list-item normal">
      <h2 class="item-headline">
        <span style="border-left:#{color} solid 5px;">&nbsp;</span>
        <a href="#{d.url}">#{d.name}</a>
      </h2>
      <span class="item-prop">#{d.type} </span>
      <div>
        <img class="item-image" src="#{imgurl}"/>
      </div>
      <p class="item-detail">#{details}</p>
    </div>
    """
  try
    $("#list-container").masonry "destroy"
  catch err
    a= err

  $(".list-item.normal").remove()
  color= window.palette(d.type)
  $("#list-container").append t_list_item(d)
  $("#list-container div:last-child").addClass('selected_info')
  if d.nodes.length>1
    return

  for x in d.nodes
    s=t_list_item(x)
    $("#list-container").append(s)
  $("#list-container").masonry {
      'itemSelector': '.list-item',
    }
  $("#list-container").imagesLoaded().done ->
    $("#list-container").masonry {
      'itemSelector': '.list-item',
    }
    return
  return

window.click_handler= (d)->
  $(".selected_info .item-headline a").text(d.name)
  $(".selected_info .item-prop").text(d.type)
  if d.type=="doc"
    $(".selected_info .item-headline a").attr('href',d.url)
    container= ".selected_info .item-detail"
    value= window.degree[d.index][0].value
    $(container).empty().append """<p>到聚类中心的距离：#{value}</p>"""
    $.getJSON "/keyword/#{d.name}", (res)->
      data= []
      for x of res.keyword
        data.push {'k':x,'v':res.keyword[x]}
      renderBarChart data, {
        "container":container,
      }
      $(container).append """<p>#{res.summary}</p>"""
      return
  else
    detail=$(".selected_info .item-detail")
    detail.empty()
    for link in r.degree[d.index]
      if d==link.target then continue
      n=link.target
      if n.type!="referData" then continue
      detail.append("<div><a href=#{n.url} target='_blank' >#{n.name}</a> #{t_item_action(n)} </div>")
  $("#list-container").masonry()
  return
get_selected_services = ->
  service_ids= []
  $('.check-service').each ->
    if not this.checked then return
    if $(this).data('serviceId')?
      service_ids.push $(this).data('serviceId')
  return service_ids
$(document).ready ->
  options=
    "container":"#nest-container",
  window.nest(options)

  $(document).keydown cacheIt
  $(document).keyup cacheIt
  $(".btn-toggle-nest").click ->
    ui= $(options.container)
    toggle= ui.height()<=210
    if toggle
      ui.attr('style','')
      ui.removeClass('list-item').addClass('fullscreen')
    else
      ui.removeClass('fullscreen').addClass('list-item')
      $("#list-container").masonry()
    $(this).val(if toggle then "收起" else "展开")
  play_step= ->
    if r.current_step>=r.story.length or r.current_step<0 then return
    s= r.story[current_step]
    func= explore
    if s.event=="draw"
          func= draw
    info= r.story[r.current_step]
    $("#story-indicator,.btn-next,.btn-prev,.btn-automate").show()
    $("#story-indicator").text("第#{r.current_step+1}步，共#{r.story.length}步， 节点数：#{info.nodes.length}")
    draw s
    return
  $("#btn_tip").click ->
    #$("#tip").slideToggle 200
    scr= prompt "要打开的文件名","default"
    $.getJSON "/play/#{scr}", (d)->
      r.story= []
      r.current_step=0
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
        r.story.push cur
      play_step()
  $(".btn-next").click ->
    if r.current_step==r.story.length-1 then return
    r.current_step+=1
    play_step()
    return
  $(".btn-prev").click ->
    if r.current_step==0 then return
    r.current_step-=1
    play_step()
    return
  $(".btn-automate-yes").click ->
    dic=
      "nodes":r.nodes
      "links":r.links.map (d)->{"source":d.source.index,"target":d.target.index}
    console.log dic
    for p in "max_total_node_num max_single_node_num timeout_seconds max_depth".split(" ")
      dic[p]=$("#"+p).val()
    $.post "/automate",  JSON.stringify(dic), (d)->
        if d.error?
          console.log d.error
        $("#automate-form").slideToggle()
    return
  $(".btn-automate-no").click ->
    $("#automate-form").slideToggle()
    return
  $(".btn-automate").click ->
    $("#automate-form").slideToggle()
    return

  $("#btn_search").click ->
    key=$('#q').val()
    data= {
      'keys':key,
      'services':get_selected_services(),
    }
    keynode = {
      'type':"baike",
      'name':key,
    }
    $.post "/search", JSON.stringify(data), (d)->
        if not d or d.error?
          return
        d.nodes.splice 0,0,keynode
        i=0
        for x in d.nodes
          x.index=i
          if i>0
            d.links.push {
              source:0,
              target:i,
            }
          i+=1
        draw d
        list d
        return
      ,'json'
    $('html, body').animate({"scrollTop":0})
    return
  $(window).scroll ->
    toggle= $(this).scrollTop()>100
    if toggle
      $("#nav").addClass("fade")
    else
      $("#nav").removeClass("fade")
  $('#q').keypress (e) ->
      if e.keyCode==13
        $('#btn_search').click()
  $("#btn_save").click ->
    save()
    .done ->
      alert "保存完成"
    .fail (d,e)->
      alert e
  id= document.title
  type= "unknown"
  if ":" in id
    query = query.replace ":","_"
  $.getJSON "/model/load/#{id}", (d)->
    if not d or d.error?
      $.getJSON "/info/#{id}", (d)->
          if not d or d.error?
            return
          draw d
          list d
    else 
      draw d
      list d
    click_handler(r.root)
  #fillServices
  $.getJSON "/services/",(d)->
    if not d or d.error?
      log('error get services')
      return
    for s in d.services
      checked = ""
      if s.select? and s.select==true
        checked= "checked"
      $('.services').append """
      <li>
        <input type="checkbox"   data-service-id="#{s.id}" #{checked} class="check-service" id="#{s.id}"> <span>使用 #{s.name} 搜索</span>
      </li>
      """
    return
  return