package com.tuchefpersonal.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.tuchefpersonal.app.modelo.Receta;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class RecetaDAO {

    private DatabaseHelper dbHelper;

    public RecetaDAO(Context context) {
        dbHelper = new DatabaseHelper(context);
    }

    public boolean guardar(int idUsuario, String titulo, String contenido, String ingredientesUsados) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id_usuario", idUsuario);
        values.put("titulo", titulo);
        values.put("contenido", contenido);
        values.put("ingredientes_usados", ingredientesUsados);
        values.put("fecha_generacion", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
        long result = db.insert(DatabaseHelper.TABLE_RECETAS, null, values);
        db.close();
        return result != -1;
    }

    public List<Receta> obtenerPorUsuario(int idUsuario) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        List<Receta> lista = new ArrayList<>();
        Cursor cursor = db.query(DatabaseHelper.TABLE_RECETAS,
                new String[]{"id", "id_usuario", "titulo", "contenido", "ingredientes_usados", "fecha_generacion"},
                "id_usuario=?", new String[]{String.valueOf(idUsuario)},
                null, null, "fecha_generacion DESC");
        while (cursor.moveToNext()) {
            lista.add(new Receta(
                    cursor.getInt(0),
                    cursor.getInt(1),
                    cursor.getString(2),
                    cursor.getString(3),
                    cursor.getString(4),
                    cursor.getString(5)
            ));
        }
        cursor.close();
        db.close();
        return lista;
    }
    public boolean marcarFavorito(int id, boolean favorito) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("favorito", favorito ? 1 : 0);
        int rows = db.update(DatabaseHelper.TABLE_RECETAS, values, "id=?", new String[]{String.valueOf(id)});
        db.close();
        return rows > 0;
    }

    public List<Receta> obtenerPorUsuario(int idUsuario, boolean soloFavoritos) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        List<Receta> lista = new ArrayList<>();
        String selection = "id_usuario=?";
        if (soloFavoritos) selection += " AND favorito=1";
        Cursor cursor = db.query(DatabaseHelper.TABLE_RECETAS,
                new String[]{"id", "id_usuario", "titulo", "contenido", "ingredientes_usados", "fecha_generacion", "favorito"},
                selection, new String[]{String.valueOf(idUsuario)},
                null, null, "fecha_generacion DESC");
        while (cursor.moveToNext()) {
            Receta r = new Receta(
                    cursor.getInt(0), cursor.getInt(1),
                    cursor.getString(2), cursor.getString(3),
                    cursor.getString(4), cursor.getString(5));
            r.setFavorito(cursor.getInt(6) == 1);
            lista.add(r);
        }
        cursor.close();
        db.close();
        return lista;
    }
    public boolean eliminar(int id) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        int rows = db.delete(DatabaseHelper.TABLE_RECETAS, "id=?", new String[]{String.valueOf(id)});
        db.close();
        return rows > 0;
    }
}
