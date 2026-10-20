package com.tuchefpersonal.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.tuchefpersonal.app.modelo.Ingrediente;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class IngredienteDAO {

    private DatabaseHelper dbHelper;

    public IngredienteDAO(Context context) {
        dbHelper = new DatabaseHelper(context);
    }

    public boolean añadir(int idUsuario, String nombre) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id_usuario", idUsuario);
        values.put("nombre", nombre);
        values.put("fecha_anadido", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
        long result = db.insert(DatabaseHelper.TABLE_INGREDIENTES, null, values);
        db.close();
        return result != -1;
    }

    public List<Ingrediente> obtenerPorUsuario(int idUsuario) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        List<Ingrediente> lista = new ArrayList<>();
        Cursor cursor = db.query(DatabaseHelper.TABLE_INGREDIENTES,
                new String[]{"id", "id_usuario", "nombre", "fecha_anadido"},
                "id_usuario=?", new String[]{String.valueOf(idUsuario)},
                null, null, "fecha_anadido DESC");
        while (cursor.moveToNext()) {
            lista.add(new Ingrediente(
                    cursor.getInt(0),
                    cursor.getInt(1),
                    cursor.getString(2),
                    cursor.getString(3)
            ));
        }
        cursor.close();
        db.close();
        return lista;
    }

    public boolean eliminar(int id) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        int rows = db.delete(DatabaseHelper.TABLE_INGREDIENTES, "id=?", new String[]{String.valueOf(id)});
        db.close();
        return rows > 0;
    }

    public boolean eliminarTodos(int idUsuario) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        int rows = db.delete(DatabaseHelper.TABLE_INGREDIENTES, "id_usuario=?", new String[]{String.valueOf(idUsuario)});
        db.close();
        return rows >= 0;
    }
}