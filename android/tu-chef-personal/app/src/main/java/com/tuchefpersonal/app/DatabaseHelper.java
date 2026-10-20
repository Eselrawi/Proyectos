package com.tuchefpersonal.app;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DB_NAME = "tuchefpersonal.db";
    private static final int DB_VERSION = 1;

    public static final String TABLE_USUARIOS = "usuarios";
    public static final String TABLE_INGREDIENTES = "ingredientes";
    public static final String TABLE_RECETAS = "recetas";

    public DatabaseHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE " + TABLE_USUARIOS + " (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "nombre TEXT NOT NULL," +
                "email TEXT NOT NULL UNIQUE," +
                "contrasena TEXT NOT NULL," +
                "fecha_registro TEXT NOT NULL)");

        db.execSQL("CREATE TABLE " + TABLE_INGREDIENTES + " (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "id_usuario INTEGER NOT NULL," +
                "nombre TEXT NOT NULL," +
                "fecha_anadido TEXT NOT NULL," +
                "FOREIGN KEY(id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE)");

        db.execSQL("CREATE TABLE " + TABLE_RECETAS + " (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "id_usuario INTEGER NOT NULL," +
                "titulo TEXT NOT NULL," +
                "contenido TEXT NOT NULL," +
                "ingredientes_usados TEXT NOT NULL," +
                "fecha_generacion TEXT NOT NULL," +
                "favorito INTEGER DEFAULT 0," +
                "FOREIGN KEY(id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_RECETAS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_INGREDIENTES);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USUARIOS);
        onCreate(db);
    }
}
