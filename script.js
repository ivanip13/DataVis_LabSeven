
const margin = { top: 100, right: 90, bottom: 40, left: 90 }
const width = 1000 - margin.left - margin.right
const height = 600 - margin.top - margin.bottom;

Promise.all([d3.json("airports.json"),
d3.json("world-110m.json", d3.autoType)]).then(data=>{

    let airports = data[0];
    let worldmap = data[1];


    function diagram(){
      svg.selectAll('.map').remove()

        let forceSize = d3.scaleLinear()
          .domain(d3.extent(list_of_passengers))
          .range([5,9])

        let drag = force => {

          function dragstarted(event) {
            if (!event.active) force.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          }

          function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          }

          function dragended(event) {
            if (!event.active) force.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
          }

          return d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended);
        }

        force.alpha(0.5).restart();

       let link = svg
          .selectAll(".chart-area")
          .data(data[0].links)
          .enter()
          .append("line")
          .attr('class','force')
          .attr("stroke", "grey");


        let nodes = svg
          .selectAll(".node")
          .data(data[0].nodes)
          .enter()
          .append("circle")
          .attr("class", "force")
          .attr('cx', (d,i)=>(d.x))
          .attr('cy', (d,i)=>(d.y))
          .attr("r", d=>forceSize(d.passengers))
          .attr("fill", "orange")
          .call(drag(force));

          force.on("tick", function() {
              nodes.attr("cx", function(d) {
                  return d.x;
                })
                .attr("cy", function(d) {
                  return d.y;
                });

              link.attr("x1", function(d) {
                  return d.source.x;
                })
                .attr("y1", function(d) {
                  return d.source.y;
                })
                .attr("x2", function(d) {
                  return d.target.x;
                })
                .attr("y2", function(d) {
                  return d.target.y;
                });
            });
        }

    const feature = topojson.feature(worldmap, worldmap.objects.countries).features;



    const projection = d3.geoMercator()
      .fitExtent([[0,0], [width,height]], topojson.feature(worldmap, worldmap.objects.countries));

    const path = d3.geoPath()
      .projection(projection);

    const svg = d3.select(".chart-area").append("svg")
      .attr("viewBox", [0, 0, width, height]);

    let list_of_passengers = []
    for (i = 0; i < data[0].nodes.length; i++) {
      list_of_passengers.push(airports.nodes[i].passengers);
    }

    let force = d3.forceSimulation(airports.nodes)
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink(airports.links))
    .force("center",d3.forceCenter()
        .x(width / 2)
        .y(height / 2)
    )

  diagram();

  d3.selectAll("input[name=display]").on("change", event =>{
    visType = event.target.value
    switchLayout();
  });

  function switchLayout(){
    if (visType === "map"){
      // stop the simulation
      // set the positions of links and nodes based on geo-coordinates
      // set the map opacity to 1
      svg.selectAll("path")
      .data(feature)
      .join("path")
      .attr("d", path)
      .attr("fill", "black");

      svg.append("path")
        .datum(topojson.mesh(worldmap, worldmap.objects.countries))
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr('class','subunit-boundary')
      let mapScale = d3.scaleLinear()
        .domain(d3.extent(list_of_passengers))
        .range([3,7])

      drag = force => {
        drag.filter(event => visType === "force")
      }

      let forceLinks = svg.selectAll('.chart-area')
              .data(data[0].links)
              .enter()
              .append('line')
              .attr('class','force')
              .attr('x1', (d)=> (d.source.x))
              .attr('y1',(d) => (d.source.y))
              .attr('x2', (d) => (d.target.x))
              .attr('y2',(d) => (d.target.y))
              .attr('stroke', 'grey')
              .transition()
              .duration(500)
              .attr("x1", function(d) {
                return projection([d.source.longitude, d.source.latitude])[0];
              })
              .attr("y1", function(d) {
                return projection([d.source.longitude, d.source.latitude])[1];
              })
              .attr("x2", function(d) {
                return projection([d.target.longitude, d.target.latitude])[0];
              })
              .attr("y2", function(d) {
                return projection([d.target.longitude, d.target.latitude])[1];
              });

      let mapLinks = svg.selectAll('.chart-area')
          .data(data[0].links)
          .enter()
          .append('line')
          .attr('class','map')
          .attr('x1', (d)=> (d.source.x))
          .attr('y1',(d) => (d.source.y))
          .attr('x2', (d) => (d.target.x))
          .attr('y2',(d) => (d.target.y))
          .attr('stroke', 'grey')
          .transition()
          .duration(500)
          .attr("x1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[0];
          })
          .attr("y1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[1];
          })
          .attr("x2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[0];
          })
          .attr("y2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[1];
          });

      let nodes = svg.selectAll('.chart-area')
              .data(data[0].nodes)
              .enter()
              .append('circle')
              .attr('class','map')
              .attr('cx', (d,i)=>(d.x))
              .attr('cy', (d,i)=>(d.y))
              .attr('fill', 'orange')
              .attr('r',d=>mapScale(d.passengers))
              .on("mouseenter", (event, d) => {
                const pos = d3.pointer(event, window)
                d3.selectAll('.tooltip')
                    .style('display','inline-block')
                    .style('position','fixed')
                    .style('top', pos[1]+'px')
                    .style('left', pos[0]+'px')
                    .html(d.name)
                })
                .on("mouseleave", (event, d) => {
                    d3.selectAll('.tooltip')
                        .style('display','none')
                })
              .transition()
              .duration(500)
              .attr("cx", function(d) {
                return projection([d.longitude, d.latitude])[0];
              })
              .attr("cy", function(d) {
                return projection([d.longitude, d.latitude])[1];
              })


      svg.selectAll("path")
        .attr("opacity", 0);

      svg.selectAll('.force').remove()

      force.alpha(0.1).stop();

      force.on("tick", () => {
        mapLinks
          .attr("x1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[0];
          })
          .attr("y1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[1];
          })
          .attr("x2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[0];
          })
          .attr("y2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[1];
          });

      nodes.attr("transform", (d) =>
             "translate(" + projection([d.longitude, d.latitude]) + ")"
          )

      });

      svg.selectAll("path")
        .transition()
        .delay(450)
        .attr("opacity", 1);

    } else {
      // force layout
  		// restart the simulation
  		// set the map opacity to 0

      diagram();
      svg.selectAll("path")
            .attr("opacity", 0);
    }

  }



    })
