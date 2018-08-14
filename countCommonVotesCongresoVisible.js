"use strict";
const csvFilePath='./Votaciones_Plenaria_del_Senado_periodo_2017.csv';
const fs = require('fs');
const d3 = require('d3');

let getKey=(a,b) => {
	return a<b ? a+"~"+b : b+"~"+a;
};

let nest = d3.nest()
	.key((d) => { return d["Tipo de votación"]; })
	.key((d) => { return d["Resultado"]; });


fs.readFile(csvFilePath, 'utf8', (err, data) => {
	if (err) throw err;
	fs.readFile("SENADO_JAIRO.csv", 'utf8', (err2, senadores) => {
		if (err2) throw err;

		var data = d3.csvParse(data);
		var senadores = d3.csvParse(senadores);

		let graph = {};

		graph.nodes = senadores.map((s) => {
			s.name = s.APELLIDOS + " " + s.NOMBRES;
			return s;
		})

		// console.log(data);
		let nestedData = nest.entries(data);
		let counts = d3.map();

		// console.log(nestedData[1].values);
		nestedData.forEach((p) => {
			p.values.forEach((v) => {
				v.values.forEach((s1) => {
					s1 = s1['Nombre del Senador'];
					v.values.forEach((s2) => {
						// console.log(s1['Nombre del Senador']);
						s2 = s2['Nombre del Senador'];
						if (s1===s2) return;
						let key = getKey(s1, s2);
						let count = counts.has(key) ? counts.get(key) : 0;
						counts.set(key, count+1);
					});
				})
			});
		});
		graph.links = [];
		counts.each((count,key) => {
			let sens = key.split("~");
			graph.links.push({
				source:sens[0],
				target:sens[1],
				count:count
			});
		});

		fs.writeFile("dumpCongresoVisible.json", JSON.stringify(graph));
	});
});
