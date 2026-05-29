[![DOI](https://zenodo.org/badge/1208547040.svg)](https://doi.org/10.5281/zenodo.19537951)
## FGMLab - Fisher's Geometric Model Simulator
This repository contains the code behind FGMLab. The actual application can be accessed at [https://gabe-dubose.github.io/FGMLab/](https://gabe-dubose.github.io/FGMLab/).

## Overview
```FGMLab``` provides an interface for student's to run evolutionary simulations using Fisher's geometric model. Instead of focusing on population genetics, Fisher's geometric model describes how <i>traits</i> evolve over time. This interface provides student's with direct and animated visualizations of fitness landscapes, how the population evolves on said landscape across generations, how the distribution of traits changes over time, and the overall evolutionary trajectory. Students can specify each parameter in the model, allowing for in-depth exploration of the process of biological evolution. This application can also be used to create activities to reinformce important concepts in evolution, such as the relationship between population size and the effect of drift, different outcomes of selection, and how the initial variation in a population impacts the rate of adaptation. 

## Dependencies 
FGMLab uses the following third-party libraries:

```Plotly.js v. 2.27.0```: included as a local file (plotly-2.27.0.min.js) to ensure offline functionality after first load. The original distribution can be found at https://cdn.plot.ly/plotly-2.27.0.min.js.

```Pyodide v. 0.25.0```: loaded from CDN on first visit (https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js). Pyodide is not bundled locally due to its size, but is cached by the browser after the first load.

```98.css```: included for aesthetics. Original source can be found at https://unpkg.com/98.css.

## Community guidelines and suggesting changes
Questions, whether about the software, model, or other kinds of support, can be addressed to Gabe DuBose and sent to ```james.g.dubose [at] gmail.com```. Issues and reports of bugs can be raised as issues in this repository or sent to the afrementioned email address. The author (Gabe DuBose) is also happy to provide additional guidance on how to use this application and/or design activities for students. 
