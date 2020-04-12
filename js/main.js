/*
Recommend keyboard shortcuts for navigation for now

*/
require([
    "esri/views/SceneView",
    'esri/WebScene',
    "esri/core/watchUtils",
    "esri/portal/PortalItem",
    "esri/widgets/Home",
    "./js/modules/ui.js"

], function(SceneView, WebScene, watchUtils, PortalItem, Home, ui) {
    /*
        In summary, all I'm doing here is using the "clip" to cut a webscene up. Then applying a css blur to the scene to filter it.

        This is purely a proof of concept application for doing tilt sift.
    */


    ui.disableLoadButton();

    // default values
    var near = 400; // distance of near clip
    var far = 1000; // distance of far clip

    // main webscene
    var scene = new WebScene({
        portalItem: {
            id: "7328c006ef8d4f5fb1477d3c8cb9b1ec"
        }
    });


    var view, front, back, backStaggered

    front = createSceneView("frontDiv", "medium");


    front.when(function() {
        view = createSceneView("mainFocusedDiv", "high");
        view.when(function() {
            back = createSceneView("viewDivb", "low");
            back.when(function() {
                backStaggered = createSceneView("viewDivc", "medium");
                backStaggered.when(function() {
                    loaded()
                })
            })
        })
    });

    /*
        I need to pass:
            The default range calculation for now
            The depth of field based on N
                E.g. is max depth is 10
                    Then, mid range is 5... do this in a loop later.
            z-index
            programmatically create divs and append styles - tbc
            
    */

    function createSceneView(DivContainer, qualityProfile) {
        $('body').append('<div id=' + DivContainer + '></div>');

        return new SceneView({
            container: DivContainer,
            map: scene,
            qualityProfile: qualityProfile,
            alphaCompositingEnabled: true,
            environment: {
                background: {
                    type: "color",
                    color: [0, 0, 0, 0]
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
    };

    function loaded() {
        // set the blur and clip
        updateBlur();
        updateDOF(near, far);

        // remove ui elements (we dont need them...)
        backStaggered.ui.components = [];
        back.ui.components = [];
        view.ui.components = [];
        front.ui.components = [];

        var homeBtn = new Home({
            view: view
        });

        // Add the home button to the top left corner of the view
        // blank.ui.add(homeBtn, "top-left");

        // sync the views (this is taken from the sync views sample in js api)
        var synchronizeView = function(view, others) {
            others = Array.isArray(others) ? others : [others];

            var viewpointWatchHandle;
            var viewStationaryHandle;
            var otherInteractHandlers;
            var scheduleId;
            var clear = function() {
                if (otherInteractHandlers) {
                    otherInteractHandlers.forEach(function(handle) {
                        handle.remove();
                    });
                }
                viewpointWatchHandle && viewpointWatchHandle.remove();
                viewStationaryHandle && viewStationaryHandle.remove();
                scheduleId && clearTimeout(scheduleId);
                otherInteractHandlers = viewpointWatchHandle = viewStationaryHandle = scheduleId = null;
            };

            var interactWatcher = view.watch("interacting,animation", function(
                newValue
            ) {
                if (!newValue) {
                    return;
                }
                if (viewpointWatchHandle || scheduleId) {
                    return;
                }

                // start updating the other views at the next frame
                scheduleId = setTimeout(function() {
                    scheduleId = null;
                    viewpointWatchHandle = view.watch("viewpoint", function(
                        newValue
                    ) {
                        others.forEach(function(otherView) {
                            otherView.viewpoint = newValue;
                        });
                    });
                }, 0);

                // stop as soon as another view starts interacting, like if the user starts panning
                otherInteractHandlers = others.map(function(otherView) {
                    return watchUtils.watch(
                        otherView,
                        "interacting,animation",
                        function(value) {
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
                remove: function() {
                    this.remove = function() {};
                    clear();
                    interactWatcher.remove();
                }
            };
        };

        var synchronizeViews = function(views) {
            var handles = views.map(function(view, idx, views) {
                var others = views.concat();
                others.splice(idx, 1);
                return synchronizeView(view, others);
            });

            return {
                remove: function() {
                    this.remove = function() {};
                    handles.forEach(function(h) {
                        h.remove();
                    });
                    handles = null;
                }
            };
        };

        // bind the views
        synchronizeViews([view, back, backStaggered, front]);

        // creating slider
        $(function() {
            $("#sliderDiv").slider({
                range: true,
                min: 11,
                max: 3000,
                values: [400, 1000],
                slide: function(event, ui) {
                    console.log("sliding")
                    updateDOF(ui.values[0], ui.values[1])
                    $("#amount").val(ui.values[0] + " - " + ui.values[1]);
                }
            });
        });

        $('#fov-slider').hide();
        $('#focus-slider-menu').hide();

        $('#fov-select').hover(function() {
            $('#fov-slider').show();
        }, function() {
            $('#fov-slider').hide();
        });

        $('#focus').hover(function() {
            $('#focus-slider-menu').show();
        }, function() {
            $('#focus-slider-menu').hide();
        });


        // Add event listeners
        document.getElementById("blur").addEventListener("change", updateBlur);
        document.getElementById("fov").addEventListener("change", fovUpdate);
        document.getElementById("load").addEventListener("click", openModal);
        document.getElementById("close-webmap-modal").addEventListener("click", closeModal);
        document.getElementById("load-webmap").addEventListener("click", loadWebmapid);


        $("#webmapid").on("change paste keyup", function() {
            const text = $(this).val()
            if (text.length === 32) {
                ui.enableLoadButton();
            } else {
                ui.disableLoadButton();
            }
        });


        // functions for listeners

        function openModal() {
            document.getElementById("loadWebmap").style.display = "block";
        };

        function loadWebmapid() {
            var id = document.getElementById("webmapid").value

            var item = new PortalItem({
                id: id
            });

            item.load().then(function() {
                if (item.type === "Web Scene") {
                    ui.successLoadButton()

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
                } else {
                    ui.errorLoadButton()
                };

            })
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
        };
    }
});