"use strict";
// File modified to fit congresovisible's data, that I got from them directly
const csvFilePath="./VotacionesSenado2017_de_CongresoVisible.csv";
const fs = require("fs");
const d3 = require("d3");

let getKey=(a,b) => {
  return a<b ? a+"~"+b : b+"~"+a;
};

fs.readFile(csvFilePath, "utf8", (err, data) => {
  if (err) throw err;
  data = d3.csvParse(data);


  let graph = {};


  // console.log(data);
  let nodes = d3.map();
  let counts = d3.map();


  //process data from the nest adding common votes to the counts variables
  function processCV(data) {
  // console.log(nestedData[1].values);

    let nest = d3.nest()
      .key((d) => { return d["numero_camara"]; })
      .key((d) => { return d["voto"]; });

    data.forEach((r) => {
      if (r["corporacion"].indexOf("Senado") === -1) return;
      // Change the format of the data
      
      // Make sure to add all the senators to the nodes
      let sTrim = r["congresista"].replace(new RegExp("[ ]{2,}", "g"), " ").trim();
      if (!nodes.has(sTrim)) {
        nodes.set(r["congresista"], {
          name: sTrim,
          party:r["partido"]
        });
      }
      r.name = sTrim;
    });
      
    

    // let nameFn = (d) => { return d.name.trim().replace(new RegExp("[ ]{2,}", "g"), " "); };
    // let nameFn = (d) => { return d.name; };
    //Use the nest to group senators by vote
    let nestedVotes = nest.entries(data);

    //Compute the counts
    nestedVotes.forEach((law) => {
      // console.log("Law", law.key);
      law.values.forEach((v) => {
        for (let i1 = 0; i1 < v.values.length; i1++) {
          let s1 = v.values[i1].name;
          for (let i2 = i1+1; i2 < v.values.length; i2++) {
            let s2 = v.values[i2].name;
            if (s1===s2) return;
            let key = getKey(s1, s2);
            // console.log(key);
            let count = counts.has(key) ? counts.get(key) : 0;
            counts.set(key, count+1);

          }
        }
        // v.values.forEach((s1) => {
        //   s1 = nameFn(s1);
        //   v.values.forEach((s2) => {

        //     s2 = nameFn(s2);
        //     if (s1===s2) return;
        //     let key = getKey(s1, s2);
        //     // console.log(key);
        //     let count = counts.has(key) ? counts.get(key) : 0;
        //     counts.set(key, count+1);
        //   });
        // });
      });
    });
  
  }
  
    




  processCV(data);



  graph.nodes = nodes.values();
  graph.links = [];
  counts.each((count,key) => {
    let sens = key.split("~");
    graph.links.push({
      source:sens[0],
      target:sens[1],
      count:count
    });
  });

  fs.writeFile("VotacionesSenado2017_de_CongresoVisible.json", JSON.stringify(graph));

});
