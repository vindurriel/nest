window.list= (d)->
  lorem= """Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
  consequat."""
  $("#list-container").masonry "destroy"
  $(".list-item.normal").remove()
  t_list_item= (d)->
    details= ""
    for x of d
      details+= "#{x}:#{d[x]};  "
    details+="<br>"+lorem
    i= Math.floor(Math.random() * (10 - 0 + 1))
    color= window.palette(d.type)
    return """
    <div class="list-item normal">
      <h2 class="item-headline">
        <span style="border-left:#{color} solid 5px;">&nbsp;</span>
        <a href="#{d.url}">#{d.name}</a>
      </h2>
      <table>
        <tr>
          <td width="80" valign="top"> <img class="item-image" src="http://lorempixel.com/80/80/technics/#{i}"/> </td>
          <td style="margin-left:1em;">  
            <span class="item-prop">#{d.type} </span> 
            <p class="item-detail">#{details}...</p>
          </td>
        </tr>
      </table>
    </div>
    """
  t_item_action= (d)->
    """
      <a class="button" href="#">收藏</a>
      <a class="button" href="#">分享</a>
    """
  for x in d.nodes
    s=t_list_item(x)
    $("#list-container").append(s)
  $(".item-prop").append t_item_action x
  $("#list-container").masonry {
    itemSelector: '.list-item',
  }
  return
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
    # toH = if toggle then $(window).height()*.8 else 200
    # ui.animate({"height":toH},200);
    # setTimeout ->
    #   $("#list-container").masonry()
    # , 200
    $(this).val(if toggle then "收起" else "展开")
  $("#btn_tip").click ->
    $("#tip").slideToggle 200
  $("#btn_search").click ->
    key=$('#q').val()
    $('html, body').animate({"scrollTop":0})
    $.getJSON "/search/#{key}", (d)->
      if not d or d.error?
        return
      draw d
      list d
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
  return