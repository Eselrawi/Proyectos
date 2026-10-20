package com.tuchefpersonal.app.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.util.List;
import java.util.Random;

public class AiService {

    private static final String API_KEY = com.tuchefpersonal.app.BuildConfig.GEMINI_API_KEY;
    private static final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    private static final String[] ESTILOS = {
            "española tradicional", "italiana", "mexicana", "asiática", "mediterránea",
            "de fusión moderna", "vegetariana creativa", "de aprovechamiento",
            "rápida para principiantes", "gourmet para sorprender"
    };

    public static String generarReceta(List<String> ingredientes) throws Exception {
        String lista = String.join(", ", ingredientes);
        String estilo = ESTILOS[new Random().nextInt(ESTILOS.length)];

        String prompt = "Eres un chef profesional especializado en cocina " + estilo + ". " +
                "Un usuario tiene SOLO estos ingredientes en su cocina: " + lista + ". " +
                "REGLAS OBLIGATORIAS:\n" +
                "- USA SOLO ingredientes que aparezcan en la lista del usuario.\n" +
                "- No uses todos: elige los que combinen bien e ignora los que no encajen.\n" +
                "- PUEDES añadir especias, hierbas y condimentos básicos (orégano, pimentón, comino, perejil, laurel, tomillo, romero, curry, canela, vainilla...).\n" +
                "- PUEDES añadir ingredientes universales de cocina: aceite de oliva, sal, pimienta, ajo, cebolla, agua, harina, azúcar, vinagre, limón.\n" +
                "- NO es obligatorio añadir básicos de casa. Úsalos SOLO si la receta realmente los necesita. Si el plato funciona sin ellos, no los incluyas.\n" +
                "- Pocos básicos bien elegidos es mejor que una lista larga innecesaria.\n" +
                "- NO inventes ingredientes específicos que no estén en la lista (ej: si no hay jamón ibérico, no lo uses; si no hay nata, no la uses; si no hay queso, no lo uses).\n" +
                "- Si faltan ingredientes clave para una receta, adáptala o elige otra combinación.\n" +
                "- La receta debe ser REAL y cocinable con lo que realmente hay.\n\n" +
                "Genera UNA receta en español con este formato exacto:\n\n" +
                "🍽️ NOMBRE: [nombre creativo del plato]\n\n" +
                "📋 INGREDIENTES QUE USAREMOS (de tu cocina):\n" +
                "- [ingrediente 1]\n" +
                "- [ingrediente 2]\n\n" +
                "🛒 BÁSICOS DE CASA (que siempre hay):\n" +
                "- [básico 1]\n" +
                "- [básico 2]\n\n" +
                "👨‍🍳 PREPARACIÓN:\n" +
                "1. [paso 1]\n" +
                "2. [paso 2]\n" +
                "3. [paso 3]\n\n" +
                "⏱️ TIEMPO: [X minutos]\n" +
                "👥 RACIONES: [X personas]\n" +
                "📊 DIFICULTAD: [Fácil / Media / Difícil]\n\n" +
                "💡 CONSEJO: [truco breve y útil]";

        JsonObject part = new JsonObject();
        part.addProperty("text", prompt);

        JsonArray parts = new JsonArray();
        parts.add(part);

        JsonObject content = new JsonObject();
        content.add("parts", parts);

        JsonArray contents = new JsonArray();
        contents.add(content);

        JsonObject body = new JsonObject();
        body.add("contents", contents);

        String respuesta = ApiClient.postGemini(URL, body.toString(), API_KEY);
        JsonObject obj = JsonParser.parseString(respuesta).getAsJsonObject();

        return obj.getAsJsonArray("candidates")
                .get(0).getAsJsonObject()
                .getAsJsonObject("content")
                .getAsJsonArray("parts")
                .get(0).getAsJsonObject()
                .get("text").getAsString();
    }
}