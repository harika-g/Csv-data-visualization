
var margin = { top: 20, right: 20, bottom: 30, left: 50 };
var width = 700 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var parseTime = d3.timeParse("%X");

var x = d3.scaleTime()
  .range([0, width]);
//var x = d3.scaleLinear()
//    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

// pathvar gives the name of file uploaded
var path = document.getElementById("jscall").getAttribute("pathvar");
var transactiontypes = [];
var exceptiontime = 0;
var session = false;

//var data;

function drawCharts() {
    d3.csv("reports/"+"../media/Reports/"+path, function (d) {
        //console.log(d);

        //converting time to Date object
        var prev = d[Object.keys(d)[0]];
        //console.log(typeof(d[Object.keys(d)[0]]));
        //d[Object.keys(d)[0]] = new Date(d[Object.keys(d)[0]]);
        if (!d[Object.keys(d)[0]].includes(":")) {
           
            d[Object.keys(d)[0]] = +prev;
            //console.log(d[Object.keys(d)[0]]);
        }
        else {
            d[Object.keys(d)[0]] = new Date(d[Object.keys(d)[0]]);
        }
        //console.log(d[Object.keys(d)[0]]);
        for (var ct = 1; ct < Object.keys(d).length; ct++) {
            //If time details are present with session details, store them and delete column 
            if (Object.keys(d)[ct].trim(' ') == "Time") {
                session = true;
                transactiontypes.push(d[Object.keys(d)[ct]]);
                delete d[Object.keys(d)[ct]];
            }
            //else {
            //    //converting all values to integers
            //    d[Object.keys(d)[ct]] = +d[Object.keys(d)[ct]];
            //}
        }
        return d;
    }, function (error, initialdata) {

        if (error) throw error;
        console.log(initialdata);
        var data = initialdata;
        //drawCharts();

        d3.selectAll("div")
          .remove();
        var weights, a, b;
        var cols = Object.keys(data[0]);

        if (initialdata[0][cols[0]] == null) {
            alert("Not a valid file!\nThe first column of csv must contain Date and Time.");
            //window.location.replace("/reports/");
            window.close();
        }

        //console.log(cols);
        var charts = [];
        var bisectDate = d3.bisector(function (d) { return d[cols[0]]; }).left;

        var url = 'updated-data/' + path;
        console.log(url);

        //calling 'updated-data' to get the co efficients of trendline equation
        $.ajax({
            url: url,
                success: function (dat) {

                    console.log("getting arrays");
                    console.log(dat);
                    weights = dat.split(";");
                    a = weights[0].split(",");
                    b = weights[1].split(",");
                    for (var p = 0; p < a.length; p++) {
                        a[p] = parseFloat(a[p]);
                        b[p] = parseFloat(b[p]);
                    }

                    for (var i = 1; i < cols.length; i++) {

                        //console.log(a[i-1]+".."+b[i-1])

                        var minDomainValue = 0;
                        var minDate = d3.min(data, function (d0) {
                            return d0[cols[0]];
                        }),
                          maxDate = d3.max(data, function (d0) {
                              return d0[cols[0]];
                          });
                        if (session == true) {
                            minDate = data[0][cols[0]];
                            maxDate = data[data.length - 1][cols[0]];
                        }

                        //maxDate = new Date(maxDate.getTime() + (120 * 1000));
                        //console.log(minDate);
                        //console.log(maxDate);
                        var result_lr = [];
                        var aggregates = [];

                        //var interval = (data[1][cols[0]] - data[0][cols[0]]);
                        //console.log(interval);
                        //var temp = data[0][cols[0]];
                        //var count = 0;

                        for (var count = 0; count <= data.length - 1; count++) {
                            if (session == false) {
                                //while(temp< maxDate){
                                temp = data[count][cols[0]];
                                result_lr[count] = a[i - 1] + (b[i - 1] * ((temp - minDate) / 1000));
                            }
                            else {
                                temp = data[count][cols[0]]
                                result_lr[count] = a[i - 1] + (b[i - 1] * temp);
                            }
                            //---uncomment for trendline using count result_lr[count] = a[i - 1] + (b[i - 1] * (count+1));
                            aggregates.push({ x: temp, y: result_lr[count] });
                            //temp = new Date(temp.getTime() + interval);
                            //console.log(temp - minDate, result_lr[count]);
                        }

                        x.domain([minDate, maxDate]);
                        //x.domain([1, data.length ]);

                        y.domain([
                            //minDomainValue,
                            d3.min(data, function (c) {  return +c[cols[i]]; }),
                            d3.max(data, function (c) {
                                return +c[cols[i]];
                            })
                        ]);

                        var line = d3.line()
                          .x(function(d){return x(d[cols[0]]);})
                          .y(function (d) { return y(d[cols[i]]); });

                        var line_lr = d3.line()
                          .x(function (d) { return x(d.x); })
                          .y(function (d) { return y(d.y); });

                        charts[i - 1] = d3.select("body")
                            .append("div")
                            .attr("width", width + margin.left + margin.right + 200)
                            .attr("height", height + margin.top + margin.bottom + 200)
                            .attr("class", "figure" + i +" col-lg-12")
                                    .append("svg")
                                      .attr("class", "chart"+i)
                                      .attr("width", width + margin.left + margin.right)
                                      .attr("height", height + margin.top + margin.bottom)
                                    .append("g")
                                      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                        // var leak = data[data.length-1][cols[i]] - data[0][cols[i]];
                        var leak = aggregates[aggregates.length - 1].y - aggregates[0].y;

                        if (cols[i].includes("Virtual Bytes") && session == true && leak > 0 ) {
                            exceptiontime = (2 * Math.pow(2, 30) - a[i - 1]) / b[i - 1];
                            if (exceptiontime > 0)
                                document.getElementById("OOM exception").innerHTML = "Out of memory exception might occur at session "+ Math.round(exceptiontime) +" after "+ Math.round(exceptiontime - maxDate)+" sessions";//"Out of Memory exception might occur at "+ new Date(minDate.getTime() + exceptiontime * 1000) + " or "+ exceptiontime - ((maxDate - minDate)/1000)+" seconds";
                         }

                        d3.select(".figure" + i)
                             .append("h6")
                             .attr("class", function () {
                                 if (leak > 0)
                                     return "alert alert-danger";
                                 else
                                     return "alert alert-success";
                             })
                            .style("width", "fit-content")
                            .text(function () {
                                 var return_text = "Change is "+d3.format(",")(Math.round(leak));
                                 if (!cols[i].includes("Count"))
                                     if (cols[i].includes("MB"))
                                         return_text += " MB";
                                     else
                                         //conversion of bytes to MB
                                         var return_text = "Change is "+d3.format(",.2f")(leak/Math.pow(2,20))+" MB";
                                 if (leak > 0)
                                     return_text += ". There is leak.";
                                 else
                                     return_text += ". There is no leak.";
                                 return return_text;
                             });

                        var xaxis = d3.axisBottom(x)
                                    .tickFormat(function (d) { 
                                        if (session == false) return d3.timeFormat("%d/%m,%H:%M")(d);
                                        else {
                                            //console.log(+d);
                                            return +d;
                                        }
                                    });


                        charts[i - 1].append("g")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xaxis)
                            .selectAll("text")
                            .attr("transform", "rotate(-15)");

                        charts[i - 1].select("g")
                            .append("text")
                            .attr("transform","translate(" + (width) + " ," + (margin.top + 10) + ")")
                            .style("text-anchor", "middle")
                            .attr("font-weight","bold")
                            .text(function () { if (session == true) return "Session"; else return "Time";})
                            .attr("fill", "#000");

                            
                        var yaxis = d3.axisLeft(y)
                                    .tickFormat(d3.format(",.3s"));

                        charts[i - 1].append("g")
                            .call(yaxis)
                          .append("text")
                            .attr("transform", "rotate(-90)")
                            .attr("x",0 - (height/2))
                            .attr("y", 0 - margin.left)
                            .attr("dy", "1em")
                            .attr("text-anchor", "middle")
                            .attr("font-weight","bold")
                            .attr("fill", "#000")
                            .attr("font-size","1.4em")
                            .text(function(){
                                if (cols[i].includes("\\")) {
                                    var slices = cols[i].split("\\");
                                    return slices[slices.length-1];
                                }
                                else {
                                    return cols[i];
                                }
                            });


                        charts[i - 1].append("path")
                            .datum(data)
                            .attr("fill", "none")
                            .attr("stroke", "steelblue")
                            .attr("stroke-linejoin", "round")
                            .attr("stroke-linecap", "round")
                            .attr("stroke-width", 2)
                            .attr("d", line);

                       /* charts[i-1].selectAll("dot")
                            .data(data)
                          .enter().append("circle")
                            .attr("r", 1.5)
                            .attr("cx", function (d) { return x(d[cols[0]]); })
                            .attr("cy", function (d) { return y(d[cols[i]]); });*/


                        charts[i - 1].append("path")
                            .datum(aggregates)
                            .attr("fill", "none")
                            .attr("stroke", "red")
                            .attr("stroke-dasharray","3,3")
                            .attr("stroke-linejoin", "round")
                            .attr("stroke-linecap", "round")
                            .attr("stroke-width", 1)
                            .attr("d", line_lr);

                        /*charts[i - 1].append("text")
                          .attr("text-anchor", "start")
                          .attr("transform", "translate(300,0)")
                          .attr("dy", ".35em")
                          .attr("text-anchor", "start")
                          .style("fill", "red")
                          .text("Slope: " + Number.parseFloat(b[i - 1]).toPrecision(2));*/

                        var focus = d3.select(".chart" + i).select("g").append("g")
                             .attr("class", "focus" + i)
                             .style("display", "none");

                        // append the x line
                        focus.append("line")
                            .attr("class", "xline")
                            .style("stroke", "black")
                            //.style("stroke-dasharray", "3,3")
                            .style("stroke-width","1.5px")
                            .style("opacity", 0.8)
                            .attr("y1", 0)
                            .attr("y2", height);

                        // append the y line
                        focus.append("line")
                            .attr("class", "yline")
                            .style("stroke", "black")
                            //.style("stroke-dasharray", "3,3")
                            .style("stroke-width","1.5px")
                            .style("opacity", 0.8)
                            .attr("x1", 0)
                            .attr("x2", width);

                        focus.append("circle")
                            .attr("r", 2.5)
                            .attr("fill","#000");

                        focus.append("text")
                            //.attr("dx", 0)
      	                    .attr("dy", "1em")
                            .append("tspan")
                            //.attr("x",8)
                            .attr("class", "text1");
                        focus.select("text")
                            .append("tspan")
                            .attr("class", "text2")
                            //.attr("x",8)
                            .attr("dy", 15);

                        d3.select(".chart" + i).append("rect")
                            .attr("class","rect"+i)
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                            .attr("fill", "none")
                            .attr("pointer-events","all")
                            .attr("width", width)
                            .attr("height", height)
                            //.on("mouseover", function () { focus.style("display", null); })
                            .on("mouseout", function () { d3.select(".focus"+this.getAttribute("class")[4]).style("display", "none"); })
                            .on("mousemove", mousemove);

                    function mousemove() {
                        var x0 = x.invert(d3.mouse(this)[0]),
                            p = bisectDate(data, x0, 1),
                            d0 = data[p - 1],
                            d1 = data[p],
                            d = x0 - d0[cols[0]] > d1[cols[0]] - x0 ? d1 : d0;
                        var item = d == d0 ? p - 1 : p;
                        var colnumber = this.getAttribute("class")[4];
                        var colname = cols[colnumber];
                        var maxval = d3.max(data, function (c) {
                            return +c[colname];
                        });
                        var minval = d3.min(data, function (c) { return +c[colname]; });
                        y.domain([minval, maxval]);

                        var location = d3.select(".focus" + colnumber);
                        location.style("display", null);
                        location.attr("transform", "translate(" + x(d[cols[0]]) + "," + y(d[colname]) + ")");
                        location.select("text").select(".text1").text("Y: "+d[colname])
                                                .attr("x", function () {
                                                    if (x(d[cols[0]]) > width - margin.right - d[colname].toString().length*8)
                                                        return -(d[colname].toString().length * 8);
                                                    else
                                                        return 8;
                                                });
                        //if (transactiontypes.length > 0) {
                        location.select("text").select(".text2").text(function () {
                                                                        if (session == false) {
                                                                            return "X: " + d[cols[0]].toLocaleString();
                                                                        }
                                                                        else {
                                                                            return "X: " + d[cols[0]];
                                                                        } })
                                                    .attr("x", function () {
                                                        if (x(d[cols[0]]) > width - margin.right - d[cols[0]].toString().length*8)
                                                            if (session == false)
                                                                return -(d[cols[0]].toLocaleString().length * 8);
                                                            else
                                                                return -(d[cols[0]].toString().length * 8);
                                                        else
                                                            return 8;
                                                    });
                        //}
                        location.select(".xline").attr("y2", height - y(d[colname]));
                        location.select(".yline").attr("x2", -x(d[cols[0]]));
                     }

                    }
                },
                error: function (xhr, status, error) {
                    if(xhr.status == 500){
                        alert("There is something wrong with the data provided\nPlease check if the data is from Perfomance Monitor and has Date and Time in first column\nEnsure the data is continuous");
                        window.close();
                    }
                }
            });

    });
}