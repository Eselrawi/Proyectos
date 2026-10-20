package com.tuchefpersonal.app.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {

    private static final String PREFS_NAME = "TuChefPersonalSession";
    private static final String KEY_ID = "id_usuario";
    private static final String KEY_NOMBRE = "nombre";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_LOGGED = "logged";

    private SharedPreferences prefs;
    private SharedPreferences.Editor editor;

    public SessionManager(Context context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        editor = prefs.edit();
    }

    // Guardar sesión tras login
    public void guardarSesion(int id, String nombre, String email) {
        editor.putBoolean(KEY_LOGGED, true);
        editor.putInt(KEY_ID, id);
        editor.putString(KEY_NOMBRE, nombre);
        editor.putString(KEY_EMAIL, email);
        editor.apply();
    }

    // Comprobar si hay sesión activa
    public boolean haySesion() {
        return prefs.getBoolean(KEY_LOGGED, false);
    }

    // Obtener id del usuario
    public int getIdUsuario() {
        return prefs.getInt(KEY_ID, -1);
    }

    // Obtener nombre del usuario
    public String getNombre() {
        return prefs.getString(KEY_NOMBRE, "");
    }

    // Obtener email del usuario
    public String getEmail() {
        return prefs.getString(KEY_EMAIL, "");
    }

    // Cerrar sesión
    public void cerrarSesion() {
        editor.clear();
        editor.apply();
    }
}