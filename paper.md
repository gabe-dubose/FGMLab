---
title: "FGMLab: An open-source software for teaching biological evolution through Fisher's geometric model"
tags:
  - Evolutionary biology education
  - Fisher's geometric model
  - Individual-based simulation
authors:
  - name: James G. DuBose
    orcid: 0000-0002-0488-4734
    affiliation: 1
affiliations:
 - name: Department of Biology, Emory University, Atlanta, GA, USA
   index: 1
date: 12 April 2026
bibliography: paper.bib

# Summary

The process of biological evolution is typically taught through the lens of population genetics, where students are presented with models and diagrams of how alleles (genetic variants) change in frequency over time. While this convention depicts the underlying genetic basis of biological evolution, it fails to quantitatively illustrate how traits, on which natural selection actually acts, evolve. To help teach the process of biological evolution to students, here I present FGMLab, an open-source studio application that employs Fisher's geometric model [Fisher:1930] to illustrate evolutionary process from a trait-based perspective. 

FGMLab provides students a graphical and interactive interface for running individual-based simulations under Fisher's geometric model. This includes both the standard model as well as an extended model that includes the immigration of individuals from a different sub-population, thus allowing for the illustration of the four fundamental evolutionary processes: mutation, drift, selection, and gene flow. It also provides a comprehensive set of analytics that illustrate the evolutionary behavior of the simulated population under the set parameters. These include a graphical representation of the fitness landscape, an animation of individuals moving across the fitness landscape in successive generations, an animation of how the population trait distribution changes over time, and the population mean trait trajectory over time. Students may also specify 1-dimensional and 2-dimensional phenotypes and fitness landscapes, and an interactive visualization of said fitness landscape is provided to show students the impact of changing the strength of selection. Since the individual-based simulation of Fisher's geometric model is a stochastic process, students may also select to run replicate simulations to visualize general dynamics, as well as specify a random seed for reproducibility. 


# Statement of need

A comprehensive understanding of biological evolution is usually difficult for students because 1) the different processes that drive evolution are often taught individually, and 2) teaching is often centered around population genetic models that obscure the actual substrate of evolutionary change: phenotypic variation. FGMLab addresses this by providing a trait-based framework for demonstrating the process of biological evolution to students. While there are existing tools for implementing similar frameworks, they either are not explicitly grounded in general evolutionary theory [Niroshan:2025] or require extensive command line experience to operate [Rocabert:2020]. Therefore, FGMLab provides a platform to engage with the standard form of Fisher's geometric model, thus facilitating general education in the process of biological evolution.

In addition to application practicality, familiarity with Fisher's geometric model would lay the foundation for students to engage with more complex topics in the future. FGMLab provides the standard form  of Fisher's geometric model, but extended forms have been used to study a number of evolutionary topics, including adaptation in a variable environment [Matuszewski:2014], speciation and the evolution of reproductive incompatibility [Simon:2018], the evolutionary dynamics of sexual dimorphism [Connallon:2014], the evolutionary dynamics of phenotypic plasticity [Wang:2026], the evolutionary dynamics of developmental program diversification [DuBose:2026], and even social evolution [Orr:2021]. While these studies typically represent more complex forms or implications of Fisher's geometric model, the sheer scope of these topics illustrates how a foundational understanding of the standard form of Fisher's geometric model can help prepare students to engage with complex topics in primary literature. 

# Accessibility and usage

FGMLab is hosted as a static web page at [https://gabe-dubose.github.io/FGMLab/](https://gabe-dubose.github.io/FGMLab/), and the source code is publicly available at [https://github.com/gabe-dubose/FGMLab](https://github.com/gabe-dubose/FGMLab). Within the application, students can manipulate a variety of parameters, which are described in Table 1. Documentation of these parameters are also provided in the *Information* tab within FGMLab, allowing students to access this information without needing to locate this resource. FGMLab also utilizes the *viridis* color palette for visualizations, which is designed to be perceptually uniform and to support interpretation by individuals with different forms of color vision deficiency.

: Model parameters that can be manipulated in FGMLab.
| Parameter | Description |
|----------|-------------|
| **Dimensions** | The number of traits under consideration (1D or 2D). |
| **Initial trait mean ($\bar{z}_0$)** | The population mean trait value at the start of simulations. This description also applies to Initial trait 1 mean ($\bar{z}_{0,1}$) and Initial trait 2 mean ($\bar{z}_{0,2}$) in the 2D model. |
| **Optimum ($z_{\mathrm{opt}}$)** | The trait value that grants the highest fitness. This description also applies to Optimum trait 1 and Optimum trait 2 in the 2D model. |
| **Initial trait st. dev. ($\sigma_0$)** | The population standard deviation in trait values at the start of the simulation. Increasing this value corresponds to greater initial variation. For simplicity, the same initial standard deviation is set for both traits in the 2D model. |
| **Fitness peak width ($\sigma_s$)** | Corresponds to the strength of selection. Larger values mean a wider fitness peak and therefore weaker selection. Smaller values mean a narrower fitness peak and therefore stronger selection. |
| **Mutational effect ($\sigma_m$)** | The standard deviation in the distribution from which trait mutations are drawn. Increasing this value corresponds to greater mutational effects. |
| **Population size ($N$)** | The number of individuals in the population. |
| **Replicates** | The number of replicate simulations to conduct. |
| **Random seed** | The random seed can be any integer (42 is common). Setting a random seed allows for simulation results to be reproducible. |
| **Migration model parameters** |  |
| **Migration rate [0,1] ($m$)** | The fraction of the focal population replaced by immigrants each generation. |
| **Immigrant population trait mean** | The population mean trait value of the population that is immigrating into the focal population. This description also applies to Immigrant pop. trait 1 mean and Immigrant pop. trait 2 mean in the 2D model. |
| **Immigrant trait st. dev. ($\sigma_i$)** | The population standard deviation in trait values in the population that is immigrating into the focal population. For simplicity, the same standard deviation is set for both traits in the 2D model. |

