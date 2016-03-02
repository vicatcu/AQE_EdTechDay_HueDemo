angular.module('hue-eggs', [ ])
    .controller('EggsController', [ '$http', function($http){
        var mv = this;
        mv.x_cmin = 0.13791673; // x at the minimum concentration
        mv.x_cmax = 0.70235455; // x at the maximum concentration
        mv.y_cmin = 0.06569707; // y at the minimum concentration
        mv.y_cmax = 0.2579223;  // y at the maximum concentration
        mv.concentration_min = 0;
        mv.concentration_max = 40;
        mv.brightness = 0.5; // 0 .. 1
        mv.x_span = mv.x_cmax - mv.x_cmin; // negative if concentration is inverse with x
        mv.y_span = mv.y_cmax - mv.y_cmin; // negative if concentration is inverse with y
        mv.concentration_span = mv.concentration_max - mv.concentration_min; // always positive
        mv.xy_slope = mv.y_span / mv.x_span;
        mv.last_updated = "not yet";

        // get the config from the server on startup
        $http.get("/config").success(function(data){
            mv.config = data;
        });

        // this function sets the background color of the block
        mv.getStyle = function(key){
            if(mv.config[key]){
                return {
                  "background-color": mv.config[key].color
                };
            }
            else{
                return {};
            }
        };

        function concentrationToColor(concentration){
            var constrained_concentration = parseFloat(concentration);
            constrained_concentration = Math.max(constrained_concentration, mv.concentration_min);
            constrained_concentration = Math.min(constrained_concentration, mv.concentration_max);

            var concentration_proportion_of_span = (constrained_concentration - mv.concentration_min) / mv.concentration_span;
            // if x_cmin > x_cmax then x_span < 0
            var interpolated_cie_x = mv.x_cmin + (concentration_proportion_of_span * mv.x_span);

            // if y_cmin > y_cmax then y_span < 0
            var interpolated_cie_y = mv.y_cmin + (concentration_proportion_of_span * mv.y_span);

            var interpolated_cie_z = 1 - interpolated_cie_x - interpolated_cie_y;

            // convert from xyY to XYZ
            var colorX = mv.brightness / interpolated_cie_y * interpolated_cie_x;
            var colorY = mv.brightness;
            var colorZ = mv.brightness / interpolated_cie_y * interpolated_cie_z;

            // convert from XYZ to sRGB
            // [R]   [ 3.2406   -1.5372   -0.4986]   [X]
            // [G] = [-0.9689    1.8758    0.0415] * [Y]
            // [B]   [ 0.0557   -0.2040    1.0570]   [Z]
            var colorLinearR =  3.2406 * colorX - 1.5372 * colorY - 0.4986 * colorZ;
            var colorLinearG = -0.9689 * colorX + 1.8758 * colorY + 0.0415 * colorZ;
            var colorLinearB =  0.0557 * colorX - 0.2040 * colorY + 1.0570 * colorZ;

            // force it into the range of 0 - 1
            colorLinearR = Math.min(Math.max(colorLinearR, 0), 1);
            colorLinearG = Math.min(Math.max(colorLinearG, 0), 1);
            colorLinearB = Math.min(Math.max(colorLinearB, 0), 1);

            // gamma correct
            var alpha = 0.055;
            colorR = colorLinearR <= 0.0031308 ? 12.92 * colorLinearR : (1 + alpha) * Math.pow(colorLinearR, 1/2.4) - alpha;
            colorG = colorLinearG <= 0.0031308 ? 12.92 * colorLinearG : (1 + alpha) * Math.pow(colorLinearG, 1/2.4) - alpha;
            colorB = colorLinearB <= 0.0031308 ? 12.92 * colorLinearB : (1 + alpha) * Math.pow(colorLinearB, 1/2.4) - alpha;

            try {
                var hexcolor = $.colorspaces.make_color('sRGB', [colorR, colorG, colorB]).as('hex');
                return {
                    hex: hexcolor,
                    cie_x: interpolated_cie_x,
                    cie_y: interpolated_cie_y,
                    cie_Y: mv.brightness
                };
            }
            catch(e){
                console.log(e);
            }
            return("#FFFFFF");

        }

        var updateEggData = function(serialNumber){
            $http.get("/recentstats/" + serialNumber).success(function(data){
                if(data["converted-value"] && data["converted-value"].avg){
                    var concentration = data["converted-value"].avg.toFixed(1);
                    mv.config[serialNumber].concentration = concentration;

                    // convert concentration to color
                    var color = concentrationToColor(concentration);
                    mv.config[serialNumber].color = color.hex;
                    mv.config[serialNumber].cie_x = color.cie_x;
                    mv.config[serialNumber].cie_y = color.cie_y;
                    mv.config[serialNumber].cie_Y = color.cie_Y;

                    console.log(mv.config[serialNumber].alias
                        + " => " + mv.config[serialNumber].concentration
                        + " => " + mv.config[serialNumber].color);
                }
            });
        };

        var updateAllEggData = function(){
            Object.keys(mv.config).forEach(updateEggData);
            mv.last_updated = moment().format("dddd, MMMM Do YYYY, h:mm:ss a");
            updateLights();
        };

        /* functions for manipulating a particular light */
        mv.setXYColorBrightness = function(light_id, x, y, Y){
            $http.post('/lights/' + light_id + '/xybri', {
                    x: x,
                    y: y,
                    brightness: Y }
            ).success(function(data){
                    console.log(data);
                }).error(function(err){
                    console.log(err);
                });
        };

        mv.setOn = function(light_id){
            $http.post('/lights/' + light_id + '/on', null).success(function(data){
                console.log(data);
            }).error(function(err){
                console.log(err);
            });
        };

        mv.setOff = function(light_id){
            $http.post('/lights/' + light_id + '/off', null).success(function(data){
                console.log(data);
            }).error(function(err){
                console.log(err);
            });
        };

        mv.setLightName = function(light_id, light_name){
            $http.post('/lights/' + light_id + '/name', {
                name: light_name
            }).success(function(data){
                console.log(data);
                discoverLights();
            }).error(function(err){
                console.log(err);
            });
        };

        function discoverLights(){
            $http.get("/lights").success(function(data){
                mv.lights = data;
                updateLights();
            }).error(function(err){
                console.log(err);
            });
        };

        var updateLights = function(){
            mv.lights.forEach(function(light){
                var name = light.name;
                // search for an egg whose alias matches this name
                Object.keys(mv.config).forEach(function(serialNumber){
                    if(name == mv.config[serialNumber].alias){
                        mv.setXYColorBrightness(
                            light.id,
                            mv.config[serialNumber].cie_x,
                            mv.config[serialNumber].cie_y,
                            mv.config[serialNumber].cie_Y
                        );
                    }
                });
            });
        };

        /* periodic tasks */

        setTimeout(updateAllEggData, 1000);
        setInterval(updateAllEggData, 5 * 60000); // every five minutes go get the stats data

        setTimeout(discoverLights, 3000);
        setInterval(discoverLights, 15000); // every 15 seconds go check on the lights
    }]);