/**
 * Curriculo base del curso: 11 modulos x 4 clases = 44 clases de 1 hora,
 * una por semana (~11 meses). El admin puede editarlo desde la plataforma.
 */
export const curriculum = [
  {
    numero: 1,
    nombre: 'Bienvenidos al mundo de la programacion',
    objetivo: 'Entender que es programar y dar las primeras instrucciones a la computadora con Python.',
    descripcion: 'Primer contacto con el pensamiento computacional y el entorno de trabajo.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Que es programar?',
        objetivo: 'Descubrir que un programa es una lista de instrucciones ordenadas.',
        contenido:
          'Juego del robot humano: los ninos dan instrucciones paso a paso a un companero. Se introduce la idea de algoritmo, orden y precision. Ejemplos de programas en el dia a dia (videojuegos, semaforos, apps).',
        conceptosClave: ['algoritmo', 'instruccion', 'secuencia'],
      },
      {
        numeroClase: 2,
        nombre: 'Conocemos Python',
        objetivo: 'Reconocer el entorno de trabajo y ejecutar el primer programa.',
        contenido:
          'Presentacion de Python y del editor online. Anatomia de la pantalla: editor, boton ejecutar y consola. Escribimos y ejecutamos print("Hola, mundo!").',
        conceptosClave: ['Python', 'editor', 'consola', 'ejecutar'],
      },
      {
        numeroClase: 3,
        nombre: 'La funcion print',
        objetivo: 'Mostrar mensajes en pantalla y jugar con el texto.',
        contenido:
          'Varios print seguidos, comillas simples y dobles, dibujos con caracteres (arte ASCII), saltos de linea. Ejercicio: escribir una tarjeta de presentacion.',
        conceptosClave: ['print', 'texto', 'comillas'],
      },
      {
        numeroClase: 4,
        nombre: 'Errores: nuestros amigos',
        objetivo: 'Perder el miedo a los errores y aprender a leerlos.',
        contenido:
          'Provocamos errores a proposito (falta un parentesis, falta una comilla) y leemos el mensaje. Se introduce el comentario con # y la idea de depurar. Reto: arreglar 5 programas rotos.',
        conceptosClave: ['error', 'sintaxis', 'comentario', 'depurar'],
      },
    ],
  },
  {
    numero: 2,
    nombre: 'Variables: cajitas para guardar cosas',
    objetivo: 'Guardar informacion en variables y usarla dentro del programa.',
    descripcion: 'Tipos de datos basicos y entrada de datos del usuario.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Que es una variable',
        objetivo: 'Entender la variable como una caja con nombre que guarda un valor.',
        contenido:
          'Analogia de las cajas etiquetadas. Asignacion con =, cambiar el valor, imprimir variables. Reglas para nombrar variables.',
        conceptosClave: ['variable', 'asignacion', 'nombre'],
      },
      {
        numeroClase: 2,
        nombre: 'Textos y numeros',
        objetivo: 'Distinguir los tipos de datos basicos.',
        contenido:
          'Cadenas (str), enteros (int) y decimales (float). Uso de type(). Que pasa si sumamos texto con numeros y como se arregla con int() y str().',
        conceptosClave: ['str', 'int', 'float', 'tipo de dato'],
      },
      {
        numeroClase: 3,
        nombre: 'Preguntar al usuario',
        objetivo: 'Leer datos escritos por la persona que usa el programa.',
        contenido:
          'La funcion input(). Guardar la respuesta en una variable y responder con un mensaje personalizado. Conversion con int(input()).',
        conceptosClave: ['input', 'conversion'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: mi ficha personal',
        objetivo: 'Integrar variables e input en un programa propio.',
        contenido:
          'Cada nino crea un programa que pregunta nombre, edad, color favorito y mascota, y muestra una ficha bonita con esos datos usando f-strings.',
        conceptosClave: ['f-string', 'proyecto', 'integracion'],
      },
    ],
  },
  {
    numero: 3,
    nombre: 'Matematicas divertidas',
    objetivo: 'Usar Python como una calculadora poderosa para resolver problemas.',
    descripcion: 'Operadores aritmeticos y sus aplicaciones ludicas.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Sumas, restas y compania',
        objetivo: 'Aplicar los operadores aritmeticos basicos.',
        contenido:
          'Operadores +, -, *, /. Orden de las operaciones y uso de parentesis. Ejercicios: calcular cuantos dias faltan para el cumpleanos.',
        conceptosClave: ['operadores', 'precedencia'],
      },
      {
        numeroClase: 2,
        nombre: 'Division entera y residuo',
        objetivo: 'Usar // y % para repartir y detectar patrones.',
        contenido:
          'Repartir dulces entre amigos: cuantos toca a cada uno (//) y cuantos sobran (%). Truco para saber si un numero es par.',
        conceptosClave: ['division entera', 'modulo', 'par e impar'],
      },
      {
        numeroClase: 3,
        nombre: 'Numeros al azar',
        objetivo: 'Incorporar aleatoriedad con el modulo random.',
        contenido:
          'import random, random.randint() y random.choice(). Simulamos un dado, una moneda y una ruleta de tareas.',
        conceptosClave: ['modulo', 'import', 'random'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: calculadora loca',
        objetivo: 'Construir una calculadora que resuelva retos matematicos.',
        contenido:
          'Programa que pide dos numeros y muestra suma, resta, multiplicacion, division y el residuo, con mensajes divertidos.',
        conceptosClave: ['proyecto', 'operadores', 'input'],
      },
    ],
  },
  {
    numero: 4,
    nombre: 'Tomar decisiones',
    objetivo: 'Hacer que el programa elija caminos distintos segun las condiciones.',
    descripcion: 'Condicionales y logica booleana.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Verdadero o falso',
        objetivo: 'Comparar valores y obtener resultados booleanos.',
        contenido:
          'Comparadores ==, !=, >, <, >=, <=. El tipo bool. Juego de adivinar si una comparacion es True o False.',
        conceptosClave: ['bool', 'comparacion', 'True', 'False'],
      },
      {
        numeroClase: 2,
        nombre: 'Si... entonces',
        objetivo: 'Escribir el primer condicional if / else.',
        contenido:
          'Estructura del if, importancia de los dos puntos y la indentacion. Programa que dice si eres mayor o menor que 10 anos.',
        conceptosClave: ['if', 'else', 'indentacion'],
      },
      {
        numeroClase: 3,
        nombre: 'Muchos caminos: elif',
        objetivo: 'Encadenar varias condiciones.',
        contenido:
          'Uso de elif para varios casos. Los operadores and, or y not. Programa que recomienda ropa segun el clima.',
        conceptosClave: ['elif', 'and', 'or', 'not'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: test de personalidad',
        objetivo: 'Aplicar condicionales en un programa interactivo.',
        contenido:
          'Cuestionario de 4 preguntas que suma puntos y entrega un resultado (animal, superpoder o casa favorita) segun el puntaje.',
        conceptosClave: ['proyecto', 'condicionales', 'contador'],
      },
    ],
  },
  {
    numero: 5,
    nombre: 'Repetir sin cansarse',
    objetivo: 'Automatizar tareas repetitivas con bucles.',
    descripcion: 'Bucles for y while, contadores y acumuladores.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'El bucle for',
        objetivo: 'Repetir instrucciones una cantidad conocida de veces.',
        contenido:
          'for con range(). Imprimir del 1 al 10, tablas de multiplicar y figuras con asteriscos.',
        conceptosClave: ['for', 'range', 'iteracion'],
      },
      {
        numeroClase: 2,
        nombre: 'El bucle while',
        objetivo: 'Repetir mientras se cumpla una condicion.',
        contenido:
          'Estructura del while, la variable de control y el peligro del bucle infinito. Cuenta regresiva para un despegue.',
        conceptosClave: ['while', 'condicion', 'bucle infinito'],
      },
      {
        numeroClase: 3,
        nombre: 'Contadores y acumuladores',
        objetivo: 'Llevar cuentas y sumas dentro de un bucle.',
        contenido:
          'Patron contador (c = c + 1) y acumulador (total = total + n). Sumar los numeros del 1 al 100 y contar cuantas veces sale un 6 en 20 tiradas de dado.',
        conceptosClave: ['contador', 'acumulador'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: adivina el numero',
        objetivo: 'Combinar bucles, condicionales y random en un juego.',
        contenido:
          'El programa elige un numero secreto y el jugador intenta adivinarlo; responde "mas alto" o "mas bajo" y cuenta los intentos.',
        conceptosClave: ['proyecto', 'while', 'random', 'condicionales'],
      },
    ],
  },
  {
    numero: 6,
    nombre: 'Listas: guardar muchas cosas',
    objetivo: 'Manejar colecciones de datos con listas.',
    descripcion: 'Creacion, recorrido y modificacion de listas.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Mi primera lista',
        objetivo: 'Crear listas y acceder a sus elementos.',
        contenido:
          'Sintaxis con corchetes, indices que empiezan en 0, indices negativos y len(). Lista de comidas favoritas del grupo.',
        conceptosClave: ['lista', 'indice', 'len'],
      },
      {
        numeroClase: 2,
        nombre: 'Agregar y quitar',
        objetivo: 'Modificar listas dinamicamente.',
        contenido:
          'Metodos append(), insert(), remove() y pop(). Ordenar con sort() y dar vuelta con reverse(). Lista de tareas del dia.',
        conceptosClave: ['append', 'remove', 'sort'],
      },
      {
        numeroClase: 3,
        nombre: 'Recorrer listas',
        objetivo: 'Combinar listas con bucles for.',
        contenido:
          'for elemento in lista. Buscar el mayor y el menor, sumar todos los elementos, contar cuantos cumplen una condicion.',
        conceptosClave: ['for', 'recorrido', 'busqueda'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: sorteo de la clase',
        objetivo: 'Usar listas en un programa util para el grupo.',
        contenido:
          'Programa que guarda los nombres del grupo, los mezcla y arma parejas o elige un ganador al azar sin repetir.',
        conceptosClave: ['proyecto', 'listas', 'random'],
      },
    ],
  },
  {
    numero: 7,
    nombre: 'Funciones: nuestros propios superpoderes',
    objetivo: 'Organizar el codigo creando funciones reutilizables.',
    descripcion: 'Definicion, parametros y valores de retorno.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Crear una funcion',
        objetivo: 'Definir y llamar funciones propias.',
        contenido:
          'Palabra clave def, cuerpo indentado y llamada a la funcion. Convertir en funcion un saludo repetido.',
        conceptosClave: ['def', 'funcion', 'llamada'],
      },
      {
        numeroClase: 2,
        nombre: 'Funciones con parametros',
        objetivo: 'Pasar informacion a una funcion.',
        contenido:
          'Parametros y argumentos. Funcion saludar(nombre) y funcion dibujar_linea(largo). Valores por defecto.',
        conceptosClave: ['parametro', 'argumento'],
      },
      {
        numeroClase: 3,
        nombre: 'Funciones que devuelven',
        objetivo: 'Usar return para entregar un resultado.',
        contenido:
          'Diferencia entre imprimir y devolver. Funciones area_rectangulo(a, b) y es_par(n). Guardar el resultado en una variable.',
        conceptosClave: ['return', 'resultado'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: caja de herramientas',
        objetivo: 'Construir un mini menu con funciones propias.',
        contenido:
          'Programa con un menu que llama a distintas funciones creadas por el nino: convertir edad a dias, calcular el area, decir la suerte del dia.',
        conceptosClave: ['proyecto', 'funciones', 'menu'],
      },
    ],
  },
  {
    numero: 8,
    nombre: 'Dibujar con la tortuga',
    objetivo: 'Crear dibujos y animaciones con el modulo turtle.',
    descripcion: 'Programacion grafica: geometria y creatividad.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Hola, tortuga',
        objetivo: 'Mover la tortuga por la pantalla.',
        contenido:
          'import turtle, forward(), backward(), right(), left(), penup() y pendown(). Dibujar un cuadrado paso a paso.',
        conceptosClave: ['turtle', 'coordenadas', 'angulo'],
      },
      {
        numeroClase: 2,
        nombre: 'Colores y formas',
        objetivo: 'Personalizar el dibujo.',
        contenido:
          'pencolor(), fillcolor(), begin_fill() y end_fill(), grosor y velocidad. Dibujar una casa y un arcoiris.',
        conceptosClave: ['color', 'relleno', 'figura'],
      },
      {
        numeroClase: 3,
        nombre: 'Tortuga con bucles',
        objetivo: 'Combinar turtle con for para crear patrones.',
        contenido:
          'Poligonos con for y range, espirales cambiando el angulo, rosetones repitiendo una figura girada.',
        conceptosClave: ['for', 'patron', 'poligono'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: mi obra de arte',
        objetivo: 'Disenar un dibujo propio usando funciones y bucles.',
        contenido:
          'Cada nino planifica un dibujo (paisaje, robot, mandala), lo divide en funciones y lo presenta al grupo.',
        conceptosClave: ['proyecto', 'turtle', 'funciones'],
      },
    ],
  },
  {
    numero: 9,
    nombre: 'Diccionarios y datos',
    objetivo: 'Organizar informacion con pares clave-valor.',
    descripcion: 'Diccionarios y su combinacion con listas.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Clave y valor',
        objetivo: 'Crear diccionarios y consultar sus datos.',
        contenido:
          'Sintaxis con llaves, acceso por clave, agregar y modificar entradas. Ficha de un personaje con nombre, poder y nivel.',
        conceptosClave: ['diccionario', 'clave', 'valor'],
      },
      {
        numeroClase: 2,
        nombre: 'Recorrer diccionarios',
        objetivo: 'Iterar claves y valores.',
        contenido:
          'Metodos keys(), values() e items(). Comprobar si una clave existe con in. Inventario de una mochila magica.',
        conceptosClave: ['items', 'in', 'recorrido'],
      },
      {
        numeroClase: 3,
        nombre: 'Listas de diccionarios',
        objetivo: 'Combinar estructuras para datos mas ricos.',
        contenido:
          'Lista de fichas de mascotas o personajes. Buscar dentro de la lista y filtrar por una condicion.',
        conceptosClave: ['estructura anidada', 'filtro'],
      },
      {
        numeroClase: 4,
        nombre: 'Proyecto: album de cromos',
        objetivo: 'Gestionar una coleccion de datos.',
        contenido:
          'Programa que guarda cromos (nombre, rareza, repetidos), permite agregar, buscar y listar los que faltan.',
        conceptosClave: ['proyecto', 'diccionarios', 'listas'],
      },
    ],
  },
  {
    numero: 10,
    nombre: 'Creamos videojuegos',
    objetivo: 'Construir juegos completos aplicando todo lo aprendido.',
    descripcion: 'Logica de juego: estado, turnos, puntaje y validaciones.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Piedra, papel o tijera',
        objetivo: 'Programar un juego por turnos contra la computadora.',
        contenido:
          'Uso de random.choice, condicionales para decidir el ganador, marcador de puntos y opcion de volver a jugar.',
        conceptosClave: ['juego', 'condicionales', 'marcador'],
      },
      {
        numeroClase: 2,
        nombre: 'El ahorcado',
        objetivo: 'Manejar cadenas y letras adivinadas.',
        contenido:
          'Palabra secreta de una lista, letras acertadas y falladas, mostrar la palabra oculta con guiones y contar vidas.',
        conceptosClave: ['cadenas', 'listas', 'bucle principal'],
      },
      {
        numeroClase: 3,
        nombre: 'Quiz de preguntas',
        objetivo: 'Crear un juego de preguntas con datos estructurados.',
        contenido:
          'Preguntas guardadas en una lista de diccionarios, validacion de la respuesta, puntaje final y mensaje segun el resultado.',
        conceptosClave: ['diccionarios', 'validacion', 'puntaje'],
      },
      {
        numeroClase: 4,
        nombre: 'Mejoramos nuestro juego',
        objetivo: 'Iterar sobre el propio codigo para mejorarlo.',
        contenido:
          'Cada nino elige uno de sus juegos y le agrega niveles de dificultad, mensajes nuevos o un ranking. Intercambio de juegos entre companeros para probarlos.',
        conceptosClave: ['refactorizacion', 'pruebas', 'mejora'],
      },
    ],
  },
  {
    numero: 11,
    nombre: 'Proyecto final',
    objetivo: 'Disenar, construir y presentar un proyecto propio en Python.',
    descripcion: 'Cierre del curso: del plan a la presentacion.',
    clases: [
      {
        numeroClase: 1,
        nombre: 'Planeamos el proyecto',
        objetivo: 'Elegir la idea y dividirla en partes pequenas.',
        contenido:
          'Lluvia de ideas, eleccion del proyecto y planificacion en papel: que hace, que datos necesita y en que pasos se divide.',
        conceptosClave: ['planificacion', 'descomposicion'],
      },
      {
        numeroClase: 2,
        nombre: 'Construimos: primera parte',
        objetivo: 'Programar el nucleo del proyecto.',
        contenido:
          'Trabajo guiado en clase sobre la funcionalidad principal, con acompanamiento del tutor y revision entre companeros.',
        conceptosClave: ['desarrollo', 'funciones'],
      },
      {
        numeroClase: 3,
        nombre: 'Construimos: segunda parte',
        objetivo: 'Completar, probar y pulir el proyecto.',
        contenido:
          'Se agregan detalles, se corrigen errores y se prueba con otros ninos. Preparacion de la demostracion.',
        conceptosClave: ['depuracion', 'pruebas'],
      },
      {
        numeroClase: 4,
        nombre: 'Feria de proyectos',
        objetivo: 'Presentar el proyecto y celebrar el cierre del curso.',
        contenido:
          'Cada nino presenta su programa a companeros y familias: que hace, como lo hizo y que fue lo mas dificil. Entrega de certificados.',
        conceptosClave: ['presentacion', 'comunicacion', 'cierre'],
      },
    ],
  },
];
