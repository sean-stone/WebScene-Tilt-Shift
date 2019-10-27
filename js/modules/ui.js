define([

    ],
    function () {

        //define buttons
        const loadButton = document.getElementById("load-webmap");
        const webmapIdInput = document.getElementById("webmapid");


        // load button ui 
        function enableLoadButton() {
            if (loadButton.classList.contains('btn-disabled')) {
                loadButton.classList.remove("btn-disabled");
            };
        };

        function disableLoadButton() {
            if (!loadButton.classList.contains('btn-disabled')) {
                loadButton.classList.add("btn-disabled");
            };
        };

        function errorLoadButton() {
            if (!webmapIdInput.classList.contains("input-error")) {
                webmapIdInput.classList.add("input-error");
            };

            if (webmapIdInput.classList.contains("input-success")) {
                webmapIdInput.classList.remove("input-success");
            };
        };

        function successLoadButton() {
            if (webmapIdInput.classList.contains("input-error")) {
                webmapIdInput.classList.remove("input-error");
            };

            if (!webmapIdInput.classList.contains("input-success")) {
                webmapIdInput.classList.add("input-success");
            };
        };

        function loadedWebmap(){
            // show title? maybe show short description here....

        }

        function clearLoadButton() {
            if (webmapIdInput.classList.contains("input-error")) {
                webmapIdInput.classList.remove("input-error");
            };

            if (webmapIdInput.classList.contains("input-success")) {
                webmapIdInput.classList.remove("input-success");
            };
        };

        //Stuff to make public
        return {
            enableLoadButton: enableLoadButton,
            disableLoadButton: disableLoadButton,
            errorLoadButton: errorLoadButton,
            successLoadButton: successLoadButton,
            clearLoadButton: clearLoadButton,
            loadedWebmap: loadedWebmap
        };

    })