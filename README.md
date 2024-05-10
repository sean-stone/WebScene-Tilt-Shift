Deprecating this branch now as it's core JS API 4.29
https://developers.arcgis.com/javascript/latest/sample-code/custom-render-node-dof/

# WebScene-Tilt-Shift
Prototype app of adding tilt shift (depth of field) to webscenes.

Access the application [here](https://appsstage.esriuk.com/app/tiltshift/1/wmt/view/706012bcac8142dd9c8b56c2e66de411/index.html).

How this application works (in summary):

| z-index           | [CSS   Blurred](https://urldefense.proofpoint.com/v2/url?u=https-3A__developer.mozilla.org_en-2DUS_docs_Web_CSS_filter-2Dfunction_blur&d=DwMFAw&c=n6-cguzQvX_tUIrZOS_4Og&r=uGvVWFM6ogj2CnnHac3n5Q&m=GPO6JStcYnysaBvlljt7xvWqteg9tlCdFCUvJ7TcVMQ&s=59lpS2tiHzvT8fZnZ61njn3GpVJoeqWKAf1SYAgitK4&e=) | [Webscene   clipDistane](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-SceneView.html#constraints) | [qualityProfile](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-SceneView.html#qualityProfile) |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 10 (bottom layer) | 4px                                                          | 80m-200m                                                     | Low                                                          |
| 100               | 2px                                                          | 40m-80m                                                      | Medium                                                       |
| 1000              | Focused/main                                                 | 10m-40m                                                      | High                                                         |
| 10000 (top layer) | 2px                                                          | 0-10m                                                        | Medium                                                       |

But, a rather last minute addition is adding another "blank" WebScene above everything else.

The reason I've done this is to firstly add attribution to the map (it's a esri license thing). Secondly I was having some issues with rotating around 3D buildings at a small scale. This fixes that issue, but also causes the webscene to not perform as well as I'd have hoped.

If you'd like to find more information about how this is made, please view the medium blog on it *here*.
