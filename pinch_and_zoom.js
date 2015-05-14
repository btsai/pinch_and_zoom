/*
  http://github.com/btsai/pinch_and_zoom
  (c) 2015 Brian Tsai
  This code may be freely distributed under the MIT License
*/

(function ($) {

  $.fn.pinch_and_zoom = function(options){
    if( !options || !options.path) {
      throw 'pinch_and_zoom: needs options. path';
    }

    var canvas = this[0],
        context = canvas.getContext('2d'),
        image = new Image(),
        canvasOffsetX = canvas.getBoundingClientRect().left,
        canvasOffsetY = canvas.getBoundingClientRect().top,
        position = {x: 0, y: 0},
        scale = {x: 0.5, y: 0.5},
        canvasWidth, canvasHeight,
        initialScale = lastScale = lastX = lastY = isMousedown = null;

    canvas.width = canvasWidth = canvas.clientWidth;
    canvas.height = canvasHeight = canvas.clientHeight;

    var zoomSpeed = options.zoomSpeed || 1,               // lower number will zoom slower
        initialFit = options.initialFit || 'fill',        // options are 'fit', 'fill'
        onShow = options.onShow,
        onZoom = options.onZoom,
        maxZoom = options.maxZoom;

    function initEvents() {
      $(canvas)
      .on('touchstart mousedown', function(event) {
        isMousedown = true;
        lastX = lastY = lastScale = null;
      })
      .on('touchmove', function(event) {
        // don't let the whole screen drag
        event.preventDefault();

        var targetTouches = event.originalEvent.targetTouches.length;
        if(targetTouches == 2) {
          //pinch
          zoom(zoomRatioFromTouch(event.originalEvent));
        }
        else if(targetTouches == 1) {
          // drag
          var newPosition = touchPosition(event.originalEvent.targetTouches[0]);
          move(newPosition.x, newPosition.y);
        }
      })
      .on('mouseup', function(event) {
        isMousedown = false;
      })
      .on('mousemove', function(event) {
        if (!isMousedown) {
          return;
        }
        var newPosition = touchPosition(event);
        move(newPosition.x, newPosition.y);

        // if(canvasX <= 0 || canvasX >= canvasWidth || canvasY <= 0 || canvasY >= canvasHeight) {
        //   isMousedown = false;
        // }
      })

      $(window)
      .on('keyup', function(event) {
        if(event.keyCode == 187 || event.keyCode == 61) { //+
          zoom(5);
        }
        else if(event.keyCode == 189 || event.keyCode == 54) { //-
          zoom(-5);
        }
      })

    }

    function touchPosition(event){
      return {
        x: parseInt(event.pageX - canvasOffsetX),
        y: parseInt(event.pageY - canvasOffsetY),
      }
    }

    function initialScales(){
      return {
        width: canvasWidth / image.width,
        height: canvasHeight / image.height,
      }
    }

    function fill(){
      var initial = initialScales();
      position.x = position.y = 0;
      return Math.max(initial.width, initial.height);
    }

    function fit(){
      var initial = initialScales();
      // center image if fitting
      if (initial.width < initial.height){
        position.x = 0;
        position.y = parseInt(canvasHeight - image.height * initial.width) / 2;
      }
      else {
        position.x = parseInt(canvasWidth - image.width * initial.height) / 2;
        position.y = 0;
      }

      return Math.min(initial.width, initial.height);
    }

    function setInitialScale(){
      if (!image.width) {
        return;
      }

      //set scale such as image cover all the canvas, or else fit entire image in canvas
      if (initialFit == 'fit'){
        initialScale = zoomRatio = fit();
      }
      else {
        initialScale = zoomRatio = fill();
      }

      if (onShow){
        onShow(initialScale);
      }
      draw();
    }

    function draw() {
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      var newImageWidth = parseInt(zoomRatio * image.width),
          newImageHeight = parseInt(zoomRatio * image.height);
      context.drawImage(image, position.x, position.y, newImageWidth, newImageHeight);
    }

    function zoomRatioFromTouch(event) {
      var zoom = false;

      var p1 = event.targetTouches[0];
      var p2 = event.targetTouches[1];

      //euclidian distance
      var zoomScale = zoomSpeed * Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2));

      if (lastScale) {
        zoom = zoomScale - lastScale;
      }

      lastScale = zoomScale;

      return zoom;
    }

    function zoom(zoomDelta) {
      if (!zoomDelta) {
        return;
      }

      var newScale = zoomRatio + zoomDelta / 100;
      onZoom(newScale)

      if (newScale < initialScale) return;
      if (maxZoom && newScale > maxZoom){
        // could just return but then won't stop exactly at maxZoom
        newScale = maxZoom;
      }

      var deltaScale = newScale - zoomRatio;
      var currentWidth  = (image.width * zoomRatio);
      var currentHeight   = (image.height * zoomRatio);
      var deltaWidth  = image.width * deltaScale;
      var deltaHeight = image.height * deltaScale;


      //by default scale doesnt change position and only add/remove pixel to right and bottom
      //so we must move the image to the left to keep the image centered
      //ex: coefX and coefY = 0.5 when image is centered <=> move image to the left 0.5x pixels added to the right
      var canvasmiddleX = canvasWidth / 2;
      var canvasmiddleY = canvasHeight / 2;
      var xonmap = canvasmiddleX - position.x;
      var yonmap = canvasmiddleY - position.y;
      var coefX = -xonmap / (currentWidth);
      var coefY = -yonmap / (currentHeight);
      var newPosX = position.x + deltaWidth * coefX;
      var newPosY = position.y + deltaHeight * coefY;

      var newWidth = currentWidth + deltaWidth;
      var newHeight = currentHeight + deltaHeight;

      if( newPosX > 0 ) { newPosX = 0; }
      if( newPosX + newWidth < canvasWidth ) { newPosX = canvasWidth - newWidth;}

      if( newPosY > 0 ) { newPosY = 0; }
      if( newPosY + newHeight < canvasHeight ) { newPosY = canvasHeight - newHeight; }

      // zoom scale callback
      if (onZoom){
        onZoom(newScale);
      }

      zoomRatio = newScale;
      position.x = parseInt(newPosX);
      position.y = parseInt(newPosY);

      draw();
    }

    function move(canvasX, canvasY) {
      if (lastX && lastY) {
        var deltaX = canvasX - lastX;
        var deltaY = canvasY - lastY;
        var currentWidth = (image.width * zoomRatio);
        var currentHeight = (image.height * zoomRatio);

        position.x += deltaX;
        position.y += deltaY;


        if (currentWidth >= canvasWidth){
          if( position.x > 0 ) {
          // cannot move left edge of image > container left edge
          position.x = 0;
          }
          else if( position.x + currentWidth < canvasWidth ) {
          // cannot move right edge of image < container right edge
          position.x = canvasWidth - currentWidth;
          }
        }
        else {
          if( position.x < currentWidth - canvasWidth ) {
          // cannot move left edge of image < container left edge
          position.x = currentWidth - canvasWidth;
          }
          else if( position.x > canvasWidth - currentWidth ) {
          // cannot move right edge of image > container right edge
          position.x = canvasWidth - currentWidth;
          }
        }
        if (currentHeight > canvasHeight){
          if( position.y > 0 ) {
          // cannot move top edge of image < container top edge
          position.y = 0;
          }
          else if( position.y + currentHeight < canvasHeight ) {
          // cannot move bottom edge of image > container bottom edge
          position.y = canvasHeight - currentHeight;
          }
        }
        else {
          if( position.y < 0 ) {
          // cannot move top edge of image < container top edge
          position.y = 0;
          }
          else if( position.y > canvasHeight - currentHeight ) {
          // cannot move bottom edge of image > container bottom edge
          position.y = canvasHeight - currentHeight;
          }
        }
      }

      lastX = canvasX;
      lastY = canvasY;

      draw();
    }

    initEvents();

    image.onload = setInitialScale;
    image.src = options.path;

  }

})(jQuery);
