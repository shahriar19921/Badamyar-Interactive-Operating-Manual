/// <reference path="../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../Scripts/typings/jqueryui/jqueryui.d.ts" />

class ZoomData {
  busy: boolean;
  currentX: number;
  currentY: number;
  currentZoom: number;
  originalHeight: number;
  originalWidth: number;
  originalMap: HTMLMapElement;
  x_fact: number;
}

class ZoomableOptions {
  top?: number;
  left?: number;
  method?: string;
  mouseWheel?: boolean;
  zoom?: number;
  draggableOptions?: JQueryUI.DraggableOptions;
}

(($: JQueryStatic) => {
  $.fn.zoomable = function (options: ZoomableOptions) {
    return this.each(function (index: number, value: HTMLImageElement): void {
      // restore data, if there is any for this element
      var zoomData: ZoomData;
      if ($(this).data("zoomData") === undefined) {
        zoomData = {
          busy: false,
          x_fact: 1.2,
          currentZoom: 1,
          originalMap: null,
          originalHeight: 0,
          originalWidth: 0,
          currentX: 0,
          currentY: 0
        };
        $(this).data("zoomData", zoomData);
      } else {
        zoomData = $(this).data("zoomData");
      }

      var left: () => number = () => parseInt($(value).css("left"), 10);
      var top: () => number = () => parseInt($(value).css("top"), 10);

      var zoomMap: () => void = () => {
        // resize image map
        var map: HTMLMapElement = <HTMLMapElement>document.getElementById(value.useMap.substring(1));
        if (map !== null) {
          for (var i: number = 0; i < map.areas.length; i++) {
            var area: HTMLAreaElement = <HTMLAreaElement>map.areas[i];
            var originalArea: HTMLAreaElement = <HTMLAreaElement>zoomData.originalMap.areas[i];
            var coords: string[] = originalArea.coords.split(",");
            for (var j: number = 0; j < coords.length; j++) {
              coords[j] = Math.round(parseInt(coords[j], 10) * zoomData.currentZoom).toString();
            }
            var coordsString: string = "";
            for (var k: number = 0; k < coords.length; k++) {
              if (k > 0) {
                coordsString += ",";
              }
              coordsString += coords[k];
            }
            area.coords = coordsString;
          }
        }
      };

      var zoomXY: (fact: number, xi: number, yi: number) => void = (fact: number, xi: number, yi: number) => {
        if (!zoomData.busy) {
          zoomData.busy = true;
          var new_h: number = (value.height * fact);
          var new_w: number = (value.width * fact);
          zoomData.currentZoom = zoomData.currentZoom * fact;
          $(value).animate({
            left: xi,
            top: yi,
            height: new_h,
            width: new_w
          }, 100, (): void => {
            zoomData.busy = false;
          });
          zoomMap();
        }
      };

      var zoom: (fact: number, mouseX: number, mouseY: number) => void = (fact: number, mouseX: number, mouseY: number) => {
        var xi: number = left();
        var yi: number = top();
        // calculate new X and y based on mouse position
        var parent: HTMLElement = $(value).parent()[0];
        mouseX = mouseX - parent.offsetLeft;
        var newImageX: number = (mouseX - xi) * fact;
        xi = mouseX - newImageX;
        mouseY = mouseY - parent.offsetTop;
        var newImageY: number = (mouseY - yi) * fact;
        yi = mouseY - newImageY;
        zoomXY(fact, xi, yi);
      };

      var zoomCentre: (fact: number) => void = (fact: number) => {
        var parent: HTMLElement = $(value).parent()[0];
        zoom(fact, left() + parent.offsetLeft + (value.width / 2), top() + parent.offsetTop + (value.height / 2));
      };

      var zoomIn: () => void = () => {
        // zoom as if mouse is in centre of image
        zoomCentre(zoomData.x_fact);
      };
      var zoomOut: () => void = () => {
        // zoom as if mouse is in centre of image
        zoomCentre(1 / zoomData.x_fact);
      };

      var zoomMouse: (delta: number) => void = (delta: number) => {
        if (delta < 0) {
          // zoom out ---------------
          zoom(1 / zoomData.x_fact, zoomData.currentX, zoomData.currentY);
        } else if (delta > 0) {
          // zoom in -----------
          zoom(zoomData.x_fact, zoomData.currentX, zoomData.currentY);
        }
      };

      var init: () => void = () => {
        if (value.useMap !== "") {
          var tempOriginalMap: HTMLMapElement = <HTMLMapElement>document.getElementById(value.useMap.substring(1));
          if (tempOriginalMap !== null) {
            zoomData.originalMap = <HTMLMapElement>tempOriginalMap.cloneNode(true);
            for (var i: number = 0; i < zoomData.originalMap.areas.length; i++) {
              (<HTMLAreaElement>zoomData.originalMap.areas[i]).coords = (<HTMLAreaElement>tempOriginalMap.areas[i])
                .coords;
            }
          }
        }
        zoomData.originalHeight = $(value).height();
        zoomData.originalWidth = $(value).width();
        $(value).css("position", "relative").css("left", 0).css("top", 0).css("margin", 0);
        
        if (options != null && options.draggableOptions != null) {
          $(value).draggable(options.draggableOptions);
        } else {
          $(value).draggable();
        }

        if (options != null) {
          if (options.zoom != null) {
            var startLeft: number = 0;
            if (options.left != null) {
              startLeft = options.left;
            }
            var startTop: number = 0;
            if (options.top != null) {
              startTop = options.top;
            }
            zoomXY(options.zoom, startLeft, startTop);
            zoomData.currentZoom = options.zoom;
          }
          if (options.left != null) {
            $(value).css("left", options.left);
          }
          if (options.top != null) {
            $(value).css("top", options.top);
          }
        }
        if (options == null || options.mouseWheel == null || options.mouseWheel === true) {
          var isFireFox: boolean = (navigator.userAgent.indexOf("Firefox") !== -1);
          // jquery mousewheel not working in FireFox for some reason
          if (isFireFox) {
            value.addEventListener("DOMMouseScroll", (e: Event) => {
              e.preventDefault();
              zoomMouse(-(<any>e).detail);
            }, false);
            if (value.useMap !== "") {
              $(value.useMap)[0].addEventListener("DOMMouseScroll", (e: Event) => {
                e.preventDefault();
                zoomMouse(-(<any>e).detail);
              }, false);
            }
          } else {
            $(value).bind("mousewheel", (e: JQueryEventObject) => {
              e.preventDefault();
              zoomMouse((<any>e.originalEvent).wheelDelta);
            });
            if (value.useMap !== "") {
              $(value.useMap).bind("mousewheel", (e: JQueryEventObject) => {
                e.preventDefault();
                zoomMouse((<any>e.originalEvent).wheelDelta);
              });
            }
          }
        }
        $(value).bind("mousemove", (e: JQueryEventObject) => {
          zoomData.currentX = e.pageX;
          zoomData.currentY = e.pageY;
        });
      };

      var reset: () => void = (): void => {
        // reset position
        $(value).css("position", "relative").css("left", 0).css("top", 0).css("margin", 0);
        if (zoomData.originalHeight === 0) {
          $(value).css("height", "");
        } else {
          $(value).css("height", zoomData.originalHeight);
        }
        if (zoomData.originalWidth === 0) {
          $(value).css("width", "");
        } else {
          $(value).css("width", zoomData.originalWidth);
        }
        // reset map
        var map: HTMLMapElement = <HTMLMapElement>document.getElementById(value.useMap.substring(1));
        if (zoomData.originalMap !== null) {
          for (var i: number = 0; i < zoomData.originalMap.areas.length; i++) {
            (<HTMLAreaElement>map.areas[i]).coords = (<HTMLAreaElement>zoomData.originalMap.areas[i]).coords;
          }
        }
        zoomData.currentZoom = 1;
        zoomData.currentX = 0;
        zoomData.currentY = 0;
      };
      var method: string = "";
      if (options != null && options.method != null) {
        method = options.method;
      }
      switch (method) {
      case "zoomIn":
        zoomIn();
        break;
      case "zoomOut":
        zoomOut();
        break;
      case "reset":
        reset();
        break;
      default:
        init();
        break;
      }
    });
  };
})(jQuery);
