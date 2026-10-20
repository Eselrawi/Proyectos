// Genera data/annotations/*.json (puntos y fichas de ingredientes). Editar aquí y relanzar si se corrige una máscara.
import fs from "node:fs/promises";
const I = (id, name, category, description, allergens, points, extra = {}) => ({ id, name, category, description, allergens, points, ...extra });
const A = {
  paella: { crop: { cx: 0.5, cy: 0.5, r: 0.32 }, restRadius: 0.88, ingredients: [
    I("arroz", "Arroz bomba al azafrán", "guarnición", "Grano corto que absorbe el caldo; el azafrán le da el color.", [], [], { rest: true }),
    I("mejillon", "Mejillón", "proteína", "Mejillón de roca abierto al vapor sobre el arroz.", ["moluscos"], [[0.355,0.291],[0.693,0.338],[0.309,0.511],[0.401,0.724],[0.572,0.742],[0.717,0.667],[0.484,0.179],[0.616,0.182]], { maxArea: 0.08 }),
    I("pimiento-rojo", "Pimiento rojo", "topping", "Tiras de pimiento asado, dulce y suave.", [], [[0.434,0.282],[0.546,0.31],[0.388,0.455],[0.605,0.498],[0.5,0.658],[0.336,0.686]], { maxArea: 0.05 }),
    I("pimiento-amarillo", "Pimiento amarillo", "topping", "Tiras de pimiento amarillo, más dulce que el rojo.", [], [[0.395,0.113],[0.776,0.348],[0.25,0.31]], { maxArea: 0.06 }),
    I("aceituna", "Aceituna verde", "topping", "Aceituna verde sin hueso, toque salino.", [], [[0.303,0.361],[0.608,0.342],[0.441,0.632],[0.641,0.596],[0.688,0.474]], { maxArea: 0.01 }),
    I("perejil", "Perejil", "hoja", "Hierba fresca picada al final.", [], [[0.504,0.282],[0.651,0.455],[0.537,0.545],[0.533,0.868]], { maxArea: 0.01 }),
  ]},
  hummus: { crop: { cx: 0.52, cy: 0.5, r: 0.3 }, restRadius: 0.8, ingredients: [
    I("hummus", "Crema de garbanzo", "guarnición", "Garbanzo triturado con tahini, limón y ajo, trabajado hasta quedar sedoso.", ["sesamo"], [], { rest: true }),
    I("perejil", "Perejil", "hoja", "Perejil fresco picado en el centro.", [], [[0.526,0.474]], { maxArea: 0.1 }),
    I("aceite", "Aceite de oliva virgen extra", "salsa", "Un chorro generoso en el hueco del hummus.", [], [[0.46,0.64]], { maxArea: 0.15, components: ["aceite de oliva virgen extra"] }),
  ]},
  gyoza: { crop: { cx: 0.47, cy: 0.55, r: 0.46 }, restRadius: 0.9, ingredients: [
    I("gyoza", "Gyoza a la plancha", "proteína", "Masa fina de trigo rellena de cerdo, col y jengibre; dorada por abajo y al vapor.", ["gluten", "soja", "sesamo"], [[0.42,0.375],[0.26,0.395],[0.63,0.34],[0.72,0.44],[0.78,0.55],[0.22,0.56],[0.44,0.607],[0.69,0.63],[0.625,0.77]], { maxArea: 0.1 }),
  ]},
  croquetas: { crop: { cx: 0.5, cy: 0.5, r: 0.375 }, restRadius: 0.9, ingredients: [
    I("croqueta", "Croqueta casera", "proteína", "Bechamel cremosa con jamón, rebozada en huevo y pan rallado.", ["gluten", "lacteos", "huevo"], [[0.553,0.175],[0.342,0.28],[0.724,0.368],[0.25,0.526],[0.71,0.667],[0.382,0.79]], { maxArea: 0.12 }),
    I("alioli", "Alioli", "salsa", "Emulsión de ajo y aceite, para mojar.", ["huevo"], [[0.48,0.5]], { maxArea: 0.1, components: ["aceite de oliva", "ajo", "huevo", "limón"] }),
  ]},
  curry: { crop: { cx: 0.49, cy: 0.5, r: 0.375 }, restRadius: 0.9, ingredients: [
    I("arroz", "Arroz blanco", "guarnición", "Arroz de grano corto cocido al vapor.", [], [[0.395,0.4],[0.3,0.65]], { maxArea: 0.3 }),
    I("salsa-curry", "Salsa de curry", "salsa", "Guiso espeso y suave, más dulce que picante.", ["gluten", "soja", "apio"], [[0.53,0.84],[0.79,0.46]], { maxArea: 0.3, components: ["roux de curry (harina y especias)", "caldo de ternera", "cebolla", "manzana", "salsa de soja"] }),
    I("patata", "Patata", "guarnición", "Patata cocida en el propio guiso hasta que se deshace.", [], [[0.58,0.58],[0.69,0.66]], { maxArea: 0.1 }),
    I("zanahoria", "Zanahoria", "guarnición", "Zanahoria en trozos grandes, blanda y dulce.", [], [[0.49,0.635],[0.75,0.45]], { maxArea: 0.06 }),
    I("ternera", "Ternera estofada", "proteína", "Carrillera de ternera cocinada hasta que se deshace.", [], [[0.67,0.465],[0.43,0.78],[0.55,0.745]], { maxArea: 0.12 }),
    I("fukujinzuke", "Encurtido rojo", "topping", "Verduras encurtidas con un punto dulce y ácido.", ["sulfitos"], [[0.62,0.19]], { maxArea: 0.05 }),
  ]},
  ramen: { crop: { cx: 0.5, cy: 0.5, r: 0.385 }, restRadius: 0.72, ingredients: [
    I("fideos", "Fideos en caldo rojo", "guarnición", "Fideos de trigo ondulados cocidos al dente en caldo de ternera con guindilla coreana.", ["gluten", "huevo", "soja", "apio"], [], { rest: true, components: ["caldo de ternera", "gochugaru (guindilla coreana)", "ajo", "salsa de soja"] }),
    I("cebolleta", "Cebolleta", "hoja", "Cebolleta fresca cortada fina.", [], [[0.4,0.35],[0.46,0.42],[0.64,0.66],[0.535,0.71],[0.42,0.66],[0.755,0.46]], { maxArea: 0.01 }),
    I("carne", "Ternera desmenuzada", "proteína", "Ternera cocinada en el caldo y deshilachada.", ["soja"], [[0.546,0.385],[0.35,0.57]], { maxArea: 0.02 }),
    I("guindilla", "Guindilla", "topping", "Guindilla roja seca, para subir el picante.", [], [[0.554,0.54]], { maxArea: 0.01 }),
  ]},
  pasta: { crop: { cx: 0.5, cy: 0.5, r: 0.5 }, restRadius: 0.9, ingredients: [
    I("espagueti", "Espagueti", "guarnición", "Pasta de sémola de trigo duro, cocida al dente.", ["gluten"], [[0.59,0.27],[0.145,0.58],[0.43,0.77],[0.2,0.5],[0.7,0.5],[0.62,0.68],[0.25,0.68],[0.5,0.2]], { maxArea: 0.3 }),
    I("albondiga", "Albóndigas en salsa de tomate", "proteína", "Ternera picada con pan, huevo, ajo y perejil, guisada en salsa de tomate.", ["gluten", "huevo", "lacteos", "apio"], [[0.46,0.294],[0.64,0.34],[0.32,0.397],[0.615,0.44],[0.43,0.46],[0.37,0.637],[0.665,0.58],[0.625,0.77],[0.43,0.553],[0.53,0.63]], { maxArea: 0.22, components: ["tomate", "cebolla", "ajo", "albahaca", "aceite de oliva"] }),
  ]},
  poke: { crop: { cx: 0.457, cy: 0.45, r: 0.3 }, restRadius: 0.85, ingredients: [
    I("arroz", "Arroz de sushi", "guarnición", "Arroz pegajoso aliñado con vinagre de arroz.", ["sulfitos"], [[0.447,0.754]], { maxArea: 0.1 }),
    I("edamame", "Edamame", "topping", "Haba de soja tierna, hervida y desgranada.", ["soja"], [[0.355,0.242],[0.41,0.21]], { maxArea: 0.05 }),
    I("mango", "Mango", "topping", "Dados de mango maduro.", [], [[0.54,0.19],[0.6,0.255]], { maxArea: 0.05 }),
    I("wakame", "Alga wakame", "hoja", "Alga marinada, suave y ligeramente dulce.", ["sesamo"], [[0.25,0.4]], { maxArea: 0.08 }),
    I("tofu-marinado", "Tofu marinado", "proteína", "Tofu firme marinado en soja y jengibre.", ["soja", "sesamo"], [[0.38,0.47],[0.526,0.34]], { maxArea: 0.08 }),
    I("tofu-frito", "Tofu frito", "proteína", "Tiras de tofu frito, dulces y crujientes.", ["soja"], [[0.51,0.58],[0.55,0.7]], { maxArea: 0.1 }),
    I("aguacate", "Aguacate", "topping", "Aguacate maduro, cremoso.", [], [[0.296,0.614]], { maxArea: 0.06 }),
    I("pepino", "Pepino encurtido", "topping", "Pepino en láminas, aliñado con vinagre y sésamo.", ["sesamo", "sulfitos"], [[0.63,0.456],[0.7,0.4]], { maxArea: 0.08 }),
  ]},
  bibimbap: { crop: { cx: 0.49, cy: 0.5, r: 0.375 }, restRadius: 0.9, ingredients: [
    I("huevo", "Huevo frito", "proteína", "Huevo frito con la yema líquida y sésamo por encima.", ["huevo", "sesamo"], [[0.62,0.386]], { maxArea: 0.2 }),
    I("lombarda", "Col lombarda fermentada", "guarnición", "Col morada encurtida, ácida y crujiente.", ["sulfitos"], [[0.23,0.42],[0.25,0.6]], { maxArea: 0.12 }),
    I("kimchi", "Kimchi de rábano", "guarnición", "Rábano fermentado con guindilla, ajo y salsa de pescado.", ["pescado", "crustaceos"], [[0.447,0.737],[0.58,0.8]], { maxArea: 0.15 }),
    I("tofu", "Tofu", "proteína", "Tofu firme en dados, con un toque de guindilla.", ["soja"], [[0.717,0.64],[0.776,0.456]], { maxArea: 0.1 }),
    I("hojas-verdes", "Hojas verdes", "hoja", "Brotes tiernos de rúcula y espinaca.", [], [[0.26,0.2],[0.38,0.167]], { maxArea: 0.1 }),
    I("zanahoria", "Zanahoria", "guarnición", "Zanahoria en juliana, salteada.", [], [[0.75,0.3]], { maxArea: 0.04 }),
    I("gochujang", "Gochujang", "salsa", "Pasta fermentada de guindilla, dulce y picante.", ["soja", "gluten"], [[0.36,0.245]], { maxArea: 0.06, components: ["guindilla coreana", "arroz glutinoso", "soja fermentada", "sal"] }),
  ]},
  cesar: { crop: { cx: 0.49, cy: 0.5, r: 0.445 }, restRadius: 0.92, ingredients: [
    I("pollo", "Pollo al horno", "proteína", "Muslo de pollo asado con la piel dorada.", [], [[0.395,0.754]], { maxArea: 0.3 }),
    I("lechuga", "Lechuga romana", "hoja", "Lechuga crujiente aliñada con salsa César (huevo, anchoa y mostaza).", ["huevo", "pescado", "mostaza"], [[0.21,0.3],[0.737,0.624],[0.33,0.175]], { maxArea: 0.2 }),
    I("picatostes", "Picatostes", "topping", "Cubos de pan tostado con aceite y ajo.", ["gluten"], [[0.566,0.153],[0.4,0.255],[0.487,0.345],[0.743,0.45],[0.82,0.553]], { maxArea: 0.03 }),
    I("parmesano", "Parmesano", "topping", "Lascas de parmesano curado.", ["lacteos"], [[0.638,0.228],[0.73,0.34],[0.69,0.637],[0.757,0.754]], { maxArea: 0.03 }),
    I("balsamico", "Reducción de vinagre", "salsa", "Vinagre de Módena reducido hasta quedar espeso.", ["sulfitos"], [[0.39,0.455]], { maxArea: 0.04, components: ["vinagre de Módena", "azúcar"] }),
  ]},
  pannacotta: { crop: { cx: 0.48, cy: 0.5, r: 0.37 }, restRadius: 0.9, ingredients: [
    I("panna-cotta", "Panna cotta", "guarnición", "Nata cuajada con vainilla, temblorosa.", ["lacteos"], [[0.507,0.544]], { maxArea: 0.12 }),
    I("fresa", "Fresa", "topping", "Fresa partida por la mitad.", [], [[0.37,0.36],[0.67,0.41],[0.38,0.7],[0.566,0.77]], { maxArea: 0.07 }),
    I("mora", "Mora", "topping", "Mora silvestre, ácida y jugosa.", [], [[0.25,0.3],[0.7,0.84]], { maxArea: 0.04 }),
    I("arandano", "Arándano", "topping", "Arándano azul entero.", [], [[0.35,0.114],[0.44,0.205],[0.734,0.526],[0.162,0.584],[0.22,0.547]], { maxArea: 0.02 }),
    I("grosella-roja", "Grosella roja", "topping", "Racimo de grosellas rojas.", [], [[0.197,0.667]], { maxArea: 0.06 }),
    I("grosella-espinosa", "Grosella espinosa", "topping", "Fruta ácida, translúcida y con venas.", [], [[0.533,0.149],[0.188,0.453],[0.79,0.688],[0.375,0.912]], { maxArea: 0.04 }),
    I("menta", "Menta", "hoja", "Hojas de menta fresca.", [], [[0.58,0.51]], { maxArea: 0.03 }),
    I("coulis", "Coulis de frutos rojos", "salsa", "Frutos rojos cocidos y colados.", [], [], { rest: true, components: ["fresa", "frambuesa", "azúcar", "limón"] }),
  ]},
  baklava: { crop: { cx: 0.5, cy: 0.51, r: 0.47 }, restRadius: 0.78, ingredients: [
    I("baklava", "Hojaldre filo con nueces", "proteína", "Capas finísimas de masa filo con nueces picadas y mantequilla.", ["gluten", "frutos-cascara", "lacteos"], [[0.43,0.267],[0.66,0.286],[0.263,0.365],[0.75,0.415],[0.283,0.533],[0.75,0.583],[0.342,0.69],[0.58,0.67]], { maxArea: 0.15 }),
    I("almibar", "Almíbar de miel y limón", "salsa", "Almíbar que empapa el hojaldre al salir del horno.", [], [], { rest: true, components: ["miel", "azúcar", "limón", "agua"] }),
  ]},
};
for (const [id, a] of Object.entries(A)) await fs.writeFile(`data/annotations/${id}.json`, JSON.stringify({ id, ...a }, null, 1));
console.log(Object.keys(A).length, "anotaciones");
