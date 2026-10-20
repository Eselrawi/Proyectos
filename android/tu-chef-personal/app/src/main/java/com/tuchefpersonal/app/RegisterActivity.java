package com.tuchefpersonal.app;

import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputEditText;

public class RegisterActivity extends AppCompatActivity {

    private TextInputEditText etNombre, etEmail, etContrasena;
    private Button btnRegistro;
    private TextView tvIrLogin;
    private UsuarioDAO usuarioDAO;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        usuarioDAO = new UsuarioDAO(this);
        etNombre = findViewById(R.id.etNombre);
        etEmail = findViewById(R.id.etEmail);
        etContrasena = findViewById(R.id.etContrasena);
        btnRegistro = findViewById(R.id.btnRegistro);
        tvIrLogin = findViewById(R.id.tvIrLogin);

        btnRegistro.setOnClickListener(v -> hacerRegistro());
        tvIrLogin.setOnClickListener(v -> finish());
    }

    private void hacerRegistro() {
        String nombre = etNombre.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String contrasena = etContrasena.getText().toString().trim();

        if (nombre.isEmpty() || email.isEmpty() || contrasena.isEmpty()) {
            Toast.makeText(this, "Rellena todos los campos", Toast.LENGTH_SHORT).show();
            return;
        }

        if (contrasena.length() < 6) {
            Toast.makeText(this, "La contraseña debe tener al menos 6 caracteres", Toast.LENGTH_SHORT).show();
            return;
        }

        if (usuarioDAO.emailExiste(email)) {
            Toast.makeText(this, "Ese email ya está registrado", Toast.LENGTH_SHORT).show();
            return;
        }

        boolean ok = usuarioDAO.registrar(nombre, email, contrasena);
        if (ok) {
            Toast.makeText(this, "¡Cuenta creada! Ya puedes iniciar sesión.", Toast.LENGTH_LONG).show();
            finish();
        } else {
            Toast.makeText(this, "Error al crear la cuenta. Inténtalo de nuevo.", Toast.LENGTH_SHORT).show();
        }
    }
}