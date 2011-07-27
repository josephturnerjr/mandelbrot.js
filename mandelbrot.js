var cvs, cxt;
var w, h;
var XMAX = 1.0, XMIN = -2.5;
var YMAX = 1.0, YMIN = -1.0;
var MAX_ITERS = 256;
var cvs_id;
var select_start = null;

// Sets a given pixel (x,y) in the ImageData object to the color (r,g,b,a)
function set_pixel(id, x, y, r, g, b, a){
    id.data[4*(x + y*w)] = r;
    id.data[4*(x + y*w) + 1] = g;
    id.data[4*(x + y*w) + 2] = b;
    id.data[4*(x + y*w) + 3] = a;
}

// conversion from ImageData coordinates to real (well, imaginary) coordinates
function img_y_to_real(y){
    return YMAX - ((YMAX - YMIN) * y) / h;
}
function img_x_to_real(x){
    return XMIN + ((XMAX - XMIN) * x) / w;
}
// Draws the mandelbrot set using the escape time algorithm
function draw_set(max_iters){
    var id = cvs_id;
    var i, j;
    // Iterate through each of the pixels
    for(i = 0; i < h; i++){
        for(j = 0; j < w; j++){
            // I should probably determine the coord of the center of the pixel, but who's counting
            var x0 = img_x_to_real(j),
                y0 = img_y_to_real(i);
            var x = 0, y = 0;
            // The escape time algorithm calculates a fixed number of iterations and decides
            //  set inclusion based on whether a point stays within the exit radius within
            //  the span of those iterations
            var iteration = 0;
            // The 'you've gone too far' disk is the circle of radius 2 centered at the origin
            //  An excape then is if the imaginary point is further than 2 units from the origin
            //  Quick bit of pythagoras answers the question for us
            while(x*x + y*y <= 4.0 && iteration < max_iters){
                // This code iterates the z_{n} = z_{n-1}^2 + c function
                var xt = x*x - y*y + x0;
                y = 2*x*y + y0;
                x = xt;
                iteration++;
            }
            if(iteration == max_iters){
                // If we finished without escaping, we're in the set, color it black
                set_pixel(id, j, i, 0, 0, 0, 255);
            }else{
                // otherwise, choose a color based on how many iterations we did
                var color = Math.floor(0xffffff * iteration / max_iters);
                //set_pixel(id, j, i, (color & 0xff), (color & 0xff00) >> 8, (color & 0xff0000) >> 16, 255);
                set_pixel(id, j, i, 0, 0, 0, (0xffffff * iteration / max_iters) % 0xff);
            }
        }
    }
    // finally, put the computed data into the canvas and update the informational window
    draw();
}

function draw(){
    cxt.putImageData(cvs_id, 0, 0);
    $("#update_div").html("<h3>Parameters</h3>");
    $("#update_div").append("<p>" + XMIN.toFixed(2) + " <= X <= " + XMAX.toFixed(2) + "</p>");
    $("#update_div").append("<p>" + YMIN.toFixed(2) + " <= Y <= " + YMAX.toFixed(2) + "</p><br />");
    $("#update_div").append("<p>" + MAX_ITERS + " iterations</p>");
}
function handle_drag(e){
}
$(document).ready(function(){
                    cvs = document.getElementById("background");
                    cxt = cvs.getContext('2d');
                    w = cvs.width;
                    h = cvs.height;
                    // create the ImageData object
                    // Note that the calculations are done in-place with no intermediates held
                    cvs_id = cxt.createImageData(cvs.width, cvs.height);
                    $(cvs).mousedown(function(e){
                                        if(e.which == 1){
                                            select_start = e;
                                        }
                                     }).mouseup(function(e){
                                                    if(select_start != null){
                                                        var pos = $(this).offset();
                                                        select_start.pageX -= pos.left;
                                                        select_start.pageY -= pos.top;
                                                        e.pageX -= pos.left;
                                                        e.pageY -= pos.top;
                                                        var x_lr = e.pageX < select_start.pageX ? 
                                                                        [e.pageX, select_start.pageX] : 
                                                                        [select_start.pageX, e.pageX];
                                                        var y_lr = e.pageY < select_start.pageY ? 
                                                                        [e.pageY, select_start.pageY] : 
                                                                        [select_start.pageY, e.pageY];
                                                        select_start = null;
                                                        var neww = x_lr[1] - x_lr[0];
                                                        var newh = y_lr[1] - y_lr[0];
                                                        if(neww < 2 || newh < 2)
                                                            return;
                                                        var ratio = newh / neww;
                                                        var c_h = Math.floor(ratio * cvs.width);
                                                        var xmin = img_x_to_real(x_lr[0]);
                                                        var xmax = img_x_to_real(x_lr[1]);
                                                        var ymax = img_y_to_real(y_lr[0]);
                                                        var ymin = img_y_to_real(y_lr[1]);
                                                        XMIN = xmin;
                                                        XMAX = xmax;
                                                        YMIN = ymin;
                                                        YMAX = ymax;
                                                        cvs.height = c_h;
                                                        h = c_h;
                                                        cvs_id = cxt.createImageData(cvs.width, cvs.height);
                                                        draw_set(MAX_ITERS);
                                                    }
                                                }).mousemove(function(e){
                                                                if(select_start != null){
                                                                    var pos = $(this).offset();
                                                                    cvs.width = cvs.width;
                                                                    draw();
                                                                    cxt.lineWidth = 3.0;
                                                                    cxt.strokeStyle = '#FFFF00';
                                                                    cxt.strokeRect(select_start.pageX - pos.left, 
                                                                                   select_start.pageY - pos.top, 
                                                                                   e.pageX - select_start.pageX, 
                                                                                   e.pageY - select_start.pageY);
                                                                }
                                                             });
                    draw_set(MAX_ITERS);
                });
