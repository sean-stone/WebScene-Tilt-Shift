require([
    "esri/views/SceneView",
    'esri/WebScene',
    "esri/core/watchUtils",
    "esri/widgets/Home"
], function (SceneView, WebScene, watchUtils, Home) {
    /*
        In summary, all I'm doing here is using the "clip" to cut a webscene up. Then applying a css blur to the scene to filter it.

        This is purely a proof of concept application for doing tilt sift.
    */

    // default values
    var near = 400; // distance of near clip
    var far = 1000; // distance of far clip

    // main webscene
    var scene = new WebScene({
        portalItem: {
            id: "8ede93ea9d8d48bc8cdcbea775936a13"
        }
    });

    // Creating views.
    // Look at this in the future -> it's currently opacity: 0 and purely here for the attribution and ui elements. 
    var blank = new SceneView({
        container: "blankDiv",
        map: scene,
        qualityProfile: "low",
        environment: {
            starsEnabled: false,
            atmosphereEnabled: false,
            lighting: {
                cameraTrackingEnabled: false,
                directShadowsEnabled: false,
            }
        },
        constraints: {
            snapToZoom: false
        }
    });

    // closest view (also blurred)
    var front = new SceneView({
        container: "frontDiv",
        map: scene,
        qualityProfile: "medium",
        alphaCompositingEnabled: true,
        environment: {
            background: {
                type: "color",
                color: [255, 252, 244, 0]
            },
            starsEnabled: false,
            atmosphereEnabled: false,
            lighting: {
                cameraTrackingEnabled: true,
                directShadowsEnabled: true,
            }
        },
        constraints: {
            snapToZoom: false,
            clipDistance: {
                near: 1,
                mode: "manual",
                far: 800
            }
        }
    });

    // second view, also the one that's not blured. 
    var view = new SceneView({
        container: "mainFocusedDiv",
        map: scene,
        qualityProfile: "high",
        alphaCompositingEnabled: true,
        environment: {
            background: {
                type: "color",
                color: [255, 252, 244, 0]
            },
            starsEnabled: false,
            atmosphereEnabled: false,
            lighting: {
                cameraTrackingEnabled: true,
                directShadowsEnabled: true,
                ambientOcclusionEnabled: true
            }
        },
        constraints: {
            clipDistance: {
                near: 100,
                mode: "manual",
                far: 800
            }
        }
    });

    // blured backdrop (low quality)
    var back = new SceneView({
        container: "viewDivb",
        qualityProfile: "low",
        map: scene,
        environment: {
            background: {
                type: "color",
                color: [255, 252, 244, 0]
            },
            starsEnabled: false,
            atmosphereEnabled: true,
            lighting: {
                cameraTrackingEnabled: true,
                directShadowsEnabled: true,
            }
        },
        constraints: {
            clipDistance: {
                near: 800,
                mode: "manual"
            },
            snapToZoom: false
        }
    });


    // Slight staggered blur 
    var backStaggered = new SceneView({
        container: "viewDivc",
        map: scene,
        qualityProfile: "low",
        alphaCompositingEnabled: true,
        environment: {
            background: {
                type: "color",
                color: [255, 252, 244, 0]
            },
            starsEnabled: false,
            atmosphereEnabled: false,
            lighting: {
                cameraTrackingEnabled: true,
                directShadowsEnabled: true,
            }
        },
        constraints: {
            snapToZoom: false,
            clipDistance: {
                near: 800,
                mode: "manual",
                far: 1000
            }
        }
    });

    // remove ui elements (we dont need them...)
    backStaggered.ui.components = [];
    back.ui.components = [];
    view.ui.components = [];
    front.ui.components = [];

    var homeBtn = new Home({
        view: view
    });

    // Add the home button to the top left corner of the view
    blank.ui.add(homeBtn, "top-left");

    // sync the views (this is taken from the sync views sample in js api)
    var synchronizeView = function (view, others) {
        others = Array.isArray(others) ? others : [others];

        var viewpointWatchHandle;
        var viewStationaryHandle;
        var otherInteractHandlers;
        var scheduleId;
        var clear = function () {
            if (otherInteractHandlers) {
                otherInteractHandlers.forEach(function (handle) {
                    handle.remove();
                });
            }
            viewpointWatchHandle && viewpointWatchHandle.remove();
            viewStationaryHandle && viewStationaryHandle.remove();
            scheduleId && clearTimeout(scheduleId);
            otherInteractHandlers = viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
        };

        var interactWatcher = view.watch("interacting,animation", function (
            newValue
        ) {
            if (!newValue) {
                return;
            }
            if (viewpointWatchHandle || scheduleId) {
                return;
            }

            // start updating the other views at the next frame
            scheduleId = setTimeout(function () {
                scheduleId = null;
                viewpointWatchHandle = view.watch("viewpoint", function (
                    newValue
                ) {
                    others.forEach(function (otherView) {
                        otherView.viewpoint = newValue;
                    });
                });
            }, 0);

            // stop as soon as another view starts interacting, like if the user starts panning
            otherInteractHandlers = others.map(function (otherView) {
                return watchUtils.watch(
                    otherView,
                    "interacting,animation",
                    function (value) {
                        if (value) {
                            clear();
                        }
                    }
                );
            });

            // or stop when the view is stationary again
            viewStationaryHandle = watchUtils.whenTrue(
                view,
                "stationary",
                clear
            );
        });

        return {
            remove: function () {
                this.remove = function () {};
                clear();
                interactWatcher.remove();
            }
        };
    };

    var synchronizeViews = function (views) {
        var handles = views.map(function (view, idx, views) {
            var others = views.concat();
            others.splice(idx, 1);
            return synchronizeView(view, others);
        });

        return {
            remove: function () {
                this.remove = function () {};
                handles.forEach(function (h) {
                    h.remove();
                });
                handles = null;
            }
        };
    };

    // bind the views
    synchronizeViews([blank, view, back, backStaggered, front]);

    // creating slider
    $(function () {
        $("#sliderDiv").slider({
            range: true,
            min: 11,
            max: 3000,
            values: [400, 1000],
            slide: function (event, ui) {
                console.log("sliding")
                updateDOF(ui.values[0], ui.values[1])
                $("#amount").val(ui.values[0] + " - " + ui.values[1]);
            }
        });
    });

    $('#fov-slider').hide();
    $('#focus-slider-menu').hide();

    $('#fov-select').hover(function () {
        $('#fov-slider').show();
    }, function () {
        $('#fov-slider').hide();
    });

    $('#focus').hover(function () {
        $('#focus-slider-menu').show();
    }, function () {
        $('#focus-slider-menu').hide();
    });


    // set the blur and clip
    updateBlur();
    updateDOF(near, far);

    // Add event listeners
    document.getElementById("blur").addEventListener("change", updateBlur);
    document.getElementById("fov").addEventListener("change", fovUpdate);
    document.getElementById("load").addEventListener("click", openModal);
    document.getElementById("close-webmap-modal").addEventListener("click", closeModal);
    document.getElementById("load-webmap").addEventListener("click", loadWebmapid);

    // functions for listeners

    function openModal() {
        document.getElementById("loadWebmap").style.display = "block";
    };

    function loadWebmapid() {
        var id = document.getElementById("webmapid").value

        scene = new WebScene({
            portalItem: {
                id: id
            }
        });

        // repoint scene to views
        front.map = scene;
        view.map = scene;
        back.map = scene;
        backStaggered.map = scene;
        blank.map = scene;
    };

    function closeModal() {
        document.getElementById("loadWebmap").style.display = "none"
    };

    function updateDOF(min, max) {
        front.constraints.clipDistance.far = min;

        back.constraints.clipDistance.near = (max + max / 2);
        back.constraints.clipDistance.far = (max * 20);

        backStaggered.constraints.clipDistance.near = max;
        backStaggered.constraints.clipDistance.far = (max + max / 2) + 50;


        view.constraints.clipDistance.near = (min) - 10;
        view.constraints.clipDistance.far = (max) + 10;

        blank.constraints.clipDistance.near = (min) - 10;
        blank.constraints.clipDistance.far = (max) + 10;
    };

    function updateBlur() {
        var a = document.getElementById("viewDivb");
        var b = document.getElementById("frontDiv");
        var c = document.getElementById("viewDivc");


        a.style.filter = "blur(" + document.getElementById("blur").value + "px)";
        b.style.filter = "blur(" + (document.getElementById("blur").value) / 2 + "px)";
        c.style.filter = "blur(" + (document.getElementById("blur").value) / 2 + "px)";

    };

    function fovUpdate() {
        var newCam = back.camera.clone();
        newCam.fov = document.getElementById("fov").value;

        front.camera = newCam;
        view.camera = newCam;
        back.camera = newCam;
        backStaggered.camera = newCam;
        blank.camera = newCam;
    };
});