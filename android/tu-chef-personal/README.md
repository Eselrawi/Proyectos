# Tu Chef Personal

App Android que genera recetas a partir de los ingredientes que tengas en casa.

## Qué incluye

- Registro e inicio de sesión.
- Introduces los ingredientes disponibles y la app genera una receta con la API de Gemini.
- Historial de recetas guardadas en una base de datos local.

## Tecnologías

Java, Android Studio, XML, SQLite, OkHttp y Gson. Recetas con Gemini 2.5 Flash.

## Ejecutarlo

1. Abre la carpeta con Android Studio y espera a que sincronice Gradle.
2. Crea una clave en Google AI Studio y añádela a `local.properties` (en esta carpeta, no se sube a git):

   ```properties
   GEMINI_API_KEY=tu_clave
   ```

3. Ejecuta en un emulador o en un móvil.

Sin la clave, la app arranca pero no puede generar recetas.

## Estructura

```text
app/src/main/java/com/tuchefpersonal/app/   lógica, acceso a datos y llamadas a la API
app/src/main/res/layout/                    pantallas
```

## Autor

Raúl Gómez
