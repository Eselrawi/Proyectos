package com.tuchefpersonal.app;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.tuchefpersonal.app.modelo.Usuario;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class UsuarioDAO {

    private DatabaseHelper dbHelper;

    public UsuarioDAO(Context context) {
        dbHelper = new DatabaseHelper(context);
    }

    public boolean registrar(String nombre, String email, String contrasena) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        try {
            ContentValues values = new ContentValues();
            values.put("nombre", nombre);
            values.put("email", email);
            values.put("contrasena", contrasena);
            values.put("fecha_registro", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(new Date()));
            long result = db.insert(DatabaseHelper.TABLE_USUARIOS, null, values);
            return result != -1;
        } catch (Exception e) {
            return false;
        } finally {
            db.close();
        }
    }

    public Usuario login(String email, String contrasena) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.query(DatabaseHelper.TABLE_USUARIOS,
                new String[]{"id", "nombre", "email"},
                "email=? AND contrasena=?",
                new String[]{email, contrasena},
                null, null, null);
        if (cursor.moveToFirst()) {
            Usuario u = new Usuario(
                    cursor.getInt(0),
                    cursor.getString(1),
                    cursor.getString(2)
            );
            cursor.close();
            db.close();
            return u;
        }
        cursor.close();
        db.close();
        return null;
    }

    public boolean emailExiste(String email) {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.query(DatabaseHelper.TABLE_USUARIOS,
                new String[]{"id"}, "email=?",
                new String[]{email}, null, null, null);
        boolean existe = cursor.moveToFirst();
        cursor.close();
        db.close();
        return existe;
    }
}
