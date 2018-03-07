"use strict";
const csvFilePath='./Votaciones_Plenaria_del_Senado_periodo_2017.csv';
const filePath2='./dumpCongresoVisible.json';
const fs = require('fs');
const d3 = require('d3');

let getKey=(a,b) => {
	return a<b ? a+"~"+b : b+"~"+a;
};

fs.readFile(csvFilePath, 'utf8', (err, data) => {
	if (err) throw err;
	fs.readFile(filePath2, 'utf8', (err2, _dataCV) => {
		if (err2) throw err2;
		data = d3.csvParse(data);
		let dataCV = [];
		_dataCV.split("\n").forEach((r) => {
			try {
				dataCV.push(JSON.parse(r));
			}
			catch (e) {
				console.log(r);
				console.log(e);
			}

		});

		let graph = {};


		// console.log(data);
		let nodes = d3.map();
		let counts = d3.map();

		//process data from the nest adding common votes to the counts variables
		function processDatosAbiertos(data, nameFn) {
			let nest = d3.nest()
				.key((d) => { return d["Tipo de votación"]; })
				.key((d) => { return d["Resultado"]; });

			let nestedData = nest.entries(data);
			// console.log(nestedData[1].values);
			nestedData.forEach((p) => {
				p.values.forEach((v) => {
					v.values.forEach((s1) => {
						s1 = nameFn(s1);
						v.values.forEach((s2) => {
							// console.log(s1['Nombre del Senador']);
							s2 = nameFn(s2);
							if (s1===s2) return;
							let key = getKey(s1, s2);
							let count = counts.has(key) ? counts.get(key) : 0;
							counts.set(key, count+1);
						});
					})
				});
			});
		}

		//process data from the nest adding common votes to the counts variables
		function processCV(data) {
			// console.log(nestedData[1].values);

			let nest = d3.nest()
				.key((d) => { return d["vote"]; });

			data.forEach((r) => {
				if (r.camaras !=="Senado") return;
				// Change the format of the data
				let votes =[];
				for (let s in r.detailed) {
					// Make sure to add all the senators to the nodes
					let sTrim = s.replace(new RegExp("[ ]{2,}", "g"), " ").trim();
					if (!nodes.has(sTrim)) {
						nodes.set(s, {
							name: sTrim,
							party:r.detailed[s].party
						});
					}
					votes.push({
						name:sTrim,
						vote:r.detailed[s].vote
					})
				}



				let nameFn = (d) => { return d.name.trim().replace(new RegExp("[ ]{2,}", "g"), " "); };
				//Use the nest to group senators by vote
				let nestedVotes = nest.entries(votes);

				//Compute the counts
				nestedVotes.forEach((v) => {
					v.values.forEach((s1) => {
						s1 = nameFn(s1);
						v.values.forEach((s2) => {

							s2 = nameFn(s2);
							if (s1===s2) return;
							let key = getKey(s1, s2);
							// console.log(key);
							let count = counts.has(key) ? counts.get(key) : 0;
							counts.set(key, count+1);
						});
					})
				});
			})
		}




		processCV(dataCV);
		// processDatosAbiertos(data, (d) => { return d['Nombre del Senador'].replace(new RegExp("[ ]{2,}", "g"), " ").trim(); });


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

		fs.writeFile("VotacionesSenado2017.json", JSON.stringify(graph));
	});
});
