# pinch_and_zoom

Super simple and light JQuery plugin for image pinch/zoom on touch devices.

Add touch gestures (pinch zoom and touch drag) to an image (like Google Maps).
Based on a canvas element for smooth rendering.

Inspired by https://github.com/rombdn/img-touch-canvas.

Usage
------------

The image will be scaled to cover all the container so if you want the image to be showed at its original size by default 
then set the container size to match the image original size (see example).

  <canvas id="image_canvas"></canvas>
  <script>
    $('#image_canvas').pinch_and_zoom({
      path: IMAGE_PATH
    })
  </script>


Options
------------

```
zoomSpeed       Speed of zoom when pinching / zooming (default 1, lower number is slower).
initialFit      Initial display. 'fill' to fill canvas (default), 'fit' to fit image centered in canvas.
onShow          Callback for initial display, returns image scale.
onZoom          Callback for during zoom, returns image scale.
maxZoom         Maximium zoom possible (default null), e.g. 2.0 for max 200%.
```

Licence
------------
(c) 2015 Brian Tsai
This code may be freely distributed under the MIT License